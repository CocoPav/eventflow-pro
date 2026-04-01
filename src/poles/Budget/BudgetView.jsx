import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { Plus, Trash2, Edit2, ArrowUpRight, ArrowDownRight, TrendingUp, PieChart, BarChart3 } from 'lucide-react';
import Modal from '../../components/shared/Modal';

const EXPENSE_CATS = ['Artistes / Cachets', 'Technique / Son', 'Sécurité', 'Communication', 'Logistique', 'Restauration', 'Buvette', 'Personnel', 'Assurances', 'Autre'];
const REVENUE_CATS = ['Billetterie', 'Subventions', 'Sponsoring', 'Partenariats', 'Bar / Buvette', 'Restauration', 'Vente', 'Autre'];
const CAT_COLORS   = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#8b5cf6','#14b8a6','#f97316','#64748b'];

const EMPTY_EXPENSE = { label: '', amount: '', cat: 'Autre', date: '', notes: '' };
const EMPTY_REVENUE = { label: '', amount: '', cat: 'Autre', date: '', notes: '' };

const fmt = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);

// ── Category bar chart ────────────────────────────────────────────────────────
function CategoryChart({ items, isExpense }) {
  const grouped = items.reduce((acc, item) => {
    const cat = item.cat || item.category || 'Autre';
    acc[cat] = (acc[cat] || 0) + (item.amount || 0);
    return acc;
  }, {});
  const entries = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(e => e[1]), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {entries.map(([cat, total], i) => (
        <div key={cat}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: CAT_COLORS[i % CAT_COLORS.length] }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{cat}</span>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isExpense ? '#ef4444' : '#10b981' }}>{fmt(total)}</span>
          </div>
          <div style={{ height: '7px', background: '#f1f3f5', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(total / max) * 100}%`, background: CAT_COLORS[i % CAT_COLORS.length], borderRadius: 99, transition: 'width 0.4s' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BudgetView() {
  const { data, addItem, updateItem, deleteItem, updatePoleData } = useEvent();
  const { expenses, revenues, estimations } = data.poles.budget;
  const artists = data.poles.programming.artists || [];

  // 3-scenario estimation rows
  const estRevs = estimations?.estRevs || [];
  const estExps = estimations?.estExps || [];

  const [activeTab, setActiveTab] = useState('bilan');
  const [modal, setModal] = useState({ open: false, type: 'expenses', editing: null });
  const [form, setForm] = useState(EMPTY_EXPENSE);

  const totalExp = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalRev = revenues.reduce((s, r) => s + (r.amount || 0), 0);
  const balance  = totalRev - totalExp;

  // 3-scenario totals (estimation rows only)
  const totRevLow  = estRevs.reduce((s, r) => s + (Number(r.low)  || 0), 0);
  const totRevMid  = estRevs.reduce((s, r) => s + (Number(r.mid)  || 0), 0);
  const totRevHigh = estRevs.reduce((s, r) => s + (Number(r.high) || 0), 0);
  const totExpLow  = estExps.reduce((s, e) => s + (Number(e.low)  || 0), 0);
  const totExpMid  = estExps.reduce((s, e) => s + (Number(e.mid)  || 0), 0);
  const totExpHigh = estExps.reduce((s, e) => s + (Number(e.high) || 0), 0);

  const openModal = (type, item = null) => {
    setForm(item ? { ...item } : (type === 'expenses' ? { ...EMPTY_EXPENSE } : { ...EMPTY_REVENUE }));
    setModal({ open: true, type, editing: item });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, amount: parseFloat(form.amount) };
    if (modal.editing) {
      updateItem('budget', modal.type, modal.editing.id, payload);
    } else {
      addItem('budget', modal.type, { ...payload, id: Date.now().toString() });
    }
    setModal({ open: false, type: 'expenses', editing: null });
  };

  // Inline estimation CRUD (no modal needed)
  const saveEst = (key, items) =>
    updatePoleData('budget', 'estimations', { ...(data.poles.budget.estimations || {}), [key]: items });

  const addEstRev    = () => saveEst('estRevs', [...estRevs, { id: Date.now().toString(), label: '', cat: 'Billetterie', low: 0, mid: 0, high: 0 }]);
  const updateEstRev = (id, field, val) => saveEst('estRevs', estRevs.map(r => r.id === id ? { ...r, [field]: val } : r));
  const deleteEstRev = (id) => saveEst('estRevs', estRevs.filter(r => r.id !== id));

  const addEstExp    = () => saveEst('estExps', [...estExps, { id: Date.now().toString(), label: '', cat: 'Autre', low: 0, mid: 0, high: 0 }]);
  const updateEstExp = (id, field, val) => saveEst('estExps', estExps.map(e => e.id === id ? { ...e, [field]: val } : e));
  const deleteEstExp = (id) => saveEst('estExps', estExps.filter(e => e.id !== id));

  const tabs = [
    { id: 'bilan',        label: 'Bilan',        icon: PieChart },
    { id: 'expenses',     label: 'Dépenses',     icon: ArrowDownRight },
    { id: 'revenues',     label: 'Recettes',     icon: ArrowUpRight },
    { id: 'estimations',  label: 'Estimations',  icon: BarChart3 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', gap: '2.5rem', borderBottom: '1px solid var(--border)' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '1.25rem 0', background: 'transparent', border: 'none', color: activeTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: 800, cursor: 'pointer', position: 'relative', fontSize: '0.9375rem' }}>
              <tab.icon size={17} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              {tab.label}
              {activeTab === tab.id && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, background: 'var(--primary)', borderRadius: '3px 3px 0 0' }} />}
            </button>
          ))}
        </div>
        {activeTab !== 'bilan' && activeTab !== 'estimations' && (
          <button onClick={() => openModal(activeTab)} className="btn-primary" style={{ background: 'var(--primary)', color: 'white', marginBottom: '8px' }}>
            <Plus size={18} /> {activeTab === 'expenses' ? 'Dépense' : 'Recette'}
          </button>
        )}
      </div>

      {/* ── KPI cards (always visible) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dépenses</span>
            <div style={{ width: 32, height: 32, borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowDownRight size={16} color="#ef4444" /></div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ef4444', letterSpacing: '-0.02em' }}>{fmt(totalExp)}</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>{expenses.length} ligne{expenses.length > 1 ? 's' : ''}</p>
        </div>
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recettes</span>
            <div style={{ width: 32, height: 32, borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowUpRight size={16} color="#10b981" /></div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981', letterSpacing: '-0.02em' }}>{fmt(totalRev)}</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>{revenues.length} ligne{revenues.length > 1 ? 's' : ''}</p>
        </div>
        <div className="card" style={{ padding: '1.75rem', background: balance >= 0 ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: `1px solid ${balance >= 0 ? '#bbf7d0' : '#fecaca'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Balance</span>
            <TrendingUp size={16} color={balance >= 0 ? '#10b981' : '#ef4444'} />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 900, color: balance >= 0 ? '#16a34a' : '#dc2626', letterSpacing: '-0.02em' }}>{balance >= 0 ? '+' : ''}{fmt(balance)}</p>
          <div style={{ marginTop: '0.75rem', height: '6px', background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min((totalRev > 0 ? (totalRev / Math.max(totalExp, totalRev)) * 100 : 0), 100)}%`, background: balance >= 0 ? '#16a34a' : '#dc2626', borderRadius: 99 }} />
          </div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px' }}>{totalRev > 0 ? Math.round((totalRev / Math.max(totalExp, totalRev)) * 100) : 0}% couvert</p>
        </div>
      </div>

      {/* ── Bilan tab ── */}
      {activeTab === 'bilan' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Dépenses par catégorie</h3>
            {expenses.length > 0 ? <CategoryChart items={expenses} isExpense /> : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucune dépense.</p>}
          </div>
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Recettes par catégorie</h3>
            {revenues.length > 0 ? <CategoryChart items={revenues} isExpense={false} /> : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucune recette.</p>}
          </div>

          {/* Top 5 expenses */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Top dépenses</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5).map((e, i) => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: CAT_COLORS[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'white' }}>{i + 1}</span>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700 }}>{e.label}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{e.cat || e.category}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ef4444' }}>-{fmt(e.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top 5 revenues */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Top recettes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...revenues].sort((a, b) => b.amount - a.amount).slice(0, 5).map((r, i) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: CAT_COLORS[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'white' }}>{i + 1}</span>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700 }}>{r.label}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.cat || r.category}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>+{fmt(r.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Expenses / Revenues table ── */}
      {(activeTab === 'expenses' || activeTab === 'revenues') && (() => {
        const items = activeTab === 'expenses' ? expenses : revenues;
        const isExp = activeTab === 'expenses';
        const cats  = isExp ? EXPENSE_CATS : REVENUE_CATS;
        return (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Libellé</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Catégorie</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Montant</th>
                  <th style={{ padding: '1rem 1rem' }} />
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const allCats = isExp ? EXPENSE_CATS : REVENUE_CATS;
                  const grouped = {};
                  items.forEach(item => {
                    const cat = item.cat || item.category || 'Autre';
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push(item);
                  });
                  if (items.length === 0) return (
                    <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucun élément. Cliquez sur "+ {isExp ? 'Dépense' : 'Recette'}" pour en ajouter.</td></tr>
                  );
                  const sortedCats = allCats.filter(c => grouped[c]).concat(Object.keys(grouped).filter(c => !allCats.includes(c)));
                  return sortedCats.map(cat => {
                    const catItems = grouped[cat] || [];
                    const catTotal = catItems.reduce((s, i) => s + (i.amount || 0), 0);
                    return (
                      <React.Fragment key={cat}>
                        <tr style={{ background: isExp ? '#fef9f9' : '#f0fdf4', borderTop: `1px solid ${isExp ? '#fecaca' : '#bbf7d0'}`, borderBottom: `1px solid ${isExp ? '#fecaca' : '#bbf7d0'}` }}>
                          <td colSpan={3} style={{ padding: '0.45rem 1.5rem', fontSize: '0.67rem', fontWeight: 800, color: isExp ? '#b91c1c' : '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {cat}
                          </td>
                          <td style={{ padding: '0.45rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: isExp ? '#ef4444' : '#10b981' }}>
                            {isExp ? '-' : '+'}{fmt(catTotal)}
                          </td>
                          <td />
                        </tr>
                        {catItems.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.875rem 1.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{item.label}</p>
                                {item.linkedId && (() => {
                                  const linkedArtist = artists.find(a => a.id === item.linkedId);
                                  return linkedArtist ? <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#6366f1', background: '#eff6ff', border: '1px solid #c7d2fe', borderRadius: 99, padding: '1px 7px' }}>🔗 {linkedArtist.name}</span> : null;
                                })()}
                              </div>
                              {item.notes && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.notes}</p>}
                            </td>
                            <td style={{ padding: '0.875rem 1.5rem' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: '#f1f3f5', border: '1px solid var(--border)', color: 'var(--text-main)' }}>{item.cat || item.category || '—'}</span>
                            </td>
                            <td style={{ padding: '0.875rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.date || '—'}</td>
                            <td style={{ padding: '0.875rem 1.5rem', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem', color: isExp ? '#ef4444' : '#10b981' }}>
                              {isExp ? '-' : '+'}{fmt(item.amount)}
                            </td>
                            <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button onClick={() => openModal(activeTab, item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><Edit2 size={14} /></button>
                                <button onClick={() => deleteItem('budget', activeTab, item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8f9fa', borderTop: '2px solid var(--border)' }}>
                  <td colSpan={3} style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '1.1rem', fontWeight: 900, color: isExp ? '#ef4444' : '#10b981' }}>
                    {isExp ? '-' : '+'}{fmt(isExp ? totalExp : totalRev)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        );
      })()}

      {/* ── Estimations tab ── */}
      {activeTab === 'estimations' && (() => {
        const cellInput = (val, onChange, align = 'left', color) => (
          <input
            type="text"
            value={val}
            onChange={e => onChange(e.target.value)}
            style={{
              width: '100%', background: 'transparent', border: '1px solid transparent',
              borderRadius: '6px', padding: '4px 6px', fontSize: '0.875rem', fontWeight: 700,
              color: color || 'var(--text-main)', textAlign: align, outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#fafafe'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
          />
        );
        const numInput = (val, onChange, color) => (
          <input
            type="number" min="0" step="1"
            value={val === 0 ? '' : val}
            onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
            placeholder="0"
            style={{
              width: '100%', background: 'transparent', border: '1px solid transparent',
              borderRadius: '6px', padding: '4px 6px', fontSize: '0.875rem', fontWeight: 700,
              color: color || 'var(--text-main)', textAlign: 'right', outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = color || '#6366f1'; e.currentTarget.style.background = '#fafafe'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
          />
        );
        const TH = ({ children, align = 'left', style: s = {} }) => (
          <th style={{ textAlign: align, padding: '0.7rem 0.875rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', ...s }}>{children}</th>
        );
        const scenBal = (revScen, expScen) => (totalRev + revScen) - (totalExp + expScen);
        const balLow  = scenBal(totRevLow,  totExpLow);
        const balMid  = scenBal(totRevMid,  totExpMid);
        const balHigh = scenBal(totRevHigh, totExpHigh);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* ── Recettes prévisionnelles ── */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.125rem 1.5rem', borderBottom: '1px solid var(--border)', background: '#f8faff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowUpRight size={15} color="#16a34a" />
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Recettes prévisionnelles</h3>
                </div>
                <button onClick={addEstRev} className="btn-primary" style={{ background: 'var(--primary)', color: 'white', fontSize: '0.78rem', padding: '0.45rem 0.875rem' }}>
                  <Plus size={13} /> Ajouter
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '1px solid var(--border)' }}>
                    <TH style={{ width: '30%' }}>Libellé</TH>
                    <TH style={{ width: '18%' }}>Catégorie</TH>
                    <TH align="right" style={{ color: '#3b82f6' }}>📉 Basse</TH>
                    <TH align="right" style={{ color: '#6366f1' }}>📊 Moyenne</TH>
                    <TH align="right" style={{ color: '#10b981' }}>📈 Haute</TH>
                    <TH style={{ width: 36 }} />
                  </tr>
                </thead>
                <tbody>
                  {/* Confirmed revenues — read-only */}
                  {revenues.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', background: '#f0fdf4' }}>
                      <td style={{ padding: '0.5rem 0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '2px 6px', borderRadius: 99, background: '#bbf7d0', color: '#15803d', flexShrink: 0 }}>✓</span>
                          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{r.label || '—'}</p>
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.875rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>{r.cat || '—'}</span>
                      </td>
                      <td style={{ padding: '0.5rem 0.875rem', textAlign: 'right', fontWeight: 700, fontSize: '0.875rem', color: '#15803d' }}>{fmt(r.amount)}</td>
                      <td style={{ padding: '0.5rem 0.875rem', textAlign: 'right', fontWeight: 700, fontSize: '0.875rem', color: '#15803d' }}>{fmt(r.amount)}</td>
                      <td style={{ padding: '0.5rem 0.875rem', textAlign: 'right', fontWeight: 700, fontSize: '0.875rem', color: '#15803d' }}>{fmt(r.amount)}</td>
                      <td />
                    </tr>
                  ))}
                  {revenues.length > 0 && (
                    <tr style={{ background: '#dcfce7', borderBottom: '2px solid #bbf7d0' }}>
                      <td colSpan={2} style={{ padding: '0.5rem 0.875rem', fontSize: '0.65rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total confirmé</td>
                      <td style={{ padding: '0.5rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.875rem', color: '#15803d' }}>{fmt(totalRev)}</td>
                      <td style={{ padding: '0.5rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.875rem', color: '#15803d' }}>{fmt(totalRev)}</td>
                      <td style={{ padding: '0.5rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.875rem', color: '#15803d' }}>{fmt(totalRev)}</td>
                      <td />
                    </tr>
                  )}
                  {/* Estimation rows — editable */}
                  {estRevs.length === 0 && revenues.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucune recette. Cliquez sur "+ Ajouter" pour ajouter une estimation.</td></tr>
                  )}
                  {estRevs.length === 0 && revenues.length > 0 && (
                    <tr><td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>Aucune recette prévisionnelle supplémentaire.</td></tr>
                  )}
                  {estRevs.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.5rem 0.875rem' }}>
                        {cellInput(r.label, v => updateEstRev(r.id, 'label', v))}
                      </td>
                      <td style={{ padding: '0.5rem 0.875rem' }}>
                        <select
                          value={r.cat}
                          onChange={e => updateEstRev(r.id, 'cat', e.target.value)}
                          style={{ width: '100%', background: 'transparent', border: '1px solid transparent', borderRadius: '6px', padding: '4px 6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', outline: 'none', cursor: 'pointer' }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#fafafe'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          {REVENUE_CATS.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '0.5rem 0.875rem' }}>{numInput(r.low,  v => updateEstRev(r.id, 'low',  v), '#3b82f6')}</td>
                      <td style={{ padding: '0.5rem 0.875rem' }}>{numInput(r.mid,  v => updateEstRev(r.id, 'mid',  v), '#6366f1')}</td>
                      <td style={{ padding: '0.5rem 0.875rem' }}>{numInput(r.high, v => updateEstRev(r.id, 'high', v), '#10b981')}</td>
                      <td style={{ padding: '0.5rem 0.5rem', textAlign: 'center' }}>
                        <button onClick={() => deleteEstRev(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', opacity: 0.6 }} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.6}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {estRevs.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#f0fdf4', borderTop: '2px solid #bbf7d0' }}>
                      <td colSpan={2} style={{ padding: '0.75rem 0.875rem', fontSize: '0.72rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>Sous-total estimé</td>
                      <td style={{ padding: '0.75rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.9rem', color: '#3b82f6' }}>{fmt(totRevLow)}</td>
                      <td style={{ padding: '0.75rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.9rem', color: '#6366f1' }}>{fmt(totRevMid)}</td>
                      <td style={{ padding: '0.75rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.9rem', color: '#10b981' }}>{fmt(totRevHigh)}</td>
                      <td />
                    </tr>
                    <tr style={{ background: '#dcfce7', borderTop: '1px solid #bbf7d0' }}>
                      <td colSpan={2} style={{ padding: '0.75rem 0.875rem', fontSize: '0.72rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>Total (estimé + confirmé {fmt(totalRev)})</td>
                      <td style={{ padding: '0.75rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.95rem', color: '#3b82f6' }}>{fmt(totalRev + totRevLow)}</td>
                      <td style={{ padding: '0.75rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.95rem', color: '#6366f1' }}>{fmt(totalRev + totRevMid)}</td>
                      <td style={{ padding: '0.75rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.95rem', color: '#10b981' }}>{fmt(totalRev + totRevHigh)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* ── Dépenses prévisionnelles ── */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.125rem 1.5rem', borderBottom: '1px solid var(--border)', background: '#fff8f8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowDownRight size={15} color="#dc2626" />
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Dépenses prévisionnelles</h3>
                </div>
                <button onClick={addEstExp} className="btn-primary" style={{ background: 'var(--primary)', color: 'white', fontSize: '0.78rem', padding: '0.45rem 0.875rem' }}>
                  <Plus size={13} /> Ajouter
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '1px solid var(--border)' }}>
                    <TH style={{ width: '30%' }}>Libellé</TH>
                    <TH style={{ width: '18%' }}>Catégorie</TH>
                    <TH align="right" style={{ color: '#3b82f6' }}>📉 Basse</TH>
                    <TH align="right" style={{ color: '#6366f1' }}>📊 Moyenne</TH>
                    <TH align="right" style={{ color: '#10b981' }}>📈 Haute</TH>
                    <TH style={{ width: 36 }} />
                  </tr>
                </thead>
                <tbody>
                  {/* Confirmed expenses — read-only */}
                  {expenses.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border)', background: '#fff8f8' }}>
                      <td style={{ padding: '0.5rem 0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '2px 6px', borderRadius: 99, background: '#fecaca', color: '#b91c1c', flexShrink: 0 }}>✓</span>
                          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{e.label || '—'}</p>
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.875rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>{e.cat || '—'}</span>
                      </td>
                      <td style={{ padding: '0.5rem 0.875rem', textAlign: 'right', fontWeight: 700, fontSize: '0.875rem', color: '#dc2626' }}>{fmt(e.amount)}</td>
                      <td style={{ padding: '0.5rem 0.875rem', textAlign: 'right', fontWeight: 700, fontSize: '0.875rem', color: '#dc2626' }}>{fmt(e.amount)}</td>
                      <td style={{ padding: '0.5rem 0.875rem', textAlign: 'right', fontWeight: 700, fontSize: '0.875rem', color: '#dc2626' }}>{fmt(e.amount)}</td>
                      <td />
                    </tr>
                  ))}
                  {expenses.length > 0 && (
                    <tr style={{ background: '#fee2e2', borderBottom: '2px solid #fecaca' }}>
                      <td colSpan={2} style={{ padding: '0.5rem 0.875rem', fontSize: '0.65rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total confirmé</td>
                      <td style={{ padding: '0.5rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.875rem', color: '#dc2626' }}>{fmt(totalExp)}</td>
                      <td style={{ padding: '0.5rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.875rem', color: '#dc2626' }}>{fmt(totalExp)}</td>
                      <td style={{ padding: '0.5rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.875rem', color: '#dc2626' }}>{fmt(totalExp)}</td>
                      <td />
                    </tr>
                  )}
                  {/* Estimation rows — editable */}
                  {estExps.length === 0 && expenses.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucune dépense. Cliquez sur "+ Ajouter" pour ajouter une estimation.</td></tr>
                  )}
                  {estExps.length === 0 && expenses.length > 0 && (
                    <tr><td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>Aucune dépense prévisionnelle supplémentaire.</td></tr>
                  )}
                  {estExps.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.5rem 0.875rem' }}>
                        {cellInput(e.label, v => updateEstExp(e.id, 'label', v))}
                      </td>
                      <td style={{ padding: '0.5rem 0.875rem' }}>
                        <select
                          value={e.cat}
                          onChange={ev => updateEstExp(e.id, 'cat', ev.target.value)}
                          style={{ width: '100%', background: 'transparent', border: '1px solid transparent', borderRadius: '6px', padding: '4px 6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', outline: 'none', cursor: 'pointer' }}
                          onFocus={ev => { ev.currentTarget.style.borderColor = '#6366f1'; ev.currentTarget.style.background = '#fafafe'; }}
                          onBlur={ev => { ev.currentTarget.style.borderColor = 'transparent'; ev.currentTarget.style.background = 'transparent'; }}
                        >
                          {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '0.5rem 0.875rem' }}>{numInput(e.low,  v => updateEstExp(e.id, 'low',  v), '#3b82f6')}</td>
                      <td style={{ padding: '0.5rem 0.875rem' }}>{numInput(e.mid,  v => updateEstExp(e.id, 'mid',  v), '#6366f1')}</td>
                      <td style={{ padding: '0.5rem 0.875rem' }}>{numInput(e.high, v => updateEstExp(e.id, 'high', v), '#10b981')}</td>
                      <td style={{ padding: '0.5rem 0.5rem', textAlign: 'center' }}>
                        <button onClick={() => deleteEstExp(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', opacity: 0.6 }} onMouseEnter={ev=>ev.currentTarget.style.opacity=1} onMouseLeave={ev=>ev.currentTarget.style.opacity=0.6}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {estExps.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#fef2f2', borderTop: '2px solid #fecaca' }}>
                      <td colSpan={2} style={{ padding: '0.75rem 0.875rem', fontSize: '0.72rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>Sous-total estimé</td>
                      <td style={{ padding: '0.75rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.9rem', color: '#3b82f6' }}>{fmt(totExpLow)}</td>
                      <td style={{ padding: '0.75rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.9rem', color: '#6366f1' }}>{fmt(totExpMid)}</td>
                      <td style={{ padding: '0.75rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.9rem', color: '#10b981' }}>{fmt(totExpHigh)}</td>
                      <td />
                    </tr>
                    <tr style={{ background: '#fee2e2', borderTop: '1px solid #fecaca' }}>
                      <td colSpan={2} style={{ padding: '0.75rem 0.875rem', fontSize: '0.72rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>Total (estimé + confirmé {fmt(totalExp)})</td>
                      <td style={{ padding: '0.75rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.95rem', color: '#3b82f6' }}>{fmt(totalExp + totExpLow)}</td>
                      <td style={{ padding: '0.75rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.95rem', color: '#6366f1' }}>{fmt(totalExp + totExpMid)}</td>
                      <td style={{ padding: '0.75rem 0.875rem', textAlign: 'right', fontWeight: 900, fontSize: '0.95rem', color: '#10b981' }}>{fmt(totalExp + totExpHigh)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* ── 3-scenario balance summary ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              {[
                { label: 'Scénario Bas', icon: '📉', rev: totalRev + totRevLow, exp: totalExp + totExpLow, bal: balLow, accentBg: '#eff6ff', accentBorder: '#bfdbfe', accentColor: '#2563eb' },
                { label: 'Scénario Moyen', icon: '📊', rev: totalRev + totRevMid, exp: totalExp + totExpMid, bal: balMid, accentBg: '#eef2ff', accentBorder: '#c7d2fe', accentColor: '#4f46e5' },
                { label: 'Scénario Haut', icon: '📈', rev: totalRev + totRevHigh, exp: totalExp + totExpHigh, bal: balHigh, accentBg: '#f0fdf4', accentBorder: '#bbf7d0', accentColor: '#16a34a' },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: '1.5rem', border: `1px solid ${s.accentBorder}`, background: s.accentBg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                    <p style={{ fontSize: '0.72rem', fontWeight: 800, color: s.accentColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Recettes totales</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#16a34a' }}>+{fmt(s.rev)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Dépenses totales</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ef4444' }}>-{fmt(s.exp)}</span>
                    </div>
                    <div style={{ height: '1px', background: s.accentBorder, margin: '0.25rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>Balance</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: s.bal >= 0 ? '#16a34a' : '#dc2626', letterSpacing: '-0.02em' }}>
                        {s.bal >= 0 ? '+' : ''}{fmt(s.bal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        );
      })()}

      {/* ── Modal (expenses / revenues) ── */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, type: 'expenses', editing: null })} title={modal.editing ? 'Modifier' : (modal.type === 'expenses' ? 'Nouvelle Dépense' : 'Nouvelle Recette')}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>LIBELLÉ</label>
            <input required type="text" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>MONTANT (€)</label>
              <input required type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>CATÉGORIE</label>
              <select value={form.cat || form.category || ''} onChange={e => setForm({ ...form, cat: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}>
                {(modal.type === 'expenses' ? EXPENSE_CATS : REVENUE_CATS).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DATE</label>
            <input type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NOTES</label>
            <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', resize: 'vertical' }} />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '1rem', background: 'var(--text-main)', color: 'white', borderRadius: '14px' }}>
            {modal.editing ? 'Enregistrer' : 'Ajouter'}
          </button>
        </form>
      </Modal>

    </div>
  );
}
