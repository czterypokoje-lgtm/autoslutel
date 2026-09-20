import React from 'react';
import styles from '../_ui/charts.module.css';

interface DataPoint {
  date: string;
  revenue: number;
  calls: number;
  conversion: number;
}

export function MixedChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) return null;

  const W = 720;
  const H = 260;
  
  const maxRev = Math.max(...data.map(d => d.revenue), 1000);
  const revAxis = Math.ceil(maxRev / 1000) * 1000; // Round up to nearest 1000

  const maxCalls = Math.max(...data.map(d => d.calls), 10);
  const callsAxis = Math.ceil(maxCalls / 10) * 10;

  const paddingLeft = 56;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 34;

  const width = W - paddingLeft - paddingRight;
  const height = H - paddingTop - paddingBottom;

  const stepX = width / Math.max(data.length - 1, 1);

  // Path generators
  let callsPath = '';
  let convPath = '';
  const points: { cx: number; cy: number; type: 'call' | 'conv'; val: number }[] = [];

  data.forEach((d, i) => {
    const x = paddingLeft + i * stepX;
    
    // Calls mapped to height
    const yCall = paddingTop + height - (d.calls / callsAxis) * height;
    callsPath += (i === 0 ? 'M' : 'L') + `${x},${yCall} `;
    points.push({ cx: x, cy: yCall, type: 'call', val: d.calls });

    // Conversion mapped to height (0-100%)
    const yConv = paddingTop + height - (d.conversion / 100) * height;
    convPath += (i === 0 ? 'M' : 'L') + `${x},${yConv} `;
    points.push({ cx: x, cy: yConv, type: 'conv', val: d.conversion });
  });

  return (
    <div className={styles.chartWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart} style={{overflow: 'visible'}}>
        
        {/* Y Axis Left (Revenue) */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = paddingTop + height - (height * ratio);
          return (
            <g key={`yL-${i}`}>
              <line x1={paddingLeft} x2={W - paddingRight} y1={y} y2={y} stroke="var(--crm-rule)" strokeDasharray={ratio > 0 ? "4 4" : ""} />
              <text x={paddingLeft - 8} y={y} textAnchor="end" alignmentBaseline="middle" fill="var(--crm-muted)" fontSize="11">
                €{Math.round(revAxis * ratio)}
              </text>
            </g>
          );
        })}

        {/* Y Axis Right (Conversion %) */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = paddingTop + height - (height * ratio);
          return (
            <text key={`yR-${i}`} x={W - paddingRight + 8} y={y} textAnchor="start" alignmentBaseline="middle" fill="var(--crm-muted)" fontSize="11">
              {Math.round(100 * ratio)}%
            </text>
          );
        })}

        {/* Bars (Revenue) */}
        {data.map((d, i) => {
          const x = paddingLeft + i * stepX;
          const h = (d.revenue / revAxis) * height;
          const y = paddingTop + height - h;
          const barW = Math.min(24, stepX * 0.6);
          return (
            <rect 
              key={`bar-${i}`}
              x={x - barW/2} 
              y={y} 
              width={barW} 
              height={h} 
              fill="var(--crm-accent)" 
              opacity="0.4"
              rx="2"
            />
          );
        })}

        {/* Lines */}
        <path d={callsPath} fill="none" stroke="#2196F3" strokeWidth="2" />
        <path d={convPath} fill="none" stroke="#4CAF50" strokeWidth="2" />

        {/* Points */}
        {points.map((p, i) => (
          <circle 
            key={`pt-${i}`}
            cx={p.cx} 
            cy={p.cy} 
            r="4" 
            fill={p.type === 'call' ? '#2196F3' : '#4CAF50'} 
            stroke="var(--crm-panel)" 
            strokeWidth="2" 
          />
        ))}

        {/* X Axis labels */}
        {data.map((d, i) => {
          const x = paddingLeft + i * stepX;
          // show subset if many points
          if (data.length > 10 && i % 2 !== 0) return null;
          return (
            <text key={`x-${i}`} x={x} y={H - 4} textAnchor="middle" fill="var(--crm-muted)" fontSize="11">
              {d.date}
            </text>
          );
        })}

      </svg>
    </div>
  );
}
