import { useState, useRef } from 'react';
import { Upload, CheckCircle2, Loader2, X } from 'lucide-react';
import AvatarFallback from '../common/AvatarFallback';

export default function TicketForm({ onSubmitTicket }) {
  const fileInputRef = useRef(null);

  const [issueType, setIssueType] = useState('Software');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  
  // Screenshot upload state
  const [screenshotName, setScreenshotName] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [isUploadingScr, setIsUploadingScr] = useState(false);
  const [uploadProgressScr, setUploadProgressScr] = useState(0);

  // Submit loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingScr(true);
    setUploadProgressScr(0);
    setScreenshotName(file.name);

    // Read image as Data URL for preview, or set placeholder if PDF
    const isImage = file.type.startsWith('image/');
    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setScreenshotPreview('pdf-placeholder');
    }

    const duration = 800; // 800ms
    const intervalTime = 40;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setUploadProgressScr((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsUploadingScr(false);
          return 100;
        }
        return Math.min(prev + step, 100);
      });
    }, intervalTime);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotName('');
    setScreenshotPreview('');
    setUploadProgressScr(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setLastSubmittedId(null);

    const newTicket = {
      issueType,
      description: description.trim(),
      priority,
      screenshotName: screenshotName || null
    };

    try {
      const realTicketId = await onSubmitTicket(newTicket);
      if (realTicketId) {
        setLastSubmittedId(realTicketId);
        // Clear form on success
        setDescription('');
        setScreenshotName('');
        setScreenshotPreview('');
        setUploadProgressScr(0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (lvl) => {
    switch (lvl) {
      case 'High':
        return 'hsl(0, 70%, 55%)'; // --priority-high
      case 'Medium':
        return 'hsl(35, 90%, 60%)'; // --priority-medium
      case 'Low':
      default:
        return 'hsl(240, 20%, 40%)'; // --priority-low
    }
  };

  return (
    <div 
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px', // Spacing & Layout Token: Ticket form padding: 24px
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
          Submit IT Ticket Form
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
          Report software bugs, request access credentials, or report device hardware defects.
        </p>
      </div>

      <form className="responsive-form-grid" onSubmit={handleFormSubmit} style={{ gap: '16px' }}>
        {/* Issue Type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Issue Type</label>
          <select 
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="Hardware">Hardware Defect</option>
            <option value="Software">Software Bug</option>
            <option value="Network">Network/WiFi Issue</option>
            <option value="Access & Permissions">Access & Permissions</option>
            <option value="Other">Other Query</option>
          </select>
        </div>

        {/* Priority Radios with HSL colors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Priority</label>
          <div style={{ display: 'flex', gap: '16px', marginTop: '2px' }}>
            {['Low', 'Medium', 'High'].map((lvl) => (
              <label 
                key={lvl} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: getPriorityColor(lvl), 
                  cursor: 'pointer' 
                }}
              >
                <input 
                  type="radio"
                  name="priority"
                  value={lvl}
                  checked={priority === lvl}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{ accentColor: getPriorityColor(lvl) }}
                />
                {lvl}
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Description</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="3"
            placeholder="Provide a summary of the issue or permission details you require..."
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              lineHeight: '1.4'
            }}
          />
        </div>

        {/* Screenshot / PDF Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            Screenshot / Document Attachment (Optional)
          </label>
          
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Upload size={12} />
              <span>Attach Image / PDF</span>
            </button>
          </div>

          {screenshotPreview && !isUploadingScr && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                height: '80px',
                marginTop: '4px',
                boxSizing: 'border-box'
              }}
            >
              {screenshotPreview === 'pdf-placeholder' ? (
                <div 
                  style={{
                    height: '100%',
                    width: '100px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'hsl(240, 20%, 12%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ff4d4f', textTransform: 'uppercase' }}>
                    PDF File
                  </span>
                </div>
              ) : (
                <AvatarFallback
                  src={screenshotPreview} 
                  alt="Attached Screenshot Preview"
                  style={{
                    height: '100%',
                    width: '100px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    flexShrink: 0
                  }}
                 />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                <span 
                  style={{ 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)', 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {screenshotName}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {screenshotPreview === 'pdf-placeholder' ? 'Document Attachment' : 'Image Attachment'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveScreenshot}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s ease, color 0.2s ease',
                  flexShrink: 0
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
                title="Remove attachment"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Upload Progress Loader */}
          {isUploadingScr && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '150px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: '700', color: 'var(--accent-green)' }}>
                <span>UPLOADING</span>
                <span>{Math.round(uploadProgressScr)}%</span>
              </div>
              <div style={{ height: '3px', backgroundColor: 'var(--border-color)', borderRadius: '1.5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', backgroundColor: 'var(--accent-green)', width: `${uploadProgressScr}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Submit button with loader animation */}
        <div style={{ gridColumn: '1 / -1' }}>
          <button 
            type="submit"
            disabled={isSubmitting || isUploadingScr}
            style={{
              width: '100%',
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-secondary)',
              border: 'none',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: (isSubmitting || isUploadingScr) ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s ease',
              height: '40px'
            }}
          >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="spinner-icon" style={{ animation: 'spin 1s linear infinite' }} />
              <span>Submitting Ticket...</span>
            </>
          ) : (
            <span>Submit Ticket</span>
          )}
          </button>
        </div>

        {/* CSS for spinner rotate */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spinner-icon {
            display: inline-block;
          }
        ` }} />
      </form>

      {/* Success state - Monospace ticket ID shown */}
      {lastSubmittedId && (
        <div 
          style={{
            padding: '10px 12px',
            borderRadius: '6px',
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: 'var(--accent-green)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} />
          <span style={{ fontSize: '11px', fontWeight: '600' }}>
            Ticket created successfully! Ref ID:{' '}
            <span style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'monospace' }}>
              {lastSubmittedId}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
