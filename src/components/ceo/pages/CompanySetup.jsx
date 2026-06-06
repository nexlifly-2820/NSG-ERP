import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, Network, Briefcase, Clock, CalendarDays, Plus, 
  Trash2, Edit2, Save, AlertCircle, ChevronDown, ChevronRight, Upload,
  CheckCircle, Users, Settings, Filter, X
} from 'lucide-react';
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

const initialDeptTree = [
  { id: 1, name: 'Executive', headcount: 4, children: [] },
  { id: 2, name: 'Technology', headcount: 145, children: [
      { id: 21, name: 'Engineering', headcount: 100, children: [
        { id: 211, name: 'Frontend', headcount: 40, children: [] },
        { id: 212, name: 'Backend', headcount: 60, children: [] }
      ]},
      { id: 22, name: 'Product', headcount: 45, children: [] }
    ]
  },
  { id: 3, name: 'Sales & Marketing', headcount: 80, children: [
      { id: 31, name: 'Inbound Sales', headcount: 50, children: [] },
      { id: 32, name: 'Field Marketing', headcount: 30, children: [] }
    ]
  }
];

const initialDesignations = [
  { id: 1, name: 'Software Engineer', dept: 'Engineering', level: 'L3', count: 45 },
  { id: 2, name: 'Senior Product Manager', dept: 'Product', level: 'L5', count: 12 },
  { id: 3, name: 'Account Executive', dept: 'Inbound Sales', level: 'L2', count: 30 },
  { id: 4, name: 'VP of Technology', dept: 'Executive', level: 'L8', count: 1 },
];

const initialShifts = [
  { id: 1, name: 'General Shift', start: '09:00 AM', end: '06:00 PM', days: 'Mon-Fri' },
  { id: 2, name: 'US Support Shift', start: '06:00 PM', end: '03:00 AM', days: 'Mon-Fri' },
];

const initialHolidays = [
  { id: 1, name: 'New Year', date: 'Jan 1, 2026', type: 'Mandatory' },
  { id: 2, name: 'Republic Day', date: 'Jan 26, 2026', type: 'Mandatory' },
  { id: 3, name: 'Holi', date: 'Mar 14, 2026', type: 'Optional' },
  { id: 4, name: 'Independence Day', date: 'Aug 15, 2026', type: 'Mandatory' },
];

// ==========================================
// CUSTOM COMPONENTS
// ==========================================

const CustomModal = ({ isOpen, title, fields, onSave, onClose }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#FFF', padding: '32px', borderRadius: '16px', width: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>{title}</div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--ceo-text-muted)"/></button>
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
                  {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
        <span className="ceo-badge neutral" style={{ marginRight: '16px', fontSize: '11px' }}><Users size={12} style={{marginRight:4}}/>{dept.headcount} EMP</span>
        
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          opacity: 1, 
          transition: 'opacity 0.2s',
          marginLeft: 'auto'
        }}>
          <button className="ceo-btn" style={{ padding: '6px', background: '#FFF' }} title="Add Sub-Department" onClick={() => onAdd(dept.id)}>
            <Plus size={14} color="var(--ceo-primary)" />
          </button>
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
    fy: 'apr',
    currency: 'inr'
  });
  const [logoFile, setLogoFile] = useState(null);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [modalConfig, setModalConfig] = useState(null);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem('nsg_jwt_token');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // ─── API Integration ──────────────────────────────────────────────────────────

  const fetchSettings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ceo-portal/configs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const configs = await res.json();
        
        setProfileData({
          name: configs.company_name || 'NSG Technologies Pvt Ltd',
          gst: configs.company_gst || '27AADCN4521E1Z8',
          cin: configs.company_cin || 'U74900MH2010PTC123456',
          address: configs.company_address || 'Unit 401, Mindspace IT Park, Malad West, Mumbai, Maharashtra 400064',
          fy: configs.company_fy || 'apr',
          currency: configs.company_currency || 'inr'
        });

        if (configs.company_logo) {
          setLogoFile(configs.company_logo);
        }

        if (configs.department_tree) {
          try {
            setDeptTree(JSON.parse(configs.department_tree));
          } catch (e) {
            console.error("Error parsing department tree", e);
          }
        }

        if (configs.designation_list) {
          try {
            setDesignations(JSON.parse(configs.designation_list));
          } catch (e) {
            console.error("Error parsing designations", e);
          }
        }

        if (configs.working_hours_shifts) {
          try {
            setShifts(JSON.parse(configs.working_hours_shifts));
          } catch (e) {
            console.error("Error parsing shifts", e);
          }
        }

        if (configs.company_holidays) {
          try {
            setHolidays(JSON.parse(configs.company_holidays));
          } catch (e) {
            console.error("Error parsing holidays", e);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
      showToast("Error loading company configurations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSetting = async (key, value) => {
    if (!token) return false;
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const p1 = saveSetting('company_name', profileData.name);
    const p2 = saveSetting('company_gst', profileData.gst);
    const p3 = saveSetting('company_cin', profileData.cin);
    const p4 = saveSetting('company_address', profileData.address);
    const p5 = saveSetting('company_fy', profileData.fy);
    const p6 = saveSetting('company_currency', profileData.currency);
    
    const results = await Promise.all([p1, p2, p3, p4, p5, p6]);
    setIsSaving(false);
    if (results.every(r => r)) {
      showToast('Profile configuration saved securely.');
    } else {
      showToast('Error saving profile settings.');
    }
  };

  const handleLogoUpload = async (e) => {
    if(e.target.files && e.target.files[0]){
      const fileName = e.target.files[0].name;
      setIsSaving(true);
      const success = await saveSetting('company_logo', fileName);
      setIsSaving(false);
      if (success) {
        setLogoFile(fileName);
        showToast('Logo file selected and saved: ' + fileName);
      } else {
        showToast('Error uploading logo');
      }
    }
  };

  // --- Department Tree Helpers ---
  const addNodeToTree = (tree, parentId, newNode) => {
    if (!parentId) return [...tree, newNode];
    return tree.map(node => {
      if (node.id == parentId) return { ...node, children: [...(node.children || []), newNode] };
      if (node.children && node.children.length > 0) return { ...node, children: addNodeToTree(node.children, parentId, newNode) };
      return node;
    });
  };
  const editNodeInTree = (tree, id, newName) => {
    return tree.map(node => {
      if (node.id == id) return { ...node, name: newName };
      if (node.children && node.children.length > 0) return { ...node, children: editNodeInTree(node.children, id, newName) };
      return node;
    });
  };
  const deleteNodeFromTree = (tree, id) => {
    return tree.filter(node => node.id != id).map(node => {
      if (node.children && node.children.length > 0) return { ...node, children: deleteNodeFromTree(node.children, id) };
      return node;
    });
  };

  const handleDeptAdd = (parentId = null) => {
    setModalConfig({
      title: parentId ? 'Add Sub-Department' : 'Add Root Department',
      fields: [{ name: 'name', label: 'Department Name' }],
      onSave: async (data) => {
        const newNode = { id: Date.now(), name: data.name, headcount: 0, children: [] };
        const updatedTree = addNodeToTree(deptTree, parentId, newNode);
        setDeptTree(updatedTree);
        setModalConfig(null);
        const success = await saveSetting('department_tree', JSON.stringify(updatedTree));
        if (success) showToast('Department added and saved');
        else showToast('Department added locally but failed to save');
      }
    });
  };

  const handleDeptEdit = (dept) => {
    setModalConfig({
      title: 'Edit Department',
      fields: [{ name: 'name', label: 'Department Name', defaultValue: dept.name }],
      onSave: async (data) => {
        const updatedTree = editNodeInTree(deptTree, dept.id, data.name);
        setDeptTree(updatedTree);
        setModalConfig(null);
        const success = await saveSetting('department_tree', JSON.stringify(updatedTree));
        if (success) showToast('Department updated and saved');
        else showToast('Department updated locally but failed to save');
      }
    });
  };

  const handleDeptDelete = async (id, name) => {
    if(window.confirm(`Are you sure you want to delete ${name}? This will also delete all sub-departments.`)) {
      const updatedTree = deleteNodeFromTree(deptTree, id);
      setDeptTree(updatedTree);
      const success = await saveSetting('department_tree', JSON.stringify(updatedTree));
      if (success) showToast('Department deleted and saved');
      else showToast('Department deleted locally but failed to save');
    }
  };

  const handleDesigAddEdit = (item = null) => {
    setModalConfig({
      title: item ? 'Edit Designation' : 'Create Designation',
      fields: [
        { name: 'name', label: 'Designation Name', defaultValue: item?.name },
        { name: 'dept', label: 'Department', defaultValue: item?.dept },
        { name: 'level', label: 'Band Level', defaultValue: item?.level }
      ],
      onSave: async (data) => {
        let updatedDesignations;
        if(item) {
          updatedDesignations = designations.map(d => d.id === item.id ? { ...d, count: item.count, ...data } : d);
        } else {
          updatedDesignations = [...designations, { id: Date.now(), count: 0, ...data }];
        }
        setDesignations(updatedDesignations);
        setModalConfig(null);
        const success = await saveSetting('designation_list', JSON.stringify(updatedDesignations));
        if (success) showToast(item ? 'Designation updated' : 'Designation created');
        else showToast('Designation changes failed to save');
      }
    });
  };

  const handleDesigDelete = async (id) => {
    if(window.confirm('Delete designation?')) {
      const updatedDesignations = designations.filter(d => d.id !== id);
      setDesignations(updatedDesignations);
      const success = await saveSetting('designation_list', JSON.stringify(updatedDesignations));
      if (success) showToast('Designation deleted');
      else showToast('Designation failed to delete');
    }
  };

  const handleShiftAddEdit = (item = null) => {
    setModalConfig({
      title: item ? 'Edit Shift' : 'Add Shift',
      fields: [
        { name: 'name', label: 'Shift Name', defaultValue: item?.name },
        { name: 'start', label: 'Start Time (e.g. 09:00 AM)', defaultValue: item?.start },
        { name: 'end', label: 'End Time (e.g. 06:00 PM)', defaultValue: item?.end },
        { name: 'days', label: 'Working Days', defaultValue: item?.days || 'Mon-Fri' }
      ],
      onSave: async (data) => {
        let updatedShifts;
        if(item) {
          updatedShifts = shifts.map(s => s.id === item.id ? { ...s, ...data } : s);
        } else {
          updatedShifts = [...shifts, { id: Date.now(), ...data }];
        }
        setShifts(updatedShifts);
        setModalConfig(null);
        const success = await saveSetting('working_hours_shifts', JSON.stringify(updatedShifts));
        if (success) showToast(item ? 'Shift updated' : 'Shift added');
        else showToast('Shift changes failed to save');
      }
    });
  };

  const handleShiftDelete = async (id) => {
    if(window.confirm('Delete shift?')) {
      const updatedShifts = shifts.filter(s => s.id !== id);
      setShifts(updatedShifts);
      const success = await saveSetting('working_hours_shifts', JSON.stringify(updatedShifts));
      if (success) showToast('Shift deleted');
      else showToast('Shift failed to delete');
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
        let updatedHolidays;
        if(item) {
          updatedHolidays = holidays.map(h => h.id === item.id ? { ...h, ...data } : h);
        } else {
          updatedHolidays = [...holidays, { id: Date.now(), ...data }];
        }
        setHolidays(updatedHolidays);
        setModalConfig(null);
        const success = await saveSetting('company_holidays', JSON.stringify(updatedHolidays));
        if (success) showToast(item ? 'Holiday updated' : 'Holiday added');
        else showToast('Holiday changes failed to save');
      }
    });
  };

  const handleHolidayDelete = async (id) => {
    if(window.confirm('Delete holiday?')) {
      const updatedHolidays = holidays.filter(h => h.id !== id);
      setHolidays(updatedHolidays);
      const success = await saveSetting('company_holidays', JSON.stringify(updatedHolidays));
      if (success) showToast('Holiday deleted');
      else showToast('Holiday failed to delete');
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
              <div className="ceo-command-header">
                <div className="ceo-typography-card-title"><Building2 size={20} color="var(--ceo-primary)" /> Legal Profile</div>
              </div>
              <div className="ceo-command-content" style={{ padding: '32px' }}>
                <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '800px' }}>
                  
                  {/* Logo Upload */}
                  <div style={{ gridColumn: '1 / -1', marginBottom: '8px', display: 'flex', gap: '32px', alignItems: 'center', padding: '24px', background: 'var(--ceo-bg)', borderRadius: '12px', border: '1px dashed var(--ceo-border)' }}>
                    <div style={{ width: 90, height: 90, borderRadius: 12, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <Building2 size={40} color="var(--ceo-primary)" opacity={0.8} />
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
                    <input className="ceo-form-input" required value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} />
                  </div>
                  
                  <div className="ceo-form-group">
                    <label>GST Number</label>
                    <input className="ceo-form-input" required value={profileData.gst} onChange={(e) => setProfileData({...profileData, gst: e.target.value})} />
                  </div>
                  
                  <div className="ceo-form-group">
                    <label>CIN</label>
                    <input className="ceo-form-input" required value={profileData.cin} onChange={(e) => setProfileData({...profileData, cin: e.target.value})} />
                  </div>
                  
                  <div className="ceo-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Registered Address</label>
                    <textarea className="ceo-form-input" required rows={3} value={profileData.address || ''} onChange={(e) => setProfileData({...profileData, address: e.target.value})} />
                  </div>
                  
                  <div className="ceo-form-group">
                    <label>Financial Year Start</label>
                    <select className="ceo-form-input" value={profileData.fy || 'apr'} onChange={(e) => setProfileData({...profileData, fy: e.target.value})}>
                      <option value="apr">April (Recommended)</option>
                      <option value="jan">January</option>
                      <option value="jul">July</option>
                    </select>
                  </div>
                  
                  <div className="ceo-form-group">
                    <label>Default Currency</label>
                    <select className="ceo-form-input" value={profileData.currency || 'inr'} onChange={(e) => setProfileData({...profileData, currency: e.target.value})}>
                      <option value="inr">INR (₹)</option>
                      <option value="usd">USD ($)</option>
                      <option value="eur">EUR (€)</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--ceo-border)', paddingTop: '24px', marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="ceo-btn ceo-btn-primary" disabled={isSaving} style={{ padding: '10px 24px', fontSize: '15px' }}>
                      {isSaving ? <Clock size={18} className="spin" /> : <Save size={18} />} 
                      {isSaving ? 'Saving Changes...' : 'Save Configuration'}
                    </button>
                  </div>

                </form>
              </div>
            </>
          )}

          {/* DEPARTMENTS TAB */}
          {activeTab === 'departments' && (
            <>
              <div className="ceo-command-header">
                <div className="ceo-typography-card-title"><Network size={20} color="var(--ceo-primary)" /> Organization Chart</div>
                <button className="ceo-btn ceo-btn-primary" onClick={() => handleDeptAdd(null)}><Plus size={16} /> Add Root Dept</button>
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
                      <th>Band Level</th>
                      <th>Headcount</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {designations.map(des => (
                      <tr key={des.id}>
                        <td style={{ fontWeight: 600 }}>{des.name}</td>
                        <td>{des.dept}</td>
                        <td><span className="ceo-badge neutral">{des.level}</span></td>
                        <td>{des.count}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="ceo-btn" style={{ padding: '6px', marginRight: '8px' }} onClick={() => handleDesigAddEdit(des)}><Edit2 size={14}/></button>
                          <button className="ceo-btn" style={{ padding: '6px' }} onClick={() => handleDesigDelete(des.id)}><Trash2 size={14} color="var(--ceo-danger)"/></button>
                        </td>
                      </tr>
                    ))}
                    {designations.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--ceo-text-muted)' }}>No designations available.</td></tr>}
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
                        <td>{shift.start}</td>
                        <td>{shift.end}</td>
                        <td>{shift.days}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="ceo-btn" style={{ padding: '6px', marginRight: '8px' }} onClick={() => handleShiftAddEdit(shift)}><Edit2 size={14}/></button>
                          <button className="ceo-btn" style={{ padding: '6px' }} onClick={() => handleShiftDelete(shift.id)}><Trash2 size={14} color="var(--ceo-danger)"/></button>
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
                          <button className="ceo-btn" style={{ padding: '6px', marginRight: '8px' }} onClick={() => handleHolidayAddEdit(hol)}><Edit2 size={14}/></button>
                          <button className="ceo-btn" style={{ padding: '6px' }} onClick={() => handleHolidayDelete(hol.id)}><Trash2 size={14} color="var(--ceo-danger)"/></button>
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
