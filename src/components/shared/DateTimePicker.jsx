import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalIcon } from 'lucide-react';

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR   = ['Lu','Ma','Me','Je','Ve','Sa','Di'];

/**
 * DateTimePicker — style Google Calendar.
 * Usage :
 *   <DateTimePicker
 *     value="2026-06-06"          // ISO date string
 *     onChange={(iso) => ...}
 *     showTime={true}             // affiche le sélecteur d'heure
 *     timeValue="20:00"
 *     onTimeChange={(hhmm) => ...}
 *     placeholder="Choisir une date"
 *   />
 */
export default function DateTimePicker({
  value, onChange,
  showTime = false,
  timeValue, onTimeChange,
  placeholder = 'Date',
  minDate,
  className,
}) {
  const [open, setOpen]     = useState(false);
  const [viewDate, setView] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const ref = useRef(null);

  /* ── Close on outside click ── */
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── Helpers ── */
  const selected = value ? new Date(value) : null;

  const selectDate = (d) => {
    const iso = d.toISOString().split('T')[0];
    onChange?.(iso);
    if (!showTime) setOpen(false);
  };

  const prevMonth = () => setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1));
  const nextMonth = () => setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1));

  /* ── Build calendar grid ── */
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  // Monday-based: 0=Mon … 6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  /* ── Display value ── */
  const displayDate = selected
    ? selected.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const displayText = showTime && timeValue
    ? `${displayDate}${displayDate ? ' · ' : ''}${timeValue}`
    : displayDate;

  const today = new Date(); today.setHours(0,0,0,0);
  const minD  = minDate ? new Date(minDate) : null;

  /* ── Time options ── */
  const timeOpts = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      timeOpts.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', width: '100%' }} className={className}>

      {/* Trigger input */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          background: 'var(--bg-input)',
          border: `1px solid ${open ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '0.5rem 0.75rem',
          cursor: 'pointer',
          color: displayText ? 'var(--text-main)' : 'var(--text-subtle)',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-main)',
          textAlign: 'left',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: open ? '0 0 0 3px var(--primary-soft)' : 'none',
        }}
      >
        <CalIcon size={14} color={open ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{displayText || placeholder}</span>
      </button>

      {/* Popover */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 3000,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1rem',
          minWidth: 280,
          animation: 'scaleIn 0.15s var(--ease-out) forwards',
          transformOrigin: 'top left',
        }}>

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <button onClick={prevMonth} style={navBtnStyle}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {MONTHS_FR[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button onClick={nextMonth} style={navBtnStyle}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {DAYS_FR.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', padding: '2px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const thisDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              thisDate.setHours(0,0,0,0);
              const isSelected = selected && thisDate.getTime() === new Date(selected.getFullYear(), selected.getMonth(), selected.getDate()).getTime();
              const isToday    = thisDate.getTime() === today.getTime();
              const isDisabled = minD && thisDate < minD;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && selectDate(thisDate)}
                  style={{
                    width: '100%', aspectRatio: '1',
                    border: 'none',
                    borderRadius: isSelected ? '50%' : 'var(--radius-sm)',
                    background: isSelected
                      ? 'var(--primary)'
                      : isToday
                      ? 'var(--primary-soft)'
                      : 'transparent',
                    color: isSelected
                      ? 'white'
                      : isDisabled
                      ? 'var(--text-subtle)'
                      : isToday
                      ? 'var(--primary)'
                      : 'var(--text-main)',
                    fontSize: '0.75rem',
                    fontWeight: isToday || isSelected ? 700 : 400,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isDisabled && !isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'var(--primary-soft)' : 'transparent'; }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time selector */}
          {showTime && (
            <div style={{ marginTop: '0.875rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <Clock size={13} color="var(--text-muted)" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Heure
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 3,
                maxHeight: 120,
                overflowY: 'auto',
              }}>
                {timeOpts.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { onTimeChange?.(t); }}
                    style={{
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      background: timeValue === t ? 'var(--primary)' : 'var(--bg-input)',
                      color: timeValue === t ? 'white' : 'var(--text-main)',
                      fontSize: '0.7rem',
                      fontWeight: timeValue === t ? 700 : 400,
                      padding: '4px 2px',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (timeValue !== t) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { if (timeValue !== t) e.currentTarget.style.background = 'var(--bg-input)'; }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Today button */}
          <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => { selectDate(new Date()); setView(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)',
                padding: '2px 8px', borderRadius: 'var(--radius-sm)',
              }}
            >
              Aujourd'hui
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const navBtnStyle = {
  background: 'var(--bg-hover)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  width: 26, height: 26,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  transition: 'background 0.12s',
};
