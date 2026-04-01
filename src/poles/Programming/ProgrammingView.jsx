import React, { useState, useRef, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { useNotifications } from '../../context/NotificationContext';
import { Plus, Trash2, Edit2, Clock, Users, ChevronDown, ChevronRight, Mail, Music, Zap, Calendar } from 'lucide-react';
import Modal from '../../components/shared/Modal';

// ─── Shared ─────────────────────────────────────────────────────────
const inputStyle = { width: '100%', padding: '0.6rem 0.875rem', borderRadius: 8, background: '#f8f9fa', border: '1px solid #e9ecef', color: '#1a1a1b', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '0.3rem', letterSpacing: '0.04em' };
const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);

// ─── Artist status pipeline ───────────────────────────────────────
const ARTIST_STATUSES = {
  prospect:      { label: 'Prospect',       color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  contacted:     { label: 'Contacté',       color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  in_discussion: { label: 'En discussion',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  confirmed:     { label: 'Confirmé',       color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  refused:       { label: 'Refusé',         color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};
const ARTIST_STATUS_ORDER = ['prospect', 'contacted', 'in_discussion', 'confirmed', 'refused'];

// ─── Animation status ────────────────────────────────────────────
const ANIM_STATUSES = {
  planned:   { label: 'Idée / En cours', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  contacted: { label: 'Contacté',        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  confirmed: { label: 'Confirmé',        color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  cancelled: { label: 'Annulé',          color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};
const ANIM_TYPES = ['Sport', 'Spectacle', 'Atelier', 'Jeux', 'Exposition', 'Autre'];

// ─── Programme categories ─────────────────────────────────────────
const PROG_CATEGORIES = [
  { id: 'all', label: 'Tous' },
  { id: 'concert', label: 'Concert', color: '#6B63CC' },
  { id: 'village', label: 'Village', color: '#10b981' },
  { id: 'course', label: 'Course',  color: '#F86B1A' },
];
const PROG_STATUSES = ['confirmed', 'pending', 'cancelled'];
const PROG_STATUS_LABELS = { confirmed: 'Confirmé', pending: 'En attente', cancelled: 'Annulé' };
const PROG_STATUS_COLORS = {
  confirmed: { background: 'rgba(16,185,129,0.1)', color: '#059669' },
  pending:   { background: 'rgba(245,158,11,0.1)', color: '#d97706' },
  cancelled: { background: 'rgba(239,68,68,0.1)',  color: '#dc2626' },
};

// Timeline helpers
const TIMELINE_HOURS = ['10','11','12','13','14','15','16','17','18','19','20','21','22','23','00','01','02'];
const HOUR_W = 64;
function timeToX(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return ((h < 10 ? h + 24 : h) - 10 + m / 60) * HOUR_W;
}
function xToTime(x) {
  const snap5 = (m) => Math.round(m / 5) * 5;
  const totalMins = snap5((x / HOUR_W) * 60);
  const absHour = Math.floor(totalMins / 60) + 10; // offset: timeline starts at 10h
  const h = absHour % 24;
  const m = ((totalMins % 60) + 60) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function addMinutes(time, mins) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}
const CAT_COLORS = { concert: '#6B63CC', village: '#10b981', course: '#F86B1A' };

// ─── Tabs ────────────────────────────────────────────────────────
const TABS = [
  { id: 'artists', label: '🎤 Artistes' },
  { id: 'animations', label: '🎭 Animations' },
  { id: 'programme', label: '📅 Programme' },
];

// ════════════════════════════════════════════════════════════════
export default function ProgrammingView() {
  const [activeTab, setActiveTab] = useState('artists');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '3px', background: '#f1f3f5', borderRadius: 12, padding: '3px', alignSelf: 'flex-start' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '0.45rem 1.125rem', borderRadius: 10, border: 'none', background: activeTab === t.id ? 'white' : 'transparent', color: activeTab === t.id ? '#1a1a1b' : '#64748b', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', boxShadow: activeTab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>
      {activeTab === 'artists'    && <ArtistsPanel />}
      {activeTab === 'animations' && <AnimationsPanel />}
      {activeTab === 'programme'  && <ProgrammePanel />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ARTISTES
// ════════════════════════════════════════════════════════════════
const EMPTY_ARTIST = { name: '', genre: '', status: 'prospect', fee: 0, contact: '', techRider: '', notes: '', performanceDate: '2026-06-06', duration: 60, startTime: '', endTime: '' };

function ArtistsPanel() {
  const { data, addItem, updateArtistWithSync, deleteItem, updateItem } = useEvent();
  const { push } = useNotifications();
  const artists = data.poles.programming.artists || [];
  const budgetExpenses = data.poles.budget.expenses;

  const [view, setView] = useState('cards'); // 'cards' | 'kanban' | 'planning'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ARTIST);
  const [filterStatus, setFilterStatus] = useState('all');
  const [syncNotif, setSyncNotif] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // ── Planning drag-to-move / drag-to-resize ──────────────────────
  const planDragRef = useRef(null);
  const [planPreview, setPlanPreview] = useState(null); // { id, startTime, duration }

  const startPlanDrag = (e, artistId, type) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const artist = artists.find(a => a.id === artistId);
    if (!artist) return;
    planDragRef.current = {
      id: artistId, type,
      startX: e.clientX,
      origStartTime: artist.startTime || '12:00',
      origDuration: artist.duration || 60,
      moved: false,
    };
    setPlanPreview({ id: artistId, startTime: artist.startTime || '12:00', duration: artist.duration || 60 });
  };

  useEffect(() => {
    const toAbsMins = (t) => {
      const [h, m] = t.split(':').map(Number);
      return (h < 10 ? h + 24 : h) * 60 + m;
    };
    const fromAbsMins = (abs) => {
      const h = Math.floor(abs / 60) % 24;
      const m = abs % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    const snap = (v) => Math.round(v / 5) * 5;

    const onMove = (e) => {
      const drag = planDragRef.current;
      if (!drag) return;
      const deltaX = e.clientX - drag.startX;
      if (!drag.moved && Math.abs(deltaX) < 4) return;
      drag.moved = true;
      const deltaMins = snap((deltaX / HOUR_W) * 60);
      if (drag.type === 'move') {
        const newAbs = Math.max(10 * 60, Math.min(26 * 60 - drag.origDuration, toAbsMins(drag.origStartTime) + deltaMins));
        setPlanPreview({ id: drag.id, startTime: fromAbsMins(snap(newAbs)), duration: drag.origDuration });
      } else {
        const newDur = Math.max(15, snap(drag.origDuration + deltaMins));
        setPlanPreview({ id: drag.id, startTime: drag.origStartTime, duration: newDur });
      }
    };

    const onUp = () => {
      const drag = planDragRef.current;
      if (drag) {
        if (drag.moved) {
          setPlanPreview(prev => {
            if (prev && prev.id === drag.id) {
              updateArtistWithSync(drag.id, { startTime: prev.startTime, duration: prev.duration, endTime: addMinutes(prev.startTime, prev.duration) });
            }
            return null;
          });
        } else {
          setPlanPreview(null);
        }
        planDragRef.current = null;
      }
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
    };
  }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_ARTIST); setIsModalOpen(true); };
  const openEdit = (a) => { setEditing(a); setForm({ ...a }); setIsModalOpen(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      updateArtistWithSync(editing.id, form);
      if (form.status === 'confirmed' && form.fee > 0) {
        setSyncNotif(editing.id);
        push({ id: `sync_artist_${editing.id}`, type: 'success', title: 'Budget synchronisé', message: `Cachet de ${form.name} ajouté au budget`, link: 'budget' });
      }
    } else {
      addItem('programming', 'artists', form);
    }
    setIsModalOpen(false); setEditing(null);
    setTimeout(() => setSyncNotif(null), 4000);
  };

const totalConfirmed = artists.filter(a => a.status === 'confirmed').reduce((s, a) => s + (a.fee || 0), 0);
  const filtered = filterStatus === 'all' ? artists : artists.filter(a => a.status === filterStatus);
  const confirmedArtists = [...artists.filter(a => a.status === 'confirmed')].sort((a, b) => (a.startTime || '99').localeCompare(b.startTime || '99'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '3px', background: '#f1f3f5', borderRadius: 10, padding: '3px' }}>
          {[{ id: 'cards', label: 'Fiches' }, { id: 'kanban', label: 'Kanban' }, { id: 'planning', label: 'Planning' }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{ padding: '0.35rem 0.875rem', borderRadius: 8, border: 'none', background: view === v.id ? 'white' : 'transparent', color: view === v.id ? '#1a1a1b' : '#64748b', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', boxShadow: view === v.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
              {v.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>Budget confirmé : {fmt(totalConfirmed)}</span>
          <button onClick={openAdd} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}><Plus size={15} /> Artiste</button>
        </div>
      </div>

      {/* Status filter (cards only) */}
      {view === 'cards' && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', ...ARTIST_STATUS_ORDER].map(s => {
            const info = s === 'all' ? { label: `Tous (${artists.length})` } : { ...ARTIST_STATUSES[s], label: `${ARTIST_STATUSES[s].label} (${artists.filter(a => a.status === s).length})` };
            return (
              <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '0.3rem 0.75rem', borderRadius: 99, border: filterStatus === s ? `1.5px solid ${info.color || '#1a1a1b'}` : '1.5px solid #e9ecef', background: filterStatus === s ? (s === 'all' ? '#f1f3f5' : info.bg) : 'white', color: filterStatus === s ? (info.color || '#1a1a1b') : '#64748b', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                {info.label}
              </button>
            );
          })}
        </div>
      )}

      {/* CARDS VIEW */}
      {view === 'cards' && (
        filtered.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            Aucun artiste. <button onClick={openAdd} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 700 }}>+ Ajouter</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {filtered.map(a => {
              const st = ARTIST_STATUSES[a.status] || ARTIST_STATUSES.prospect;
              const budgetLinked = budgetExpenses.find(e => e.linkedId === a.id);
              return (
                <div key={a.id} className="card" style={{ padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', outline: syncNotif === a.id ? '2px solid #10b981' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${st.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Music size={15} color={st.color} /></div>
                        <div>
                          <p style={{ fontSize: '0.9rem', fontWeight: 800, lineHeight: 1.2 }}>{a.name}</p>
                          <p style={{ fontSize: '0.72rem', color: '#64748b' }}>{a.genre}</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={() => openEdit(a)} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 5 }} onMouseEnter={e => e.currentTarget.style.color = '#475569'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}><Edit2 size={13} /></button>
                      <button onClick={() => deleteItem('programming', 'artists', a.id)} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 5 }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700 }}>{st.label}</span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {a.fee > 0 && <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>{fmt(a.fee)}</span>}
                      {budgetLinked && <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#10b981', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 99, padding: '1px 7px' }}>🔗 Budget</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {ARTIST_STATUS_ORDER.filter(s => s !== 'refused').map(s => {
                      const thisIdx = ARTIST_STATUS_ORDER.indexOf(s);
                      const curIdx = ARTIST_STATUS_ORDER.indexOf(a.status);
                      const active = thisIdx <= curIdx && a.status !== 'refused';
                      return <div key={s} style={{ flex: 1, height: 4, borderRadius: 99, background: active ? ARTIST_STATUSES[s].color : '#e9ecef', transition: 'background 0.2s' }} />;
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.72rem', color: '#64748b' }}>
                    {a.duration && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} /> {a.duration} min</span>}
                    {a.startTime && <span style={{ color: '#475569', fontWeight: 600 }}>{a.startTime}–{a.endTime}</span>}
                    {a.contact && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Mail size={11} />{a.contact}</span>}
                  </div>
                  {a.notes && <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', borderTop: '1px solid #f1f3f5', paddingTop: '0.5rem' }}>{a.notes}</p>}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* KANBAN VIEW */}
      {view === 'kanban' && (
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', alignItems: 'flex-start' }}>
          {ARTIST_STATUS_ORDER.map(status => {
            const st = ARTIST_STATUSES[status];
            const col = artists.filter(a => a.status === status);
            const isOver = dragOverCol === status;
            return (
              <div
                key={status}
                style={{ minWidth: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                onDragOver={e => { e.preventDefault(); setDragOverCol(status); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null); }}
                onDrop={e => {
                  e.preventDefault();
                  if (draggingId && draggingId !== status) {
                    const artist = artists.find(a => a.id === draggingId);
                    if (artist && artist.status !== status) {
                      updateArtistWithSync(draggingId, { status });
                    }
                  }
                  setDraggingId(null);
                  setDragOverCol(null);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 8, background: isOver ? st.color + '22' : st.bg, transition: 'background 0.15s', outline: isOver ? `2px solid ${st.color}` : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: st.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{st.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 700, color: st.color, background: 'white', borderRadius: 99, padding: '0px 7px' }}>{col.length}</span>
                </div>
                {col.map(a => (
                  <div
                    key={a.id}
                    className="card"
                    draggable
                    onDragStart={e => { setDraggingId(a.id); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                    style={{ padding: '0.875rem', cursor: draggingId === a.id ? 'grabbing' : 'grab', opacity: draggingId === a.id ? 0.45 : 1, transition: 'opacity 0.15s' }}
                    onClick={() => openEdit(a)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{a.name}</p>
                        {a.genre && <p style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>{a.genre}</p>}
                      </div>
                      <button onClick={e => { e.stopPropagation(); deleteItem('programming', 'artists', a.id); }} style={{ padding: '3px', background: 'transparent', border: 'none', color: '#e2e8f0', cursor: 'pointer', borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#e2e8f0'}><Trash2 size={11} /></button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.68rem', color: '#64748b' }}>
                      {a.fee > 0 && <span style={{ fontWeight: 700, color: '#1a1a1b' }}>{fmt(a.fee)}</span>}
                      {a.duration && <span><Clock size={10} style={{ verticalAlign: 'middle' }} /> {a.duration}min</span>}
                    </div>
                  </div>
                ))}
                <button onClick={openAdd} style={{ padding: '0.5rem', border: '1px dashed #e2e8f0', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>+ Artiste</button>
              </div>
            );
          })}
        </div>
      )}

      {/* PLANNING VIEW — confirmed artists on timeline */}
      {view === 'planning' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
            Seuls les artistes <strong>confirmés</strong> apparaissent ici. Cliquez sur la ligne pour placer un artiste, glissez la barre pour déplacer, tirez le bord droit pour étendre.
          </p>
          {confirmedArtists.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Aucun artiste confirmé.</div>
          ) : (
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: 200 + TIMELINE_HOURS.length * HOUR_W }}>
                  {/* Hour header */}
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: '#fafafa', height: 32 }}>
                    <div style={{ width: 200, minWidth: 200, borderRight: '1px solid var(--border)', padding: '0 1rem', display: 'flex', alignItems: 'center', fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', position: 'sticky', left: 0, background: '#fafafa', zIndex: 5 }}>ARTISTE</div>
                    {TIMELINE_HOURS.map(h => (
                      <div key={h} style={{ width: HOUR_W, minWidth: HOUR_W, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, borderRight: '1px solid #f1f3f5' }}>{h}:00</div>
                    ))}
                  </div>
                  {confirmedArtists.map((a, idx) => {
                    const preview = planPreview && planPreview.id === a.id ? planPreview : null;
                    const dispStart = preview ? preview.startTime : a.startTime;
                    const dispDuration = preview ? preview.duration : (a.duration || 60);
                    const hasTime = !!(preview ? preview.startTime : a.startTime);
                    const x = hasTime ? timeToX(dispStart) : -999;
                    const barW = Math.max(20, (dispDuration / 60) * HOUR_W);
                    const rowBg = idx % 2 === 0 ? '#fff' : '#fafafa';
                    const isDraggingThis = planDragRef.current && planDragRef.current.id === a.id && planDragRef.current.moved;
                    return (
                      <div key={a.id} style={{ display: 'flex', borderBottom: '1px solid #f1f3f5', background: rowBg }}>
                        <div style={{ width: 200, minWidth: 200, padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid var(--border)', position: 'sticky', left: 0, background: rowBg, zIndex: 3, height: 52 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Music size={12} color="#6366f1" /></div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.78rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                            <p style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{dispDuration} min</p>
                          </div>
                        </div>
                        <div
                          style={{ flex: 1, position: 'relative', height: 52, cursor: hasTime ? 'default' : 'crosshair' }}
                          onMouseDown={!hasTime ? (e) => {
                            if (e.button !== 0) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const clickedTime = xToTime(Math.max(0, clickX));
                            const endTime = addMinutes(clickedTime, a.duration || 60);
                            updateArtistWithSync(a.id, { startTime: clickedTime, endTime, duration: a.duration || 60 });
                          } : undefined}
                        >
                          {TIMELINE_HOURS.map((h, i) => <div key={h} style={{ position: 'absolute', left: i * HOUR_W, top: 0, bottom: 0, width: 1, background: '#f1f3f5' }} />)}
                          {hasTime && (
                            <div
                              onMouseDown={(e) => startPlanDrag(e, a.id, 'move')}
                              style={{
                                position: 'absolute', left: x, width: barW, top: 8, bottom: 8,
                                background: isDraggingThis ? 'rgba(107,99,204,0.25)' : 'rgba(107,99,204,0.15)',
                                border: `1.5px solid ${isDraggingThis ? '#5b52b8' : '#6B63CC'}`,
                                borderRadius: 6, cursor: 'grab',
                                display: 'flex', alignItems: 'center', paddingLeft: 8,
                                fontSize: '0.62rem', fontWeight: 700, color: '#6B63CC',
                                overflow: 'hidden', whiteSpace: 'nowrap', zIndex: 2,
                                userSelect: 'none', transition: isDraggingThis ? 'none' : 'left 0.08s, width 0.08s',
                              }}
                            >
                              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none' }}>
                                {dispStart}–{addMinutes(dispStart, dispDuration)}
                              </span>
                              {/* Right resize handle */}
                              <div
                                onMouseDown={(e) => { e.stopPropagation(); startPlanDrag(e, a.id, 'resize-right'); }}
                                style={{
                                  position: 'absolute', right: 0, top: 0, bottom: 0, width: 10,
                                  cursor: 'ew-resize', borderRadius: '0 4px 4px 0',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: 'rgba(107,99,204,0.25)',
                                }}
                              >
                                <div style={{ width: 2, height: 14, borderRadius: 2, background: '#6B63CC', opacity: 0.7 }} />
                              </div>
                            </div>
                          )}
                          {!hasTime && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 12, pointerEvents: 'none' }}>
                              <span style={{ fontSize: '0.65rem', color: '#cbd5e1', fontStyle: 'italic' }}>Cliquez pour placer</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditing(null); }} title={editing ? "Modifier l'artiste" : 'Nouvel artiste'} maxWidth="560px">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><label style={labelStyle}>NOM *</label><input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>GENRE</label><input type="text" value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} style={inputStyle} placeholder="Rock, Jazz, Électro..." /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>STATUT</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                {ARTIST_STATUS_ORDER.map(s => <option key={s} value={s}>{ARTIST_STATUSES[s].label}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>CACHET (€)</label><input type="number" min={0} value={form.fee} onChange={e => setForm(f => ({ ...f, fee: parseFloat(e.target.value) || 0 }))} style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>DURÉE (min)</label>
              <input type="number" min={1} max={360} value={form.duration || 60} onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 60 }))} style={inputStyle} placeholder="60" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><label style={labelStyle}>CONTACT</label><input type="text" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} style={inputStyle} placeholder="Email, téléphone, agent..." /></div>
            <div><label style={labelStyle}>DATE</label><input type="date" value={form.performanceDate} onChange={e => setForm(f => ({ ...f, performanceDate: e.target.value }))} style={inputStyle} /></div>
          </div>
          <p style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic', margin: '-0.5rem 0 0' }}>
            L'heure exacte se définit dans la vue <strong>Planning</strong> une fois l'artiste confirmé.
          </p>
          <div><label style={labelStyle}>TECH RIDER</label><textarea value={form.techRider} onChange={e => setForm(f => ({ ...f, techRider: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Matériel scène requis..." /></div>
          <div><label style={labelStyle}>NOTES</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} /></div>
          <button type="submit" className="btn-primary" style={{ marginTop: '0.25rem' }}>{editing ? 'Mettre à jour' : 'Enregistrer'}</button>
        </form>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ANIMATIONS
// ════════════════════════════════════════════════════════════════
const EMPTY_ANIM = { name: '', type: 'Spectacle', description: '', duration: 60, contact: '', cost: 0, status: 'planned', volunteersNeeded: 0, date: '2026-06-06', startTime: '', endTime: '', subAnimations: [] };
const EMPTY_SUB  = { name: '', type: 'Spectacle', description: '', startTime: '', endTime: '', contact: '', cost: 0, status: 'planned', notes: '' };

function AnimationsPanel() {
  const { data, addItem, updateItem, deleteItem, addSubAnimation, deleteSubAnimation } = useEvent();
  const animations = data.poles.programming.animations || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ANIM);
  const [expandedId, setExpandedId] = useState(null);
  const [addingSubFor, setAddingSubFor] = useState(null);
  const [subForm, setSubForm] = useState(EMPTY_SUB);
  const [activeView, setActiveView] = useState('list'); // 'list' | 'timeline'

  const openAdd  = () => { setEditing(null); setForm(EMPTY_ANIM); setIsModalOpen(true); };
  const openEdit = (a) => { setEditing(a); setForm({ ...a, subAnimations: a.subAnimations || [] }); setIsModalOpen(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) updateItem('programming', 'animations', editing.id, form);
    else addItem('programming', 'animations', { ...form, subAnimations: [] });
    setIsModalOpen(false); setEditing(null);
  };

  const submitSub = (animId) => {
    if (!subForm.name.trim()) return;
    addSubAnimation(animId, subForm);
    setSubForm(EMPTY_SUB); setAddingSubFor(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '3px', background: '#f1f3f5', borderRadius: 10, padding: '3px' }}>
          {[{ id: 'list', label: 'Liste' }, { id: 'timeline', label: 'Timeline' }].map(v => (
            <button key={v.id} onClick={() => setActiveView(v.id)} style={{ padding: '0.35rem 0.875rem', borderRadius: 8, border: 'none', background: activeView === v.id ? 'white' : 'transparent', color: activeView === v.id ? '#1a1a1b' : '#64748b', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', boxShadow: activeView === v.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
              {v.label}
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}><Plus size={15} /> Nouvelle animation</button>
      </div>

      {/* LIST VIEW */}
      {activeView === 'list' && (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {animations.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Aucune animation. <button onClick={openAdd} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 700 }}>+ Ajouter</button></div>
          ) : animations.map((a, idx) => {
            const st = ANIM_STATUSES[a.status] || ANIM_STATUSES.planned;
            const isExpanded = expandedId === a.id;
            const subs = a.subAnimations || [];
            return (
              <div key={a.id} style={{ borderBottom: idx < animations.length - 1 || isExpanded ? '1px solid #f1f3f5' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <button onClick={() => setExpandedId(isExpanded ? null : a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#94a3b8', flexShrink: 0 }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${st.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Zap size={15} color={st.color} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{a.name}</span>
                      <span style={{ background: '#f1f3f5', color: '#475569', padding: '1px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 600 }}>{a.type}</span>
                      <span style={{ background: st.bg, color: st.color, padding: '1px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700 }}>{st.label}</span>
                      {subs.length > 0 && <span style={{ background: 'rgba(107,99,204,0.08)', color: '#6B63CC', padding: '1px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700 }}>{subs.length} sous-animation{subs.length > 1 ? 's' : ''}</span>}
                    </div>
                    {a.description && <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{a.description}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexShrink: 0, fontSize: '0.72rem', color: '#64748b' }}>
                    {a.startTime && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} /> {a.startTime}–{a.endTime}</span>}
                    {a.volunteersNeeded > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={11} /> {a.volunteersNeeded}</span>}
                    {a.cost > 0 && <span style={{ fontWeight: 700, color: '#1a1a1b' }}>{fmt(a.cost)}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                    <button onClick={() => openEdit(a)} style={{ padding: '5px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.color = '#475569'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}><Edit2 size={13} /></button>
                    <button onClick={() => deleteItem('programming', 'animations', a.id)} style={{ padding: '5px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}><Trash2 size={13} /></button>
                  </div>
                </div>

                {/* Sub-animations */}
                {isExpanded && (
                  <div style={{ background: '#fafafa', borderTop: '1px solid #f1f3f5', padding: '0.5rem 1.25rem 0.875rem 4rem' }}>
                    {subs.length === 0 && <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Aucune sous-animation.</p>}
                    {subs.map((sub, si) => (
                      <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.375rem 0', borderBottom: si < subs.length - 1 ? '1px dashed #e9ecef' : 'none' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, flex: 1 }}>{sub.name}</span>
                        {sub.type && <span style={{ fontSize: '0.65rem', background: '#f1f3f5', color: '#475569', padding: '1px 7px', borderRadius: 99 }}>{sub.type}</span>}
                        {(sub.startTime || sub.endTime) && <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{sub.startTime}–{sub.endTime}</span>}
                        {sub.cost > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{fmt(sub.cost)}</span>}
                        <button onClick={() => deleteSubAnimation(a.id, sub.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 2 }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}><Trash2 size={11} /></button>
                      </div>
                    ))}

                    {addingSubFor === a.id ? (
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'white', border: '1px solid #e9ecef', borderRadius: 8, padding: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                          <input type="text" value={subForm.name} onChange={e => setSubForm(s => ({ ...s, name: e.target.value }))} placeholder="Nom de la sous-animation *" style={inputStyle} autoFocus />
                          <select value={subForm.type} onChange={e => setSubForm(s => ({ ...s, type: e.target.value }))} style={inputStyle}>
                            {ANIM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                          <input type="time" value={subForm.startTime} onChange={e => setSubForm(s => ({ ...s, startTime: e.target.value }))} style={inputStyle} />
                          <input type="time" value={subForm.endTime} onChange={e => setSubForm(s => ({ ...s, endTime: e.target.value }))} style={inputStyle} />
                          <input type="number" value={subForm.cost} onChange={e => setSubForm(s => ({ ...s, cost: parseFloat(e.target.value) || 0 }))} placeholder="Coût €" style={inputStyle} min={0} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button type="button" onClick={() => { setAddingSubFor(null); setSubForm(EMPTY_SUB); }} style={{ padding: '0.4rem 0.875rem', background: 'white', border: '1px solid #e9ecef', borderRadius: 7, cursor: 'pointer', fontSize: '0.75rem', color: '#64748b' }}>Annuler</button>
                          <button type="button" onClick={() => submitSub(a.id)} style={{ padding: '0.4rem 0.875rem', background: '#1a1a1b', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>Ajouter</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingSubFor(a.id); setSubForm(EMPTY_SUB); }} style={{ marginTop: '0.5rem', background: 'none', border: '1px dashed #e9ecef', borderRadius: 7, padding: '0.35rem 0.875rem', cursor: 'pointer', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600 }}>
                        + Sous-animation
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TIMELINE VIEW with sub-animations */}
      {activeView === 'timeline' && (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 200 + TIMELINE_HOURS.length * HOUR_W }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: '#fafafa', height: 32 }}>
                <div style={{ width: 200, minWidth: 200, borderRight: '1px solid var(--border)', padding: '0 1rem', display: 'flex', alignItems: 'center', fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', position: 'sticky', left: 0, background: '#fafafa', zIndex: 5 }}>ANIMATION</div>
                {TIMELINE_HOURS.map(h => (
                  <div key={h} style={{ width: HOUR_W, minWidth: HOUR_W, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, borderRight: '1px solid #f1f3f5' }}>{h}:00</div>
                ))}
              </div>
              {animations.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Aucune animation.</div>
              ) : animations.map((a, idx) => {
                const st = ANIM_STATUSES[a.status] || ANIM_STATUSES.planned;
                const x = timeToX(a.startTime);
                const endX = timeToX(a.endTime);
                const barW = Math.max(HOUR_W / 2, endX - x);
                const subs = a.subAnimations || [];
                const hasSubs = subs.some(s => s.startTime && s.endTime);
                const rowH = hasSubs ? 70 : 44;
                const rowBg = idx % 2 === 0 ? '#fff' : '#fafafa';
                return (
                  <div key={a.id} style={{ display: 'flex', borderBottom: '1px solid #f1f3f5', background: rowBg, minHeight: rowH }}>
                    <div style={{ width: 200, minWidth: 200, padding: '0 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, borderRight: '1px solid var(--border)', position: 'sticky', left: 0, background: rowBg, zIndex: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                      </div>
                      {subs.length > 0 && <span style={{ fontSize: '0.62rem', color: '#94a3b8', paddingLeft: 13 }}>{subs.length} sous-anim.</span>}
                    </div>
                    <div style={{ flex: 1, position: 'relative', minHeight: rowH }}>
                      {TIMELINE_HOURS.map((h, i) => <div key={h} style={{ position: 'absolute', left: i * HOUR_W, top: 0, bottom: 0, width: 1, background: '#f1f3f5' }} />)}
                      {a.startTime && a.endTime && (
                        <div style={{ position: 'absolute', left: x, width: barW, top: 6, height: 20, background: `${st.color}18`, border: `1.5px solid ${st.color}`, borderRadius: 5, display: 'flex', alignItems: 'center', paddingLeft: 6, fontSize: '0.6rem', fontWeight: 700, color: st.color, overflow: 'hidden', whiteSpace: 'nowrap', zIndex: 2 }}>
                          {a.startTime}–{a.endTime}
                        </div>
                      )}
                      {subs.filter(s => s.startTime && s.endTime).map(sub => {
                        const sx = timeToX(sub.startTime);
                        const sW = Math.max(HOUR_W / 3, timeToX(sub.endTime) - sx);
                        return (
                          <div key={sub.id} style={{ position: 'absolute', left: sx, width: sW, top: 32, height: 18, background: 'rgba(107,99,204,0.12)', border: '1.5px solid #6B63CC', borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 5, fontSize: '0.58rem', fontWeight: 700, color: '#6B63CC', overflow: 'hidden', whiteSpace: 'nowrap', zIndex: 3 }}>
                            {sub.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditing(null); }} title={editing ? "Modifier l'animation" : 'Nouvelle animation'} maxWidth="560px">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div><label style={labelStyle}>NOM *</label><input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>TYPE</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>{ANIM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
            </div>
          </div>
          <div><label style={labelStyle}>DESCRIPTION</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>STATUT</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>{Object.entries(ANIM_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
            </div>
            <div><label style={labelStyle}>CONTACT</label><input type="text" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
            <div><label style={labelStyle}>DATE</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>DÉBUT</label><input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>FIN</label><input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>BÉNÉVOLES</label><input type="number" min={0} value={form.volunteersNeeded} onChange={e => setForm(f => ({ ...f, volunteersNeeded: parseInt(e.target.value) || 0 }))} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><label style={labelStyle}>DURÉE (min)</label><input type="number" min={0} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 0 }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>COÛT (€)</label><input type="number" min={0} value={form.cost} onChange={e => setForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))} style={inputStyle} /></div>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '0.25rem' }}>{editing ? 'Mettre à jour' : 'Enregistrer'}</button>
        </form>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PROGRAMME (timeline groupé par catégorie)
// ════════════════════════════════════════════════════════════════
const EMPTY_PROG = { category: 'concert', title: '', description: '', date: '2026-06-06', startTime: '20:00', endTime: '21:00', status: 'confirmed', volunteerNeeds: [], materialNeeds: [], subItems: [] };

function ProgrammePanel() {
  const { data, addScheduleItem, updateItem, deleteItem, addSubItemToSchedule, deleteSubItem, syncScheduleMaterialToLogistics } = useEvent();
  const { push } = useNotifications();
  const schedule = data.poles.programming.schedule || [];
  const volunteers = data.poles.volunteers.list || [];

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeView, setActiveView] = useState('list');
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PROG);
  const [newVolNeed, setNewVolNeed] = useState({ role: '', count: 1, assignedIds: [] });
  const [newMatNeed, setNewMatNeed] = useState({ title: '', quantity: 1 });
  const [newSubItem, setNewSubItem] = useState({ time: '', description: '', responsible: '' });
  const [addingSubFor, setAddingSubFor] = useState(null);

  const filtered = schedule.filter(i => activeCategory === 'all' || i.category === activeCategory);
  const sorted = [...filtered].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const openAdd  = () => { setEditing(null); setForm(EMPTY_PROG); setIsModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...item, volunteerNeeds: item.volunteerNeeds || [], materialNeeds: item.materialNeeds || [], subItems: item.subItems || [] }); setIsModalOpen(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) updateItem('programming', 'schedule', editing.id, form);
    else addScheduleItem(form);
    const newMaterials = (form.materialNeeds || []).filter(mn => !data.poles.logistics.materials.some(m => (m.title || m.label || '').toLowerCase() === mn.title.toLowerCase()));
    newMaterials.forEach(mn => syncScheduleMaterialToLogistics(mn, form.category));
    if (newMaterials.length > 0) push({ id: `sync_mat_${Date.now()}`, type: 'success', title: 'Logistique synchronisée', message: `${newMaterials.length} matériel(s) ajouté(s)`, link: 'logistics' });
    setIsModalOpen(false); setEditing(null);
  };

  const addVolNeed = () => { if (!newVolNeed.role.trim()) return; setForm(f => ({ ...f, volunteerNeeds: [...f.volunteerNeeds, { ...newVolNeed }] })); setNewVolNeed({ role: '', count: 1, assignedIds: [] }); };
  const addMatNeed = () => { if (!newMatNeed.title.trim()) return; setForm(f => ({ ...f, materialNeeds: [...f.materialNeeds, { ...newMatNeed }] })); setNewMatNeed({ title: '', quantity: 1 }); };

  const submitSubItem = (scheduleId) => {
    if (!newSubItem.description.trim()) return;
    addSubItemToSchedule(scheduleId, newSubItem);
    setNewSubItem({ time: '', description: '', responsible: '' }); setAddingSubFor(null);
  };

  const volSuggestions = [...volunteers].sort((a, b) => {
    const sA = (a.inspiredPoles || []).some(p => p.toLowerCase().includes(form.category)) ? 1 : 0;
    const sB = (b.inspiredPoles || []).some(p => p.toLowerCase().includes(form.category)) ? 1 : 0;
    return sB - sA;
  });

  const toggleVolAssigned = (needIdx, volId) => {
    setForm(f => ({ ...f, volunteerNeeds: f.volunteerNeeds.map((n, i) => i !== needIdx ? n : { ...n, assignedIds: (n.assignedIds || []).includes(volId) ? (n.assignedIds || []).filter(id => id !== volId) : [...(n.assignedIds || []), volId] }) }));
  };

  // Group for timeline view
  const cats = PROG_CATEGORIES.filter(c => c.id !== 'all');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '3px', background: '#f1f3f5', borderRadius: 10, padding: '3px' }}>
          {PROG_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ padding: '0.35rem 0.875rem', borderRadius: 8, border: 'none', background: activeCategory === cat.id ? 'white' : 'transparent', color: activeCategory === cat.id ? (cat.color || '#1a1a1b') : '#64748b', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', boxShadow: activeCategory === cat.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>{cat.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '3px', background: '#f1f3f5', borderRadius: 10, padding: '3px' }}>
            {[{ id: 'list', label: 'Liste' }, { id: 'timeline', label: 'Timeline' }].map(v => (
              <button key={v.id} onClick={() => setActiveView(v.id)} style={{ padding: '0.35rem 0.875rem', borderRadius: 8, border: 'none', background: activeView === v.id ? 'white' : 'transparent', color: activeView === v.id ? '#1a1a1b' : '#64748b', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', boxShadow: activeView === v.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>{v.label}</button>
            ))}
          </div>
          <button onClick={openAdd} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}><Plus size={15} /> Ajouter</button>
        </div>
      </div>

      {/* LIST VIEW */}
      {activeView === 'list' && (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {sorted.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Aucun élément. <button onClick={openAdd} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 700 }}>+ Ajouter</button></div>
          ) : sorted.map((item, idx) => {
            const cat = PROG_CATEGORIES.find(c => c.id === item.category);
            const catColor = cat?.color || '#6366f1';
            const isExpanded = expandedId === item.id;
            const subItems = item.subItems || [];
            return (
              <div key={item.id} style={{ borderBottom: idx < sorted.length - 1 ? '1px solid #f1f3f5' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 1.25rem' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 4, background: catColor, flexShrink: 0 }} />
                  <button onClick={() => setExpandedId(isExpanded ? null : item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#94a3b8', flexShrink: 0 }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 100, flexShrink: 0 }}>
                    <Clock size={12} color="#94a3b8" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{item.startTime}</span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>→ {item.endTime}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{item.title}</span>
                      {cat && cat.id !== 'all' && <span style={{ background: `${catColor}18`, color: catColor, padding: '1px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700 }}>{cat.label}</span>}
                      <span style={{ ...PROG_STATUS_COLORS[item.status], padding: '1px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700 }}>{PROG_STATUS_LABELS[item.status]}</span>
                    </div>
                    {item.description && <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{item.description}</p>}
                  </div>
                  {subItems.length > 0 && <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: '#f1f3f5', padding: '1px 7px', borderRadius: 99, flexShrink: 0 }}>{subItems.length} étape{subItems.length > 1 ? 's' : ''}</span>}
                  <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                    <button onClick={() => openEdit(item)} style={{ padding: '5px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.color = '#475569'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}><Edit2 size={13} /></button>
                    <button onClick={() => deleteItem('programming', 'schedule', item.id)} style={{ padding: '5px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}><Trash2 size={13} /></button>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ background: '#fafafa', borderTop: '1px solid #f1f3f5', padding: '0.5rem 1.25rem 0.875rem 3rem' }}>
                    {subItems.length === 0 && <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Aucune étape.</p>}
                    {subItems.map((sub, si) => (
                      <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.375rem 0', borderBottom: si < subItems.length - 1 ? '1px dashed #e9ecef' : 'none' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
                        {sub.time && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', minWidth: 40 }}>{sub.time}</span>}
                        <span style={{ flex: 1, fontSize: '0.78rem', fontWeight: 600 }}>{sub.description}</span>
                        {sub.responsible && <span style={{ fontSize: '0.68rem', color: '#64748b' }}>👤 {sub.responsible}</span>}
                        <button onClick={() => deleteSubItem(item.id, sub.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 2 }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}><Trash2 size={11} /></button>
                      </div>
                    ))}
                    {addingSubFor === item.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="time" value={newSubItem.time} onChange={e => setNewSubItem(s => ({ ...s, time: e.target.value }))} style={{ ...inputStyle, width: 100 }} />
                        <input type="text" value={newSubItem.description} onChange={e => setNewSubItem(s => ({ ...s, description: e.target.value }))} placeholder="Description de l'étape" style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
                        <input type="text" value={newSubItem.responsible} onChange={e => setNewSubItem(s => ({ ...s, responsible: e.target.value }))} placeholder="Responsable" style={{ ...inputStyle, width: 120 }} />
                        <button onClick={() => submitSubItem(item.id)} style={{ padding: '0.5rem 0.875rem', background: '#1a1a1b', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>✓</button>
                        <button onClick={() => setAddingSubFor(null)} style={{ padding: '0.5rem', background: 'white', border: '1px solid #e9ecef', borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem', color: '#64748b' }}>✕</button>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingSubFor(item.id); setNewSubItem({ time: '', description: '', responsible: '' }); }} style={{ marginTop: '0.5rem', background: 'none', border: '1px dashed #e9ecef', borderRadius: 7, padding: '0.35rem 0.875rem', cursor: 'pointer', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600 }}>
                        + Étape
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TIMELINE VIEW — grouped by category */}
      {activeView === 'timeline' && (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 200 + TIMELINE_HOURS.length * HOUR_W }}>
              {/* Hour header */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: '#fafafa', height: 32 }}>
                <div style={{ width: 200, minWidth: 200, borderRight: '1px solid var(--border)', padding: '0 1rem', display: 'flex', alignItems: 'center', fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', position: 'sticky', left: 0, background: '#fafafa', zIndex: 5 }}>PROGRAMME</div>
                {TIMELINE_HOURS.map(h => (
                  <div key={h} style={{ width: HOUR_W, minWidth: HOUR_W, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, borderRight: '1px solid #f1f3f5' }}>{h}:00</div>
                ))}
              </div>

              {/* Grouped rows */}
              {cats.map(cat => {
                const catItems = [...schedule.filter(i => i.category === cat.id)].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
                if (catItems.length === 0 && activeCategory !== 'all' && activeCategory !== cat.id) return null;
                if (activeCategory !== 'all' && activeCategory !== cat.id) return null;
                return (
                  <React.Fragment key={cat.id}>
                    {/* Category header */}
                    <div style={{ display: 'flex', height: 28, background: `${cat.color}10`, borderBottom: '1px solid #f1f3f5' }}>
                      <div style={{ width: 200, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: '1rem', borderRight: '1px solid var(--border)', position: 'sticky', left: 0, background: `${cat.color}10`, zIndex: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color }} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cat.label}</span>
                        <span style={{ marginLeft: 'auto', marginRight: '0.5rem', fontSize: '0.62rem', fontWeight: 700, color: cat.color, background: `${cat.color}20`, borderRadius: 99, padding: '0px 7px' }}>{catItems.length}</span>
                      </div>
                      <div style={{ flex: 1 }} />
                    </div>
                    {/* Items in category */}
                    {catItems.length === 0 ? (
                      <div style={{ display: 'flex', height: 36, borderBottom: '1px solid #f1f3f5' }}>
                        <div style={{ width: 200, minWidth: 200, padding: '0 1rem', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border)', position: 'sticky', left: 0, background: 'white', zIndex: 3 }}>
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic' }}>Aucun élément</span>
                        </div>
                        <div style={{ flex: 1 }} />
                      </div>
                    ) : catItems.map((item, idx) => {
                      const x = timeToX(item.startTime);
                      const endX = timeToX(item.endTime);
                      const barW = Math.max(HOUR_W / 2, endX - x);
                      const rowBg = idx % 2 === 0 ? '#fff' : '#fafafa';
                      return (
                        <div key={item.id} style={{ display: 'flex', height: 42, borderBottom: '1px solid #f1f3f5', background: rowBg }}>
                          <div style={{ width: 200, minWidth: 200, padding: '0 0.75rem 0 1.5rem', fontSize: '0.78rem', fontWeight: 600, borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', position: 'sticky', left: 0, background: rowBg, zIndex: 3, gap: 6 }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                          </div>
                          <div style={{ flex: 1, position: 'relative' }}>
                            {TIMELINE_HOURS.map((h, i) => <div key={h} style={{ position: 'absolute', left: i * HOUR_W, top: 0, bottom: 0, width: 1, background: '#f1f3f5' }} />)}
                            <div onClick={() => openEdit(item)} style={{ position: 'absolute', left: x, width: barW, top: 6, bottom: 6, background: `${cat.color}18`, border: `1.5px solid ${cat.color}`, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 8, fontSize: '0.62rem', fontWeight: 700, color: cat.color, overflow: 'hidden', whiteSpace: 'nowrap', zIndex: 2 }}>
                              {item.startTime}–{item.endTime}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              {schedule.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Aucun élément.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditing(null); }} title={editing ? 'Modifier' : 'Ajouter au programme'} maxWidth="620px">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>CATÉGORIE</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {PROG_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                <button key={cat.id} type="button" onClick={() => setForm(f => ({ ...f, category: cat.id }))} style={{ padding: '0.4rem 1rem', borderRadius: 8, border: `1.5px solid ${form.category === cat.id ? cat.color : '#e9ecef'}`, background: form.category === cat.id ? `${cat.color}12` : 'white', color: form.category === cat.id ? cat.color : '#64748b', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div><label style={labelStyle}>TITRE *</label><input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>DESCRIPTION</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr', gap: '0.75rem' }}>
            <div><label style={labelStyle}>DATE</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>DÉBUT</label><input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>FIN</label><input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>STATUT</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                {PROG_STATUSES.map(s => <option key={s} value={s}>{PROG_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          {/* Volunteer needs */}
          <div>
            <label style={labelStyle}>BESOINS BÉNÉVOLES</label>
            <div style={{ border: '1px solid #e9ecef', borderRadius: 8, overflow: 'hidden' }}>
              {form.volunteerNeeds.map((vn, i) => (
                <div key={i} style={{ padding: '0.5rem 0.875rem', borderBottom: '1px solid #f1f3f5', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600 }}>{vn.role}</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{vn.count} pers.</span>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {volSuggestions.map(v => {
                      const assigned = (vn.assignedIds || []).includes(v.id);
                      const inspired = (v.inspiredPoles || []).some(p => p.toLowerCase().includes(form.category));
                      return (
                        <button key={v.id} type="button" onClick={() => toggleVolAssigned(i, v.id)} title={v.name} style={{ width: 22, height: 22, borderRadius: '50%', fontSize: '0.55rem', fontWeight: 800, border: assigned ? '2px solid #3b82f6' : inspired ? '2px solid #bfdbfe' : '2px solid #e9ecef', background: assigned ? '#3b82f6' : inspired ? '#eff6ff' : '#f8f9fa', color: assigned ? 'white' : '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {v.name.slice(0, 1)}
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => setForm(f => ({ ...f, volunteerNeeds: f.volunteerNeeds.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}><Trash2 size={11} /></button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0.875rem' }}>
                <input type="text" value={newVolNeed.role} onChange={e => setNewVolNeed(n => ({ ...n, role: e.target.value }))} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVolNeed())} placeholder="Rôle" style={{ ...inputStyle, flex: 1 }} />
                <input type="number" value={newVolNeed.count} min={1} onChange={e => setNewVolNeed(n => ({ ...n, count: parseInt(e.target.value) || 1 }))} style={{ ...inputStyle, width: 52 }} />
                <button type="button" onClick={addVolNeed} style={{ padding: '0.45rem 0.75rem', background: '#f1f3f5', border: '1px solid #e9ecef', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>+ Ajouter</button>
              </div>
            </div>
          </div>
          {/* Material needs */}
          <div>
            <label style={labelStyle}>BESOINS MATÉRIELS <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.62rem', textTransform: 'none' }}>→ ajoutés à la logistique</span></label>
            <div style={{ border: '1px solid #e9ecef', borderRadius: 8, overflow: 'hidden' }}>
              {form.materialNeeds.map((mn, i) => (
                <div key={i} style={{ padding: '0.5rem 0.875rem', borderBottom: '1px solid #f1f3f5', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600 }}>{mn.title}</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>×{mn.quantity}</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, materialNeeds: f.materialNeeds.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}><Trash2 size={11} /></button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0.875rem' }}>
                <input type="text" value={newMatNeed.title} onChange={e => setNewMatNeed(n => ({ ...n, title: e.target.value }))} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMatNeed())} placeholder="Matériel" style={{ ...inputStyle, flex: 1 }} />
                <input type="number" value={newMatNeed.quantity} min={1} onChange={e => setNewMatNeed(n => ({ ...n, quantity: parseInt(e.target.value) || 1 }))} style={{ ...inputStyle, width: 52 }} />
                <button type="button" onClick={addMatNeed} style={{ padding: '0.45rem 0.75rem', background: '#f1f3f5', border: '1px solid #e9ecef', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>+ Ajouter</button>
              </div>
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '0.25rem' }}>{editing ? 'Mettre à jour' : 'Enregistrer'}</button>
        </form>
      </Modal>
    </div>
  );
}
