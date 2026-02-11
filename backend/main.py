import json
import os
import uuid
import re
import io
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated
from sentence_transformers import SentenceTransformer, util
from sqlalchemy import create_engine, Column, String, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- NEW IMPORTS FOR FILE PARSING ---
import pypdf
import docx
from PIL import Image
import pytesseract

# 1. Setup SQLite
DB_DIR = "referral_db"
os.makedirs(DB_DIR, exist_ok=True)
SQLALCHEMY_DATABASE_URL = f"sqlite:///./{DB_DIR}/referrals.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Referral(Base):
    __tablename__ = "referrals"
    id = Column(String, primary_key=True, index=True)
    employee_id = Column(String)
    candidate_name = Column(String)
    contact = Column(String)
    position = Column(String)
    skills = Column(JSON) 
    why_fit = Column(String)
    resume_path = Column(String)
    original_filename = Column(String)

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION ---
ALLOWED_FILE_TYPES = [
    "application/pdf", "application/msword", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png", "image/jpeg"
]
MAX_FILE_SIZE = 5 * 1024 * 1024 
SIMILARITY_THRESHOLD = 0.5 

# --- STORAGE SETUP ---
UPLOAD_DIR = "resume_file"
DATA_DIR = "referral_data" 
DATA_FILE = os.path.join(DATA_DIR, "referrals.json") 

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# --- LOAD AI MODEL ---
print("Loading AI Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("AI Model Loaded!")

# --- HELPERS ---
def load_json(filename):
    if not os.path.exists(filename):
        # Updated to return dict {} for non_negotiable file if missing, else list []
        if any(x in filename for x in ["mandatory", "compulsory", "non_negotiable"]):
            return {}
        return []
    with open(filename, "r") as f:
        return json.load(f)

ROLES_DB = load_json("roles.json")
SKILLS_DB = load_json("skills.json")
ROLE_SKILLS_DB = load_json("skills_mandatory.json") 
NON_NEGOTIABLE_DB = load_json("non_negotiable.json") # Replaced COMPULSORY_DB

def sanitize_filename(text):
    return re.sub(r'[^a-zA-Z0-9]', '_', text)

def save_to_json_file(data):
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w") as f:
            json.dump([], f)
    with open(DATA_FILE, "r+") as f:
        try:
            file_data = json.load(f)
        except json.JSONDecodeError:
            file_data = [] 
        file_data.append(data)
        f.seek(0)
        json.dump(file_data, f, indent=4)

# --- RESUME PARSING LOGIC ---
def extract_text_from_file(file_bytes, filename):
    """Identifies file type and extracts text accordingly."""
    ext = filename.split('.')[-1].lower()
    text = ""
    try:
        if ext == 'pdf':
            pdf = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted: text += extracted + "\n"
        
        elif ext == 'docx':
            doc = docx.Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                text += para.text + "\n"
        
        elif ext in ['png', 'jpg', 'jpeg']:
            try:
                image = Image.open(io.BytesIO(file_bytes))
                text = pytesseract.image_to_string(image)
            except Exception:
                print("OCR Failed. Make sure Tesseract is installed.")
    except Exception as e:
        print(f"Extraction Error: {e}")
        
    return text

def clean_text(text):
    """Removes newlines and extra spaces for better AI comparison"""
    text = text.replace('\n', ' ')
    return re.sub(r'\s+', ' ', text).strip()

def extract_about_section(text):
    text_lower = text.lower()
    
    headers = ["professional objective", "professional summary", "objective", "summary", "about me", "profile", "about"]
    
    stop_headers = [
        "experience", "work history", "employment", 
        "education", "academic", 
        "skills", "technical skills", 
        "projects", "certifications", 
        "languages", "interests", "hobbies",
        "contact", "declaration"
    ]
    
    start_idx = -1
    best_header_len = 0
    
    for h in headers:
        idx = text_lower.find(h)
        if idx != -1:
            if start_idx == -1 or idx < start_idx:
                start_idx = idx
                best_header_len = len(h)
    
    if start_idx != -1:
        content_start = start_idx + best_header_len
        relevant_text = text[content_start:]
        
        relevant_lower = relevant_text.lower()
        end_idx = len(relevant_text)
        
        for stop in stop_headers:
            s_idx = relevant_lower.find(stop)
            if s_idx != -1 and s_idx < end_idx:
                end_idx = s_idx
                
        extracted = relevant_text[:end_idx].strip()
        if len(extracted) < 10:
             return clean_text(text[:800])
             
        return clean_text(extracted)
    
    return clean_text(text[:800])

@app.get("/form-options")
def get_form_options():
    return { "roles": ROLES_DB, "skills": SKILLS_DB, "role_skills": ROLE_SKILLS_DB }

@app.post("/submit")
async def submit_referral(
    employee_id: Annotated[str, Form(min_length=1)],
    candidate_name: Annotated[str, Form(min_length=1)],
    candidate_contact: Annotated[str, Form(min_length=1)],
    position: Annotated[str, Form(min_length=1)], 
    why_fit: Annotated[str, Form(min_length=1)],
    skills: Annotated[str, Form()], 
    resume: Annotated[UploadFile, File()]
):
    # 1. READ FILE
    file_content = await resume.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large.")

    # 2. VALIDATION: SKILLS
    submitted_skills = [s.strip() for s in skills.split(",") if s.strip()]
    
    # --- UPDATED LOGIC: Non-Negotiable Skills Check ---
    if position in NON_NEGOTIABLE_DB:
        required_skills = set(NON_NEGOTIABLE_DB[position])
        submitted_skills_set = set(submitted_skills)
        
        # Check if ALL required skills are present in the submitted skills
        if not required_skills.issubset(submitted_skills_set):
            # Calculate which specific skills are missing for the error message
            missing = required_skills - submitted_skills_set
            missing_str = ", ".join(missing)
            raise HTTPException(
                status_code=400, 
                detail=f"Skills listed are not adequate for the role. Missing non-negotiable skills: {missing_str}"
            )
            
    # 3. VALIDATION: AI SIMILARITY CHECK
    extracted_text = extract_text_from_file(file_content, resume.filename)
    about_section = extract_about_section(extracted_text)
    
    print(f"\n--- DEBUG: Extracted About Section ---\n{about_section[:200]}...\n--------------------------------------")
    
    if about_section and len(about_section) > 20:
        emb1 = model.encode(why_fit)
        emb2 = model.encode(about_section)
        similarity_score = util.cos_sim(emb1, emb2).item()
        
        print(f"--- DEBUG: Similarity Score: {similarity_score} ---")
        
        if similarity_score > SIMILARITY_THRESHOLD:
            raise HTTPException(
                status_code=400, 
                detail="The 'Why Good Fit' section is too similar to the resume's profile/about section. Please write a unique endorsement."
            )

    if resume.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file format.")

    # 4. SAVE FILE
    file_extension = resume.filename.split(".")[-1] if "." in resume.filename else "file"
    safe_id = sanitize_filename(employee_id)
    safe_name = sanitize_filename(candidate_name)
    safe_role = sanitize_filename(position)
    
    new_filename = f"{safe_id}_{safe_name}_{safe_role}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, new_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    # 5. PREPARE DATA DICT
    unique_id = str(uuid.uuid4())
    
    referral_dict = {
        "id": unique_id,
        "employee_id": employee_id,
        "candidate_name": candidate_name,
        "contact": candidate_contact,
        "position": position,
        "skills": submitted_skills,
        "why_fit": why_fit,
        "resume_path": file_path, 
        "original_filename": resume.filename,
    }

    # 6. SAVE TO JSON
    save_to_json_file(referral_dict)

    # 7. SAVE TO DATABASE
    db = SessionLocal()
    try:
        new_referral = Referral(
            id=referral_dict["id"],
            employee_id=referral_dict["employee_id"],
            candidate_name=referral_dict["candidate_name"],
            contact=referral_dict["contact"],
            position=referral_dict["position"],
            skills=referral_dict["skills"],
            why_fit=referral_dict["why_fit"],
            resume_path=referral_dict["resume_path"],
            original_filename=referral_dict["original_filename"],
        )
        db.add(new_referral)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"DB Error: {e}")
    finally:
        db.close()

    return {"status": "success", "message": "Referral submitted successfully!"}