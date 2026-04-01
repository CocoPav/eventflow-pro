import React, { useState, useRef, useCallback } from 'react';
import { useEvent, POLES } from '../../context/EventContext';
import { Plus, Trash2, Edit2, CheckCircle2, Clock, FileText, Users, MapPin, ChevronRight, X, ArrowLeft } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import NotionEditor from '../../components/shared/NotionEditor';

// ── Constants ─────────────────────────────────────────────────
const POLE_COLORS = {
  Budget:        { bg: '#eff6ff', color: '#2563eb' },
  Communication: { bg: '#f0fdf4', color: '#16a34a' },
  Logistique:    { bg: '#fffbeb', color: '#d97706' },
  Bénévoles:     { bg: '#fdf4ff', color: '#9333ea' },
  Concert:       { bg: '#fff1f2', color: '#e11d48' },
  Animation:     { bg: '#fff7ed', color: '#ea580c' },
  Programme:     { bg: '#f0f9ff', color: '#0284c7' },
  Sécurité:      { bg: '#fef2f2', color: '#dc2626' },
  Général:       { bg: '#f8f9fa', color: '#475569' },
};

const inputStyle = {
  width: '100%', padding: '0.6rem 0.875rem', borderRadius: 8,
  background: '#f8f9fa', border: '1px solid #e9ecef', color: '#1a1a1b',
  fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
};
const labelStyle = {
  display: 'block', fontSize: '0.65rem', fontWeight: 700,
  color: '#64748b', marginBottom: '0.3rem', letterSpacing: '0.04em',
};

const EMPTY_MEETING  = { date: new Date().toISOString().split('T')[0], title: '', location: '', participants: '', notes: '', status: 'done' };
const EMPTY_DECISION = { text: '', pole: 'Général', responsible: '', deadline: '', status: 'open' };

// ── Small helpers ─────────────────────────────────────────────
function PoleBadge({ pole }) {
  const s = POLE_COLORS[pole] || POLE_COLORS.Général;
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700 }}>
      {pole}
    </span>
  );
}

function DecisionRow({ d, meetingId, onUpdate, onDelete }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid #f1f3f5' }}>
      <button
        onClick={() => onUpdate(meetingId, d.id, { status: d.status === 'done' ? 'open' : 'done' })}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0, marginTop: 1 }}
      >
        {d.status === 'done'
          ? <CheckCircle2 size={16} color="#10b981" />
          : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: d.status === 'done' ? '#94a3b8' : '#1a1a1b', textDecoration: d.status === 'done' ? 'line-through' : 'none' }}>
          {d.text}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <PoleBadge pole={d.pole} />
          {d.responsible && <span style={{ fontSize: '0.68rem', color: '#64748b' }}>👤 {d.responsible}</span>}
          {d.deadline && <span style={{ fontSize: '0.68rem', color: new Date(d.deadline) < new Date() && d.status !== 'done' ? '#ef4444' : '#94a3b8' }}>📅 {d.deadline}</span>}
        </div>
      </div>
      <button onClick={() => onDelete(meetingId, d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 2, flexShrink: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
        onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
      >
        <X size={13} />
      </button>
    </div>
  );
}

function QuickAddDecision({ meetingId, onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_DECISION);
  const sty = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 7, background: '#f8f9fa', border: '1px solid #e9ecef', color: '#1a1a1b', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' };

  const submit = () => {
    if (!form.text.trim()) return;
    onAdd(meetingId, form);
    setForm(EMPTY_DECISION);
    setOpen(false);
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ marginTop: '0.5rem', background: 'none', border: '1px dashed #e9ecef', borderRadius: 8, padding: '0.5rem 0.875rem', cursor: 'pointer', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, width: '100%', textAlign: 'left' }}>
      + Ajouter une décision
    </button>
  );

  return (
    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <input type="text" value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} placeholder="Décision…" style={sty} autoFocus onKeyDown={e => e.key === 'Enter' && submit()} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.5rem' }}>
        <select value={form.pole} onChange={e => setForm(f => ({ ...f, pole: e.target.value }))} style={sty}>
          {POLES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input type="text" value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} placeholder="Responsable" style={sty} />
        <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} style={sty} />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={submit} style={{ flex: 1, padding: '0.45rem', background: '#1a1a1b', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>Enregistrer</button>
        <button onClick={() => setOpen(false)} style={{ padding: '0.45rem 0.875rem', background: 'white', color: '#64748b', border: '1px solid #e9ecef', borderRadius: 7, cursor: 'pointer', fontSize: '0.75rem' }}>Annuler</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// DOCUMENT VIEW — Notion-like page for one meeting
// ════════════════════════════════════════════════════════════════
function MeetingDocument({ meeting, onBack, onUpdate, onUpdateDecision, onDeleteDecision, onAddDecision, onDelete, onOpenEditModal, mentionItems }) {
  const saveTimer = useRef(null);

  const saveContent = useCallback((html) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onUpdate(meeting.id, { content: html });
    }, 600);
  }, [meeting.id, onUpdate]);

  // Migrate legacy `notes` → editor content on first open
  const initialContent = meeting.content !== undefined
    ? meeting.content
    : (meeting.notes ? `<p>${meeting.notes}</p>` : '');

  const openCount = (meeting.decisions || []).filter(d => d.status === 'open').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem' }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', padding: '0.35rem 0.6rem', borderRadius: 7, transition: 'background 0.1s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f1f3f5'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <ArrowLeft size={14} /> Réunions
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onOpenEditModal} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.35rem 0.875rem', borderRadius: 8, background: 'transparent', border: '1px solid #e9ecef', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f3f5'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Edit2 size={13} /> Modifier les infos
          </button>
          <button onClick={onDelete} style={{ padding: '0.35rem 0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid #fee2e2', color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* ── Document body ── */}
      <div style={{ maxWidth: 720, width: '100%', margin: '0 auto' }}>

        {/* Title */}
        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#111827', margin: '0 0 1rem', lineHeight: 1.2 }}>
          {meeting.title}
        </h1>

        {/* Metadata */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f1f3f5' }}>
          <MetaItem icon={<Clock size={13} />} label="Date">
            <span style={{ color: '#1a1a1b', fontWeight: 600 }}>
              {new Date(meeting.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </MetaItem>
          {meeting.location && (
            <MetaItem icon={<MapPin size={13} />} label="Lieu">
              <span style={{ color: '#1a1a1b', fontWeight: 600 }}>{meeting.location}</span>
            </MetaItem>
          )}
          {(meeting.participants || []).length > 0 && (
            <MetaItem icon={<Users size={13} />} label="Participants">
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {(meeting.participants || []).map(p => (
                  <span key={p} style={{ background: '#f1f3f5', color: '#374151', padding: '2px 10px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 600 }}>
                    {p}
                  </span>
                ))}
              </div>
            </MetaItem>
          )}
          <span style={{
            background: meeting.status === 'done' ? '#f0fdf4' : '#fffbeb',
            color: meeting.status === 'done' ? '#16a34a' : '#d97706',
            padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
          }}>
            {meeting.status === 'done' ? '✓ Tenue' : '⏳ À venir'}
          </span>
        </div>

        {/* ── Rich text body ── */}
        <NotionEditor
          content={initialContent}
          onChange={saveContent}
          placeholder="Commencez à écrire les notes de la réunion… tapez / pour insérer un bloc, @ pour mentionner."
          mentionItems={mentionItems}
        />

        {/* ── Decisions section ── */}
        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f3f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1a1a1b' }}>
              Décisions
            </h2>
            {openCount > 0 && (
              <span style={{ background: '#fef2f2', color: '#dc2626', padding: '1px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700 }}>
                {openCount} ouverte{openCount > 1 ? 's' : ''}
              </span>
            )}
            {(meeting.decisions || []).filter(d => d.status === 'done').length > 0 && (
              <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '1px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700 }}>
                {(meeting.decisions || []).filter(d => d.status === 'done').length} ✓
              </span>
            )}
          </div>

          {(meeting.decisions || []).length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>Aucune décision enregistrée.</p>
          ) : (meeting.decisions || []).map(d => (
            <DecisionRow key={d.id} d={d} meetingId={meeting.id} onUpdate={onUpdateDecision} onDelete={onDeleteDecision} />
          ))}
          <QuickAddDecision meetingId={meeting.id} onAdd={onAddDecision} />
        </div>
      </div>
    </div>
  );
}

function MetaItem({ icon, label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
      <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {icon} <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
      </span>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN VIEW — Meeting list
// ════════════════════════════════════════════════════════════════
export default function MeetingsView() {
  const { data, addMeeting, updateMeeting, deleteMeeting, addDecisionToMeeting, updateDecision, deleteDecision } = useEvent();
  const entries = data.poles.meetings?.entries || [];

  const [openMeetingId, setOpenMeetingId] = useState(null);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [form, setForm]         = useState(EMPTY_MEETING);
  const [decisions, setDecisions] = useState([]);
  const [newDecision, setNewDecision] = useState(EMPTY_DECISION);

  // CR modal
  const [showCR, setShowCR]       = useState(false);
  const [crFilter, setCrFilter]   = useState('all');

  // Computed
  const allDecisions = entries.flatMap(m => (m.decisions || []).map(d => ({ ...d, meetingTitle: m.title, meetingDate: m.date, meetingId: m.id })));
  const openDecisions = allDecisions.filter(d => d.status === 'open');
  const uniquePoles   = [...new Set(allDecisions.map(d => d.pole))];
  const filteredDecisions = crFilter === 'all' ? allDecisions : allDecisions.filter(d => d.pole === crFilter);

  const openAdd = () => {
    setEditingMeeting(null);
    setForm(EMPTY_MEETING);
    setDecisions([]);
    setIsModalOpen(true);
  };

  const openEdit = (meeting) => {
    setEditingMeeting(meeting);
    setForm({
      date: meeting.date, title: meeting.title,
      location: meeting.location || '',
      participants: (meeting.participants || []).join(', '),
      notes: meeting.notes || '',
      status: meeting.status || 'done',
    });
    setDecisions(meeting.decisions ? [...meeting.decisions] : []);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const meetingData = {
      ...form,
      participants: form.participants.split(',').map(p => p.trim()).filter(Boolean),
      decisions,
    };
    if (editingMeeting) {
      updateMeeting(editingMeeting.id, meetingData);
    } else {
      addMeeting(meetingData);
    }
    setIsModalOpen(false);
    setEditingMeeting(null);
  };

  const addDecisionToForm = () => {
    if (!newDecision.text.trim()) return;
    setDecisions(d => [...d, { ...newDecision, id: `temp_${Date.now()}` }]);
    setNewDecision(EMPTY_DECISION);
  };

  const openMeeting = entries.find(m => m.id === openMeetingId);

  // Build mention items from team + POLES for the editor
  const team = data.eventAdmin?.team || [];
  const mentionItems = [
    ...team.map(m => ({ id: m.id, label: m.name, type: 'person', sub: m.role })),
    ...POLES.map(p => ({ id: `pole_${p}`, label: p, type: 'service', sub: 'Service' })),
  ];

  // Modal form JSX — shared between list & document view
  const modalForm = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div><label style={labelStyle}>DATE *</label><input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>LIEU</label><input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={inputStyle} placeholder="Ex: Salle des fêtes, Visio…" /></div>
      </div>
      <div><label style={labelStyle}>TITRE *</label><input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} placeholder="Ex: Réunion Orga #5" /></div>
      <div>
        <label style={labelStyle}>PARTICIPANTS <span style={{ fontWeight: 400, color: '#94a3b8' }}>(séparés par virgule)</span></label>
        <input type="text" value={form.participants} onChange={e => setForm(f => ({ ...f, participants: e.target.value }))} style={inputStyle} placeholder="Corentin, Ophélie, Malo…" />
      </div>
      <div>
        <label style={labelStyle}>STATUT</label>
        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
          <option value="done">✓ Tenue</option>
          <option value="open">⏳ À venir</option>
        </select>
      </div>
      {!editingMeeting?.id || !openMeetingId ? (
        <div>
          <label style={labelStyle}>DÉCISIONS</label>
          <div style={{ border: '1px solid #e9ecef', borderRadius: 8, overflow: 'hidden' }}>
            {decisions.map((d, i) => (
              <div key={d.id || i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.875rem', borderBottom: '1px solid #f1f3f5' }}>
                <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600 }}>{d.text}</span>
                <PoleBadge pole={d.pole} />
                {d.responsible && <span style={{ fontSize: '0.68rem', color: '#64748b' }}>👤 {d.responsible}</span>}
                <button type="button" onClick={() => setDecisions(dd => dd.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}><X size={12} /></button>
              </div>
            ))}
            <div style={{ padding: '0.75rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input type="text" value={newDecision.text} onChange={e => setNewDecision(d => ({ ...d, text: e.target.value }))} placeholder="Texte de la décision…" style={inputStyle} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDecisionToForm())} />
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.5rem' }}>
                <select value={newDecision.pole} onChange={e => setNewDecision(d => ({ ...d, pole: e.target.value }))} style={inputStyle}>
                  {POLES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input type="text" value={newDecision.responsible} onChange={e => setNewDecision(d => ({ ...d, responsible: e.target.value }))} placeholder="Responsable" style={inputStyle} />
                <input type="date" value={newDecision.deadline} onChange={e => setNewDecision(d => ({ ...d, deadline: e.target.value }))} style={inputStyle} />
              </div>
              <button type="button" onClick={addDecisionToForm} style={{ background: '#f1f3f5', border: '1px solid #e9ecef', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>+ Ajouter la décision</button>
            </div>
          </div>
        </div>
      ) : null}
      <button type="submit" className="btn-primary">{editingMeeting ? 'Mettre à jour' : 'Enregistrer la réunion'}</button>
    </form>
  );

  // ── Always render both views + modals ──────────────────────
  return (
    <>
    {openMeetingId && openMeeting ? (
      <MeetingDocument
        meeting={openMeeting}
        onBack={() => setOpenMeetingId(null)}
        onUpdate={updateMeeting}
        onUpdateDecision={updateDecision}
        onDeleteDecision={deleteDecision}
        onAddDecision={addDecisionToMeeting}
        onDelete={() => { deleteMeeting(openMeeting.id); setOpenMeetingId(null); }}
        onOpenEditModal={() => openEdit(openMeeting)}
        mentionItems={mentionItems}
      />
    ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ background: '#fef2f2', color: '#dc2626', padding: '0.4rem 0.875rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700 }}>
            {openDecisions.length} décision{openDecisions.length !== 1 ? 's' : ''} en attente
          </span>
          <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '0.4rem 0.875rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700 }}>
            {allDecisions.filter(d => d.status === 'done').length} complétées
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowCR(true)} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={14} /> Compte rendu
          </button>
          <button onClick={openAdd} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}>
            <Plus size={15} /> Nouvelle réunion
          </button>
        </div>
      </div>

      {/* Meeting cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {entries.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            Aucune réunion.{' '}
            <button onClick={openAdd} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 700 }}>+ Créer</button>
          </div>
        ) : [...entries].sort((a, b) => new Date(b.date) - new Date(a.date)).map(meeting => {
          const openC = (meeting.decisions || []).filter(d => d.status === 'open').length;
          const doneC = (meeting.decisions || []).filter(d => d.status === 'done').length;
          return (
            <div
              key={meeting.id}
              className="card"
              style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onClick={() => setOpenMeetingId(meeting.id)}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
            >
              {/* Date badge */}
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--primary)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.05em' }}>{new Date(meeting.date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, lineHeight: 1 }}>{new Date(meeting.date).getDate()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 3 }}>{meeting.title}</p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {meeting.location && <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} /> {meeting.location}</span>}
                  {(meeting.participants || []).length > 0 && <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}><Users size={10} /> {meeting.participants.join(', ')}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {openC > 0 && <span style={{ background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700 }}>{openC} ouverte{openC > 1 ? 's' : ''}</span>}
                {doneC > 0 && <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700 }}>{doneC} ✓</span>}
              </div>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => openEdit(meeting)} style={{ padding: '5px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 6 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                  onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                >
                  <Edit2 size={13} />
                </button>
                <button onClick={() => deleteMeeting(meeting.id)} style={{ padding: '5px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 6 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                >
                  <Trash2 size={13} />
                </button>
                <ChevronRight size={15} color="#cbd5e1" />
              </div>
            </div>
          );
        })}
      </div>

    </div>
    )}

    {/* ── ADD / EDIT MODAL — always mounted ── */}
    <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingMeeting(null); }} title={editingMeeting ? 'Modifier la réunion' : 'Nouvelle réunion'} maxWidth="620px">
      {modalForm}
    </Modal>

    {/* ── COMPTE RENDU MODAL ── */}
    <Modal isOpen={showCR} onClose={() => setShowCR(false)} title="Compte Rendu Global" maxWidth="680px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', background: '#f1f3f5', borderRadius: 10, padding: '3px' }}>
          <button onClick={() => setCrFilter('all')} style={{ padding: '0.35rem 0.875rem', borderRadius: 8, border: 'none', background: crFilter === 'all' ? 'white' : 'transparent', color: crFilter === 'all' ? '#1a1a1b' : '#64748b', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', boxShadow: crFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            Tous ({allDecisions.length})
          </button>
          {uniquePoles.map(pole => (
            <button key={pole} onClick={() => setCrFilter(pole)} style={{ padding: '0.35rem 0.875rem', borderRadius: 8, border: 'none', background: crFilter === pole ? 'white' : 'transparent', color: crFilter === pole ? '#1a1a1b' : '#64748b', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', boxShadow: crFilter === pole ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {pole} ({allDecisions.filter(d => d.pole === pole).length})
            </button>
          ))}
        </div>
        {filteredDecisions.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Aucune décision pour ce filtre.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {entries.map(meeting => {
              const mDec = filteredDecisions.filter(d => d.meetingId === meeting.id);
              if (mDec.length === 0) return null;
              return (
                <div key={meeting.id}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    {meeting.date} — {meeting.title}
                  </p>
                  {mDec.map(d => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f1f3f5' }}>
                      {d.status === 'done' ? <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} /> : <Clock size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: d.status === 'done' ? '#94a3b8' : '#1a1a1b', textDecoration: d.status === 'done' ? 'line-through' : 'none' }}>{d.text}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 3, flexWrap: 'wrap' }}>
                          <PoleBadge pole={d.pole} />
                          {d.responsible && <span style={{ fontSize: '0.65rem', color: '#64748b' }}>👤 {d.responsible}</span>}
                          {d.deadline && <span style={{ fontSize: '0.65rem', color: new Date(d.deadline) < new Date() && d.status !== 'done' ? '#ef4444' : '#94a3b8' }}>📅 {d.deadline}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
        <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: '#1a1a1b', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>
          <FileText size={15} /> Imprimer / Exporter
        </button>
      </div>
    </Modal>
    </>
  );
}
