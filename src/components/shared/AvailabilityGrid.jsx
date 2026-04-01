import React from 'react';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const SLOTS = ['Matin', 'Après-midi', 'Soir'];

export default function AvailabilityGrid({ availability = {}, onChange, readOnly = false }) {
  const toggle = (day, slot) => {
    if (readOnly) return;
    const key = `${day}-${slot}`;
    onChange({ ...availability, [key]: !availability[key] });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px repeat(7, 1fr)', gap: '2px' }}>
      {/* Header */}
      <div style={{ padding: '0.4rem', fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8' }} />
      {DAYS.map(d => (
        <div key={d} style={{ padding: '0.4rem 0', fontSize: '0.62rem', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
          {d.slice(0, 3)}
        </div>
      ))}

      {/* Rows */}
      {SLOTS.map(slot => (
        <React.Fragment key={slot}>
          <div style={{ padding: '0.5rem 0.4rem', fontSize: '0.68rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center' }}>
            {slot}
          </div>
          {DAYS.map(day => {
            const isActive = !!availability[`${day}-${slot}`];
            return (
              <div
                key={`${day}-${slot}`}
                onClick={() => toggle(day, slot)}
                style={{
                  background: isActive ? 'var(--primary)' : '#f1f3f5',
                  cursor: readOnly ? 'default' : 'pointer',
                  transition: 'background 0.15s',
                  borderRadius: 6,
                  minHeight: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: isActive ? '1.5px solid var(--primary)' : '1.5px solid #e9ecef'
                }}
                onMouseEnter={e => !readOnly && !isActive && (e.currentTarget.style.background = '#e2e8f0')}
                onMouseLeave={e => !readOnly && !isActive && (e.currentTarget.style.background = '#f1f3f5')}
              >
                {isActive && <div style={{ width: 6, height: 6, background: 'white', borderRadius: '50%' }} />}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}
