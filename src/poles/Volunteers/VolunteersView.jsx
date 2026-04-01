import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEvent, POLES } from '../../context/EventContext';
import {
  Users, Plus, Trash2, Edit2, Mail, Phone, Upload,
  Brain, Calendar, ChevronRight, ChevronDown, X, Check,
  Clock, AlertTriangle, Star,
} from 'lucide-react';
import Modal from '../../components/shared/Modal';
import ConfirmModal from '../../components/shared/ConfirmModal';
import { useToast } from '../../components/shared/Toast';

/* ── Constants ─────────────────────────────────────────────── */
const HOUR_START  = 8;
const HOUR_END    = 24;
const HOUR_COUNT  = HOUR_END - HOUR_START;
const HOUR_W      = 80;            // px per hour
const ROW_H       = 52;
const LEFT_W      = 180;           // label column width

const SHIFT_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#0ea5e9','#f97316','#6366f1'];

const inputStyle = {
  width: '100%', padding: '0.5rem 0.75rem',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
  fontSize: '0.85rem', background: 'var(--bg-input)', color: 'var(--text-main)',
  outline: 'none', fontFamily: 'var(--font-main)',
};
const lbl = { fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' };

/* ── Utils ─────────────────────────────────────────────────── */
function timeToX(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h - HOUR_START + m / 60) * HOUR_W;
}
function xToTime(x) {
  const totalH = x / HOUR_W + HOUR_START;
  const h = Math.max(HOUR_START, Math.min(HOUR_END - 0.5, totalH));
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) / 0.5) * 30;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
function shiftDuration(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}
function isOverlapping(a, b) {
  if (a.date !== b.date) return false;
  return timeToX(a.startTime) < timeToX(b.endTime) && timeToX(a.endTime) > timeToX(b.startTime);
}
function volunteerAvailable(v, shift) {
  const slots = v.availabilitySlots || [];
  if (slots.length === 0) return true; // assume available if no slots set
  return slots.some(s => {
    if (s.date !== shift.date) return false;
    const sStart = timeToX(s.startTime || '00:00');
    const sEnd   = timeToX(s.endTime   || '23:59');
    const shStart = timeToX(shift.startTime);
    const shEnd   = timeToX(shift.endTime);
    return sStart <= shStart && sEnd >= shEnd;
  });
}

/* ── Avatar ────────────────────────────────────────────────── */
function Avatar({ v, size = 24, overlap = false }) {
  const initials = v ? ((v.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()) : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: v?.photo ? 'transparent' : 'var(--primary)',
      border: '2px solid white',
      marginLeft: overlap ? -8 : 0,
      overflow: 'hidden', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 800, color: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }}>
      {v?.photo
        ? <img src={v.photo} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials}
    </div>
  );
}

/* ── Shift Bar ─────────────────────────────────────────────── */
function ShiftBar({ shift, volunteers, onEdit, onResize }) {
  const x  = timeToX(shift.startTime);
  const x2 = timeToX(shift.endTime);
  const w  = Math.max(20, x2 - x);
  const c  = shift.color || '#3b82f6';
  const assigned = (shift.assignedIds || []).map(id => volunteers.find(v => v.id === id)).filter(Boolean);
  const resizeRef = useRef(false);

  const handleResizeStart = (e) => {
    e.stopPropagation();
    resizeRef.current = true;
    const startX = e.clientX;
    const startEnd = timeToX(shift.endTime);

    const onMove = (ev) => {
      if (!resizeRef.current) return;
      const newX = startEnd + (ev.clientX - startX);
      const newEnd = xToTime(Math.max(newX, x + 20));
      onResize(shift.id, newEnd);
    };
    const onUp = () => { resizeRef.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      onClick={() => onEdit(shift)}
      style={{
        position: 'absolute', left: x, width: w, top: 5, bottom: 5,
        background: c + '22', border: `1.5px solid ${c}`,
        borderRadius: 6, display: 'flex', alignItems: 'center',
        paddingLeft: 7, overflow: 'hidden', cursor: 'pointer',
        zIndex: 2, transition: 'box-shadow 0.1s',
        userSelect: 'none',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 2px ${c}44`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Title */}
      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: c, whiteSpace: 'nowrap', overflow: 'hidden', flex: 1, paddingRight: 4 }}>
        {shift.title}
      </span>
      {/* Avatars */}
      {assigned.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'row', marginRight: 10, flexShrink: 0 }}>
          {assigned.slice(0, 3).map((v, i) => <Avatar key={v.id} v={v} size={20} overlap={i > 0} />)}
          {assigned.length > 3 && (
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--text-subtle)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, marginLeft: -8, border: '2px solid white' }}>
              +{assigned.length - 3}
            </div>
          )}
        </div>
      )}
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        onClick={e => e.stopPropagation()}
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 8, cursor: 'col-resize', background: `${c}40`, borderRadius: '0 4px 4px 0' }}
      />
    </div>
  );
}

/* ── Timeline ──────────────────────────────────────────────── */
function Timeline({ groupKey, groups, shifts, volunteers, onAdd, onEdit, onResize }) {
  const hours = Array.from({ length: HOUR_COUNT }, (_, i) => HOUR_START + i);

  const handleRowClick = (e, groupId, date) => {
    if (e.target !== e.currentTarget) return; // ignore clicks on shift bars
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const start = xToTime(x);
    const [hh, mm] = start.split(':').map(Number);
    const endH = hh + 1 >= HOUR_END ? hh : hh + 1;
    const end = `${String(endH).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    onAdd({ groupKey, groupId, date, startTime: start, endTime: end });
  };

  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ minWidth: LEFT_W + HOUR_COUNT * HOUR_W }}>

        {/* Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', height: 32, position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ width: LEFT_W, minWidth: LEFT_W, borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', position: 'sticky', left: 0, background: 'var(--bg-elevated)', zIndex: 11 }}>
            {groupKey === 'volunteer' ? 'BÉNÉVOLE' : groupKey === 'location' ? 'LIEU' : 'ANIMATION'}
          </div>
          {hours.map(h => (
            <div key={h} style={{ width: HOUR_W, minWidth: HOUR_W, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Rows */}
        {groups.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Aucun élément. {groupKey === 'volunteer' ? 'Ajoutez des bénévoles.' : groupKey === 'location' ? 'Les créneaux avec un lieu apparaîtront ici.' : 'Les créneaux liés à une animation apparaîtront ici.'}
          </div>
        ) : groups.map(group => {
          const rowShifts = shifts.filter(s => {
            if (groupKey === 'volunteer') return (s.assignedIds || []).includes(group.id);
            if (groupKey === 'location')  return s.location === group.id;
            if (groupKey === 'animation') return s.animationId === group.id;
            return false;
          });

          return (
            <div key={group.id} style={{ display: 'flex', height: ROW_H, borderBottom: '1px solid var(--border)' }}>
              {/* Label */}
              <div style={{ width: LEFT_W, minWidth: LEFT_W, borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 4 }}>
                {groupKey === 'volunteer' && group.volunteer && (
                  <Avatar v={group.volunteer} size={26} />
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.label}</p>
                  {group.sub && <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.sub}</p>}
                </div>
              </div>

              {/* Timeline track */}
              <div
                style={{ flex: 1, position: 'relative', cursor: 'crosshair', background: 'var(--bg-card)' }}
                onClick={e => handleRowClick(e, group.id, group.date || new Date().toISOString().split('T')[0])}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
              >
                {/* Grid lines */}
                {hours.map((h, i) => (
                  <div key={h} style={{ position: 'absolute', left: i * HOUR_W, top: 0, bottom: 0, width: 1, background: 'var(--border)', pointerEvents: 'none' }} />
                ))}
                {/* Half-hour lines */}
                {hours.map((h, i) => (
                  <div key={`${h}.5`} style={{ position: 'absolute', left: i * HOUR_W + HOUR_W / 2, top: 0, bottom: 0, width: 1, background: 'var(--border)', opacity: 0.4, pointerEvents: 'none' }} />
                ))}
                {/* Shifts */}
                {rowShifts.map(s => (
                  <ShiftBar key={s.id} shift={s} volunteers={volunteers} onEdit={onEdit} onResize={onResize} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Shift Modal ───────────────────────────────────────────── */
function ShiftModal({ isOpen, onClose, onSave, onDelete, initial, volunteers, allPoles, animations, concerts }) {
  const EMPTY = { title: '', date: '', startTime: '10:00', endTime: '12:00', pole: '', location: '', animationId: '', concertId: '', requiredCount: 2, assignedIds: [], color: SHIFT_COLORS[0] };
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (isOpen) setForm(initial ? { ...EMPTY, ...initial } : EMPTY);
  }, [isOpen, initial]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleVol = (id) => set('assignedIds', form.assignedIds.includes(id) ? form.assignedIds.filter(x => x !== id) : [...form.assignedIds, id]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial?.id ? 'Modifier le créneau' : 'Nouveau créneau'} maxWidth="520px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {initial?.id && <button className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => onDelete(initial.id)}><Trash2 size={13} /> Supprimer</button>}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button className="btn-secondary" onClick={onClose}>Annuler</button>
            <button className="btn-primary" onClick={() => onSave(form)}><Check size={13} /> Sauvegarder</button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={lbl}>TITRE *</label>
          <input style={inputStyle} autoFocus value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Service buvette soir" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={lbl}>DATE</label>
            <input style={inputStyle} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={lbl}>DÉBUT</label>
            <input style={inputStyle} type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={lbl}>FIN</label>
            <input style={inputStyle} type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={lbl}>PÔLE</label>
            <select style={inputStyle} value={form.pole} onChange={e => set('pole', e.target.value)}>
              <option value="">— Aucun —</option>
              {allPoles.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={lbl}>LIEU</label>
            <input style={inputStyle} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Ex: Buvette Nord" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={lbl}>ANIMATION LIÉE</label>
            <select style={inputStyle} value={form.animationId} onChange={e => set('animationId', e.target.value)}>
              <option value="">— Aucune —</option>
              {animations.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={lbl}>CONCERT LIÉ</label>
            <select style={inputStyle} value={form.concertId} onChange={e => set('concertId', e.target.value)}>
              <option value="">— Aucun —</option>
              {concerts.map(c => <option key={c.id} value={c.id}>{c.artist || c.title || c.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={lbl}>BÉNÉVOLES REQUIS</label>
            <input style={inputStyle} type="number" min={1} value={form.requiredCount} onChange={e => set('requiredCount', parseInt(e.target.value) || 1)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={lbl}>COULEUR</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {SHIFT_COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: form.color === c ? `3px solid var(--text-main)` : '2px solid transparent', cursor: 'pointer', flexShrink: 0 }} />
              ))}
            </div>
          </div>
        </div>

        {/* Assign volunteers */}
        <div>
          <label style={{ ...lbl, display: 'block', marginBottom: 6 }}>BÉNÉVOLES ASSIGNÉS ({form.assignedIds.length}/{form.requiredCount})</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
            {volunteers.map(v => {
              const checked = form.assignedIds.includes(v.id);
              const conflict = !checked && form.date && form.startTime && form.endTime
                ? !volunteerAvailable(v, form)
                : false;
              return (
                <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: checked ? 'var(--primary-soft)' : 'transparent' }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleVol(v.id)} style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} />
                  <Avatar v={v} size={22} />
                  <span style={{ fontSize: '0.78rem', flex: 1, color: 'var(--text-main)' }}>{v.name}</span>
                  {conflict && <span style={{ fontSize: '0.65rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 3 }}><AlertTriangle size={11} />Indispo</span>}
                  {checked && <span style={{ fontSize: '0.65rem', color: 'var(--success)' }}>✓</span>}
                </label>
              );
            })}
            {volunteers.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aucun bénévole dans la liste.</p>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ── Grouped Shift List (par lieu / par animation) ────────── */
function GroupedShiftList({ shifts, volunteers, groupByKey, groupLabel, animations = [], onEdit, onAdd }) {
  const [expanded, setExpanded] = useState({});

  // Build groups
  const byGroup = {};
  shifts.forEach(s => {
    const key = s[groupByKey] || `Sans ${groupLabel}`;
    if (!byGroup[key]) byGroup[key] = [];
    byGroup[key].push(s);
  });

  // For animationId: map id → name
  const animMap = Object.fromEntries(animations.map(a => [a.id, a.name]));
  const getGroupLabel = (key) => groupByKey === 'animationId' ? (animMap[key] || key) : key;

  const groups = Object.keys(byGroup).sort();
  const isOpen = (g) => expanded[g] !== false;

  if (groups.length === 0) return (
    <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      Aucun créneau défini.{' '}
      <button onClick={onAdd} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}>+ Créer un créneau</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {groups.map(group => {
        const items = byGroup[group];
        const open  = isOpen(group);
        return (
          <div key={group} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-card)' }}>
            {/* Group header */}
            <div
              onClick={() => setExpanded(e => ({ ...e, [group]: !open }))}
              style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: 'var(--bg-elevated)', borderBottom: open ? '1px solid var(--border)' : 'none', userSelect: 'none' }}
            >
              {open ? <ChevronDown size={13} color="var(--text-muted)" /> : <ChevronRight size={13} color="var(--text-muted)" />}
              <span style={{ fontSize: '0.82rem', fontWeight: 700, flex: 1 }}>{getGroupLabel(group)}</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '1px 7px', borderRadius: 99 }}>
                {items.length} créneau{items.length > 1 ? 'x' : ''}
              </span>
              {/* Total required vs assigned */}
              {(() => {
                const req = items.reduce((s, i) => s + (i.requiredCount || 0), 0);
                const asgn = items.reduce((s, i) => s + (i.assignedIds || []).length, 0);
                return req > 0 ? (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: asgn >= req ? 'var(--success)' : 'var(--danger)' }}>
                    {asgn}/{req}
                  </span>
                ) : null;
              })()}
            </div>

            {/* Shifts list */}
            {open && (
              <div>
                {items.map((shift, i) => {
                  const assigned = (shift.assignedIds || []).map(id => volunteers.find(v => v.id === id)).filter(Boolean);
                  const needed   = (shift.requiredCount || 0) - assigned.length;
                  return (
                    <div
                      key={shift.id}
                      onClick={() => onEdit(shift)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.625rem 1rem', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', background: 'var(--bg-card)', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: shift.color || 'var(--primary)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{shift.title}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {shift.date && `${shift.date} · `}{shift.startTime}–{shift.endTime}
                          {shift.pole && ` · ${shift.pole}`}
                        </p>
                      </div>
                      {/* Avatars */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {assigned.length > 0 && (
                          <div style={{ display: 'flex' }}>
                            {assigned.slice(0, 4).map((v, idx) => <Avatar key={v.id} v={v} size={22} overlap={idx > 0} />)}
                          </div>
                        )}
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: needed > 0 ? 'var(--danger)' : 'var(--success)', marginLeft: 6 }}>
                          {assigned.length}/{shift.requiredCount || 0}
                        </span>
                      </div>
                      <Edit2 size={12} color="var(--text-subtle)" />
                    </div>
                  );
                })}
                <button
                  onClick={(e) => { e.stopPropagation(); onAdd(); }}
                  style={{ width: '100%', padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: 'var(--font-main)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Plus size={12} /> Ajouter un créneau
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════ */
export default function VolunteersView() {
  const { data, addItem, updateItem, deleteItem } = useEvent();
  const toast = useToast();

  const { list }     = data.poles.volunteers;
  const shifts       = data.poles.volunteers.shifts || [];
  const orgMembers   = data.association?.members    || [];
  const customPoles  = data.association?.customPoles || [];
  const allPoles     = [...POLES, ...customPoles.map(p => p.name)];
  const animations   = data.poles.programming?.animations || [];
  const concerts     = data.poles.programming?.concerts   || [];

  const isVolunteer = data.user?.role === 'volunteer';

  const [activeTab,  setActiveTab]  = useState('list');
  const [planView,   setPlanView]   = useState('location');
  const [isVolModal, setIsVolModal] = useState(false);
  const [editingVol, setEditingVol] = useState(null);
  const [toDelete,   setToDelete]   = useState(null);
  const [shiftModal, setShiftModal] = useState({ open: false, initial: null });

  const EMPTY_VOL = { name: '', firstName: '', lastName: '', email: '', phone: '', photo: null, inspiredPoles: [], availabilitySlots: [], notes: '', status: 'confirmed' };
  const [volForm, setVolForm] = useState(EMPTY_VOL);
  const photoRef = useRef();

  const setV = (k, v) => setVolForm(f => ({ ...f, [k]: v }));

  const openAddVol  = () => { setEditingVol(null); setVolForm(EMPTY_VOL); setIsVolModal(true); };
  const openEditVol = (v) => {
    setEditingVol(v);
    setVolForm({ ...EMPTY_VOL, ...v });
    setIsVolModal(true);
  };

  const handleSaveVol = (e) => {
    e.preventDefault();
    const entry = { ...volForm, name: [volForm.firstName, volForm.lastName].filter(Boolean).join(' ') || volForm.name };
    if (editingVol) { updateItem('volunteers', 'list', editingVol.id, entry); toast.success('Bénévole mis à jour'); }
    else            { addItem('volunteers', 'list', entry); toast.success('Bénévole ajouté'); }
    setIsVolModal(false);
  };

  const handleDeleteVol = () => {
    deleteItem('volunteers', 'list', toDelete.id);
    toast.success('Bénévole supprimé');
    setToDelete(null);
  };

  const togglePole = (pole) => setV('inspiredPoles', volForm.inspiredPoles.includes(pole) ? volForm.inspiredPoles.filter(p => p !== pole) : [...volForm.inspiredPoles, pole]);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setV('photo', ev.target.result);
    reader.readAsDataURL(file);
  };

  /* ── Shifts ── */
  const openShiftModal = (initial) => setShiftModal({ open: true, initial });

  const handleSaveShift = (form) => {
    if (!form.title.trim()) { toast.error('Un titre est requis'); return; }
    if (form.id) { updateItem('volunteers', 'shifts', form.id, form); toast.success('Créneau mis à jour'); }
    else         { addItem('volunteers', 'shifts', form); toast.success('Créneau ajouté'); }
    setShiftModal({ open: false, initial: null });
  };

  const handleDeleteShift = (id) => {
    deleteItem('volunteers', 'shifts', id);
    toast.success('Créneau supprimé');
    setShiftModal({ open: false, initial: null });
  };

  const handleResizeShift = (id, newEnd) => {
    updateItem('volunteers', 'shifts', id, { endTime: newEnd });
  };

  const handleTimelineAdd = ({ groupKey, groupId, date, startTime, endTime }) => {
    const initial = { startTime, endTime, date };
    if (groupKey === 'volunteer') initial.assignedIds = [groupId];
    if (groupKey === 'location')  initial.location    = groupId;
    if (groupKey === 'animation') initial.animationId = groupId;
    openShiftModal(initial);
  };

  /* ── Timeline groups ── */
  const volGroups = list.map(v => ({
    id: v.id,
    label: v.name,
    sub: (v.inspiredPoles || []).slice(0, 2).join(', '),
    volunteer: v,
    date: new Date().toISOString().split('T')[0],
  }));

  const locationSet = [...new Set(shifts.map(s => s.location).filter(Boolean))];
  const locGroups = locationSet.map(loc => ({ id: loc, label: loc, date: new Date().toISOString().split('T')[0] }));

  const animGroups = animations.map(a => ({ id: a.id, label: a.name, sub: `${a.startTime}–${a.endTime}`, date: a.date }));

  /* ── Intelligence ── */
  const totalRequired = shifts.reduce((sum, s) => sum + (s.requiredCount || 0), 0);
  const totalAssigned = shifts.reduce((sum, s) => sum + (s.assignedIds || []).length, 0);
  const gap           = totalRequired - totalAssigned;

  const getSuggestions = (shift) => {
    const alreadyAssigned = new Set(shift.assignedIds || []);
    const conflicting = new Set();
    shifts.forEach(s => {
      if (s.id !== shift.id && isOverlapping(s, shift)) {
        (s.assignedIds || []).forEach(id => conflicting.add(id));
      }
    });
    return list
      .filter(v => !alreadyAssigned.has(v.id) && !conflicting.has(v.id))
      .map(v => {
        let score = 0;
        if (volunteerAvailable(v, shift)) score += 3;
        if ((v.inspiredPoles || []).includes(shift.pole)) score += 2;
        return { ...v, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  /* ── Volunteer portal ── */
  if (isVolunteer) {
    const me = list.find(v => v.email === data.user?.email) || list[0];
    const myShifts = me ? shifts.filter(s => (s.assignedIds || []).includes(me.id)) : [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Avatar v={me} size={52} />
          <div>
            <h2 className="section-title" style={{ fontSize: '1.5rem' }}>{me?.name || 'Bénévole'}</h2>
            <p className="section-subtitle">{(me?.inspiredPoles || []).join(' · ') || 'Aucun pôle'}</p>
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Mes créneaux</h3>
          {myShifts.length === 0
            ? <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aucun créneau assigné.</p>
            : myShifts.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color || 'var(--primary)', flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{s.title}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.date} {s.startTime}–{s.endTime}</span>
              </div>
            ))
          }
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="section-title">Bénévoles</h2>
          <p className="section-subtitle">{list.length} bénévoles · {shifts.length} créneaux</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {activeTab === 'planning' && (
            <button className="btn-secondary" onClick={() => openShiftModal(null)}>
              <Plus size={13} /> Créneau
            </button>
          )}
          <button className="btn-primary" onClick={openAddVol}>
            <Plus size={13} /> Bénévole
          </button>
        </div>
      </div>

      {/* Main tabs */}
      <div style={{ display: 'flex', gap: 3, background: 'var(--bg-elevated)', borderRadius: 10, padding: 3, width: 'fit-content' }}>
        {[
          { id: 'list',         label: `Bénévoles (${list.length})`, icon: Users    },
          { id: 'planning',     label: 'Planning',                   icon: Calendar  },
          { id: 'intelligence', label: 'Intelligence',               icon: Brain     },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.3rem 0.875rem', borderRadius: 8, border: 'none',
            background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
            color: activeTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
            boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
            fontFamily: 'var(--font-main)', transition: 'all 0.15s',
          }}>
            <tab.icon size={13} />{tab.label}
          </button>
        ))}
      </div>

      {/* ── LIST ── */}
      {activeTab === 'list' && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-card)' }}>
          {list.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Aucun bénévole.{' '}
              <button onClick={openAddVol} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}>+ Ajouter</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <colgroup>
                  <col style={{ width: '28%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '24%' }} />
                  <col />
                  <col style={{ width: 72 }} />
                </colgroup>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)' }}>
                    {['NOM', 'EMAIL', 'TÉLÉPHONE', 'POSTES PRÉFÉRÉS', 'NOTES', ''].map(h => (
                      <th key={h} style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((v, i) => {
                    const myShifts = shifts.filter(s => (s.assignedIds || []).includes(v.id));
                    return (
                      <tr key={v.id} style={{ borderBottom: i < list.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg-card)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                      >
                        <td style={{ padding: '0.65rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar v={v} size={32} />
                            <div>
                              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{v.name}</p>
                              {myShifts.length > 0 && <p style={{ fontSize: '0.65rem', color: 'var(--success)' }}>✓ {myShifts.length} créneau{myShifts.length > 1 ? 'x' : ''}</p>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.65rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {v.email ? <a href={`mailto:${v.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{v.email}</a> : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                        </td>
                        <td style={{ padding: '0.65rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {v.phone || <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                        </td>
                        <td style={{ padding: '0.65rem 1rem' }}>
                          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {(v.inspiredPoles || []).slice(0, 3).map(p => (
                              <span key={p} style={{ background: 'var(--primary-soft)', color: 'var(--primary)', padding: '1px 7px', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700 }}>{p}</span>
                            ))}
                            {(v.inspiredPoles || []).length > 3 && <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>+{v.inspiredPoles.length - 3}</span>}
                            {(v.inspiredPoles || []).length === 0 && <span style={{ color: 'var(--text-subtle)', fontSize: '0.72rem' }}>—</span>}
                          </div>
                        </td>
                        <td style={{ padding: '0.65rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.notes || <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <div style={{ display: 'flex', gap: 2 }}>
                            <button className="btn-ghost" onClick={() => openEditVol(v)}><Edit2 size={12} /></button>
                            <button className="btn-ghost" onClick={() => setToDelete(v)} style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>
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
      )}

      {/* ── PLANNING ── */}
      {activeTab === 'planning' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
            {[
              { id: 'location',  label: 'Par lieu'      },
              { id: 'animation', label: 'Par animation'  },
              { id: 'volunteer', label: 'Par bénévole'   },
            ].map(t => (
              <button key={t.id} onClick={() => setPlanView(t.id)} style={{
                padding: '6px 14px 10px', border: 'none',
                borderBottom: planView === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                background: 'transparent',
                color: planView === t.id ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '0.78rem', fontWeight: planView === t.id ? 700 : 500,
                cursor: 'pointer', fontFamily: 'var(--font-main)', marginBottom: -1,
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Vue par lieu — liste groupée collapsible */}
          {planView === 'location' && <GroupedShiftList shifts={shifts} volunteers={list} groupByKey="location" groupLabel="lieu" onEdit={openShiftModal} onAdd={() => openShiftModal(null)} />}
          {planView === 'animation' && <GroupedShiftList shifts={shifts} volunteers={list} groupByKey="animationId" groupLabel="animation" animations={animations} onEdit={openShiftModal} onAdd={() => openShiftModal(null)} />}

          {/* Vue par bénévole — Timeline */}
          {planView === 'volunteer' && (
            <>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Cliquez sur une ligne pour ajouter un créneau · Glissez le bord droit pour ajuster la durée
              </p>
              <Timeline
                groupKey="volunteer"
                groups={volGroups}
                shifts={shifts}
                volunteers={list}
                onAdd={handleTimelineAdd}
                onEdit={openShiftModal}
                onResize={handleResizeShift}
              />
            </>
          )}
        </div>
      )}

      {/* ── INTELLIGENCE ── */}
      {activeTab === 'intelligence' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Global stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
            {[
              { label: 'Postes requis',  value: totalRequired, color: 'var(--primary)',  bg: 'var(--primary-soft)', icon: Users     },
              { label: 'Postes pourvus', value: totalAssigned, color: 'var(--success)',  bg: 'rgba(16,185,129,.1)', icon: Check     },
              { label: 'Postes manquants', value: Math.max(0, gap), color: gap > 0 ? 'var(--danger)' : 'var(--success)', bg: gap > 0 ? 'rgba(239,68,68,.08)' : 'rgba(16,185,129,.08)', icon: gap > 0 ? AlertTriangle : Check },
            ].map(s => (
              <div key={s.label} className="card" style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', padding: '1rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.icon size={17} color={s.color} />
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                  <p style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Per-shift suggestions */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={14} color="var(--primary)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Suggestions par créneau</span>
            </div>
            {shifts.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Aucun créneau défini. Allez dans Planning pour en créer.
              </div>
            ) : shifts.map((shift, i) => {
              const assigned  = (shift.assignedIds || []).map(id => list.find(v => v.id === id)).filter(Boolean);
              const needed    = (shift.requiredCount || 0) - assigned.length;
              const suggestions = needed > 0 ? getSuggestions(shift) : [];

              return (
                <div key={shift.id} style={{ padding: '0.875rem 1rem', borderBottom: i < shifts.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: suggestions.length > 0 ? '0.625rem' : 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: shift.color || 'var(--primary)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700 }}>{shift.title}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {shift.date && `${shift.date} · `}{shift.startTime}–{shift.endTime} · {shift.pole || 'Aucun pôle'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex' }}>
                        {assigned.slice(0, 4).map((v, idx) => <Avatar key={v.id} v={v} size={22} overlap={idx > 0} />)}
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: needed > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {assigned.length}/{shift.requiredCount}
                      </span>
                    </div>
                  </div>

                  {suggestions.length > 0 && (
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '0.625rem 0.75rem' }}>
                      <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                        <Star size={9} style={{ marginRight: 4 }} />Suggestions ({needed} poste{needed > 1 ? 's' : ''} à pourvoir)
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {suggestions.map(v => (
                          <button
                            key={v.id}
                            onClick={() => {
                              updateItem('volunteers', 'shifts', shift.id, {
                                assignedIds: [...(shift.assignedIds || []), v.id],
                              });
                              toast.success(`${v.name} assigné(e) au créneau "${shift.title}"`);
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '4px 10px', borderRadius: 99,
                              border: '1.5px solid var(--border)', background: 'var(--bg-card)',
                              cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                              color: 'var(--text-main)', fontFamily: 'var(--font-main)',
                              transition: 'all 0.12s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-soft)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                          >
                            <Avatar v={v} size={18} />
                            {v.name}
                            {v.score >= 4 && <span style={{ color: 'var(--success)', fontSize: '0.6rem' }}>★</span>}
                            <Plus size={10} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Volunteer Modal ── */}
      <Modal isOpen={isVolModal} onClose={() => setIsVolModal(false)} title={editingVol ? 'Modifier le bénévole' : 'Nouveau bénévole'} maxWidth="520px">
        <form onSubmit={handleSaveVol} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {/* Photo + nom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              onClick={() => photoRef.current?.click()}
              style={{ width: 56, height: 56, borderRadius: '50%', border: '2px dashed var(--border)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {volForm.photo
                ? <img src={volForm.photo} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Upload size={16} color="var(--text-muted)" />}
            </div>
            <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={lbl}>PRÉNOM</label>
                <input style={inputStyle} value={volForm.firstName || ''} onChange={e => setV('firstName', e.target.value)} placeholder="Prénom" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={lbl}>NOM</label>
                <input style={inputStyle} value={volForm.lastName || ''} onChange={e => setV('lastName', e.target.value)} placeholder="Nom" />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={lbl}>EMAIL</label>
              <input style={inputStyle} type="email" value={volForm.email} onChange={e => setV('email', e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={lbl}>TÉLÉPHONE</label>
              <input style={inputStyle} type="tel" value={volForm.phone} onChange={e => setV('phone', e.target.value)} placeholder="06 XX XX XX XX" />
            </div>
          </div>

          <div>
            <label style={{ ...lbl, display: 'block', marginBottom: 6 }}>POSTES PRÉFÉRÉS</label>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {allPoles.map(pole => {
                const active = (volForm.inspiredPoles || []).includes(pole);
                return (
                  <button key={pole} type="button" onClick={() => togglePole(pole)} style={{
                    padding: '3px 11px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                    border: active ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                    background: active ? 'var(--primary-soft)' : 'transparent',
                    color: active ? 'var(--primary)' : 'var(--text-muted)',
                    transition: 'all 0.12s', fontFamily: 'var(--font-main)',
                  }}>{pole}</button>
                );
              })}
            </div>
          </div>

          {/* Disponibilités */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={lbl}>DISPONIBILITÉS</label>
              <button type="button" onClick={() => setV('availabilitySlots', [...(volForm.availabilitySlots || []), { id: Date.now().toString(), date: '', startTime: '', endTime: '' }])}
                style={{ fontSize: '0.7rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0 }}>
                + Ajouter
              </button>
            </div>
            {(volForm.availabilitySlots || []).map(slot => (
              <div key={slot.id} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <input type="date" value={slot.date} style={{ ...inputStyle, flex: 2 }} onChange={e => setV('availabilitySlots', volForm.availabilitySlots.map(s => s.id === slot.id ? { ...s, date: e.target.value } : s))} />
                <input type="time" value={slot.startTime} style={{ ...inputStyle, flex: 1 }} onChange={e => setV('availabilitySlots', volForm.availabilitySlots.map(s => s.id === slot.id ? { ...s, startTime: e.target.value } : s))} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>→</span>
                <input type="time" value={slot.endTime} style={{ ...inputStyle, flex: 1 }} onChange={e => setV('availabilitySlots', volForm.availabilitySlots.map(s => s.id === slot.id ? { ...s, endTime: e.target.value } : s))} />
                <button type="button" onClick={() => setV('availabilitySlots', volForm.availabilitySlots.filter(s => s.id !== slot.id))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 2, display: 'flex' }}><X size={13} /></button>
              </div>
            ))}
            {(volForm.availabilitySlots || []).length === 0 && <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Aucune disponibilité renseignée.</p>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={lbl}>NOTES</label>
            <textarea style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }} value={volForm.notes} onChange={e => setV('notes', e.target.value)} placeholder="Compétences, informations particulières…" />
          </div>

          <button type="submit" className="btn-primary">{editingVol ? 'Mettre à jour' : 'Enregistrer'}</button>
        </form>
      </Modal>

      {/* ── Shift Modal ── */}
      <ShiftModal
        isOpen={shiftModal.open}
        onClose={() => setShiftModal({ open: false, initial: null })}
        onSave={handleSaveShift}
        onDelete={handleDeleteShift}
        initial={shiftModal.initial}
        volunteers={list}
        allPoles={allPoles}
        animations={animations}
        concerts={concerts}
      />

      <ConfirmModal
        isOpen={!!toDelete}
        onConfirm={handleDeleteVol}
        onCancel={() => setToDelete(null)}
        title={`Supprimer ${toDelete?.name} ?`}
        description="Ce bénévole sera définitivement supprimé."
      />
    </div>
  );
}
