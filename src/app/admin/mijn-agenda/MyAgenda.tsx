'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Calendar.module.css';

export interface AgendaDay {
  date: string;
  isToday: boolean;
  away: boolean;
  reason: string;
  jobs: {
    id: string;
    status: string;
    slot_start: string;
    slot_end: string;
    place: string;
    service: string;
    kenteken: string;
    price?: number;
  }[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function MyAgenda({ days, name, icalToken, currentMonth }: { days: AgendaDay[]; name: string; icalToken: string; currentMonth: string; }) {
  const router = useRouter();

  // Navigation state
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const activeDay = days.find(d => d.date === selectedDate);
  const [busy, setBusy] = useState('');

  async function toggleAway(day: AgendaDay) {
    setBusy(day.date);
    await fetch('/api/admin/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: day.date, available: day.away }),
    }).catch(() => null);
    setBusy('');
    router.refresh();
  }

  // Month navigation logic
  const [yearStr, monthStr] = currentMonth.split('-');
  const dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
  const currentMonthIdx = dateObj.getMonth();
  const currentYear = dateObj.getFullYear();

  const handlePrevMonth = () => {
    const prev = new Date(currentYear, currentMonthIdx - 1, 1);
    const m = prev.toISOString().substring(0, 7);
    router.push(`?month=${m}`);
  };

  const handleNextMonth = () => {
    const next = new Date(currentYear, currentMonthIdx + 1, 1);
    const m = next.toISOString().substring(0, 7);
    router.push(`?month=${m}`);
  };

  // View toggle state
  const [viewMode, setViewMode] = useState<'standaard' | 'heatmap'>('heatmap');

  const handleAdjustScheduleClick = () => {
    alert("Klik op een dag in de kalender (links of in het overzicht) en gebruik vervolgens de knop 'Vrij nemen' of 'Zet op beschikbaar' in het zijpaneel.");
  };

  return (
    <div className={styles.calendarContainer}>
      
      {/* SIDEBAR */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Agenda: {name}</div>
        
        <div className={styles.miniCalendar}>
          <div className={styles.miniCalendarHeader}>
            <button onClick={handlePrevMonth} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem' }}>&lt;</button>
            <span>{MONTHS[currentMonthIdx]} {currentYear}</span>
            <button onClick={handleNextMonth} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem' }}>&gt;</button>
          </div>
          <div className={styles.miniGrid}>
            {DAYS.map(d => <div key={d} className={styles.miniDayHeader}>{d}</div>)}
            {days.map((d, i) => {
              const dNum = new Date(d.date).getDate();
              const isSelected = d.date === selectedDate;
              return (
                <div 
                  key={d.date} 
                  className={`${styles.miniDay} ${isSelected ? styles.miniDayActive : ''}`}
                  onClick={() => setSelectedDate(d.date)}
                >
                  {dNum}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Panel */}
        <div className={styles.filters} style={{ flex: 1 }}>
          <div className={styles.filterHeader}>
            Details voor {selectedDate ? new Date(selectedDate).toLocaleDateString('nl-NL') : ''}
          </div>
          
          {!activeDay ? (
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Klik op een dag in de kalender.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className={styles.outlinedButton}
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => toggleAway(activeDay)}
                  disabled={busy === activeDay.date}
                >
                  {busy === activeDay.date
                    ? '...'
                    : activeDay.away
                      ? 'Zet op beschikbaar'
                      : 'Vrij nemen (blokkeren)'}
                </button>
              </div>

              {activeDay.away && (
                <div style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 500 }}>🔴 Niet beschikbaar ({activeDay.reason || 'Vrij'})</div>
              )}
              
              {activeDay.jobs.length === 0 ? (
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Geen klussen ingepland.</div>
              ) : (
                activeDay.jobs.map(job => (
                  <div key={job.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.875rem' }}>{job.slot_start.substring(0, 5)} - {job.slot_end.substring(0, 5)}</strong>
                      <span className={`${styles.badge} ${styles[`badge_${job.status}`] || styles.badgeInquiry}`}>{job.status}</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.25rem' }}>
                      📍 {job.place}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.25rem' }}>
                      🔧 {job.service || 'Geen dienst'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                      🚗 {job.kenteken || 'Onbekend'}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className={styles.main}>
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <h1>Calendar</h1>
          </div>
          <div className={styles.topBarRight}>
            <div className={styles.buttonGroup}>
              <button 
                className={`${styles.button} ${viewMode === 'standaard' ? styles.buttonActive : ''}`}
                onClick={() => setViewMode('standaard')}
              >
                Standaard
              </button>
              <button 
                className={`${styles.button} ${viewMode === 'heatmap' ? styles.buttonActive : ''}`}
                onClick={() => setViewMode('heatmap')}
              >
                Omzet Heatmap
              </button>
            </div>
            <button className={styles.outlinedButton} onClick={handleAdjustScheduleClick}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Mijn rooster aanpassen
            </button>
            <button className={styles.outlinedButton}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Maand v
            </button>
          </div>
        </div>

        <div className={styles.calendarGrid}>
          {/* Header Row */}
          <div className={styles.weekHeader} style={{ background: 'transparent' }}>W</div>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className={styles.weekHeader}>{day}</div>
          ))}

          {/* Grid Cells */}
          {Array.from({ length: 5 }).map((_, weekIdx) => (
            <div style={{ display: 'contents' }} key={`w${weekIdx}`}>
              {/* Week Number Col */}
              <div className={styles.weekNumber}>{44 + weekIdx}</div>
              
              {/* 7 Days per week */}
              {Array.from({ length: 7 }).map((_, dayIdx) => {
                const cellIndex = weekIdx * 7 + dayIdx;
                const realDay = days[cellIndex];
                
                if (!realDay) return <div key={`empty-${cellIndex}`} className={styles.dayCell} />;

                const dateNum = new Date(realDay.date).getDate();
                const totalJobs = realDay.jobs.length;
                const revenue = realDay.jobs.reduce((sum, j) => sum + (j.price || 0), 0);
                const isBlue = viewMode === 'heatmap' && totalJobs > 0;
                
                return (
                  <div 
                    key={realDay.date} 
                    className={`${styles.dayCell} ${isBlue ? styles.dayCellActive : ''}`}
                    onClick={() => setSelectedDate(realDay.date)}
                    style={{ cursor: 'pointer', outline: realDay.date === selectedDate ? '2px solid #3b82f6' : 'none' }}
                  >
                    <div className={styles.dayHeader}>
                      <span className={realDay.isToday ? styles.dayHeaderCurrent : ''}>{dateNum}</span>
                    </div>
                    
                    <div className={styles.dayContent}>
                      {/* List out actual jobs inside the cell */}
                      <div className={styles.jobList}>
                        {realDay.jobs.map(job => (
                          <div key={job.id} className={`${styles.jobChip} ${styles[`jobChip_${job.status}`] || styles.jobChip_default}`} title={`${job.service} - ${job.place}`}>
                            <span className={styles.jobTime}>{job.slot_start.substring(0, 5)}</span>
                            <span className={styles.jobDesc}>{job.kenteken || job.place}</span>
                          </div>
                        ))}
                      </div>

                      {totalJobs > 0 && viewMode === 'heatmap' && (
                        <div className={styles.dayFooter}>
                          <div className={styles.statRow}>Verwachte Omzet</div>
                          <div className={styles.statValue} style={{ fontSize: '1rem' }}>
                            €{revenue}
                          </div>
                        </div>
                      )}
                      {realDay.away && (
                        <div className={styles.statRow} style={{ color: '#ef4444' }}>Vrij/Afwezig</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
