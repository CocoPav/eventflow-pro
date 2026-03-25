import React from 'react';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const SLOTS = ['Matin', 'Après-midi', 'Soir'];

export default function AvailabilityGrid({ availability = {}, onChange, readOnly = false }) {
  const toggle = (day, slot) => {
    if (readOnly) return;
    const key = `${day}-${slot}`;
    const newAvail = { ...availability };
    newAvail[key] = !newAvail[key];
    onChange(newAvail);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(7, 1fr)', gap: '4px', background: 'var(--border)', padding: '1px', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-sidebar)', padding: '0.5rem', fontSize: '0.65rem', fontWeight: 700 }}>SLOT \ JOUR</div>
      {DAYS.map(d => (
        <div key={d} style={{ background: 'var(--bg-sidebar)', padding: '0.5rem', fontSize: '0.65rem', textAlign: 'center', fontWeight: 700 }}>{d.slice(0, 3)}</div>
      ))}

      {/* Rows */}
      {SLOTS.map(slot => (
        <React.Fragment key={slot}>
          <div style={{ background: 'var(--bg-sidebar)', padding: '0.75rem 0.5rem', fontSize: '0.7rem', fontWeight: 600 }}>{slot}</div>
          {DAYS.map(day => {
            const isActive = availability[`${day}-${slot}`];
            return (
              <div 
                key={`${day}-${slot}`}
                onClick={() => toggle(day, slot)}
                style={{ 
                  background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                  cursor: readOnly ? 'default' : 'pointer',
                  transition: 'background 0.2s',
                  minHeight: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isActive ? 0.8 : 1
                }}
                onMouseEnter={(e) => !readOnly && (e.currentTarget.style.filter = 'brightness(1.2)')}
                onMouseLeave={(e) => !readOnly && (e.currentTarget.style.filter = 'none')}
              >
                {isActive && <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%' }} />}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}
