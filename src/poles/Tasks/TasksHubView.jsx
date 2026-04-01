import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { Plus, Filter, Calendar, User, GripVertical } from 'lucide-react';
import Modal from '../../components/shared/Modal';

const GLOBAL_STATUSES = [
  { id: 'todo',        label: 'À faire',    color: '#6366f1' },
  { id: 'in_progress', label: 'En cours',   color: '#3b82f6' },
  { id: 'waiting',     label: 'En attente', color: '#f97316' },
  { id: 'done',        label: 'Terminé',    color: '#10b981' },
];

const POLE_COLORS = {
  Communication: '#6366f1',
  Logistique:    '#0ea5e9',
};

const SUBSTATE_LABELS = {
  to_ask:      'À demander',
  to_buy:      'À acheter',
  to_create:   'À créer',
  asking:      'Demande en cours',
  in_progress: 'En cours',
  waiting:     'En attente',
  acquired:    'Acquis',
  ordered:     'Commandé',
  done:        'Fait',
  to_return:   'À rendre',
  returned:    'Rendu',
  cancelled:   'Annulé',
};

const GLOBAL_TO_LOGISTICS_DEFAULT = {
  todo: 'to_ask', in_progress: 'in_progress', waiting: 'waiting', done: 'acquired',
};

const PRIORITIES = ['low', 'medium', 'high'];
const PRIORITY_LABELS = { low: 'Faible', medium: 'Moyen', high: 'Élevé' };
const PRIORITY_COLORS = { low: '#94a3b8', medium: '#f59e0b', high: '#ef4444' };

const LOG_STATUSES = [
  { id: 'to_ask', label: 'À demander' },
  { id: 'to_buy', label: 'À acheter' },
  { id: 'to_create', label: 'À créer' },
  { id: 'asking', label: 'Demande en cours' },
  { id: 'in_progress', label: 'En cours' },
  { id: 'waiting', label: 'En attente' },
  { id: 'acquired', label: 'Acquis' },
  { id: 'ordered', label: 'Commandé' },
  { id: 'done', label: 'Fait' },
  { id: 'to_return', label: 'À rendre' },
  { id: 'returned', label: 'Rendu' },
  { id: 'cancelled', label: 'Annulé' },
];

export default function TasksHubView() {
  const { getGlobalTasks, updateItem, updatePoleData, data } = useEvent();
  const allTasks = getGlobalTasks();
  const [filterPole, setFilterPole] = useState('all');
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [editTask, setEditTask] = useState(null); // task being edited
  const [editForm, setEditForm] = useState({});

  const currentUserName = data.user.name; // 'Corentin Pavoine'

  let filtered = filterPole === 'all' ? allTasks : allTasks.filter(t => t.pole === filterPole);
  if (myTasksOnly) {
    filtered = filtered.filter(t =>
      t.assignee && currentUserName.toLowerCase().includes(t.assignee.toLowerCase().split(' ')[0])
    );
  }

  const moveTask = (task, newStatus) => {
    if (task.type === 'task') {
      updateItem('communication', 'tasks', task.id, { status: newStatus });
    } else if (task.type === 'material') {
      updatePoleData('logistics', 'materials', items =>
        items.map(m => m.id === task.id ? { ...m, status: GLOBAL_TO_LOGISTICS_DEFAULT[newStatus] || 'to_ask' } : m)
      );
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('taskData', JSON.stringify(task));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, statusId) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('taskData');
    if (raw) moveTask(JSON.parse(raw), statusId);
    setDraggedTaskId(null);
  };

  const openEdit = (task) => {
    setEditTask(task);
    if (task.type === 'task') {
      setEditForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        assignee: task.assignee || '',
        dueDate: task.dueDate || '',
        priority: task.priority || 'medium',
      });
    } else {
      // material: read the raw material from data
      const raw = data.poles.logistics.materials.find(m => m.id === task.id) || {};
      setEditForm({
        title: raw.title || raw.label || task.title || '',
        quantity: raw.quantity ?? raw.qty ?? 1,
        status: raw.status || task.subStatus || 'to_ask',
        responsible: raw.responsible || task.assignee || '',
        installDate: raw.installDate || task.dueDate || '',
        notes: raw.notes || '',
      });
    }
  };

  const saveEdit = () => {
    if (!editTask) return;
    if (editTask.type === 'task') {
      updateItem('communication', 'tasks', editTask.id, {
        title: editForm.title,
        description: editForm.description,
        status: editForm.status,
        assignee: editForm.assignee,
        dueDate: editForm.dueDate,
        priority: editForm.priority,
      });
    } else {
      updateItem('logistics', 'materials', editTask.id, {
        title: editForm.title,
        quantity: Number(editForm.quantity) || 1,
        status: editForm.status,
        responsible: editForm.responsible,
        installDate: editForm.installDate,
        notes: editForm.notes,
      });
    }
    setEditTask(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Tâches</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Vue centralisée de toutes les actions</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>

          {/* My tasks toggle */}
          <button
            onClick={() => setMyTasksOnly(v => !v)}
            style={{
              padding: '0.4rem 0.875rem', borderRadius: '8px',
              border: '1.5px solid ' + (myTasksOnly ? 'var(--primary)' : 'var(--border)'),
              background: myTasksOnly ? 'var(--primary)' : 'white',
              color: myTasksOnly ? 'white' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px',
              transition: 'all 0.15s'
            }}
          >
            <User size={13} /> Mes tâches
          </button>

          {/* Pole filter */}
          <div style={{ background: '#f1f3f5', padding: '0.4rem 0.875rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '7px', border: '1px solid var(--border)' }}>
            <Filter size={13} color="var(--text-muted)" />
            <select
              value={filterPole}
              onChange={e => setFilterPole(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">Tous les pôles</option>
              <option value="Communication">Communication</option>
              <option value="Logistique">Logistique</option>
            </select>
          </div>

          <button className="btn-primary" style={{ background: 'var(--primary)', border: 'none', color: 'white', fontSize: '0.78rem', padding: '0.4rem 0.875rem' }}>
            <Plus size={14} /> Nouvelle tâche
          </button>
        </div>
      </div>

      {/* Kanban — 4 global states */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem' }}>
        {GLOBAL_STATUSES.map(col => {
          const colTasks = filtered.filter(t => t.status === col.id);
          return (
            <div
              key={col.id}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, col.id)}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8f9fa', padding: '0.875rem', borderRadius: '16px', border: '1px solid var(--border)', minHeight: '420px' }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.125rem', marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{col.label}</span>
                </div>
                <span style={{ fontSize: '0.7rem', background: 'white', color: '#64748b', borderRadius: 99, padding: '1px 7px', border: '1px solid #e9ecef', fontWeight: 600 }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {colTasks.map(task => {
                  const poleColor = POLE_COLORS[task.pole] || '#94a3b8';
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={e => handleDragStart(e, task)}
                      onDragEnd={() => setDraggedTaskId(null)}
                      onClick={() => openEdit(task)}
                      className="card"
                      style={{
                        padding: '0.75rem',
                        opacity: draggedTaskId === task.id ? 0.4 : 1,
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', gap: '0.4rem',
                        transition: 'box-shadow 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.09)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}
                    >
                      {/* Top row: badges + grip */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
                          <span style={{
                            fontSize: '0.6rem', fontWeight: 700,
                            background: poleColor + '18', color: poleColor,
                            padding: '2px 6px', borderRadius: 99
                          }}>{task.pole}</span>
                          {task.subStatus && SUBSTATE_LABELS[task.subStatus] && (
                            <span style={{
                              fontSize: '0.6rem', fontWeight: 700,
                              background: '#f1f3f5', color: '#64748b',
                              padding: '2px 6px', borderRadius: 99
                            }}>{SUBSTATE_LABELS[task.subStatus]}</span>
                          )}
                        </div>
                        <GripVertical size={12} color="#cbd5e1" style={{ flexShrink: 0, marginTop: 1 }} />
                      </div>

                      {/* Title */}
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{task.title}</p>

                      {/* Description */}
                      {task.description && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>{task.description}</p>
                      )}

                      {/* Footer */}
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.4rem', marginTop: '0.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {task.assignee ? (
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: poleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.52rem', fontWeight: 800, flexShrink: 0 }}>
                            {task.assignee.slice(0, 1).toUpperCase()}
                          </div>
                        ) : <div />}
                        {task.dueDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            <Calendar size={10} /> {task.dueDate}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add button */}
              <button style={{
                padding: '0.4rem', background: 'transparent', border: 'none',
                color: 'var(--text-muted)', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '5px',
                cursor: 'pointer', fontSize: '0.75rem'
              }}>
                <Plus size={13} /> Ajouter
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Task edit modal ── */}
      <Modal
        isOpen={!!editTask}
        onClose={() => setEditTask(null)}
        title={editTask?.type === 'task' ? 'Modifier la tâche' : 'Modifier le matériel'}
      >
        {editTask?.type === 'task' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TITRE</label>
              <input
                type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem', fontWeight: 600 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DESCRIPTION</label>
              <textarea
                value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', resize: 'vertical', fontSize: '0.875rem' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>STATUT</label>
                <select
                  value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
                >
                  {GLOBAL_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>PRIORITÉ</label>
                <select
                  value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
                >
                  {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ASSIGNÉ À</label>
                <input
                  type="text" value={editForm.assignee} onChange={e => setEditForm({ ...editForm, assignee: e.target.value })}
                  placeholder="Prénom"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ÉCHÉANCE</label>
                <input
                  type="date" value={editForm.dueDate} onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={() => setEditTask(null)} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'white', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={saveEdit} style={{ flex: 2, padding: '0.875rem', borderRadius: '12px', border: 'none', background: 'var(--text-main)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                Enregistrer
              </button>
            </div>
          </div>
        ) : editTask?.type === 'material' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>LIBELLÉ</label>
              <input
                type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem', fontWeight: 600 }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>STATUT</label>
                <select
                  value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
                >
                  {LOG_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>QUANTITÉ</label>
                <input
                  type="number" min="1" value={editForm.quantity} onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>RESPONSABLE</label>
                <input
                  type="text" value={editForm.responsible} onChange={e => setEditForm({ ...editForm, responsible: e.target.value })}
                  placeholder="Prénom"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DATE D'INSTALLATION</label>
                <input
                  type="date" value={editForm.installDate} onChange={e => setEditForm({ ...editForm, installDate: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NOTES</label>
              <textarea
                value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                rows={2}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', resize: 'vertical', fontSize: '0.875rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={() => setEditTask(null)} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'white', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={saveEdit} style={{ flex: 2, padding: '0.875rem', borderRadius: '12px', border: 'none', background: 'var(--text-main)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                Enregistrer
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
