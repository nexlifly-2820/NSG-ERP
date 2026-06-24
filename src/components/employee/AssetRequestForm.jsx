import { useState } from 'react';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function AssetRequestForm({ onRequestSubmit, requests }) {
  const [assetType, setAssetType] = useState('');
  const [reason, setReason] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!assetType.trim()) newErrors.assetType = 'Asset Type is required.';
    if (!reason.trim()) newErrors.reason = 'Description is required.';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setIsSubmitting(true);
    
    try {
      await onRequestSubmit({
        assetType,
        reason: reason.trim(),
        urgency
      });

      setReason('');
      setUrgency('Medium');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReasonChange = (val) => {
    setReason(val);
    if (val.trim().length > 0) {
      setErrors(p => ({...p, reason: ''}));
    } else {
      setErrors(p => ({...p, reason: 'Description is required.'}));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'hsl(150, 70%, 50%)'; // --asset-approved
      case 'Rejected':
        return 'hsl(0, 70%, 55%)'; // --asset-rejected
      case 'Pending':
      default:
        return 'hsl(35, 90%, 60%)'; // --asset-pending
    }
  };

  const getUrgencyBg = (urg) => {
    switch (urg) {
      case 'High':
        return 'rgba(239, 68, 68, 0.08)';
      case 'Medium':
        return 'rgba(245, 158, 11, 0.08)';
      case 'Low':
      default:
        return 'rgba(59, 130, 246, 0.08)';
    }
  };

  const getUrgencyColor = (urg) => {
    switch (urg) {
      case 'High':
        return 'hsl(0, 70%, 55%)';
      case 'Medium':
        return 'hsl(35, 90%, 60%)';
      case 'Low':
      default:
        return 'hsl(210, 70%, 50%)';
    }
  };

  const urgencyOptions = [
    { key: 'Low', label: 'Low - anytime this week' },
    { key: 'Medium', label: 'Medium - within 2 days' },
    { key: 'High', label: 'High - urgent, blocking work' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Request Form Card */}
      <div 
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '24px', // Spacing & Layout Token: Request form padding: 24px
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
            Request New Asset Form
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
            Submit an official requisition for hardware or access peripherals to your Team Lead.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Asset Type Select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: errors.assetType ? '0px' : '0px' }}>
              Asset Type <span style={{ color: '#ef4444' }}>*</span>
            </label>
            {errors.assetType && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px', fontWeight: '500', marginBottom: '2px' }}><AlertCircle size={14} /> {errors.assetType}</span>
            )}
            <input
              type="text"
              value={assetType}
              onChange={(e) => { 
                setAssetType(e.target.value); 
                if (e.target.value.trim()) setErrors(p => ({...p, assetType: ''})); 
                else setErrors(p => ({...p, assetType: 'Asset Type is required.'})); 
              }}
              onFocus={(e) => { if (!e.target.value.trim()) setErrors(p => ({...p, assetType: 'Asset Type is required.'})); }}
              onClick={(e) => { if (!e.target.value.trim()) setErrors(p => ({...p, assetType: 'Asset Type is required.'})); else setErrors(p => ({...p, assetType: ''})); }}
              required
              placeholder="e.g. Laptop, Monitor, Headset..."
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: errors.assetType ? '1px solid #ef4444' : '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>

          {/* Urgency Badge Radios */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Urgency
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
              {urgencyOptions.map((opt) => (
                <label 
                  key={opt.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: getUrgencyColor(opt.key),
                    cursor: 'pointer'
                  }}
                >
                  <input 
                    type="radio"
                    name="urgency"
                    value={opt.key}
                    checked={urgency === opt.key}
                    onChange={(e) => setUrgency(e.target.value)}
                    style={{ accentColor: getUrgencyColor(opt.key) }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Reason Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: errors.reason ? '0px' : '0px' }}>
              Description <span style={{ color: '#ef4444' }}>*</span>
            </label>
            {errors.reason && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px', fontWeight: '500', marginBottom: '2px' }}><AlertCircle size={14} /> {errors.reason}</span>
            )}
            <textarea
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              onFocus={(e) => { if (!e.target.value.trim()) setErrors(p => ({...p, reason: 'Description is required.'})); }}
              onClick={(e) => { if (!e.target.value.trim()) setErrors(p => ({...p, reason: 'Description is required.'})); else setErrors(p => ({...p, reason: ''})); }}
              required
              rows="3"
              placeholder="My laptop battery is dead and cannot hold charge..."
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: errors.reason ? '1px solid #ef4444' : '1px solid var(--border-color)',
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: isSubmitting ? '#9ca3af' : 'var(--text-primary)',
              color: 'var(--bg-secondary)',
              border: 'none',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '40px'
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

    </div>
  );
}
