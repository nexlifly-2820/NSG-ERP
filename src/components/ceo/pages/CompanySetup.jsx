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

const CustomModal = ({ isOpen, title, fields, onSave, onClose }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#FFF', padding: '32px', borderRadius: '16px', width: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>{title}</div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--ceo-text-muted)" /></button>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const data = {};
          fields.forEach(f => data[f.name] = formData.get(f.name));
          onSave(data);
        }}>
          {fields.map(f => (
            <div key={f.name} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--ceo-text-secondary)' }}>{f.label}</label>
              {f.type === 'select' ? (
                <select name={f.name} defaultValue={f.defaultValue || ''} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }} required>
                  {f.options.map(opt => {
                    if (typeof opt === 'object') {
                      return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                    }
                    return <option key={opt} value={opt}>{opt}</option>;
                  })}
                </select>
              ) : (
                <input name={f.name} type={f.type || 'text'} defaultValue={f.defaultValue || ''} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }} required />
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


// ==========================================
// MAIN PAGE (LIVE DATA CONNECTED)
// ==========================================
export default function CompanySetup() {
  const [activeTab, setActiveTab] = useState('profile');
  const { refreshCompanyConfig } = useCompany();
  
  // Database States
  const [deptTree, setDeptTree] = useState(initialDeptTree);
  const [designations, setDesignations] = useState(initialDesignations);
  const [shifts, setShifts] = useState(initialShifts);
  const [holidays, setHolidays] = useState(initialHolidays);
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
  const [toastMsg, setToastMsg] = useState('');
  const [modalConfig, setModalConfig] = useState(null);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem('nsg_jwt_token');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

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
      showToast('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setProfileData({
          ...profileData,
          office_latitude: position.coords.latitude.toFixed(6),
          office_longitude: position.coords.longitude.toFixed(6)
        });
        showToast('Office GPS location captured!');
      },
      (error) => {
        showToast('Failed to get GPS location. Please allow location access.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
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
      showToast('Profile configuration saved securely.');
      refreshCompanyConfig();
    } else {
      showToast('Error saving profile settings.');
    }
  };

  const handleLogoUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileName = file.name;
      setIsSaving(true);

      const formData = new FormData();
      formData.append('file', file);

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
          showToast('Logo file securely uploaded and saved.');
          refreshCompanyConfig();
        } else {
          showToast('Error uploading logo to server.');
        }
      } catch (err) {
        setIsSaving(false);
        showToast('Error connecting to server for upload.');
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
          showToast('Department added');
          fetchDepartments();
        } else showToast('Failed to add department');
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
          showToast('Department updated');
          fetchDepartments();
        } else showToast('Failed to update department');
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
        showToast('Department deleted');
        fetchDepartments();
      } else showToast('Failed to delete department');
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
        { name: 'name', label: 'Designation Name', defaultValue: item?.name },
        { name: 'department_id', label: 'Department', type: 'select', options: flatDepts.map(d => ({ value: `${d.id}:${d.name}`, label: d.name })), defaultValue: item ? `${item.department_id}:${item.dept}` : undefined }
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
          showToast(item ? 'Designation updated' : 'Designation created');
          fetchDesignations();
        } else showToast('Failed to save designation');
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
        showToast('Designation deleted');
        fetchDesignations();
      } else showToast('Failed to delete designation');
    }
  };

  const handleShiftAddEdit = (item = null) => {
    setModalConfig({
      title: item ? 'Edit Shift' : 'Add Shift',
      fields: [
        { name: 'name', label: 'Shift Name', defaultValue: item?.name },
        { name: 'start_time', label: 'Start Time (e.g. 09:00 AM)', defaultValue: item?.start_time },
        { name: 'end_time', label: 'End Time (e.g. 06:00 PM)', defaultValue: item?.end_time },
        { name: 'days', label: 'Working Days', defaultValue: item?.days || 'Mon-Fri' }
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
          showToast(item ? 'Shift updated' : 'Shift added');
          fetchShifts();
        } else showToast('Failed to save shift');
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
        showToast('Shift deleted');
        fetchShifts();
      } else showToast('Failed to delete shift');
    }
  };

  const handleHolidayAddEdit = (item = null) => {
    setModalConfig({
      title: item ? 'Edit Holiday' : 'Add Holiday',
      fields: [
        { name: 'name', label: 'Holiday Name', defaultValue: item?.name },
        { name: 'date', label: 'Date (e.g. Dec 25, 2026)', defaultValue: item?.date },
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
          showToast(item ? 'Holiday updated' : 'Holiday added');
          fetchHolidays();
        } else showToast('Failed to save holiday');
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
        showToast('Holiday deleted');
        fetchHolidays();
      } else showToast('Failed to delete holiday');
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

      {/* GLOBAL TOAST NOTIFICATION */}
      {toastMsg && (
        <div style={{
          position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--ceo-text-primary)', color: '#FFF', padding: '12px 24px',
          borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 100, fontWeight: 500,
          animation: 'fadeInDown 0.3s ease forwards'
        }}>
          <CheckCircle size={18} color="var(--ceo-success)" />
          {toastMsg}
        </div>
      )}

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
                <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(e); setIsEditingProfile(false); }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '800px' }}>

                  {/* Logo Upload */}
                  <div style={{ gridColumn: '1 / -1', marginBottom: '8px', display: 'flex', gap: '32px', alignItems: 'center', padding: '24px', background: 'var(--ceo-bg)', borderRadius: '12px', border: '1px dashed var(--ceo-border)' }}>
                    <div style={{ width: 90, height: 90, borderRadius: 12, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
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
                    </div>
                  </div>

                  <div className="ceo-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Company Name (Legal)</label>
                    <input className="ceo-form-input" required disabled={!isEditingProfile} value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} />
                  </div>

                  <div className="ceo-form-group">
                    <label>GST Number</label>
                    <input className="ceo-form-input" required disabled={!isEditingProfile} value={profileData.gst} onChange={(e) => setProfileData({ ...profileData, gst: e.target.value })} />
                  </div>

                  <div className="ceo-form-group">
                    <label>CIN</label>
                    <input className="ceo-form-input" required disabled={!isEditingProfile} value={profileData.cin} onChange={(e) => setProfileData({ ...profileData, cin: e.target.value })} />
                  </div>
                  
                  <div className="ceo-form-group">
                    <label>Employee ID Prefix</label>
                    <input className="ceo-form-input" required disabled={!isEditingProfile} value={profileData.emp_id_prefix} onChange={(e) => setProfileData({...profileData, emp_id_prefix: e.target.value})} />
                  </div>
                  
                  <div className="ceo-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Registered Address</label>
                    <textarea className="ceo-form-input" required disabled={!isEditingProfile} rows={3} value={profileData.address || ''} onChange={(e) => setProfileData({ ...profileData, address: e.target.value })} />
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
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
                    {designations.map(des => (
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
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="ceo-btn ceo-btn-primary" onClick={() => handleHolidayAddEdit()}><Plus size={16} /> Add Holiday</button>
                </div>
              </div>
              <div className="ceo-command-content" style={{ padding: 0 }}>
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
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
