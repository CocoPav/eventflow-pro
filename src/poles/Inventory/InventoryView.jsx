import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { Plus, Trash2, Edit2, Package, Search } from 'lucide-react';
import Modal from '../../components/shared/Modal';

const STATUS_MAP = {
  acquired:    { label: 'Acquis',           color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  to_ask:      { label: 'À demander',       color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  to_buy:      { label: 'À acheter',        color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  asking:      { label: 'Demande en cours', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  in_progress: { label: 'En cours',        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  waiting:     { label: 'En attente',      color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  to_create:   { label: 'À créer',         color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
};

const POLES = ['Général', 'Buvette', 'Sécurité', 'Accueil', 'Technique', 'Restauration', 'Décoration', 'Logistique'];

const EMPTY = { title: '', quantity: 1, owner: '', responsible: '', status: 'to_ask', pole: 'Général', storageLocation: '', installDate: '', returnDate: '', notes: '', unitPrice: '' };

export default function InventoryView() {
  const { data, addItem, updateItem, deleteItem } = useEvent();
  const materials = data.poles.logistics?.materials || [];

  const [search, setSearch] = useState('');
  const [filterPole, setFilterPole] = useState('all');
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY);

  const openModal = (item = null) => {
    setForm(item ? { ...item } : { ...EMPTY });
    setModal({ open: true, editing: item });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, quantity: parseInt(form.quantity) || 1, unitPrice: parseFloat(form.unitPrice) || 0, qty: parseInt(form.quantity) || 1, label: form.title };
    if (modal.editing) {
      updateItem('logistics', 'materials', modal.editing.id, payload);
    } else {
      addItem('logistics', 'materials', { ...payload, id: Date.now().toString() });
    }
    setModal({ open: false, editing: null });
  };

  const filtered = materials.filter(m => {
    const matchSearch = !search || m.title?.toLowerCase().includes(search.toLowerCase()) || m.responsible?.toLowerCase().includes(search.toLowerCase());
    const matchPole = filterPole === 'all' || m.pole === filterPole;
    return matchSearch && matchPole;
  });

  const poles = [...new Set(materials.map(m => m.pole).filter(Boolean))];

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Inventaire</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{materials.length} article{materials.length > 1 ? 's' : ''} répertoriés</p>
        </div>
        <button className="btn-primary" onClick={() => openModal()}><Plus size={15} /> Ajouter</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 300 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.8rem' }}
          />
        </div>
        <select value={filterPole} onChange={e => setFilterPole(e.target.value)} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-main)' }}>
          <option value="all">Tous les pôles</option>
          {poles.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Article', 'Qté', 'Pôle', 'Responsable', 'Lieu de stockage', 'Statut', ''].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const st = STATUS_MAP[m.status] || STATUS_MAP.to_ask;
              return (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package size={14} color="var(--text-muted)" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.title}</p>
                        {m.owner && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.owner}</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 700, fontSize: '0.9rem' }}>{m.quantity}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.pole || '—'}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.responsible || '—'}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.storageLocation || '—'}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: 99, color: st.color, background: st.bg }}>{st.label}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => openModal(m)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}><Edit2 size={11} /></button>
                      <button onClick={() => deleteItem('logistics', 'materials', m.id)} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}><Trash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucun article</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal open={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.editing ? 'Modifier l\'article' : 'Nouvel article'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Désignation *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Quantité</label>
              <input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Prix unitaire (€)</label>
              <input type="number" step="0.01" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Pôle</label>
              <select value={form.pole} onChange={e => setForm(f => ({ ...f, pole: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }}>
                {POLES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Propriétaire / Fournisseur</label>
              <input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Responsable</label>
              <input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Statut</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }}>
                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Lieu de stockage</label>
              <input value={form.storageLocation} onChange={e => setForm(f => ({ ...f, storageLocation: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Date d'installation</label>
              <input type="date" value={form.installDate} onChange={e => setForm(f => ({ ...f, installDate: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Date de retour</label>
              <input type="date" value={form.returnDate} onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem', resize: 'vertical' }} />
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
