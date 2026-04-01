import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { Plus, Trash2, Edit2, Mail, Phone, Check, Clock, X, Users } from 'lucide-react';
import Modal from '../../components/shared/Modal';

const COTISATION_BADGE = {
  paid:    { label: 'À jour', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  pending: { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  unpaid:  { label: 'Non payé', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

const EMPTY_BUREAU = { firstName: '', lastName: '', role: '', email: '', phone: '', joinDate: '', cotisation: 'paid' };
const EMPTY_ADHERENT = { firstName: '', lastName: '', role: 'Adhérent', email: '', joinDate: '', cotisation: 'paid' };

export default function MembersView() {
  const { data, addItem, updateItem, deleteItem } = useEvent();
  const bureau = data.poles.members?.bureau || [];
  const adherents = data.poles.members?.adherents || [];

  const [tab, setTab] = useState('bureau');
  const [modal, setModal] = useState({ open: false, type: 'bureau', editing: null });
  const [form, setForm] = useState(EMPTY_BUREAU);

  const openModal = (type, item = null) => {
    setForm(item ? { ...item } : (type === 'bureau' ? { ...EMPTY_BUREAU } : { ...EMPTY_ADHERENT }));
    setModal({ open: true, type, editing: item });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const avatar = `${form.firstName[0] || ''}${form.lastName[0] || ''}`.toUpperCase();
    const payload = { ...form, avatar };
    if (modal.editing) {
      updateItem('members', modal.type, modal.editing.id, payload);
    } else {
      addItem('members', modal.type, { ...payload, id: Date.now().toString() });
    }
    setModal({ open: false, type: 'bureau', editing: null });
  };

  const list = tab === 'bureau' ? bureau : adherents;

  const tabs = [
    { id: 'bureau', label: 'Bureau', count: bureau.length },
    { id: 'adherents', label: 'Adhérents', count: adherents.length },
  ];

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Membres</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{bureau.length + adherents.length} membres au total</p>
        </div>
        <button className="btn-primary" onClick={() => openModal(tab)}>
          <Plus size={15} /> Ajouter
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: '#1a1a1a', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '0.45rem 1rem', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: tab === t.id ? '#2a2a2a' : 'transparent',
            color: tab === t.id ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: tab === t.id ? 700 : 400, fontSize: '0.875rem', transition: 'all 0.12s',
          }}>
            {t.label} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {list.map(m => {
          const badge = COTISATION_BADGE[m.cotisation] || COTISATION_BADGE.pending;
          return (
            <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', flexShrink: 0 }}>
                  {m.avatar || `${m.firstName?.[0]}${m.lastName?.[0]}`}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{m.firstName} {m.lastName}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.role}</p>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: 99, color: badge.color, background: badge.bg }}>{badge.label}</span>
              </div>

              {(m.email || m.phone) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {m.email && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}><Mail size={12} /> {m.email}</div>}
                  {m.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}><Phone size={12} /> {m.phone}</div>}
                </div>
              )}

              {m.joinDate && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Membre depuis {new Date(m.joinDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <button onClick={() => openModal(tab, m)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '5px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                  <Edit2 size={12} /> Modifier
                </button>
                <button onClick={() => deleteItem('members', tab, m.id)} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', padding: '5px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal open={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.editing ? 'Modifier le membre' : 'Ajouter un membre'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Prénom *</label>
              <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nom *</label>
              <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Rôle</label>
            <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
          </div>
          {tab === 'bureau' && (
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Téléphone</label>
              <input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Date d'adhésion</label>
              <input type="date" value={form.joinDate} onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Cotisation</label>
              <select value={form.cotisation} onChange={e => setForm(f => ({ ...f, cotisation: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }}>
                <option value="paid">À jour</option>
                <option value="pending">En attente</option>
                <option value="unpaid">Non payé</option>
              </select>
            </div>
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
