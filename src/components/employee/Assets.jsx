import { useState, useEffect } from 'react';
import AssetRequestForm from './AssetRequestForm';
import { Briefcase, Laptop, CreditCard, Headphones, ShieldAlert, FileText } from 'lucide-react';

export default function Assets({ currentUser }) {
  const EMPLOYEE_ID = currentUser?.id || 102;

  const [requests, setRequests] = useState([]);
  const [issuedAssets, setIssuedAssets] = useState([]);
  const [toast, setToast] = useState(null);

  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('request'); // 'request', 'assets', 'noc'
  
  const [requestPage, setRequestPage] = useState(1);
  const requestsPerPage = 3;

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      // Fetch Issued Assets from DB
      const assetsRes = await fetch('/api/employee-portal/resignation/my-assets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (assetsRes.ok) setIssuedAssets(await assetsRes.json());

      // Fetch Asset Requests from DB
      const reqRes = await fetch('/api/employee-portal/assets/my-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        const items = reqData.items || reqData || []; // Handle both array and object responses
        const safeItems = Array.isArray(items) ? items : [];
        setRequests(safeItems.map(r => ({
          id: r.id,
          originalId: r.id,
          assetType: r.asset_type,
          reason: r.reason,
          urgency: r.urgency,
          status: r.status === 'open' ? 'Pending' : r.status,
          createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString() : ''
        })));
      }

      // Check resignation status for NOC
      const resigRes = await fetch('/api/employee-portal/resignation/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resigRes.ok) {
        const resigData = await resigRes.json();
        setHasResigned(!!resigData);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRequestSubmit = async (newReq) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/employee-portal/assets/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ asset_type: newReq.assetType, reason: newReq.reason, urgency: newReq.urgency || 'Low' })
      });
      if (res.ok) {
        showToast(`Request for ${newReq.assetType} submitted successfully.`);
        fetchData(); // Refresh from DB
      } else {
        showToast('Failed to submit asset request');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error submitting request');
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const getAssetIcon = (type) => {
    switch (type) {
      case 'Laptop':
        return <Laptop size={16} />;
      case 'Access Card':
        return <CreditCard size={16} />;
      case 'Headset':
        return <Headphones size={16} />;
      default:
        return <Briefcase size={16} />;
    }
  };

  return (
    <div className="component-container">
      {/* CSS grid styles for responsiveness */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .assets-layout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 1024px) {
          .assets-layout-grid {
            grid-template-columns: 1.2fr 1fr;
            grid-template-rows: minmax(0, 1fr) auto;
            grid-template-areas: 
              "form issued"
              "noc noc";
            height: calc(100vh - 180px);
          }
          .area-form, .area-issued { 
            height: 100%; max-height: 100%; 
            overflow-y: auto; padding-right: 4px; 
          }
          .area-form { grid-area: form; }
          .area-issued { grid-area: issued; }
          .area-noc { grid-area: noc; }

          .area-form::-webkit-scrollbar, .area-issued::-webkit-scrollbar { width: 4px; }
          .area-form::-webkit-scrollbar-thumb, .area-issued::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
        }

        .asset-issued-item {
          height: 52px; /* Design Token height constraint */
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: var(--bg-primary);
          transition: background-color 0.2s ease;
        }

        .asset-issued-item:hover {
          background-color: var(--bg-tertiary);
        }

        .asset-issued-item.unreturned-resigned {
          border-color: rgba(239, 68, 68, 0.3);
          background-color: rgba(239, 68, 68, 0.03);
        }

        .asset-issued-item.unreturned-resigned:hover {
          background-color: rgba(239, 68, 68, 0.06);
        }

        .assets-mobile-tabs {
          display: flex;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 4px;
          gap: 4px;
          margin-bottom: 20px;
        }

        .mobile-tab-btn {
          flex: 1;
          padding: 10px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          background: none;
          color: var(--text-secondary);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .mobile-tab-btn:hover {
          color: var(--text-primary);
          background-color: var(--bg-tertiary);
        }

        .mobile-tab-btn.active {
          color: #10b981;
          background-color: rgba(16, 185, 129, 0.08);
          font-weight: 700;
        }

        @media (min-width: 768px) {
          .assets-mobile-tabs {
            display: none;
          }
        }
      ` }} />

      {/* Success Toast Notify */}
      {toast && (
        <div className="toast-notify">
          <ShieldAlert size={16} style={{ color: 'var(--accent-green)' }} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="component-header">
        <div>
          <h1>Asset Requests Portal</h1>
          <p>Request hardware devices, review currently issued items, and complete return sign-offs.</p>
        </div>
      </div>

      {/* Mobile navigation tabs header */}
      {isMobile && (
        <div className="assets-mobile-tabs">
          <button
            type="button"
            className={`mobile-tab-btn ${activeTab === 'request' ? 'active' : ''}`}
            onClick={() => setActiveTab('request')}
          >
            Request
          </button>
          <button
            type="button"
            className={`mobile-tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
            onClick={() => setActiveTab('assets')}
          >
            My Assets
          </button>
          <button
            type="button"
            className={`mobile-tab-btn ${activeTab === 'noc' ? 'active' : ''}`}
            onClick={() => setActiveTab('noc')}
          >
            Sign NOC
          </button>
        </div>
      )}

      {/* Responsive layout container */}
      <div className="assets-layout-grid">

        {/* Left Side: Request Form & Requisitions list */}
        {(!isMobile || activeTab === 'request') && (
          <div className="area-form">
            <AssetRequestForm
              onRequestSubmit={handleRequestSubmit}
              requests={requests}
            />
          </div>
        )}

        {/* Right Side: Issued Assets List */}
        {(!isMobile || activeTab === 'assets') && (
          <div className="area-issued">
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <FileText size={18} />
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>My Asset Requisitions ({requests.length})</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                {requests.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No asset requests found.
                  </div>
                )}
                {requests.slice((requestPage - 1) * requestsPerPage, requestPage * requestsPerPage).map((req, index) => (
                  <div key={req.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: index !== requests.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>REQ-{req.id}</span>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: '600',
                          padding: '2px 8px', 
                          borderRadius: '12px',
                          backgroundColor: req.priority?.toLowerCase() === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          color: req.priority?.toLowerCase() === 'high' ? '#ef4444' : '#3b82f6',
                        }}>
                          {req.priority || 'medium'}
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Item: {req.assetType} | Requested: {req.createdAt}
                      </span>
                      <span style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                        {req.reason}
                      </span>
                    </div>
                    <div>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: req.status === 'Resolved' || req.status === 'resolved' || req.status === 'approved' || req.status === 'Approved'
                          ? '#f59e0b'
                          : req.status === 'Rejected' || req.status === 'rejected' ? '#ef4444' : '#f59e0b'
                      }}>
                        {req.status === 'CEO Approved' ? 'Resolved' : req.status === 'Approved' ? 'Resolved' : req.status}
                      </span>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                  <button 
                    onClick={() => setRequestPage(p => Math.max(1, p - 1))}
                    disabled={requestPage === 1}
                    style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: requestPage === 1 ? 'not-allowed' : 'pointer', color: 'var(--text-primary)', opacity: requestPage === 1 ? 0.5 : 1 }}
                  >
                    ← Prev
                  </button>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Page {requestPage} of {Math.max(1, Math.ceil(requests.length / requestsPerPage))}</span>
                  <button 
                    onClick={() => setRequestPage(p => Math.min(Math.max(1, Math.ceil(requests.length / requestsPerPage)), p + 1))}
                    disabled={requestPage === Math.max(1, Math.ceil(requests.length / requestsPerPage))}
                    style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: requestPage === Math.max(1, Math.ceil(requests.length / requestsPerPage)) ? 'not-allowed' : 'pointer', color: 'var(--text-primary)', opacity: requestPage === Math.max(1, Math.ceil(requests.length / requestsPerPage)) ? 0.5 : 1 }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
