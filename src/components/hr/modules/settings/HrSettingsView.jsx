import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, MapPin, Loader, CheckCircle2, Building2, Save, Plus, Trash2, Sliders } from 'lucide-react';

export function HrSettingsView() {
  const [geofence, setGeofence] = useState({
    enabled: true,
    latitude: 12.9716,
    longitude: 77.5946,
    radius: 100
  });

  const [leavePolicies, setLeavePolicies] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '' });

  const [gpsLoading, setGpsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handlePolicyChange = (id, newMax) => {
    setLeavePolicies(prev => prev.map(p => p.id === id ? { ...p, max_balance: Number(newMax) } : p));
  };

  const handleSavePolicies = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      await Promise.all(leavePolicies.map(p =>
        fetch(`/api/hr-portal/leave/policies/${p.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ max_balance: p.max_balance, carryover_days: p.carryover_days })
        })
      ));
      if (window.toast) window.toast.success('Leave policies saved successfully!');
      else alert('Leave policies saved successfully!');
    } catch (err) { console.error(err); }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) return;
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/hr-portal/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newHoliday.name, date: newHoliday.date, type: 'national' })
      });
      if (res.ok) {
        const saved = await res.json();
        setHolidays(prev => [...prev, saved]);
        setNewHoliday({ name: '', date: '' });
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      await fetch(`/api/hr-portal/holidays/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setHolidays(prev => prev.filter(h => h.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleSaveHolidays = () => {
    // Holidays are saved individually via handleAddHoliday — this is now a no-op UI confirmation
    if (window.toast) window.toast.success('Holiday calendar is up to date!');
    else alert('Holiday calendar is up to date!');
  };

  // --- SCHEMA BUILDER ---
  const [schemas, setSchemas] = useState({});
  const [selectedDept, setSelectedDept] = useState("IT");
  const [newField, setNewField] = useState({ name: '', label: '', type: 'text' });
  const [schemaLoading, setSchemaLoading] = useState(false);

  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchSchemas();
    fetchLeavePolicies();
    fetchHolidays();
    fetchDepartments();
  }, []);

  const fetchLeavePolicies = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/hr-portal/leave/policies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setLeavePolicies(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchHolidays = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/hr-portal/holidays', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setHolidays(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/hr-portal/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
        if (data.length > 0 && !data.some(d => d.name === "IT")) {
          setSelectedDept(data[0].name);
        }
      }
    } catch (err) { console.error(err); }
  };



  const fetchSchemas = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/hr-portal/schemas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSchemas(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddField = () => {
    if (!newField.label) {
      if (window.toast) window.toast.error("Please enter a Display Label before adding a field.");
      else alert("Please enter a Display Label before adding a field.");
      return;
    }
    if (!newField.name) {
      if (window.toast) window.toast.error("Please enter a DB Field Name before adding a field.");
      else alert("Please enter a DB Field Name before adding a field.");
      return;
    }
    const deptSchema = schemas[selectedDept] || [];
    setSchemas({
      ...schemas,
      [selectedDept]: [...deptSchema, { ...newField }]
    });
    setNewField({ name: '', label: '', type: 'text' });
  };

  const handleDeleteField = (idx) => {
    const deptSchema = [...(schemas[selectedDept] || [])];
    deptSchema.splice(idx, 1);
    setSchemas({
      ...schemas,
      [selectedDept]: deptSchema
    });
  };

  const handleSaveSchema = async () => {
    setSchemaLoading(true);
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/schemas/${selectedDept}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ schema_fields: schemas[selectedDept] || [] })
      });
      if (res.ok) {
        if (window.toast) window.toast.success(`${selectedDept} Schema saved successfully!`);
        else alert(`${selectedDept} Schema saved successfully!`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (window.toast) window.toast.error(`Failed to save schema: ${errorData.detail || res.statusText}`);
        else alert(`Failed to save schema: ${errorData.detail || res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      if (window.toast) window.toast.error("Network error while saving schema");
    }
    setSchemaLoading(false);
  };
  // ----------------------

  useEffect(() => {
    const fetchGeofenceSettings = async () => {
      const token = localStorage.getItem('nsg_jwt_token');
      try {
        const res = await fetch('/api/attendance/geofence-settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setGeofence({
            enabled: data.enabled,
            latitude: data.latitude,
            longitude: data.longitude,
            radius: data.radius
          });
        }
      } catch (err) {
        console.error("Failed to fetch geofence settings", err);
      }
    };
    fetchGeofenceSettings();
  }, []);



  const handleSaveGeofence = async () => {
    const token = localStorage.getItem('nsg_jwt_token');
    let success = true;
    if (token) {
      try {
        const res = await fetch('/api/attendance/geofence-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            enabled: geofence.enabled,
            latitude: geofence.latitude,
            longitude: geofence.longitude,
            radius: geofence.radius
          })
        });
        if (!res.ok) success = false;
      } catch (err) {
        console.error("Failed to save geofence settings to backend", err);
        success = false;
      }
    } else {
      success = false;
    }

    if (success) {
      if (window.toast) {
        window.toast.success("Geofence settings saved successfully!");
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } else {
      if (window.toast) {
        window.toast.error("Failed to save geofence settings.");
      } else {
        alert("Failed to save geofence settings.");
      }
    }
  };

  const handleLocateOffice = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeofence(prev => ({
          ...prev,
          latitude: parseFloat(position.coords.latitude.toFixed(6)),
          longitude: parseFloat(position.coords.longitude.toFixed(6))
        }));
        setGpsLoading(false);
      },
      (error) => {
        if (window.toast) {
          window.toast.error("Failed to retrieve current location. Please ensure location permissions are enabled in your browser.");
        } else {
          alert("Failed to retrieve current location. Please ensure location permissions are enabled in your browser.");
        }
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>HR Settings</h1>
        </div>
      </div>

      {/* Custom Task Forms (Schema Builder) */}
      <div className="card" style={{ borderLeft: '4px solid #8b5cf6', width: '100%', marginTop: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', border: 'none', padding: 0 }}>
            <Sliders size={20} style={{ color: '#8b5cf6' }} /> Custom Task Forms (Schema Builder)
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                value={selectedDept} 
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 14px', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
              >
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
          Dynamically manage custom input fields for <b>{selectedDept}</b> employee task submissions. These fields will be generated automatically in the Employee Tasks UI without requiring code changes.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {/* Current Schema Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(!schemas[selectedDept] || schemas[selectedDept].length === 0) ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No custom fields defined for {selectedDept}.</div>
            ) : (
              schemas[selectedDept].map((f, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', fontSize: '13px', minWidth: '150px' }}>{f.label}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '4px' }}>name: {f.name}</span>
                    <span style={{ fontSize: '11px', color: '#8b5cf6', backgroundColor: '#8b5cf620', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>{f.type}</span>
                  </div>
                  <button onClick={() => handleDeleteField(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add New Field */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Display Label</label>
              <input 
                type="text" 
                placeholder="e.g. Deal Value" 
                value={newField.label}
                onChange={e => setNewField({...newField, label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '6px', outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>DB Field Name (Auto)</label>
              <input 
                type="text" 
                placeholder="deal_value" 
                value={newField.name}
                onChange={e => setNewField({...newField, name: e.target.value})}
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '6px', outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Input Type</label>
              <select 
                value={newField.type}
                onChange={e => setNewField({...newField, type: e.target.value})}
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '6px', outline: 'none' }}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="textarea">Textarea (Long)</option>
                <option value="url">URL / Link</option>
                <option value="date">Date</option>
                <option value="file">File / Image Upload</option>
              </select>
            </div>
            <button onClick={handleAddField} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '6px', cursor: 'pointer', height: '42px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', transition: 'background-color 0.2s' }}>
              <Plus size={16} /> Add Field
            </button>
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={handleSaveSchema} 
            disabled={schemaLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', fontSize: '13px', backgroundColor: '#8b5cf6', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '6px' }}
          >
            {schemaLoading ? <Loader size={16} className="att-spin" /> : <Save size={16} />}
            {schemaLoading ? 'Saving...' : `Save ${selectedDept} Schema`}
          </button>
        </div>
      </div>


    </div>
  );
}

// ==========================================
// 17. MESSAGING & MEET VIEW
