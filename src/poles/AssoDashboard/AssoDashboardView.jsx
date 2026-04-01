import React from 'react';
import { useEvent } from '../../context/EventContext';
import { Users, CalendarDays, Wallet, CheckSquare, ArrowRight, Clock } from 'lucide-react';

export default function AssoDashboardView({ onViewChange }) {
  const { data } = useEvent();
  const asso = data.association || {};
  const event = data.event;
  const members = data.association?.members || [];
  const volunteers = data.poles.volunteers?.list || [];
  const revenues = (data.poles.budget?.revenues || []).reduce((s, r) => s + r.amount, 0);
  const expenses = (data.poles.budget?.expenses || []).reduce((s, e) => s + e.amount, 0);
  const tasks = data.poles.communication?.tasks || [];
  const pendingTasks = tasks.filter(t => t.status !== 'done');

  const daysLeft = event?.date
    ? Math.ceil((new Date(event.date) - new Date()) / 86400000)
    : null;

  const fmt = v => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  const stats = [
    { label: 'Membres', value: members.length || '—', sub: 'adhérents actifs', icon: Users, color: 'var(--primary)' },
    { label: 'Bénévoles', value: volunteers.length, sub: `${volunteers.filter(v => v.status === 'confirmed').length} confirmés`, icon: Users, color: '#6366f1' },
    { label: 'Budget net', value: fmt(revenues - expenses), sub: revenues > expenses ? 'excédent' : 'déficit', icon: Wallet, color: revenues >= expenses ? '#22c55e' : '#ef4444' },
    { label: 'Tâches en cours', value: pendingTasks.length, sub: 'à traiter', icon: CheckSquare, color: '#f59e0b' },
  ];

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: 1000 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{asso.name}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>{asso.type} · {asso.city}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <Icon size={18} color={color} />
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{value}</p>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Next event */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '0.9rem' }}>Prochain événement</h3>
            <button onClick={() => onViewChange?.('events')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 700, fontSize: '0.78rem' }}>
              Voir <ArrowRight size={12} />
            </button>
          </div>
          {event ? (
            <div>
              <p style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 6 }}>{event.name}</p>
              {event.date && (
                <p style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 4 }}>
                  <CalendarDays size={13} />
                  {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {daysLeft !== null && daysLeft >= 0 && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: daysLeft < 30 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: daysLeft < 30 ? '#ef4444' : '#22c55e' }}>
                  J-{daysLeft}
                </span>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucun événement configuré</p>
          )}
        </div>

        {/* Pending tasks */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '0.9rem' }}>Tâches à traiter</h3>
            <button onClick={() => onViewChange?.('asso-tasks')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 700, fontSize: '0.78rem' }}>
              Toutes <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucune tâche en attente</p>
            ) : pendingTasks.slice(0, 4).map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#94a3b8' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                  {task.assignee && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{task.assignee}</p>}
                </div>
                {task.dueDate && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
                    {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
