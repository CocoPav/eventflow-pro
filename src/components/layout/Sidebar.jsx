import React from 'react';
import { 
  BarChart2, 
  CheckSquare, 
  Users, 
  Package, 
  Calendar, 
  MessageSquare,
  DollarSign,
  Map,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  User as UserIcon,
  Play
} from 'lucide-react';
import { useEvent } from '../../context/EventContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: BarChart2 },
  { id: 'tasks', label: 'Tâches Globales', icon: CheckSquare },
  { id: 'communication', label: 'Communication', icon: MessageSquare },
  { id: 'volunteers', label: 'Bénévoles', icon: Users },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'logistics', label: 'Logistique', icon: Package },
  { id: 'programming', label: 'Programmation', icon: Play },
  { id: 'plan', label: 'Plan & Déco', icon: Map },
  { id: 'meetings', label: 'Réunions', icon: Calendar },
];

export default function Sidebar({ activeView, onViewChange }) {
  const { data, switchRole } = useEvent();
  const user = data.user;

  return (
    <aside style={{ 
      width: '280px', 
      height: '100vh', 
      background: 'var(--bg-sidebar)', 
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 1.5rem',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100
    }}>
      {/* Logo Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '3rem', padding: '0 0.5rem' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          background: 'var(--text-main)', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 900,
          fontSize: '1.25rem'
        }}>P</div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>EventFlow<span style={{ color: 'var(--primary)' }}>.</span></h1>
      </div>

      {/* Main Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', padding: '0 0.75rem' }}>Main Menu</p>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.875rem 1rem',
              borderRadius: '12px',
              border: 'none',
              background: activeView === item.id ? 'white' : 'transparent',
              boxShadow: activeView === item.id ? 'var(--shadow-sm)' : 'none',
              color: activeView === item.id ? 'var(--text-main)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              fontWeight: activeView === item.id ? 700 : 500,
              fontSize: '0.9375rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <item.icon size={20} strokeWidth={activeView === item.id ? 2.5 : 2} />
              {item.label}
            </div>
            {activeView === item.id && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)' }} />}
          </button>
        ))}
      </nav>

      {/* User Area */}
      <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
           <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserIcon size={20} color="var(--primary)" />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 700 }}>{user?.name || 'Utilisateur'}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role === 'organizer' ? 'Co-Organisateur' : 'Pôle Comm'}</p>
          </div>
        </div>

        <button 
          onClick={switchRole}
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            borderRadius: '10px', 
            border: '1px solid var(--border)', 
            background: 'white', 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <ShieldCheck size={14} /> Switch to {user?.role === 'organizer' ? 'Staff' : 'Admin'}
        </button>
      </div>
    </aside>
  );
}
