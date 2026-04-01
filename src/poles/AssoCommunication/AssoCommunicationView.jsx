import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { Newspaper, Share2, Mail, Phone, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

const INITIAL_PRESS = [
  { id: 'p1', name: 'Ouest-France', contact: 'redaction.rennes@ouest-france.fr', type: 'Presse régionale', status: 'contacted', notes: 'Proposition d\'article envoyée' },
  { id: 'p2', name: 'Le Mensuel de Rennes', contact: 'redaction@mensuel35.fr', type: 'Magazine local', status: 'pending', notes: '' },
];

const SOCIAL = [
  { id: 's1', platform: 'Instagram', handle: '@squatclub35', followers: 1240, status: 'active' },
  { id: 's2', platform: 'Facebook', handle: 'Squat Club Rennes', followers: 890, status: 'active' },
  { id: 's3', platform: 'LinkedIn', handle: 'Squat Club', followers: 180, status: 'active' },
];

const STATUS_STYLE = {
  active:    { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', label: 'Actif' },
  contacted: { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', label: 'Contacté' },
  pending:   { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', label: 'En attente' },
};

export default function AssoCommunicationView() {
  const [tab, setTab] = useState('press');
  const [press, setPress] = useState(INITIAL_PRESS);
  const [social] = useState(SOCIAL);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', contact: '', type: '', status: 'pending', notes: '' });

  const startEdit = (item) => { setEditId(item.id); setForm({ ...item }); };
  const saveEdit = () => {
    setPress(prev => prev.map(p => p.id === editId ? { ...p, ...form } : p));
    setEditId(null);
  };

  const addPress = () => {
    if (!newItem.name) return;
    setPress(prev => [...prev, { ...newItem, id: `p${Date.now()}` }]);
    setNewItem({ name: '', contact: '', type: '', status: 'pending', notes: '' });
    setAdding(false);
  };

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: 900 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.75rem' }}>Communication</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
        {[['press', 'Presse & Médias', Newspaper], ['social', 'Réseaux Sociaux', Share2]].map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '0.75rem 1.25rem', background: 'none', border: 'none',
              borderBottom: tab === id ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === id ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: tab === id ? 700 : 500, fontSize: '0.875rem',
              cursor: 'pointer', marginBottom: -1,
            }}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'press' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setAdding(true)} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
              <Plus size={14} /> Ajouter un contact
            </button>
          </div>

          {adding && (
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem', background: 'var(--bg-elevated)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                {[['name', 'Nom du média'], ['contact', 'Email / contact'], ['type', 'Type'], ['notes', 'Notes']].map(([k, ph]) => (
                  <input key={k} placeholder={ph} value={newItem[k]} onChange={e => setNewItem(p => ({ ...p, [k]: e.target.value }))}
                    style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.875rem' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setAdding(false)} className="btn-secondary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>Annuler</button>
                <button onClick={addPress} className="btn-primary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>Ajouter</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {press.map(item => {
              const isEditing = editId === item.id;
              const s = STATUS_STYLE[item.status] || STATUS_STYLE.pending;
              return (
                <div key={item.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                  {isEditing ? (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        {[['name', 'Nom'], ['contact', 'Contact'], ['type', 'Type'], ['notes', 'Notes']].map(([k, ph]) => (
                          <input key={k} placeholder={ph} value={form[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.875rem' }} />
                        ))}
                      </div>
                      <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                        style={{ padding: '0.375rem 0.75rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                        <option value="pending">En attente</option>
                        <option value="contacted">Contacté</option>
                        <option value="active">Actif</option>
                      </select>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditId(null)} className="btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.78rem' }}><X size={13} /></button>
                        <button onClick={saveEdit} className="btn-primary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.78rem' }}><Check size={13} /> Sauvegarder</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                          <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>{item.name}</p>
                          {item.type && <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>{item.type}</span>}
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: s.bg, color: s.color }}>{s.label}</span>
                        </div>
                        {item.contact && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={12} />{item.contact}</p>}
                        {item.notes && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{item.notes}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                        <button onClick={() => startEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: 'var(--text-muted)' }}><Edit2 size={14} /></button>
                        <button onClick={() => setPress(p => p.filter(x => x.id !== item.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: '#ef4444' }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'social' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {social.map(s => {
            const st = STATUS_STYLE[s.status] || STATUS_STYLE.pending;
            return (
              <div key={s.id} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Share2 size={20} color="var(--text-muted)" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>{s.platform}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.handle}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 900, fontSize: '1.1rem' }}>{s.followers.toLocaleString('fr-FR')}</p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>abonnés</p>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: st.bg, color: st.color }}>{st.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
