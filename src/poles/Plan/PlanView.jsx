import React, { useState, useRef, useCallback } from 'react';
import { useEvent } from '../../context/EventContext';
import { Plus, Trash2, Edit2, X, Package, MapPin } from 'lucide-react';
import Modal from '../../components/shared/Modal';

// ── Marker types ──────────────────────────────────────────────────────────────
const MARKER_TYPES = {
  scene:     { label: 'Scène',          color: '#6366f1', emoji: '🎤' },
  son:       { label: 'Son / Technique',color: '#8b5cf6', emoji: '🔊' },
  buvette:   { label: 'Buvette / Bar',  color: '#f59e0b', emoji: '🍺' },
  restauration: { label: 'Restauration', color: '#f97316', emoji: '🍽️' },
  accueil:   { label: 'Accueil',        color: '#10b981', emoji: '👋' },
  securite:  { label: 'Sécurité',       color: '#ef4444', emoji: '🛡️' },
  parking:   { label: 'Parking',        color: '#64748b', emoji: '🅿️' },
  toilettes: { label: 'Toilettes',      color: '#06b6d4', emoji: '🚻' },
  firstaid:  { label: 'Premiers Secours', color: '#dc2626', emoji: '🚑' },
  village:   { label: 'Village',        color: '#16a34a', emoji: '🏘️' },
  deco:      { label: 'Décoration',     color: '#ec4899', emoji: '🎨' },
  logistique:{ label: 'Logistique',     color: '#0ea5e9', emoji: '📦' },
  autre:     { label: 'Autre',          color: '#94a3b8', emoji: '📍' },
};

const EMPTY_FORM = { label: '', type: 'scene', notes: '', linkedMaterials: [] };

// ── Marker pin component ──────────────────────────────────────────────────────
function MarkerPin({ marker, isSelected, onMouseDown, onClick }) {
  const t = MARKER_TYPES[marker.type] || MARKER_TYPES.autre;
  return (
    <div
      onMouseDown={onMouseDown}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${marker.x}%`,
        top: `${marker.y}%`,
        transform: 'translate(-50%, -100%)',
        cursor: 'grab',
        userSelect: 'none',
        zIndex: isSelected ? 20 : 10,
        filter: isSelected ? `drop-shadow(0 0 8px ${t.color})` : 'none',
      }}
    >
      {/* Pin body */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        background: t.color,
        border: `3px solid white`,
        boxShadow: isSelected ? `0 0 0 3px ${t.color}50, 0 4px 12px rgba(0,0,0,0.25)` : '0 2px 8px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'box-shadow 0.15s',
      }}>
        <span style={{ transform: 'rotate(45deg)', fontSize: '0.9rem', display: 'block', lineHeight: 1 }}>{t.emoji}</span>
      </div>
      {/* Label */}
      <div style={{
        position: 'absolute', top: '38px', left: '50%', transform: 'translateX(-50%)',
        background: 'white', border: `1px solid ${t.color}50`,
        borderRadius: '6px', padding: '2px 8px', whiteSpace: 'nowrap',
        fontSize: '0.62rem', fontWeight: 800, color: t.color,
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        pointerEvents: 'none',
      }}>
        {marker.label}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PlanView() {
  const { data, addPlanMarker, updatePlanMarker, deletePlanMarker } = useEvent();
  const markers = data.poles.plan?.markers || [];
  const materials = data.poles.logistics.materials;

  const canvasRef = useRef(null);
  const [selected, setSelected] = useState(null);   // selected marker id
  const [modal, setModal] = useState({ open: false, editing: null, x: null, y: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState(null);        // filter by type
  const [dragging, setDragging] = useState(null);    // { id, startMouseX, startMouseY, startX, startY }
  const [pendingClick, setPendingClick] = useState(null); // { x, y } in % for placing

  // ── Dragging ────────────────────────────────────────────────────────────────
  const handleMarkerMouseDown = useCallback((e, marker) => {
    e.stopPropagation();
    setSelected(marker.id);
    const rect = canvasRef.current.getBoundingClientRect();
    setDragging({
      id: marker.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: marker.x,
      startY: marker.y,
      moved: false,
    });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragging.startMouseX) / rect.width) * 100;
    const dy = ((e.clientY - dragging.startMouseY) / rect.height) * 100;
    const newX = Math.max(2, Math.min(98, dragging.startX + dx));
    const newY = Math.max(2, Math.min(98, dragging.startY + dy));
    updatePlanMarker(dragging.id, { x: newX, y: newY });
    setDragging(prev => ({ ...prev, moved: true }));
  }, [dragging, updatePlanMarker]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  // ── Click on canvas to place ────────────────────────────────────────────────
  const handleCanvasClick = useCallback((e) => {
    if (dragging?.moved) return;
    if (e.target !== canvasRef.current && !e.target.classList.contains('plan-bg')) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSelected(null);
    setForm(EMPTY_FORM);
    setModal({ open: true, editing: null, x, y });
  }, [dragging]);

  // ── Form submit ─────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (modal.editing) {
      updatePlanMarker(modal.editing.id, form);
    } else {
      addPlanMarker({ ...form, id: 'p_' + Date.now(), x: modal.x, y: modal.y });
    }
    setModal({ open: false, editing: null, x: null, y: null });
  };

  const openEdit = (marker) => {
    setForm({ label: marker.label, type: marker.type, notes: marker.notes || '', linkedMaterials: marker.linkedMaterials || [] });
    setModal({ open: true, editing: marker, x: null, y: null });
  };

  const handleDelete = (id) => {
    deletePlanMarker(id);
    setSelected(null);
  };

  const filtered = filter ? markers.filter(m => m.type === filter) : markers;
  const selectedMarker = markers.find(m => m.id === selected);

  // type counts for legend
  const typeCounts = markers.reduce((acc, m) => { acc[m.type] = (acc[m.type] || 0) + 1; return acc; }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Plan du Site</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Cliquez sur la carte pour poser un point · Glissez pour déplacer</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setModal({ open: true, editing: null, x: 50, y: 50 }); }}
          className="btn-primary"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          <Plus size={18} /> Ajouter un point
        </button>
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Canvas ── */}
        <div
          ref={canvasRef}
          className="plan-bg"
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'relative',
            height: '580px',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            cursor: dragging ? 'grabbing' : 'crosshair',
            background: '#f8fffe',
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px),
              linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px, 50px 50px, 10px 10px, 10px 10px',
            userSelect: 'none',
          }}
        >
          {/* Terrain zones (decorative) */}
          <div style={{ position: 'absolute', top: '5%', left: '5%', width: '90%', height: '88%', border: '2px dashed #d1fae5', borderRadius: '16px', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', fontWeight: 800, color: '#a7f3d0', letterSpacing: '0.1em', pointerEvents: 'none' }}>PÉRIMÈTRE DU SITE</div>

          {/* Markers */}
          {filtered.map(marker => (
            <MarkerPin
              key={marker.id}
              marker={marker}
              isSelected={selected === marker.id}
              onMouseDown={(e) => handleMarkerMouseDown(e, marker)}
              onClick={(e) => { e.stopPropagation(); setSelected(selected === marker.id ? null : marker.id); }}
            />
          ))}

          {/* Compass */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, fontSize: '1.2rem', opacity: 0.3, pointerEvents: 'none' }}>🧭</div>

          {/* Click hint */}
          {markers.length === 0 && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'var(--text-muted)', pointerEvents: 'none' }}>
              <MapPin size={36} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Cliquez pour placer votre premier point</p>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Selected marker detail */}
          {selectedMarker && (() => {
            const t = MARKER_TYPES[selectedMarker.type] || MARKER_TYPES.autre;
            const linked = materials.filter(m => (selectedMarker.linkedMaterials || []).includes(m.id));
            return (
              <div className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${t.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: t.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{t.emoji} {t.label}</div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{selectedMarker.label}</h3>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
                </div>
                {selectedMarker.notes && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>{selectedMarker.notes}</p>}
                {linked.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '0.875rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Matériel lié</span>
                    {linked.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                        <Package size={11} color="var(--text-muted)" />
                        <span>{m.title || m.label}</span>
                        <span style={{ color: 'var(--text-muted)' }}>×{m.quantity || m.qty}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(selectedMarker)} style={{ flex: 1, padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <Edit2 size={12} /> Modifier
                  </button>
                  <button onClick={() => handleDelete(selectedMarker.id)} style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', color: '#ef4444' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Filter by type */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Filtrer par type</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                onClick={() => setFilter(null)}
                style={{ padding: '3px 10px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700, border: '1px solid var(--border)', background: filter === null ? 'var(--text-main)' : 'white', color: filter === null ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}
              >
                Tous ({markers.length})
              </button>
              {Object.entries(typeCounts).map(([type, count]) => {
                const t = MARKER_TYPES[type] || MARKER_TYPES.autre;
                return (
                  <button
                    key={type}
                    onClick={() => setFilter(filter === type ? null : type)}
                    style={{ padding: '3px 10px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700, border: `1px solid ${t.color}40`, background: filter === type ? t.color : t.color + '15', color: filter === type ? 'white' : t.color, cursor: 'pointer' }}
                  >
                    {t.emoji} {t.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Marker list */}
          <div className="card" style={{ padding: '1.25rem', maxHeight: '280px', overflowY: 'auto' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Points ({filtered.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filtered.map(m => {
                const t = MARKER_TYPES[m.type] || MARKER_TYPES.autre;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m.id === selected ? null : m.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '0.5rem 0.75rem', borderRadius: '10px',
                      border: `1px solid ${m.id === selected ? t.color + '60' : 'transparent'}`,
                      background: m.id === selected ? t.color + '10' : 'transparent',
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem' }}>{t.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</p>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t.label}</p>
                    </div>
                    {m.id === selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, flexShrink: 0 }} />}
                  </button>
                );
              })}
              {filtered.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Aucun point</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, editing: null, x: null, y: null })}
        title={modal.editing ? 'Modifier le point' : 'Nouveau point sur le plan'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>LABEL</label>
            <input
              required type="text"
              value={form.label}
              onChange={e => setForm({ ...form, label: e.target.value })}
              placeholder="Ex: Scène Principale"
              style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TYPE</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {Object.entries(MARKER_TYPES).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, type: key })}
                  style={{
                    padding: '0.5rem 0.25rem', borderRadius: '10px', cursor: 'pointer',
                    border: `1px solid ${form.type === key ? t.color : 'var(--border)'}`,
                    background: form.type === key ? t.color + '15' : 'white',
                    color: form.type === key ? t.color : 'var(--text-muted)',
                    fontSize: '0.68rem', fontWeight: 700,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NOTES</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>MATÉRIEL LIÉ (logistique)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '140px', overflowY: 'auto', background: '#f8f9fa', borderRadius: '12px', padding: '0.75rem', border: '1px solid var(--border)' }}>
              {materials.map(m => {
                const linked = (form.linkedMaterials || []).includes(m.id);
                return (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem' }}>
                    <input
                      type="checkbox"
                      checked={linked}
                      onChange={() => setForm(prev => ({
                        ...prev,
                        linkedMaterials: linked
                          ? prev.linkedMaterials.filter(id => id !== m.id)
                          : [...(prev.linkedMaterials || []), m.id]
                      }))}
                    />
                    <span style={{ fontWeight: 600 }}>{m.title || m.label}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>×{m.quantity || m.qty}</span>
                  </label>
                );
              })}
              {materials.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Aucun matériel en logistique.</p>}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '1rem', background: 'var(--text-main)', color: 'white', borderRadius: '14px' }}>
            {modal.editing ? 'Enregistrer' : 'Placer sur le plan'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
