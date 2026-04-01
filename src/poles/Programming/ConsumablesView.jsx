import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import Modal from '../../components/shared/Modal';

const inputStyle = { width: '100%', padding: '0.6rem 0.875rem', borderRadius: 8, background: '#f8f9fa', border: '1px solid #e9ecef', color: '#1a1a1b', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '0.3rem', letterSpacing: '0.04em' };
const fmt = v => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
const fmtN = v => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(v || 0);

const DRINK_STATUSES = { to_order: { label: 'À commander', color: '#94a3b8' }, ordered: { label: 'Commandé', color: '#f59e0b' }, received: { label: 'Reçu', color: '#10b981' }, in_use: { label: 'En service', color: '#6B63CC' }, empty: { label: 'Épuisé', color: '#ef4444' } };
const FOOD_STATUSES  = { to_order: { label: 'À commander', color: '#94a3b8' }, ordered: { label: 'Commandé', color: '#f59e0b' }, received: { label: 'Reçu', color: '#10b981' }, in_service: { label: 'En service', color: '#6B63CC' }, done: { label: 'Épuisé', color: '#ef4444' } };

const DRINK_CATEGORIES = ['Alcool', 'Soft', 'Eau', 'Jus', 'Autre'];
const FOOD_CATEGORIES  = ['Plat', 'Snack', 'Dessert', 'Végé', 'Autre'];
const CONTAINER_UNITS  = ['Fût', 'Cubi', 'Bouteille', 'Bidon', 'Canette', 'Autre'];
const FOOD_UNITS       = ['portion', 'pièce', 'kg', 'litre', 'sachet', 'barquette'];

// Calculations for drinks
function drinkCalc(item) {
  if (!item) return {};
  const qty = item.quantityOrdered || 0;
  const servingsPerContainer = item.containerVolumeLiters > 0 && item.servingVolumeCL > 0
    ? (item.containerVolumeLiters * 100) / item.servingVolumeCL : 0;
  const totalLiters         = qty * (item.containerVolumeLiters || 0);
  const totalPurchaseCost   = qty * (item.unitCost || 0);
  const costPerServing      = servingsPerContainer > 0 ? (item.unitCost || 0) / servingsPerContainer : 0;
  const profitPerServing    = (item.servingPrice || 0) - costPerServing;
  const revenuePerContainer = servingsPerContainer * (item.servingPrice || 0);
  const estimatedRevenue    = qty * revenuePerContainer;
  const actualRevenue       = (item.quantityConsumed || 0) * revenuePerContainer;
  const totalMargin         = estimatedRevenue - totalPurchaseCost;
  const marginPct           = revenuePerContainer > 0 ? (profitPerServing / (item.servingPrice || 1)) * 100 : 0;
  return { servingsPerContainer, totalLiters, totalPurchaseCost, costPerServing, profitPerServing, revenuePerContainer, estimatedRevenue, actualRevenue, totalMargin, marginPct };
}

// Calculations for food
function foodCalc(item) {
  if (!item) return {};
  const componentCost = (item.components || []).reduce((s, c) => s + (c.unitCost || 0), 0);
  const effectiveUnitCost = item.unitCost || componentCost;
  const marginPerUnit = (item.sellingPrice || 0) - effectiveUnitCost;
  const totalCost     = (item.quantityOrdered || 0) * effectiveUnitCost;
  const totalRevenue  = (item.quantityOrdered || 0) * (item.sellingPrice || 0);
  const totalMargin   = totalRevenue - totalCost;
  const marginPct     = item.sellingPrice > 0 ? (marginPerUnit / item.sellingPrice) * 100 : 0;
  return { effectiveUnitCost, marginPerUnit, totalCost, totalRevenue, totalMargin, marginPct };
}

function StatusPill({ status, map }) {
  const s = map[status] || { label: status, color: '#94a3b8' };
  return <span style={{ background: s.color + '18', color: s.color, padding: '2px 9px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700 }}>{s.label}</span>;
}

function MarginBadge({ pct }) {
  const color = pct >= 50 ? '#10b981' : pct >= 20 ? '#f59e0b' : '#ef4444';
  return <span style={{ background: color + '15', color, padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700 }}>{Math.round(pct)}% marge</span>;
}

// ─────────────────────────────────────────────────────
// BOISSONS
// ─────────────────────────────────────────────────────
const EMPTY_DRINK = { type: 'drink', name: '', category: 'Alcool', containerLabel: 'Fût', containerVolumeLiters: 20, unitCost: 0, quantityOrdered: 1, servingVolumeCL: 25, servingPrice: 0, supplier: '', responsible: '', status: 'to_order', quantityConsumed: 0, notes: '' };

function DrinksPanel() {
  const { data, addItem, updateItem, deleteItem } = useEvent();
  const drinks = (data.poles.logistics.consumables || []).filter(c => c.type === 'drink');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_DRINK);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_DRINK); setIsModalOpen(true); };
  const openEdit = (d) => { setEditing(d); setForm({ ...d }); setIsModalOpen(true); };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) updateItem('logistics', 'consumables', editing.id, form);
    else addItem('logistics', 'consumables', form);
    setIsModalOpen(false); setEditing(null);
  };

  const totalCost = drinks.reduce((s, d) => s + drinkCalc(d).totalPurchaseCost, 0);
  const totalRev  = drinks.reduce((s, d) => s + drinkCalc(d).estimatedRevenue, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Coût total', value: fmt(totalCost), color: '#ef4444' },
          { label: 'Revenu potentiel', value: fmt(totalRev), color: '#10b981' },
          { label: 'Marge potentielle', value: fmt(totalRev - totalCost), color: totalRev - totalCost >= 0 ? '#6B63CC' : '#ef4444' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={openAdd} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}><Plus size={15} /> Nouvelle boisson</button>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {drinks.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Aucune boisson. <button onClick={openAdd} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 700 }}>+ Ajouter</button></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '13%' }} />{/* Produit */}
                <col style={{ width: '7%'  }} />{/* Contenant */}
                <col style={{ width: '5%'  }} />{/* Nb cmd. */}
                <col style={{ width: '5%'  }} />{/* L total */}
                <col style={{ width: '6%'  }} />{/* Prix/unité */}
                <col style={{ width: '7%'  }} />{/* Total achat */}
                <col style={{ width: '5%'  }} />{/* Vol. Verre */}
                <col style={{ width: '6%'  }} />{/* Verres/unité */}
                <col style={{ width: '6%'  }} />{/* Coût/verre */}
                <col style={{ width: '6%'  }} />{/* Prix vente */}
                <col style={{ width: '6%'  }} />{/* Bénéf/verre */}
                <col style={{ width: '8%'  }} />{/* Estim. totale */}
                <col style={{ width: '8%'  }} />{/* Recette réelle */}
                <col style={{ width: '6%'  }} />{/* Marge */}
                <col style={{ width: '7%'  }} />{/* Statut */}
                <col style={{ width: '7%'  }} />{/* Responsable */}
                <col style={{ width: '3%'  }} />{/* Actions */}
              </colgroup>
              <thead>
                {/* Group header */}
                <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #f1f3f5' }}>
                  <th colSpan={1} style={{ padding: '0.3rem 0.6rem', fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }} />
                  <th colSpan={5} style={{ padding: '0.3rem 0.6rem', fontSize: '0.55rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', borderLeft: '2px solid #dbeafe', background: '#eff6ff' }}>Achat</th>
                  <th colSpan={5} style={{ padding: '0.3rem 0.6rem', fontSize: '0.55rem', fontWeight: 800, color: '#F86B1A', textTransform: 'uppercase', letterSpacing: '0.06em', borderLeft: '2px solid #fed7aa', background: '#fff7ed' }}>Par verre</th>
                  <th colSpan={3} style={{ padding: '0.3rem 0.6rem', fontSize: '0.55rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em', borderLeft: '2px solid #bbf7d0', background: '#f0fdf4' }}>Résultats</th>
                  <th colSpan={3} style={{ padding: '0.3rem 0.6rem', background: '#f8f9fa' }} />
                </tr>
                {/* Column header */}
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                  {[
                    { label: 'PRODUIT',       bg: '' },
                    { label: 'CONTENANT',     bg: '#eff6ff', bl: '#dbeafe' },
                    { label: 'NB CMD.',       bg: '#eff6ff' },
                    { label: 'L TOTAL',       bg: '#eff6ff', title: 'Nb × L/unité' },
                    { label: 'PRIX/UNITÉ',    bg: '#eff6ff' },
                    { label: 'TOTAL ACHAT',   bg: '#eff6ff', title: 'Nb × Prix/unité' },
                    { label: 'VOL. VERRE',    bg: '#fff7ed', bl: '#fed7aa', title: 'Volume par verre servi' },
                    { label: 'VERRES/UNITÉ',  bg: '#fff7ed', title: 'Nb de verres par contenant' },
                    { label: 'COÛT/VERRE',    bg: '#fff7ed', title: 'Prix/unité ÷ Verres/unité' },
                    { label: 'PRIX VENTE',    bg: '#fff7ed', title: 'Prix de vente par verre' },
                    { label: 'BÉNÉF/VERRE',   bg: '#fff7ed', title: 'Prix vente − Coût/verre' },
                    { label: 'ESTIM. TOTALE', bg: '#f0fdf4', bl: '#bbf7d0', title: 'Si tout vendu' },
                    { label: 'RECETTE RÉELLE',bg: '#f0fdf4', title: 'Selon unités consommées' },
                    { label: 'MARGE',         bg: '#f0fdf4', title: '% marge sur prix de vente' },
                    { label: 'STATUT',        bg: '' },
                    { label: 'RESPONSABLE',   bg: '' },
                    { label: '',              bg: '' },
                  ].map(h => (
                    <th key={h.label} title={h.title || ''} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', fontSize: '0.56rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', whiteSpace: 'nowrap', background: h.bg || '#f8f9fa', borderLeft: h.bl ? `2px solid ${h.bl}` : undefined, cursor: h.title ? 'help' : 'default' }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drinks.map(d => {
                  const c = drinkCalc(d);
                  const td  = { padding: '0.55rem 0.6rem', fontSize: '0.75rem' };
                  const tdn = { ...td, fontWeight: 700, textAlign: 'right' };
                  const ab  = { background: '#fafcff' };
                  const ob  = { background: '#fffaf5' };
                  const rb  = { background: '#f7fef9' };
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f3f5' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {/* Produit */}
                      <td style={td}>
                        <p style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</p>
                        <span style={{ background: '#f1f3f5', color: '#64748b', padding: '0px 6px', borderRadius: 99, fontSize: '0.6rem', fontWeight: 600 }}>{d.category}</span>
                      </td>
                      {/* Contenant (Fût 20L) */}
                      <td style={{ ...td, ...ab, borderLeft: '2px solid #dbeafe', color: '#3b82f6', fontWeight: 600, whiteSpace: 'nowrap' }}>{d.containerLabel} {d.containerVolumeLiters}L</td>
                      {/* Nb cmd. */}
                      <td style={{ ...tdn, ...ab }}>{d.quantityOrdered}</td>
                      {/* L total */}
                      <td style={{ ...tdn, ...ab, color: '#475569' }}>{fmtN(c.totalLiters)} L</td>
                      {/* Prix/unité */}
                      <td style={{ ...tdn, ...ab }}>{fmt(d.unitCost)}</td>
                      {/* Total achat */}
                      <td style={{ ...tdn, ...ab, color: '#ef4444' }}>{fmt(c.totalPurchaseCost)}</td>
                      {/* Vol. Verre */}
                      <td style={{ ...td, ...ob, borderLeft: '2px solid #fed7aa', color: '#64748b', whiteSpace: 'nowrap' }}>{d.servingVolumeCL} cl</td>
                      {/* Verres/unité */}
                      <td style={{ ...tdn, ...ob }}>{fmtN(c.servingsPerContainer)}</td>
                      {/* Coût/verre */}
                      <td style={{ ...tdn, ...ob, color: '#64748b' }}>{fmt(c.costPerServing)}</td>
                      {/* Prix vente */}
                      <td style={{ ...tdn, ...ob, color: '#10b981' }}>{fmt(d.servingPrice)}</td>
                      {/* Bénéf/verre */}
                      <td style={{ ...tdn, ...ob, color: c.profitPerServing >= 0 ? '#6B63CC' : '#ef4444' }}>{fmt(c.profitPerServing)}</td>
                      {/* Estim. totale */}
                      <td style={{ ...tdn, ...rb, borderLeft: '2px solid #bbf7d0', color: '#10b981' }}>{fmt(c.estimatedRevenue)}</td>
                      {/* Recette réelle */}
                      <td style={{ ...tdn, ...rb, color: d.quantityConsumed > 0 ? '#6B63CC' : '#94a3b8' }}>
                        {d.quantityConsumed > 0 ? fmt(c.actualRevenue) : <span style={{ fontWeight: 400, color: '#e2e8f0' }}>—</span>}
                      </td>
                      {/* Marge */}
                      <td style={{ ...td, ...rb }}><MarginBadge pct={c.marginPct} /></td>
                      {/* Statut */}
                      <td style={td}><StatusPill status={d.status} map={DRINK_STATUSES} /></td>
                      {/* Responsable */}
                      <td style={{ ...td, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.responsible || '—'}</td>
                      {/* Actions */}
                      <td style={{ padding: '0.55rem 0.4rem' }}>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <button onClick={() => openEdit(d)} style={{ padding: '3px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.color = '#475569'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}><Edit2 size={12} /></button>
                          <button onClick={() => deleteItem('logistics', 'consumables', d.id)} style={{ padding: '3px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditing(null); }} title={editing ? 'Modifier la boisson' : 'Nouvelle boisson'} maxWidth="580px">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div><label style={labelStyle}>NOM *</label><input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="Bière pression, Vin rouge..." /></div>
            <div>
              <label style={labelStyle}>CATÉGORIE</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>{DRINK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            </div>
          </div>

          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.25rem' }}>Contenant / Achat</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>TYPE</label>
              <select value={form.containerLabel} onChange={e => setForm(f => ({ ...f, containerLabel: e.target.value }))} style={inputStyle}>{CONTAINER_UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select>
            </div>
            <div><label style={labelStyle}>VOLUME (L)</label><input type="number" min={0} step={0.1} value={form.containerVolumeLiters} onChange={e => setForm(f => ({ ...f, containerVolumeLiters: parseFloat(e.target.value) || 0 }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>COÛT / UNITÉ (€)</label><input type="number" min={0} step={0.01} value={form.unitCost} onChange={e => setForm(f => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>QTÉ COMMANDÉE</label><input type="number" min={0} value={form.quantityOrdered} onChange={e => setForm(f => ({ ...f, quantityOrdered: parseInt(e.target.value) || 0 }))} style={inputStyle} /></div>
          </div>

          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.25rem' }}>Service / Vente</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><label style={labelStyle}>VOLUME PORTION (cl)</label><input type="number" min={1} step={1} value={form.servingVolumeCL} onChange={e => setForm(f => ({ ...f, servingVolumeCL: parseFloat(e.target.value) || 0 }))} style={inputStyle} placeholder="25" /></div>
            <div><label style={labelStyle}>PRIX DE VENTE / PORTION (€)</label><input type="number" min={0} step={0.1} value={form.servingPrice} onChange={e => setForm(f => ({ ...f, servingPrice: parseFloat(e.target.value) || 0 }))} style={inputStyle} placeholder="2.50" /></div>
          </div>

          {/* Auto-calc preview */}
          {form.containerVolumeLiters > 0 && form.servingVolumeCL > 0 && (
            <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {(() => { const c = drinkCalc(form); return (
                <>
                  <div><p style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Verres/unité</p><p style={{ fontSize: '1rem', fontWeight: 800 }}>{fmtN(c.servingsPerContainer)}</p></div>
                  <div><p style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Coût/verre</p><p style={{ fontSize: '1rem', fontWeight: 800, color: '#64748b' }}>{fmt(c.costPerServing)}</p></div>
                  <div><p style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Bénéf/verre</p><p style={{ fontSize: '1rem', fontWeight: 800, color: c.profitPerServing >= 0 ? '#6B63CC' : '#ef4444' }}>{fmt(c.profitPerServing)}</p></div>
                  <div><p style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total achat</p><p style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444' }}>{fmt(c.totalPurchaseCost)}</p></div>
                  <div><p style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Estim. totale</p><p style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>{fmt(c.estimatedRevenue)}</p></div>
                  <div><p style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Marge</p><p style={{ fontSize: '1rem', fontWeight: 800, color: c.marginPct >= 50 ? '#10b981' : c.marginPct >= 20 ? '#f59e0b' : '#ef4444' }}>{Math.round(c.marginPct)}%</p></div>
                </>
              ); })()}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>STATUT</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>{Object.entries(DRINK_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
            </div>
            <div><label style={labelStyle}>FOURNISSEUR</label><input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>RESPONSABLE</label><input type="text" value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><label style={labelStyle}>QTÉ CONSOMMÉE (réel)</label><input type="number" min={0} value={form.quantityConsumed} onChange={e => setForm(f => ({ ...f, quantityConsumed: parseInt(e.target.value) || 0 }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>NOTES</label><input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={inputStyle} /></div>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '0.25rem' }}>{editing ? 'Mettre à jour' : 'Enregistrer'}</button>
        </form>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// NOURRITURE
// ─────────────────────────────────────────────────────
const EMPTY_FOOD = { type: 'food', name: '', category: 'Plat', unit: 'portion', unitCost: 0, sellingPrice: 0, quantityOrdered: 0, components: [], supplier: '', responsible: '', status: 'to_order', quantityConsumed: 0, notes: '' };
const EMPTY_COMP = { name: '', quantity: 1, unit: 'pièce', unitCost: 0 };

function FoodPanel() {
  const { data, addItem, updateItem, deleteItem } = useEvent();
  const foods = (data.poles.logistics.consumables || []).filter(c => c.type === 'food');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FOOD);
  const [expandedId, setExpandedId] = useState(null);
  const [newComp, setNewComp] = useState(EMPTY_COMP);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FOOD); setIsModalOpen(true); };
  const openEdit = (f) => { setEditing(f); setForm({ ...f, components: f.components || [] }); setIsModalOpen(true); };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) updateItem('logistics', 'consumables', editing.id, form);
    else addItem('logistics', 'consumables', form);
    setIsModalOpen(false); setEditing(null);
  };

  const addComp = () => {
    if (!newComp.name.trim()) return;
    setForm(f => ({ ...f, components: [...f.components, { ...newComp, id: Date.now().toString() }] }));
    setNewComp(EMPTY_COMP);
  };
  const removeComp = (id) => setForm(f => ({ ...f, components: f.components.filter(c => c.id !== id) }));

  const componentCost = form.components.reduce((s, c) => s + (c.unitCost || 0), 0);

  const totalCost = foods.reduce((s, f) => s + foodCalc(f).totalCost, 0);
  const totalRev  = foods.reduce((s, f) => s + foodCalc(f).totalRevenue, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Coût total', value: fmt(totalCost), color: '#ef4444' },
          { label: 'Revenu potentiel', value: fmt(totalRev), color: '#10b981' },
          { label: 'Marge potentielle', value: fmt(totalRev - totalCost), color: totalRev - totalCost >= 0 ? '#6B63CC' : '#ef4444' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={openAdd} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}><Plus size={15} /> Nouveau produit</button>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {foods.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Aucun produit. <button onClick={openAdd} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 700 }}>+ Ajouter</button></div>
        ) : foods.map((f, idx) => {
          const c = foodCalc(f);
          const isExpanded = expandedId === f.id;
          const comps = f.components || [];
          return (
            <div key={f.id} style={{ borderBottom: idx < foods.length - 1 || isExpanded ? '1px solid #f1f3f5' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {comps.length > 0 && (
                  <button onClick={() => setExpandedId(isExpanded ? null : f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#94a3b8', flexShrink: 0 }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                )}
                {comps.length === 0 && <div style={{ width: 18 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{f.name}</span>
                    <span style={{ background: '#f1f3f5', color: '#475569', padding: '1px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 600 }}>{f.category}</span>
                    {comps.length > 0 && <span style={{ background: 'rgba(107,99,204,0.08)', color: '#6B63CC', padding: '1px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700 }}>{comps.length} ingrédient{comps.length > 1 ? 's' : ''}</span>}
                    <StatusPill status={f.status} map={FOOD_STATUSES} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', fontSize: '0.78rem', flexShrink: 0, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Qté</p>
                    <p style={{ fontWeight: 700 }}>{f.quantityOrdered} {f.unit}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Coût unit.</p>
                    <p style={{ fontWeight: 700 }}>{fmt(c.effectiveUnitCost)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Vente</p>
                    <p style={{ fontWeight: 700, color: '#10b981' }}>{fmt(f.sellingPrice)}</p>
                  </div>
                  <MarginBadge pct={c.marginPct} />
                  <p style={{ fontSize: '0.72rem', color: '#64748b' }}>{f.responsible || '—'}</p>
                </div>
                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                  <button onClick={() => openEdit(f)} style={{ padding: '5px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.color = '#475569'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}><Edit2 size={13} /></button>
                  <button onClick={() => deleteItem('logistics', 'consumables', f.id)} style={{ padding: '5px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}><Trash2 size={13} /></button>
                </div>
              </div>

              {isExpanded && comps.length > 0 && (
                <div style={{ background: '#fafafa', borderTop: '1px solid #f1f3f5', padding: '0.5rem 1.25rem 0.75rem 3.5rem' }}>
                  {comps.map((comp, ci) => (
                    <div key={comp.id || ci} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.3rem 0', borderBottom: ci < comps.length - 1 ? '1px dashed #e9ecef' : 'none', fontSize: '0.78rem' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F86B1A', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontWeight: 600 }}>{comp.name}</span>
                      <span style={{ color: '#64748b' }}>{comp.quantity} {comp.unit}</span>
                      <span style={{ fontWeight: 700 }}>{fmt(comp.unitCost)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditing(null); }} title={editing ? 'Modifier le produit' : 'Nouveau produit alimentaire'} maxWidth="580px">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
            <div><label style={labelStyle}>NOM *</label><input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="Galette saucisse..." /></div>
            <div>
              <label style={labelStyle}>CATÉGORIE</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>{FOOD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            </div>
            <div>
              <label style={labelStyle}>UNITÉ</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} style={inputStyle}>{FOOD_UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select>
            </div>
          </div>

          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.25rem' }}>Ingrédients / Composition</p>
          <div style={{ border: '1px solid #e9ecef', borderRadius: 8, overflow: 'hidden' }}>
            {form.components.map((comp, i) => (
              <div key={comp.id || i} style={{ padding: '0.5rem 0.875rem', borderBottom: '1px solid #f1f3f5', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600 }}>{comp.name}</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{comp.quantity} {comp.unit}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{fmt(comp.unitCost)}</span>
                <button type="button" onClick={() => removeComp(comp.id || i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}><Trash2 size={11} /></button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0.875rem', flexWrap: 'wrap' }}>
              <input type="text" value={newComp.name} onChange={e => setNewComp(c => ({ ...c, name: e.target.value }))} placeholder="Ingrédient" style={{ ...inputStyle, flex: 2, minWidth: 120 }} />
              <input type="number" value={newComp.quantity} min={0} step={1} onChange={e => setNewComp(c => ({ ...c, quantity: parseFloat(e.target.value) || 0 }))} style={{ ...inputStyle, width: 60 }} />
              <input type="text" value={newComp.unit} onChange={e => setNewComp(c => ({ ...c, unit: e.target.value }))} placeholder="pièce" style={{ ...inputStyle, width: 80 }} />
              <input type="number" value={newComp.unitCost} min={0} step={0.01} onChange={e => setNewComp(c => ({ ...c, unitCost: parseFloat(e.target.value) || 0 }))} placeholder="€" style={{ ...inputStyle, width: 72 }} />
              <button type="button" onClick={addComp} style={{ padding: '0.45rem 0.75rem', background: '#f1f3f5', border: '1px solid #e9ecef', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>+ Ajouter</button>
            </div>
          </div>
          {form.components.length > 0 && (
            <p style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', margin: '-0.5rem 0 0' }}>Coût calculé depuis les ingrédients : <strong>{fmt(componentCost)}</strong></p>
          )}

          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.25rem' }}>Prix & Quantités</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>COÛT UNIT. (€) {form.components.length > 0 && <span style={{ color: '#94a3b8', fontWeight: 400 }}>ou laisser 0</span>}</label>
              <input type="number" min={0} step={0.01} value={form.unitCost} onChange={e => setForm(f => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))} style={inputStyle} />
            </div>
            <div><label style={labelStyle}>PRIX DE VENTE (€)</label><input type="number" min={0} step={0.1} value={form.sellingPrice} onChange={e => setForm(f => ({ ...f, sellingPrice: parseFloat(e.target.value) || 0 }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>QTÉ COMMANDÉE</label><input type="number" min={0} value={form.quantityOrdered} onChange={e => setForm(f => ({ ...f, quantityOrdered: parseInt(e.target.value) || 0 }))} style={inputStyle} /></div>
          </div>

          {/* Preview */}
          {form.sellingPrice > 0 && (
            <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {(() => { const c = foodCalc({ ...form, components: form.components }); return (
                <>
                  <div><p style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Coût / portion</p><p style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444' }}>{fmt(c.effectiveUnitCost)}</p></div>
                  <div><p style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Marge / portion</p><p style={{ fontSize: '1rem', fontWeight: 800, color: c.marginPerUnit >= 0 ? '#6B63CC' : '#ef4444' }}>{fmt(c.marginPerUnit)}</p></div>
                  <div><p style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Coût total</p><p style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444' }}>{fmt(c.totalCost)}</p></div>
                  <div><p style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Revenu total</p><p style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>{fmt(c.totalRevenue)}</p></div>
                </>
              ); })()}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>STATUT</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>{Object.entries(FOOD_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
            </div>
            <div><label style={labelStyle}>FOURNISSEUR</label><input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>RESPONSABLE</label><input type="text" value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><label style={labelStyle}>QTÉ CONSOMMÉE (réel)</label><input type="number" min={0} value={form.quantityConsumed} onChange={e => setForm(f => ({ ...f, quantityConsumed: parseInt(e.target.value) || 0 }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>NOTES</label><input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={inputStyle} /></div>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '0.25rem' }}>{editing ? 'Mettre à jour' : 'Enregistrer'}</button>
        </form>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN VIEW
// ─────────────────────────────────────────────────────
export default function ConsumablesView() {
  const [tab, setTab] = useState('drinks');
  const { data } = useEvent();
  const consumables = data.poles.logistics.consumables || [];
  const drinksCount = consumables.filter(c => c.type === 'drink').length;
  const foodsCount  = consumables.filter(c => c.type === 'food').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '3px', background: '#f1f3f5', borderRadius: 12, padding: '3px', alignSelf: 'flex-start' }}>
        {[{ id: 'drinks', label: `🍺 Boissons (${drinksCount})` }, { id: 'food', label: `🥘 Nourriture (${foodsCount})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '0.45rem 1.125rem', borderRadius: 10, border: 'none', background: tab === t.id ? 'white' : 'transparent', color: tab === t.id ? '#1a1a1b' : '#64748b', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'drinks' && <DrinksPanel />}
      {tab === 'food'   && <FoodPanel />}
    </div>
  );
}
