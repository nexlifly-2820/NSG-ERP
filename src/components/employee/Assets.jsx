import { useState, useEffect } from 'react';
import AssetRequestForm from './AssetRequestForm';
import AssetNoc from './AssetNoc';
import { Briefcase, Laptop, CreditCard, Headphones, ShieldAlert } from 'lucide-react';

export default function Assets({ currentUser }) {
  const EMPLOYEE_ID = currentUser?.id || 102;

  const [requests, setRequests] = useState([]);
  const [issuedAssets, setIssuedAssets] = useState([]);
  const [toast, setToast] = useState(null);

  const [hasResigned, setHasResigned] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('request'); // 'request', 'assets', 'noc'

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
        setRequests(reqData.map(r => ({
          id: `REQ-${r.id}`,
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
        showToast(`Request for ${newReq.assetType} submitted for TL approval.`);
        fetchData(); // Refresh from DB
      } else {
        showToast('Failed to submit asset request');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error submitting request');
    }
  };

  const handleSignNoc = async (assetId, assetType, signatureData) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/employee-portal/assets/sign-noc/${assetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ signature_data: signatureData })
      });

      if (res.ok) {
        const data = await res.json();
        const today = new Date().toLocaleDateString();
        // Update local state from DB response
        setIssuedAssets((prev) =>
          prev.map((asset) =>
            asset.id === assetId
              ? { ...asset, returnStatus: data.returnStatus, signedDate: data.signedDate || today }
              : asset
          )
        );
        showToast(`NOC signed for ${assetType} — saved to database ✓`);
      } else {
        const err = await res.json();
        showToast(err.detail || 'Failed to sign NOC');
      }
    } catch (e) {
      console.error('Error signing NOC:', e);
      showToast('Network error — please try again');
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
