import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Calendar, Clock, MapPin, CheckCircle2, Circle, User } from 'lucide-react';
import AozaLogo from '../../components/shared/AozaLogo';

const SLOT_LABELS = {
  'Samedi-Matin': 'Samedi Matin',
  'Samedi-Après-midi': 'Samedi Après-midi',
  'Samedi-Soir': 'Samedi Soir',
  'Dimanche-Matin': 'Dimanche Matin',
  'Dimanche-Après-midi': 'Dimanche Après-midi',
};

const CAT_COLORS = { concert: '#3b82f6', village: '#10b981', course: '#f59e0b', animation: '#8b5cf6' };

export default function VolunteerPortal() {
  const { data } = useEvent();
  const { currentUser, logout } = useAuth();

  // Find matching volunteer profile
  const volunteer = data.poles.volunteers.list.find(v => v.id === currentUser.volunteerId);
  const schedule   = data.poles.programming.schedule || [];
  const event      = data.event;

  // Assigned schedule items (where volunteerId is in assignedIds)
  const assignments = schedule.filter(s =>
    (s.volunteerNeeds || []).some(vn => (vn.assignedIds || []).includes(currentUser.volunteerId))
  );

  if (!volunteer) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
          <p style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Profil introuvable</p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Votre profil bénévole n'est pas encore lié à ce compte. Contactez l'équipe organisatrice.</p>
          <button onClick={logout} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', background: '#1a1a1b', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Se déconnecter</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <header style={{ background: '#ebdfcd', padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AozaLogo size="sm" />
          <span style={{ color: 'rgba(26,26,27,0.3)', margin: '0 6px' }}>|</span>
          <span style={{ fontSize: '0.875rem', color: 'rgba(26,26,27,0.5)', fontWeight: 600 }}>Espace Bénévole</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f72f3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', color: 'white' }}>
              {currentUser.avatar}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{currentUser.name}</span>
          </div>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 0.875rem', borderRadius: '10px', background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)', color: 'rgba(26,26,27,0.6)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Welcome banner */}
        <div style={{ background: 'linear-gradient(135deg, #1a1a1b, #2d2d2e)', borderRadius: '20px', padding: '2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: 600 }}>Bienvenue,</p>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>{volunteer.name}</h1>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={13} /> {volunteer.role}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} /> {event.date}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={13} /> {event.location}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, margin: '0 auto 4px' }}>
              {currentUser.avatar}
            </div>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>BÉNÉVOLE</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Missions assignées', value: assignments.length, color: '#6366f1' },
            { label: 'Heures / Tour', value: `${volunteer.hoursPerShift || '?'}h`, color: '#10b981' },
            { label: 'Nombre de tours', value: volunteer.numberOfShifts || '?', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--border)', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '1.75rem', fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</p>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Missions assignées */}
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>Mes Missions</h2>
            {assignments.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontWeight: 600 }}>Aucune mission assignée pour l'instant.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>L'équipe vous contactera bientôt.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {assignments.map(item => {
                  const roles = (item.volunteerNeeds || []).filter(vn => (vn.assignedIds || []).includes(currentUser.volunteerId));
                  const catColor = CAT_COLORS[item.category] || '#64748b';
                  return (
                    <div key={item.id} style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--border)', borderLeft: `4px solid ${catColor}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <h3 style={{ fontWeight: 800, fontSize: '0.9375rem' }}>{item.title}</h3>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: catColor, background: catColor + '15', borderRadius: 99, padding: '2px 8px' }}>{item.category}</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{item.description}</p>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {item.startTime && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                            <Clock size={12} /> {item.startTime}{item.endTime ? ` – ${item.endTime}` : ''}
                          </span>
                        )}
                        {roles.map((vn, i) => (
                          <span key={i} style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', background: '#eff6ff', borderRadius: 99, padding: '2px 8px' }}>{vn.role}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Infos profil + dispo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Profile card */}
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>Mon Profil</h2>
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Rôle', value: volunteer.role },
                  { label: 'Email', value: volunteer.email || '—' },
                  { label: 'Téléphone', value: volunteer.phone || '—' },
                  { label: 'Contact organisateur', value: volunteer.contact || '—' },
                ].map(f => (
                  <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{f.label}</span>
                    <span style={{ fontWeight: 700 }}>{f.value}</span>
                  </div>
                ))}
                {volunteer.notes && (
                  <div style={{ marginTop: '4px', padding: '0.75rem', background: '#f8f9fa', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {volunteer.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Disponibilités */}
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>Mes Disponibilités</h2>
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Object.entries(SLOT_LABELS).map(([key, label]) => {
                  const available = volunteer.availability?.[key];
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      {available
                        ? <CheckCircle2 size={16} color="#10b981" />
                        : <Circle size={16} color="#e2e8f0" />
                      }
                      <span style={{ fontSize: '0.85rem', fontWeight: available ? 700 : 500, color: available ? 'var(--text-main)' : 'var(--text-muted)' }}>{label}</span>
                      {available && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 800, color: '#10b981', background: '#f0fdf4', borderRadius: 99, padding: '1px 8px' }}>Disponible</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Postes inspirants */}
            {volunteer.inspiredPoles?.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Postes qui m'inspirent</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {volunteer.inspiredPoles.map(p => (
                    <span key={p} style={{ padding: '4px 12px', borderRadius: 99, background: '#f1f3f5', border: '1px solid var(--border)', fontSize: '0.78rem', fontWeight: 700 }}>{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Programme général (lecture seule) */}
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>Programme de la journée</h2>
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {[...schedule].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')).map((item, i) => {
              const catColor = CAT_COLORS[item.category] || '#64748b';
              const isAssigned = assignments.some(a => a.id === item.id);
              return (
                <div key={item.id} style={{ display: 'flex', gap: '1.25rem', padding: '1rem 1.5rem', borderBottom: i < schedule.length - 1 ? '1px solid var(--border)' : 'none', background: isAssigned ? '#fafafa' : 'white' }}>
                  <div style={{ minWidth: '80px', textAlign: 'right' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.875rem', color: catColor }}>{item.startTime}</span>
                    {item.endTime && <p style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.endTime}</p>}
                  </div>
                  <div style={{ width: 3, background: catColor, borderRadius: 99, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.title}</span>
                      {isAssigned && <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#10b981', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 99, padding: '1px 7px' }}>⭐ Ma mission</span>}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.description}</p>
                  </div>
                </div>
              );
            })}
            {schedule.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Programme à venir.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
