import { useRef, useState } from 'react';
import { Check, Clock, Upload } from 'lucide-react';

export default function DocCard({ docType, status, uploadedAt, onUpload, onSimulateVerify }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      window.toast.warning('File size must be under 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress bar (File picker + progress bar requirement)
    const duration = 1000; // 1s
    const intervalTime = 40;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsUploading(false);
          if (onUpload) {
            onUpload(file.name);
          }
          return 100;
        }
        return Math.min(prev + step, 100);
      });
    }, intervalTime);
  };

  const triggerUpload = () => {
    if (status === 'missing' && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          color: 'hsl(150, 70%, 50%)', // --doc-verified
          bg: 'rgba(16, 185, 129, 0.05)',
          border: 'hsl(150, 70%, 50%)',
          label: 'Verified by HR',
          icon: <Check size={12} strokeWidth={3} />
        };
      case 'pending':
        return {
          color: 'hsl(35, 90%, 60%)', // --doc-pending
          bg: 'rgba(245, 158, 11, 0.05)',
          border: 'hsl(35, 90%, 60%)',
          label: 'Pending HR Verification', // Label matching expectation
          icon: <Clock size={12} strokeWidth={2.5} />
        };
      case 'missing':
      default:
        return {
          color: 'hsl(240, 20%, 30%)', // --doc-missing
          bg: 'var(--bg-primary)',
          border: 'var(--border-color)',
          label: 'File Missing',
          icon: <Upload size={12} />
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      onClick={triggerUpload}
      style={{
        width: '160px', // Spacing Token
        height: '120px', // Spacing Token
        borderRadius: '10px',
        border: `1.5px solid ${isUploading ? 'var(--accent-green)' : config.border}`,
        backgroundColor: isUploading ? 'var(--bg-primary)' : config.bg,
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: status === 'missing' && !isUploading ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        boxShadow: 'var(--shadow-sm)'
      }}
      onMouseOver={(e) => {
        if (status === 'missing' && !isUploading) {
          e.currentTarget.style.borderColor = 'var(--accent-green)';
          e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.02)';
        }
      }}
      onMouseOut={(e) => {
        if (status === 'missing' && !isUploading) {
          e.currentTarget.style.borderColor = config.border;
          e.currentTarget.style.backgroundColor = config.bg;
        }
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        style={{ display: 'none' }}
      />

      {/* Header: Doc Type - 12px / 700 / uppercase */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: '700',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '0.5px'
          }}
        >
          {docType}
        </span>
        {uploadedAt && !isUploading && (
          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
            Uploaded: {uploadedAt}
          </span>
        )}
      </div>

      {/* Uploading Progress State */}
      {isUploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', paddingBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: '700', color: 'var(--accent-green)' }}>
            <span>UPLOADING</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div style={{ height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                backgroundColor: 'var(--accent-green)',
                width: `${uploadProgress}%`,
                transition: 'width 0.05s linear'
              }}
            />
          </div>
        </div>
      ) : (
        /* Footer Badge: 11px / 700 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: config.color,
              fontSize: '11px',
              fontWeight: '700'
            }}
          >
            {config.icon}
            <span>{config.label}</span>
          </div>

          {/* Prototype simulation controls */}
          {status !== 'missing' && onSimulateVerify && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSimulateVerify(status === 'verified' ? 'pending' : 'verified');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '8px',
                padding: 0,
                cursor: 'pointer',
                textDecoration: 'underline',
                textAlign: 'left',
                width: 'fit-content'
              }}
            >
              {status === 'verified' ? 'Revoke (test)' : 'Verify (test)'}
            </button>
          )}
        </div>
      )}

      {/* Delete file toggle for testing */}
      {status !== 'missing' && !isUploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUpload(null); // resets status to missing
          }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'none',
            border: 'none',
            color: '#ef4444',
            fontSize: '10px',
            cursor: 'pointer',
            padding: '2px'
          }}
          title="Delete document"
        >
          ✕
        </button>
      )}
    </div>
  );
}
