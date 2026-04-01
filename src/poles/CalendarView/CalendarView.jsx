import React, { useState, useMemo } from 'react';
import { useEvent } from '../../context/EventContext';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, addMonths, subMonths,
  isSameMonth, isToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X, Plus, Users, Trash2 } from 'lucide-react';

// ── Styles ────────────────────────────────────────────────────────────────────

const POLE_STYLES = {
  communication: { color: '#3b82f6', bg: '#eff6ff',  label: 'Comm' },
  meeting:       { color: '#8b5cf6', bg: '#f5f3ff',  label: 'Réunion' },
  concert:       { color: '#ec4899', bg: '#fdf2f8',  label: 'Concert' },
  animation:     { color: '#10b981', bg: '#f0fdf4',  label: 'Animation' },
  programme:     { color: '#f59e0b', bg: '#fffbeb',  label: 'Programme' },
  logistics:     { color: '#f97316', bg: '#fff7ed',  label: 'Logistique' },
  event:         { color: '#6366f1', bg: '#eef2ff',  label: 'Événement' },
  deadline:      { color: '#ef4444', bg: '#fef2f2',  label: 'Deadline' },
};

const EVENT_TYPES = [
  { value: 'event',    label: 'Événement' },
  { value: 'meeting',  label: 'Point d\'orga' },
  { value: 'deadline', label: 'Deadline' },
];

const AVAIL = { yes: '#10b981', no: '#ef4444' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPeople(data) {
  const people = [data.user.name];
  const firstNames = new Set([data.user.name.split(' ')[0].toLowerCase()]);

  (data.poles.volunteers.list || []).forEach(v => {
    const fn = v.name.split(' ')[0].toLowerCase();
    if (!firstNames.has(fn)) { people.push(v.name); firstNames.add(fn); }
  });
  (data.poles.meetings.entries || []).forEach(m => {
    (m.participants || []).forEach(p => {
      const fn = p.split(' ')[0].toLowerCase();
      if (!firstNames.has(fn)) { people.push(p); firstNames.add(fn); }
    });
  });
  return people;
}

function cycleAvail(current) {
  if (!current) return 'yes';
  if (current === 'yes') return 'no';
  return undefined;
}

function buildEvents(data) {
  const events = [];
  (data.poles.communication.tasks || []).forEach(t => {
    if (t.dueDate) events.push({ id: `com-${t.id}`, date: t.dueDate, title: t.title, pole: 'communication', sub: t.assignee, isCustom: false });
  });
  (data.poles.meetings.entries || []).forEach(m => {
    if (m.date) events.push({ id: `meet-${m.id}`, date: m.date, title: m.title, pole: 'meeting', sub: m.location, isCustom: false });
  });
  (data.poles.programming.artists || []).filter(a => a.performanceDate).forEach(a => {
    events.push({ id: `art-${a.id}`, date: a.performanceDate, title: a.name, pole: 'concert', sub: a.startTime || a.genre, isCustom: false });
  });
  (data.poles.programming.animations || []).filter(a => a.date).forEach(a => {
    events.push({ id: `ani-${a.id}`, date: a.date, title: a.name, pole: 'animation', sub: a.startTime ? `${a.startTime}–${a.endTime}` : a.type, isCustom: false });
  });
  (data.poles.programming.schedule || []).filter(s => s.date).forEach(s => {
    const pole = s.category === 'concert' ? 'concert' : s.category === 'animation' ? 'animation' : 'programme';
    events.push({ id: `sch-${s.id}`, date: s.date, title: s.title, pole, sub: s.startTime ? `${s.startTime}–${s.endTime}` : '', isCustom: false });
  });
  (data.poles.logistics.materials || []).filter(m => m.installDate).forEach(m => {
    events.push({ id: `log-${m.id}`, date: m.installDate, title: m.title || m.label, pole: 'logistics', sub: 'Installation', isCustom: false });
  });
  ((data.poles.calendar || {}).events || []).forEach(ev => {
    events.push({ id: `cal-${ev.id}`, date: ev.date, title: ev.title, pole: ev.type || 'event', sub: ev.time || ev.description || '', isCustom: true, calId: ev.id });
  });
  return events;
}

// ── AddEventModal ─────────────────────────────────────────────────────────────

function AddEventModal({ date, onSave, onClose }) {
  const [form, setForm] = useState({ title: '', type: 'event', time: '', description: '' });
  const canSave = form.title.trim();
  const dateLabel = format(new Date(date + 'T12:00'), 'EEEE d MMMM', { locale: fr });

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', width: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', margin: 0 }}>Ajouter un événement</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0', textTransform: 'capitalize' }}>{dateLabel}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Titre *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && canSave && onSave({ ...form, date })}
              placeholder="Ex : Réunion budget"
              autoFocus
              style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {/* Type */}
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Type</label>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {EVENT_TYPES.map(t => {
                const st = POLE_STYLES[t.value];
                const active = form.type === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    style={{ flex: 1, padding: '0.4rem 0.25rem', borderRadius: 8, border: `2px solid ${active ? st.color : 'var(--border)'}`, background: active ? st.bg : 'white', color: active ? st.color : 'var(--text-muted)', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', transition: 'all 0.12s' }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time */}
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Heure (optionnel)</label>
            <input
              type="time"
              value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
              style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Note (optionnel)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Détails…"
              rows={2}
              style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
            Annuler
          </button>
          <button
            onClick={() => canSave && onSave({ ...form, date })}
            disabled={!canSave}
            style={{ flex: 2, padding: '0.6rem', borderRadius: 8, border: 'none', background: canSave ? '#6366f1' : '#c7d2fe', color: 'white', cursor: canSave ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.875rem' }}
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EventPill ─────────────────────────────────────────────────────────────────

function EventPill({ event, onDelete }) {
  const st = POLE_STYLES[event.pole] || POLE_STYLES.communication;
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', background: st.bg, border: `1px solid ${st.color}25`, borderLeft: `3px solid ${st.color}`, borderRadius: 5, padding: '2px 4px 2px 5px', fontSize: '0.62rem', fontWeight: 600, color: st.color, gap: 2 }}>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</span>
      {event.isCustom && onDelete && (
        <button onClick={e => { e.stopPropagation(); onDelete(event.calId); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: st.color, opacity: 0.55, display: 'flex', padding: 0, flexShrink: 0 }}>
          <X size={9} />
        </button>
      )}
    </div>
  );
}

// ── AvailabilityCalendar ──────────────────────────────────────────────────────

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function AvailabilityCalendar({ me, allDays, monthDays, availability, onToggle, currentDate, onPrev, onNext }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const myAvail = availability[me] || {};

  const daysAvailable = monthDays.filter(d => myAvail[format(d, 'yyyy-MM-dd')] === 'yes').length;
  const daysUnavailable = monthDays.filter(d => myAvail[format(d, 'yyyy-MM-dd')] === 'no').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header: navigation + stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={onPrev} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={16} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0, textTransform: 'capitalize' }}>
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <button onClick={onNext} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 12, background: '#dcfce7', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.9rem', fontWeight: 900 }}>✓</div>
          <div>
            <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803d', margin: 0, lineHeight: 1 }}>{daysAvailable}</p>
            <p style={{ fontSize: '0.65rem', color: '#15803d', margin: '2px 0 0', fontWeight: 600 }}>Jours disponibles</p>
          </div>
        </div>
        <div style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 12, background: '#fee2e2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.9rem', fontWeight: 900 }}>✗</div>
          <div>
            <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#b91c1c', margin: 0, lineHeight: 1 }}>{daysUnavailable}</p>
            <p style={{ fontSize: '0.65rem', color: '#b91c1c', margin: '2px 0 0', fontWeight: 600 }}>Jours indisponibles</p>
          </div>
        </div>
        <div style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 12, background: '#f8f9fa', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 900 }}>?</div>
          <div>
            <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, lineHeight: 1 }}>{monthDays.length - daysAvailable - daysUnavailable}</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '2px 0 0', fontWeight: 600 }}>Non renseignés</p>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8f9fa', borderBottom: '1px solid var(--border)' }}>
          {DAYS_FR.map((d, i) => (
            <div key={d} style={{ padding: '0.75rem 0', textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, color: i >= 5 ? '#94a3b8' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {allDays.map(day => {
            const d = format(day, 'yyyy-MM-dd');
            const inMonth = isSameMonth(day, currentDate);
            const isToday_ = d === todayStr;
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const avail = inMonth ? myAvail[d] : null;

            const cellBg = !inMonth
              ? '#fafafa'
              : avail === 'yes'
              ? '#f0fdf4'
              : avail === 'no'
              ? '#fff5f5'
              : isToday_ ? '#fefce8' : 'white';

            return (
              <div
                key={d}
                onClick={() => inMonth && onToggle(me, d)}
                style={{
                  minHeight: 80,
                  borderRight: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  padding: '0.5rem',
                  background: cellBg,
                  cursor: inMonth ? 'pointer' : 'default',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  transition: 'background 0.12s',
                  position: 'relative',
                  userSelect: 'none',
                }}
                onMouseEnter={e => { if (inMonth && !avail) e.currentTarget.style.background = '#f0fdf4'; }}
                onMouseLeave={e => { if (inMonth && !avail) e.currentTarget.style.background = isToday_ ? '#fefce8' : 'white'; }}
              >
                {/* Day number */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: isToday_ ? '#6366f1' : 'transparent',
                  color: !inMonth ? '#c0c9d4' : isToday_ ? 'white' : isWeekend ? '#64748b' : 'var(--text-main)',
                  fontSize: '0.82rem', fontWeight: isToday_ ? 800 : 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {format(day, 'd')}
                </div>

                {/* Availability indicator */}
                {inMonth && avail && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: avail === 'yes' ? '#16a34a' : '#dc2626',
                    color: 'white', fontSize: '0.9rem', fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 2px 8px ${avail === 'yes' ? '#16a34a' : '#dc2626'}40`,
                  }}>
                    {avail === 'yes' ? '✓' : '✗'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'center' }}>
        {[
          { bg: '#f0fdf4', icon: '✓', iconBg: '#16a34a', text: 'Disponible' },
          { bg: '#fff5f5', icon: '✗', iconBg: '#dc2626', text: 'Indisponible' },
          { bg: 'white',   icon: '·',  iconBg: '#94a3b8', text: 'Non renseigné' },
        ].map(l => (
          <div key={l.text} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: l.iconBg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>{l.icon}</div>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>{l.text}</span>
          </div>
        ))}
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic', marginLeft: 8 }}>Cliquer pour changer</span>
      </div>
    </div>
  );
}

// ── CalendarView ──────────────────────────────────────────────────────────────

export default function CalendarView() {
  const { data, updatePoleData } = useEvent();
  const [view, setView] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1));
  const [selectedDay, setSelectedDay] = useState(null);
  const [addEventDate, setAddEventDate] = useState(null);

  const calData = data.poles.calendar || { events: [], availability: {} };
  const events = useMemo(() => buildEvents(data), [data]);
  const people = useMemo(() => getPeople(data), [data]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd   = endOfMonth(currentDate);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd     = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays    = eachDayOfInterval({ start: calStart, end: calEnd });
  const monthDays  = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (d) => events.filter(e => e.date === d);

  const getAvailForDay = (d) => ({
    yes:  people.filter(p => calData.availability[p]?.[d] === 'yes'),
    no:   people.filter(p => calData.availability[p]?.[d] === 'no'),
    none: people.filter(p => !calData.availability[p]?.[d]),
  });

  const handleToggleAvail = (person, d) => {
    const next = cycleAvail(calData.availability[person]?.[d]);
    const personMap = { ...(calData.availability[person] || {}) };
    if (next) personMap[d] = next; else delete personMap[d];
    updatePoleData('calendar', 'availability', { ...calData.availability, [person]: personMap });
  };

  const handleAddEvent = (form) => {
    updatePoleData('calendar', 'events', [...(calData.events || []), { id: `cev_${Date.now()}`, ...form }]);
    setAddEventDate(null);
  };

  const handleDeleteCustomEvent = (calId) => {
    updatePoleData('calendar', 'events', (calData.events || []).filter(e => e.id !== calId));
  };

  const selectedDateStr = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null;
  const selectedEvents  = selectedDateStr ? getEventsForDay(selectedDateStr) : [];
  const selectedAvail   = selectedDateStr ? getAvailForDay(selectedDateStr) : null;
  const activePoles     = [...new Set(events.map(e => e.pole))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>
            {format(currentDate, 'MMMM yyyy', { locale: fr }).replace(/^\w/, c => c.toUpperCase())}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            {events.length} événement{events.length !== 1 ? 's' : ''} · {people.length} personnes
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: '#f1f3f5', borderRadius: 10, padding: 3, gap: 2 }}>
            <button
              onClick={() => setView('calendar')}
              style={{ padding: '0.35rem 0.875rem', borderRadius: 8, border: 'none', background: view === 'calendar' ? 'white' : 'transparent', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: view === 'calendar' ? '#1e1b4b' : 'var(--text-muted)', boxShadow: view === 'calendar' ? 'var(--shadow-sm)' : 'none', transition: 'all 0.15s' }}
            >
              Calendrier
            </button>
            <button
              onClick={() => setView('availability')}
              style={{ padding: '0.35rem 0.875rem', borderRadius: 8, border: 'none', background: view === 'availability' ? 'white' : 'transparent', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: view === 'availability' ? '#1e1b4b' : 'var(--text-muted)', boxShadow: view === 'availability' ? 'var(--shadow-sm)' : 'none', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}
            >
              <Users size={13} /> Disponibilités
            </button>
          </div>

          {/* Navigation */}
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} style={{ padding: '0 12px', height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
            Aujourd'hui
          </button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Calendar view ── */}
      {view === 'calendar' && (
        <>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {activePoles.map(p => {
              const st = POLE_STYLES[p];
              if (!st) return null;
              return (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: st.color }} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>{st.label}</span>
                </div>
              );
            })}
            <div style={{ width: 1, height: 12, background: 'var(--border)', marginLeft: 4 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>Disponibilités</span>
            </div>
          </div>

          {/* Grid */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8f9fa', borderBottom: '1px solid var(--border)' }}>
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                <div key={d} style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {allDays.map(day => {
                const d = format(day, 'yyyy-MM-dd');
                const dayEvents = getEventsForDay(d);
                const inMonth = isSameMonth(day, currentDate);
                const today = isToday(day);
                const isSelected = selectedDateStr === d;
                const avail = getAvailForDay(d);
                const availYes = avail.yes.length;

                return (
                  <div
                    key={d}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    style={{
                      minHeight: 100,
                      borderRight: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      padding: 6,
                      background: isSelected ? '#eff6ff' : today ? '#fefce8' : !inMonth ? '#fafafa' : 'white',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column',
                      transition: 'background 0.12s',
                    }}
                  >
                    {/* Top row: day number + add button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{
                        width: today ? 24 : 'auto', height: today ? 24 : 'auto',
                        borderRadius: today ? '50%' : 0,
                        background: today ? 'var(--primary)' : 'transparent',
                        color: today ? 'white' : !inMonth ? '#c0c9d4' : 'var(--text-main)',
                        fontSize: '0.78rem', fontWeight: today ? 800 : 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {format(day, 'd')}
                      </div>
                      {inMonth && (
                        <button
                          onClick={e => { e.stopPropagation(); setAddEventDate(d); }}
                          title="Ajouter un événement"
                          style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.65 }}
                        >
                          <Plus size={10} />
                        </button>
                      )}
                    </div>

                    {/* Events */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                      {dayEvents.slice(0, 3).map(ev => (
                        <EventPill key={ev.id} event={ev} onDelete={ev.isCustom ? handleDeleteCustomEvent : null} />
                      ))}
                      {dayEvents.length > 3 && (
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, paddingLeft: 2 }}>+{dayEvents.length - 3} autres</span>
                      )}
                    </div>

                    {/* Availability indicator */}
                    {inMonth && availYes > 0 && (
                      <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#15803d' }}>{availYes}/{people.length}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected day panel */}
          {selectedDay && selectedAvail && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: '1rem', margin: 0 }}>
                    {format(selectedDay, 'EEEE d MMMM yyyy', { locale: fr }).replace(/^\w/, c => c.toUpperCase())}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {selectedEvents.length} événement{selectedEvents.length !== 1 ? 's' : ''}
                    {selectedAvail.yes.length > 0 && ` · ${selectedAvail.yes.length} personne${selectedAvail.yes.length > 1 ? 's' : ''} disponible${selectedAvail.yes.length > 1 ? 's' : ''}`}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => setAddEventDate(selectedDateStr)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.4rem 0.75rem', borderRadius: 8, border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}
                  >
                    <Plus size={13} /> Événement
                  </button>
                  <button onClick={() => setSelectedDay(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Events list */}
                <div style={{ flex: 2, minWidth: 260 }}>
                  {selectedEvents.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>Aucun événement ce jour.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedEvents.map(ev => {
                        const st = POLE_STYLES[ev.pole] || POLE_STYLES.communication;
                        return (
                          <div key={ev.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', background: st.bg, border: `1px solid ${st.color}25`, borderLeft: `4px solid ${st.color}`, borderRadius: 10 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: st.color, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{st.label}</div>
                              <p style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0 }}>{ev.title}</p>
                              {ev.sub && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{ev.sub}</p>}
                            </div>
                            {ev.isCustom && (
                              <button onClick={() => handleDeleteCustomEvent(ev.calId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.55, display: 'flex', padding: 0 }}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Availability */}
                <div style={{ flex: 1, minWidth: 170 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>
                    Disponibilités
                  </div>

                  {selectedAvail.yes.length > 0 && (
                    <div style={{ marginBottom: '0.625rem' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#15803d', marginBottom: 4 }}>Disponibles · {selectedAvail.yes.length}</div>
                      {selectedAvail.yes.map(p => (
                        <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', fontSize: '0.8rem' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />{p}
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedAvail.no.length > 0 && (
                    <div style={{ marginBottom: '0.625rem' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#b91c1c', marginBottom: 4 }}>Indisponibles · {selectedAvail.no.length}</div>
                      {selectedAvail.no.map(p => (
                        <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', fontSize: '0.8rem' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 }} />{p}
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedAvail.none.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Non renseigné · {selectedAvail.none.length}</div>
                      {selectedAvail.none.map(p => (
                        <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d1d5db', display: 'inline-block', flexShrink: 0 }} />{p}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Availability view ── */}
      {view === 'availability' && (
        <AvailabilityCalendar
          me={data.user.name}
          allDays={allDays}
          monthDays={monthDays}
          availability={calData.availability}
          onToggle={handleToggleAvail}
          currentDate={currentDate}
          onPrev={() => setCurrentDate(subMonths(currentDate, 1))}
          onNext={() => setCurrentDate(addMonths(currentDate, 1))}
        />
      )}

      {/* Add event modal */}
      {addEventDate && (
        <AddEventModal date={addEventDate} onSave={handleAddEvent} onClose={() => setAddEventDate(null)} />
      )}
    </div>
  );
}
