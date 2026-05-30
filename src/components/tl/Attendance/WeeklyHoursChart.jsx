import React from 'react';
import styles from './attendance.module.css';
import { TrendingUp } from 'lucide-react';

const WeeklyHoursChart = ({ data }) => {
  // SVG drawing parameters
  const chartHeight = 80;
  const chartWidth = 320;
  const points = data.map((item, idx) => {
    const x = 30 + idx * 60;
    // Map hours to SVG height: e.g. 0 to 10 hours maps to chart height
    const y = chartHeight - (item.hours / 10) * chartHeight + 10;
    return { x, y, label: item.day, hours: item.hours };
  });

  // Construct path string
  let pathStr = '';
  points.forEach((p, idx) => {
    if (idx === 0) {
      pathStr += `M ${p.x} ${p.y}`;
    } else {
      pathStr += ` L ${p.x} ${p.y}`;
    }
  });

  // Construct fill path string (closed poly)
  let fillPathStr = pathStr;
  if (points.length > 0) {
    fillPathStr += ` L ${points[points.length - 1].x} ${chartHeight + 15}`;
    fillPathStr += ` L ${points[0].x} ${chartHeight + 15} Z`;
  }

  return (
    <div className={styles.analyticsCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className={styles.insightHeadingText} style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0' }}>
          <TrendingUp size={16} style={{ color: 'var(--att-primary)' }} />
          Weekly Hours Logged
        </h3>
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--att-success)', backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '2px 8px', borderRadius: '6px' }}>
          Target: 40 Hrs
        </span>
      </div>

      <div className={styles.chartContainer}>
        {/* SVG Drawing Canvas */}
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`} className={styles.chartSvg}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--att-primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--att-primary)" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="20" y1={chartHeight / 2} x2={chartWidth - 20} y2={chartHeight / 2} stroke="var(--att-border)" strokeDasharray="3,3" />
          <line x1="20" y1={chartHeight} x2={chartWidth - 20} y2={chartHeight} stroke="var(--att-border)" />

          {/* Area under curve fill */}
          {fillPathStr && <path d={fillPathStr} fill="url(#chartGradient)" />}

          {/* Stroke Line */}
          {pathStr && <path d={pathStr} fill="none" stroke="var(--att-primary)" strokeWidth="2.5" strokeLinecap="round" />}

          {/* Data point circle markers & tooltips */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="4.5" 
                fill="#ffffff" 
                stroke="var(--att-primary)" 
                strokeWidth="2.5" 
                style={{ cursor: 'pointer' }}
              />
              <text 
                x={p.x} 
                y={p.y - 10} 
                textAnchor="middle" 
                fontSize="8.5px" 
                fontWeight="700" 
                fill="var(--att-text-primary)"
              >
                {p.hours.toFixed(1)}h
              </text>
            </g>
          ))}
        </svg>

        {/* Axis Day Labels */}
        <div className={styles.chartAxisLabels}>
          {data.map((item, idx) => (
            <span key={idx}>{item.day}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyHoursChart;
