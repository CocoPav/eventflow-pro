import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';

export default function Header({ searchTerm, onSearchChange, activeView }) {
  const viewLabels = {
    dashboard: 'Dashboard',
    tasks: 'Tâches Globales',
    communication: 'Communication',
    volunteers: 'Bénévoles',
    budget: 'Budget',
    logistics: 'Logistique',
    programming: 'Programmation',
    plan: 'Plan & Déco',
    meetings: 'Réunions'
  };

  return (
    <header style={{ 
      height: '80px', 
      borderBottom: '1px solid var(--border)', 
      padding: '0 3rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'white',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          <span>Home</span>
          <span style={{ opacity: 0.5 }}>/</span>
          <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{viewLabels[activeView]}</span>
        </div>

        <div style={{ position: 'relative', width: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search items, tasks, people..." 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.75rem 1rem 0.75rem 3rem', 
              borderRadius: 'var(--radius-md)', 
              background: '#f1f3f5', 
              border: 'none', 
              fontSize: '0.875rem',
              color: 'var(--text-main)',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => e.target.style.background = '#e9ecef'}
            onBlur={(e) => e.target.style.background = '#f1f3f5'}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', position: 'relative' }}>
          <Bell size={20} />
          <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%', border: '2px solid white' }} />
        </button>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <HelpCircle size={20} />
        </button>
      </div>
    </header>
  );
}
