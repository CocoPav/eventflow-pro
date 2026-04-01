import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import KanbanBoard from '../../components/shared/KanbanBoard';
import {
  Kanban as KanbanIcon,
  Table as ListIcon,
  Calendar as CalendarIcon,
  BarChart as GanttIcon,
  Megaphone,
  Plus, Clock, MapPin, CornerDownRight, GripVertical,
  Edit2, Trash2, CheckCircle2, Circle
} from 'lucide-react';
import Modal from '../../components/shared/Modal';
import Badge from '../../components/shared/Badge';
import GanttChart from '../../components/shared/GanttChart';
import TaskCalendar from '../../components/shared/TaskCalendar';

const CHANNELS = ['Réseaux Sociaux', 'Print', 'Presse', 'Site Web', 'Newsletter', 'Radio', 'Affichage'];
const CAMPAIGN_STATUSES = {
  planned:   { label: 'Planifié',    color: '#6366f1' },
  active:    { label: 'En cours',    color: '#f59e0b' },
  done:      { label: 'Terminé',     color: '#10b981' },
  cancelled: { label: 'Annulé',      color: '#ef4444' },
};

const EMPTY_CAMPAIGN = { name: '', channel: 'Réseaux Sociaux', startDate: '', endDate: '', status: 'planned', notes: '' };
const EMPTY_TASK = { title: '', description: '', status: 'todo', assignee: 'Corentin', priority: 'medium', dueDate: '', support: 'Réseaux Sociaux', location: '', campaignId: '' };

// ─── Campaign card ──────────────────────────────────────────────────────────
function CampaignCard({ campaign, tasks, onEdit, onDelete }) {
  const linked = tasks.filter(t => t.campaignId === campaign.id);
  const done   = linked.filter(t => t.status === 'done').length;
  const pct    = linked.length ? Math.round((done / linked.length) * 100) : 0;
  const st     = CAMPAIGN_STATUSES[campaign.status] || CAMPAIGN_STATUSES.planned;
  const isOverdue = campaign.endDate && new Date(campaign.endDate) < new Date() && campaign.status !== 'done';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{campaign.channel}</span>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.01em' }}>{campaign.name}</h3>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: st.color, background: st.color + '18', borderRadius: 99, padding: '3px 10px' }}>{st.label}</span>
          <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}><Edit2 size={14} /></button>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px' }}><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{done}/{linked.length} action{linked.length !== 1 ? 's' : ''}</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: pct === 100 ? '#10b981' : 'var(--text-muted)' }}>{pct}%</span>
        </div>
        <div style={{ height: '6px', borderRadius: 99, background: '#f1f3f5', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: pct === 100 ? '#10b981' : st.color, transition: 'width 0.4s' }} />
        </div>
      </div>

      {/* Date range */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {campaign.startDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <Clock size={11} /> {campaign.startDate} → {campaign.endDate || '?'}
          </div>
        )}
        {isOverdue && (
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ef4444', background: '#fef2f2', borderRadius: 99, padding: '2px 8px' }}>En retard</span>
        )}
      </div>

      {campaign.notes && (
        <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', lineHeight: 1.5 }}>{campaign.notes}</p>
      )}

      {/* Linked tasks mini-list */}
      {linked.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          {linked.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.73rem', color: t.status === 'done' ? 'var(--text-muted)' : 'var(--text-main)' }}>
              {t.status === 'done' ? <CheckCircle2 size={13} color="#10b981" /> : <Circle size={13} color="#94a3b8" />}
              <span style={{ textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
              {t.dueDate && <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.65rem' }}>{t.dueDate}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function CommunicationView() {
  const { data, addItem, updateItem, deleteItem, addCampaign, updateCampaign, deleteCampaign, addColumn, updateColumn, deleteColumn, reorderColumns } = useEvent();
  const { tasks, campaigns, columns = [] } = data.poles.communication;
  const [activeTab, setActiveTab] = useState('kanban');
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // Task modal
  const [taskModal, setTaskModal] = useState({ open: false, editing: null });
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);

  // Campaign modal
  const [campModal, setCampModal] = useState({ open: false, editing: null });
  const [campForm, setCampForm] = useState(EMPTY_CAMPAIGN);

  // ── Task handlers ──
  const openTaskModal = (task = null) => {
    setTaskForm(task ? { ...task } : { ...EMPTY_TASK });
    setTaskModal({ open: true, editing: task });
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (taskModal.editing) {
      updateItem('communication', 'tasks', taskModal.editing.id, taskForm);
    } else {
      addItem('communication', 'tasks', { ...taskForm, id: Date.now().toString(), dependencies: [], attachments: [] });
    }
    setTaskModal({ open: false, editing: null });
  };

  const moveTask = (taskId, newStatus) => updateItem('communication', 'tasks', taskId, { status: newStatus });

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) moveTask(taskId, status);
    setDraggedTaskId(null);
  };

  // ── Campaign handlers ──
  const openCampModal = (camp = null) => {
    setCampForm(camp ? { ...camp } : { ...EMPTY_CAMPAIGN });
    setCampModal({ open: true, editing: camp });
  };

  const handleCampSubmit = (e) => {
    e.preventDefault();
    if (campModal.editing) {
      updateCampaign(campModal.editing.id, campForm);
    } else {
      addCampaign({ ...campForm, id: 'camp_' + Date.now() });
    }
    setCampModal({ open: false, editing: null });
  };

  const handleCampDelete = (id) => {
    if (window.confirm('Supprimer cette campagne ? Les actions liées seront détachées.')) {
      deleteCampaign(id);
    }
  };

  // ── Tabs ──
  const tabs = [
    { id: 'kanban',    label: 'Kanban',         icon: KanbanIcon },
    { id: 'list',      label: 'Liste',           icon: ListIcon },
    { id: 'gantt',     label: 'Rétroplanning',   icon: GanttIcon },
    { id: 'calendar',  label: 'Calendrier',      icon: CalendarIcon },
    { id: 'campaigns', label: 'Campagnes',       icon: Megaphone },
  ];

  const isCampaignsTab = activeTab === 'campaigns';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', gap: '2.5rem', borderBottom: '1px solid var(--border)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '1.25rem 0',
                background: 'transparent', border: 'none',
                color: activeTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: 800, cursor: 'pointer', position: 'relative',
                fontSize: '0.9375rem', letterSpacing: '-0.01em'
              }}
            >
              <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              {tab.label}
              {activeTab === tab.id && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, background: 'var(--primary)', borderRadius: '3px 3px 0 0' }} />}
            </button>
          ))}
        </div>
        <button
          onClick={() => isCampaignsTab ? openCampModal() : openTaskModal()}
          className="btn-primary"
          style={{ background: 'var(--primary)', color: 'white', marginBottom: '8px' }}
        >
          <Plus size={20} /> {isCampaignsTab ? 'Nouvelle Campagne' : 'Nouvelle Action'}
        </button>
      </div>

      {/* ── Kanban ── */}
      {activeTab === 'kanban' && (
        <KanbanBoard
          columns={columns}
          items={tasks}
          renderCard={(task) => (
            <div
              className="card"
              onClick={() => openTaskModal(task)}
              style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', cursor: 'grab' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
                  <Badge status="medium" label={task.support} />
                  <Badge status={task.priority === 'high' ? 'high' : 'low'} label={task.priority.toUpperCase()} />
                  {task.campaignId && campaigns.find(c => c.id === task.campaignId) && (
                    <Badge status="info" label={campaigns.find(c => c.id === task.campaignId).name} />
                  )}
                </div>
                <GripVertical size={12} color="#cbd5e1" style={{ flexShrink: 0 }} />
              </div>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{task.title}</h4>
              {task.description && (
                <div style={{ display: 'flex', gap: '5px', color: 'var(--text-muted)' }}>
                  <CornerDownRight size={11} style={{ marginTop: 2, flexShrink: 0 }} />
                  <p style={{ fontSize: '0.7rem', lineHeight: 1.35, color: 'var(--text-muted)' }}>{task.description}</p>
                </div>
              )}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.55rem', fontWeight: 800 }}>
                  {task.assignee.slice(0, 1)}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-muted)' }}>
                  {task.dueDate && <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.62rem', fontWeight: 700 }}><Clock size={10} /> {task.dueDate}</div>}
                  {task.location && <MapPin size={10} />}
                </div>
              </div>
            </div>
          )}
          onMoveItem={(taskId, colId) => moveTask(taskId, colId)}
          onReorderColumns={newCols => reorderColumns('communication', newCols)}
          onAddColumn={form  => addColumn('communication', form)}
          onEditColumn={(id, form) => updateColumn('communication', id, form)}
          onDeleteColumn={id => deleteColumn('communication', id)}
          onAddItem={() => openTaskModal()}
        />
      )}

      {/* ── List ── */}
      {activeTab === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action</th>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Campagne</th>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Support</th>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Échéance</th>
                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Statut</th>
                <th style={{ padding: '1.25rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }} />
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => {
                const camp = campaigns.find(c => c.id === t.campaignId);
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{t.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.assignee}</p>
                    </td>
                    <td style={{ padding: '1.25rem 2rem' }}>
                      {camp ? <Badge status="info" label={camp.name} /> : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <Badge status="medium" label={t.support} />
                    </td>
                    <td style={{ padding: '1.25rem 2rem', fontSize: '0.875rem', color: t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done' ? 'var(--danger)' : 'var(--text-main)', fontWeight: 600 }}>
                      {t.dueDate || '—'}
                    </td>
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <Badge status={t.status === 'done' ? 'success' : t.status === 'in_progress' ? 'warning' : 'medium'} label={t.status === 'done' ? 'Terminé' : t.status === 'in_progress' ? 'En cours' : 'À faire'} />
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <button onClick={() => openTaskModal(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Edit2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'gantt' && <GanttChart tasks={tasks} />}
      {activeTab === 'calendar' && <TaskCalendar tasks={tasks} />}

      {/* ── Campaigns ── */}
      {activeTab === 'campaigns' && (
        <div>
          {/* Stats bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Campagnes', value: campaigns.length, color: 'var(--primary)' },
              { label: 'En cours',  value: campaigns.filter(c => c.status === 'active').length, color: '#f59e0b' },
              { label: 'Planifiées', value: campaigns.filter(c => c.status === 'planned').length, color: '#6366f1' },
              { label: 'Terminées', value: campaigns.filter(c => c.status === 'done').length, color: '#10b981' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {campaigns.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <Megaphone size={36} style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 700 }}>Aucune campagne</p>
              <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Créez votre première campagne de communication.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {campaigns.map(c => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  tasks={tasks}
                  onEdit={() => openCampModal(c)}
                  onDelete={() => handleCampDelete(c.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Task modal ── */}
      <Modal isOpen={taskModal.open} onClose={() => setTaskModal({ open: false, editing: null })} title={taskModal.editing ? "Modifier l'action" : "Nouvelle Action de Communication"}>
        <form onSubmit={handleTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TITRE DE L'ACTION</label>
            <input required type="text" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DESCRIPTION</label>
            <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', minHeight: '80px', outline: 'none', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>SUPPORT</label>
              <select value={taskForm.support} onChange={e => setTaskForm({ ...taskForm, support: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}>
                {CHANNELS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>CAMPAGNE</label>
              <select value={taskForm.campaignId || ''} onChange={e => setTaskForm({ ...taskForm, campaignId: e.target.value || null })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}>
                <option value="">— Aucune —</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>PRIORITÉ</label>
              <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}>
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ÉCHÉANCE</label>
              <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>STATUT</label>
              <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}>
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="done">Terminé</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>RESPONSABLE</label>
              <input type="text" value={taskForm.assignee} onChange={e => setTaskForm({ ...taskForm, assignee: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }} />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '1rem', marginTop: '0.5rem', background: 'var(--text-main)', color: 'white', borderRadius: '14px' }}>
            {taskModal.editing ? "Enregistrer" : "Créer l'action"}
          </button>
        </form>
      </Modal>

      {/* ── Campaign modal ── */}
      <Modal isOpen={campModal.open} onClose={() => setCampModal({ open: false, editing: null })} title={campModal.editing ? "Modifier la campagne" : "Nouvelle Campagne"}>
        <form onSubmit={handleCampSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NOM DE LA CAMPAGNE</label>
            <input required type="text" value={campForm.name} onChange={e => setCampForm({ ...campForm, name: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>CANAL</label>
              <select value={campForm.channel} onChange={e => setCampForm({ ...campForm, channel: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}>
                {CHANNELS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>STATUT</label>
              <select value={campForm.status} onChange={e => setCampForm({ ...campForm, status: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}>
                {Object.entries(CAMPAIGN_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DATE DE DÉBUT</label>
              <input type="date" value={campForm.startDate} onChange={e => setCampForm({ ...campForm, startDate: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DATE DE FIN</label>
              <input type="date" value={campForm.endDate} onChange={e => setCampForm({ ...campForm, endDate: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NOTES</label>
            <textarea value={campForm.notes} onChange={e => setCampForm({ ...campForm, notes: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', minHeight: '80px', outline: 'none', resize: 'vertical' }} />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '1rem', marginTop: '0.5rem', background: 'var(--text-main)', color: 'white', borderRadius: '14px' }}>
            {campModal.editing ? "Enregistrer" : "Créer la campagne"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
