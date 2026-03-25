import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { 
  Kanban as KanbanIcon, 
  Table as ListIcon, 
  Calendar as CalendarIcon, 
  BarChart as GanttIcon,
  Plus, Search, Clock, AlertTriangle, MapPin, CornerDownRight, MessageSquare, GripVertical
} from 'lucide-react';
import Modal from '../../components/shared/Modal';
import Badge from '../../components/shared/Badge';
import GanttChart from '../../components/shared/GanttChart';
import TaskCalendar from '../../components/shared/TaskCalendar';

export default function CommunicationView() {
  const { data, addItem, updateItem } = useEvent();
  const { tasks } = data.poles.communication;
  const [activeTab, setActiveTab] = useState('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const [formData, setFormData] = useState({ 
    title: '', description: '', status: 'todo', assignee: 'Corentin', 
    priority: 'medium', dueDate: '', support: 'Réseaux Sociaux', location: '' 
  });

  const handleAdd = (e) => {
    e.preventDefault();
    addItem('communication', 'tasks', { ...formData, id: Date.now().toString(), dependencies: [], attachments: [] });
    setIsModalOpen(false);
    setFormData({ title: '', description: '', status: 'todo', assignee: 'Corentin', priority: 'medium', dueDate: '', support: 'Réseaux Sociaux', location: '' });
  };

  const moveTask = (taskId, newStatus) => {
    updateItem('communication', 'tasks', taskId, { status: newStatus });
  };

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      moveTask(taskId, status);
    }
    setDraggedTaskId(null);
  };

  const tabs = [
    { id: 'kanban', label: 'Kanban', icon: KanbanIcon },
    { id: 'list', label: 'Liste', icon: ListIcon },
    { id: 'gantt', label: 'Rétroplanning', icon: GanttIcon },
    { id: 'calendar', label: 'Calendrier', icon: CalendarIcon },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
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
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ background: 'var(--primary)', color: 'white', marginBottom: '8px' }}>
          <Plus size={20} /> Nouvelle Action
        </button>
      </div>

      {activeTab === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {['todo', 'in_progress', 'done'].map(status => (
            <div 
              key={status} 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, status)}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '600px', background: '#f8f9fa', padding: '1.25rem', borderRadius: '24px', border: '1px solid var(--border)' }}
            >
               <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
                  {status === 'todo' ? 'À faire' : status === 'in_progress' ? 'En cours' : 'Terminé'}
                  <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-muted)' }}>{tasks.filter(t => t.status === status).length}</span>
               </h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {tasks.filter(t => t.status === status).map(task => (
                   <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="card" 
                    style={{ 
                      padding: '1.5rem', opacity: draggedTaskId === task.id ? 0.5 : 1,
                      cursor: 'grab', display: 'flex', flexDirection: 'column', gap: '0.75rem'
                    }}
                   >
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                           <Badge status="medium" label={task.support} />
                           <Badge status={task.priority === 'high' ? 'high' : 'low'} label={task.priority.toUpperCase()} />
                        </div>
                        <GripVertical size={16} color="#cbd5e1" />
                     </div>
                     <h4 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{task.title}</h4>
                     <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
                        <CornerDownRight size={14} style={{ marginTop: '3px', flexShrink: 0 }} />
                        <p style={{ fontSize: '0.8125rem', lineHeight: '1.4' }}>{task.description}</p>
                     </div>
                     <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                           <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.65rem', fontWeight: 800 }}>{task.assignee.slice(0,1)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--text-muted)' }}>
                           {task.dueDate && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 700 }}><Clock size={12} /> {task.dueDate}</div>}
                           {task.location && <MapPin size={12} />}
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
           <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action de Communication</th>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Support / Canal</th>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Due Date</th>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{t.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.assignee}</p>
                    </td>
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <Badge status="medium" label={t.support} />
                    </td>
                    <td style={{ padding: '1.25rem 2rem', fontSize: '0.875rem', color: t.dueDate && new Date(t.dueDate) < new Date() ? 'var(--danger)' : 'var(--text-main)', fontWeight: 600 }}>
                      {t.dueDate || '-'}
                    </td>
                    <td style={{ padding: '1.25rem 2rem' }}>
                       <Badge status={t.status === 'done' ? 'success' : 'warning'} label={t.status.replace('_', ' ')} />
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      )}

      {activeTab === 'gantt' && <GanttChart tasks={tasks} />}
      {activeTab === 'calendar' && <TaskCalendar tasks={tasks} />}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle Action de Communication">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.50rem' }}>TITRE DE L'ACTION</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.50rem' }}>DESCRIPTION DÉTAILLÉE</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', minHeight: '100px', outline: 'none' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.50rem' }}>SUPPORT DE COM</label>
              <select value={formData.support} onChange={e => setFormData({...formData, support: e.target.value})} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}>
                <option>Réseaux Sociaux</option>
                <option>Print</option>
                <option>Presse</option>
                <option>Site Web</option>
                <option>Newsletter</option>
                <option>Radio</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.50rem' }}>ÉCHÉANCE</label>
              <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }} />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '1rem', marginTop: '1rem', background: 'var(--text-main)', color: 'white', borderRadius: '14px' }}>Créer l'action de communication</button>
        </form>
      </Modal>
    </div>
  );
}
