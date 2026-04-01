import React, { useState } from 'react';
import {
  BarChart2, CheckSquare, Users, Package, Calendar,
  MessageSquare, DollarSign, Map, LogOut,
  Timer, CalendarDays, FolderOpen, Star,
  Music, Zap, List, Settings, ChevronRight,
  ShoppingCart, UserCog,
} from 'lucide-react';
import { useEvent } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import AozaLogo from '../shared/AozaLogo';

/* ── Event nav : 3 sections ─────────────────────────────── */
const EVENT_SECTIONS = [
  {
    label: 'Général',
    items: [
      { id: 'dashboard',   label: 'Tableau de bord', icon: BarChart2 },
      { id: 'tasks',       label: 'Tâches',           icon: CheckSquare },
      { id: 'volunteers',  label: 'Inscription',      icon: Users },
      { id: 'budget',      label: 'Budget',           icon: DollarSign },
      { id: 'calendar',    label: 'Calendrier',       icon: Calendar },
      { id: 'meetings',    label: 'Réunions',         icon: MessageSquare },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { id: 'logistics',   label: 'Logistique',       icon: Package },
      { id: 'communication',label:'Communication',    icon: MessageSquare },
      { id: 'consumables', label: 'Consommables',     icon: ShoppingCart },
      { id: 'plan',        label: 'Plan',             icon: Map },
      { id: 'course',      label: 'Course',           icon: Timer },
    ],
  },
  {
    label: 'Programmation',
    items: [
      { id: 'concerts',    label: 'Concert & Artistes', icon: Music },
      { id: 'animations',  label: 'Animations',         icon: Zap },
      { id: 'programme',   label: 'Programme',          icon: List },
    ],
  },
];

/* ── Asso nav : plat ─────────────────────────────────────── */
const ASSO_SECTIONS = [
  {
    label: 'Association',
    items: [
      { id: 'asso-dashboard',     label: 'Dashboard',         icon: BarChart2 },
      { id: 'events',             label: 'Événements',        icon: CalendarDays },
      { id: 'asso-tasks',         label: 'Tâches',            icon: CheckSquare },
      { id: 'asso-budget',        label: 'Budget',            icon: DollarSign },
      { id: 'asso-communication', label: 'Communication',     icon: MessageSquare },
      { id: 'members',            label: 'Membres',           icon: Users },
      { id: 'administration',     label: 'Administration',    icon: FolderOpen },
      { id: 'sponsors',           label: 'Sponsors & Subv.',  icon: Star },
      { id: 'inventory',          label: 'Inventaire',        icon: Package },
    ],
  },
];

/* ── NavItem ─────────────────────────────────────────────── */
function NavItem({ item, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onClick(item.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '5px 8px',
        borderRadius: 7,
        border: 'none',
        background: active
          ? 'var(--bg-hover)'
          : hovered
          ? 'rgba(0,0,0,0.03)'
          : 'transparent',
        color: active ? 'var(--text-main)' : 'var(--text-muted)',
        cursor: 'pointer',
        transition: 'all 0.12s',
        fontWeight: active ? 600 : 400,
        fontSize: '0.78rem',
        fontFamily: 'var(--font-main)',
        textAlign: 'left',
      }}
    >
      <item.icon
        size={14}
        strokeWidth={active ? 2.5 : 2}
        style={{ flexShrink: 0, color: active ? 'var(--primary)' : 'inherit' }}
      />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.label}
      </span>
      {active && (
        <div style={{
          marginLeft: 'auto',
          width: 5, height: 5,
          borderRadius: '50%',
          background: 'var(--primary)',
          flexShrink: 0,
        }} />
      )}
    </button>
  );
}

/* ── Sidebar ─────────────────────────────────────────────── */
export default function Sidebar({
  appMode, onModeChange,
  activeView, onViewChange,
  assoView, onAssoViewChange,
}) {
  const { data } = useEvent();
  const { currentUser, logout } = useAuth();
  const user = data.user;

  const isEvent   = appMode === 'event';
  const sections  = isEvent ? EVENT_SECTIONS : ASSO_SECTIONS;
  const currentId = isEvent ? activeView : assoView;
  const handleNav = isEvent ? onViewChange : onAssoViewChange;

  const eventName = data.event?.name || 'Événement';
  const assoName  = data.association?.name || 'Association';
  const firstName = (currentUser?.name || user?.name || '').split(' ')[0];

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem 0.75rem',
      position: 'fixed',
      left: 0, top: 0,
      zIndex: 100,
    }}>

      {/* ── Logo + Breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem', padding: '0 4px' }}>
        <div style={{ flexShrink: 0 }}>
          <AozaLogo size="sm" showText={false} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
          <button
            onClick={() => isEvent && onModeChange('asso')}
            style={{
              background: 'none', border: 'none', padding: 0,
              fontSize: '0.78rem',
              fontWeight: isEvent ? 500 : 700,
              cursor: isEvent ? 'pointer' : 'default',
              color: isEvent ? 'var(--text-muted)' : 'var(--text-main)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: isEvent ? 70 : 140,
              transition: 'color 0.12s',
              fontFamily: 'var(--font-main)',
            }}
            onMouseEnter={e => { if (isEvent) e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={e => { if (isEvent) e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            {assoName}
          </button>
          {isEvent && (
            <>
              <span style={{ color: 'var(--border-strong)', margin: '0 4px', fontSize: '0.85rem', flexShrink: 0 }}>/</span>
              <span style={{
                fontSize: '0.78rem', fontWeight: 700,
                color: 'var(--text-main)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                flex: 1, minWidth: 0,
              }}>
                {eventName}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Nav sections ── */}
      <nav style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {sections.map((section, si) => (
          <div key={si} style={{ marginBottom: '0.25rem' }}>
            <p style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              color: 'var(--text-subtle)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '6px 8px 3px',
            }}>
              {section.label}
            </p>
            {section.items.map(item => (
              <NavItem
                key={item.id}
                item={item}
                active={currentId === item.id}
                onClick={handleNav}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* ── Bas : Paramètres + Déconnexion ── */}
      <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>

        {/* Paramètres */}
        <button
          onClick={() => isEvent ? onViewChange('settings') : onAssoViewChange('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '6px 8px',
            borderRadius: 7,
            border: 'none',
            background: (currentId === 'settings') ? 'var(--bg-hover)' : 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 500,
            fontFamily: 'var(--font-main)',
            transition: 'all 0.12s',
            textAlign: 'left',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = currentId === 'settings' ? 'var(--bg-hover)' : 'transparent'}
        >
          <UserCog size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>Paramètres</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>
            {firstName}
          </span>
        </button>

        {/* Déconnexion */}
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '6px 8px',
            borderRadius: 7,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-subtle)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 500,
            fontFamily: 'var(--font-main)',
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-subtle)'; }}
        >
          <LogOut size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
