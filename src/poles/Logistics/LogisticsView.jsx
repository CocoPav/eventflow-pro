import React, { useState, useRef } from 'react';
import { useEvent, POLES } from '../../context/EventContext';
import { Plus, Trash2, Edit2, Package, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import KanbanBoard from '../../components/shared/KanbanBoard';
import ConfirmModal from '../../components/shared/ConfirmModal';
import { useToast } from '../../components/shared/Toast';

const MATERIAL_STATUSES = {
  to_ask:      { label: 'À demander',          color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  to_buy:      { label: 'À acheter',           color: '#6366f1', bg: 'rgba(99,102,241,0.12)'  },
  to_create:   { label: 'À créer',             color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
  asking:      { label: 'En cours de demande', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  in_progress: { label: 'En cours',            color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  waiting:     { label: 'En attente',          color: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
  acquired:    { label: 'Acquis',              color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  to_return:   { label: 'À rendre',            color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  returned:    { label: 'Rendu / Stocké',      color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  cancelled:   { label: 'Annulé',              color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
};

const EMPTY_FORM = {
  title: '', quantity: 1, owner: '', responsible: '',
  status: 'to_ask', pole: 'Général', storageLocation: '',
  installDate: '', returnDate: '', notes: '',
};

const inputStyle = {
  width: '100%', padding: '0.5rem 0.75rem',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
  fontSize: '0.85rem', background: 'var(--bg-input)', color: 'var(--text-main)',
  outline: 'none', fontFamily: 'var(--font-main)',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

function FocusInput(props) {
  return (
    <input
      style={inputStyle}
      onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
      {...props}
    />
  );
}

/* ── Inline Status Picker ──────────────────────────────────── */
function StatusPicker({ status, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const s = MATERIAL_STATUSES[status] || MATERIAL_STATUSES.to_ask;

  React.useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          background: s.bg, color: s.color,
          padding: '2px 8px 2px 7px', borderRadius: 99,
          fontSize: '0.68rem', fontWeight: 700,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 3,
          whiteSpace: 'nowrap',
        }}
      >
        {s.label}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 200,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
          minWidth: 170, overflow: 'hidden',
        }}>
          {Object.entries(MATERIAL_STATUSES).map(([k, v]) => (
            <button
              key={k}
              onClick={e => { e.stopPropagation(); onChange(k); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '6px 10px',
                background: k === status ? 'var(--bg-hover)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                fontSize: '0.75rem', color: 'var(--text-main)',
                fontFamily: 'var(--font-main)',
              }}
              onMouseEnter={e => { if (k !== status) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { if (k !== status) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, flexShrink: 0 }} />
              {v.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Drag & Drop List ──────────────────────────────────────── */
function DraggableList({ poles, byPole, allPoles, members, onUpdateStatus, onUpdatePole, onMoveItem, onEdit, onDelete }) {
  const [expandedPoles, setExpandedPoles] = useState({});
  // dragState: { id, sourcePole }
  const [dragging, setDragging]     = useState(null);
  // dropTarget: { type: 'row'|'group', id?, pole, position: 'above'|'below' }
  const [dropTarget, setDropTarget] = useState(null);

  const togglePole = (pole) => setExpandedPoles(p => ({ ...p, [pole]: p[pole] === false ? true : false }));
  const isOpen = (pole) => expandedPoles[pole] !== false;

  const handleDragStart = (e, item) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('itemId', item.id);
    setDragging({ id: item.id, pole: item.pole || 'Général' });
  };

  const handleDragEnd = () => { setDragging(null); setDropTarget(null); };

  const getRowPosition = (e, el) => {
    const rect = el.getBoundingClientRect();
    return (e.clientY - rect.top) < rect.height / 2 ? 'above' : 'below';
  };

  const handleRowDragOver = (e, item) => {
    e.preventDefault();
    if (!dragging || dragging.id === item.id) return;
    const pos = getRowPosition(e, e.currentTarget);
    setDropTarget({ type: 'row', id: item.id, pole: item.pole || 'Général', position: pos });
  };

  const handleGroupDragOver = (e, pole) => {
    e.preventDefault();
    if (!dragging) return;
    setDropTarget({ type: 'group', pole });
  };

  const handleDrop = (e, targetPole, targetItemId = null, position = null) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('itemId');
    if (!id) return;
    onMoveItem(id, targetPole, targetItemId, position);
    setDragging(null);
    setDropTarget(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {poles.map(pole => {
        const items = byPole[pole];
        const open  = isOpen(pole);
        const isGroupTarget = dropTarget?.type === 'group' && dropTarget.pole === pole;

        return (
          <div
            key={pole}
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${isGroupTarget ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              transition: 'border-color 0.12s',
            }}
          >
            {/* Group header — drop target */}
            <div
              onClick={() => togglePole(pole)}
              onDragOver={e => handleGroupDragOver(e, pole)}
              onDragLeave={() => setDropTarget(null)}
              onDrop={e => handleDrop(e, pole)}
              style={{
                padding: '0.75rem 1rem',
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                cursor: 'pointer',
                background: isGroupTarget ? 'var(--primary-soft)' : 'var(--bg-elevated)',
                borderBottom: open ? '1px solid var(--border)' : 'none',
                transition: 'background 0.12s',
                userSelect: 'none',
              }}
            >
              {open
                ? <ChevronDown size={13} color="var(--text-muted)" />
                : <ChevronRight size={13} color="var(--text-muted)" />
              }
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{pole}</span>
              <span style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', padding: '1px 7px', borderRadius: 99, fontSize: '0.65rem', fontWeight: 600 }}>
                {items.length}
              </span>
            </div>

            {open && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
                  <colgroup>
                    <col style={{ width: 28 }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: 60 }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: 160 }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: 100 }} />
                    <col style={{ width: 100 }} />
                    <col style={{ width: 64 }} />
                  </colgroup>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)' }}>
                      <th style={thStyle} />
                      {['TITRE', 'QTÉ', 'PROPRIÉTAIRE', 'RESPONSABLE', 'ÉTAT', 'LIEU', 'INSTALL.', 'RETOUR', ''].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const isTarget = dropTarget?.type === 'row' && dropTarget.id === item.id;
                      const isDragging = dragging?.id === item.id;
                      return (
                        <tr
                          key={item.id}
                          draggable
                          onDragStart={e => handleDragStart(e, { ...item, pole })}
                          onDragEnd={handleDragEnd}
                          onDragOver={e => handleRowDragOver(e, { ...item, pole })}
                          onDragLeave={() => setDropTarget(null)}
                          onDrop={e => handleDrop(e, dropTarget?.pole || pole, item.id, dropTarget?.position)}
                          style={{
                            borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                            opacity: isDragging ? 0.4 : 1,
                            boxShadow: isTarget
                              ? dropTarget.position === 'above'
                                ? 'inset 0 2px 0 var(--primary)'
                                : 'inset 0 -2px 0 var(--primary)'
                              : 'none',
                            transition: 'box-shadow 0.08s',
                            background: 'var(--bg-card)',
                          }}
                          onMouseEnter={e => { if (!isDragging) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
                        >
                          {/* Drag handle */}
                          <td style={{ ...tdStyle, cursor: 'grab', color: 'var(--text-subtle)', paddingRight: 0 }}>
                            <GripVertical size={13} />
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 600, fontSize: '0.82rem' }}>
                            {item.title || item.label}
                          </td>
                          <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {item.quantity || item.qty}
                          </td>
                          <td style={{ ...tdStyle, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {item.owner || dash}
                          </td>
                          <td style={{ ...tdStyle, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {item.responsible
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary)', fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {item.responsible.charAt(0).toUpperCase()}
                                  </span>
                                  {item.responsible}
                                </span>
                              : dash}
                          </td>
                          <td style={tdStyle}>
                            <StatusPicker
                              status={item.status}
                              onChange={val => onUpdateStatus(item.id, val)}
                            />
                          </td>
                          <td style={{ ...tdStyle, fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.storageLocation || dash}
                          </td>
                          <td style={{ ...tdStyle, fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {item.installDate || dash}
                          </td>
                          <td style={{ ...tdStyle, fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {item.returnDate || dash}
                          </td>
                          <td style={{ ...tdStyle, padding: '0.5rem 0.75rem' }}>
                            <div style={{ display: 'flex', gap: 2 }}>
                              <button className="btn-ghost" onClick={() => onEdit(item)}><Edit2 size={12} /></button>
                              <button className="btn-ghost" onClick={() => onDelete(item)} style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const dash = <span style={{ color: 'var(--text-subtle)' }}>—</span>;
const thStyle = { padding: '0.5rem 0.875rem', textAlign: 'left', fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', whiteSpace: 'nowrap', background: 'var(--bg-elevated)' };
const tdStyle = { padding: '0.55rem 0.875rem', verticalAlign: 'middle' };

/* ════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════ */
export default function LogisticsView() {
  const { data, addItem, updateItem, deleteItem, addColumn, updateColumn, deleteColumn, reorderColumns } = useEvent();
  const toast = useToast();

  const materials    = data.poles.logistics.materials || [];
  const columns      = data.poles.logistics.columns   || [];
  const orgMembers   = data.association?.members      || [];
  const customPoles  = data.association?.customPoles  || [];
  const allPoles     = [...POLES, ...customPoles.map(p => p.name)];

  const [activeView,  setActiveView]  = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toDelete,    setToDelete]    = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd  = () => { setEditingItem(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
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
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateItem('logistics', 'materials', editingItem.id, { ...form, label: form.title, qty: form.quantity });
      toast.success('Matériel mis à jour');
    } else {
      addItem('logistics', 'materials', { ...form, label: form.title, qty: form.quantity, unitPrice: 0 });
      toast.success('Matériel ajouté');
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
  };

  const handleDelete = () => {
    deleteItem('logistics', 'materials', toDelete.id);
    toast.success('Matériel supprimé');
    setToDelete(null);
  };

  const handleUpdateStatus = (id, status) => {
    updateItem('logistics', 'materials', id, { status });
  };

  const handleMoveItem = (id, targetPole, targetItemId, position) => {
    // Change pole
    updateItem('logistics', 'materials', id, { pole: targetPole });
    // TODO: reorder within group if needed (requires array reorder in context)
  };

  // Group by pole
  const byPole = {};
  materials.forEach(m => {
    const pole = m.pole || 'Général';
    if (!byPole[pole]) byPole[pole] = [];
    byPole[pole].push(m);
  });
  const poles = Object.keys(byPole).sort();

  // Stats
  const totalItems    = materials.length;
  const pendingItems  = materials.filter(m => ['to_ask','to_buy','to_create','asking'].includes(m.status)).length;
  const acquiredItems = materials.filter(m => ['acquired'].includes(m.status)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div>
        <h2 className="section-title">Logistique</h2>
        <p className="section-subtitle">Gestion du matériel par pôle</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
        {[
          { label: 'Total matériels', value: totalItems,   color: 'var(--primary)',  bg: 'var(--primary-soft)' },
          { label: 'À acquérir',      value: pendingItems,  color: '#f59e0b',         bg: 'rgba(245,158,11,0.1)' },
          { label: 'Acquis',          value: acquiredItems, color: 'var(--success)',  bg: 'rgba(16,185,129,0.1)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', padding: '1rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Package size={17} color={stat.color} />
            </div>
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</p>
              <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 3, background: 'var(--bg-elevated)', borderRadius: 10, padding: 3 }}>
          {[{ id: 'list', label: 'Liste' }, { id: 'kanban', label: 'Kanban' }].map(v => (
            <button
              key={v.id} onClick={() => setActiveView(v.id)}
              style={{
                padding: '0.3rem 0.875rem', borderRadius: 8, border: 'none',
                background: activeView === v.id ? 'var(--bg-card)' : 'transparent',
                color: activeView === v.id ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                boxShadow: activeView === v.id ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s', fontFamily: 'var(--font-main)',
              }}
            >{v.label}</button>
          ))}
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={14} /> Nouveau matériel
        </button>
      </div>

      {/* LIST VIEW */}
      {activeView === 'list' && (
        poles.length === 0
          ? (
            <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Aucun matériel.{' '}
              <button onClick={openAdd} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}>+ Ajouter</button>
            </div>
          ) : (
            <DraggableList
              poles={poles}
              byPole={byPole}
              allPoles={allPoles}
              members={orgMembers}
              onUpdateStatus={handleUpdateStatus}
              onUpdatePole={(id, pole) => updateItem('logistics', 'materials', id, { pole })}
              onMoveItem={handleMoveItem}
              onEdit={openEdit}
              onDelete={setToDelete}
            />
          )
      )}

      {/* KANBAN VIEW */}
      {activeView === 'kanban' && (
        <KanbanBoard
          columns={columns}
          items={materials}
          renderCard={(item) => (
            <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', cursor: 'grab' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, background: 'var(--bg-elevated)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 99 }}>
                  {item.pole || 'Général'}
                </span>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button onClick={e => { e.stopPropagation(); openEdit(item); }} className="btn-ghost"><Edit2 size={11} /></button>
                  <button onClick={e => { e.stopPropagation(); setToDelete(item); }} className="btn-ghost" style={{ color: 'var(--danger)' }}><Trash2 size={11} /></button>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.3 }}>{item.title || item.label}</p>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {item.responsible
                  ? <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '0.55rem', fontWeight: 800 }}>
                      {item.responsible.charAt(0).toUpperCase()}
                    </div>
                  : <div />}
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>×{item.quantity || item.qty}</span>
              </div>
            </div>
          )}
          onMoveItem={(id, colId) => updateItem('logistics', 'materials', id, { status: colId })}
          onReorderColumns={newCols => reorderColumns('logistics', newCols)}
          onAddColumn={f  => addColumn('logistics', f)}
          onEditColumn={(id, f) => updateColumn('logistics', id, f)}
          onDeleteColumn={id => deleteColumn('logistics', id)}
          onAddItem={() => openAdd()}
        />
      )}

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        title={editingItem ? 'Modifier le matériel' : 'Nouveau matériel'}
        maxWidth="580px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={lbl}>TITRE *</label>
              <FocusInput required placeholder="Ex: Barrières Vauban" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={lbl}>QUANTITÉ</label>
              <FocusInput type="number" min={1} value={form.quantity} onChange={e => set('quantity', parseInt(e.target.value) || 1)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={lbl}>PÔLE</label>
              <select style={inputStyle} value={form.pole} onChange={e => set('pole', e.target.value)}>
                {allPoles.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={lbl}>ÉTAT</label>
              <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.entries(MATERIAL_STATUSES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={lbl}>PROPRIÉTAIRE</label>
              <FocusInput placeholder="Ex: Association, Mairie…" value={form.owner} onChange={e => set('owner', e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={lbl}>RESPONSABLE</label>
              {orgMembers.length > 0 ? (
                <select style={inputStyle} value={form.responsible} onChange={e => set('responsible', e.target.value)}>
                  <option value="">— Aucun —</option>
                  {orgMembers.map(m => {
                    const name = [m.firstName, m.lastName].filter(Boolean).join(' ') || m.name || '';
                    return <option key={m.id} value={name}>{name}{m.role ? ` · ${m.role}` : ''}</option>;
                  })}
                </select>
              ) : (
                <FocusInput placeholder="Prénom du responsable" value={form.responsible} onChange={e => set('responsible', e.target.value)} />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={lbl}>LIEU DE STOCKAGE</label>
            <FocusInput placeholder="Ex: Cave de la salle, Camion…" value={form.storageLocation} onChange={e => set('storageLocation', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={lbl}>DATE D'INSTALLATION</label>
              <FocusInput type="date" value={form.installDate} onChange={e => set('installDate', e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={lbl}>DATE DE RETOUR</label>
              <FocusInput type="date" value={form.returnDate} onChange={e => set('returnDate', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={lbl}>NOTE</label>
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
              placeholder="Informations complémentaires…"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: 4 }}>
            {editingItem ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!toDelete}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
        title={`Supprimer "${toDelete?.title || toDelete?.label}" ?`}
        description="Ce matériel sera définitivement supprimé."
      />
    </div>
  );
}

const lbl = { fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' };
