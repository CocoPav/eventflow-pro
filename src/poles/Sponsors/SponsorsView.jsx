import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { Plus, Trash2, Edit2, ExternalLink } from 'lucide-react';
import Modal from '../../components/shared/Modal';

const STATUS_MAP = {
  accordée:       { label: 'Accordée',       color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  en_attente:     { label: 'En attente',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  envoyée:        { label: 'Envoyée',        color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  en_préparation: { label: 'En préparation', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  refusée:        { label: 'Refusée',        color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

const EMPTY = { name: '', type: 'Subvention', requested: '', obtained: '', status: 'en_préparation', year: new Date().getFullYear(), contact: '', deadline: '', notes: '' };

const fmt = v => v != null && v !== '' ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v) : '—';

export default function SponsorsView() {
  const { data, addItem, updateItem, deleteItem } = useEvent();
  const list = data.poles.sponsors?.list || [];

  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY);

  const openModal = (item = null) => {
    setForm(item ? { ...item } : { ...EMPTY });
    setModal({ open: true, editing: item });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, requested: parseFloat(form.requested) || 0, obtained: form.obtained !== '' ? parseFloat(form.obtained) : null };
    if (modal.editing) {
      updateItem('sponsors', 'list', modal.editing.id, payload);
    } else {
      addItem('sponsors', 'list', { ...payload, id: Date.now().toString() });
    }
    setModal({ open: false, editing: null });
  };

  const totalRequested = list.reduce((s, i) => s + (i.requested || 0), 0);
  const totalObtained  = list.filter(i => i.status === 'accordée').reduce((s, i) => s + (i.obtained || 0), 0);

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Sponsors & Subventions</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{list.length} dossier{list.length > 1 ? 's' : ''} en cours</p>
        </div>
        <button className="btn-primary" onClick={() => openModal()}><Plus size={15} /> Ajouter</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total demandé', value: fmt(totalRequested), color: '#6366f1' },
          { label: 'Total obtenu', value: fmt(totalObtained), color: '#22c55e' },
          { label: 'Taux d\'obtention', value: totalRequested > 0 ? `${Math.round((totalObtained / totalRequested) * 100)}%` : '—', color: '#f59e0b' },
        ].map(c => (
          <div key={c.label} className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: c.color }}>{c.value}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Organisme', 'Type', 'Montant demandé', 'Obtenu', 'Échéance', 'Statut', ''].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map(item => {
              const st = STATUS_MAP[item.status] || STATUS_MAP.en_préparation;
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.name}</p>
                    {item.contact && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.contact}</p>}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.type}</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 700, fontSize: '0.875rem' }}>{fmt(item.requested)}</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 700, fontSize: '0.875rem', color: item.obtained ? '#22c55e' : 'var(--text-muted)' }}>{fmt(item.obtained)}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.deadline ? new Date(item.deadline).toLocaleDateString('fr-FR') : '—'}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: 99, color: st.color, background: st.bg }}>{st.label}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => openModal(item)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }}><Edit2 size={11} /></button>
                      <button onClick={() => deleteItem('sponsors', 'list', item.id)} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }}><Trash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucun dossier</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal open={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.editing ? 'Modifier le dossier' : 'Nouveau dossier'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Organisme *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }}>
                {['Subvention', 'Mécénat', 'Partenariat', 'Don'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Statut</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }}>
                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Montant demandé (€)</label>
              <input type="number" value={form.requested} onChange={e => setForm(f => ({ ...f, requested: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Montant obtenu (€)</label>
              <input type="number" value={form.obtained || ''} onChange={e => setForm(f => ({ ...f, obtained: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Contact</label>
              <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Échéance</label>
              <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setModal({ ...modal, open: false })}>Annuler</button>
            <button type="submit" className="btn-primary">Enregistrer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
