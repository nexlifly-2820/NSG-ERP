import { useState, useRef, useEffect } from 'react';
import { Check, Edit, ShieldCheck, FileCheck, X } from 'lucide-react';

export default function AssetNoc({ issuedAssets, onSignNoc, hasResigned }) {
  const [activeNoc, setActiveNoc] = useState(null); // The asset item currently being signed
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Resize canvas for high resolution displays and set dimensions
  useEffect(() => {
    if (activeNoc && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      // Set display size (css pixels)
      canvas.style.width = '100%';
      canvas.style.height = '160px';
      // Set actual size in memory
      canvas.width = canvas.offsetWidth;
      canvas.height = 160;

      // Clear with primary background
      ctx.fillStyle = '#f8fafc';
      // Check if dark mode is active and set canvas mock bg accordingly
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      ctx.fillStyle = isDark ? '#1f2937' : '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [activeNoc]);

  // Drawing handlers (mouse)
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a'; // dark line
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) ctx.strokeStyle = '#f9fafb'; // light line in dark mode

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Drawing handlers (touch)
  const handleTouchStart = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) ctx.strokeStyle = '#f9fafb';

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    ctx.fillStyle = isDark ? '#1f2937' : '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleConfirm = () => {
    if (!activeNoc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL("image/png");
    onSignNoc(activeNoc.id, activeNoc.type, signatureData);
    setActiveNoc(null);
  };

  if (!issuedAssets || issuedAssets.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
          Asset Handover NOC (No Objection Certificate)
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
          Acknowledge return of corporate items and digitally sign off on hardware handovers for HR records.
        </p>
      </div>

      {/* NOC List Table */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {issuedAssets.map((asset) => {
            const isSigned = asset.returnStatus === 'Signed';
            const isRedAlert = hasResigned && !isSigned;
            return (
              <div
                key={asset.id}
                style={{
                  height: '52px', // Design Token height constraint
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isSigned
                    ? 'rgba(16, 185, 129, 0.01)'
                    : (isRedAlert ? 'rgba(239, 68, 68, 0.03)' : 'var(--bg-primary)'),
                  borderColor: isSigned
                    ? 'rgba(16, 185, 129, 0.15)'
                    : (isRedAlert ? 'rgba(239, 68, 68, 0.25)' : 'var(--border-color)'),
                  opacity: isSigned ? 0.65 : 1,
                  transition: 'all 0.3s ease',
                  gap: '12px'
                }}
              >
                {/* Details Column */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: isSigned ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSigned ? 'hsl(150, 70%, 50%)' : 'var(--text-secondary)'
                    }}
                  >
                    <FileCheck size={16} />
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
                        Issued: {asset.issueDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Column */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                  {isSigned ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'hsl(150, 70%, 50%)' }}>
                        <Check size={12} strokeWidth={3} />
                        <span style={{ fontSize: '11px', fontWeight: '700' }}>Signed NOC</span>
                      </div>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                        Signed on {asset.signedDate}
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Exit Clearance Warning Note */}
                      {isRedAlert ? (
                        <span style={{ fontSize: '11px', color: 'hsl(0, 70%, 55%)', fontWeight: '700' }}>
                          Pending NOC
                        </span>
                      ) : (
                        (asset.type === 'Laptop' || asset.type === 'Access Card') && (
                          <span className="noc-warning-text" style={{ fontSize: '10px', color: 'hsl(265, 70%, 60%)', fontWeight: '600' }}>
                            Required for exit clearance
                          </span>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveNoc(asset)}
                        style={{
                          backgroundColor: 'hsl(265, 70%, 60%)', // --noc-pending HSL
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'hsl(265, 70%, 50%)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'hsl(265, 70%, 60%)'}
                      >
                        <Edit size={10} />
                        <span>Sign NOC</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Signature Canvas Modal */}
      {activeNoc && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)', // dark transparent overlay
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1500,
            padding: '20px'
          }}
        >
          {/* scaleIn 300ms CSS applied */}
          <div
            ref={containerRef}
            className="scale-in"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Modal Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Digital Signature Handover
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Sign for {activeNoc.type} ({activeNoc.assetTag}) to confirm return.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNoc(null)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Canvas Drawing Area */}
            <div
              style={{
                position: 'relative',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-primary)'
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  cursor: 'crosshair',
                  display: 'block'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '9px',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Draw Signature Here
              </span>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleClear}
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setActiveNoc(null)}
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  border: 'none',
                  backgroundColor: 'hsl(265, 70%, 60%)',
                  color: 'white',
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
                <ShieldCheck size={12} />
                <span>Confirm Sign</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation scaleIn & noc warning responsiveness */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .scale-in {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .noc-warning-text {
          display: none;
        }
        @media (min-width: 768px) {
          .noc-warning-text {
            display: inline;
          }
        }
      ` }} />
    </div>
  );
}
