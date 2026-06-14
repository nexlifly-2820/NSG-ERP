import React, { useState, useEffect } from 'react';
import { 
  FileText, Shield, Key, Search, Download, CheckCircle, Clock,
  Upload, FileSignature, FolderLock, Lock, Eye, Check, X
} from 'lucide-react';
import '../CEO.css';

export default function DocumentVault() {
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    doc_id: '', name: '', type: 'NDA', parties: ''
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  const handleSign = async (db_id) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/ceo-portal/vault/${db_id}/sign`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchVaultDocs();
        alert("Document signed successfully!");
      } else {
        alert("Failed to sign document");
      }
    } catch(e) {}
  };

  const handleSecureDownload = async (db_id, name) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/ceo-portal/vault/${db_id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("Failed to download document securely.");
      }
    } catch(e) {
      console.error(e);
      alert("Error downloading document");
    }
  };

  const handleSecureView = async (db_id) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/ceo-portal/vault/${db_id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        alert("Failed to load document.");
      }
    } catch(e) {}
  };

  const fetchVaultDocs = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/ceo-portal/vault', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(d => ({
          id: d.doc_id,
          db_id: d.id,
          name: d.name,
          type: d.type,
          signStatus: d.sign_status,
          hash: d.file_hash ? d.file_hash.substring(0, 16) + '...' : 'Pending',
          parties: d.parties ? d.parties.split(',').map(s=>s.trim()) : [],
          date: new Date(d.created_at + (d.created_at.endsWith('Z') ? '' : 'Z')).toLocaleDateString(),
          file_url: d.file_url
        }));
        setDocuments(mapped);
      }
    } catch(e) {}
  };

  useEffect(() => {
    fetchVaultDocs();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if(!uploadFile) { alert("Please select a file"); return; }
    setIsUploading(true);
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const formData = new FormData();
      formData.append('doc_id', uploadData.doc_id);
      formData.append('name', uploadData.name);
      formData.append('type', uploadData.type);
      formData.append('parties', uploadData.parties);
      formData.append('file', uploadFile);

      const res = await fetch('/api/ceo-portal/vault/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadData({doc_id: '', name: '', type: 'NDA', parties: ''});
        fetchVaultDocs();
      } else {
        const error = await res.json();
        alert(error.detail || "Upload failed");
      }
    } catch(e) {}
    setIsUploading(false);
  };

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
          <button className="ceo-btn" onClick={() => setIsUploadModalOpen(true)}>
            <Upload size={16} /> Upload Secure File
          </button>
          <button className="ceo-btn ceo-btn-primary" onClick={() => setIsSignModalOpen(true)}>
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
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>{documents.length}</div>
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
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>{documents.filter(d => d.signStatus === 'Pending').length}</div>
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
                      <button onClick={() => handleSecureView(doc.db_id)} className="ceo-btn" style={{ padding: '6px', border: '1px solid var(--ceo-border)', background: 'transparent', cursor: 'pointer', color: 'inherit' }} title="View Document">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleSecureDownload(doc.db_id, doc.name)} className="ceo-btn" style={{ padding: '6px', border: '1px solid var(--ceo-border)', background: 'transparent', cursor: 'pointer', color: 'inherit' }} title="Secure Download">
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

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFF', padding: '32px', borderRadius: '16px', width: '500px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Upload Secure Document</h2>
              <button onClick={() => setIsUploadModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <form onSubmit={handleUpload}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Document ID</label>
                  <input required type="text" className="ceo-form-input" style={{ width: '100%' }} value={uploadData.doc_id} onChange={e => setUploadData({...uploadData, doc_id: e.target.value})} placeholder="e.g. DOC-9001" />
                </div>
                <div>
                  <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Document Title</label>
                  <input required type="text" className="ceo-form-input" style={{ width: '100%' }} value={uploadData.name} onChange={e => setUploadData({...uploadData, name: e.target.value})} placeholder="e.g. Q4 Financial Audit" />
                </div>
                <div>
                  <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Document Type</label>
                  <select className="ceo-form-input" style={{ width: '100%' }} value={uploadData.type} onChange={e => setUploadData({...uploadData, type: e.target.value})}>
                    <option>NDA</option>
                    <option>Vendor Contract</option>
                    <option>Compliance Report</option>
                    <option>Board Resolution</option>
                    <option>Offer Letter</option>
                  </select>
                </div>
                <div>
                  <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Signatories / Parties (comma separated)</label>
                  <input type="text" className="ceo-form-input" style={{ width: '100%' }} value={uploadData.parties} onChange={e => setUploadData({...uploadData, parties: e.target.value})} placeholder="e.g. CEO, AWS Corp" />
                </div>
                <div>
                  <label className="ceo-typography-body" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>File</label>
                  <input required type="file" className="ceo-form-input" style={{ width: '100%', padding: '6px' }} onChange={e => setUploadFile(e.target.files[0])} />
                </div>
              </div>
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="ceo-btn">Cancel</button>
                <button type="submit" disabled={isUploading} className="ceo-btn ceo-btn-primary">{isUploading ? 'Encrypting...' : 'Secure & Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Modal */}
      {isSignModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFF', padding: '32px', borderRadius: '16px', width: '600px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Pending E-Signatures</h2>
              <button onClick={() => setIsSignModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            
            {documents.filter(d => d.signStatus === 'Pending').length === 0 ? (
              <p style={{ color: 'var(--ceo-text-muted)', textAlign: 'center', padding: '20px' }}>No pending documents to sign.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {documents.filter(d => d.signStatus === 'Pending').map(doc => (
                  <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--ceo-border)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--ceo-primary)', marginBottom: '4px' }}>{doc.name} ({doc.id})</div>
                      <div style={{ fontSize: '12px', color: 'var(--ceo-text-secondary)' }}>Type: {doc.type} | Date: {doc.date}</div>
                    </div>
                    <button onClick={() => handleSign(doc.db_id)} className="ceo-btn ceo-btn-primary" style={{ padding: '6px 12px' }}>
                      <FileSignature size={14} /> Sign Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
