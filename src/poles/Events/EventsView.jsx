import React from 'react';
import { useEvent } from '../../context/EventContext';
import { CalendarDays, MapPin, Users, Wallet, ArrowRight, Clock } from 'lucide-react';

export default function EventsView({ onOpenEvent }) {
  const { data } = useEvent();
  const event = data.event;
  const volunteers = data.poles.volunteers?.list || [];
  const revenues = (data.poles.budget?.revenues || []).reduce((s, r) => s + r.amount, 0);
  const expenses = (data.poles.budget?.expenses || []).reduce((s, e) => s + e.amount, 0);
  const balance = revenues - expenses;
  const schedule = data.poles.programming?.schedule || [];
  const confirmed = schedule.filter(s => s.status === 'confirmed').length;

  const daysLeft = event?.date
    ? Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const fmt = v => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: 900 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.75rem' }}>Événements</h1>

      {event ? (
        <div
          className="card"
          onClick={() => onOpenEvent(event.id || 'main')}
          style={{ cursor: 'pointer', padding: '1.75rem', transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: 6 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(99,102,241,0.12)', color: 'var(--primary)' }}>
                  {event.edition || 'Édition en cours'}
                </span>
                {daysLeft !== null && daysLeft >= 0 && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: daysLeft < 30 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)', color: daysLeft < 30 ? '#ef4444' : '#22c55e' }}>
                    J-{daysLeft}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>{event.name}</h2>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                {event.date && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <CalendarDays size={13} />
                    {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
                {event.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <MapPin size={13} />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
              Gérer <ArrowRight size={15} />
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            {[
              { icon: Clock,       label: 'Au programme', value: schedule.length, sub: `${confirmed} confirmé(s)` },
              { icon: Users,       label: 'Bénévoles',    value: volunteers.length, sub: `${volunteers.filter(v => v.status === 'confirmed').length} confirmé(s)` },
              { icon: Wallet,      label: 'Budget',       value: fmt(balance), sub: balance >= 0 ? 'solde positif' : 'solde négatif', color: balance >= 0 ? '#22c55e' : '#ef4444' },
              { icon: MapPin,      label: 'Lieu',         value: event.location || '—', isText: true },
            ].map(({ icon: Icon, label, value, sub, color, isText }) => (
              <div key={label}>
                <p style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: isText ? '0.95rem' : '1.5rem', fontWeight: 800, color: color || 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 3 }}>{value}</p>
                {sub && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sub}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Aucun événement configuré.
        </div>
      )}
    </div>
  );
}
