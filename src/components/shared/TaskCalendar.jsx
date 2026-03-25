import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TaskCalendar({ tasks = [] }) {
  const monthStart = startOfMonth(new Date(2026, 3, 1)); // Avril 2026
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: fr });
  const endDate = endOfWeek(monthEnd, { locale: fr });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="card glass" style={{ padding: 0 }}>
      {/* Weekdays */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
          <div key={d} style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {days.map(d => {
          const dayStr = format(d, 'yyyy-MM-dd');
          const dayTasks = tasks.filter(t => t.dueDate === dayStr);
          return (
            <div 
              key={d.toString()} 
              style={{ 
                minHeight: '120px', 
                borderRight: '1px solid var(--border)', 
                borderBottom: '1px solid var(--border)',
                padding: '0.5rem',
                background: format(d, 'MM') !== format(monthStart, 'MM') ? 'rgba(0,0,0,0.1)' : 'transparent'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: format(d, 'MM') !== format(monthStart, 'MM') ? 'var(--text-muted)' : 'white' }}>{format(d, 'd')}</div>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {dayTasks.map(t => (
                  <div key={t.id} style={{ fontSize: '0.6rem', padding: '2px 6px', background: t.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', border: `1px solid ${t.priority === 'high' ? 'var(--danger)' : 'var(--primary)'}`, borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
