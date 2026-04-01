import React, { useState } from 'react';
import { useEvent, POLES } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import {
  Info, Users, Layers, Plug,
  Plus, Trash2, Check, Edit2, X, Eye, EyeOff, Copy,
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

/* ════════════════════════════════════════════════════════
   TAB — Informations générales
════════════════════════════════════════════════════════ */
function GeneralTab() {
  const { data, setData } = useEvent();
  const toast = useToast();
  const asso  = data.association || {};
  const [form, setForm] = useState({ ...asso });

  const save = () => {
    setData(prev => ({ ...prev, association: { ...prev.association, ...form } }));
    toast.success('Informations sauvegardées');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 560 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        <Field label="Nom de l'association">
          <input style={inputStyle} value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </Field>
        <Field label="Type">
          <input style={inputStyle} value={form.type || ''} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </Field>
        <Field label="Ville">
          <input style={inputStyle} value={form.city || ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </Field>
        <Field label="SIRET">
          <input style={inputStyle} value={form.siret || ''} onChange={e => setForm(f => ({ ...f, siret: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </Field>
        <Field label="Président">
          <input style={inputStyle} value={form.president || ''} onChange={e => setForm(f => ({ ...f, president: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </Field>
        <Field label="Trésorier">
          <input style={inputStyle} value={form.treasurer || ''} onChange={e => setForm(f => ({ ...f, treasurer: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </Field>
        <Field label="Secrétaire">
          <input style={inputStyle} value={form.secretary || ''} onChange={e => setForm(f => ({ ...f, secretary: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </Field>
        <Field label="Année de fondation">
          <input style={inputStyle} type="number" value={form.founded || ''} onChange={e => setForm(f => ({ ...f, founded: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </Field>
      </div>
      <div>
        <button className="btn-primary" onClick={save}>
          <Check size={13} /> Sauvegarder
        </button>
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
  const [adding, setAdding]   = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [editing, setEditing]  = useState(null);
  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '' });

  const save = () => {
    if (!form.name.trim()) return;
    if (editing) {
      setData(prev => ({
        ...prev,
        association: {
          ...prev.association,
          members: (prev.association?.members || []).map(m => m.id === editing ? { ...m, ...form } : m),
        },
      }));
      toast.success('Membre modifié');
    } else {
      setData(prev => ({
        ...prev,
        association: {
          ...prev.association,
          members: [...(prev.association?.members || []), { id: Date.now().toString(), ...form }],
        },
      }));
      toast.success('Membre ajouté');
    }
    setAdding(false); setEditing(null);
    setForm({ name: '', role: '', email: '', phone: '' });
  };

  const del = (id) => {
    setData(prev => ({
      ...prev,
      association: {
        ...prev.association,
        members: (prev.association?.members || []).filter(m => m.id !== id),
      },
    }));
    toast.success('Membre supprimé');
    setToDelete(null);
  };

  const startEdit = (m) => {
    setEditing(m.id);
    setForm({ name: m.name, role: m.role || '', email: m.email || '', phone: m.phone || '' });
    setAdding(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {members.length} membre{members.length !== 1 ? 's' : ''}
        </p>
        <button className="btn-primary" onClick={() => { setEditing(null); setForm({ name: '', role: '', email: '', phone: '' }); setAdding(true); }}>
          <Plus size={13} /> Ajouter
        </button>
      </div>

      {/* Add / edit form */}
      {adding && (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Field label="Prénom & Nom">
            <input autoFocus style={inputStyle} placeholder="Ex: Ophélie Lemaire" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Rôle">
            <input style={inputStyle} placeholder="Ex: Trésorière" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
          </Field>
          <Field label="Email">
            <input style={inputStyle} type="email" placeholder="email@exemple.fr" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Téléphone">
            <input style={inputStyle} placeholder="06 xx xx xx xx" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </Field>
          <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={save}><Check size={13} /> {editing ? 'Modifier' : 'Ajouter'}</button>
            <button className="btn-secondary" onClick={() => { setAdding(false); setEditing(null); }}><X size={13} /> Annuler</button>
          </div>
        </div>
      )}

      {/* Member list */}
      {members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
          Aucun membre enregistré
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {members.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.625rem 1rem', borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg-card)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: 'var(--primary)', flexShrink: 0 }}>
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{m.name}</p>
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
        title={`Supprimer ${toDelete?.name} ?`}
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
  const customPoles = data.association?.customPoles || [];
  const [newPole, setNewPole] = useState('');
  const [toDelete, setToDelete] = useState(null);

  const add = () => {
    if (!newPole.trim()) return;
    setData(prev => ({
      ...prev,
      association: {
        ...prev.association,
        customPoles: [...(prev.association?.customPoles || []), { id: Date.now().toString(), name: newPole.trim() }],
      },
    }));
    toast.success('Pôle ajouté');
    setNewPole('');
  };

  const del = (id) => {
    setData(prev => ({
      ...prev,
      association: {
        ...prev.association,
        customPoles: (prev.association?.customPoles || []).filter(p => p.id !== id),
      },
    }));
    toast.success('Pôle supprimé');
    setToDelete(null);
  };

  const allPoles = [...POLES.map(name => ({ id: name, name, builtin: true })), ...customPoles];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 480 }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Les pôles apparaissent dans les sélecteurs de toute l'application.
      </p>

      {/* Add custom pole */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          placeholder="Nom du nouveau pôle…"
          value={newPole}
          onChange={e => setNewPole(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <button className="btn-primary" onClick={add}><Plus size={13} /> Ajouter</button>
      </div>

      {/* Poles list */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {allPoles.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '7px 12px', borderBottom: i < allPoles.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg-card)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.builtin ? 'var(--text-subtle)' : 'var(--primary)', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '0.8rem', color: p.builtin ? 'var(--text-muted)' : 'var(--text-main)', fontWeight: p.builtin ? 400 : 600 }}>
              {p.name}
            </span>
            {p.builtin
              ? <span style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Intégré</span>
              : <button className="btn-ghost" onClick={() => setToDelete(p)} style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>
            }
          </div>
        ))}
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
function ApiTab() {
  const { data, setData } = useEvent();
  const toast = useToast();
  const ha = data.event?.helloasso || {};
  const [form, setForm] = useState({
    clientId:     ha.clientId     || '',
    clientSecret: ha.clientSecret || '',
    orgSlug:      ha.orgSlug      || '',
    formSlug:     ha.formSlug     || '',
    formType:     ha.formType     || 'Event',
  });
  const [showSecret, setShowSecret] = useState(false);

  const save = () => {
    setData(prev => ({ ...prev, event: { ...prev.event, helloasso: form } }));
    toast.success('Configuration API sauvegardée');
  };

  const copy = (val) => { navigator.clipboard.writeText(val); toast.info('Copié !', 1500); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 520 }}>

      {/* HelloAsso */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#00c37b20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plug size={14} color="#00c37b" />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>HelloAsso</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Billetterie & inscriptions</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Field label="Client ID">
            <div style={{ position: 'relative' }}>
              <input style={inputStyle} value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} placeholder="client_xxxx" />
              {form.clientId && <button onClick={() => copy(form.clientId)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><Copy size={12} /></button>}
            </div>
          </Field>
          <Field label="Client Secret">
            <div style={{ position: 'relative' }}>
              <input style={inputStyle} type={showSecret ? 'text' : 'password'} value={form.clientSecret} onChange={e => setForm(f => ({ ...f, clientSecret: e.target.value }))} placeholder="••••••••" />
              <button onClick={() => setShowSecret(s => !s)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                {showSecret ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          </Field>
          <Field label="Organisation Slug">
            <input style={inputStyle} value={form.orgSlug} onChange={e => setForm(f => ({ ...f, orgSlug: e.target.value }))} placeholder="mon-association" />
          </Field>
          <Field label="Form Slug">
            <input style={inputStyle} value={form.formSlug} onChange={e => setForm(f => ({ ...f, formSlug: e.target.value }))} placeholder="ma-collecte" />
          </Field>
          <Field label="Type de formulaire">
            <select style={inputStyle} value={form.formType} onChange={e => setForm(f => ({ ...f, formType: e.target.value }))}>
              <option value="Event">Event</option>
              <option value="Membership">Membership</option>
              <option value="CrowdFunding">CrowdFunding</option>
              <option value="Donation">Donation</option>
              <option value="PaymentForm">PaymentForm</option>
              <option value="Shop">Shop</option>
            </select>
          </Field>
        </div>

        <div style={{ marginTop: '0.875rem' }}>
          <button className="btn-primary" onClick={save}><Check size={13} /> Sauvegarder</button>
        </div>
      </div>
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

      {/* Header */}
      <div>
        <h2 className="section-title">Paramètres</h2>
        <p className="section-subtitle">
          {currentUser?.name || 'Utilisateur'} · Configuration de l'organisation
        </p>
      </div>

      {/* Tab nav */}
      <div style={{
        display: 'flex',
        gap: 2,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 0,
      }}>
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
                fontSize: '0.8rem',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                transition: 'color 0.12s',
                fontFamily: 'var(--font-main)',
                marginBottom: -1,
              }}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="animate-in">
        {renderTab()}
      </div>
    </div>
  );
}
