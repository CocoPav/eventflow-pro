import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, X, ChevronRight } from 'lucide-react';
import { useEvent } from '../../context/EventContext';
import { useNotifications, NOTIF_TYPES } from '../../context/NotificationContext';

const VIEW_LABELS = {
  dashboard: 'Accueil',
  members: 'Membres',
  administration: 'Administration',
  inventory: 'Inventaire',
  budget: 'Budget',
  sponsors: 'Sponsors & Subventions',
  communication: 'Communication',
  events: 'Événements',
  'event-detail': 'Événement',
};

export default function Header({ searchTerm, onSearchChange, activeView, onNavigate }) {
  const { data } = useEvent();
  const { visible, count, dismiss, dismissAll } = useNotifications(data);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <header style={{
      height: 'var(--header-height)',
      borderBottom: '1px solid var(--border)',
      padding: '0 1.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--bg-card)',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      flexShrink: 0,
    }}>
      {/* Search */}
      <div style={{ position: 'relative', width: 300 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Rechercher…"
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.45rem 1rem 0.45rem 2.125rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            fontSize: '0.78rem',
            color: 'var(--text-main)',
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Right: bell */}
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ background: open ? 'var(--bg-hover)' : 'transparent', border: '1px solid transparent', color: count > 0 ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', position: 'relative', padding: '7px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
        >
          <Bell size={17} />
          {count > 0 && (
            <div style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, background: 'var(--danger)', borderRadius: '99px', border: '2px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, color: 'white' }}>
              {count > 9 ? '9+' : count}
            </div>
          )}
        </button>

        {open && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 360, maxHeight: 480, background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 200 }}>
            <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>Notifications</p>
              {count > 0 && <button onClick={() => dismissAll(visible.map(n => n.id))} style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Tout effacer</button>}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {visible.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Aucune notification</div>
              ) : visible.map(n => {
                const type = NOTIF_TYPES[n.type] || NOTIF_TYPES.info;
                return (
                  <div key={n.id} style={{ display: 'flex', gap: '0.625rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: type.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', flexShrink: 0 }}>{type.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.78rem', color: type.color, marginBottom: 1 }}>{n.title}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</p>
                      {n.link && <button onClick={() => { onNavigate?.(n.link); setOpen(false); }} style={{ marginTop: 3, fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 2 }}>Voir <ChevronRight size={10} /></button>}
                    </div>
                    <button onClick={() => dismiss(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 2 }}><X size={12} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
