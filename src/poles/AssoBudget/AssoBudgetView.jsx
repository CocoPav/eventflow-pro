import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { TrendingUp, TrendingDown, Wallet, Plus, Trash2 } from 'lucide-react';

const fmt = v => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

export default function AssoBudgetView() {
  const { data, setData } = useEvent();
  const [tab, setTab] = useState('event'); // 'asso' | 'event'

  const event = data.event;
  const expenses = data.poles.budget?.expenses || [];
  const revenues = data.poles.budget?.revenues || [];

  const totalRevenues = revenues.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalRevenues - totalExpenses;

  // Association operating budget (separate from event)
  const assoBudget = data.association?.budget || { revenues: [], expenses: [] };
  const assoRevenues = assoBudget.revenues || [];
  const assoExpenses = assoBudget.expenses || [];
  const assoTotalRev = assoRevenues.reduce((s, r) => s + r.amount, 0);
  const assoTotalExp = assoExpenses.reduce((s, e) => s + e.amount, 0);

  // Group by category
  const groupBy = (items, key) => items.reduce((acc, item) => {
    const k = item[key] || 'Autre';
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});

  const expensesByCat = groupBy(expenses, 'cat');
  const revenuesByCat = groupBy(revenues, 'cat');

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: 1000 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.75rem' }}>Budget</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
        {[['event', event?.name || 'Événement'], ['asso', 'Association']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: '0.75rem 1.25rem', background: 'none', border: 'none',
              borderBottom: tab === id ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === id ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: tab === id ? 700 : 500, fontSize: '0.875rem',
              cursor: 'pointer', marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'event' && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Recettes', value: totalRevenues, icon: TrendingUp, color: '#22c55e' },
              { label: 'Dépenses', value: totalExpenses, icon: TrendingDown, color: '#ef4444' },
              { label: 'Solde', value: balance, icon: Wallet, color: balance >= 0 ? '#22c55e' : '#ef4444' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <Icon size={20} color={color} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: '1.5rem', fontWeight: 900, color, letterSpacing: '-0.02em' }}>{fmt(value)}</p>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Revenues */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem', color: '#22c55e' }}>Recettes</h3>
              {Object.entries(revenuesByCat).map(([cat, items]) => (
                <div key={cat} style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{cat}</p>
                  {items.map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                      <span>{r.label}</span>
                      <span style={{ fontWeight: 700, color: '#22c55e' }}>+{fmt(r.amount)}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', fontWeight: 900, fontSize: '0.9rem' }}>
                <span>Total</span>
                <span style={{ color: '#22c55e' }}>{fmt(totalRevenues)}</span>
              </div>
            </div>

            {/* Expenses */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem', color: '#ef4444' }}>Dépenses</h3>
              {Object.entries(expensesByCat).map(([cat, items]) => (
                <div key={cat} style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{cat}</p>
                  {items.map(e => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                      <span>{e.label}</span>
                      <span style={{ fontWeight: 700, color: '#ef4444' }}>-{fmt(e.amount)}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', fontWeight: 900, fontSize: '0.9rem' }}>
                <span>Total</span>
                <span style={{ color: '#ef4444' }}>{fmt(totalExpenses)}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'asso' && (
        <div>
          {assoRevenues.length === 0 && assoExpenses.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <Wallet size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p style={{ fontWeight: 700, marginBottom: 8 }}>Budget association vide</p>
              <p style={{ fontSize: '0.875rem' }}>Les charges et produits de fonctionnement de l'association apparaîtront ici.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#22c55e' }}>{fmt(assoTotalRev)}</p>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>Produits</p>
              </div>
              <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444' }}>{fmt(assoTotalExp)}</p>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>Charges</p>
              </div>
              <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 900, color: assoTotalRev - assoTotalExp >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(assoTotalRev - assoTotalExp)}</p>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>Résultat</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
