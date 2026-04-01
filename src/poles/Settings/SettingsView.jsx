import React, { useState, useRef } from 'react';
import { useEvent, POLES } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import {
  Info, Users, Layers, Plug,
  Plus, Trash2, Check, Edit2, X, Eye, EyeOff, Copy,
  Upload, ChevronDown, ChevronRight,
} from 'lucide-react';
import ConfirmModal from '../../components/shared/ConfirmModal';
import { useToast } from '../../components/shared/Toast';

const TABS = [
  { id: 'general',  label: 'Informations générales',    icon: Info },
  { id: 'members',  label: "Membres de l'organisation", icon: Users },
  { id: 'poles',    label: 'Pôles',                     icon: Layers },
  { id: 'api',      label: 'API',                       icon: Plug },
];

/* ── Shared input style ──────────────────────────────── */
const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.85rem',
  background: 'var(--bg-input)',
  color: 'var(--text-main)',
  outline: 'none',
  fontFamily: 'var(--font-main)',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function FocusInput({ style, ...props }) {
  return (
    <input
      style={{ ...inputStyle, ...style }}
      onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
      {...props}
    />
  );
}

/* ════════════════════════════════════════════════════════
   TAB — Informations générales
════════════════════════════════════════════════════════ */
function GeneralTab() {
  const { data, setData } = useEvent();
  const toast  = useToast();
  const asso   = data.association || {};
  const [form, setForm] = useState({
    name:      asso.name      || '',
    type:      asso.type      || '',
    rna:       asso.rna       || '',
    siret:     asso.siret     || '',
    address:   asso.address   || '',
    zipCode:   asso.zipCode   || '',
    city:      asso.city      || '',
    email:     asso.email     || '',
    phone:     asso.phone     || '',
    website:   asso.website   || '',
    legalInfo: asso.legalInfo || '',
    founded:   asso.founded   || '',
    president: asso.president || '',
    treasurer: asso.treasurer || '',
    secretary: asso.secretary || '',
    logo:      asso.logo      || null,
  });
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set('logo', ev.target.result);
    reader.readAsDataURL(file);
  };

  const save = () => {
    setData(prev => ({ ...prev, association: { ...prev.association, ...form } }));
    toast.success('Informations sauvegardées');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: 600 }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            width: 72, height: 72, borderRadius: 'var(--radius-lg)',
            border: '2px dashed var(--border)',
            background: 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          {form.logo
            ? <img src={form.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Upload size={18} color="var(--text-muted)" />
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
        <div>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 2 }}>Logo de l'association</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PNG, JPG — recommandé 200×200px</p>
          {form.logo && (
            <button onClick={() => set('logo', null)} style={{ marginTop: 4, fontSize: '0.7rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Identité */}
      <div>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Identité</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
          <Field label="Nom de l'association">
            <FocusInput value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Les Festivaliers" />
          </Field>
          <Field label="Type">
            <FocusInput value={form.type} onChange={e => set('type', e.target.value)} placeholder="Ex: Loi 1901" />
          </Field>
          <Field label="RNA">
            <FocusInput value={form.rna} onChange={e => set('rna', e.target.value)} placeholder="Ex: W123456789" />
          </Field>
          <Field label="SIRET">
            <FocusInput value={form.siret} onChange={e => set('siret', e.target.value)} placeholder="Ex: 123 456 789 00012" />
          </Field>
          <Field label="Année de fondation">
            <FocusInput type="number" value={form.founded} onChange={e => set('founded', e.target.value)} placeholder="Ex: 2015" />
          </Field>
        </div>
      </div>

      {/* Adresse */}
      <div>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Adresse</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.875rem' }}>
          <Field label="Adresse">
            <FocusInput value={form.address} onChange={e => set('address', e.target.value)} placeholder="Ex: 12 rue des Lilas" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.875rem' }}>
            <Field label="Code postal">
              <FocusInput value={form.zipCode} onChange={e => set('zipCode', e.target.value)} placeholder="75001" />
            </Field>
            <Field label="Ville">
              <FocusInput value={form.city} onChange={e => set('city', e.target.value)} placeholder="Paris" />
            </Field>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Contact</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
          <Field label="Email">
            <FocusInput type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@asso.fr" />
          </Field>
          <Field label="Téléphone">
            <FocusInput value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="06 xx xx xx xx" />
          </Field>
          <Field label="Site web" style={{ gridColumn: '1/-1' }}>
            <FocusInput value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://…" />
          </Field>
        </div>
      </div>

      {/* Bureau */}
      <div>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Bureau</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
          <Field label="Président(e)">
            <FocusInput value={form.president} onChange={e => set('president', e.target.value)} />
          </Field>
          <Field label="Trésorier(ère)">
            <FocusInput value={form.treasurer} onChange={e => set('treasurer', e.target.value)} />
          </Field>
          <Field label="Secrétaire">
            <FocusInput value={form.secretary} onChange={e => set('secretary', e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Infos légales */}
      <div>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Informations légales</p>
        <Field label="Mentions légales / Objet social">
          <textarea
            style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
            value={form.legalInfo}
            onChange={e => set('legalInfo', e.target.value)}
            placeholder="Objet de l'association, mentions légales…"
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </Field>
      </div>

      <div>
        <button className="btn-primary" onClick={save}><Check size={13} /> Sauvegarder</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB — Membres de l'organisation
════════════════════════════════════════════════════════ */
function MembersTab() {
  const { data, setData } = useEvent();
  const toast  = useToast();
  const members = data.association?.members || [];
  const [adding, setAdding]    = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [editing, setEditing]  = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fullName = (m) => [m.firstName, m.lastName].filter(Boolean).join(' ') || m.name || '';

  const initials = (m) => {
    const fn = (m.firstName || '').charAt(0).toUpperCase();
    const ln = (m.lastName  || '').charAt(0).toUpperCase();
    return fn + ln || (m.name || '?').charAt(0).toUpperCase();
  };

  const save = () => {
    if (!form.firstName.trim() && !form.lastName.trim()) return;
    const entry = {
      id: editing || Date.now().toString(),
      firstName: form.firstName.trim(),
      lastName:  form.lastName.trim(),
      email:     form.email.trim(),
      role:      form.role.trim(),
      name:      [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(' '),
    };
    if (editing) {
      setData(prev => ({
        ...prev,
        association: { ...prev.association, members: (prev.association?.members || []).map(m => m.id === editing ? entry : m) },
      }));
      toast.success('Membre modifié');
    } else {
      setData(prev => ({
        ...prev,
        association: { ...prev.association, members: [...(prev.association?.members || []), entry] },
      }));
      toast.success('Membre ajouté');
    }
    setAdding(false); setEditing(null);
    setForm({ firstName: '', lastName: '', email: '', role: '' });
  };

  const del = (id) => {
    setData(prev => ({
      ...prev,
      association: { ...prev.association, members: (prev.association?.members || []).filter(m => m.id !== id) },
    }));
    toast.success('Membre supprimé');
    setToDelete(null);
  };

  const startEdit = (m) => {
    setEditing(m.id);
    setForm({ firstName: m.firstName || '', lastName: m.lastName || '', email: m.email || '', role: m.role || '' });
    setAdding(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {members.length} membre{members.length !== 1 ? 's' : ''}
        </p>
        <button className="btn-primary" onClick={() => { setEditing(null); setForm({ firstName: '', lastName: '', email: '', role: '' }); setAdding(true); }}>
          <Plus size={13} /> Ajouter
        </button>
      </div>

      {adding && (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Field label="Prénom">
            <FocusInput autoFocus placeholder="Ex: Ophélie" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
          </Field>
          <Field label="Nom">
            <FocusInput placeholder="Ex: Lemaire" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
          </Field>
          <Field label="Email">
            <FocusInput type="email" placeholder="email@exemple.fr" value={form.email} onChange={e => set('email', e.target.value)} />
          </Field>
          <Field label="Rôle dans l'asso">
            <FocusInput placeholder="Ex: Trésorière" value={form.role} onChange={e => set('role', e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} />
          </Field>
          <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={save}><Check size={13} /> {editing ? 'Modifier' : 'Ajouter'}</button>
            <button className="btn-secondary" onClick={() => { setAdding(false); setEditing(null); }}><X size={13} /> Annuler</button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
          Aucun membre enregistré
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {members.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.625rem 1rem', borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg-card)' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: 'var(--primary)', flexShrink: 0 }}>
                {initials(m)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{fullName(m)}</p>
                {(m.role || m.email) && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{[m.role, m.email].filter(Boolean).join(' · ')}</p>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn-ghost" onClick={() => startEdit(m)}><Edit2 size={12} /></button>
                <button className="btn-ghost" onClick={() => setToDelete(m)} style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!toDelete}
        onConfirm={() => del(toDelete.id)}
        onCancel={() => setToDelete(null)}
        title={`Supprimer ${fullName(toDelete)} ?`}
        description="Ce membre sera retiré de l'organisation."
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB — Pôles
════════════════════════════════════════════════════════ */
function PolesTab() {
  const { data, setData } = useEvent();
  const toast = useToast();
  const members     = data.association?.members || [];
  const customPoles = data.association?.customPoles || [];

  const [newPole, setNewPole]     = useState('');
  const [toDelete, setToDelete]   = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName]   = useState('');
  const [expanded, setExpanded]   = useState({});

  const allPoles = [
    ...POLES.map(name => ({ id: name, name, builtin: true })),
    ...customPoles,
  ];

  const add = () => {
    if (!newPole.trim()) return;
    setData(prev => ({
      ...prev,
      association: {
        ...prev.association,
        customPoles: [...(prev.association?.customPoles || []), { id: Date.now().toString(), name: newPole.trim(), members: [] }],
      },
    }));
    toast.success('Pôle ajouté');
    setNewPole('');
  };

  const del = (id) => {
    setData(prev => ({
      ...prev,
      association: { ...prev.association, customPoles: (prev.association?.customPoles || []).filter(p => p.id !== id) },
    }));
    toast.success('Pôle supprimé');
    setToDelete(null);
  };

  const saveEdit = (id) => {
    if (!editName.trim()) return;
    setData(prev => ({
      ...prev,
      association: {
        ...prev.association,
        customPoles: (prev.association?.customPoles || []).map(p => p.id === id ? { ...p, name: editName.trim() } : p),
      },
    }));
    toast.success('Pôle renommé');
    setEditingId(null);
  };

  const toggleMember = (poleId, memberId, builtin) => {
    if (builtin) return;
    setData(prev => {
      const poles = (prev.association?.customPoles || []).map(p => {
        if (p.id !== poleId) return p;
        const current = p.members || [];
        const updated = current.includes(memberId)
          ? current.filter(id => id !== memberId)
          : [...current, memberId];
        return { ...p, members: updated };
      });
      return { ...prev, association: { ...prev.association, customPoles: poles } };
    });
  };

  const getPoleMembers = (pole) => {
    if (pole.builtin) return [];
    return (pole.members || []).map(id => members.find(m => m.id === id)).filter(Boolean);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 540 }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Les pôles apparaissent dans les sélecteurs de toute l'application.
      </p>

      <div style={{ display: 'flex', gap: 8 }}>
        <FocusInput
          style={{ flex: 1 }}
          placeholder="Nom du nouveau pôle…"
          value={newPole}
          onChange={e => setNewPole(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <button className="btn-primary" onClick={add}><Plus size={13} /> Ajouter</button>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {allPoles.map((p, i) => {
          const poleMembers = getPoleMembers(p);
          const isExpanded  = expanded[p.id];
          const isEditing   = editingId === p.id;

          return (
            <div key={p.id} style={{ borderBottom: i < allPoles.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '8px 12px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.builtin ? 'var(--text-subtle)' : 'var(--primary)', flexShrink: 0 }} />

                {isEditing ? (
                  <input
                    autoFocus
                    style={{ ...inputStyle, flex: 1, padding: '3px 8px', fontSize: '0.8rem' }}
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(p.id); if (e.key === 'Escape') setEditingId(null); }}
                    onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: '0.8rem', color: p.builtin ? 'var(--text-muted)' : 'var(--text-main)', fontWeight: p.builtin ? 400 : 600 }}>
                    {p.name}
                  </span>
                )}

                {p.builtin ? (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Intégré</span>
                ) : (
                  <div style={{ display: 'flex', gap: 2 }}>
                    {isEditing ? (
                      <>
                        <button className="btn-ghost" onClick={() => saveEdit(p.id)} style={{ color: 'var(--success)' }}><Check size={12} /></button>
                        <button className="btn-ghost" onClick={() => setEditingId(null)}><X size={12} /></button>
                      </>
                    ) : (
                      <>
                        <button className="btn-ghost" onClick={() => { setEditingId(p.id); setEditName(p.name); }}><Edit2 size={12} /></button>
                        <button className="btn-ghost" onClick={() => setToDelete(p)} style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>
                      </>
                    )}
                  </div>
                )}

                {/* Toggle members */}
                {!p.builtin && members.length > 0 && (
                  <button
                    className="btn-ghost"
                    onClick={() => setExpanded(ex => ({ ...ex, [p.id]: !ex[p.id] }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--text-muted)' }}
                  >
                    <Users size={11} />
                    {poleMembers.length > 0 && <span>{poleMembers.length}</span>}
                    {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  </button>
                )}
              </div>

              {/* Member assignment panel */}
              {!p.builtin && isExpanded && members.length > 0 && (
                <div style={{ padding: '0.5rem 1rem 0.75rem 2rem', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                    Membres assignés
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {members.map(m => {
                      const assigned = (p.members || []).includes(m.id);
                      const name = [m.firstName, m.lastName].filter(Boolean).join(' ') || m.name || '';
                      return (
                        <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.78rem' }}>
                          <input
                            type="checkbox"
                            checked={assigned}
                            onChange={() => toggleMember(p.id, m.id, p.builtin)}
                            style={{ accentColor: 'var(--primary)', width: 14, height: 14, cursor: 'pointer' }}
                          />
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {(m.firstName || m.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <span style={{ color: 'var(--text-main)' }}>{name}</span>
                          {m.role && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>· {m.role}</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={!!toDelete}
        onConfirm={() => del(toDelete?.id)}
        onCancel={() => setToDelete(null)}
        title={`Supprimer le pôle "${toDelete?.name}" ?`}
        description="Il sera retiré des sélecteurs dans toute l'application."
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB — API
════════════════════════════════════════════════════════ */
const API_INTEGRATIONS = [
  {
    id: 'helloasso',
    name: 'HelloAsso',
    description: 'Billetterie & inscriptions',
    color: '#00c37b',
    fields: [
      { key: 'clientId',     label: 'Client ID',           type: 'text',     placeholder: 'client_xxxx' },
      { key: 'clientSecret', label: 'Client Secret',       type: 'password', placeholder: '••••••••' },
      { key: 'orgSlug',      label: 'Organisation Slug',   type: 'text',     placeholder: 'mon-association' },
      { key: 'formSlug',     label: 'Form Slug',           type: 'text',     placeholder: 'ma-collecte' },
      { key: 'formType',     label: 'Type de formulaire',  type: 'select',   options: ['Event','Membership','CrowdFunding','Donation','PaymentForm','Shop'] },
    ],
  },
  {
    id: 'meta',
    name: 'Meta (Facebook / Instagram)',
    description: 'Publication & publicités',
    color: '#1877f2',
    fields: [
      { key: 'appId',          label: 'App ID',           type: 'text',     placeholder: '123456789' },
      { key: 'appSecret',      label: 'App Secret',       type: 'password', placeholder: '••••••••' },
      { key: 'pageAccessToken',label: 'Page Access Token',type: 'password', placeholder: 'EAAxxxxx…' },
      { key: 'pageId',         label: 'Page ID',          type: 'text',     placeholder: '987654321' },
    ],
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Emailing & newsletters',
    color: '#ffe01b',
    textColor: '#1a1a1a',
    fields: [
      { key: 'apiKey',   label: 'API Key',    type: 'password', placeholder: 'xxxxxxxx-us1' },
      { key: 'listId',   label: 'Audience ID',type: 'text',     placeholder: 'abc123def' },
      { key: 'server',   label: 'Server',     type: 'text',     placeholder: 'us1' },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Paiements en ligne',
    color: '#635bff',
    fields: [
      { key: 'publishableKey', label: 'Clé publique',  type: 'text',     placeholder: 'pk_live_…' },
      { key: 'secretKey',      label: 'Clé secrète',   type: 'password', placeholder: 'sk_live_…' },
      { key: 'webhookSecret',  label: 'Webhook Secret',type: 'password', placeholder: 'whsec_…' },
    ],
  },
];

function ApiCard({ integration, savedData, onSave }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => {
    const s = savedData || {};
    return Object.fromEntries(integration.fields.map(f => [f.key, s[f.key] || '']));
  });
  const [visible, setVisible] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const copy = (val) => { navigator.clipboard.writeText(val); toast.info('Copié !'); };

  const save = () => { onSave(form); toast.success('Configuration sauvegardée'); };

  const hasData = Object.values(form).some(v => v.trim?.() !== '');

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.875rem 1rem', background: open ? 'var(--bg-elevated)' : 'var(--bg-card)', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
      >
        <div style={{ width: 30, height: 30, borderRadius: 8, background: integration.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.65rem', color: integration.color, flexShrink: 0 }}>
          {integration.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{integration.name}</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{integration.description}</p>
        </div>
        {hasData && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />}
        {open ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
      </button>

      {open && (
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {integration.fields.map(f => (
            <Field key={f.key} label={f.label}>
              {f.type === 'select' ? (
                <select style={inputStyle} value={form[f.key]} onChange={e => set(f.key, e.target.value)}>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <div style={{ position: 'relative' }}>
                  <FocusInput
                    type={f.type === 'password' ? (visible[f.key] ? 'text' : 'password') : 'text'}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                    style={{ paddingRight: f.type === 'password' || form[f.key] ? 56 : undefined }}
                  />
                  <div style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 2 }}>
                    {form[f.key] && <button onClick={() => copy(form[f.key])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 3 }}><Copy size={11} /></button>}
                    {f.type === 'password' && <button onClick={() => setVisible(v => ({ ...v, [f.key]: !v[f.key] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 3 }}>
                      {visible[f.key] ? <EyeOff size={11} /> : <Eye size={11} />}
                    </button>}
                  </div>
                </div>
              )}
            </Field>
          ))}
          <div style={{ gridColumn: '1/-1', paddingTop: 4 }}>
            <button className="btn-primary" onClick={save}><Check size={13} /> Sauvegarder</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ApiTab() {
  const { data, setData } = useEvent();

  const getApiData = (id) => data.apiKeys?.[id] || {};

  const saveApi = (id, form) => {
    setData(prev => ({ ...prev, apiKeys: { ...(prev.apiKeys || {}), [id]: form } }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 560 }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
        Configurez les intégrations externes. Les clés sont stockées localement.
      </p>
      {API_INTEGRATIONS.map(integration => (
        <ApiCard
          key={integration.id}
          integration={integration}
          savedData={getApiData(integration.id)}
          onSave={(form) => saveApi(integration.id, form)}
        />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN — SettingsView
════════════════════════════════════════════════════════ */
export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('general');
  const { currentUser } = useAuth();

  const renderTab = () => {
    switch (activeTab) {
      case 'general': return <GeneralTab />;
      case 'members': return <MembersTab />;
      case 'poles':   return <PolesTab />;
      case 'api':     return <ApiTab />;
      default:        return <GeneralTab />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 className="section-title">Paramètres</h2>
        <p className="section-subtitle">
          {currentUser?.name || 'Utilisateur'} · Configuration de l'organisation
        </p>
      </div>

      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px 10px',
                border: 'none',
                borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                background: 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '0.8rem', fontWeight: active ? 700 : 500,
                cursor: 'pointer', transition: 'color 0.12s',
                fontFamily: 'var(--font-main)', marginBottom: -1,
              }}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="animate-in">
        {renderTab()}
      </div>
    </div>
  );
}
