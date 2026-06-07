import React, { useState, useEffect } from 'react';
import { 
  Building, CreditCard, Clock, CheckCircle, AlertTriangle, Search, Filter, 
  Plus, MoreVertical, ShieldCheck, Box, RefreshCw
} from 'lucide-react';
import '../CEO.css';

const DEFAULT_VENDORS = [
  { id: 'V-100', name: 'AWS Cloud India', category: 'Software/Cloud', status: 'Active', spend: '₹14,50,000', renewal: '2026-10-15', risk: 'Low' },
  { id: 'V-101', name: 'Salesforce Enterprise', category: 'Software/SaaS', status: 'Active', spend: '₹8,20,000', renewal: '2026-12-01', risk: 'Low' },
  { id: 'V-102', name: 'WeWork Solutions', category: 'Real Estate', status: 'Pending Review', spend: '₹22,00,000', renewal: '2026-07-01', risk: 'Medium' },
  { id: 'V-103', name: 'Dell Hardware Partners', category: 'Hardware/IT', status: 'Active', spend: '₹5,40,000', renewal: 'N/A', risk: 'Low' },
  { id: 'V-104', name: 'KPMG Auditing Services', category: 'Legal/Finance', status: 'Expired', spend: '₹3,00,000', renewal: '2026-04-15', risk: 'High' }
];

export default function Vendors() {
  const [vendors, setVendors] = useState(DEFAULT_VENDORS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Summary Metrics
  const totalSpend = vendors.reduce((acc, v) => acc + parseInt(v.spend.replace(/[^0-9]/g, ''), 10), 0);
  const activeCount = vendors.filter(v => v.status === 'Active').length;
  const highRiskCount = vendors.filter(v => v.risk === 'High' || v.status === 'Expired').length;

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
          <button className="ceo-btn">
            <RefreshCw size={16} /> Sync ERP
          </button>
          <button className="ceo-btn ceo-btn-primary">
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
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>2</div>
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
                    <button className="ceo-btn" style={{ padding: '6px', border: 'none', background: 'transparent' }}>
                      <MoreVertical size={16} />
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
    </div>
  );
}
