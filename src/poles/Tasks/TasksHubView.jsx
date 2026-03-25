import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { CornerDownRight, MessageSquare, Calendar, Plus, Filter, GripVertical, Flag, Clock } from 'lucide-react';
import Badge from '../../components/shared/Badge';

export default function TasksHubView() {
  const { getGlobalTasks, updateItem, updatePoleData } = useEvent();
  const tasks = getGlobalTasks();
  const [filterPole, setFilterPole] = useState('all');
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const filteredTasks = filterPole === 'all' ? tasks : tasks.filter(t => t.pole === filterPole);

  const moveTask = (task, newStatus) => {
    if (task.type === 'task' && task.pole === 'Communication') {
      updateItem('communication', 'tasks', task.id, { status: newStatus });
    } else if (task.type === 'material') {
      updatePoleData('logistics', 'materials', (items) => 
        items.map(m => m.id === task.id ? { ...m, status: newStatus === 'done' ? 'ordered' : 'todo' } : m)
      );
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('taskData', JSON.stringify(task));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('taskData');
    if (data) {
      const task = JSON.parse(data);
      moveTask(task, status);
    }
    setDraggedTaskId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Tâches Globales</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Pilotage centralisé des actions événementielles</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: '#f1f3f5', padding: '0.5rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--border)' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select 
              value={filterPole} 
              onChange={(e) => setFilterPole(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">Tous les pôles</option>
              <option value="Communication">Communication</option>
              <option value="Logistique">Logistique</option>
            </select>
          </div>
          <button className="btn-primary" style={{ background: 'var(--primary)', border: 'none', color: 'white' }}>
            <Plus size={18} /> Add Task
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
        {['todo', 'in_progress', 'done'].map(status => (
          <div 
            key={status} 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, status)}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 0.5rem' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                {status === 'todo' ? '🔆' : status === 'in_progress' ? '⚡️' : '✅'}
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {status === 'todo' ? 'To-do' : status === 'in_progress' ? 'In Progress' : 'Done'}
                <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>{filteredTasks.filter(t => t.status === status).length}</span>
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: '600px', background: '#f8f9fa', padding: '1rem', borderRadius: '24px', border: '1px dashed var(--border)' }}>
              {filteredTasks.filter(t => t.status === status).map(task => (
                <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={() => setDraggedTaskId(null)}
                    className="card" 
                    style={{ 
                        padding: '1.5rem', 
                        opacity: draggedTaskId === task.id ? 0.5 : 1,
                        cursor: 'grab',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Badge status={task.priority} label={task.priority.toUpperCase()} />
                      <Badge status="low" label={task.pole} />
                    </div>
                    <GripVertical size={16} color="#cbd5e1" />
                  </div>
                  
                  <div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: '0.25rem' }}>{task.title}</h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: 'var(--text-muted)' }}>
                        <CornerDownRight size={14} style={{ marginTop: '4px', flexShrink: 0 }} />
                        <p style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>{task.description}</p>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 800 }}>{task.assignee ? task.assignee.slice(0,1) : 'S'}</div>
                        {task.assignee === 'Corentin' && <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ff7a50', border: '2px solid white', marginLeft: '-10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 800 }}>O</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.758rem', fontWeight: 600 }}><MessageSquare size={14} /> 2</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}><Calendar size={14} /> {task.dueDate || 'Tomorrow'}</div>
                    </div>
                  </div>
                </div>
              ))}
              <button 
                style={{ 
                    padding: '1rem', 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--text-main)', 
                    fontWeight: 800, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    cursor: 'pointer',
                    fontSize: '1.125rem'
                }}
              >
                <Plus size={24} /> Add Task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
