import React, { useState } from 'react';
import { 
  FileText, Shield, Key, Search, Download, CheckCircle, Clock,
  Upload, FileSignature, FolderLock, Lock, Eye, Check
} from 'lucide-react';
import '../CEO.css';

const DEFAULT_DOCUMENTS = [
  { id: 'DOC-901', name: 'Master Services Agreement - Salesforce', type: 'Contract', signStatus: 'Signed', hash: '0x8f2a...91bc', date: '2025-11-20', parties: ['John Doe (CEO)', 'Marc Benioff'] },
  { id: 'DOC-902', name: 'Q1 Financial Audit Sign-off', type: 'Compliance', signStatus: 'Signed', hash: '0x3c1b...44fa', date: '2026-04-10', parties: ['John Doe (CEO)', 'KPMG Audit Team'] },
  { id: 'DOC-903', name: 'NDA - NextGen AI Acquisition', type: 'NDA', signStatus: 'Pending', hash: 'Pending', date: '2026-06-01', parties: ['John Doe (CEO)', 'NextGen Corp'] },
  { id: 'DOC-904', name: 'Employee Handbook v4.2', type: 'Policy', signStatus: 'Signed', hash: '0x1a9e...77dd', date: '2026-01-15', parties: ['HR Board', 'CEO'] }
];

export default function DocumentVault() {
  const [documents] = useState(DEFAULT_DOCUMENTS);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ceo-module-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="ceo-typography-page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FolderLock color="var(--ceo-primary)" size={28} />
            Cryptographic Document Vault
          </h1>
          <p className="ceo-typography-body" style={{ marginTop: '4px' }}>
            Secure repository for legal contracts, e-signatures, and compliance documents backed by immutable logs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="ceo-btn">
            <Upload size={16} /> Upload Secure File
          </button>
          <button className="ceo-btn ceo-btn-primary">
            <FileSignature size={16} /> New E-Signature Request
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="ceo-grid-4" style={{ marginBottom: '32px' }}>
        <div className="ceo-command-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span className="ceo-typography-card-title"><Shield size={16} /> Secured Documents</span>
            <div style={{ background: 'var(--ceo-hover)', padding: '6px', borderRadius: '8px', color: 'var(--ceo-primary)' }}><Shield size={18} /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>1,432</div>
          <div className="ceo-typography-meta" style={{ marginTop: '8px', color: 'var(--ceo-success)' }}>
            <CheckCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
            All vaults encrypted
          </div>
        </div>

        <div className="ceo-command-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span className="ceo-typography-card-title"><FileSignature size={16} /> Pending Signatures</span>
            <div style={{ background: 'var(--ceo-hover)', padding: '6px', borderRadius: '8px', color: 'var(--ceo-warning)' }}><Clock size={18} /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>14</div>
          <div className="ceo-typography-meta" style={{ marginTop: '8px' }}>Awaiting executive action</div>
        </div>
      </div>

      {/* Main Document List */}
      <div className="ceo-command-panel" style={{ flex: 1 }}>
        <div className="ceo-command-header">
          <h3 className="ceo-typography-section-title">Vault Ledger</h3>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--ceo-text-muted)' }} />
            <input 
              type="text" 
              className="ceo-form-input" 
              placeholder="Search by ID, Name or Hash..." 
              style={{ paddingLeft: '36px', width: '320px', height: '36px' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="ceo-erp-table-container">
          <table className="ceo-erp-table">
            <thead>
              <tr>
                <th>Doc ID</th>
                <th>Document Title</th>
                <th>Type</th>
                <th>Signature Status</th>
                <th>Cryptographic Hash</th>
                <th>Signatories</th>
                <th>Timestamp</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: 600, color: 'var(--ceo-text-secondary)' }}>{doc.id}</td>
                  <td style={{ fontWeight: 600, color: 'var(--ceo-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} />
                      {doc.name}
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      background: 'var(--ceo-hover)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600
                    }}>
                      {doc.type}
                    </span>
                  </td>
                  <td>
                    <span className={`ceo-badge ${doc.signStatus === 'Signed' ? 'success' : 'warning'}`}>
                      {doc.signStatus === 'Signed' ? <Check size={12} /> : <Clock size={12} />}
                      {doc.signStatus}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--ceo-text-muted)' }}>
                    {doc.hash !== 'Pending' ? <Lock size={12} style={{ marginRight: '4px' }} /> : null}
                    {doc.hash}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--ceo-text-secondary)' }}>
                    {doc.parties.join(', ')}
                  </td>
                  <td>{doc.date}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="ceo-btn" style={{ padding: '6px', border: '1px solid var(--ceo-border)' }} title="View Document">
                        <Eye size={14} />
                      </button>
                      <button className="ceo-btn" style={{ padding: '6px', border: '1px solid var(--ceo-border)' }} title="Download PDF">
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--ceo-text-muted)' }}>
                    No documents found in the vault matching your criteria.
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
