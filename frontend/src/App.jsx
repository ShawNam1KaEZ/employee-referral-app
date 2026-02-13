// frontend/src/App.jsx
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
// --- ADDED LOGO IMPORT ---
import navsanLogo from './assets/NAVSANlogo.png' 

const MAX_FILE_SIZE = 5 * 1024 * 1024; 

// --- STATIC DATA FROM NAVSAN CAREERS ---
const STATIC_ROLES = [
  {
    id: "sr_data_mis_analyst",
    label: "Senior Data & MIS Analyst",
    description: "A highly skilled Data & MIS Analyst responsible for managing, transforming, and analysing large volumes of data across Excel, MS Access, SQL databases, and other enterprise systems. This role will serve as a critical link between operational data and executive decision‑making, delivering accurate, timely, and actionable insights to C‑level leadership on a daily basis.",
    posted_date: "2026-02-05",
    experience: "10+ years experience",
    is_new: true
  },
  {
    id: "sr_network_admin",
    label: "Network Administrator",
    description: "We are seeking a highly experienced Senior Network Administrator with a strong focus on cloud-based infrastructure, particularly Microsoft Azure. The ideal candidate will bring 10+ years of enterprise network administration experience, with at least 3 years of hands-on expertise in Palo Alto firewalls and application-layer security. This role is pivotal in supporting our cloud-first strategy and leading network transition/migration projects, ensuring secure, scalable, and high-performing connectivity across a global footprint. Experience with Palo Alto's extended security suite, including GlobalProtect, Prisma Access, Panorama, Cortex Data Lake, and DLP, is essential.",
    posted_date: "2026-02-05",
    experience: "10 years experience",
    is_new: true
  },
  {
    id: "ar_cash_app_specialist",
    label: "AR Cash Application Specialist",
    description: "Under the direction of the Cash Application Supervisor, the Cash Application Specialist will be responsible for accurately reconciling and posting daily customer payments (EFT/ACH, wires and checks) to Accounts Receivable (AR), in compliance with Company policies, GAAP and SOX controls. Key skills include a high attention to detail and analysis with a strong problem-solving aptitude.",
    posted_date: "2026-02-05",
    experience: "5+ years experience",
    is_new: true
  },
  {
    id: "ai_developer",
    label: "AI Developer",
    description: "We are seeking an experienced AI Developer to join our team and contribute to enterprise-level AI solutions. The ideal candidate will be a self-driven professional who can independently manage projects, collaborate effectively with IT partners, and drive technical conversations with internal teams and stakeholders. This role requires a strong blend of technical expertise, communication skills, and the ability to translate business requirements into AI-powered solutions.",
    posted_date: "2026-02-04",
    experience: "10+ years in software development, with at least 3+ years in AI/ML experience",
    is_new: true
  },
  {
    id: "comm_content_lead",
    label: "Communication and Content Lead",
    description: "Communication and Content Lead is responsible for designing and delivering clear, engaging, and high-quality internal communications and content across enterprise-wide initiatives. This role partners with leadership and program teams to translate complex work into compelling narratives using presentations, digital platforms, video, and targeted communications.",
    posted_date: "2026-01-30",
    experience: "6–10 years experience",
    is_new: true
  },
  {
    id: "crm_erp_support_specialist",
    label: "CRM & ERP Support Specialist",
    description: "We are seeking a CRM & ERP Support Specialist to provide functional and light technical support across our core business systems. This role is not a developer position and not traditional IT or O365 support. The focus is on system configuration support, troubleshooting, user assistance, and basic workflow analysis. The ideal candidate will work closely with operations and business teams, acting as a bridge between technical systems and end users by translating complex concepts into clear, practical guidance.",
    posted_date: "2026-01-23",
    experience: "5–10 years experience",
    is_new: true
  },
  {
    id: "data_migration_lead",
    label: "Data Migration Expert/Lead",
    description: "This role will responsible for planning, executing, and validating the migration of data from legacy systems to modern platforms. This role ensures data integrity, quality, and consistency throughout the migration lifecycle while minimizing disruption to business operations. The expert will work closely with business stakeholders, project teams, data architects, and technical teams to deliver seamless, accurate, and secure data transitions.",
    posted_date: "2026-01-22",
    experience: "5 Years experience",
    is_new: true
  },
  {
    id: "lead_analyst_ap_ar",
    label: "Lead Analyst - AP & AR",
    description: "The Lead Analyst – AP & AR will oversee end-to-end accounts payable and accounts receivable operations, ensuring accuracy, compliance, and timely processing of payments and collections. The role requires strong analytical skills, team leadership, stakeholder management, and a continuous improvement mindset to optimize cash flow and financial controls.",
    posted_date: "2026-01-09",
    experience: "8 - 12 Years experience",
    is_new: true
  },
  {
    id: "gl_accountant_uk",
    label: "General Ledger Accountant (UK)",
    description: "We are seeking a highly experienced and detail-oriented GL Accountant to join our finance team. The ideal candidate brings minimum of 7 years of hands - on experience into accounting with proven expertise in Advanced Excel.",
    posted_date: "2026-01-08",
    experience: "7 Years experience",
    is_new: true
  },
  {
    id: "director_hr",
    label: "Director of Human Resources",
    description: "The Director of Human Resources will own the end-to-end HR function and play a critical leadership role in scaling the organization globally, with a primary focus on India-based talent and recruiting operations. The company has a growing recruiting and HR function, and this role will lead and scale talent acquisition while building strong, end-to-end HR practices. This is a hands-on, builder role for someone who has led HR through rapid growth and understands how to balance speed with structure.",
    posted_date: "2025-12-30",
    experience: "12+ years experience",
    is_new: false
  },
  {
    id: "hr_tech_lead_recruiting",
    label: "HR Technical Lead – IT & Technology Recruiting",
    description: "We are seeking an HR Technical Lead – IT & Technology Recruiting to lead and scale our technology hiring efforts. This is a hands-on, player–coach role responsible for both managing technical recruiters and personally closing IT and technology-focused roles. This role requires deep experience hiring for IT, engineering, data, automation, and digital roles, and the ability to balance execution with leadership in a fast-growing environment.",
    posted_date: "2025-12-30",
    experience: "6-10 years experience",
    is_new: false
  },
  {
    id: "sr_transformational_consultant",
    label: "SR Transformational Consultant",
    description: "The Senior Transformation Consultant is a hands-on delivery Lead responsible for independently driving complex transformation initiatives across regions and functions. This role reports into the Transformation Director and operates as the primary execution owner for initiatives once direction and priorities are set. The role is expected to lead from day one with minimal ramp-up and act as a coach and quality bar for Consultants and Senior PI Analysts.",
    posted_date: "2025-12-30",
    experience: "10-15 years experience",
    is_new: false
  },
  {
    id: "director_business_transformation",
    label: "Director - Business Transformation",
    description: "The Director of Business Transformation leads cross-regional initiatives that improve operational performance, financial outcomes, and process consistency. The role partners with senior leadership to set priorities, create roadmaps, and ensure adoption of new processes and operating models.",
    posted_date: "2025-12-17",
    experience: "12 - 18 Years experience",
    is_new: false
  },
  {
    id: "sr_tech_specialist_user_support",
    label: "Senior Technical Specialist – User Support",
    description: "We are looking for a capable and proactive Senior Technical Specialist to join our User Support team. This role provides advanced troubleshooting, thorough diagnostic checks, and high-quality support for end-users across the organisation. Acting as an escalation point for the Service Desk, the position requires strong technical understanding across cloud services (especially Azure), core systems, user environment technologies, and basic network/security concepts such as NGFW. The role does not include system or network configuration, but requires the ability to perform in-depth checks, gather diagnostic information, and prepare clear escalations for L3 teams. The Senior Technical Specialist will also mentor junior staff and support continuous improvement within the team.",
    posted_date: "2025-12-05",
    experience: "4–6+ years in IT User Support experience",
    is_new: false
  },
  {
    id: "sr_powerapps_dev",
    label: "Senior PowerApps Developer",
    description: "We are seeking a skilled Senior PowerApps Developer responsible for designing, developing, and managing applications on the Microsoft Power Apps platform, optimizing performance and ensuring successful deployment.",
    posted_date: "2025-12-05",
    experience: "5+ Years experience",
    is_new: false
  },
  {
    id: "powerapps_support_role",
    label: "PowerApps Support Role",
    description: "We are looking for a skilled PowerApps Support Engineer to provide technical support, troubleshooting, and maintenance for Microsoft Power Platform solutions. The role includes on-call support during non-business hours and weekends.",
    posted_date: "2025-12-05",
    experience: "2-3 Years experience",
    is_new: false
  },
  {
    id: "sr_power_automate_dev",
    label: "Senior Power Automate Developer",
    description: "We are seeking a highly skilled Senior Power Automate Developer to design, develop, and implement enterprise-grade automation solutions. You will collaborate with stakeholders to streamline complex business processes, integrate with Microsoft 365 and third-party systems, and mentor junior team members.",
    posted_date: "2025-12-05",
    experience: "5-7 Years experience",
    is_new: false
  },
  {
    id: "sap_change_release_specialist",
    label: "SAP Change and Release Specialist",
    description: "This position is for a Technology Specialist and great communicator, who understands SAP technology and system change processes. Responsible for managing all aspects of SAP Environment, change and release management. The goal of this area is to safeguard our SaaS SAP landscape while facilitating project rollouts and changing deployments. Change Release specialist will oversee the planning, coordination, and governance of SAP S/4HANA Cloud (Public Edition) release and environment activities. This role focuses on managing quarterly SAP cloud releases, regression testing, migration configuration, and ensuring business readiness, in alignment with SAP's standard public cloud delivery model and the organization's change management framework.",
    posted_date: "2025-10-28",
    experience: "6 Years experience",
    is_new: false
  }
];

function App() {
  // --- STATE ---
  const [view, setView] = useState('roles'); 
  const [roles, setRoles] = useState(STATIC_ROLES) 
  const [allSkills, setAllSkills] = useState([])
  const [roleSkillsMap, setRoleSkillsMap] = useState({}) 
  const [loading, setLoading] = useState(true)
  // NEW: State for submission loading status
  const [submitting, setSubmitting] = useState(false)

  // Search States
  const [roleSearch, setRoleSearch] = useState("") 
  const [skillSearch, setSkillSearch] = useState("")
  const [showSkillDropdown, setShowSkillDropdown] = useState(false) 
  
  // Refs
  const skillWrapperRef = useRef(null) 
  const skillDropdownRef = useRef(null) 

  const [formData, setFormData] = useState({
    employee_id: '',
    candidate_name: '',
    candidate_contact: '',
    position: '',
    positionLabel: '', 
    why_fit: '',
  })
  
  const [selectedSkills, setSelectedSkills] = useState([]) 
  const [resume, setResume] = useState(null)
  const [errors, setErrors] = useState({}) 
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' }) 

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/form-options`)
        setAllSkills(response.data.skills)
        setRoleSkillsMap(response.data.role_skills) 
        setLoading(false)
      } catch (error) {
        showToast("Error loading data from server.", "error")
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // --- AUTO SCROLL ---
  useEffect(() => {
    if (showSkillDropdown && skillDropdownRef.current) {
      setTimeout(() => {
        skillDropdownRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
    }
  }, [showSkillDropdown])

  // --- CLICK OUTSIDE ---
  useEffect(() => {
    const handleClick = (e) => {
      if (skillWrapperRef.current && !skillWrapperRef.current.contains(e.target)) {
        setShowSkillDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // --- LOGIC HELPER ---
  const showToast = (msg, type) => {
    setToast({ show: true, message: msg, type })
    setTimeout(() => setToast(prev => ({...prev, show: false})), 5000)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === "employee_id" && !/^\d*$/.test(value)) return;
    setFormData({ ...formData, [name]: value })
    if (errors[name]) setErrors({...errors, [name]: null})
  }

  const toggleSkill = (id) => {
    setSelectedSkills(prev => {
        if (prev.includes(id)) return prev.filter(x => x !== id)
        return [...prev, id]
    })
    if (errors.skills) setErrors({...errors, skills: null})
  }

  // Handle Role Selection
  const selectRole = (role) => {
    setFormData({ ...formData, position: role.id, positionLabel: role.label });
    setSelectedSkills([]); 
    setView('form'); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > MAX_FILE_SIZE) { 
        showToast("File too large (Max 5MB)", "error");
        setErrors({...errors, resume: "File too large (Max 5MB)"}); 
        return; 
      }
      setResume(file)
      if(errors.resume) setErrors({...errors, resume: null})
    }
  }

  // --- VALIDATION ---
  const validateStep1 = () => {
    const errs = {}
    let valid = true
    if(!formData.employee_id) { errs.employee_id = "Required"; valid = false }
    if(!formData.candidate_name) { errs.candidate_name = "Required"; valid = false }
    else if (!/^[a-zA-Z\s]+$/.test(formData.candidate_name)) { errs.candidate_name = "Letters only please"; valid = false }
    if(!formData.candidate_contact) { errs.candidate_contact = "Required"; valid = false }
    else if (!/\S+@\S+\.\S+/.test(formData.candidate_contact)) { errs.candidate_contact = "Invalid email"; valid = false }
    if(!formData.position) { errs.position = "Required"; valid = false }
    return { valid, errs }
  }

  const validateStep2 = () => {
    const errs = {}
    let valid = true
    if(selectedSkills.length === 0) { errs.skills = "Select at least one skill"; valid = false }
    if(!formData.why_fit.trim()) { errs.why_fit = "Required"; valid = false }
    return { valid, errs }
  }

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    const v1 = validateStep1();
    const v2 = validateStep2();
    const allErrors = { ...v1.errs, ...v2.errs };
    if (!v1.valid || !v2.valid || !resume) {
      showToast("Please fix the highlighted errors.", "error")
      if(!resume) allErrors.resume = "Please upload a resume";
      setErrors(allErrors);
      return
    }

    setSubmitting(true) // START LOADING

    const data = new FormData()
    data.append('employee_id', formData.employee_id);
    data.append('candidate_name', formData.candidate_name);
    data.append('candidate_contact', formData.candidate_contact);
    data.append('position', formData.position);
    data.append('why_fit', formData.why_fit);
    data.append('skills', selectedSkills.join(','))
    data.append('resume', resume)

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/submit`, data)
      showToast(res.data.message, "success")
      setFormData({ employee_id: '', candidate_name: '', candidate_contact: '', position: '', positionLabel: '', why_fit: '' })
      setSelectedSkills([])
      setResume(null)
      setErrors({})
      setView('roles');
      window.scrollTo(0, 0);
      setSubmitting(false) // STOP LOADING ON SUCCESS
    } catch (err) {
      setSubmitting(false) // STOP LOADING ON ERROR
      const detail = err.response?.data?.detail
      let errorMsg = "An error occurred";
      const newErrors = {};
      if (typeof detail === "string") {
        errorMsg = detail;
        if(detail.includes("adequate") || detail.includes("Skills")) newErrors.skills = detail; 
        if(detail.includes("File")) newErrors.resume = detail;
        if(detail.includes("similar")) newErrors.why_fit = detail;
      }
      setErrors(newErrors); 
      showToast(errorMsg, "error"); 
    }
  }

  // --- STYLES ---
  const styles = {
    // Page Layout
    page: { 
        minHeight: '100vh', 
        backgroundColor: '#f0f2f5', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        fontFamily: '"Segoe UI", sans-serif', 
        color: '#333' 
    },
    
    // Header Bar
    headerBar: {
        width: '100%',
        backgroundColor: '#003366', 
        padding: '20px 0',
        marginBottom: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'center'
    },
    brand: {
        fontSize: '1.8rem',
        fontWeight: '700',
        color: '#ffffff', 
        width: '100%',
        maxWidth: '1000px', 
        padding: '0 20px',
        letterSpacing: '0.5px',
        // --- ADDED FLEXBOX FOR LOGO ALIGNMENT ---
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    },

    // Main Card
    card: { 
        backgroundColor: '#ffffff', 
        width: '100%', 
        maxWidth: '1000px', 
        padding: '40px', 
        borderRadius: '12px', 
        boxShadow: '0 5px 20px rgba(0,0,0,0.08)', 
        border: '1px solid #e9ecef', 
        borderTop: '5px solid #0056b3', 
        marginBottom:'40px' 
    },
    
    // Internal Headings
    header: { textAlign: 'center', color: '#212529', marginBottom: '30px', fontSize: '1.75rem', fontWeight: '700' },
    section: { marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #e9ecef' },
    sectionTitle: { fontSize: '1.5rem', color: '#3f4144', marginBottom: '20px', fontWeight: '600', borderLeft: '4px solid #0152a8', paddingLeft: '10px' },
    subHeading: { fontSize: '1.2rem', color: '#495057', marginBottom: '20px', marginTop: '30px', fontWeight: '600', borderLeft: '4px solid #0056b3', paddingLeft: '10px' },
    separator: { border: '0', borderTop: '1px solid #e9ecef', margin: '30px 0 20px 0' },
    
    // Form Fields
    field: { marginBottom: '35px' },
    label: { display: 'block', fontWeight: '500', marginBottom: '8px', color: '#2b2d30', fontSize: '1.12rem' },
    input: (error) => ({ width: '100%', padding: '12px', fontSize: '1rem', borderRadius: '4px', border: error ? '1px solid #dc3545' : '1px solid #ced4da', outline: 'none', backgroundColor: '#ffffff', color: '#212529', boxSizing: 'border-box', transition: 'border-color 0.2s' }),
    errorMsg: { color: '#dc3545', fontSize: '0.85rem', marginTop: '5px', display: 'block' },
    
    // NEW STYLES FOR TAG INPUT WRAPPER
    skillsWrapper: (error) => ({
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start', // Changed from center to handle multi-line better
        gap: '8px',
        width: '100%',
        padding: '6px',
        borderRadius: '4px',
        border: error ? '1px solid #dc3545' : '1px solid #ced4da',
        backgroundColor: '#ffffff',
        minHeight: '50px',
        boxSizing: 'border-box',
        cursor: 'text',
        transition: 'border-color 0.2s'
    }),
    ghostInput: {
        border: 'none',
        outline: 'none',
        fontSize: '1rem',
        width: '100%', // Changed from flex: 1 to force new line
        color: '#212529',
        backgroundColor: 'transparent',
        padding: '6px 2px', // Adjusted padding
        marginTop: '2px'
    },

    // Buttons
    button: { backgroundColor: '#0056b3', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', fontWeight: '500', marginTop: '10px' },
    submitBtn: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '14px 24px', borderRadius: '6px', fontSize: '1.1rem', cursor: 'pointer', fontWeight: '600', width: '100%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
    
    // Dropdowns & Tags
    dropdown: { marginTop: '5px', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #ced4da', borderRadius: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', position: 'absolute', width: '100%', zIndex: 10 },
    dropdownItem: { padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #f1f3f5', color: '#212529' },
    skillContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' },
    skillChip: { padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer', border: '1px solid #0056b3', backgroundColor: '#d5e5fabb', color: '#0056b3', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', whiteSpace: 'nowrap' },
    toast: (type) => ({ position: 'fixed', bottom: '20px', right: '20px', padding: '15px 25px', backgroundColor: type === 'error' ? '#dc3545' : '#28a745', color: 'white', borderRadius: '6px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }),
    
    // ROLE GRID STYLES
    roleGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginTop: '20px' },
    roleCard: { borderBottom: '1px solid #f0f0f0', padding: '25px 0', backgroundColor: '#fff', position:'relative' },
    roleHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
    roleTitleGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
    roleTitle: { fontSize: '1.25rem', color: '#0056b3', fontWeight: '600', margin: 0 },
    newBadge: { backgroundColor: '#e6f4ea', color: '#1e7e34', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', letterSpacing:'0.5px' },
    postedDate: { fontSize: '0.85rem', color: '#6c757d', whiteSpace: 'nowrap' }, 
    roleDesc: { fontSize: '0.95rem', color: '#5f6368', marginBottom: '20px', lineHeight: '1.6', maxWidth: '95%' },
    roleFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    experience: { fontSize: '0.9rem', color: '#6c757d', fontWeight:'500' },
    // Updated Button Style
    knowMoreBtn: { 
        color: '#0056b3', 
        fontWeight: '600', 
        fontSize: '0.95rem', 
        textDecoration: 'none', 
        cursor:'pointer', 
        background:'none', 
        border:'1px solid #0056b3', // Outline style
        padding: '8px 16px',
        borderRadius: '4px',
        transition: 'all 0.2s'
    },
    backBtn: { padding: '8px 16px', fontSize: '0.9rem', backgroundColor: '#e9ecef', color: '#333', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px', fontWeight: '500' }
  }

  // --- FILTERED LISTS ---
  const availableSkillIds = roleSkillsMap[formData.position] || []
  const relevantSkills = allSkills.filter(s => availableSkillIds.includes(s.id))
  const filteredDropdownSkills = relevantSkills.filter(s => s.label.toLowerCase().includes(skillSearch.toLowerCase()) && !selectedSkills.includes(s.id))
  const selectedSkillObjects = allSkills.filter(s => selectedSkills.includes(s.id))
  const filteredRoles = roles.filter(r => r.label.toLowerCase().includes(roleSearch.toLowerCase()))

  if(loading) return <div style={{textAlign:'center', marginTop:'50px', color:'#555'}}>Loading Application...</div>

  return (
    <div style={styles.page}>
      
      {/* CSS For Placeholders - Added Here */}
      <style>{`
        ::placeholder {
          color: #6c757d !important;
          opacity: 1; 
        }
        :-ms-input-placeholder { 
          color: #6c757d !important;
        }
        ::-ms-input-placeholder { 
          color: #6c757d !important;
        }
      `}</style>

      {/* GLOBAL HEADER BAR */}
      <div style={styles.headerBar}>
        <div style={styles.brand}>
            {/* --- ADDED LOGO IMAGE --- */}
            <img src={navsanLogo} alt="Navsan Logo" style={{height: '45px', width: 'auto'}} />
            Employee Referrals
        </div>
      </div>

      {/* --- VIEW 1: ROLE SELECTION --- */}
      {view === 'roles' && (
        <div style={styles.card}>
            <h1 style={{...styles.header, textAlign:'left', fontSize:'1.5rem', marginBottom:'10px', color: '#333'}}>Current Openings</h1>
            <div style={{marginBottom:'30px'}}>
                <input 
                  placeholder="Search for a role..." 
                  value={roleSearch} 
                  onChange={(e) => setRoleSearch(e.target.value)} 
                  style={{
                      padding:'12px 15px', 
                      width:'100%', 
                      maxWidth:'400px', 
                      borderRadius:'6px', 
                      border:'1px solid #ced4da', 
                      outline:'none',
                      fontSize: '1rem',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)' 
                  }} 
                />
            </div>
            
            <div style={styles.roleGrid}>
                {filteredRoles.map(role => (
                    <div key={role.id} style={styles.roleCard}>
                        <div style={styles.roleHeaderRow}>
                            <div style={styles.roleTitleGroup}>
                                <h3 style={styles.roleTitle}>{role.label}</h3>
                                {role.is_new && <span style={styles.newBadge}>NEW</span>}
                            </div>
                            {role.posted_date && <div style={{display:'flex', alignItems:'center', gap:'5px', color:'#999', fontSize:'0.85rem'}}>
                                <span>📅</span> Posted: {role.posted_date}
                            </div>}
                        </div>
                        
                        <p style={styles.roleDesc}>{role.description}</p>
                        
                        <div style={styles.roleFooter}>
                            <div style={styles.experience}>{role.experience || "Experience not specified"}</div>
                            <button 
                                style={styles.knowMoreBtn} 
                                onClick={() => selectRole(role)}
                                onMouseEnter={(e) => {e.target.style.backgroundColor='#0056b3'; e.target.style.color='#fff'}}
                                onMouseLeave={(e) => {e.target.style.backgroundColor='transparent'; e.target.style.color='#0056b3'}}
                            >
                                Refer Someone →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {filteredRoles.length === 0 && <div style={{textAlign:'center', color:'#999', marginTop:'40px'}}>No roles found matching "{roleSearch}"</div>}
        </div>
      )}

      {/* --- VIEW 2: APPLICATION FORM --- */}
      {view === 'form' && (
        <div style={styles.card}>
            <div style={{marginBottom:'20px'}}>
                <button onClick={() => setView('roles')} style={{background:'none', border:'none', color:'#6c757d', cursor:'pointer', fontSize:'0.95rem', display:'flex', alignItems:'center', gap:'5px', fontWeight:'500'}}>
                    <span>←</span> Back to Jobs
                </button>
            </div>
            <h1 style={styles.header}>Employee Referral Application</h1>

            <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Referral Details</h2>
            <div style={styles.field}>
                <label style={styles.label}>ID</label>
                <input name="employee_id" placeholder="Your Employee ID" type="text" value={formData.employee_id} onChange={handleChange} autoComplete="off" style={styles.input(errors.employee_id)} />
                {errors.employee_id && <div style={styles.errorMsg}>{errors.employee_id}</div>}
            </div>
            <div style={styles.field}>
                <label style={styles.label}>Candidate Name</label>
                <input name="candidate_name" placeholder="Full Name" value={formData.candidate_name} onChange={handleChange} autoComplete="off" style={styles.input(errors.candidate_name)} />
                {errors.candidate_name && <div style={styles.errorMsg}>{errors.candidate_name}</div>}
            </div>
            <div style={styles.field}>
                <label style={styles.label}>Candidate Email</label>
                <input name="candidate_contact" placeholder="email@domain.com" value={formData.candidate_contact} onChange={handleChange} autoComplete="off" style={styles.input(errors.candidate_contact)} />
                {errors.candidate_contact && <div style={styles.errorMsg}>{errors.candidate_contact}</div>}
            </div>

            <hr style={styles.separator} />
            <h3 style={styles.subHeading}>Target Position</h3>
            <div style={{...styles.field, marginTop: '30px'}}>
                <div style={{display:'flex', gap:'10px'}}>
                    <input value={formData.positionLabel} readOnly style={{...styles.input(false), backgroundColor:'#f8f9fa', color:'#495057', cursor:'not-allowed', fontWeight:'600'}} />
                    <button style={styles.backBtn} onClick={() => setView('roles')}>Change</button>
                </div>
            </div>
            </div>

<div style={styles.section}>
    <h2 style={styles.sectionTitle}>Skills Validation</h2>
    
    {/* --- MODIFIED SKILLS INPUT WITH BUBBLES INSIDE --- */}
    <div style={{...styles.field, position:'relative', marginTop: '30px'}} ref={skillWrapperRef}>
        <label style={styles.label}>Select Skills for {formData.positionLabel}</label>
        
        {/* WRAPPER DIV ACTING AS THE INPUT BOX */}
        <div 
            style={styles.skillsWrapper(errors.skills)} 
            onClick={() => document.getElementById('skill-input-field').focus()}
        >
            {/* SELECTED SKILLS BUBBLES NOW INSIDE */}
            {selectedSkillObjects.map(s => (
                <div key={s.id} onClick={(e) => { e.stopPropagation(); toggleSkill(s.id); }} style={styles.skillChip}>
                    {s.label} <span style={{fontWeight:'bold', marginLeft:'4px'}}>×</span>
                </div>
            ))}
            
            {/* GHOST INPUT FOR SEARCHING */}
            <input 
                id="skill-input-field"
                value={skillSearch} 
                onChange={e => { setSkillSearch(e.target.value); setShowSkillDropdown(true); }} 
                onClick={() => setShowSkillDropdown(true)}
                autoComplete="off"
                style={styles.ghostInput}
                placeholder={availableSkillIds.length > 0 ? "Type to search skills..." : "No skills configured for this role"} 
            />
        </div>

        {showSkillDropdown && availableSkillIds.length > 0 && (
    <div style={{
        ...styles.dropdown, 
        display: 'flex', 
        flexDirection: 'column', 
        maxHeight: '250px', 
        overflow: 'hidden'   
    }} ref={skillDropdownRef}>
        
        {/* Scrollable list of skills */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
            {filteredDropdownSkills.length > 0 ? (
                filteredDropdownSkills.map(s => (
                    <div 
                        key={s.id} 
                        onClick={() => toggleSkill(s.id)} 
                        style={styles.dropdownItem} 
                        onMouseEnter={(e)=>e.target.style.background='#f8f9fa'} 
                        onMouseLeave={(e)=>e.target.style.background='#fff'}
                    >
                        {s.label}
                    </div>
                ))
            ) : (
                <div style={{padding:'10px', color:'#999999', fontSize:'0.9rem'}}>No matching skills found</div>
            )}
        </div>

        {/* Pinned Done Button - Centered with reduced height */}
        <div style={{ 
            padding: '5px 10px', // Reduced vertical padding from 10px to 5px
            borderTop: '1px solid #eee', 
            display: 'flex',      // Added flex to center
            justifyContent: 'flex-start', // Centers the button
            backgroundColor: '#f2f8fe',
            zIndex: 11 
        }}>
            <button 
                type="button"
                onClick={(e) => { 
                    e.preventDefault();
                    e.stopPropagation(); 
                    setShowSkillDropdown(false); 
                }}
                style={{
                    padding: '6px 20px', // Slightly wider for better looks in center
                    backgroundColor: '#0c6cd3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.85rem', // Slightly smaller font to match reduced height
                    fontWeight: '600'
                }}
            >
                Done
            </button>
        </div>
    </div>
)}
        {errors.skills && <div style={styles.errorMsg}>{errors.skills}</div>}
    </div>
    {/* ------------------------------------------------ */}

    <div style={{...styles.field, marginTop: '60px'}}>
        <label style={styles.label}>Why This Person Is a Good Fit</label>
        <textarea name="why_fit" rows="4" value={formData.why_fit} onChange={handleChange} autoComplete="off" onPaste={(e) => { e.preventDefault();
            showToast("Copy-pasting is disabled for this field. Please write a unique endorsement.", "error");}} 
            style={{...styles.input(errors.why_fit), fontFamily:'inherit'}} placeholder="Briefly explain why this person is the ideal candidate for this specific role. Focus on connecting their skills to the job requirements and highlighting unique strengths or achievements that go beyond their resume summary." />
        {errors.why_fit && <div style={styles.errorMsg}>{errors.why_fit}</div>}
    </div>
</div>

            <div>
                <h2 style={styles.sectionTitle}>Resume Upload</h2>
                <div style={{...styles.field, padding: '30px', border: errors.resume ? '1px dashed #dc3545' : '1px dashed #0056b3', borderRadius:'6px', textAlign:'center', backgroundColor:'#f8f9fa'}}>
                    <label style={{display:'block', marginBottom:'15px', fontWeight:'500', color:'#6c757d'}}>Upload Resume (Max 5MB)</label>
                    <input type="file" onChange={handleFile} style={{display:'inline-block'}} accept=".pdf,.doc,.docx,.png,.jpg" autoComplete="off" />
                </div>
                {errors.resume && <div style={{...styles.errorMsg, textAlign:'center', marginBottom:'20px'}}>{errors.resume}</div>}
                <button 
                    onClick={handleSubmit} 
                    disabled={submitting} // DISABLE IF SUBMITTING
                    style={{
                        ...styles.submitBtn, 
                        // CHANGE COLOR IF SUBMITTING
                        backgroundColor: submitting ? '#6c757d' : '#28a745', 
                        cursor: submitting ? 'not-allowed' : 'pointer'
                    }}
                >
                    {/* CHANGE TEXT IF SUBMITTING */}
                    {submitting ? 'Submitting...' : 'Submit Referral'}
                </button>
            </div>
        </div>
      )}

      {toast.show && <div style={styles.toast(toast.type)}>{toast.message}</div>}
    </div>
  )
}

export default App