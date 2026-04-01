import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { Plus, Trash2, Edit2, Package, GripVertical } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import KanbanBoard from '../../components/shared/KanbanBoard';

const MATERIAL_STATUSES = {
  to_ask:     { label: 'À demander',         color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  to_buy:     { label: 'À acheter',          color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  to_create:  { label: 'À créer',            color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  asking:     { label: 'En cours de demande',color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  in_progress:{ label: 'En cours',           color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  waiting:    { label: 'En attente',         color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  acquired:   { label: 'Acquis',             color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  to_return:  { label: 'À rendre',           color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  returned:   { label: 'Rendu / Stocké',     color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  cancelled:  { label: 'Annulé',             color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  // legacy compat
  ordered:    { label: 'Commandé',           color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  todo:       { label: 'À faire',            color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  done:       { label: 'Fait',               color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};


const EVENT_POLES = ['Scène', 'Buvette', 'Restauration', 'Sécurité', 'Accueil', 'Communication', 'Logistique', 'Programme', 'Général'];

const inputStyle = {
  width: '100%', padding: '0.6rem 0.875rem', borderRadius: 8,
  background: '#f8f9fa', border: '1px solid #e9ecef',
  color: '#1a1a1b', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box'
};
const labelStyle = {
  display: 'block', fontSize: '0.65rem', fontWeight: 700,
  color: '#64748b', marginBottom: '0.3rem', letterSpacing: '0.04em'
};

function StatusPill({ status }) {
  const s = MATERIAL_STATUSES[status] || MATERIAL_STATUSES.to_ask;
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 9px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

const EMPTY_FORM = {
  title: '', quantity: 1, owner: '', responsible: '',
  status: 'to_ask', pole: 'Général', storageLocation: '',
  installDate: '', returnDate: '', notes: ''
};

export default function LogisticsView() {
  const { data, addItem, updateItem, deleteItem, addColumn, updateColumn, deleteColumn, reorderColumns } = useEvent();
  const materials = data.poles.logistics.materials || [];
  const columns   = data.poles.logistics.columns   || [];

  const [activeView, setActiveView] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedPoles, setExpandedPoles] = useState({});

  const openAdd = () => { setEditingItem(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title || item.label || '',
      quantity: item.quantity || item.qty || 1,
      owner: item.owner || '',
      responsible: item.responsible || '',
      status: item.status || 'to_ask',
      pole: item.pole || 'Général',
      storageLocation: item.storageLocation || '',
      installDate: item.installDate || '',
      returnDate: item.returnDate || '',
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateItem('logistics', 'materials', editingItem.id, {
        ...form,
        label: form.title, qty: form.quantity
      });
    } else {
      addItem('logistics', 'materials', {
        ...form,
        label: form.title, qty: form.quantity,
        unitPrice: 0
      });
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
  };

  const togglePole = (pole) => setExpandedPoles(p => ({ ...p, [pole]: !p[pole] }));

  // Group materials by pole
  const byPole = {};
  materials.forEach(m => {
    const pole = m.pole || 'Général';
    if (!byPole[pole]) byPole[pole] = [];
    byPole[pole].push(m);
  });
  const poles = Object.keys(byPole).sort();

  // Stats
  const totalItems = materials.length;
  const pendingItems = materials.filter(m => ['to_ask','to_buy','to_create','asking'].includes(m.status)).length;
  const acquiredItems = materials.filter(m => ['acquired','ordered','done'].includes(m.status)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total matériels', value: totalItems, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'À acquérir', value: pendingItems, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Acquis', value: acquiredItems, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', padding: '1rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Package size={18} color={stat.color} />
            </div>
            <div>
              <p style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b' }}>{stat.label.toUpperCase()}</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '3px', background: '#f1f3f5', borderRadius: 10, padding: '3px' }}>
          {[{ id: 'list', label: 'Liste' }, { id: 'kanban', label: 'Kanban' }].map(v => (
            <button
              key={v.id} onClick={() => setActiveView(v.id)}
              style={{
                padding: '0.35rem 0.875rem', borderRadius: 8, border: 'none',
                background: activeView === v.id ? 'white' : 'transparent',
                color: activeView === v.id ? '#1a1a1b' : '#64748b',
                fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                boxShadow: activeView === v.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}>
          <Plus size={15} /> Nouveau matériel
        </button>
      </div>

      {/* LIST VIEW — grouped by pole */}
      {activeView === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {poles.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              Aucun matériel.{' '}
              <button onClick={openAdd} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 700 }}>
                + Ajouter
              </button>
            </div>
          ) : poles.map(pole => {
            const items = byPole[pole];
            const isOpen = expandedPoles[pole] !== false; // open by default
            return (
              <div key={pole} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                {/* Pole header */}
                <div
                  onClick={() => togglePole(pole)}
                  style={{ padding: '0.875rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#fafafa', borderBottom: isOpen ? '1px solid var(--border)' : 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{pole}</span>
                    <span style={{ background: '#e9ecef', color: '#64748b', padding: '1px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 600 }}>{items.length}</span>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {isOpen && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                      <thead>
                        <tr style={{ background: '#f8f9fa' }}>
                          {['TITRE', 'QTÉ', 'PROPRIÉTAIRE', 'RESPONSABLE', 'ÉTAT', 'LIEU', 'INSTALL.', 'RETOUR', 'NOTE', ''].map(h => (
                            <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f1f3f5' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '0.6rem 1rem', fontSize: '0.82rem', fontWeight: 600 }}>
                              {item.title || item.label}
                            </td>
                            <td style={{ padding: '0.6rem 1rem', fontSize: '0.82rem', color: '#475569' }}>
                              {item.quantity || item.qty}
                            </td>
                            <td style={{ padding: '0.6rem 1rem', fontSize: '0.78rem', color: '#475569' }}>
                              {item.owner || <span style={{ color: '#cbd5e1' }}>—</span>}
                            </td>
                            <td style={{ padding: '0.6rem 1rem', fontSize: '0.78rem', color: '#475569' }}>
                              {item.responsible || <span style={{ color: '#cbd5e1' }}>—</span>}
                            </td>
                            <td style={{ padding: '0.6rem 1rem' }}>
                              <StatusPill status={item.status} />
                            </td>
                            <td style={{ padding: '0.6rem 1rem', fontSize: '0.75rem', color: '#475569', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.storageLocation || <span style={{ color: '#cbd5e1' }}>—</span>}
                            </td>
                            <td style={{ padding: '0.6rem 1rem', fontSize: '0.75rem', color: '#475569', whiteSpace: 'nowrap' }}>
                              {item.installDate || <span style={{ color: '#cbd5e1' }}>—</span>}
                            </td>
                            <td style={{ padding: '0.6rem 1rem', fontSize: '0.75rem', color: '#475569', whiteSpace: 'nowrap' }}>
                              {item.returnDate || <span style={{ color: '#cbd5e1' }}>—</span>}
                            </td>
                            <td style={{ padding: '0.6rem 1rem', fontSize: '0.72rem', color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.notes || <span style={{ color: '#cbd5e1' }}>—</span>}
                            </td>
                            <td style={{ padding: '0.6rem 0.875rem', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                <button onClick={() => openEdit(item)} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 5 }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#f1f3f5'; e.currentTarget.style.color = '#475569'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button onClick={() => deleteItem('logistics', 'materials', item.id)} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 5 }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* KANBAN VIEW */}
      {activeView === 'kanban' && (
        <KanbanBoard
          columns={columns}
          items={materials}
          renderCard={(item) => (
            <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', cursor: 'grab' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, background: '#f1f3f5', color: '#64748b', padding: '2px 6px', borderRadius: 99 }}>
                  {item.pole || 'Général'}
                </span>
                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                  <button onClick={e => { e.stopPropagation(); openEdit(item); }} style={{ padding: 3, background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 4, display: 'flex' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                    onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                  ><Edit2 size={11} /></button>
                  <button onClick={e => { e.stopPropagation(); deleteItem('logistics', 'materials', item.id); }} style={{ padding: 3, background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 4, display: 'flex' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                  ><Trash2 size={11} /></button>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{item.title || item.label}</p>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {item.responsible
                  ? <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.52rem', fontWeight: 800 }}>{item.responsible.slice(0, 1).toUpperCase()}</div>
                  : <div />
                }
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>×{item.quantity || item.qty}</span>
              </div>
            </div>
          )}
          onMoveItem={(id, colId) => updateItem('logistics', 'materials', id, { status: colId })}
          onReorderColumns={newCols => reorderColumns('logistics', newCols)}
          onAddColumn={form  => addColumn('logistics', form)}
          onEditColumn={(id, form) => updateColumn('logistics', id, form)}
          onDeleteColumn={id => deleteColumn('logistics', id)}
          onAddItem={() => openAdd()}
        />
      )}

      {/* ADD / EDIT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? 'Modifier le matériel' : 'Nouveau matériel'} maxWidth="580px">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>TITRE *</label>
              <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} placeholder="Ex: Barrières Vauban" />
            </div>
            <div>
              <label style={labelStyle}>QUANTITÉ</label>
              <input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>PROPRIÉTAIRE</label>
              <input type="text" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} style={inputStyle} placeholder="Ex: Association, Mairie..." />
            </div>
            <div>
              <label style={labelStyle}>RESPONSABLE</label>
              <input type="text" value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} style={inputStyle} placeholder="Prénom du responsable" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>PÔLE</label>
              <select value={form.pole} onChange={e => setForm(f => ({ ...f, pole: e.target.value }))} style={inputStyle}>
                {EVENT_POLES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>ÉTAT</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                {Object.entries(MATERIAL_STATUSES).filter(([k]) => !['ordered','todo','done'].includes(k)).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>LIEU DE STOCKAGE</label>
            <input type="text" value={form.storageLocation} onChange={e => setForm(f => ({ ...f, storageLocation: e.target.value }))} style={inputStyle} placeholder="Ex: Cave de la salle, Camion..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>DATE D'INSTALLATION</label>
              <input type="date" value={form.installDate} onChange={e => setForm(f => ({ ...f, installDate: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>DATE DE RETOUR</label>
              <input type="date" value={form.returnDate} onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>NOTE</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} placeholder="Informations complémentaires..." />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '0.25rem' }}>
            {editingItem ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
