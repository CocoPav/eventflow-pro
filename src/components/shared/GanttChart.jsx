import React from 'react';
import { format, addDays, startOfISOWeek, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function GanttChart({ tasks = [] }) {
  // Use a wider range for Gantt - March to June 2026
  const start = startOfISOWeek(new Date(2026, 2, 1)); 
  const end = addDays(start, 120);
  const days = eachDayOfInterval({ start, end });

  const getPos = (dateStr) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    const diff = Math.floor((date - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff * 30); // 30px per day
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
         <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Chronologie du Projet</h3>
         <div style={{ display: 'flex', gap: '1rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
           <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.4)' }} /> Haute Priorité</span>
           <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.4)' }} /> Moyenne Priorité</span>
         </div>
       </div>

       <div className="card glass" style={{ overflowX: 'auto', padding: 0, borderRadius: '12px' }}>
        <div style={{ minWidth: days.length * 30 + 250 }}>
            {/* Header with Months */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ width: 250, padding: '1rem', fontWeight: 800, borderRight: '1px solid var(--border)', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 10 }}>ACTIONS</div>
              <div style={{ flex: 1, display: 'flex' }}>
                {days.map((d, i) => (
                  (i === 0 || format(d, 'dd') === '01') && (
                    <div key={d.toString()} style={{ minWidth: '100px', padding: '1rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                      {format(d, 'MMMM yyyy', { locale: fr })}
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Days sub-header */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 250, borderRight: '1px solid var(--border)', sticky: 'left', background: 'var(--bg-card)', zIndex: 10 }}></div>
              {days.map(d => (
                <div key={d.toString()} style={{ width: 30, textAlign: 'center', fontSize: '0.55rem', padding: '0.5rem 0', color: format(d, 'i') >= '6' ? 'var(--primary)' : 'var(--text-muted)', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                  {format(d, 'dd')}
                </div>
              ))}
            </div>

            {/* Rows */}
            {tasks.length > 0 ? tasks.map(t => (
              <div key={t.id} style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.03)', position: 'relative', height: '50px', alignItems: 'center' }}>
                <div style={{ width: 250, padding: '0 1rem', fontSize: '0.75rem', fontWeight: 600, borderRight: '1px solid var(--border)', height: '100%', display: 'flex', alignItems: 'center', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 10 }}>
                    {t.status === 'done' ? '✓ ' : ''}{t.title}
                </div>
                <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                  {t.dueDate && (
                    <div 
                        style={{ 
                        position: 'absolute', 
                        left: getPos(t.dueDate) - (t.priority === 'high' ? 90 : 60),
                        width: t.priority === 'high' ? 120 : 90,
                        height: '24px',
                        top: '13px',
                        background: t.priority === 'high' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)',
                        borderRadius: '6px',
                        border: `1px solid ${t.priority === 'high' ? 'var(--danger)' : 'var(--primary)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 8px',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                    >
                        {t.assignee}
                    </div>
                  )}
                  {/* Visual grid lines */}
                  {days.map((d, i) => (
                    <div key={i} style={{ position: 'absolute', left: i * 30, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.03)' }} />
                  ))}
                </div>
              </div>
            )) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Aucune tâche à afficher dans le rétroplanning.</div>
            )}
        </div>
      </div>
    </div>
  );
}
