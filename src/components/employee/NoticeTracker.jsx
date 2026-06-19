import { Clock } from 'lucide-react';

export default function NoticeTracker({ resignationData, onRequestEarlyRelief, earlyReliefStatus }) {
  if (!resignationData) {
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
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          minHeight: '260px',
          gap: '12px',
          color: 'var(--text-muted)'
        }}
      >
        <Clock size={36} style={{ opacity: 0.5 }} />
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)' }}>
            Notice Period Tracker
          </h4>
          <p style={{ margin: 0, fontSize: '12px', maxWidth: '280px', lineHeight: '1.4' }}>
            Notice period progress bars and LWD countdowns will activate here once a resignation is submitted.
          </p>
        </div>
      </div>
    );
  }

  const { submissionDate, lwdDate } = resignationData;

  // Calculate total notice period days dynamically
  const start = new Date(submissionDate);
  const end = new Date(lwdDate);
  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

  // Calculate remaining days countdown
  const today = new Date();
  const diffTime = end - today;
  const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const daysServed = resignationData.daysServed !== undefined 
    ? resignationData.daysServed 
    : Math.max(0, Math.floor((today - start) / (1000 * 60 * 60 * 24)));

  const progressPercent = Math.min(100, Math.max(0, (daysServed / totalDays) * 100));

  const isLastWeek = remainingDays < 7;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
          Notice Period Tracker
        </h3>
        <span 
          style={{ 
            fontSize: '11px', 
            fontWeight: '700', 
            backgroundColor: 'rgba(59, 130, 246, 0.08)', 
            color: 'var(--accent-blue)', 
            padding: '3px 8px', 
            borderRadius: '4px' 
          }}
        >
          Active Notice
        </span>
      </div>

      {/* Notice Progress (daysServed / totalDays) served */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            Notice Period Served
          </span>
          <span 
            style={{ 
              fontSize: '20px', // Typography Token: Notice progress 20px / 800 / tabular-nums
              fontWeight: '800', 
              fontFamily: 'monospace', 
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px'
            }}
          >
            {daysServed} / {totalDays} <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Days</span>
          </span>
        </div>

        {/* Notice progress bar (height 12px, color --notice-bar-fill HSL) */}
        <div style={{ height: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', overflow: 'hidden' }}>
          <div 
            style={{
              height: '100%',
              backgroundColor: 'hsl(265, 70%, 60%)', // --notice-bar-fill HSL
              width: `${progressPercent}%`,
              transition: 'width 0.5s ease-out'
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>
          <span>Sub: {submissionDate}</span>
          <span>{Math.round(progressPercent)}% served</span>
          <span>LWD: {lwdDate}</span>
        </div>
      </div>

      {/* LWD Countdown display (80px height container) */}
      <div 
        style={{
          height: '80px', // Spacing & Layout Token
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Days Until LWD
          </span>
          {isLastWeek && (
            <span 
              style={{ 
                fontSize: '10px', 
                fontWeight: '700', 
                backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                color: '#d97706', 
                padding: '2px 6px', 
                borderRadius: '3px',
                width: 'fit-content'
              }}
            >
              Last week!
            </span>
          )}
        </div>

        {/* Countdown display (24px / 800 / color --lwd-countdown) */}
        <span 
          style={{
            fontSize: '24px', // Typography Token
            fontWeight: '800',
            fontFamily: 'monospace',
            color: 'hsl(0, 70%, 60%)' // --lwd-countdown HSL
          }}
        >
          {remainingDays} {remainingDays === 1 ? 'Day' : 'Days'}
        </span>
      </div>

      {/* Early Relief request controls */}
      <div 
        style={{ 
          borderTop: '1px solid var(--border-color)', 
          paddingTop: '16px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px' 
        }}
      >
        {earlyReliefStatus === 'requested' ? (
          <div 
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(245, 158, 11, 0.05)',
              border: '1px dashed rgba(245, 158, 11, 0.3)',
              color: '#d97706',
              fontSize: '11px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={12} />
            <span>Early relief request is pending HR & Lead approval.</span>
          </div>
        ) : earlyReliefStatus === 'approved' ? (
          <div 
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              border: '1px dashed rgba(16, 185, 129, 0.3)',
              color: 'var(--accent-green)',
              fontSize: '11px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={12} />
            <span>Early relief request has been approved! LWD updated.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Need to release early for another offer or education?
            </span>
            <button 
              type="button"
              onClick={onRequestEarlyRelief}
              style={{
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--text-muted)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Request Early Relief
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
