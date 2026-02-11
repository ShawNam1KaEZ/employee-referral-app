// frontend/src/App.jsx
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const MAX_FILE_SIZE = 5 * 1024 * 1024; 

function App() {
  // --- STATE ---
  const [roles, setRoles] = useState([])
  const [allSkills, setAllSkills] = useState([])
  const [roleSkillsMap, setRoleSkillsMap] = useState({}) 
  const [loading, setLoading] = useState(true)

  // Search States
  const [roleSearch, setRoleSearch] = useState("")
  const [skillSearch, setSkillSearch] = useState("")
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const [showSkillDropdown, setShowSkillDropdown] = useState(false) 
  
  // Refs
  const roleWrapperRef = useRef(null)
  const skillWrapperRef = useRef(null) 
  const dropdownRef = useRef(null)
  const skillDropdownRef = useRef(null) 

  const [formData, setFormData] = useState({
    employee_id: '',
    candidate_name: '',
    candidate_contact: '',
    position: '',
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
        const response = await axios.get('http://127.0.0.1:8000/form-options')
        setRoles(response.data.roles)
        setAllSkills(response.data.skills)
        setRoleSkillsMap(response.data.role_skills) 
        setLoading(false)
      } catch (error) {
        showToast("Error loading data from server.", "error")
      }
    }
    fetchData()
  }, [])

  // --- AUTO SCROLL FOR DROPDOWNS ---
  useEffect(() => {
    if (showRoleDropdown && dropdownRef.current) {
      setTimeout(() => {
        dropdownRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
    }
  }, [showRoleDropdown])

  useEffect(() => {
    if (showSkillDropdown && skillDropdownRef.current) {
      setTimeout(() => {
        skillDropdownRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
    }
  }, [showSkillDropdown])

  // --- CLICK OUTSIDE DROPDOWNS ---
  useEffect(() => {
    const handleClick = (e) => {
      if (roleWrapperRef.current && !roleWrapperRef.current.contains(e.target)) {
        setShowRoleDropdown(false)
      }
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

  const handleRoleSelect = (id, label) => {
    setFormData({...formData, position: id})
    setRoleSearch(label)
    setShowRoleDropdown(false)
    setSelectedSkills([]) 
    if (errors.position) setErrors({...errors, position: null})
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

  // --- SKILL INTERACTION CHECK ---
  const checkRoleBeforeSkills = (e) => {
    if (!formData.position) {
        e.preventDefault(); 
        e.target.blur();
        showToast("Please select a Target Position first.", "error");
        setErrors(prev => ({...prev, position: "Required for skills selection"}));
        roleWrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }
    return true;
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

    const data = new FormData()
    Object.keys(formData).forEach(k => data.append(k, formData[k]))
    data.append('skills', selectedSkills.join(','))
    data.append('resume', resume)

    try {
      const res = await axios.post('http://127.0.0.1:8000/submit', data)
      showToast(res.data.message, "success")
      setFormData({ employee_id: '', candidate_name: '', candidate_contact: '', position: '', why_fit: '' })
      setSelectedSkills([])
      setResume(null)
      setRoleSearch("")
      setSkillSearch("")
      setErrors({})
    } catch (err) {
      const detail = err.response?.data?.detail
      let errorMsg = "An error occurred";
      const newErrors = {};

      if (typeof detail === "string") {
        errorMsg = detail;
        if(detail.includes("adequate") || detail.includes("Skills")) newErrors.skills = detail; 
        if(detail.includes("File")) newErrors.resume = detail;
        // NEW: Handle similarity error
        if(detail.includes("similar")) newErrors.why_fit = detail;
      }
      setErrors(newErrors); 
      showToast(errorMsg, "error"); 
    }
  }

  // --- STYLES ---
  const styles = {
    page: { minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', justifyContent: 'center', padding: '40px 20px', fontFamily: '"Segoe UI", sans-serif', color: '#333' },
    card: { backgroundColor: '#ffffff', width: '100%', maxWidth: '700px', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #e9ecef' },
    header: { textAlign: 'center', color: '#212529', marginBottom: '30px', fontSize: '1.75rem', fontWeight: '700' },
    section: { marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e9ecef' },
    sectionTitle: { fontSize: '1.2rem', color: '#495057', marginBottom: '20px', fontWeight: '600', borderLeft: '4px solid #007bff', paddingLeft: '10px' },
    
    subHeading: { 
        fontSize: '1.2rem', 
        color: '#495057', 
        marginBottom: '20px', 
        marginTop: '30px', 
        fontWeight: '600', 
        borderLeft: '4px solid #007bff', 
        paddingLeft: '10px' 
    },
    separator: {
        border: '0',
        borderTop: '1px solid #e9ecef',
        margin: '30px 0 20px 0'
    },

    field: { marginBottom: '20px' },
    label: { display: 'block', fontWeight: '500', marginBottom: '8px', color: '#495057', fontSize: '0.95rem' },
    input: (error) => ({ width: '100%', padding: '12px', fontSize: '1rem', borderRadius: '4px', border: error ? '1px solid #dc3545' : '1px solid #ced4da', outline: 'none', backgroundColor: '#ffffff', color: '#212529', boxSizing: 'border-box' }),
    errorMsg: { color: '#dc3545', fontSize: '0.85rem', marginTop: '5px', display: 'block' },
    button: { backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', fontWeight: '500', marginTop: '10px' },
    submitBtn: { backgroundColor: '#198754', color: 'white', border: 'none', padding: '14px 24px', borderRadius: '4px', fontSize: '1.1rem', cursor: 'pointer', fontWeight: '600', width: '100%' },
    dropdown: { marginTop: '5px', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #ced4da', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'absolute', width: '100%', zIndex: 10 },
    dropdownItem: { padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f3f5', color: '#212529' },
    skillContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' },
    skillChip: { padding: '6px 12px', borderRadius: '16px', fontSize: '0.85rem', cursor: 'pointer', border: '1px solid #0d6efd', backgroundColor: '#0d6efd', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '5px' },
    toast: (type) => ({ position: 'fixed', bottom: '20px', right: '20px', padding: '15px 20px', backgroundColor: type === 'error' ? '#dc3545' : '#198754', color: 'white', borderRadius: '4px', zIndex: 1000 })
  }

  // --- FILTERED LISTS ---
  const filteredRoles = roles.filter(r => r.label.toLowerCase().includes(roleSearch.toLowerCase()))
  
  const availableSkillIds = roleSkillsMap[formData.position] || []
  const relevantSkills = allSkills.filter(s => availableSkillIds.includes(s.id))
  const filteredDropdownSkills = relevantSkills.filter(s => 
      s.label.toLowerCase().includes(skillSearch.toLowerCase()) && 
      !selectedSkills.includes(s.id)
  )
  const selectedSkillObjects = allSkills.filter(s => selectedSkills.includes(s.id))

  if(loading) return <div style={{textAlign:'center', marginTop:'50px', color:'#555'}}>Loading Application...</div>

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.header}>Employee Referral Application</h1>

        {/* SECTION 1: DETAILS */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Referral Details</h2>
          
          <div style={styles.field}>
            <label style={styles.label}>ID</label>
            <input name="employee_id" type="text" value={formData.employee_id} onChange={handleChange} autoComplete="off" style={styles.input(errors.employee_id)} />
            {errors.employee_id && <div style={styles.errorMsg}>{errors.employee_id}</div>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Candidate Name</label>
            <input name="candidate_name" value={formData.candidate_name} onChange={handleChange} autoComplete="off" style={styles.input(errors.candidate_name)} />
            {errors.candidate_name && <div style={styles.errorMsg}>{errors.candidate_name}</div>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Candidate Email</label>
            <input name="candidate_contact" value={formData.candidate_contact} onChange={handleChange} autoComplete="off" style={styles.input(errors.candidate_contact)} />
            {errors.candidate_contact && <div style={styles.errorMsg}>{errors.candidate_contact}</div>}
          </div>

          {/* LINE SEPARATOR & SUBHEADING FOR POSITION */}
          <hr style={styles.separator} />
          <h3 style={styles.subHeading}>Target Position</h3>

          <div style={{...styles.field, position:'relative'}} ref={roleWrapperRef}>
            <input value={roleSearch} onClick={() => setShowRoleDropdown(true)} onChange={(e) => { setRoleSearch(e.target.value); setShowRoleDropdown(true) }} autoComplete="off" style={styles.input(errors.position)} placeholder="Search Position..." />
            {showRoleDropdown && (
                <div style={styles.dropdown} ref={dropdownRef}>
                  {filteredRoles.map(r => (
                    <div key={r.id} onClick={() => handleRoleSelect(r.id, r.label)} style={styles.dropdownItem} onMouseEnter={(e)=>e.target.style.background='#f8f9fa'} onMouseLeave={(e)=>e.target.style.background='#fff'}>{r.label}</div>
                  ))}
                </div>
            )}
            {errors.position && <div style={styles.errorMsg}>{errors.position}</div>}
          </div>
        </div>

        {/* SECTION 2: SKILLS */}
        <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Skills Validation</h2>
            
            <div style={{...styles.field, position:'relative'}} ref={skillWrapperRef}>
              <label style={styles.label}>Select Skills for {roleSearch}</label>
              
              <input 
                value={skillSearch} 
                onChange={e => { 
                    if(checkRoleBeforeSkills(e)) {
                        setSkillSearch(e.target.value); 
                        setShowSkillDropdown(true);
                    }
                }} 
                onClick={(e) => {
                    if(checkRoleBeforeSkills(e)) {
                        setShowSkillDropdown(true);
                    }
                }}
                onFocus={(e) => checkRoleBeforeSkills(e)}
                autoComplete="off"
                style={styles.input(errors.skills)} 
                placeholder={availableSkillIds.length > 0 ? "Type to search skills..." : "Select a role above first"} 
              />
              
              {showSkillDropdown && availableSkillIds.length > 0 && (
                <div style={styles.dropdown} ref={skillDropdownRef}>
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
                      <div style={{padding:'10px', color:'#999', fontSize:'0.9rem'}}>No matching skills found</div>
                  )}
                </div>
              )}
              
              <div style={styles.skillContainer}>
                {selectedSkillObjects.map(s => (
                  <div key={s.id} onClick={() => toggleSkill(s.id)} style={styles.skillChip}>
                    {s.label} <span style={{fontWeight:'bold', marginLeft:'4px'}}>×</span>
                  </div>
                ))}
              </div>

              {errors.skills && <div style={styles.errorMsg}>{errors.skills}</div>}
            </div>

            <div style={styles.field}>
                <label style={styles.label}>Why This Person Is a Good Fit</label>
                <textarea 
                    name="why_fit" 
                    rows="4" 
                    value={formData.why_fit} 
                    onChange={handleChange} 
                    autoComplete="off" 
                    style={{...styles.input(errors.why_fit), fontFamily:'inherit'}}
                    placeholder="Briefly explain why this person is the ideal candidate for this specific role. Focus on connecting their skills to the job requirements and highlighting unique strengths or achievements that go beyond their resume summary."
                />
                {errors.why_fit && <div style={styles.errorMsg}>{errors.why_fit}</div>}
            </div>
        </div>

        {/* SECTION 3: RESUME */}
        <div>
            <h2 style={styles.sectionTitle}>Resume Upload</h2>
            <div style={{...styles.field, padding: '30px', border: errors.resume ? '1px dashed #dc3545' : '1px dashed #0d6efd', borderRadius:'6px', textAlign:'center', backgroundColor:'#f8f9fa'}}>
                <label style={{display:'block', marginBottom:'15px', fontWeight:'500', color:'#6c757d'}}>Upload Resume (Max 5MB)</label>
                <input type="file" onChange={handleFile} style={{display:'inline-block'}} accept=".pdf,.doc,.docx,.png,.jpg" autoComplete="off" />
            </div>
            {errors.resume && <div style={{...styles.errorMsg, textAlign:'center', marginBottom:'20px'}}>{errors.resume}</div>}
            
            <button onClick={handleSubmit} style={styles.submitBtn}>Submit Referral</button>
        </div>
      </div>

      {toast.show && <div style={styles.toast(toast.type)}>{toast.message}</div>}
    </div>
  )
}

export default App