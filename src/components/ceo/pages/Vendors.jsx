import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  Building, CreditCard, Clock, CheckCircle, AlertTriangle, Search, Filter, 
  Plus, MoreVertical, ShieldCheck, Box, RefreshCw, X
} from 'lucide-react';
import '../CEO.css';

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
  const [newVendor, setNewVendor] = useState({
    vendor_id: '', name: '', category: 'Software/Cloud', status: 'Active', spend: '', renewal: '', risk: 'Low'
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
        alert("Failed to add vendor or Vendor ID already exists");
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
          <button className="ceo-btn ceo-btn-primary" onClick={() => setIsAddModalOpen(true)}>
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
            <select 
              className="ceo-form-input" 
              style={{ height: '36px', width: '160px' }}
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Software/Cloud">Software/Cloud</option>
              <option value="Software/SaaS">Software/SaaS</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Hardware/IT">Hardware/IT</option>
              <option value="Legal/Finance">Legal/Finance</option>
            </select>
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
                  <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Vendor ID</label>
                  <input required type="text" className="ceo-form-input" style={{ width: '100%' }} value={newVendor.vendor_id} onChange={e => setNewVendor({...newVendor, vendor_id: e.target.value})} placeholder="e.g. V-105" />
                </div>
                <div>
                  <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Provider Name</label>
                  <input required type="text" className="ceo-form-input" style={{ width: '100%' }} value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} placeholder="Company Name" />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Category</label>
                    <select className="ceo-form-input" style={{ width: '100%' }} value={newVendor.category} onChange={e => setNewVendor({...newVendor, category: e.target.value})}>
                      <option>Software/Cloud</option>
                      <option>Software/SaaS</option>
                      <option>Hardware/IT</option>
                      <option>Real Estate</option>
                      <option>Legal/Finance</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Status</label>
                    <select className="ceo-form-input" style={{ width: '100%' }} value={newVendor.status} onChange={e => setNewVendor({...newVendor, status: e.target.value})}>
                      <option>Active</option>
                      <option>Pending Review</option>
                      <option>Expired</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Annual Spend</label>
                    <input required type="text" className="ceo-form-input" style={{ width: '100%' }} value={newVendor.spend} onChange={e => setNewVendor({...newVendor, spend: e.target.value})} placeholder="e.g. ₹5,00,000" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Risk Level</label>
                    <select className="ceo-form-input" style={{ width: '100%' }} value={newVendor.risk} onChange={e => setNewVendor({...newVendor, risk: e.target.value})}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
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
