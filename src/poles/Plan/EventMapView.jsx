import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEvent } from '../../context/EventContext';
import {
  Hand, Pencil, RotateCcw, X, Edit2, Trash2, Plus,
  AlertTriangle, Users, Package, Search, ChevronLeft,
  Save, Undo2, Layers, MapPin, Navigation,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_CENTER = [47.7761, -1.7594];
const DEFAULT_ZOOM = 16;
const ZONE_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b',
];
const ZONE_ICONS = [
  '📍', '🎵', '🍺', '🎪', '🏃', '🚗', '🔒',
  '🎨', '🎭', '🍔', '⛺', '🎯', '🚻', '🅿️', '🎤', '💡',
];

function calcDistance(latlngs) {
  let d = 0;
  for (let i = 1; i < latlngs.length; i++) {
    d += L.latLng(latlngs[i - 1]).distanceTo(L.latLng(latlngs[i]));
  }
  return d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(2)} km`;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const LABEL = {
  fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4,
};
const INP = {
  width: '100%', padding: '0.45rem 0.65rem', borderRadius: 8,
  border: '1px solid var(--border)', fontSize: '0.84rem', boxSizing: 'border-box',
  outline: 'none',
};

// ── ToolBtn ───────────────────────────────────────────────────────────────────

function ToolBtn({ active, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36, height: 36, borderRadius: 8,
        border: active ? '2px solid #6366f1' : '1px solid var(--border)',
        background: active ? '#6366f1' : 'white',
        color: active ? 'white' : '#374151',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {children}
    </button>
  );
}

// ── LegendPanel ───────────────────────────────────────────────────────────────

function LegendPanel({ allElements, onElementClick, activeElementId, materials }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return allElements.filter(
      el => el.name.toLowerCase().includes(q) || (el.description || '').toLowerCase().includes(q)
    );
  }, [allElements, search]);

  const getAlerts = (el) => {
    if (el.type === 'parcours') return false;
    const vol = (el.timeSlots || []).some(s =>
      (s.volunteersRequired || []).some(vr => (vr.assignedIds || []).length < vr.count)
    );
    const mat = (el.materialsRequired || []).some(mr => {
      const m = materials.find(x => x.id === mr.materialId);
      return !m || (m.status !== 'acquired' && m.status !== 'done');
    });
    return vol || mat;
  };

  const renderRow = (el, depth = 0) => {
    const isActive = el.id === activeElementId;
    const hasAlert = getAlerts(el);
    const children = el.type === 'zone'
      ? allElements.filter(z => z.type === 'zone' && z.parentId === el.id)
      : [];

    return (
      <React.Fragment key={el.id}>
        <button
          onClick={() => onElementClick(el)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.45rem',
            padding: `0.42rem 0.625rem 0.42rem ${0.625 + depth * 0.875}rem`,
            background: isActive ? '#eef2ff' : 'transparent',
            border: isActive ? '1px solid #c7d2fe' : '1px solid transparent',
            borderRadius: 7, cursor: 'pointer', textAlign: 'left', marginBottom: 2,
          }}
        >
          {el.type === 'zone' && (
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: el.color || '#6366f1', flexShrink: 0 }} />
          )}
          {el.type === 'parcours' && (
            <svg width="16" height="8" viewBox="0 0 16 8" style={{ flexShrink: 0 }}>
              <line x1="0" y1="4" x2="16" y2="4" stroke={el.color || '#10b981'} strokeWidth="2.5" strokeDasharray="4,3" />
            </svg>
          )}
          {el.type === 'point' && (
            <MapPin size={10} color={el.color || '#f97316'} style={{ flexShrink: 0 }} />
          )}
          {el.type !== 'parcours' && (
            <span style={{ fontSize: '0.875rem', flexShrink: 0 }}>{el.icon || '📍'}</span>
          )}
          <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: isActive ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {el.name}
          </span>
          {el.type === 'parcours' && el.latlngs?.length >= 2 && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>
              {calcDistance(el.latlngs)}
            </span>
          )}
          {hasAlert && <AlertTriangle size={11} color="#f97316" style={{ flexShrink: 0 }} />}
        </button>
        {children.map(child => renderRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  const zones = allElements.filter(el => el.type === 'zone');
  const parcours = allElements.filter(el => el.type === 'parcours');
  const points = allElements.filter(el => el.type === 'point');
  const rootZones = zones.filter(z => !z.parentId || !zones.find(p => p.id === z.parentId));
  const orphanZones = zones.filter(z => z.parentId && !zones.find(p => p.id === z.parentId));

  const sectionLabelStyle = {
    fontSize: '0.63rem', fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    padding: '0.5rem 0.625rem 0.25rem',
    display: 'flex', alignItems: 'center', gap: 5,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Layers size={14} color="var(--text-muted)" />
        <span style={{ fontWeight: 700, fontSize: '0.875rem', flex: 1 }}>Éléments</span>
        {allElements.length > 0 && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: '#f1f3f5', padding: '2px 8px', borderRadius: 99 }}>
            {allElements.length}
          </span>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#f8f9fa', borderRadius: 8, padding: '0.325rem 0.625rem' }}>
          <Search size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.8rem', outline: 'none' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {allElements.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Layers size={28} style={{ opacity: 0.25, display: 'block', margin: '0 auto 0.625rem' }} />
            <span style={{ fontSize: '0.78rem', lineHeight: 1.6 }}>
              Aucun élément.<br />Utilisez les outils pour dessiner.
            </span>
          </div>
        ) : filtered ? (
          filtered.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              Aucun résultat pour «&nbsp;{search}&nbsp;»
            </div>
          ) : (
            filtered.map(el => renderRow(el, 0))
          )
        ) : (
          <>
            {zones.length > 0 && (
              <>
                <div style={sectionLabelStyle}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
                  Zones
                </div>
                {rootZones.map(z => renderRow(z, 0))}
                {orphanZones.map(z => renderRow(z, 0))}
              </>
            )}
            {parcours.length > 0 && (
              <>
                <div style={sectionLabelStyle}>
                  <svg width="12" height="6" viewBox="0 0 12 6"><line x1="0" y1="3" x2="12" y2="3" stroke="#10b981" strokeWidth="2" strokeDasharray="3,2" /></svg>
                  Parcours
                </div>
                {parcours.map(p => renderRow(p, 0))}
              </>
            )}
            {points.length > 0 && (
              <>
                <div style={sectionLabelStyle}>
                  <MapPin size={9} color="#f97316" />
                  Points
                </div>
                {points.map(pt => renderRow(pt, 0))}
              </>
            )}
          </>
        )}
      </div>

      {allElements.length > 0 && (
        <div style={{ padding: '0.45rem 0.875rem', borderTop: '1px solid var(--border)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {allElements.length} élément{allElements.length > 1 ? 's' : ''} · cliquez pour centrer
        </div>
      )}
    </div>
  );
}

// ── ViewPanel ─────────────────────────────────────────────────────────────────

function ViewPanel({ element, allElements, materials, onEdit, onDelete, onBack }) {
  const parent = element.parentId ? allElements.find(el => el.id === element.parentId) : null;

  const volAlerts = (element.timeSlots || []).filter(s =>
    (s.volunteersRequired || []).some(vr => (vr.assignedIds || []).length < vr.count)
  );
  const matAlerts = (element.materialsRequired || []).filter(mr => {
    const mat = materials.find(m => m.id === mr.materialId);
    return !mat || (mat.status !== 'acquired' && mat.status !== 'done');
  });
  const hasAlert = element.type !== 'parcours' && (volAlerts.length > 0 || matAlerts.length > 0);

  const typeLabel = element.type === 'zone' ? 'Zone'
    : element.type === 'parcours' ? 'Parcours'
    : 'Point';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.72rem', padding: '0 0 0.5rem', marginBottom: '0.25rem' }}
        >
          <ChevronLeft size={12} /> Tous les éléments
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: (element.color || '#6366f1') + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {element.type === 'parcours' ? (
              <svg width="20" height="10" viewBox="0 0 20 10">
                <line x1="0" y1="5" x2="20" y2="5" stroke={element.color || '#10b981'} strokeWidth="3" strokeDasharray="5,4" />
              </svg>
            ) : (
              <span style={{ fontSize: '1.1rem' }}>{element.icon || '📍'}</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {parent && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 1 }}>{parent.icon || '📍'} {parent.name} ›</div>}
            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{element.name}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 1 }}>{typeLabel}</div>
            {element.place && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                <MapPin size={10} />{element.place}
              </div>
            )}
            {element.description && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>{element.description}</div>}
            {element.type === 'parcours' && element.latlngs?.length >= 2 && (
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: element.color || '#10b981', marginTop: 3 }}>
                {calcDistance(element.latlngs)}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
            <button onClick={onEdit} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Edit2 size={11} />
            </button>
            <button onClick={onDelete} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #fecaca', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {hasAlert && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, padding: '4px 8px', marginTop: '0.5rem', fontSize: '0.7rem', color: '#c2410c', flexWrap: 'wrap' }}>
            <AlertTriangle size={11} />
            {volAlerts.length > 0 && `${volAlerts.length} créneau${volAlerts.length > 1 ? 'x' : ''} incomplet${volAlerts.length > 1 ? 's' : ''}`}
            {volAlerts.length > 0 && matAlerts.length > 0 && ' · '}
            {matAlerts.length > 0 && `${matAlerts.length} matériel${matAlerts.length > 1 ? 's' : ''} non dispo`}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
        {element.type === 'parcours' ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            Parcours tracé sur la carte.
            <br />
            <button onClick={onEdit} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', marginTop: 6 }}>
              Modifier →
            </button>
          </div>
        ) : (
          <>
            {(element.materialsRequired || []).length > 0 && (
              <div style={{ marginBottom: '0.875rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 3, marginBottom: '0.375rem' }}>
                  <Package size={10} /> Matériel
                </div>
                {(element.materialsRequired || []).map((mr, i) => {
                  const mat = materials.find(m => m.id === mr.materialId);
                  const ok = mat && (mat.status === 'acquired' || mat.status === 'done');
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.5rem', background: ok ? '#f0fdf4' : '#fff7ed', borderRadius: 6, marginBottom: 3, fontSize: '0.78rem', border: `1px solid ${ok ? '#bbf7d0' : '#fed7aa'}` }}>
                      <span>{mat ? (mat.title || mat.label) : <em style={{ color: '#ef4444' }}>Introuvable</em>}</span>
                      <span style={{ color: ok ? '#15803d' : '#c2410c', fontWeight: 700, fontSize: '0.68rem' }}>{ok ? '✓' : '⚠'}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {(element.timeSlots || []).length > 0 && (
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Créneaux</div>
                {element.timeSlots.map(slot => {
                  const volAlert = (slot.volunteersRequired || []).some(vr => (vr.assignedIds || []).length < vr.count);
                  return (
                    <div key={slot.id} style={{ background: volAlert ? '#fff7ed' : '#f8f9fa', borderRadius: 8, padding: '0.6rem', marginBottom: '0.5rem', border: `1px solid ${volAlert ? '#fed7aa' : 'var(--border)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: (slot.volunteersRequired || []).length > 0 ? '0.35rem' : 0 }}>
                        {volAlert && <AlertTriangle size={11} color="#f97316" />}
                        <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{slot.label || 'Créneau'}</span>
                        {(slot.startTime || slot.endTime) && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: 'auto' }}>
                            {slot.startTime}{slot.endTime ? ` – ${slot.endTime}` : ''}
                          </span>
                        )}
                      </div>
                      {(slot.volunteersRequired || []).map((vr, i) => {
                        const assigned = (vr.assignedIds || []).length;
                        const ok = assigned >= vr.count;
                        return (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '1px 0' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)' }}>
                              <Users size={10} />{vr.role || '—'}
                            </span>
                            <span style={{ color: ok ? '#10b981' : '#ef4444', fontWeight: 700 }}>{assigned}/{vr.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {(element.materialsRequired || []).length === 0 && (element.timeSlots || []).length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                Aucun matériel ni créneau.<br />
                <button onClick={onEdit} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', marginTop: 6 }}>
                  Modifier →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── EditPanel ─────────────────────────────────────────────────────────────────

function EditPanel({ draft, setDraft, onSave, onCancel, materials, allElements }) {
  const updateSlot = (slotId, updates) => {
    setDraft(d => ({ ...d, timeSlots: (d.timeSlots || []).map(s => s.id === slotId ? { ...s, ...updates } : s) }));
  };

  const canSave = draft?.name?.trim();
  const isParcours = draft?.type === 'parcours';
  const typeLabel = draft?.type === 'zone' ? 'zone' : draft?.type === 'parcours' ? 'parcours' : 'point';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button onClick={onCancel} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={12} />
        </button>
        <h3 style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, flex: 1 }}>
          {draft?.id ? `Modifier le ${typeLabel}` : `Nouveau ${typeLabel}`}
        </h3>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
        {/* Name */}
        <div style={{ marginBottom: '0.625rem' }}>
          <label style={LABEL}>Titre *</label>
          <input
            value={draft?.name || ''}
            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            placeholder={isParcours ? 'Ex : Parcours 5km' : 'Ex : Scène principale'}
            style={INP}
            autoFocus
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '0.625rem' }}>
          <label style={LABEL}>Description</label>
          <textarea
            value={draft?.description || ''}
            onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
            placeholder="Description…"
            rows={2}
            style={{ ...INP, resize: 'vertical' }}
          />
        </div>

        {/* Color (all types) */}
        <div style={{ marginBottom: '0.875rem' }}>
          <label style={LABEL}>Couleur</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {ZONE_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setDraft(d => ({ ...d, color }))}
                style={{ width: 22, height: 22, borderRadius: '50%', background: color, border: draft?.color === color ? '3px solid #1e1b4b' : '2px solid transparent', cursor: 'pointer', padding: 0 }}
              />
            ))}
          </div>
        </div>

        {/* Zone / Point specific fields */}
        {!isParcours && (
          <>
            {/* Lieu */}
            <div style={{ marginBottom: '0.625rem' }}>
              <label style={LABEL}>Lieu</label>
              <input
                value={draft?.place || ''}
                onChange={e => setDraft(d => ({ ...d, place: e.target.value }))}
                placeholder="Ex : Hall A, Parking Est…"
                style={INP}
              />
            </div>

            {/* Zone parente (only show zones as parents) */}
            <div style={{ marginBottom: '0.875rem' }}>
              <label style={LABEL}>Zone parente</label>
              <select
                value={draft?.parentId || ''}
                onChange={e => setDraft(d => ({ ...d, parentId: e.target.value || null }))}
                style={INP}
              >
                <option value="">Aucune (racine)</option>
                {allElements.filter(el => el.id !== draft?.id && el.type === 'zone').map(el => (
                  <option key={el.id} value={el.id}>{el.icon} {el.name}</option>
                ))}
              </select>
            </div>

            {/* Icon */}
            <div style={{ marginBottom: '0.625rem' }}>
              <label style={LABEL}>Icône</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {ZONE_ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setDraft(d => ({ ...d, icon }))}
                    style={{ width: 28, height: 28, borderRadius: 6, border: draft?.icon === icon ? '2px solid #6366f1' : '1px solid var(--border)', background: draft?.icon === icon ? '#eef2ff' : 'white', cursor: 'pointer', fontSize: '0.875rem' }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Materials */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Package size={12} />Matériel
                </span>
                <button
                  onClick={() => setDraft(d => ({ ...d, materialsRequired: [...(d.materialsRequired || []), { materialId: '', quantity: 1 }] }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 6, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#6366f1', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}
                >
                  <Plus size={10} /> Ajouter
                </button>
              </div>
              {(draft?.materialsRequired || []).map((mr, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.2rem', alignItems: 'center' }}>
                  <select
                    value={mr.materialId}
                    onChange={e => setDraft(d => ({ ...d, materialsRequired: d.materialsRequired.map((x, j) => j === i ? { ...x, materialId: e.target.value } : x) }))}
                    style={{ flex: 1, padding: '0.3rem 0.4rem', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.75rem' }}
                  >
                    <option value="">Sélectionner…</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.title || m.label}</option>)}
                  </select>
                  <button
                    onClick={() => setDraft(d => ({ ...d, materialsRequired: d.materialsRequired.filter((_, j) => j !== i) }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', padding: 0 }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Créneaux horaires</span>
                <button
                  onClick={() => setDraft(d => ({ ...d, timeSlots: [...(d.timeSlots || []), { id: 'ts_' + Date.now(), label: '', startTime: '', endTime: '', volunteersRequired: [] }] }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 6, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#6366f1', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}
                >
                  <Plus size={10} /> Ajouter
                </button>
              </div>

              {(draft?.timeSlots || []).map(slot => (
                <div key={slot.id} style={{ background: '#f8f9fa', borderRadius: 8, padding: '0.6rem', marginBottom: '0.5rem', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.3rem', alignItems: 'center' }}>
                    <input
                      value={slot.label}
                      onChange={e => updateSlot(slot.id, { label: e.target.value })}
                      placeholder="Nom du créneau"
                      style={{ flex: 1, padding: '0.3rem 0.4rem', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.75rem' }}
                    />
                    <button
                      onClick={() => setDraft(d => ({ ...d, timeSlots: d.timeSlots.filter(s => s.id !== slot.id) }))}
                      style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid #fecaca', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.375rem' }}>
                    <input type="time" value={slot.startTime} onChange={e => updateSlot(slot.id, { startTime: e.target.value })} style={{ flex: 1, padding: '0.3rem 0.4rem', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.75rem' }} />
                    <input type="time" value={slot.endTime} onChange={e => updateSlot(slot.id, { endTime: e.target.value })} style={{ flex: 1, padding: '0.3rem 0.4rem', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.75rem' }} />
                  </div>

                  {(slot.volunteersRequired || []).map((vr, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.2rem', alignItems: 'center' }}>
                      <Users size={11} color="#94a3b8" style={{ flexShrink: 0 }} />
                      <input
                        value={vr.role}
                        onChange={e => updateSlot(slot.id, { volunteersRequired: slot.volunteersRequired.map((x, j) => j === i ? { ...x, role: e.target.value } : x) })}
                        placeholder="Rôle"
                        style={{ flex: 1, padding: '0.25rem 0.3rem', borderRadius: 5, border: '1px solid var(--border)', fontSize: '0.72rem' }}
                      />
                      <input
                        type="number" min="1"
                        value={vr.count}
                        onChange={e => updateSlot(slot.id, { volunteersRequired: slot.volunteersRequired.map((x, j) => j === i ? { ...x, count: parseInt(e.target.value) || 1 } : x) })}
                        style={{ width: 38, padding: '0.25rem 0.3rem', borderRadius: 5, border: '1px solid var(--border)', fontSize: '0.72rem' }}
                      />
                      <button
                        onClick={() => updateSlot(slot.id, { volunteersRequired: slot.volunteersRequired.filter((_, j) => j !== i) })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', padding: 0 }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => updateSlot(slot.id, { volunteersRequired: [...(slot.volunteersRequired || []), { role: '', count: 1, assignedIds: [] }] })}
                    style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', marginTop: '0.15rem' }}
                  >
                    <Plus size={9} /> Bénévole
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.4rem' }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '0.52rem', borderRadius: 8, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
          Annuler
        </button>
        <button
          onClick={onSave}
          disabled={!canSave}
          style={{ flex: 2, padding: '0.52rem', borderRadius: 8, border: 'none', background: canSave ? '#6366f1' : '#c7d2fe', color: 'white', cursor: canSave ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.8rem' }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EventMapView() {
  const { data, updatePoleData } = useEvent();

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const elementsLayerRef = useRef(null);
  const drawLayerRef = useRef(null);
  const drawPolylineRef = useRef(null);
  const firstPointMarkerRef = useRef(null);
  const toolRef = useRef('hand');
  const drawPtsRef = useRef([]);
  const materialsRef = useRef([]);
  const triggerCloseZoneRef = useRef(null);
  const triggerAddParcoursPtRef = useRef(null);
  const triggerFinishParcoursRef = useRef(null);
  const triggerPlacePointRef = useRef(null);

  const [tool, setTool] = useState('hand');
  const [drawPts, setDrawPts] = useState([]);
  const [panelMode, setPanelMode] = useState('legend');
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [selectedVertexIdx, setSelectedVertexIdx] = useState(null);
  const selectedVertexIdxRef = useRef(null);
  useEffect(() => { selectedVertexIdxRef.current = selectedVertexIdx; }, [selectedVertexIdx]);
  const vertexMarkersRef = useRef([]);
  const editDraftRef = useRef(editDraft);
  useEffect(() => { editDraftRef.current = editDraft; }, [editDraft]);
  const setEditDraftRef = useRef(null);
  setEditDraftRef.current = (latlng) => setEditDraft(d => d ? { ...d, latlng } : d);
  const editLatlngsRef = useRef([]);

  // Draft system — unified elements array
  const [draftElements, setDraftElements] = useState(() => {
    const elems = data.poles.plan.elements;
    if (elems && elems.length > 0) return elems.map(el => ({ ...el }));
    // Fallback: migrate from old zones
    return (data.poles.plan.zones || []).map(z => ({ type: 'zone', ...z }));
  });
  const [undoStack, setUndoStack] = useState([]);

  const isDirty = useMemo(
    () => JSON.stringify(draftElements) !== JSON.stringify(data.poles.plan.elements || []),
    [draftElements, data.poles.plan.elements]
  );

  const materials = data.poles.logistics.materials || [];
  materialsRef.current = materials;

  // ── Draft helpers ──────────────────────────────────────────────────────────

  const mutateDraft = (mutFn) => {
    setUndoStack(s => [...s.slice(-19), draftElements]);
    setDraftElements(mutFn);
  };

  const handleUndo = () => {
    if (!undoStack.length) return;
    setDraftElements(undoStack[undoStack.length - 1]);
    setUndoStack(s => s.slice(0, -1));
  };

  const handleDiscard = () => {
    const elems = data.poles.plan.elements;
    setDraftElements(elems ? elems.map(el => ({ ...el })) : []);
    setUndoStack([]);
  };

  const handleSaveToContext = () => {
    updatePoleData('plan', 'elements', draftElements);
    setUndoStack([]);
  };

  // ── Camera helpers ─────────────────────────────────────────────────────────

  const fitAll = () => {
    const map = mapRef.current;
    if (!map) return;
    const pts = draftElements.flatMap(el => {
      if (el.type === 'zone' || el.type === 'parcours') return el.latlngs || [];
      if (el.type === 'point' && el.latlng) return [el.latlng];
      return [];
    });
    if (pts.length === 0) { map.setView(EVENT_CENTER, DEFAULT_ZOOM); return; }
    map.fitBounds(L.latLngBounds(pts).pad(0.1));
  };

  const fitElement = (el) => {
    const map = mapRef.current;
    if (!map) return;
    if (el.type === 'zone' && el.latlngs?.length >= 3) {
      map.fitBounds(L.polygon(el.latlngs).getBounds().pad(0.2));
    } else if (el.type === 'parcours' && el.latlngs?.length >= 2) {
      map.fitBounds(L.polyline(el.latlngs).getBounds().pad(0.3));
    } else if (el.type === 'point' && el.latlng) {
      map.setView(el.latlng, 18);
    }
  };

  // ── Map init (once) ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: EVENT_CENTER, zoom: DEFAULT_ZOOM, zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 20,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    elementsLayerRef.current = L.layerGroup().addTo(map);
    drawLayerRef.current = L.layerGroup().addTo(map);

    // Fix centering: invalidateSize then center on event location
    setTimeout(() => {
      map.invalidateSize(false);
      map.setView(EVENT_CENTER, DEFAULT_ZOOM);
    }, 80);

    // ── Click handler ──────────────────────────────────────────────────────
    map.on('click', (e) => {
      const t = toolRef.current;

      if (t === 'zone') {
        const { lat, lng } = e.latlng;
        const pts = drawPtsRef.current;

        // Close polygon on click near first point
        if (pts.length >= 3) {
          const fp = L.latLng(pts[0][0], pts[0][1]);
          const fpPx = map.latLngToContainerPoint(fp);
          const cPx = map.latLngToContainerPoint(e.latlng);
          if (Math.hypot(fpPx.x - cPx.x, fpPx.y - cPx.y) < 15) {
            triggerCloseZoneRef.current?.();
            return;
          }
        }

        const newPts = [...pts, [lat, lng]];
        drawPtsRef.current = newPts;
        setDrawPts([...newPts]);

        if (newPts.length === 1) {
          firstPointMarkerRef.current = L.circleMarker([lat, lng], {
            radius: 8, color: '#6366f1', fill: false, weight: 3,
          }).addTo(drawLayerRef.current);
        } else {
          L.circleMarker([lat, lng], {
            radius: 4, color: '#6366f1', fillColor: '#6366f1', fillOpacity: 1, weight: 2,
          }).addTo(drawLayerRef.current);
        }

        if (drawPolylineRef.current) drawLayerRef.current.removeLayer(drawPolylineRef.current);
        if (newPts.length > 1) {
          drawPolylineRef.current = L.polyline(newPts, {
            color: '#6366f1', dashArray: '6,4', weight: 2,
          }).addTo(drawLayerRef.current);
        }
      }

      if (t === 'parcours') {
        const { lat, lng } = e.latlng;
        triggerAddParcoursPtRef.current?.({ lat, lng });
      }

      if (t === 'point') {
        triggerPlacePointRef.current?.(e.latlng);
      }
    });

    // ── Dblclick handler (finish parcours) ─────────────────────────────────
    map.on('dblclick', () => {
      if (toolRef.current === 'parcours') {
        triggerFinishParcoursRef.current?.();
      }
    });

    mapRef.current = map;

    const onKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        const t = toolRef.current;
        if (t !== 'hand') {
          map.dragging.enable();
          map.getContainer().style.cursor = 'grab';
        }
      }
    };
    const onKeyUp = (e) => {
      if (e.code === 'Space') {
        const t = toolRef.current;
        if (t === 'zone' || t === 'parcours') {
          map.dragging.disable();
          map.getContainer().style.cursor = 'crosshair';
        } else if (t === 'point') {
          map.getContainer().style.cursor = 'crosshair';
        } else {
          map.getContainer().style.cursor = '';
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Trigger refs — reassigned each render for fresh state ─────────────────

  triggerCloseZoneRef.current = () => {
    const pts = drawPtsRef.current;
    if (pts.length < 3) return;
    setEditDraft({
      id: null, type: 'zone', name: '', description: '', place: '', parentId: null,
      color: '#6366f1', icon: '📍',
      latlngs: [...pts], materialsRequired: [], timeSlots: [],
    });
    clearDraw();
    setTool('hand');
    setPanelMode('edit');
  };

  triggerAddParcoursPtRef.current = ({ lat, lng }) => {
    const pts = drawPtsRef.current;
    const newPts = [...pts, [lat, lng]];
    drawPtsRef.current = newPts;
    setDrawPts([...newPts]);

    L.circleMarker([lat, lng], {
      radius: 4, color: '#10b981', fillColor: '#10b981', fillOpacity: 1, weight: 2,
    }).addTo(drawLayerRef.current);

    if (drawPolylineRef.current) drawLayerRef.current.removeLayer(drawPolylineRef.current);
    if (newPts.length > 1) {
      drawPolylineRef.current = L.polyline(newPts, {
        color: '#10b981', dashArray: '8,6', weight: 3,
      }).addTo(drawLayerRef.current);
    }
  };

  triggerFinishParcoursRef.current = () => {
    const pts = drawPtsRef.current;
    // Remove last point — it was added by the second click of dblclick
    const finalPts = pts.slice(0, -1);
    if (finalPts.length < 2) {
      clearDraw();
      return;
    }
    setEditDraft({
      id: null, type: 'parcours', name: '', description: '',
      color: '#10b981',
      latlngs: [...finalPts],
    });
    clearDraw();
    setTool('hand');
    setPanelMode('edit');
  };

  triggerPlacePointRef.current = ({ lat, lng }) => {
    setEditDraft({
      id: null, type: 'point', name: '', description: '', place: '', parentId: null,
      color: '#f97316', icon: '📍',
      latlng: [lat, lng], materialsRequired: [], timeSlots: [],
    });
    setTool('hand');
    setPanelMode('edit');
  };

  // ── Tool sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    toolRef.current = tool;
    const map = mapRef.current;
    if (!map) return;
    if (tool === 'zone' || tool === 'parcours') {
      map.dragging.disable();
      map.doubleClickZoom.disable();
      map.getContainer().style.cursor = 'crosshair';
    } else if (tool === 'point') {
      map.dragging.enable();
      map.doubleClickZoom.disable();
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.getContainer().style.cursor = '';
    }
  }, [tool]);

  // ── Render elements layer ──────────────────────────────────────────────────
  useEffect(() => {
    const layer = elementsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    draftElements.forEach(el => {
      // Skip zone/parcours being edited — shown as draggable vertices in draw layer
      if (editDraft?.id && el.id === editDraft.id) return;
      const isSelected = el.id === selectedElementId;
      const onClick = () => {
        setSelectedElementId(el.id);
        setPanelMode('view');
        fitElement(el);
      };

      if (el.type === 'zone') {
        if (!el.latlngs || el.latlngs.length < 3) return;

        const volAlert = (el.timeSlots || []).some(s =>
          (s.volunteersRequired || []).some(vr => (vr.assignedIds || []).length < vr.count)
        );
        const matAlert = (el.materialsRequired || []).some(mr => {
          const mat = materialsRef.current.find(m => m.id === mr.materialId);
          return !mat || (mat.status !== 'acquired' && mat.status !== 'done');
        });
        const hasAlert = volAlert || matAlert;

        const polygon = L.polygon(el.latlngs, {
          color: el.color || '#6366f1',
          fillColor: el.color || '#6366f1',
          fillOpacity: isSelected ? 0.35 : 0.18,
          weight: isSelected ? 3 : 2,
        });

        const center = polygon.getBounds().getCenter();
        const alertBadge = hasAlert
          ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;background:#f97316;border-radius:50%;font-size:8px;color:white;font-weight:900;margin-left:3px;flex-shrink:0">!</span>`
          : '';
        const labelHtml = `<div style="background:${el.color || '#6366f1'};color:white;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);display:inline-flex;align-items:center;gap:3px;pointer-events:none">${el.icon || '📍'} ${el.name}${alertBadge}</div>`;
        const labelMarker = L.marker(center, {
          icon: L.divIcon({ html: labelHtml, className: '', iconAnchor: [0, 10] }),
        });

        polygon.on('click', onClick);
        labelMarker.on('click', onClick);
        polygon.addTo(layer);
        labelMarker.addTo(layer);

      } else if (el.type === 'parcours') {
        if (!el.latlngs || el.latlngs.length < 2) return;

        const polyline = L.polyline(el.latlngs, {
          color: el.color || '#10b981',
          dashArray: '8,6',
          weight: isSelected ? 4 : 3,
          opacity: isSelected ? 1 : 0.85,
        });

        const midIdx = Math.floor(el.latlngs.length / 2);
        const mid = el.latlngs[midIdx];
        const dist = calcDistance(el.latlngs);
        const labelHtml = `<div style="background:${el.color || '#10b981'};color:white;padding:2px 7px;border-radius:8px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);display:inline-flex;align-items:center;gap:4px;pointer-events:none">${el.name} · ${dist}</div>`;
        const labelMarker = L.marker(mid, {
          icon: L.divIcon({ html: labelHtml, className: '', iconAnchor: [0, 12] }),
        });

        polyline.on('click', onClick);
        labelMarker.on('click', onClick);
        polyline.addTo(layer);
        labelMarker.addTo(layer);

      } else if (el.type === 'point') {
        if (!el.latlng) return;
        const isEditing = editDraftRef.current?.id === el.id;
        const scale = isSelected ? 'transform:scale(1.25);' : '';
        const iconHtml = `<div style="width:30px;height:30px;border-radius:50%;background:${el.color || '#f97316'};display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,0.28);border:${isEditing ? '3px dashed white' : '2px solid white'};${scale}">${el.icon || '📍'}</div>`;
        const marker = L.marker(el.latlng, {
          icon: L.divIcon({ html: iconHtml, className: '', iconAnchor: [15, 15] }),
          draggable: isEditing,
        });
        if (isEditing) {
          marker.on('dragend', (ev) => {
            const { lat, lng } = ev.target.getLatLng();
            setEditDraftRef.current?.([lat, lng]);
          });
        }
        marker.on('click', onClick);
        marker.addTo(layer);
      }
    });
  }, [draftElements, selectedElementId, editDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Vertex editing overlay (zone / parcours) ────────────────────────────────
  useEffect(() => {
    const drawLayer = drawLayerRef.current;
    if (!drawLayer) return;
    drawLayer.clearLayers();
    vertexMarkersRef.current = [];
    setSelectedVertexIdx(null);
    selectedVertexIdxRef.current = null;

    if (panelMode !== 'edit' || !editDraft?.latlngs || editDraft.latlngs.length < 2) return;

    const color = editDraft.color || (editDraft.type === 'parcours' ? '#10b981' : '#6366f1');
    editLatlngsRef.current = editDraft.latlngs.map(pt => Array.isArray(pt) ? [...pt] : [pt.lat, pt.lng]);

    const makeIcon = (selected) => L.divIcon({
      html: `<div style="width:13px;height:13px;border-radius:50%;background:${selected ? color : 'white'};border:2.5px solid ${color};box-shadow:0 1px 5px rgba(0,0,0,0.35);cursor:pointer;transition:background 0.15s"></div>`,
      className: '', iconAnchor: [6, 6],
    });

    let previewShape = null;
    if (editDraft.type === 'zone' && editLatlngsRef.current.length >= 3) {
      previewShape = L.polygon(editLatlngsRef.current.map(p => [...p]), {
        color, fillColor: color, fillOpacity: 0.2, weight: 2,
      }).addTo(drawLayer);
    } else if (editDraft.type === 'parcours') {
      previewShape = L.polyline(editLatlngsRef.current.map(p => [...p]), {
        color, weight: 3, dashArray: '8,6',
      }).addTo(drawLayer);
    }

    editLatlngsRef.current.forEach((pt, idx) => {
      const m = L.marker(pt, {
        icon: makeIcon(false),
        draggable: true,
        zIndexOffset: 1000,
      });

      let dragging = false;
      m.on('dragstart', () => { dragging = true; });
      m.on('drag', ev => {
        const { lat, lng } = ev.target.getLatLng();
        editLatlngsRef.current = editLatlngsRef.current.map((p, i) => i === idx ? [lat, lng] : p);
        if (previewShape) previewShape.setLatLngs(editLatlngsRef.current);
      });
      m.on('dragend', () => {
        dragging = false;
        setEditDraft(d => d ? { ...d, latlngs: [...editLatlngsRef.current] } : d);
      });
      m.on('click', ev => {
        if (dragging) return;
        L.DomEvent.stopPropagation(ev);
        // Deselect previous
        const prev = selectedVertexIdxRef.current;
        if (prev !== null && vertexMarkersRef.current[prev]) {
          vertexMarkersRef.current[prev].setIcon(makeIcon(false));
        }
        // Select this vertex
        selectedVertexIdxRef.current = idx;
        setSelectedVertexIdx(idx);
        m.setIcon(makeIcon(true));
      });

      vertexMarkersRef.current.push(m);
      m.addTo(drawLayer);
    });
  }, [panelMode, editDraft?.id, editDraft?.latlngs?.length, editDraft?.color]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Draw helpers ───────────────────────────────────────────────────────────
  const clearDraw = () => {
    drawPtsRef.current = [];
    setDrawPts([]);
    drawPolylineRef.current = null;
    firstPointMarkerRef.current = null;
    if (drawLayerRef.current) drawLayerRef.current.clearLayers();
  };

  // ── Element CRUD ───────────────────────────────────────────────────────────
  const handleSaveElement = () => {
    if (!editDraft?.name?.trim()) return;
    const isNew = !editDraft.id;
    const finalId = isNew ? `${editDraft.type}_${Date.now()}` : editDraft.id;
    mutateDraft(prev =>
      isNew
        ? [...prev, { ...editDraft, id: finalId }]
        : prev.map(el => el.id === editDraft.id ? { ...el, ...editDraft } : el)
    );
    setSelectedElementId(finalId);
    setEditDraft(null);
    setPanelMode('view');
  };

  const handleCancelEdit = () => {
    const isNew = !editDraft?.id;
    if (isNew) clearDraw();
    setEditDraft(null);
    setPanelMode(selectedElementId && !isNew ? 'view' : 'legend');
  };

  const handleDeleteElement = (elId) => {
    const el = draftElements.find(e => e.id === elId);
    const tl = el?.type === 'zone' ? 'zone' : el?.type === 'parcours' ? 'parcours' : 'point';
    if (!window.confirm(`Supprimer ce ${tl} ?`)) return;
    mutateDraft(prev => prev.filter(e => e.id !== elId));
    setSelectedElementId(null);
    setPanelMode('legend');
  };

  const handleLegendClick = (el) => {
    setSelectedElementId(el.id);
    setPanelMode('view');
    fitElement(el);
  };

  const activeElement = draftElements.find(el => el.id === selectedElementId) || null;

  // ── Delete key — remove selected vertex (edit mode) or element (view mode) ──
  const deleteSelectedRef = useRef(null);
  deleteSelectedRef.current = () => {
    const vidx = selectedVertexIdxRef.current;
    // In edit mode with a vertex selected → remove that vertex
    if (panelMode === 'edit' && vidx !== null && editDraft?.latlngs) {
      const minPts = editDraft.type === 'zone' ? 3 : 2;
      if (editDraft.latlngs.length <= minPts) return; // can't go below minimum
      const newLatlngs = editDraft.latlngs.filter((_, i) => i !== vidx);
      editLatlngsRef.current = newLatlngs;
      setSelectedVertexIdx(null);
      selectedVertexIdxRef.current = null;
      setEditDraft(d => d ? { ...d, latlngs: newLatlngs } : d);
    } else if (selectedElementId && panelMode !== 'edit') {
      // View mode → remove the whole element
      handleDeleteElement(selectedElementId);
    }
  };
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag) || document.activeElement?.isContentEditable) return;
      e.preventDefault();
      deleteSelectedRef.current?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hint message ───────────────────────────────────────────────────────────
  const getHint = () => {
    if (tool === 'zone') {
      if (drawPts.length === 0) return 'Cliquez pour poser le premier point';
      if (drawPts.length < 3) return `${drawPts.length} point${drawPts.length > 1 ? 's' : ''} — continuez`;
      return `${drawPts.length} points — cliquez sur ⊙ pour fermer la zone`;
    }
    if (tool === 'parcours') {
      if (drawPts.length === 0) return 'Cliquez pour démarrer le parcours';
      if (drawPts.length === 1) return '1 point — continuez à cliquer';
      return `${drawPts.length} points (${calcDistance(drawPts)}) — double-cliquez pour terminer`;
    }
    if (tool === 'point') return 'Cliquez sur la carte pour placer un point';
    return null;
  };

  const hint = getHint();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px - 6rem)', gap: '0.875rem' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Plan de l'événement</h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {data.event.name} · {data.event.location} · {draftElements.length} élément{draftElements.length !== 1 ? 's' : ''}
            {isDirty && <span style={{ color: '#f97316', marginLeft: 6 }}>● Non enregistré</span>}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {undoStack.length > 0 && (
            <button
              onClick={handleUndo}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              <Undo2 size={13} /> Annuler
            </button>
          )}
          {isDirty && (
            <>
              <button onClick={handleDiscard} style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                Ignorer
              </button>
              <button
                onClick={handleSaveToContext}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.4rem 0.875rem', borderRadius: 8, border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
              >
                <Save size={13} /> Enregistrer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Map + right panel */}
      <div style={{ flex: 1, display: 'flex', gap: '1rem', minHeight: 0 }}>

        {/* Map card */}
        <div style={{ flex: 1, minWidth: 0, position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
          <div ref={mapContainerRef} style={{ flex: 1, minHeight: 0 }} />

          {/* Toolbar */}
          <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <ToolBtn active={tool === 'hand'} onClick={() => { setTool('hand'); clearDraw(); }} title="Navigation (main)">
              <Hand size={15} />
            </ToolBtn>
            <ToolBtn active={tool === 'zone'} onClick={() => { setTool('zone'); clearDraw(); }} title="Dessiner une zone (polygone)">
              <Pencil size={15} />
            </ToolBtn>
            <ToolBtn active={tool === 'parcours'} onClick={() => { setTool('parcours'); clearDraw(); }} title="Tracer un parcours (double-clic pour finir)">
              <Navigation size={15} />
            </ToolBtn>
            <ToolBtn active={tool === 'point'} onClick={() => { setTool('point'); clearDraw(); }} title="Ajouter un point">
              <MapPin size={15} />
            </ToolBtn>
            {tool !== 'hand' && (
              <div style={{ marginTop: 4, background: 'rgba(255,255,255,0.92)', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 7px', fontSize: '0.65rem', color: '#374151', fontWeight: 600, whiteSpace: 'nowrap', boxShadow: 'var(--shadow-sm)', lineHeight: 1.3 }}>
                Espace pour<br />déplacer la carte
              </div>
            )}
          </div>

          {/* Center button */}
          <div style={{ position: 'absolute', top: '0.75rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
            <button
              onClick={fitAll}
              style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '0.35rem 0.75rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', whiteSpace: 'nowrap' }}
            >
              <RotateCcw size={12} /> Centrer sur l'événement
            </button>
          </div>

          {/* Draw hint */}
          {hint && panelMode !== 'edit' && (
            <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '0.4rem 0.875rem', fontSize: '0.77rem', color: '#374151', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: '0.625rem', whiteSpace: 'nowrap' }}>
              {hint}
              {drawPts.length > 0 && (
                <button
                  onClick={clearDraw}
                  style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.77rem', padding: 0 }}
                >
                  Annuler
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', background: 'white', overflow: 'hidden' }}>
          {(panelMode === 'legend' || (panelMode === 'view' && !activeElement)) && (
            <LegendPanel
              allElements={draftElements}
              onElementClick={handleLegendClick}
              activeElementId={selectedElementId}
              materials={materials}
            />
          )}
          {panelMode === 'view' && activeElement && (
            <ViewPanel
              element={activeElement}
              allElements={draftElements}
              materials={materials}
              onEdit={() => { setEditDraft({ ...activeElement }); setPanelMode('edit'); }}
              onDelete={() => handleDeleteElement(activeElement.id)}
              onBack={() => setPanelMode('legend')}
            />
          )}
          {panelMode === 'edit' && editDraft && (
            <EditPanel
              draft={editDraft}
              setDraft={setEditDraft}
              onSave={handleSaveElement}
              onCancel={handleCancelEdit}
              materials={materials}
              allElements={draftElements}
            />
          )}
        </div>
      </div>
    </div>
  );
}
