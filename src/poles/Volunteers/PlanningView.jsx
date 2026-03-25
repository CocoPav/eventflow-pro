import React from 'react';
import { useEvent } from '../../context/EventContext';
import { Calendar as CalendarIcon, Clock, UserCheck } from 'lucide-react';

export default function PlanningView() {
  const { data } = useEvent();
  const { list } = data.poles.volunteers;

  // Mock availability data for the heatmap
  const DAYS = ['Lun 01', 'Mar 02', 'Mer 03', 'Jeu 04', 'Ven 05', 'Sam 06 (JOUR J)', 'Dim 07'];
  const AVAILABILITY = [12, 14, 18, 25, 30, 43, 15];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="card glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <CalendarIcon size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Disponibilités globales</h3>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '200px', padding: '0 1rem' }}>
          {DAYS.map((day, i) => {
            const height = (AVAILABILITY[i] / 50) * 100;
            const isToday = day.includes('Sam 06');
            return (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '100%', height: `${height}%`, background: isToday ? 'var(--primary)' : 'var(--bg-hover)', borderRadius: '4px 4px 0 0', position: 'relative', transition: 'all 0.3s' }}>
                  <div style={{ position: 'absolute', top: '-25px', width: '100%', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{AVAILABILITY[i]}</div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', height: '32px' }}>{day}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <section className="card glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <Clock size={20} color="var(--accent)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Planning Jour J</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {['14h00', '15h00', '18h00', '21h00', '00h00'].map(time => (
              <div key={time} style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, minWidth: '60px', color: 'var(--primary)' }}>{time}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Relève de poste - Buvette / BBQ</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assuré par {list.filter(v => v.role.includes('Buvette')).length} personnes</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <UserCheck size={20} color="var(--success)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Besoin en renfort</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px' }}>
              <p style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.8125rem' }}>Buvette - 00h / 02h</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manque 2 personnes</p>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '8px' }}>
              <p style={{ fontWeight: 700, color: 'var(--warning)', fontSize: '0.8125rem' }}>Parking - 13h / 15h</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manque 1 personne</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
