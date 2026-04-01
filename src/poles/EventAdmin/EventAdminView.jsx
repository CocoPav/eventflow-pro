import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import {
  CalendarDays, MapPin, Clock, FileText, Plus, Trash2,
  Edit2, Check, X, Upload, ExternalLink, Info, Timer, Plug,
} from 'lucide-react';

const DOC_TYPES = ['Contrat', 'Devis', 'Convention', 'Autorisation', 'Assurance', 'Plan', 'Budget', 'Compte-rendu', 'Autre'];

const INPUT_STYLE = {
  width: '100%', padding: '0.625rem 0.875rem',
  border: '1px solid var(--border)', borderRadius: 10,
  fontSize: '0.875rem', background: 'white', outline: 'none',
  transition: 'border-color 0.15s',
};

export default function EventAdminView() {
  const { data, setData } = useEvent();
  const event = data.event || {};
  const haConfig = data.event?.helloasso || {};

  const [editingInfo, setEditingInfo] = useState(false);
  const [form, setForm] = useState({ ...event });
  const [haForm, setHaForm] = useState({
    clientId: haConfig.clientId || '',
    clientSecret: haConfig.clientSecret || '',
    orgSlug: haConfig.orgSlug || '',
    formSlug: haConfig.formSlug || '',
    formType: haConfig.formType || 'Event',
  });
  const [haSaved, setHaSaved] = useState(false);

  const saveHaConfig = () => {
    setData(prev => ({ ...prev, event: { ...prev.event, helloasso: haForm } }));
    setHaSaved(true);
    setTimeout(() => setHaSaved(false), 2000);
  };
  const [docs, setDocs] = useState(data.eventAdmin?.documents || []);
  const [addingDoc, setAddingDoc] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', type: 'Contrat', date: '', url: '', notes: '' });
  const [editDocId, setEditDocId] = useState(null);
  const [editDocForm, setEditDocForm] = useState({});

  const saveInfo = () => {
    setData(prev => ({ ...prev, event: { ...prev.event, ...form } }));
    setEditingInfo(false);
  };

  const addDoc = () => {
    if (!newDoc.name) return;
    const doc = { ...newDoc, id: `doc-${Date.now()}` };
    const updated = [...docs, doc];
    setDocs(updated);
    setData(prev => ({ ...prev, eventAdmin: { ...prev.eventAdmin, documents: updated } }));
    setNewDoc({ name: '', type: 'Contrat', date: '', url: '', notes: '' });
    setAddingDoc(false);
  };

  const deleteDoc = (id) => {
    const updated = docs.filter(d => d.id !== id);
    setDocs(updated);
    setData(prev => ({ ...prev, eventAdmin: { ...prev.eventAdmin, documents: updated } }));
  };

  const saveDocEdit = () => {
    const updated = docs.map(d => d.id === editDocId ? { ...d, ...editDocForm } : d);
    setDocs(updated);
    setData(prev => ({ ...prev, eventAdmin: { ...prev.eventAdmin, documents: updated } }));
    setEditDocId(null);
  };

  // Duration in hours between start and end time (if same day) or days
  const durationText = () => {
    if (!event.date) return null;
    if (event.endDate && event.endDate !== event.date) {
      const days = Math.round((new Date(event.endDate) - new Date(event.date)) / 86400000);
      return `${days + 1} jour${days > 0 ? 's' : ''}`;
    }
    if (event.startTime && event.endTime) {
      const [sh, sm] = event.startTime.split(':').map(Number);
      const [eh, em] = event.endTime.split(':').map(Number);
      const mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins > 0) return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? String(mins % 60).padStart(2, '0') : ''}`;
    }
    return null;
  };

  const duration = durationText();

  const DOC_TYPE_COLORS = {
    'Contrat': '#6366f1', 'Devis': '#f59e0b', 'Convention': '#3b82f6',
    'Autorisation': '#ec4899', 'Assurance': '#14b8a6', 'Plan': '#8b5cf6',
    'Budget': '#22c55e', 'Compte-rendu': '#f97316', 'Autre': '#94a3b8',
  };

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: 900 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.75rem' }}>Administration</h1>

      {/* ── Event info ── */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Info size={16} color="var(--primary)" />
            <h2 style={{ fontWeight: 800, fontSize: '1rem' }}>Informations générales</h2>
          </div>
          {!editingInfo ? (
            <button
              onClick={() => { setForm({ ...event }); setEditingInfo(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.375rem 0.875rem', borderRadius: 8, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              <Edit2 size={13} /> Modifier
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setEditingInfo(false)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.375rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>
                <X size={13} /> Annuler
              </button>
              <button onClick={saveInfo} className="btn-primary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
                <Check size={13} /> Sauvegarder
              </button>
            </div>
          )}
        </div>

        {!editingInfo ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {[
              { label: 'Nom de l\'événement', value: event.name, icon: FileText },
              { label: 'Édition', value: event.edition, icon: Info },
              { label: 'Date', value: event.date ? new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—', icon: CalendarDays },
              { label: 'Date de fin', value: event.endDate ? new Date(event.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—', icon: CalendarDays },
              { label: 'Horaires', value: event.startTime && event.endTime ? `${event.startTime} – ${event.endTime}` : event.startTime || '—', icon: Clock },
              { label: 'Durée', value: duration || '—', icon: Timer },
              { label: 'Lieu', value: event.location || '—', icon: MapPin },
              { label: 'Adresse', value: event.address || '—', icon: MapPin },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label}>
                <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon size={11} /> {label}
                </p>
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{value || '—'}</p>
              </div>
            ))}
            {event.description && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Description</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{event.description}</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            {[
              ['name', 'Nom de l\'événement', 'text'],
              ['edition', 'Édition', 'text'],
              ['date', 'Date de début', 'date'],
              ['endDate', 'Date de fin', 'date'],
              ['startTime', 'Heure de début', 'time'],
              ['endTime', 'Heure de fin', 'time'],
              ['location', 'Lieu', 'text'],
              ['address', 'Adresse complète', 'text'],
            ].map(([key, placeholder, type]) => (
              <div key={key}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>{placeholder}</label>
                <input
                  type={type}
                  value={form[key] || ''}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={INPUT_STYLE}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Description</label>
              <textarea
                value={form.description || ''}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Description de l'événement..."
                rows={3}
                style={{ ...INPUT_STYLE, resize: 'vertical' }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Documents ── */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="var(--primary)" />
            <h2 style={{ fontWeight: 800, fontSize: '1rem' }}>Documents</h2>
            {docs.length > 0 && (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                {docs.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setAddingDoc(true)}
            className="btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
          >
            <Plus size={14} /> Ajouter
          </button>
        </div>

        {/* Add form */}
        {addingDoc && (
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Nom *</label>
                <input value={newDoc.name} onChange={e => setNewDoc(p => ({ ...p, name: e.target.value }))} placeholder="Nom du document" style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Type</label>
                <select value={newDoc.type} onChange={e => setNewDoc(p => ({ ...p, type: e.target.value }))} style={{ ...INPUT_STYLE }}>
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Date</label>
                <input type="date" value={newDoc.date} onChange={e => setNewDoc(p => ({ ...p, date: e.target.value }))} style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Lien / URL</label>
                <input value={newDoc.url} onChange={e => setNewDoc(p => ({ ...p, url: e.target.value }))} placeholder="https://..." style={INPUT_STYLE} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Notes</label>
                <input value={newDoc.notes} onChange={e => setNewDoc(p => ({ ...p, notes: e.target.value }))} placeholder="Notes..." style={INPUT_STYLE} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setAddingDoc(false)} className="btn-secondary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>Annuler</button>
              <button onClick={addDoc} className="btn-primary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>Ajouter</button>
            </div>
          </div>
        )}

        {/* Docs list */}
        {docs.length === 0 && !addingDoc ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            <FileText size={28} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
            <p style={{ fontWeight: 600, marginBottom: 6 }}>Aucun document</p>
            <p style={{ fontSize: '0.875rem' }}>Ajoutez des contrats, devis, autorisations…</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {docs.map(doc => {
              const isEditing = editDocId === doc.id;
              const typeColor = DOC_TYPE_COLORS[doc.type] || '#94a3b8';
              return (
                <div key={doc.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '0.875rem 1rem' }}>
                  {isEditing ? (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '0.625rem' }}>
                        {[['name', 'Nom', 'text'], ['date', 'Date', 'date'], ['url', 'URL', 'text'], ['notes', 'Notes', 'text']].map(([k, ph, t]) => (
                          <input key={k} type={t} placeholder={ph} value={editDocForm[k] || ''} onChange={e => setEditDocForm(p => ({ ...p, [k]: e.target.value }))} style={{ ...INPUT_STYLE, fontSize: '0.82rem' }} />
                        ))}
                        <select value={editDocForm.type || 'Autre'} onChange={e => setEditDocForm(p => ({ ...p, type: e.target.value }))} style={{ ...INPUT_STYLE, fontSize: '0.82rem' }}>
                          {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditDocId(null)} style={{ padding: '0.25rem 0.625rem', border: '1px solid var(--border)', borderRadius: 7, background: 'white', cursor: 'pointer', fontSize: '0.78rem' }}><X size={12} /></button>
                        <button onClick={saveDocEdit} className="btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.78rem' }}><Check size={12} /> OK</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: typeColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={16} color={typeColor} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 3 }}>
                          <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{doc.name}</p>
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: typeColor + '18', color: typeColor }}>
                            {doc.type}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          {doc.date && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(doc.date).toLocaleDateString('fr-FR')}</p>}
                          {doc.notes && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{doc.notes}</p>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                        {doc.url && (
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: 6, borderRadius: 6, color: 'var(--primary)' }}>
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <button onClick={() => { setEditDocId(doc.id); setEditDocForm({ ...doc }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: 'var(--text-muted)' }}><Edit2 size={14} /></button>
                        <button onClick={() => deleteDoc(doc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: '#ef4444' }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Paramètres API ── */}
      <div className="card" style={{ padding: '1.75rem', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
          <Plug size={16} color="var(--primary)" />
          <h2 style={{ fontWeight: 800, fontSize: '1rem' }}>Paramètres API — Hello Asso</h2>
          {haConfig.clientId && (
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
              Connecté
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1rem' }}>
          {[
            { key: 'clientId', label: 'Client ID', placeholder: 'votre-client-id', type: 'text' },
            { key: 'clientSecret', label: 'Client Secret', placeholder: '••••••••', type: 'password' },
            { key: 'orgSlug', label: 'Slug organisation', placeholder: 'mon-asso', type: 'text' },
            { key: 'formSlug', label: 'Slug formulaire', placeholder: 'mon-evenement', type: 'text' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>{label}</label>
              <input
                type={type}
                value={haForm[key]}
                onChange={e => setHaForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                style={INPUT_STYLE}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          ))}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Type de formulaire</label>
            <select
              value={haForm.formType}
              onChange={e => setHaForm(p => ({ ...p, formType: e.target.value }))}
              style={INPUT_STYLE}
            >
              {['Event', 'CrowdFunding', 'Membership', 'Donation', 'PaymentForm', 'Shop'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Ces informations permettent de récupérer les inscriptions en temps réel et de synchroniser automatiquement les recettes dans le budget.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={saveHaConfig}
            disabled={!haForm.clientId || !haForm.clientSecret || !haForm.orgSlug || !haForm.formSlug}
            className="btn-primary"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', background: haSaved ? '#10b981' : 'var(--primary)' }}
          >
            {haSaved ? <><Check size={14} /> Enregistré</> : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
