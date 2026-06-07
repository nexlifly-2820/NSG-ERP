import { useState, useEffect } from 'react';
import AssetRequestForm from './AssetRequestForm';
import AssetNoc from './AssetNoc';
import { Briefcase, Laptop, CreditCard, Headphones, ShieldAlert } from 'lucide-react';

let requestCounter = 501;
const generateRequestId = () => `REQ-${requestCounter++}`;

const defaultIssued = [
  { id: 'LAP-089', assetTag: 'NSG-LAP-089', type: 'Laptop', serialNumber: 'SN-89736412', issueDate: '2024-03-15', condition: 'Excellent', returnStatus: 'Pending NOC', signedDate: null },
  { id: 'ACC-512', assetTag: 'NSG-ACC-512', type: 'Access Card', serialNumber: 'SN-00512', issueDate: '2024-03-15', condition: 'Good', returnStatus: 'Pending NOC', signedDate: null },
  { id: 'HDS-990', assetTag: 'NSG-HDS-990', type: 'Headset', serialNumber: 'SN-990812', issueDate: '2025-01-10', condition: 'Fair', returnStatus: 'Pending NOC', signedDate: null }
];

const defaultRequests = [
  { id: 'REQ-402', assetType: 'Keyboard', reason: 'Ergonomic keyboard for wrist support', urgency: 'Low', status: 'Approved', createdAt: '2026-05-15' }
];

export default function Assets({ db, onUpdateDb, currentUser }) {
  const EMPLOYEE_ID = currentUser?.id || 102;

  const getInitialRequests = () => {
    if (db?.assetRequests) {
      return db.assetRequests.filter(r => r.employee_id === EMPLOYEE_ID);
    }
    const saved = localStorage.getItem('nsg_employee_asset_requests');
    return saved ? JSON.parse(saved) : defaultRequests;
  };

  const getInitialAssets = () => {
    if (db?.assets) {
      return db.assets.filter(a => a.employee_id === EMPLOYEE_ID);
    }
    const saved = localStorage.getItem('nsg_employee_issued_assets');
    return saved ? JSON.parse(saved) : defaultIssued;
  };

  const [requests, setRequests] = useState([]);
  const [issuedAssets, setIssuedAssets] = useState([]);
  const [toast, setToast] = useState(null);

  const [hasResigned, setHasResigned] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('request'); // 'request', 'assets', 'noc'

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      // Fetch Assets
      const assetsRes = await fetch('http://localhost:8000/employee-portal/resignation/my-assets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (assetsRes.ok) {
        setIssuedAssets(await assetsRes.json());
      }
      
      // Fetch Resignation to know if NOC is required
      const resigRes = await fetch('http://localhost:8000/employee-portal/resignation/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resigRes.ok) {
        const resigData = await resigRes.json();
        setHasResigned(!!resigData);
      }

      // We still fall back to localStorage for requests as the backend model is not fully implemented
      const savedRequests = localStorage.getItem('nsg_employee_asset_requests');
      if (savedRequests) {
        setRequests(JSON.parse(savedRequests));
      }
    } catch (e) {
      console.error(e);
    }
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

  const handleRequestSubmit = (newReq) => {
    const requestItem = {
      id: generateRequestId(),
      employee_id: EMPLOYEE_ID,
      assetType: newReq.assetType,
      reason: newReq.reason,
      urgency: newReq.urgency,
      status: 'Pending',
      createdAt: new Date().toLocaleDateString()
    };

    if (db && onUpdateDb) {
      const updatedRequests = [requestItem, ...(db.assetRequests || [])];
      onUpdateDb({
        ...db,
        assetRequests: updatedRequests
      });
      setRequests(updatedRequests.filter(r => r.employee_id === EMPLOYEE_ID));
    } else {
      setRequests((prev) => [requestItem, ...prev]);
      localStorage.setItem('nsg_employee_asset_requests', JSON.stringify([requestItem, ...requests]));
    }
    showToast(`Request for ${newReq.assetType} submitted for TL approval.`);
  };

  const handleSignNoc = (assetId, assetType) => {
    const today = new Date().toLocaleDateString();

    if (db && onUpdateDb) {
      // 1. Update return status in global db.assets
      const updatedAssets = (db.assets || []).map((asset) => {
        if (asset.id === assetId) {
          return {
            ...asset,
            returnStatus: 'Signed',
            signedDate: today
          };
        }
        return asset;
      });

      // 2. Sync with resignation exit checklist in db.resignations
      let updatedResignations = db.resignations || [];
      const userResignation = updatedResignations.find(r => r.employee_id === EMPLOYEE_ID);
      
      if (userResignation) {
        const checklist = userResignation.checklist || [
          { id: 'handover', label: 'Handover tasks', completed: false },
          { id: 'laptop', label: 'Laptop return', completed: false },
          { id: 'access_card', label: 'Access card return', completed: false },
          { id: 'kt_upload', label: 'KT document upload', completed: false, fileName: null }
        ];

        const updatedChecklist = checklist.map((task) => {
          if (assetType === 'Laptop' && task.id === 'laptop') {
            return { ...task, completed: true };
          }
          if (assetType === 'Access Card' && task.id === 'access_card') {
            return { ...task, completed: true };
          }
          return task;
        });

        updatedResignations = updatedResignations.map(r => {
          if (r.employee_id === EMPLOYEE_ID) {
            return { ...r, checklist: updatedChecklist };
          }
          return r;
        });
      }

      onUpdateDb({
        ...db,
        assets: updatedAssets,
        resignations: updatedResignations
      });
      setIssuedAssets(updatedAssets.filter(a => a.employee_id === EMPLOYEE_ID));
      showToast(`NOC signed! Resignation Exit Checklist updated.`);
    } else {
      // Fallback update local state & localStorage
      setIssuedAssets((prev) => {
        const updated = prev.map((asset) => {
          if (asset.id === assetId) {
            return {
              ...asset,
              returnStatus: 'Signed',
              signedDate: today
            };
          }
          return asset;
        });
        localStorage.setItem('nsg_employee_issued_assets', JSON.stringify(updated));
        return updated;
      });

      // Sync with resignation exit checklist in localStorage
      const savedChecklist = localStorage.getItem('nsg_employee_resignation_checklist');
      if (savedChecklist) {
        try {
          const checklist = JSON.parse(savedChecklist);
          let taskUpdated = false;

          const updatedChecklist = checklist.map((task) => {
            if (assetType === 'Laptop' && task.id === 'laptop') {
              taskUpdated = true;
              return { ...task, completed: true };
            }
            if (assetType === 'Access Card' && task.id === 'access_card') {
              taskUpdated = true;
              return { ...task, completed: true };
            }
            return task;
          });

          if (taskUpdated) {
            localStorage.setItem('nsg_employee_resignation_checklist', JSON.stringify(updatedChecklist));
            showToast(`NOC signed! Resignation Exit Checklist updated.`);
            return;
          }
        } catch (err) {
          console.error('Error syncing exit checklist:', err);
        }
      }

      showToast(`NOC signed for ${assetType}..`);
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
            grid-template-areas: 
              "form issued"
              "noc noc";
          }
          .area-form { grid-area: form; }
          .area-issued { grid-area: issued; }
          .area-noc { grid-area: noc; }
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                  My Issued Assets List
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                  View all corporate hardware items assigned to your profile.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {issuedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className={`asset-issued-item ${hasResigned && asset.returnStatus !== 'Signed' ? 'unreturned-resigned' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-tertiary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {getAssetIcon(asset.type)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                            {asset.assetTag}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {asset.type}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            S/N: {asset.serialNumber}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            Condition: {asset.condition}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: asset.returnStatus === 'Signed'
                          ? 'hsl(150, 70%, 50%)'
                          : (hasResigned ? 'hsl(0, 70%, 55%)' : 'hsl(35, 90%, 60%)')
                      }}
                    >
                      {asset.returnStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Section: Handover NOC list */}
        {(!isMobile || activeTab === 'noc') && (
          <div className="area-noc">
            <AssetNoc
              issuedAssets={issuedAssets}
              onSignNoc={handleSignNoc}
              hasResigned={hasResigned}
            />
          </div>
        )}

      </div>
    </div>
  );
}
