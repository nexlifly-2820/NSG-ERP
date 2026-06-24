import React, { useState, useMemo, useEffect } from 'react';
import { Target, Users, TrendingUp, TrendingDown, CheckCircle2, Link as LinkIcon, Edit2, X, Filter, BarChart2, AlertCircle, Plus, Trash2, ChevronDown } from 'lucide-react';
import '../CEO.css';

const ProgressRing = ({ progress, color, size = 48, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle stroke="var(--ceo-divider)" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
        <circle stroke={color} strokeWidth={strokeWidth} strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset} strokeLinecap="round" fill="transparent" r={radius} cx={size / 2} cy={size / 2} style={{ transition: 'stroke-dashoffset 0.5s ease-out' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
        {progress}%
      </div>
    </div>
  );
};

const CustomSelect = ({ name, options, defaultValue, placeholder, error, onChange, onFocus, disabled, title, containerStyle, innerStyle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(defaultValue || '');
  
  const handleSelect = (optVal) => { setValue(optVal); setIsOpen(false); if(onChange) onChange(optVal); };
  
  const selectedOpt = options.find(o => (typeof o === 'object' ? o.value === value : o === value));
  const displayLabel = selectedOpt ? (typeof selectedOpt === 'object' ? selectedOpt.label : selectedOpt) : placeholder;

  return (
    <div style={{ position: 'relative', ...containerStyle }} tabIndex={disabled ? undefined : -1} title={title} onBlur={(e) => {
      if (!disabled && !e.currentTarget.contains(e.relatedTarget)) {
        setIsOpen(false);
        if (onFocus) onFocus(value);
      }
    }}>
      <div 
        onClick={() => { if (!disabled) { setIsOpen(!isOpen); if (onFocus) onFocus(value); } }}
        className="ceo-form-input"
        style={{ width: '100%', padding: '10px 12px', height: '40px', background: '#FFF', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...innerStyle }}
      >
        <span style={{ color: value ? '#000' : '#9ca3af' }}>{displayLabel}</span>
        <ChevronDown size={16} color="#64748b" />
      </div>
      
      {isOpen && !disabled && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#FFF', border: '1px solid var(--ceo-border)', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '200px', overflowY: 'auto' }}>
          {options.map((opt, i) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <div 
                key={i} 
                onClick={() => handleSelect(optVal)}
                style={{ padding: '10px 14px', cursor: 'pointer', background: value === optVal ? '#F1F5F9' : '#FFF', borderBottom: i < options.length - 1 ? '1px solid var(--ceo-border)' : 'none', fontSize: '13px', fontWeight: 500 }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = value === optVal ? '#F1F5F9' : '#FFF'}
              >
                {optLabel}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function StrategyOKRs() {
  const [okrs, setOkrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState('Q2');
  const [year, setYear] = useState('2026');

  // Add/Edit State
  const [isAdding, setIsAdding] = useState(false);
  const [okrErrors, setOkrErrors] = useState({ krs: [] });
  const [newOkr, setNewOkr] = useState({ title: '', owner: '', quarter: '', year: '', krs: [{ title: '', target: '', unit: '' }] });

  const fetchOkrs = async () => {
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch('/api/ceo-portal/okrs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOkrs(data);
      } else {
        setOkrs([]);
      }
    } catch (e) {
      console.error("Failed to fetch OKRs", e);
      setOkrs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOkrs();
  }, []);
  
  // Filtering logic
  const filteredOkrs = useMemo(() => {
    return okrs.filter(o => o.quarter === quarter && o.year === year);
  }, [okrs, quarter, year]);

  const [selectedOkrId, setSelectedOkrId] = useState(null);
  
  useEffect(() => {
    if (filteredOkrs.length > 0 && !filteredOkrs.find(o => o.id === selectedOkrId)) {
      setSelectedOkrId(filteredOkrs[0].id);
    } else if (filteredOkrs.length === 0) {
      setSelectedOkrId(null);
    }
  }, [filteredOkrs, selectedOkrId]);

  const selectedOkr = filteredOkrs.find(o => o.id === selectedOkrId);

  // Dynamic KPI Stats based on real filters
  const totalObjs = filteredOkrs.length;
  const atRiskObjs = filteredOkrs.filter(o => o.status !== 'On Track').length;
  const totalKrs = filteredOkrs.reduce((acc, o) => acc + o.krs.length, 0);
  const avgCompletion = totalObjs > 0 ? Math.round(filteredOkrs.reduce((acc, o) => acc + o.progress, 0) / totalObjs) : 0;
  
  const cascadedKrs = filteredOkrs.reduce((acc, o) => acc + o.krs.filter(k => k.sprintLink).length, 0);
  const alignmentPct = totalKrs > 0 ? Math.round((cascadedKrs / totalKrs) * 100) : 100;
  const riskSub = atRiskObjs > 0 ? 'Multiple At Risk' : 'Stable';

  const kpiStats = [
    { label: 'Strategic Objectives', val: totalObjs.toString(), sub: `${atRiskObjs} At Risk/Off Track`, status: atRiskObjs > 0 ? 'warning' : 'success' },
    { label: 'Active Key Results', val: totalKrs.toString(), sub: `${avgCompletion}% Avg Completion`, status: 'primary' },
    { label: 'Organization Alignment', val: `${alignmentPct}%`, sub: 'Target: 95%', status: alignmentPct >= 95 ? 'success' : 'warning' },
    { label: 'Strategic Risk Index', val: atRiskObjs > totalObjs/2 ? 'High' : 'Low', sub: riskSub, status: atRiskObjs > totalObjs/2 ? 'danger' : 'success' },
  ];

  // Inline edit state
  const [editingKrId, setEditingKrId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const getStatusColor = (status) => {
    if (status === 'On Track') return 'var(--ceo-success)';
    if (status === 'At Risk') return 'var(--ceo-warning)';
    return 'var(--ceo-danger)';
  };

  const saveKrProgress = async (krId) => {
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch(`/api/ceo-portal/okrs/key-results/${krId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ current: Number(editValue) })
      });
      if (res.ok) {
        await fetchOkrs();
        if (window.toast) window.toast.success('Key Result progress successfully updated!');
      } else {
        if (window.toast) window.toast.error('Failed to update Key Result progress.');
      }
    } catch (e) {
      console.error("Error updating progress", e);
    } finally {
      setEditingKrId(null);
    }
  };

  const handleCreateOkr = async () => {
    const errors = { krs: [] };
    let hasErr = false;
    
    if (!newOkr.title.trim()) { errors.title = 'Please enter Objective Title.'; hasErr = true; }
    if (!newOkr.owner.trim()) { errors.owner = 'Please enter Owner.'; hasErr = true; }
    if (!newOkr.quarter) { errors.quarter = 'Please select Quarter.'; hasErr = true; }
    if (!newOkr.year) { errors.year = 'Please select Year.'; hasErr = true; }
    
    newOkr.krs.forEach((kr, idx) => {
      const krErr = {};
      if (!kr.title.trim()) { krErr.title = 'Please enter Title.'; hasErr = true; }
      if (!kr.target) { krErr.target = 'Enter Target.'; hasErr = true; }
      if (!kr.unit.trim()) { krErr.unit = 'Enter Unit.'; hasErr = true; }
      if (Object.keys(krErr).length > 0) {
        errors.krs[idx] = krErr;
      }
    });

    if (hasErr) {
      setOkrErrors(errors);
      return;
    }

    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch('/api/ceo-portal/okrs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({...newOkr, krs: newOkr.krs.map(kr => ({...kr, target: Number(kr.target)}))})
      });
      if (res.ok) {
        await fetchOkrs();
        setIsAdding(false);
        setNewOkr({ title: '', owner: '', quarter: '', year: '', krs: [{ title: '', target: '', unit: '' }] });
        if (window.toast) window.toast.success('Strategy OKR successfully created!');
      } else {
        if (window.toast) window.toast.error('Failed to create OKR.');
      }
    } catch (e) {
      console.error("Error creating OKR", e);
    }
  };

  const handleDeleteOkr = async (id) => {
    if (!window.confirm("Are you sure you want to delete this OKR?")) return;
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch(`/api/ceo-portal/okrs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if (selectedOkrId === id) setSelectedOkrId(null);
        await fetchOkrs();
        if (window.toast) window.toast.success('Strategy OKR deleted.');
      }
    } catch (e) {
      console.error("Error deleting OKR", e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px' }}>
      
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="ceo-typography-page-title">Strategy & OKRs</h1>
          <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Monitor top-level objectives, manage key results, and track global execution.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', background: '#FFF', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--ceo-border)', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Filter size={16} color="var(--ceo-text-muted)" />
            <CustomSelect 
              defaultValue={quarter} 
              options={[{value:'Q1',label:'Q1'},{value:'Q2',label:'Q2'},{value:'Q3',label:'Q3'},{value:'Q4',label:'Q4'}]}
              onChange={(val) => setQuarter(val)}
              containerStyle={{ width: '60px' }}
              innerStyle={{ border: 'none', background: 'transparent', padding: '0', height: 'auto', fontWeight: 700 }}
            />
            <div style={{ width: '1px', height: '20px', background: 'var(--ceo-divider)' }}></div>
            <CustomSelect 
              defaultValue={year} 
              options={[
                {value:'2024',label:'2024'},{value:'2025',label:'2025'},{value:'2026',label:'2026'},{value:'2027',label:'2027'},
                {value:'2028',label:'2028'},{value:'2029',label:'2029'},{value:'2030',label:'2030'},{value:'2031',label:'2031'},
                {value:'2032',label:'2032'},{value:'2033',label:'2033'},{value:'2034',label:'2034'},{value:'2035',label:'2035'}
              ]}
              onChange={(val) => setYear(val)}
              containerStyle={{ width: '80px' }}
              innerStyle={{ border: 'none', background: 'transparent', padding: '0', height: 'auto', fontWeight: 700 }}
            />
          </div>
          <button className="ceo-btn" onClick={() => {
            setNewOkr({ title: '', owner: '', quarter: '', year: '', krs: [{ title: '', target: '', unit: '' }] });
            setOkrErrors({ krs: [] });
            setIsAdding(true);
          }}>
            <Plus size={16} style={{ marginRight: '6px' }} /> New OKR
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {kpiStats.map((k, i) => (
          <div key={i} style={{ background: '#FFF', border: '1px solid var(--ceo-border)', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <div style={{ color: 'var(--ceo-text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: 'var(--ceo-text-primary)' }}>{k.val}</div>
            <div style={{ fontSize: '12px', color: `var(--ceo-${k.status})`, fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {k.status === 'success' ? <TrendingUp size={14} /> : k.status === 'danger' ? <TrendingDown size={14} /> : <AlertCircle size={14} />}
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '400px minmax(0, 1fr)',
        gap: '24px',
        flex: 1,
        minHeight: '500px'
      }}>
        
        {/* LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '4px' }}>
          {filteredOkrs.length > 0 ? filteredOkrs.map(okr => (
            <div key={okr.id} onClick={() => setSelectedOkrId(okr.id)} style={{
              background: selectedOkrId === okr.id ? '#F8FAFC' : '#FFF',
              border: selectedOkrId === okr.id ? '2px solid var(--ceo-primary)' : '1px solid var(--ceo-border)',
              borderRadius: '8px', padding: '16px', cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className={`ceo-badge ${okr.status === 'On Track' ? 'success' : okr.status === 'At Risk' ? 'warning' : 'danger'}`} style={{ fontWeight: 600, padding: '4px 8px', fontSize: '11px' }}>{okr.status.toUpperCase()}</span>
                <ProgressRing progress={okr.progress} color={getStatusColor(okr.status)} size={42} strokeWidth={4} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.4, marginBottom: '12px', color: 'var(--ceo-text-primary)' }}>{okr.title}</div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--ceo-text-secondary)', fontWeight: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} color="var(--ceo-text-muted)"/> {okr.owner}</div>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--ceo-text-muted)', background: '#FFF', borderRadius: '12px', border: '1px dashed var(--ceo-border)' }}>
              <Target size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
              <div style={{ fontSize: '15px', fontWeight: 600 }}>No OKRs found</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Try selecting a different quarter or year, or create a new one.</div>
            </div>
          )}
        </div>

        {/* DETAIL */}
        <div className="ceo-command-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--ceo-border)' }}>
          {selectedOkr ? (
            <>
              <div className="ceo-command-header" style={{ padding: '24px', borderBottom: '1px solid var(--ceo-divider)', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span className={`ceo-badge ${selectedOkr.status === 'On Track' ? 'success' : selectedOkr.status === 'At Risk' ? 'warning' : 'danger'}`} style={{ fontSize: '11px', fontWeight: 700 }}>{selectedOkr.status.toUpperCase()}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-muted)' }}>{selectedOkr.quarter} {selectedOkr.year}</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--ceo-text-primary)' }}>{selectedOkr.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ceo-text-secondary)', fontWeight: 500 }}>
                      <Users size={14} color="var(--ceo-text-muted)" /> Owner: {selectedOkr.owner}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteOkr(selectedOkr.id)} style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>

              <div className="ceo-command-content" style={{ padding: '24px', overflowY: 'auto' }}>
                <div className="ceo-typography-section-title" style={{ fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={16} color="var(--ceo-primary)" /> MEASURABLE KEY RESULTS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {selectedOkr.krs.map(kr => {
                    const pct = Math.min(100, (kr.current / kr.target) * 100);
                    return (
                      <div key={kr.id} style={{ border: '1px solid var(--ceo-border)', padding: '16px', borderRadius: '8px', background: '#FFF' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ceo-text-primary)' }}>{kr.title}</div>
                            {kr.sprintLink && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', color: 'var(--ceo-text-secondary)', fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px', marginTop: '6px' }}>
                                <LinkIcon size={12} /> CASCADED: {kr.sprintLink}
                              </div>
                            )}
                          </div>
                          
                          {/* INLINE EDITING */}
                          {editingKrId === kr.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input 
                                autoFocus
                                type="number" 
                                value={editValue} 
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveKrProgress(kr.id)}
                                style={{ width: '60px', padding: '6px', border: '1px solid var(--ceo-primary)', borderRadius: '4px', fontSize: '13px', fontWeight: 600, outline: 'none' }}
                              />
                              <button onClick={() => saveKrProgress(kr.id)} style={{ background: 'var(--ceo-success)', color: '#FFF', border: 'none', borderRadius: '4px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <CheckCircle2 size={14} />
                              </button>
                              <button onClick={() => setEditingKrId(null)} style={{ background: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '4px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>
                                {kr.current} / {kr.target} <span style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', fontWeight: 500 }}>{kr.unit}</span>
                              </div>
                              <button 
                                onClick={() => { setEditingKrId(kr.id); setEditValue(kr.current); }}
                                className="ceo-btn"
                                style={{ padding: '6px 10px', fontSize: '11px' }}
                              >
                                <Edit2 size={12} style={{ marginRight: '4px' }}/> Update
                              </button>
                            </div>
                          )}

                        </div>

                        <div style={{ height: '8px', background: 'var(--ceo-divider)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--ceo-success)' : 'var(--ceo-primary)', borderRadius: '4px', transition: 'width 0.5s ease-out, background 0.3s' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ceo-text-muted)', background: '#F8FAFC' }}>
               <BarChart2 size={64} style={{ opacity: 0.1, marginBottom: '24px' }} />
               <div style={{ fontSize: '18px', fontWeight: 600 }}>Select an OKR to view details</div>
            </div>
          )}
        </div>

      </div>

      {isAdding && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Create New Objective</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: okrErrors.title ? '4px' : '6px' }}>Objective Title *</label>
              {okrErrors.title && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {okrErrors.title}</div>}
              <input 
                type="text" 
                value={newOkr.title} 
                onChange={e => { setNewOkr({...newOkr, title: e.target.value}); if(e.target.value.trim()) setOkrErrors(p => ({...p, title: ''})); }}
                onFocus={e => { if(!e.target.value.trim()) setOkrErrors(p => ({...p, title: 'Please enter Objective Title.'})); }}
                onClick={e => { if(!e.target.value.trim()) setOkrErrors(p => ({...p, title: 'Please enter Objective Title.'})); else setOkrErrors(p => ({...p, title: ''})); }}
                className={`ceo-form-input ${okrErrors.title ? 'error' : ''}`} 
                placeholder="e.g. Dominate Enterprise Market"
              />
            </div>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: okrErrors.owner ? '4px' : '6px' }}>Owner *</label>
                {okrErrors.owner && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {okrErrors.owner}</div>}
                <input type="text" value={newOkr.owner} onChange={e => { setNewOkr({...newOkr, owner: e.target.value}); if(e.target.value.trim()) setOkrErrors(p => ({...p, owner: ''})); }} onFocus={e => { if(!e.target.value.trim()) setOkrErrors(p => ({...p, owner: 'Please enter Owner.'})); }} onClick={e => { if(!e.target.value.trim()) setOkrErrors(p => ({...p, owner: 'Please enter Owner.'})); else setOkrErrors(p => ({...p, owner: ''})); }} className={`ceo-form-input ${okrErrors.owner ? 'error' : ''}`} placeholder="e.g. CEO Office" />
              </div>
              <div style={{ width: '120px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: okrErrors.quarter ? '4px' : '6px' }}>Quarter *</label>
                {okrErrors.quarter && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {okrErrors.quarter}</div>}
                <CustomSelect 
                  defaultValue={newOkr.quarter} 
                  placeholder="Select"
                  options={[
                    { value: 'Q1', label: 'Q1' },
                    { value: 'Q2', label: 'Q2' },
                    { value: 'Q3', label: 'Q3' },
                    { value: 'Q4', label: 'Q4' }
                  ]}
                  onChange={val => { setNewOkr({...newOkr, quarter: val}); if(val) setOkrErrors(p => ({...p, quarter: ''})); }}
                  onFocus={val => { if(!val) setOkrErrors(p => ({...p, quarter: 'Please select Quarter.'})); else setOkrErrors(p => ({...p, quarter: ''})); }}
                  innerStyle={{ borderColor: okrErrors.quarter ? 'var(--ceo-danger)' : '' }}
                />
              </div>
              <div style={{ width: '120px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: okrErrors.year ? '4px' : '6px' }}>Year *</label>
                {okrErrors.year && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {okrErrors.year}</div>}
                <CustomSelect 
                  defaultValue={newOkr.year} 
                  placeholder="Select"
                  options={[
                    { value: '2024', label: '2024' },
                    { value: '2025', label: '2025' },
                    { value: '2026', label: '2026' },
                    { value: '2027', label: '2027' },
                    { value: '2028', label: '2028' },
                    { value: '2029', label: '2029' },
                    { value: '2030', label: '2030' },
                    { value: '2031', label: '2031' },
                    { value: '2032', label: '2032' },
                    { value: '2033', label: '2033' },
                    { value: '2034', label: '2034' },
                    { value: '2035', label: '2035' }
                  ]}
                  onChange={val => { setNewOkr({...newOkr, year: val}); if(val) setOkrErrors(p => ({...p, year: ''})); }}
                  onFocus={val => { if(!val) setOkrErrors(p => ({...p, year: 'Please select Year.'})); else setOkrErrors(p => ({...p, year: ''})); }}
                  innerStyle={{ borderColor: okrErrors.year ? 'var(--ceo-danger)' : '' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px', fontWeight: 700, fontSize: '14px' }}>Key Results *</div>
            
            {newOkr.krs.map((kr, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: okrErrors.krs?.[idx]?.title ? '4px' : '6px' }}>KR Title *</label>
                  {okrErrors.krs?.[idx]?.title && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {okrErrors.krs[idx].title}</div>}
                  <input type="text" placeholder="e.g. Acquire 50 new enterprise clients" value={kr.title} onChange={e => {
                    const updated = [...newOkr.krs];
                    updated[idx].title = e.target.value;
                    setNewOkr({...newOkr, krs: updated});
                    if(e.target.value.trim()) {
                      const newErrs = [...(okrErrors.krs || [])];
                      if(!newErrs[idx]) newErrs[idx] = {};
                      newErrs[idx].title = '';
                      setOkrErrors({...okrErrors, krs: newErrs});
                    }
                  }} onClick={e => {
                    if(!e.target.value.trim()) {
                      const newErrs = [...(okrErrors.krs || [])];
                      if(!newErrs[idx]) newErrs[idx] = {};
                      newErrs[idx].title = 'Enter KR Title.';
                      setOkrErrors({...okrErrors, krs: newErrs});
                    }
                  }} className={`ceo-form-input ${okrErrors.krs?.[idx]?.title ? 'error' : ''}`} />
                </div>
                <div style={{ width: '80px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: okrErrors.krs?.[idx]?.target ? '4px' : '6px' }}>Target *</label>
                  {okrErrors.krs?.[idx]?.target && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {okrErrors.krs[idx].target}</div>}
                  <input type="number" placeholder="50" value={kr.target} onChange={e => {
                    const updated = [...newOkr.krs];
                    updated[idx].target = e.target.value;
                    setNewOkr({...newOkr, krs: updated});
                    if(e.target.value) {
                      const newErrs = [...(okrErrors.krs || [])];
                      if(!newErrs[idx]) newErrs[idx] = {};
                      newErrs[idx].target = '';
                      setOkrErrors({...okrErrors, krs: newErrs});
                    }
                  }} onClick={e => {
                    if(!e.target.value) {
                      const newErrs = [...(okrErrors.krs || [])];
                      if(!newErrs[idx]) newErrs[idx] = {};
                      newErrs[idx].target = 'Enter Target.';
                      setOkrErrors({...okrErrors, krs: newErrs});
                    }
                  }} className={`ceo-form-input ${okrErrors.krs?.[idx]?.target ? 'error' : ''}`} />
                </div>
                <div style={{ width: '80px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: okrErrors.krs?.[idx]?.unit ? '4px' : '6px' }}>Unit *</label>
                  {okrErrors.krs?.[idx]?.unit && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {okrErrors.krs[idx].unit}</div>}
                  <input type="text" placeholder="Clients" value={kr.unit} onChange={e => {
                    const updated = [...newOkr.krs];
                    updated[idx].unit = e.target.value;
                    setNewOkr({...newOkr, krs: updated});
                    if(e.target.value.trim()) {
                      const newErrs = [...(okrErrors.krs || [])];
                      if(!newErrs[idx]) newErrs[idx] = {};
                      newErrs[idx].unit = '';
                      setOkrErrors({...okrErrors, krs: newErrs});
                    }
                  }} onClick={e => {
                    if(!e.target.value.trim()) {
                      const newErrs = [...(okrErrors.krs || [])];
                      if(!newErrs[idx]) newErrs[idx] = {};
                      newErrs[idx].unit = 'Enter Unit.';
                      setOkrErrors({...okrErrors, krs: newErrs});
                    }
                  }} className={`ceo-form-input ${okrErrors.krs?.[idx]?.unit ? 'error' : ''}`} />
                </div>
                <button onClick={() => {
                  const updated = newOkr.krs.filter((_, i) => i !== idx);
                  setNewOkr({...newOkr, krs: updated});
                  const updatedErrs = okrErrors.krs?.filter((_, i) => i !== idx);
                  setOkrErrors({...okrErrors, krs: updatedErrs});
                }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', marginTop: '10px' }}><X size={16} /></button>
              </div>
            ))}
            
            <button onClick={() => {
              setNewOkr({...newOkr, krs: [...newOkr.krs, { title: '', target: 100, unit: '%' }]});
            }} style={{ background: '#F1F5F9', border: '1px dashed #CBD5E1', width: '100%', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer', marginBottom: '24px' }}>
              + Add Key Result
            </button>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setIsAdding(false)} style={{ background: '#FFF', border: '1px solid #CBD5E1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleCreateOkr} className="ceo-btn" style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>Save Objective</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
