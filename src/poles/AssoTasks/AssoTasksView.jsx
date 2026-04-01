import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronDown } from 'lucide-react';

const STATUS_LABELS = { todo: 'À faire', in_progress: 'En cours', waiting: 'En attente', done: 'Terminé' };
const STATUS_COLORS = { todo: '#6366f1', in_progress: '#3b82f6', waiting: '#f97316', done: '#10b981' };
const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#94a3b8' };

export default function AssoTasksView() {
  const { data } = useEvent();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPole, setFilterPole] = useState('all');

  const eventName = data.event?.name || 'Événement';

  // Aggregate all tasks from all poles with their source
  const allTasks = [
    ...(data.poles.communication?.tasks || []).map(t => ({ ...t, pole: 'Communication', event: eventName })),
  ];

  // Logistics materials as tasks (those needing action)
  const materialsAsTasks = (data.poles.logistics?.materials || [])
    .filter(m => ['to_ask', 'asking', 'to_buy', 'to_create'].includes(m.status))
    .map(m => ({
      id: `mat-${m.id}`,
      title: m.title || m.label,
      description: m.notes || '',
      status: m.status === 'asking' ? 'in_progress' : 'todo',
      priority: 'medium',
      assignee: m.responsible,
      dueDate: m.installDate,
      pole: 'Logistique',
      event: eventName,
    }));

  const combined = [...allTasks, ...materialsAsTasks];
  const poles = [...new Set(combined.map(t => t.pole))];

  const filtered = combined.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPole !== 'all' && t.pole !== filterPole) return false;
    return true;
  });

  const counts = {
    all: combined.length,
    todo: combined.filter(t => t.status === 'todo').length,
    in_progress: combined.filter(t => t.status === 'in_progress').length,
    waiting: combined.filter(t => t.status === 'waiting').length,
    done: combined.filter(t => t.status === 'done').length,
  };

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: 900 }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Tâches</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>Toutes les tâches de l'association</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[['all', 'Toutes'], ['todo', 'À faire'], ['in_progress', 'En cours'], ['waiting', 'En attente'], ['done', 'Terminées']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterStatus(val)}
            style={{
              padding: '0.375rem 0.875rem', borderRadius: 99, border: '1px solid',
              borderColor: filterStatus === val ? STATUS_COLORS[val] || 'var(--primary)' : 'var(--border)',
              background: filterStatus === val ? (STATUS_COLORS[val] || 'var(--primary)') + '15' : 'white',
              color: filterStatus === val ? STATUS_COLORS[val] || 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
            }}
          >
            {label} {counts[val] !== undefined ? `(${counts[val]})` : ''}
          </button>
        ))}

        <select
          value={filterPole}
          onChange={e => setFilterPole(e.target.value)}
          style={{ marginLeft: 'auto', padding: '0.375rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
        >
          <option value="all">Tous les pôles</option>
          {poles.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Aucune tâche pour ce filtre.
          </div>
        ) : filtered.map(task => {
          const isDone = task.status === 'done';
          return (
            <div key={task.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem', opacity: isDone ? 0.65 : 1 }}>
              {isDone
                ? <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                : <Circle size={18} color="var(--border-strong)" style={{ flexShrink: 0, marginTop: 2 }} />
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4, flexWrap: 'wrap' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', textDecoration: isDone ? 'line-through' : 'none' }}>{task.title}</p>
                  {/* Event badge */}
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: 'rgba(99,102,241,0.1)', color: '#6366f1', flexShrink: 0 }}>
                    {task.event}
                  </span>
                  {/* Pole badge */}
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--bg-hover)', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {task.pole}
                  </span>
                </div>
                {task.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{task.description}</p>}
                <div style={{ display: 'flex', gap: '1rem', marginTop: 6, flexWrap: 'wrap' }}>
                  {task.assignee && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>👤 {task.assignee}</span>
                  )}
                  {task.dueDate && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={11} /> {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: STATUS_COLORS[task.status] + '15', color: STATUS_COLORS[task.status] }}>
                  {STATUS_LABELS[task.status] || task.status}
                </span>
                {task.priority && (
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: PRIORITY_COLORS[task.priority] }}>
                    {task.priority === 'high' ? '● Haute' : task.priority === 'medium' ? '● Moyenne' : '● Basse'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
