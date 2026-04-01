import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { Building2, FileText, Users, Calendar, Hash, MapPin, Edit2, Plus, Trash2 } from 'lucide-react';
import Modal from '../../components/shared/Modal';

const DOC_TYPES = ['Statuts', 'PV d\'assemblée', 'Contrat', 'Convention', 'Devis', 'Facture', 'Autorisation', 'Autre'];
const EMPTY_DOC = { name: '', type: 'Autre', date: '', url: '', notes: '' };

export default function AdminView() {
  const { data, setData } = useEvent();
  const assoc = data.association || {};
  const documents = data.poles.administration?.documents || [];

  const [editAssoc, setEditAssoc] = useState(false);
  const [assocForm, setAssocForm] = useState({ ...assoc });
  const [docModal, setDocModal] = useState({ open: false, editing: null });
  const [docForm, setDocForm] = useState(EMPTY_DOC);

  const saveAssoc = (e) => {
    e.preventDefault();
    setData(prev => ({ ...prev, association: { ...prev.association, ...assocForm } }));
    setEditAssoc(false);
  };

  const openDocModal = (doc = null) => {
    setDocForm(doc ? { ...doc } : { ...EMPTY_DOC });
    setDocModal({ open: true, editing: doc });
  };

  const saveDoc = (e) => {
    e.preventDefault();
    const payload = { ...docForm, id: docModal.editing?.id || Date.now().toString() };
    setData(prev => {
      const docs = prev.poles.administration?.documents || [];
      const next = docModal.editing
        ? docs.map(d => d.id === payload.id ? payload : d)
        : [...docs, payload];
      return { ...prev, poles: { ...prev.poles, administration: { ...(prev.poles.administration || {}), documents: next } } };
    });
    setDocModal({ open: false, editing: null });
  };

  const deleteDoc = (id) => {
    setData(prev => ({
      ...prev,
      poles: { ...prev.poles, administration: { ...(prev.poles.administration || {}), documents: (prev.poles.administration?.documents || []).filter(d => d.id !== id) } }
    }));
  };

  const info = [
    { icon: Building2, label: 'Nom', value: assoc.name },
    { icon: FileText,  label: 'Type', value: assoc.type },
    { icon: MapPin,    label: 'Ville', value: assoc.city },
    { icon: Hash,      label: 'SIRET', value: assoc.siret },
    { icon: Calendar,  label: 'Fondée en', value: assoc.founded },
    { icon: Users,     label: 'Président', value: assoc.president },
    { icon: Users,     label: 'Trésorier(e)', value: assoc.treasurer },
    { icon: Users,     label: 'Secrétaire', value: assoc.secretary },
  ];

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: 1100 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.75rem' }}>Administration</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Association card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>Informations de l'association</p>
            <button onClick={() => { setAssocForm({ ...assoc }); setEditAssoc(true); }} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '5px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
              <Edit2 size={12} /> Modifier
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {info.map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color="var(--text-muted)" />
                </div>
                <div>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 1 }}>{label}</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{value || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>Documents</p>
            <button className="btn-primary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }} onClick={() => openDocModal()}>
              <Plus size={13} /> Ajouter
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {documents.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Aucun document enregistré
              </div>
            )}
            {documents.map(doc => (
              <div key={doc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={16} color="var(--primary)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{doc.type}{doc.date ? ` · ${new Date(doc.date).toLocaleDateString('fr-FR')}` : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => openDocModal(doc)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}><Edit2 size={11} /></button>
                  <button onClick={() => deleteDoc(doc.id)} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}><Trash2 size={11} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit association modal */}
      <Modal open={editAssoc} onClose={() => setEditAssoc(false)} title="Modifier l'association">
        <form onSubmit={saveAssoc} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {[
            { key: 'name', label: 'Nom de l\'association' },
            { key: 'type', label: 'Type' },
            { key: 'city', label: 'Ville' },
            { key: 'siret', label: 'SIRET' },
            { key: 'president', label: 'Président(e)' },
            { key: 'treasurer', label: 'Trésorier(e)' },
            { key: 'secretary', label: 'Secrétaire' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
              <input value={assocForm[key] || ''} onChange={e => setAssocForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Fondée en</label>
            <input type="number" value={assocForm.founded || ''} onChange={e => setAssocForm(f => ({ ...f, founded: parseInt(e.target.value) }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setEditAssoc(false)}>Annuler</button>
            <button type="submit" className="btn-primary">Enregistrer</button>
          </div>
        </form>
      </Modal>

      {/* Document modal */}
      <Modal open={docModal.open} onClose={() => setDocModal({ ...docModal, open: false })} title={docModal.editing ? 'Modifier le document' : 'Nouveau document'}>
        <form onSubmit={saveDoc} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nom du document *</label>
            <input value={docForm.name} onChange={e => setDocForm(f => ({ ...f, name: e.target.value }))} required style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Type</label>
              <select value={docForm.type} onChange={e => setDocForm(f => ({ ...f, type: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }}>
                {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Date</label>
              <input type="date" value={docForm.date} onChange={e => setDocForm(f => ({ ...f, date: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea value={docForm.notes} onChange={e => setDocForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setDocModal({ ...docModal, open: false })}>Annuler</button>
            <button type="submit" className="btn-primary">Enregistrer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
