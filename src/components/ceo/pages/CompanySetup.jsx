import React, { useState, useRef, useEffect } from 'react';
import {
  Building2, Network, Briefcase, Clock, CalendarDays, Plus,
  Trash2, Edit2, Save, AlertCircle, ChevronDown, ChevronRight, Upload,
  CheckCircle, Users, Settings, Filter, X, MapPin
} from 'lucide-react';
import { useCompany } from '../../common/CompanyContext';
import '../CEO.css';

// ==========================================
// INITIAL MOCK DATA FALLBACKS
// ==========================================
const TABS = [
  { id: 'profile', label: 'Company Profile', icon: Building2 },
  { id: 'departments', label: 'Departments', icon: Network },
  { id: 'designations', label: 'Designations', icon: Briefcase },
  { id: 'hours', label: 'Working Hours', icon: Clock },
  { id: 'holidays', label: 'Holidays', icon: CalendarDays }
];

const initialDeptTree = [];

const initialDesignations = [];

const initialShifts = [];

const initialHolidays = [];

// ==========================================
// CUSTOM COMPONENTS
// ==========================================

const CustomSelect = ({ name, options, defaultValue, placeholder, error, onChange, onFocus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(defaultValue || '');
  
  const selectedOpt = options.find(o => typeof o === 'object' ? o.value === value : o === value);
  const displayLabel = selectedOpt ? (typeof selectedOpt === 'object' ? selectedOpt.label : selectedOpt) : placeholder;

  return (
    <div style={{ position: 'relative' }} tabIndex={-1} onBlur={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) {
        setIsOpen(false);
        if (onFocus) onFocus(value);
      }
    }}>
      <input type="hidden" name={name} value={value} />
      <div 
        onClick={() => { setIsOpen(!isOpen); if (onFocus) onFocus(value); }}
        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: error ? '1.5px solid #dc2626' : '1px solid #CBD5E1', boxShadow: error ? '0 0 0 3px rgba(220,38,38,0.1)' : 'none', fontSize: '14px', background: '#FFF', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ color: value ? '#000' : '#9ca3af' }}>{displayLabel}</span>
        <ChevronDown size={16} color="#64748b" />
      </div>
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#FFF', border: '1px solid #CBD5E1', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '150px', overflowY: 'auto' }}>
          {options.map((opt, i) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const label = typeof opt === 'object' ? opt.label : opt;
            return (
              <div 
                key={i}
                onClick={() => { setValue(val); setIsOpen(false); if(onChange) onChange(val); }}
                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '14px', borderBottom: i < options.length - 1 ? '1px solid #f1f5f9' : 'none', background: value === val ? '#f8fafc' : '#FFF' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = value === val ? '#f8fafc' : '#FFF'}
              >
                {label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const HolidayCalendar = ({ holidays, calMonth, setCalMonth, calYear, setCalYear, onEdit }) => {
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const getHolidaysForDay = (day) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.filter(h => h.date === dateStr);
  };

  return (
    <div style={{ padding: '24px', background: '#FFF', borderRadius: '12px', border: '1px solid var(--ceo-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--ceo-text-primary)' }}>{monthNames[calMonth]} {calYear}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="ceo-btn" style={{ padding: '6px', background: '#f1f5f9' }} onClick={prevMonth}><ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} /></button>
          <button className="ceo-btn" style={{ padding: '6px', background: '#f1f5f9' }} onClick={nextMonth}><ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} /></button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: '8px', fontSize: '14px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} style={{ padding: '10px', minHeight: '80px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #e2e8f0' }} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const hols = getHolidaysForDay(day);
          return (
            <div key={day} style={{ padding: '8px', minHeight: '80px', background: hols.length ? '#f0fdf4' : '#FFF', borderRadius: '8px', border: hols.length ? '1.5px solid #86efac' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', alignSelf: 'flex-end', color: hols.length ? 'var(--ceo-success)' : 'var(--ceo-text-secondary)' }}>{day}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                {hols.map(h => (
                  <div key={h.id} onClick={() => onEdit(h)} style={{ cursor: 'pointer', background: h.type === 'Mandatory' ? 'var(--ceo-success)' : '#e2e8f0', color: h.type === 'Mandatory' ? '#FFF' : '#334155', fontSize: '11px', padding: '4px 6px', borderRadius: '4px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }} title={h.name}>
                    {h.name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CustomModal = ({ isOpen, title, fields, onSave, onClose }) => {
  const getErrorMsg = (f) => {
    if (f.label === 'Department Name') return 'Please enter New Department Name.';
    if (f.label === 'Designation Name') return 'Please enter New Designation Name.';
    if (f.label === 'Department') return 'Please select one Department.';
    if (f.label === 'Shift Name') return 'Please enter Shift Name.';
    if (f.label === 'Start Time') return 'Please select Start Time from DropDown.';
    if (f.label === 'End Time') return 'Please select End Time from DropDown.';
    if (f.label === 'Working Days') return 'Please enter Working Days (e.g. Monday - Friday).';
    if (f.label === 'Holiday Name') return 'Please enter Holiday Name.';
    if (f.label === 'Date') return 'Please select Holiday Date.';
    if (f.label === 'Type') return 'Please select Holiday Type.';
    return 'This field is required.';
  };

  const [errors, setErrors] = useState(() => {
    return {};
  });
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#FFF', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>{title}</div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--ceo-text-muted)" /></button>
        </div>
        <form noValidate onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const data = {};
          let hasError = false;
          const newErrors = { ...errors };
          
          fields.forEach(f => {
            const val = formData.get(f.name);
            data[f.name] = val;
            if (!val || !val.toString().trim()) {
              newErrors[f.name] = getErrorMsg(f);
              hasError = true;
            } else {
              newErrors[f.name] = null;
            }
          });
          
          if (hasError) {
            setErrors(newErrors);
            return;
          }
          
          onSave(data);
        }}>
          {fields.map(f => (
            <div key={f.name} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: errors[f.name] ? '4px' : '6px', color: 'var(--ceo-text-secondary)' }}>{f.label}</label>
              {errors[f.name] && (
                <div style={{ color: '#dc2626', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <AlertCircle size={14} /> {errors[f.name]}
                </div>
              )}
              {f.type === 'select' ? (
                <CustomSelect name={f.name} options={f.options} defaultValue={f.defaultValue} placeholder={`Select ${f.label}`} error={errors[f.name]} 
                onChange={(val) => {
                  if (!val) {
                    setErrors(prev => ({ ...prev, [f.name]: getErrorMsg(f) }));
                  } else {
                    setErrors(prev => ({ ...prev, [f.name]: null }));
                  }
                }} 
                onFocus={(val) => {
                  if (!val) {
                    setErrors(prev => ({ ...prev, [f.name]: getErrorMsg(f) }));
                  }
                }} 
                />
              ) : (
                <>
                  <input 
                    name={f.name} 
                    type={f.type || 'text'} 
                    defaultValue={f.defaultValue || ''} 
                    onChange={(e) => {
                      if (!e.target.value.trim()) {
                        setErrors(prev => ({ ...prev, [f.name]: getErrorMsg(f) }));
                      } else {
                        setErrors(prev => ({ ...prev, [f.name]: null }));
                      }
                    }}
                    
                    onFocus={(e) => {
                      if (!e.target.value.trim()) {
                        setErrors(prev => ({ ...prev, [f.name]: getErrorMsg(f) }));
                      }
                    }}
                    onBlur={(e) => {
                      if (!e.target.value.trim()) {
                        setErrors(prev => ({ ...prev, [f.name]: getErrorMsg(f) }));
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      borderRadius: '8px', 
                      border: errors[f.name] ? '1.5px solid #dc2626' : '1px solid #CBD5E1', 
                      boxShadow: errors[f.name] ? '0 0 0 3px rgba(220,38,38,0.1)' : 'none',
                      fontSize: '14px', 
                      outline: 'none' 
                    }} 
                  />
                </>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer', fontWeight: 600, color: 'var(--ceo-text-secondary)' }}>Cancel</button>
            <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--ceo-primary)', color: '#FFF', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Recursive Tree Node Component
const DeptTreeNode = ({ dept, level = 0, onAdd, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = dept.children && dept.children.length > 0;

  return (
    <div style={{ marginLeft: `${level > 0 ? 32 : 0}px`, marginTop: '12px', position: 'relative' }}>
      {level > 0 && (
        <div style={{ position: 'absolute', left: '-20px', top: '24px', width: '20px', height: '1px', background: 'var(--ceo-border)' }}></div>
      )}
      {level > 0 && !hasChildren && (
        <div style={{ position: 'absolute', left: '-20px', top: '-12px', width: '1px', height: '36px', background: 'var(--ceo-border)' }}></div>
      )}

      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', padding: '12px 16px',
          background: isHovered ? 'var(--ceo-hover)' : 'var(--ceo-card-bg)',
          border: '1px solid var(--ceo-border)',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          boxShadow: isHovered ? '0 4px 6px rgba(0,0,0,0.05)' : '0 1px 2px rgba(0,0,0,0.02)',
          zIndex: 2,
          position: 'relative'
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', width: '24px', cursor: 'pointer' }}
          onClick={() => setExpanded(!expanded)}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={18} color="var(--ceo-text-muted)" /> : <ChevronRight size={18} color="var(--ceo-text-muted)" />
          ) : (
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--ceo-divider)', marginLeft: '2px' }}></div>
          )}
        </div>

        <span style={{ fontWeight: 600, flex: 1, fontSize: '15px', color: 'var(--ceo-text-primary)' }}>{dept.name}</span>

        <div style={{
          display: 'flex',
          gap: '8px',
          opacity: 1,
          transition: 'opacity 0.2s',
          marginLeft: 'auto'
        }}>

          <button className="ceo-btn" style={{ padding: '6px', background: '#FFF' }} title="Edit Department" onClick={() => onEdit(dept)}>
            <Edit2 size={14} color="var(--ceo-text-secondary)" />
          </button>
          <button className="ceo-btn" style={{ padding: '6px', background: '#FFF' }} title="Delete Department" onClick={() => onDelete(dept.id, dept.name)}>
            <Trash2 size={14} color="var(--ceo-danger)" />
          </button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div style={{ borderLeft: '1px solid var(--ceo-border)', marginLeft: '11px' }}>
          {dept.children.map(child => (
            <DeptTreeNode key={child.id} dept={child} level={level + 1} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

const autoCropImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let top = null, bottom = null, left = null, right = null;

          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const index = (y * canvas.width + x) * 4;
              const r = data[index];
              const g = data[index + 1];
              const b = data[index + 2];
              const alpha = data[index + 3];
              
              // Check if pixel is effectively invisible (either transparent or pure white)
              const isTransparent = alpha < 10;
              const isWhite = r > 245 && g > 245 && b > 245 && alpha > 240;
              
              if (!isTransparent && !isWhite) { 
                if (top === null) top = y;
                bottom = y;
                if (left === null || x < left) left = x;
                if (right === null || x > right) right = x;
              }
            }
          }

          if (top === null) {
            resolve(file);
            return;
          }

          // Add a small padding (e.g. 5%) around the cropped image for better visuals
          const paddingX = Math.floor((right - left) * 0.05);
          const paddingY = Math.floor((bottom - top) * 0.05);
          
          const finalLeft = Math.max(0, left - paddingX);
          const finalTop = Math.max(0, top - paddingY);
          const finalRight = Math.min(canvas.width - 1, right + paddingX);
          const finalBottom = Math.min(canvas.height - 1, bottom + paddingY);

          const width = finalRight - finalLeft + 1;
          const height = finalBottom - finalTop + 1;

          const croppedCanvas = document.createElement('canvas');
          croppedCanvas.width = width;
          croppedCanvas.height = height;
          const croppedCtx = croppedCanvas.getContext('2d');
          
          croppedCtx.drawImage(
            canvas,
            finalLeft, finalTop, width, height,
            0, 0, width, height
          );

          croppedCanvas.toBlob((blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const croppedFile = new File([blob], file.name, { type: file.type || 'image/png' });
            resolve(croppedFile);
          }, file.type || 'image/png');
        } catch (e) {
          // Fallback if canvas is tainted (e.g. CORS issues, though unlikely with local file)
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

// ==========================================
// MAIN PAGE (LIVE DATA CONNECTED)
// ==========================================
export default function CompanySetup() {
  const [activeTab, setActiveTab] = useState('profile');
  const { refreshCompanyConfig, logoZoom, loadingConfig } = useCompany();
  
  const [deptTree, setDeptTree] = useState(initialDeptTree);
  const [designations, setDesignations] = useState(initialDesignations);
  const [desigPage, setDesigPage] = useState(1);
  const [shifts, setShifts] = useState(initialShifts);
  const [holidays, setHolidays] = useState(initialHolidays);
  
  // Calendar view states
  const [holidayView, setHolidayView] = useState('list');
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [profileData, setProfileData] = useState({
    name: 'NSG Technologies Pvt Ltd',
    gst: '27AADCN4521E1Z8',
    cin: 'U74900MH2010PTC123456',
    address: 'Unit 401, Mindspace IT Park, Malad West, Mumbai, Maharashtra 400064',
    office_latitude: '',
    office_longitude: '',
    allowed_radius: '300',
    emp_id_prefix: 'nsg'
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // UI States
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [nameError, setNameError] = useState('');
  const [gstError, setGstError] = useState('');
  const [cinError, setCinError] = useState('');
  const [prefixError, setPrefixError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [modalConfig, setModalConfig] = useState(null);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem('nsg_jwt_token');

//   const showToast = (msg) => {
//     setToastMsg(msg);
//     setTimeout(() => setToastMsg(''), 3000);
//   };

  // ─── API Integration ──────────────────────────────────────────────────────────

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/ceo-portal/configs', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const configs = await res.json();
        setProfileData({
          name: configs.company_name || 'NSG Technologies Pvt Ltd',
          gst: configs.company_gst || '27AADCN4521E1Z8',
          cin: configs.company_cin || 'U74900MH2010PTC123456',
          address: configs.company_address || 'Unit 401, Mindspace IT Park, Malad West, Mumbai, Maharashtra 400064',
          office_latitude: configs.office_latitude || '',
          office_longitude: configs.office_longitude || '',
          allowed_radius: configs.allowed_radius || '300',
          emp_id_prefix: configs.emp_id_prefix || 'nsg'
        });
        if (configs.company_logo) {
          setLogoFile(configs.company_logo.split('/').pop());
          setLogoPreview("http://localhost:8000" + configs.company_logo);
        }
      }
    } catch (err) { }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/ceo-portal/departments', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const flatDepts = await res.json();
        const buildTree = (parentId) => flatDepts.filter(d => d.parent_id === parentId).map(d => ({ ...d, children: buildTree(d.id) }));
        setDeptTree(buildTree(null));
      }
    } catch (err) { }
  };

  const fetchDesignations = async () => {
    try {
      const res = await fetch('/api/ceo-portal/designations', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setDesignations(await res.json());
    } catch (err) { }
  };

  const fetchShifts = async () => {
    try {
      const res = await fetch('/api/ceo-portal/shifts', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setShifts(await res.json());
    } catch (err) { }
  };

  const fetchHolidays = async () => {
    try {
      const res = await fetch('/api/ceo-portal/holidays', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setHolidays(await res.json());
    } catch (err) { }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchDepartments(), fetchDesignations(), fetchShifts(), fetchHolidays()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const saveSetting = async (key, value) => {
    try {
      const res = await fetch('/api/ceo-portal/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key, value })
      });
      return res.ok;
    } catch (e) {
      console.error(`Error saving config ${key}:`, e);
      return false;
    }
  };

  // ─── Event Handlers ──────────────────────────────────────────────────────────

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      window.showToast('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setProfileData({
          ...profileData,
          office_latitude: position.coords.latitude.toFixed(6),
          office_longitude: position.coords.longitude.toFixed(6)
        });
        window.showToast('Office GPS location captured!');
      },
      (error) => {
        window.showToast('Failed to get GPS location. Please allow location access.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    let hasError = false;

    if (!profileData.name.trim()) {
      setNameError('Please enter a Legal Company Name.');
      hasError = true;
    }
    if (!profileData.gst.trim()) {
      setGstError('Please enter GST Number.');
      hasError = true;
    }
    if (!profileData.cin.trim()) {
      setCinError('Please enter Corporate Identification Number (CIN).');
      hasError = true;
    }
    if (!profileData.emp_id_prefix.trim()) {
      setPrefixError('Please enter Prefix for Employee ID generation.');
      hasError = true;
    }
    if (!profileData.address.trim()) {
      setAddressError('Please enter Company Address.');
      hasError = true;
    }

    if (hasError) return;

    setIsSaving(true);

    const p1 = saveSetting('company_name', profileData.name);
    const p2 = saveSetting('company_gst', profileData.gst);
    const p3 = saveSetting('company_cin', profileData.cin);
    const p4 = saveSetting('company_address', profileData.address);
    const p5 = saveSetting('office_latitude', profileData.office_latitude);
    const p6 = saveSetting('office_longitude', profileData.office_longitude);
    const p7 = saveSetting('allowed_radius', profileData.allowed_radius);
    const p8 = saveSetting('emp_id_prefix', profileData.emp_id_prefix);
    
    const results = await Promise.all([p1, p2, p3, p4, p5, p6, p7, p8]);
    setIsSaving(false);
    if (results.every(r => r)) {
      window.showToast('Profile configuration saved securely.');
      refreshCompanyConfig();
    } else {
      window.showToast('Error saving profile settings.');
    }
  };

  const handleLogoUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      const fileName = originalFile.name;
      setIsSaving(true);
      window.showToast('Processing and auto-cropping logo...');

      // Auto-crop the image to remove transparent padding
      const croppedFile = await autoCropImage(originalFile);

      const formData = new FormData();
      formData.append('file', croppedFile);

      try {
        const res = await fetch('/api/ceo-portal/configs/upload-logo', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        setIsSaving(false);
        if (res.ok) {
          const data = await res.json();
          setLogoFile(fileName);
          setLogoPreview("http://localhost:8000" + data.file_url);
          window.showToast('Logo perfectly cropped and securely uploaded.');
          refreshCompanyConfig();
        } else {
          window.showToast('Error uploading logo to server.');
        }
      } catch (err) {
        setIsSaving(false);
        window.showToast('Error connecting to server for upload.');
      }
    }
  };

  const handleDeptAdd = (parentId = null) => {
    setModalConfig({
      title: parentId ? 'Add Sub-Department' : 'Add Root Department',
      fields: [{ name: 'name', label: 'Department Name' }],
      onSave: async (data) => {
        setModalConfig(null);
        const res = await fetch('/api/ceo-portal/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: data.name, parent_id: parentId, headcount: 0 })
        });
        if (res.ok) {
          window.showToast('Department added');
          fetchDepartments();
        } else window.showToast('Failed to add department');
      }
    });
  };

  const handleDeptEdit = (dept) => {
    setModalConfig({
      title: 'Edit Department',
      fields: [{ name: 'name', label: 'Department Name', defaultValue: dept.name }],
      onSave: async (data) => {
        setModalConfig(null);
        const res = await fetch(`/api/ceo-portal/departments/${dept.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: data.name })
        });
        if (res.ok) {
          window.showToast('Department updated');
          fetchDepartments();
        } else window.showToast('Failed to update department');
      }
    });
  };

  const handleDeptDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This will also delete all sub-departments.`)) {
      const res = await fetch(`/api/ceo-portal/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        window.showToast('Department deleted');
        fetchDepartments();
      } else window.showToast('Failed to delete department');
    }
  };

  const handleDesigAddEdit = (item = null) => {
    // We need department options
    const flatDepts = [];
    const flatten = (tree) => {
      tree.forEach(t => { flatDepts.push({ id: t.id, name: t.name }); flatten(t.children || []); });
    };
    flatten(deptTree);

    setModalConfig({
      title: item ? 'Edit Designation' : 'Create Designation',
      fields: [
        { name: 'department_id', label: 'Department', type: 'select', options: flatDepts.map(d => ({ value: `${d.id}:${d.name}`, label: d.name })), defaultValue: item ? `${item.department_id}:${item.dept}` : undefined },
        { name: 'name', label: 'Designation Name', defaultValue: item?.name }
      ],
      onSave: async (data) => {
        setModalConfig(null);
        const deptId = parseInt(data.department_id.split(':')[0]);
        const payload = { name: data.name, department_id: deptId, level: item ? item.level : 1 };
        const url = item ? `/api/ceo-portal/designations/${item.id}` : '/api/ceo-portal/designations';
        const method = item ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          window.showToast(item ? 'Designation updated' : 'Designation created');
          fetchDesignations();
        } else window.showToast('Failed to save designation');
      }
    });
  };

  const handleDesigDelete = async (id) => {
    if (window.confirm('Delete designation?')) {
      const res = await fetch(`/api/ceo-portal/designations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        window.showToast('Designation deleted');
        fetchDesignations();
      } else window.showToast('Failed to delete designation');
    }
  };

  const handleShiftAddEdit = (item = null) => {
    const timeOptions = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hr12 = h % 12 || 12;
        const hrStr = hr12.toString().padStart(2, '0');
        const minStr = m.toString().padStart(2, '0');
        timeOptions.push(`${hrStr}:${minStr} ${ampm}`);
      }
    }
    setModalConfig({
      title: item ? 'Edit Shift' : 'Add Shift',
      fields: [
        { name: 'name', label: 'Shift Name', defaultValue: item?.name },
        { name: 'start_time', label: 'Start Time', type: 'select', options: timeOptions, defaultValue: item?.start_time },
        { name: 'end_time', label: 'End Time', type: 'select', options: timeOptions, defaultValue: item?.end_time },
        { name: 'days', label: 'Working Days', defaultValue: item?.days }
      ],
      onSave: async (data) => {
        setModalConfig(null);
        const url = item ? `/api/ceo-portal/shifts/${item.id}` : '/api/ceo-portal/shifts';
        const method = item ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          window.showToast(item ? 'Shift updated' : 'Shift added');
          fetchShifts();
        } else window.showToast('Failed to save shift');
      }
    });
  };

  const handleShiftDelete = async (id) => {
    if (window.confirm('Delete shift?')) {
      const res = await fetch(`/api/ceo-portal/shifts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        window.showToast('Shift deleted');
        fetchShifts();
      } else window.showToast('Failed to delete shift');
    }
  };

  const handleHolidayAddEdit = (item = null) => {
    setModalConfig({
      title: item ? 'Edit Holiday' : 'Add Holiday',
      fields: [
        { name: 'name', label: 'Holiday Name', defaultValue: item?.name },
        { name: 'date', label: 'Date', type: 'date', defaultValue: item?.date },
        { name: 'type', label: 'Type', type: 'select', options: ['Mandatory', 'Optional'], defaultValue: item?.type }
      ],
      onSave: async (data) => {
        setModalConfig(null);
        const url = item ? `/api/ceo-portal/holidays/${item.id}` : '/api/ceo-portal/holidays';
        const method = item ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          window.showToast(item ? 'Holiday updated' : 'Holiday added');
          fetchHolidays();
        } else window.showToast('Failed to save holiday');
      }
    });
  };

  const handleHolidayDelete = async (id) => {
    if (window.confirm('Delete holiday?')) {
      const res = await fetch(`/api/ceo-portal/holidays/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        window.showToast('Holiday deleted');
        fetchHolidays();
      } else window.showToast('Failed to delete holiday');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '600px', gap: '12px' }}>
        <Clock className="spin" size={32} color="var(--ceo-primary)" style={{ opacity: 0.6 }} />
        <div style={{ color: 'var(--ceo-text-secondary)', fontSize: '15px', fontWeight: 600 }}>
          Loading company configurations...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

      {/* GLOBAL TOAST NOTIFICATION - Handled by App.jsx Toaster */}

      {/* DYNAMIC MODAL */}
      {modalConfig && (
        <CustomModal
          isOpen={true}
          title={modalConfig.title}
          fields={modalConfig.fields}
          onSave={modalConfig.onSave}
          onClose={() => setModalConfig(null)}
        />
      )}

      {/* HEADER */}
      <div style={{ marginBottom: '32px' }}>
        <h1 className="ceo-typography-page-title">Company Configuration</h1>
        <p className="ceo-typography-body" style={{ marginTop: '8px', fontSize: '15px' }}>Core structural parameters and global organization settings.</p>
      </div>

      {/* CSS GRID LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: '32px',
        flex: 1,
        alignItems: 'start'
      }}>

        {/* NAV SIDEBAR */}
        <div className="ceo-command-panel" style={{ padding: '16px 0', position: 'sticky', top: '32px' }}>
          <div className="ceo-typography-meta" style={{ padding: '0 24px 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Setup Modules</div>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 24px',
                background: activeTab === tab.id ? 'var(--ceo-hover)' : 'transparent',
                border: 'none',
                borderRight: activeTab === tab.id ? '4px solid var(--ceo-primary)' : '4px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                color: activeTab === tab.id ? 'var(--ceo-primary)' : 'var(--ceo-text-secondary)',
                fontWeight: activeTab === tab.id ? 600 : 500,
                fontSize: '15px',
                transition: 'all 0.2s ease'
              }}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT PANEL */}
        <div className="ceo-command-panel" style={{ display: 'flex', flexDirection: 'column', minHeight: '600px' }}>

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <>
              <div className="ceo-command-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="ceo-typography-card-title"><Building2 size={20} color="var(--ceo-primary)" /> Legal Profile</div>
                {!isEditingProfile && (
                  <button className="ceo-btn ceo-btn-primary" onClick={() => setIsEditingProfile(true)}>
                    <Edit2 size={16} /> Edit Profile
                  </button>
                )}
              </div>
              <div className="ceo-command-content" style={{ padding: '32px' }}>
                <form className="responsive-form-grid" onSubmit={(e) => { e.preventDefault(); handleSaveProfile(e); setIsEditingProfile(false); }} style={{ gap: '24px', maxWidth: '800px' }}>

                  {/* Logo Upload */}
                  <div style={{ gridColumn: '1 / -1', marginBottom: '8px', display: 'flex', gap: '32px', alignItems: 'center', padding: '24px', background: 'var(--ceo-bg)', borderRadius: '12px', border: '1px dashed var(--ceo-border)' }}>
                    <div style={{ width: 100, height: 100, borderRadius: 12, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden', padding: '12px', boxSizing: 'border-box' }}>
                      {logoPreview ? (
                        <img src={logoPreview} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <Building2 size={40} color="var(--ceo-primary)" opacity={0.8} />
                      )}
                    </div>
                    <div>
                      <div className="ceo-typography-section-title" style={{ fontSize: '16px', marginBottom: '8px' }}>Company Logo</div>
                      <div className="ceo-typography-meta" style={{ marginBottom: '16px', fontSize: '13px' }}>{logoFile ? `Selected: ${logoFile}` : 'Recommended 400x400px PNG or SVG format. Max 2MB.'}</div>
                      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleLogoUpload} accept="image/*" />
                      <button type="button" className="ceo-btn" style={{ background: '#FFF' }} onClick={() => fileInputRef.current?.click()}><Upload size={16} /> Select File</button>
                      
                      {isEditingProfile && (
                        <div style={{ color: '#dc2626', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px' }}>
                          <AlertCircle size={14} /> If you upload a new logo, it will reflect in all places where the logo is displayed.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ceo-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: nameError ? '4px' : '8px' }}>Company Name (Legal)</label>
                    {nameError && (
                      <span style={{ color: '#dc2626', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                        <AlertCircle size={14} /> {nameError}
                      </span>
                    )}
                    <input 
                      className="ceo-form-input" 
                      required 
                      disabled={!isEditingProfile} 
                      value={profileData.name} 
                      onChange={(e) => {
                        setProfileData({ ...profileData, name: e.target.value });
                        if (!e.target.value.trim()) {
                          setNameError('Please enter a Legal Company Name.');
                        } else {
                          setNameError('');
                        }
                      }} 
                      style={nameError ? { 
                        borderColor: '#dc2626',
                        boxShadow: '0 0 0 3px rgba(220,38,38,0.1)'
                      } : {}}
                    />
                  </div>

                  <div className="ceo-form-group">
                    <label style={{ display: 'block', marginBottom: gstError ? '4px' : '8px' }}>GST Number</label>
                    {gstError && (
                      <span style={{ color: '#dc2626', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                        <AlertCircle size={14} /> {gstError}
                      </span>
                    )}
                    <input 
                      className="ceo-form-input" 
                      required 
                      disabled={!isEditingProfile} 
                      value={profileData.gst} 
                      onChange={(e) => {
                        setProfileData({ ...profileData, gst: e.target.value });
                        if (!e.target.value.trim()) {
                          setGstError('Please enter GST Number.');
                        } else {
                          setGstError('');
                        }
                      }} 
                      style={gstError ? { 
                        borderColor: '#dc2626',
                        boxShadow: '0 0 0 3px rgba(220,38,38,0.1)'
                      } : {}}
                    />
                  </div>

                  <div className="ceo-form-group">
                    <label style={{ display: 'block', marginBottom: cinError ? '4px' : '8px' }}>CIN</label>
                    {cinError && (
                      <span style={{ color: '#dc2626', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                        <AlertCircle size={14} /> {cinError}
                      </span>
                    )}
                    <input 
                      className="ceo-form-input" 
                      required 
                      disabled={!isEditingProfile} 
                      value={profileData.cin} 
                      onChange={(e) => {
                        setProfileData({ ...profileData, cin: e.target.value });
                        if (!e.target.value.trim()) {
                          setCinError('Please enter Corporate Identification Number (CIN).');
                        } else {
                          setCinError('');
                        }
                      }} 
                      style={cinError ? { 
                        borderColor: '#dc2626',
                        boxShadow: '0 0 0 3px rgba(220,38,38,0.1)'
                      } : {}}
                    />
                  </div>
                  
                  <div className="ceo-form-group">
                    <label style={{ display: 'block', marginBottom: prefixError ? '4px' : '8px' }}>Employee ID Prefix</label>
                    {prefixError && (
                      <span style={{ color: '#dc2626', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                        <AlertCircle size={14} /> {prefixError}
                      </span>
                    )}
                    <input 
                      className="ceo-form-input" 
                      required 
                      disabled={!isEditingProfile} 
                      value={profileData.emp_id_prefix} 
                      onChange={(e) => {
                        setProfileData({...profileData, emp_id_prefix: e.target.value});
                        if (!e.target.value.trim()) {
                          setPrefixError('Please enter Prefix for Employee ID generation.');
                        } else {
                          setPrefixError('');
                        }
                      }} 
                      style={prefixError ? { 
                        borderColor: '#dc2626',
                        boxShadow: '0 0 0 3px rgba(220,38,38,0.1)'
                      } : {}}
                    />
                  </div>
                  
                  <div className="ceo-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: addressError ? '4px' : '8px' }}>Registered Address</label>
                    {addressError && (
                      <span style={{ color: '#dc2626', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                        <AlertCircle size={14} /> {addressError}
                      </span>
                    )}
                    <textarea 
                      className="ceo-form-input" 
                      required 
                      disabled={!isEditingProfile} 
                      rows={3} 
                      value={profileData.address || ''} 
                      onChange={(e) => {
                        setProfileData({ ...profileData, address: e.target.value });
                        if (!e.target.value.trim()) {
                          setAddressError('Please enter Company Address.');
                        } else {
                          setAddressError('');
                        }
                      }} 
                      style={addressError ? { 
                        borderColor: '#dc2626',
                        boxShadow: '0 0 0 3px rgba(220,38,38,0.1)'
                      } : {}}
                    />
                  </div>

                  <div className="ceo-form-group" style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <label style={{ margin: 0, fontWeight: 600, color: 'var(--ceo-text-primary)' }}>Office GPS Coordinates</label>
                      {isEditingProfile && (
                        <button type="button" className="ceo-btn ceo-btn-primary" onClick={handleCaptureGPS} style={{ padding: '6px 12px', fontSize: '13px' }}>
                          <MapPin size={14} style={{ marginRight: '6px' }} /> Use My Current Location
                        </button>
                      )}
                    </div>
                    <div className="responsive-form-grid" style={{ gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--ceo-text-secondary)', marginBottom: '4px', display: 'block' }}>Latitude</label>
                        <input className="ceo-form-input" disabled={!isEditingProfile} placeholder="e.g. 17.6868" required value={profileData.office_latitude || ''} onChange={(e) => setProfileData({ ...profileData, office_latitude: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--ceo-text-secondary)', marginBottom: '4px', display: 'block' }}>Longitude</label>
                        <input className="ceo-form-input" disabled={!isEditingProfile} placeholder="e.g. 83.2185" required value={profileData.office_longitude || ''} onChange={(e) => setProfileData({ ...profileData, office_longitude: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--ceo-text-secondary)', marginBottom: '4px', display: 'block' }}>Allowed Distance (Meters)</label>
                        <input type="number" min="10" disabled={!isEditingProfile} className="ceo-form-input" placeholder="e.g. 300" required value={profileData.allowed_radius || '300'} onChange={(e) => setProfileData({ ...profileData, allowed_radius: e.target.value })} />
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', marginTop: '8px', marginBottom: 0 }}>These coordinates and distance will be used to automatically mark employee attendance as "Office" or "WFH".</p>
                  </div>

                  {isEditingProfile && (
                    <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--ceo-border)', paddingTop: '24px', marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button type="button" className="ceo-btn" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                      <button type="submit" className="ceo-btn ceo-btn-primary" disabled={isSaving} style={{ padding: '10px 24px', fontSize: '15px' }}>
                        {isSaving ? <Clock size={18} className="spin" /> : <Save size={18} />}
                        {isSaving ? 'Saving Changes...' : 'Save Configuration'}
                      </button>
                    </div>
                  )}

                </form>
              </div>
            </>
          )}

          {/* DEPARTMENTS TAB */}
          {activeTab === 'departments' && (
            <>
              <div className="ceo-command-header">
                <div className="ceo-typography-card-title"><Network size={20} color="var(--ceo-primary)" /> Organization Chart</div>
                <button className="ceo-btn ceo-btn-primary" onClick={() => handleDeptAdd(null)}><Plus size={16} /> Add Dept</button>
              </div>
              <div className="ceo-command-content" style={{ padding: '32px' }}>
                <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column' }}>
                  {deptTree.map(dept => (
                    <DeptTreeNode
                      key={dept.id}
                      dept={dept}
                      onAdd={handleDeptAdd}
                      onEdit={handleDeptEdit}
                      onDelete={handleDeptDelete}
                    />
                  ))}
                  {deptTree.length === 0 && <div style={{ color: 'var(--ceo-text-muted)', textAlign: 'center', padding: '40px' }}>No departments found. Add a root department.</div>}
                </div>
              </div>
            </>
          )}

          {/* DESIGNATIONS TAB */}
          {activeTab === 'designations' && (
            <>
              <div className="ceo-command-header">
                <div className="ceo-typography-card-title"><Briefcase size={20} color="var(--ceo-primary)" /> Designations Matrix</div>
                <button className="ceo-btn ceo-btn-primary" onClick={() => handleDesigAddEdit()}><Plus size={16} /> Create Designation</button>
              </div>
              <div className="ceo-command-content" style={{ padding: 0 }}>
                <table className="ceo-erp-table">
                  <thead>
                    <tr>
                      <th>Designation Name</th>
                      <th>Department</th>
                      <th>Headcount</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {designations.slice((desigPage - 1) * 8, desigPage * 8).map(des => (
                      <tr key={des.id}>
                        <td style={{ fontWeight: 600 }}>{des.name}</td>
                        <td>{des.dept}</td>
                        <td>{des.count}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="ceo-btn" style={{ padding: '6px', marginRight: '8px' }} onClick={() => handleDesigAddEdit(des)}><Edit2 size={14} /></button>
                          <button className="ceo-btn" style={{ padding: '6px' }} onClick={() => handleDesigDelete(des.id)}><Trash2 size={14} color="var(--ceo-danger)" /></button>
                        </td>
                      </tr>
                    ))}
                    {designations.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--ceo-text-muted)' }}>No designations available.</td></tr>}
                  </tbody>
                </table>
                {designations.length > 8 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', padding: '16px', borderTop: '1px solid var(--ceo-border)' }}>
                    <button 
                      className="ceo-btn" 
                      onClick={() => setDesigPage(p => Math.max(1, p - 1))} 
                      disabled={desigPage === 1}
                      style={{ background: '#FFF' }}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: '14px', color: 'var(--ceo-text-secondary)', padding: '0 8px' }}>
                      Page {desigPage} of {Math.ceil(designations.length / 8)}
                    </span>
                    <button 
                      className="ceo-btn" 
                      onClick={() => setDesigPage(p => Math.min(Math.ceil(designations.length / 8), p + 1))} 
                      disabled={desigPage === Math.ceil(designations.length / 8)}
                      style={{ background: '#FFF' }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* WORKING HOURS TAB */}
          {activeTab === 'hours' && (
            <>
              <div className="ceo-command-header">
                <div className="ceo-typography-card-title"><Clock size={20} color="var(--ceo-primary)" /> Shift Timings</div>
                <button className="ceo-btn ceo-btn-primary" onClick={() => handleShiftAddEdit()}><Plus size={16} /> Add New Shift</button>
              </div>
              <div className="ceo-command-content" style={{ padding: 0 }}>
                <table className="ceo-erp-table">
                  <thead>
                    <tr>
                      <th>Shift Name</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Working Days</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map(shift => (
                      <tr key={shift.id}>
                        <td style={{ fontWeight: 600 }}>{shift.name}</td>
                        <td>{shift.start_time}</td>
                        <td>{shift.end_time}</td>
                        <td>{shift.days}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="ceo-btn" style={{ padding: '6px', marginRight: '8px' }} onClick={() => handleShiftAddEdit(shift)}><Edit2 size={14} /></button>
                          <button className="ceo-btn" style={{ padding: '6px' }} onClick={() => handleShiftDelete(shift.id)}><Trash2 size={14} color="var(--ceo-danger)" /></button>
                        </td>
                      </tr>
                    ))}
                    {shifts.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--ceo-text-muted)' }}>No shifts available.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* HOLIDAYS TAB */}
          {activeTab === 'holidays' && (
            <>
              <div className="ceo-command-header">
                <div className="ceo-typography-card-title"><CalendarDays size={20} color="var(--ceo-primary)" /> Company Holidays</div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '4px' }}>
                    <button className={`ceo-btn ${holidayView === 'list' ? 'ceo-btn-primary' : ''}`} style={{ padding: '6px 12px', border: 'none', background: holidayView === 'list' ? 'var(--ceo-primary)' : 'transparent', color: holidayView === 'list' ? '#fff' : 'var(--ceo-text-secondary)', borderRadius: '6px' }} onClick={() => setHolidayView('list')}>List</button>
                    <button className={`ceo-btn ${holidayView === 'calendar' ? 'ceo-btn-primary' : ''}`} style={{ padding: '6px 12px', border: 'none', background: holidayView === 'calendar' ? 'var(--ceo-primary)' : 'transparent', color: holidayView === 'calendar' ? '#fff' : 'var(--ceo-text-secondary)', borderRadius: '6px' }} onClick={() => setHolidayView('calendar')}>Calendar</button>
                  </div>
                  <button className="ceo-btn ceo-btn-primary" onClick={() => handleHolidayAddEdit()}><Plus size={16} /> Add Holiday</button>
                </div>
              </div>
              <div className="ceo-command-content" style={{ padding: 0 }}>
                {holidayView === 'list' ? (
                  <table className="ceo-erp-table">
                    <thead>
                      <tr>
                        <th>Holiday Name</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holidays.map(hol => (
                        <tr key={hol.id}>
                          <td style={{ fontWeight: 600 }}>{hol.name}</td>
                          <td>{hol.date}</td>
                          <td>
                            <span className={`ceo-badge ${hol.type === 'Mandatory' ? 'success' : 'neutral'}`}>{hol.type}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="ceo-btn" style={{ padding: '6px', marginRight: '8px' }} onClick={() => handleHolidayAddEdit(hol)}><Edit2 size={14} /></button>
                            <button className="ceo-btn" style={{ padding: '6px' }} onClick={() => handleHolidayDelete(hol.id)}><Trash2 size={14} color="var(--ceo-danger)" /></button>
                          </td>
                        </tr>
                      ))}
                      {holidays.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--ceo-text-muted)' }}>No holidays available.</td></tr>}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '24px' }}>
                    <HolidayCalendar 
                      holidays={holidays}
                      calMonth={calMonth}
                      setCalMonth={setCalMonth}
                      calYear={calYear}
                      setCalYear={setCalYear}
                      onEdit={handleHolidayAddEdit}
                    />
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
