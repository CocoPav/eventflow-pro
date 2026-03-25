import React from 'react';
import { useEvent } from '../../context/EventContext';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertTriangle, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Music,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DashboardView({ onViewChange }) {
  const { data } = useEvent();
  
  // Stats Calculation
  const totalExpenses = data.poles.budget.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenues = data.poles.budget.revenues.reduce((sum, r) => sum + r.amount, 0);
  const confirmedVolunteers = data.poles.volunteers.list.length;
  const pendingTasks = data.poles.communication.tasks.filter(t => t.status !== 'done').length;
  const lowStock = data.poles.logistics.materials.filter(m => m.status === 'todo').length;

  const upcomingTasks = data.poles.communication.tasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false;
    const diff = new Date(t.dueDate) - new Date();
    return diff > 0 && diff < (3 * 24 * 60 * 60 * 1000); // 3 jours
  });

  const fmt = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.05em', color: 'var(--text-main)' }}>Overview</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>Supervising {data.event.name} project</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f8f9fa', padding: '0.6rem 1.2rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
          <span style={{ fontWeight: 800, fontSize: '0.875rem' }}>Active Planning</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {[
          { label: 'Budget Balance', val: fmt(totalRevenues - totalExpenses), icon: TrendingUp, color: 'var(--primary)', trend: '+12%', sub: 'vs last month' },
          { label: 'Volunteers', val: confirmedVolunteers, icon: Users, color: '#6366f1', trend: '+5%', sub: 'Confirmed' },
          { label: 'Pending Items', val: lowStock, icon: Package, color: '#f59e0b', trend: '-2', sub: 'Action needed' },
          { label: 'Com Tasks', val: pendingTasks, icon: CheckCircle2, color: '#10b981', trend: '80%', sub: 'Completion rate' },
        ].map((kpi, i) => (
          <div key={i} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                <kpi.icon size={20} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', background: '#f0fdf4', padding: '4px 8px', borderRadius: '6px' }}>{kpi.trend}</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{kpi.val}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)' }}>{kpi.label}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
        <div>
           {/* Alerts - Ref Image 3 style items */}
           <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <h3 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Priority Alerts</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {upcomingTasks.map(t => (
                  <div key={t.id} style={{ padding: '1.25rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Deadline Proche : {t.title}</p>
                            <p style={{ fontSize: '0.8125rem', color: '#dc2626', fontWeight: 500 }}>Échéance le {t.dueDate}</p>
                        </div>
                    </div>
                    <button onClick={() => onViewChange('communication')} style={{ background: 'white', border: '1px solid #fee2e2', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Gérer</button>
                  </div>
                ))}
                {lowStock > 0 && (
                  <div style={{ padding: '1.25rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Package size={20} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Logistique : {lowStock} commandes en attente</p>
                            <p style={{ fontSize: '0.8125rem', color: '#b45309', fontWeight: 500 }}>Vérifier les stocks consommables</p>
                        </div>
                    </div>
                    <button onClick={() => onViewChange('logistics')} style={{ background: 'white', border: '1px solid #fef3c7', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Stocks</button>
                  </div>
                )}
             </div>
           </section>

           <section style={{ marginTop: '2.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                 <div className="card" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Prochaine Réunion</h3>
                    {data.poles.meetings.entries.length > 0 ? (() => {
                      const next = [...data.poles.meetings.entries].sort((a,b) => new Date(a.date) - new Date(b.date)).find(m => new Date(m.date) >= new Date()) || data.poles.meetings.entries[0];
                      return (
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                          <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'var(--primary)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{format(new Date(next.date), 'MMM', { locale: fr }).toUpperCase()}</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>{format(new Date(next.date), 'dd')}</span>
                          </div>
                          <div>
                            <p style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{next.title}</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{next.date} • {next.pole}</p>
                          </div>
                        </div>
                      );
                    })() : <p style={{ color: 'var(--text-muted)' }}>Aucune réunion.</p>}
                 </div>
                 <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-muted)' }}>Progression Globale</h3>
                    <div style={{ height: '12px', background: '#f1f3f5', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '65%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: '6px' }} />
                    </div>
                    <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', fontWeight: 700, textAlign: 'right' }}>65% Complete</p>
                 </div>
              </div>
           </section>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section className="card" style={{ flex: 1, padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Recent Actions</h3>
                    <button onClick={() => onViewChange('communication')} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8125rem', cursor: 'pointer' }}>View all</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {data.poles.communication.tasks.slice(0, 5).map(t => (
                        <div key={t.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: t.status === 'done' ? '#f0fdf4' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.status === 'done' ? 'var(--success)' : 'var(--primary)' }}>
                                {t.status === 'done' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: t.status === 'done' ? 'var(--text-muted)' : 'var(--text-main)' }}>{t.title}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.assignee} • {t.status}</p>
                            </div>
                            <ChevronRight size={16} color="#cbd5e1" />
                        </div>
                    ))}
                </div>
            </section>
        </div>
      </div>
    </div>
  );
}
