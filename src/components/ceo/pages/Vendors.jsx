import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  Building, CreditCard, Clock, CheckCircle, AlertTriangle, Search, Filter, 
  Plus, MoreVertical, ShieldCheck, Box, RefreshCw, X, ChevronDown, AlertCircle
} from 'lucide-react';
import '../CEO.css';

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

export default function Vendors() {
  const token = localStorage.getItem('nsg_jwt_token');
  const fetcher = (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

    const { data: rawVendors = [], mutate: mutateVendors } = useSWR('/api/ceo-portal/vendors', fetcher);
  const vendors = Array.isArray(rawVendors) ? rawVendors.map(v => ({
    id: v.vendor_id || v.id,
    db_id: v.id,
    name: v.name,
    category: v.category,
    status: v.status,
    spend: v.annual_spend,
    renewal: v.renewal_date || 'N/A',
    risk: v.risk_level
  })) : [];
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addVendorErrors, setAddVendorErrors] = useState({});
  const [newVendor, setNewVendor] = useState({
    vendor_id: '', name: '', category: '', status: '', spend: '', renewal: '', risk: ''
  });

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/ceo-portal/vendors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Map backend response
        const mapped = data.map(v => ({
          id: v.vendor_id,
          db_id: v.id,
          name: v.name,
          category: v.category,
          status: v.status,
          spend: v.annual_spend,
          renewal: v.renewal_date || 'N/A',
          risk: v.risk_level
        }));
        setVendors(mapped);
      }
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleAddVendor = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!newVendor.vendor_id.trim()) errors.vendor_id = 'Please enter Vendor ID.';
    if (!newVendor.name.trim()) errors.name = 'Please enter Provider Name.';
    if (!newVendor.category) errors.category = 'Please select Category.';
    if (!newVendor.status) errors.status = 'Please select Status.';
    if (!newVendor.spend.trim()) errors.spend = 'Please enter Annual Spend.';
    if (!newVendor.risk) errors.risk = 'Please select Risk Level.';
    
    if (Object.keys(errors).length > 0) {
      setAddVendorErrors(errors);
      return;
    }
    
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/ceo-portal/vendors', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: newVendor.vendor_id,
          name: newVendor.name,
          category: newVendor.category,
          status: newVendor.status,
          annual_spend: newVendor.spend,
          renewal_date: newVendor.renewal,
          risk_level: newVendor.risk
        })
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        fetchVendors();
      } else {
        window.toast.error("Failed to add vendor or Vendor ID already exists");
      }
    } catch(e) {}
  };

  const handleDeleteVendor = async (db_id) => {
    if(!window.confirm("Are you sure you want to delete this vendor?")) return;
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/ceo-portal/vendors/${db_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(res.ok) fetchVendors();
    } catch(e){}
  };

  // Summary Metrics
  const totalSpend = vendors.reduce((acc, v) => acc + parseInt((v.spend || '0').replace(/[^0-9]/g, ''), 10), 0);
  const activeCount = vendors.filter(v => v.status === 'Active').length;
  const highRiskCount = vendors.filter(v => v.risk === 'High' || v.status === 'Expired').length;

  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + 30);
  
  const upcomingRenewalsCount = vendors.filter(v => {
    if (!v.renewal || v.renewal === 'N/A') return false;
    const rd = new Date(v.renewal);
    return rd >= today && rd <= nextMonth;
  }).length;

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'All' || v.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="ceo-module-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="ceo-typography-page-title">Vendor & Procurement</h1>
          <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Manage external partners, contracts, and software licenses</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="ceo-btn" onClick={fetchVendors}>
            <RefreshCw size={16} /> Sync ERP
          </button>
          <button className="ceo-btn ceo-btn-primary" onClick={() => {
            setNewVendor({ vendor_id: '', name: '', category: '', status: '', spend: '', renewal: '', risk: '' });
            setAddVendorErrors({});
            setIsAddModalOpen(true);
          }}>
            <Plus size={16} /> Add Vendor
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="ceo-grid-4" style={{ marginBottom: '32px' }}>
        <div className="ceo-command-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span className="ceo-typography-card-title"><Building size={16} /> Total Vendors</span>
            <div style={{ background: 'var(--ceo-hover)', padding: '6px', borderRadius: '8px', color: 'var(--ceo-primary)' }}><Building size={18} /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>{vendors.length}</div>
          <div className="ceo-typography-meta" style={{ marginTop: '8px' }}>{activeCount} active contracts</div>
        </div>

        <div className="ceo-command-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span className="ceo-typography-card-title"><CreditCard size={16} /> Total Spend YTD</span>
            <div style={{ background: 'var(--ceo-hover)', padding: '6px', borderRadius: '8px', color: 'var(--ceo-success)' }}><CreditCard size={18} /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>
            ₹{(totalSpend / 100000).toFixed(1)}L
          </div>
          <div className="ceo-typography-meta" style={{ marginTop: '8px', color: 'var(--ceo-success)' }}>Within Budget</div>
        </div>

        <div className="ceo-command-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span className="ceo-typography-card-title"><Clock size={16} /> Upcoming Renewals</span>
            <div style={{ background: 'var(--ceo-hover)', padding: '6px', borderRadius: '8px', color: 'var(--ceo-warning)' }}><Clock size={18} /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>{upcomingRenewalsCount}</div>
          <div className="ceo-typography-meta" style={{ marginTop: '8px' }}>In the next 30 days</div>
        </div>

        <div className="ceo-command-panel" style={{ padding: '20px', borderLeft: highRiskCount > 0 ? '4px solid var(--ceo-danger)' : '' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span className="ceo-typography-card-title"><AlertTriangle size={16} /> Vendor Risk</span>
            <div style={{ background: 'var(--ceo-hover)', padding: '6px', borderRadius: '8px', color: 'var(--ceo-danger)' }}><ShieldCheck size={18} /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>{highRiskCount}</div>
          <div className="ceo-typography-meta" style={{ marginTop: '8px' }}>Require immediate review</div>
        </div>
      </div>

      {/* Main Vendor List */}
      <div className="ceo-command-panel" style={{ flex: 1 }}>
        <div className="ceo-command-header">
          <h3 className="ceo-typography-section-title">Vendor Directory</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--ceo-text-muted)' }} />
              <input 
                type="text" 
                className="ceo-form-input" 
                placeholder="Search vendors..." 
                style={{ paddingLeft: '36px', width: '240px', height: '36px' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <CustomSelect 
              containerStyle={{ width: '160px' }}
              innerStyle={{ height: '36px', padding: '8px 12px' }}
              defaultValue={filterCategory} 
              placeholder="All Categories"
              options={[
                { value: 'All', label: 'All Categories' },
                { value: 'Software/Cloud', label: 'Software/Cloud' },
                { value: 'Software/SaaS', label: 'Software/SaaS' },
                { value: 'Real Estate', label: 'Real Estate' },
                { value: 'Hardware/IT', label: 'Hardware/IT' },
                { value: 'Legal/Finance', label: 'Legal/Finance' }
              ]}
              onChange={val => setFilterCategory(val)} 
            />
          </div>
        </div>
        
        <div className="ceo-erp-table-container">
          <table className="ceo-erp-table">
            <thead>
              <tr>
                <th>Vendor ID</th>
                <th>Provider Name</th>
                <th>Category</th>
                <th>Annual Spend</th>
                <th>Renewal Date</th>
                <th>Status</th>
                <th>Risk</th>
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td style={{ fontWeight: 600, color: 'var(--ceo-primary)' }}>{vendor.id}</td>
                  <td style={{ fontWeight: 500 }}>{vendor.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Box size={14} color="var(--ceo-text-muted)" />
                      {vendor.category}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{vendor.spend}</td>
                  <td>{vendor.renewal}</td>
                  <td>
                    <span className={`ceo-badge ${
                      vendor.status === 'Active' ? 'success' :
                      vendor.status === 'Pending Review' ? 'warning' : 'critical'
                    }`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      color: vendor.risk === 'Low' ? 'var(--ceo-success)' : vendor.risk === 'Medium' ? 'var(--ceo-warning)' : 'var(--ceo-danger)',
                      fontWeight: 600, fontSize: '13px'
                    }}>
                      {vendor.risk}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleDeleteVendor(vendor.db_id)} className="ceo-btn" style={{ padding: '6px', border: 'none', background: 'transparent', color: 'var(--ceo-danger)', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredVendors.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--ceo-text-muted)' }}>
                    No vendors found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vendor Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFF', padding: '32px', borderRadius: '16px', width: '500px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Add New Vendor</h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <form onSubmit={handleAddVendor}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: addVendorErrors.vendor_id ? '4px' : '8px' }}>VENDOR ID *</label>
                  {addVendorErrors.vendor_id && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {addVendorErrors.vendor_id}</div>}
                  <input type="text" className={`ceo-form-input ${addVendorErrors.vendor_id ? 'error' : ''}`} style={{ width: '100%' }} value={newVendor.vendor_id} onChange={e => { setNewVendor({...newVendor, vendor_id: e.target.value}); if(e.target.value.trim()) setAddVendorErrors(p => ({...p, vendor_id: ''})); }} onFocus={e => { if(!e.target.value.trim()) setAddVendorErrors(p => ({...p, vendor_id: 'Please enter Vendor ID.'})); }} onBlur={e => { if(!e.target.value.trim()) setAddVendorErrors(p => ({...p, vendor_id: 'Please enter Vendor ID.'})); }} placeholder="e.g. V-105" />
                </div>
                <div>
                  <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: addVendorErrors.name ? '4px' : '8px' }}>PROVIDER NAME *</label>
                  {addVendorErrors.name && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {addVendorErrors.name}</div>}
                  <input type="text" className={`ceo-form-input ${addVendorErrors.name ? 'error' : ''}`} style={{ width: '100%' }} value={newVendor.name} onChange={e => { setNewVendor({...newVendor, name: e.target.value}); if(e.target.value.trim()) setAddVendorErrors(p => ({...p, name: ''})); }} onFocus={e => { if(!e.target.value.trim()) setAddVendorErrors(p => ({...p, name: 'Please enter Provider Name.'})); }} onBlur={e => { if(!e.target.value.trim()) setAddVendorErrors(p => ({...p, name: 'Please enter Provider Name.'})); }} placeholder="Company Name" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: addVendorErrors.category ? '4px' : '8px' }}>CATEGORY *</label>
                    {addVendorErrors.category && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {addVendorErrors.category}</div>}
                    <CustomSelect 
                      defaultValue={newVendor.category} 
                      placeholder="Select Category"
                      options={[
                        { value: 'Software/Cloud', label: 'Software/Cloud' },
                        { value: 'Software/SaaS', label: 'Software/SaaS' },
                        { value: 'Hardware/IT', label: 'Hardware/IT' },
                        { value: 'Real Estate', label: 'Real Estate' },
                        { value: 'Legal/Finance', label: 'Legal/Finance' }
                      ]}
                      onChange={val => { setNewVendor({...newVendor, category: val}); if(val) setAddVendorErrors(p => ({...p, category: ''})); }}
                      onFocus={val => { if(!val) setAddVendorErrors(p => ({...p, category: 'Please select Category.'})); else setAddVendorErrors(p => ({...p, category: ''})); }}
                      innerStyle={{ borderColor: addVendorErrors.category ? 'var(--ceo-danger)' : '' }}
                    />
                  </div>
                  <div>
                    <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: addVendorErrors.status ? '4px' : '8px' }}>STATUS *</label>
                    {addVendorErrors.status && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {addVendorErrors.status}</div>}
                    <CustomSelect 
                      defaultValue={newVendor.status} 
                      placeholder="Select Status"
                      options={[
                        { value: 'Active', label: 'Active' },
                        { value: 'Pending Review', label: 'Pending Review' },
                        { value: 'Expired', label: 'Expired' }
                      ]}
                      onChange={val => { setNewVendor({...newVendor, status: val}); if(val) setAddVendorErrors(p => ({...p, status: ''})); }}
                      onFocus={val => { if(!val) setAddVendorErrors(p => ({...p, status: 'Please select Status.'})); else setAddVendorErrors(p => ({...p, status: ''})); }}
                      innerStyle={{ borderColor: addVendorErrors.status ? 'var(--ceo-danger)' : '' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: addVendorErrors.spend ? '4px' : '8px' }}>ANNUAL SPEND *</label>
                    {addVendorErrors.spend && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {addVendorErrors.spend}</div>}
                    <input type="text" className={`ceo-form-input ${addVendorErrors.spend ? 'error' : ''}`} style={{ width: '100%' }} value={newVendor.spend} onChange={e => { const val = e.target.value.replace(/\D/g, ''); setNewVendor({...newVendor, spend: val}); if(val) setAddVendorErrors(p => ({...p, spend: ''})); }} onFocus={e => { if(!e.target.value.trim()) setAddVendorErrors(p => ({...p, spend: 'Please enter Annual Spend.'})); }} onBlur={e => { if(!e.target.value.trim()) setAddVendorErrors(p => ({...p, spend: 'Please enter Annual Spend.'})); }} placeholder="e.g. 500000" />
                  </div>
                  <div>
                    <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: addVendorErrors.risk ? '4px' : '8px' }}>RISK LEVEL *</label>
                    {addVendorErrors.risk && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {addVendorErrors.risk}</div>}
                    <CustomSelect 
                      defaultValue={newVendor.risk} 
                      placeholder="Select Risk Level"
                      options={[
                        { value: 'Low', label: 'Low' },
                        { value: 'Medium', label: 'Medium' },
                        { value: 'High', label: 'High' }
                      ]}
                      onChange={val => { setNewVendor({...newVendor, risk: val}); if(val) setAddVendorErrors(p => ({...p, risk: ''})); }}
                      onFocus={val => { if(!val) setAddVendorErrors(p => ({...p, risk: 'Please select Risk Level.'})); else setAddVendorErrors(p => ({...p, risk: ''})); }}
                      innerStyle={{ borderColor: addVendorErrors.risk ? 'var(--ceo-danger)' : '' }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="ceo-btn">Cancel</button>
                <button type="submit" className="ceo-btn ceo-btn-primary">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
