import { useState, useEffect } from 'react';
import ResignationForm from './ResignationForm';
import NoticeTracker from './NoticeTracker';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';

export default function Resignation({ currentUser }) {
  const [resignationData, setResignationData] = useState(null);
  const [myAssets, setMyAssets] = useState([]);
  const [earlyReliefStatus, setEarlyReliefStatus] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch from live API
  const fetchResignation = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/employee-portal/resignation/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.resignation_date) {
          setResignationData({
            submissionDate: data.resignation_date,
            lwdDate: data.LWD,
            reason: data.reason || '',
            status: data.status
          });
          if (data.early_relief_status) {
             setEarlyReliefStatus(data.early_relief_status);
          }
        } else {
          setResignationData(null);
        }
      }

      // Fetch assets
      const assetRes = await fetch('/api/employee-portal/resignation/my-assets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (assetRes.ok) {
        setMyAssets(await assetRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResignation();
    const interval = setInterval(fetchResignation, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- Handlers ---
  const handleResignSubmit = async (data) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/employee-portal/resignation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
           submissionDate: data.submissionDate,
           lwdDate: data.lwdDate,
           reason: data.reason || 'Personal Reasons' 
        })
      });
      if (res.ok) {
        showToast('Resignation submitted successfully.');
        fetchResignation();
      } else {
        const err = await res.json();
        alert(err.detail || 'Error submitting resignation');
      }
    } catch (e) { console.error(e); }
  };

  const handleRequestEarlyRelief = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/employee-portal/resignation/request-early-relief', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
         setEarlyReliefStatus('requested');
         showToast('Early relief requested.');
      }
    } catch(e){}
  };

  const handleSimulateApproveEarlyRelief = () => {
    if (!resignationData) return;
    
    // Simulate updating LWD to be closer
    const newLwd = new Date();
    newLwd.setDate(newLwd.getDate() + 5); // 5 days from today
    
    setResignationData({
      ...resignationData,
      lwdDate: newLwd.toISOString().split('T')[0],
      daysServed: 25 // bump served days close to completion
    });
    setEarlyReliefStatus('approved');
    showToast('Early relief approved! LWD rescheduled.');
  };

  const handleResetResignation = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/employee-portal/resignation/withdraw', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setResignationData(null);
        setEarlyReliefStatus(null);
        showToast('Resignation withdrawn.');
        fetchResignation();
      }
    } catch (e) { console.error(e); }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="component-container">
      {/* Dynamic styles for grid responsiveness & slide transitions */}
      <style dangerouslySetInnerHTML={{ __html: `
        .resignation-layout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        .area-tracker { order: 1; }
        .area-main { order: 2; }
        .area-checklist { order: 3; }

        @media (min-width: 1024px) {
          .resignation-layout-grid {
            grid-template-columns: 1.2fr 1fr;
            grid-template-rows: minmax(0, 1fr) auto;
            grid-template-areas: 
              "main tracker"
              "checklist checklist";
            height: calc(100vh - 180px);
          }
          .area-main, .area-tracker { 
            grid-area: main; order: unset; 
            height: 100%; max-height: 100%; 
            overflow-y: auto; padding-right: 4px; 
          }
          .area-tracker { grid-area: tracker; }
          .area-checklist { grid-area: checklist; order: unset; }
          
          .area-main::-webkit-scrollbar, .area-tracker::-webkit-scrollbar { width: 4px; }
          .area-main::-webkit-scrollbar-thumb, .area-tracker::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
        }

        .status-card {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 28px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
      ` }} />

      {/* Success Toast Notification */}
      {toast && (
        <div className="toast-notify">
          <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="component-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Resignation Portal</h1>
          <p>Manage departure submissions, notice duration tracking, and clear exit clearing checklists.</p>
        </div>
        
        {/* Prototype controller tools */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {resignationData && (
            <>
              {earlyReliefStatus === 'requested' && (
                <button
                  type="button"
                  onClick={handleSimulateApproveEarlyRelief}
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    color: 'var(--accent-green)',
                    border: '1px dashed var(--accent-green)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <CheckCircle2 size={12} />
                  <span>Approve Early Relief (test)</span>
                </button>
              )}
              
              {(resignationData.status === 'pending' || resignationData.status === 'approved') && (
                <button
                  type="button"
                  onClick={handleResetResignation}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    color: '#ef4444',
                    border: '1px dashed #ef4444',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <XCircle size={12} />
                  <span>Withdraw</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="resignation-layout-grid">
        
        {/* left/main area: Form OR Submission status card */}
        <div className="area-main">
          {resignationData ? (() => {
              const hrStatus = resignationData.status || 'pending';
              const confirmedLwd = resignationData.lwdDate;
              return (
                <div className="status-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-green)' }}>
                    <CheckCircle2 size={24} />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Resignation Submitted</h3>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Submitted on {resignationData.submissionDate}</span>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Effective Resignation Date</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{resignationData.submissionDate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Last Working Day (LWD)</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{confirmedLwd}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>HR Approval Status</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', textTransform: 'capitalize', backgroundColor: hrStatus === 'approved' ? 'rgba(59,130,246,0.1)' : hrStatus === 'cleared' ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)', color: hrStatus === 'approved' ? '#3b82f6' : hrStatus === 'cleared' ? '#10b981' : '#f59e0b' }}>
                        {hrStatus === 'pending' ? '⏳ Awaiting HR Review' : hrStatus === 'withdraw_pending' ? '⏳ Awaiting Withdraw Approval' : hrStatus === 'approved' ? '✓ LWD Confirmed by HR' : '✓ ' + hrStatus}
                      </span>
                    </div>
                    {resignationData.reason && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Reason Provided</span>
                        <p style={{ margin: 0, padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4' }}>"{resignationData.reason}"</p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>
                    <Calendar size={14} />
                    <span>Exit checklist clearing is currently active. HR clearance is pending LWD confirmation.</span>
                  </div>
                </div>
              );
            })() : (
            /* NOT-RESIGNED State form */
            <ResignationForm onSubmit={handleResignSubmit} />
          )}
        </div>

        {/* right/tracker area: Notice period countdown / progress bar */}
        <div className="area-tracker">
          <NoticeTracker 
            resignationData={resignationData}
            onRequestEarlyRelief={handleRequestEarlyRelief}
            earlyReliefStatus={earlyReliefStatus}
          />
        </div>

        {/* bottom area: Assigned Corporate Assets */}
        {resignationData && (
          <div className="area-checklist" style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase' }}>Assigned Corporate Assets</h4>
            {myAssets.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                No assets assigned yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {myAssets.map((asset, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{asset.name} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '13px' }}>({asset.type})</span></div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>SN: {asset.serialNumber || 'N/A'} | Tag: {asset.id}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ backgroundColor: '#3b82f6', color: '#fff', padding: '6px 14px', borderRadius: '14px', fontSize: '12px', fontWeight: 'bold' }}>{asset.returnStatus || 'Issued'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
