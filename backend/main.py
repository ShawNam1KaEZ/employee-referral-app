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
import pypdf
import docx
# REMOVED: import pytesseract
# REMOVED: from PIL import Image (Not needed if we skip OCR)

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
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# CONFIG
ALLOWED_FILE_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg"]
MAX_FILE_SIZE = 5 * 1024 * 1024 
SIMILARITY_THRESHOLD = 0.5 
UPLOAD_DIR = "resume_file"
DATA_DIR = "referral_data" 
DATA_FILE = os.path.join(DATA_DIR, "referrals.json") 

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# LOAD AI MODEL
model = None  # We start with nothing so the server boots fast

# HELPERS
def load_json(filename):
    if not os.path.exists(filename):
        return {} if "non_negotiable" in filename else []
    with open(filename, "r") as f:
        return json.load(f)

ROLES_DB = load_json("roles.json")
SKILLS_DB = load_json("skills.json")
ROLE_SKILLS_DB = load_json("skills_mandatory.json") 
NON_NEGOTIABLE_DB = load_json("non_negotiable.json")

def sanitize_filename(text):
    return re.sub(r'[^a-zA-Z0-9]', '_', text)

def save_to_json_file(data):
    file_data = []
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            try: file_data = json.load(f)
            except: file_data = []
    file_data.append(data)
    with open(DATA_FILE, "w") as f:
        json.dump(file_data, f, indent=4)

def extract_text_from_file(file_bytes, filename):
    ext = filename.split('.')[-1].lower()
    text = ""
    try:
        if ext == 'pdf':
            pdf = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in pdf.pages:
                text += (page.extract_text() or "") + "\n"
        elif ext == 'docx':
            doc = docx.Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                text += para.text + "\n"
        elif ext in ['png', 'jpg', 'jpeg']:
            # MODIFIED: Skipped OCR to avoid Tesseract dependency on Render
            print("Image uploaded: OCR text extraction skipped for optimization.")
            text = "" 
    except Exception as e: print(f"Extraction Error: {e}")
    return text

def extract_about_section(text):
    text_lower = text.lower()
    headers = ["professional summary", "objective", "summary", "about me", "profile"]
    stop_headers = ["experience", "work history", "education", "skills", "projects"]
    
    start_idx = -1
    for h in headers:
        idx = text_lower.find(h)
        if idx != -1:
            start_idx = idx + len(h)
            break
    
    if start_idx != -1:
        relevant_text = text[start_idx:]
        end_idx = len(relevant_text)
        for stop in stop_headers:
            s_idx = relevant_text.lower().find(stop)
            if s_idx != -1: end_idx = min(end_idx, s_idx)
        return relevant_text[:end_idx].strip()
    return text[:800].strip()

@app.get("/form-options")
def get_form_options():
    return { "roles": ROLES_DB, "skills": SKILLS_DB, "role_skills": ROLE_SKILLS_DB }

@app.post("/submit")
async def submit_referral(
    employee_id: Annotated[str, Form()],
    candidate_name: Annotated[str, Form()],
    candidate_contact: Annotated[str, Form()],
    position: Annotated[str, Form()], 
    why_fit: Annotated[str, Form()],
    skills: Annotated[str, Form()], 
    resume: Annotated[UploadFile, File()]
):

    global model
    if model is None:
        print("Loading AI Model for the first time...")
        model = SentenceTransformer('all-MiniLM-L6-v2')

    file_content = await resume.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large.")

    # 1. Non-Negotiable Skills Check
    submitted_skills = [s.strip() for s in skills.split(",") if s.strip()]
    if position in NON_NEGOTIABLE_DB:
        required = set(NON_NEGOTIABLE_DB[position])
        if not required.issubset(set(submitted_skills)):
            missing = ", ".join(required - set(submitted_skills))
            raise HTTPException(status_code=400, detail=f"Missing non-negotiable skills: {missing}")
            
    # 2. AI Similarity Check
    extracted = extract_text_from_file(file_content, resume.filename)
    about = extract_about_section(extracted)
    
    # Only run AI check if we actually extracted text (PDF/Docx)
    if about and len(about) > 20:
        score = util.cos_sim(model.encode(why_fit), model.encode(about)).item()
        if score > SIMILARITY_THRESHOLD:
            raise HTTPException(status_code=400, detail="Endorsement is too similar to the resume. Please write a unique one.")

    # 3. Save File & DB
    safe_name = f"{sanitize_filename(employee_id)}_{sanitize_filename(candidate_name)}.{resume.filename.split('.')[-1]}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f: f.write(file_content)

    ref_data = {
        "id": str(uuid.uuid4()), "employee_id": employee_id, "candidate_name": candidate_name,
        "contact": candidate_contact, "position": position, "skills": submitted_skills,
        "why_fit": why_fit, "resume_path": file_path, "original_filename": resume.filename
    }

    save_to_json_file(ref_data)
    db = SessionLocal()
    try:
        db.add(Referral(**ref_data))
        db.commit()
    finally: db.close()

    return {"status": "success", "message": "Referral submitted successfully!"}