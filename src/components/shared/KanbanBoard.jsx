import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Settings, Trash2, X, GripVertical } from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

export const GLOBAL_TYPES = [
  { id: 'todo',        label: 'À faire',    color: '#6366f1' },
  { id: 'in_progress', label: 'En cours',   color: '#3b82f6' },
  { id: 'waiting',     label: 'En attente', color: '#f97316' },
  { id: 'done',        label: 'Terminé',    color: '#10b981' },
];

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f59e0b', '#f97316', '#ef4444', '#10b981',
  '#14b8a6', '#06b6d4', '#64748b', '#94a3b8',
];

// ─── Column modal ─────────────────────────────────────────────────────────────

function ColumnModal({ column, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    label: column?.label || '',
    color: column?.color || '#6366f1',
    type:  column?.type  || 'todo',
  });

  const handleSave = () => { if (form.label.trim()) onSave(form); };
  const typeInfo = GLOBAL_TYPES.find(t => t.id === form.type) || GLOBAL_TYPES[0];

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'white', borderRadius: 20, padding: '1.5rem', width: 360, display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
            {column ? 'Modifier la colonne' : 'Nouvelle colonne'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 6, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '0.3rem', letterSpacing: '0.04em' }}>NOM DE LA COLONNE</label>
          <input
            autoFocus
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Ex: À contacter, En validation…"
            style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: 10, background: '#f8f9fa', border: '1.5px solid #e9ecef', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontWeight: 500 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>TYPE D'ÉTAT GLOBAL</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {GLOBAL_TYPES.map(t => (
              <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))}
                style={{
                  padding: '0.55rem 0.75rem', borderRadius: 10,
                  border: '2px solid ' + (form.type === t.id ? t.color : '#e9ecef'),
                  background: form.type === t.id ? t.color + '12' : 'white',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
                  fontSize: '0.78rem', fontWeight: 700,
                  color: form.type === t.id ? t.color : '#64748b',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>COULEUR</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                style={{
                  width: 30, height: 30, borderRadius: '50%', background: c, border: 'none',
                  outline: form.color === c ? `3px solid ${c}` : '3px solid transparent',
                  outlineOffset: 2, cursor: 'pointer', padding: 0, transition: 'outline 0.1s'
                }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '0.6rem 0.875rem', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: form.color, flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1a1a1b' }}>{form.label || 'Aperçu…'}</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.62rem', fontWeight: 700, color: typeInfo.color, background: typeInfo.color + '15', padding: '1px 6px', borderRadius: 99, flexShrink: 0 }}>
            {typeInfo.label}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {column && onDelete && (
            <button onClick={onDelete}
              style={{ padding: '0.55rem 0.875rem', borderRadius: 10, border: '1.5px solid #fecaca', background: 'white', color: '#ef4444', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Trash2 size={13} /> Supprimer
            </button>
          )}
          <button onClick={handleSave} disabled={!form.label.trim()}
            style={{
              flex: 1, padding: '0.55rem 1rem', borderRadius: 10,
              background: form.label.trim() ? 'var(--primary)' : '#e9ecef',
              color: form.label.trim() ? 'white' : '#94a3b8',
              fontWeight: 700, fontSize: '0.8rem',
              cursor: form.label.trim() ? 'pointer' : 'not-allowed', border: 'none',
              transition: 'all 0.15s'
            }}
          >
            {column ? 'Enregistrer' : 'Créer la colonne'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KanbanBoard ──────────────────────────────────────────────────────────────

/**
 * Props:
 *   columns          [{ id, label, color, type }]
 *   items            each item needs { id, status }  (status === col.id)
 *   renderCard       (item, col) => JSX
 *   onMoveItem       (itemId, newColId) => void
 *   onReorderColumns (newColumns) => void
 *   onAddColumn      (form) => void
 *   onEditColumn     (colId, form) => void
 *   onDeleteColumn   (colId) => void
 *   onAddItem        (colId) => void
 */
export default function KanbanBoard({
  columns = [],
  items = [],
  renderCard,
  onMoveItem,
  onReorderColumns,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
  onAddItem,
}) {
  // ── drag state ────────────────────────────────────────────────
  const [dragItemId, setDragItemId]     = useState(null); // item being dragged
  const [dragColId,  setDragColId]      = useState(null); // column being dragged
  const [overColId,  setOverColId]      = useState(null); // column currently hovered
  const [colModal,   setColModal]       = useState(null); // null | 'new' | column obj

  // ── auto-scroll refs ──────────────────────────────────────────
  const containerRef   = useRef(null);
  const scrollRafRef   = useRef(null);   // requestAnimationFrame id
  const scrollSpeedRef = useRef(0);      // current scroll speed (px/frame), signed

  const stopScroll = useCallback(() => {
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
    scrollSpeedRef.current = 0;
  }, []);

  const scrollLoop = useCallback(() => {
    const container = containerRef.current;
    if (!container || scrollSpeedRef.current === 0) return;
    container.scrollLeft += scrollSpeedRef.current;
    scrollRafRef.current = requestAnimationFrame(scrollLoop);
  }, []);

  const updateScrollSpeed = useCallback((clientX) => {
    const container = containerRef.current;
    if (!container) return;
    const rect  = container.getBoundingClientRect();
    const x     = clientX - rect.left;
    const ZONE  = 120;
    const MAX   = 18;

    let speed = 0;
    if (x < ZONE)                    speed = -MAX * (1 - x / ZONE);
    else if (x > rect.width - ZONE)  speed =  MAX * (1 - (rect.width - x) / ZONE);

    scrollSpeedRef.current = speed;

    if (speed !== 0 && !scrollRafRef.current) {
      scrollRafRef.current = requestAnimationFrame(scrollLoop);
    } else if (speed === 0) {
      stopScroll();
    }
  }, [scrollLoop, stopScroll]);

  // cleanup on unmount
  useEffect(() => stopScroll, [stopScroll]);

  // ── handlers ─────────────────────────────────────────────────

  const handleContainerDragOver = useCallback((e) => {
    updateScrollSpeed(e.clientX);
  }, [updateScrollSpeed]);

  const handleContainerDragLeave = useCallback((e) => {
    if (!containerRef.current?.contains(e.relatedTarget)) stopScroll();
  }, [stopScroll]);

  const handleDragEnd = useCallback(() => {
    setDragItemId(null);
    setDragColId(null);
    setOverColId(null);
    stopScroll();
  }, [stopScroll]);

  const handleColDrop = useCallback((e, targetColId) => {
    e.preventDefault();
    stopScroll();

    const itemId = e.dataTransfer.getData('kanban-item-id');
    const srcColId = e.dataTransfer.getData('kanban-col-id');

    if (srcColId && srcColId !== targetColId && onReorderColumns) {
      const newCols = [...columns];
      const fromIdx = newCols.findIndex(c => c.id === srcColId);
      const toIdx   = newCols.findIndex(c => c.id === targetColId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const [moved] = newCols.splice(fromIdx, 1);
        newCols.splice(toIdx, 0, moved);
        onReorderColumns(newCols);
      }
    } else if (itemId && onMoveItem) {
      onMoveItem(itemId, targetColId);
    }

    setDragItemId(null);
    setDragColId(null);
    setOverColId(null);
  }, [columns, onReorderColumns, onMoveItem, stopScroll]);

  // ── render ────────────────────────────────────────────────────

  return (
    <>
      <div
        ref={containerRef}
        onDragOver={handleContainerDragOver}
        onDragLeave={handleContainerDragLeave}
        style={{
          display: 'flex',
          gap: '0.875rem',
          overflowX: 'auto',
          overflowY: 'visible',
          alignItems: 'flex-start',
          paddingBottom: '0.75rem',
          width: '100%',
          /* allow children to determine height without clipping */
          boxSizing: 'border-box',
        }}
      >
        {columns.map(col => {
          const colItems  = items.filter(item => item.status === col.id);
          const typeInfo  = GLOBAL_TYPES.find(t => t.id === col.type) || GLOBAL_TYPES[0];
          const isColDrag = dragColId  === col.id;
          const isItemOver = dragItemId && overColId === col.id;
          const isColOver  = dragColId  && dragColId !== col.id && overColId === col.id;

          return (
            <div
              key={col.id}
              onDragOver={e => { e.preventDefault(); setOverColId(col.id); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOverColId(null); }}
              onDrop={e => handleColDrop(e, col.id)}
              style={{
                display: 'flex', flexDirection: 'column', gap: '0.5rem',
                background: isItemOver ? '#f0f4ff' : isColOver ? '#fffbeb' : '#f8f9fa',
                padding: '0.875rem', borderRadius: '16px',
                border: '1.5px solid ' + (
                  isItemOver ? '#6366f1' :
                  isColOver  ? '#f59e0b' :
                  'var(--border)'
                ),
                minHeight: '420px',
                flex: '0 0 230px',
                opacity: isColDrag ? 0.45 : 1,
                transition: 'background 0.12s, border-color 0.12s, opacity 0.12s',
              }}
            >
              {/* ── Column header ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.125rem' }}>

                {/* Grip — drag handle for reordering */}
                {onReorderColumns && (
                  <div
                    draggable
                    onDragStart={e => {
                      e.stopPropagation();
                      setDragColId(col.id);
                      e.dataTransfer.setData('kanban-col-id', col.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={handleDragEnd}
                    title="Glisser pour réordonner"
                    style={{ cursor: 'grab', color: '#d1d5db', display: 'flex', flexShrink: 0, padding: '2px 1px' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                    onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}
                  >
                    <GripVertical size={14} />
                  </div>
                )}

                {/* Dot + label + type badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {col.label}
                  </span>
                  <span style={{ fontSize: '0.58rem', fontWeight: 700, color: typeInfo.color, background: typeInfo.color + '15', padding: '1px 5px', borderRadius: 99, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {typeInfo.label}
                  </span>
                </div>

                {/* Count + settings */}
                <div style={{ display: 'flex', gap: '2px', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.68rem', background: 'white', color: '#64748b', borderRadius: 99, padding: '1px 6px', border: '1px solid #e9ecef', fontWeight: 600 }}>
                    {colItems.length}
                  </span>
                  {(onEditColumn || onDeleteColumn) && (
                    <button
                      onClick={() => setColModal(col)}
                      title="Modifier la colonne"
                      style={{ padding: 3, background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 4, display: 'flex' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#64748b'}
                      onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                    >
                      <Settings size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* ── Cards ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {colItems.map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={e => {
                      setDragItemId(item.id);
                      e.dataTransfer.setData('kanban-item-id', item.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={handleDragEnd}
                    style={{ opacity: dragItemId === item.id ? 0.4 : 1, cursor: 'grab' }}
                  >
                    {renderCard(item, col)}
                  </div>
                ))}
              </div>

              {/* ── Add item ── */}
              {onAddItem && (
                <button
                  onClick={() => onAddItem(col.id)}
                  style={{ padding: '0.35rem 0.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  <Plus size={13} /> Ajouter
                </button>
              )}
            </div>
          );
        })}

        {/* ── Add column ── */}
        {onAddColumn && (
          <button
            onClick={() => setColModal('new')}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              flex: '0 0 180px', minHeight: '120px', alignSelf: 'flex-start',
              background: 'transparent', border: '2px dashed #e2e8f0',
              borderRadius: '16px', color: '#94a3b8', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 700, padding: '1rem',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <Plus size={20} />
            Nouvelle colonne
          </button>
        )}
      </div>

      {/* ── Column modal ── */}
      {colModal && (
        <ColumnModal
          column={colModal === 'new' ? null : colModal}
          onSave={form => {
            if (colModal === 'new') onAddColumn(form);
            else onEditColumn(colModal.id, form);
            setColModal(null);
          }}
          onDelete={colModal !== 'new' && onDeleteColumn ? () => { onDeleteColumn(colModal.id); setColModal(null); } : null}
          onClose={() => setColModal(null)}
        />
      )}
    </>
  );
}
