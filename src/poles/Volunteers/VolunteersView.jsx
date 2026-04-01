import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { Users, Plus, Trash2, Edit2, Mail, Phone, Clock } from 'lucide-react';
import Modal from '../../components/shared/Modal';

const INSPIRED_POLES = ['Scène', 'Buvette', 'Restauration', 'Sécurité', 'Accueil', 'Communication', 'Logistique', 'Programme', 'Général'];

const inputStyle = {
  width: '100%', padding: '0.6rem 0.875rem', borderRadius: 8,
  background: '#f8f9fa', border: '1px solid #e9ecef',
  color: '#1a1a1b', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box'
};
const labelStyle = {
  display: 'block', fontSize: '0.65rem', fontWeight: 700,
  color: '#64748b', marginBottom: '0.3rem', letterSpacing: '0.04em'
};

const EMPTY_FORM = {
  name: '', email: '', phone: '', role: 'Bénévole',
  notes: '', inspiredPoles: [], hoursPerShift: 4,
  numberOfShifts: 1, preferredStartTime: '14:00',
  availability: {}, availabilitySlots: [], status: 'confirmed'
};

function AvailabilitySlots({ slots, onChange, readOnly }) {
  const add = () => onChange([...slots, { id: Date.now().toString(), date: '', startTime: '', endTime: '' }]);
  const remove = (id) => onChange(slots.filter(s => s.id !== id));
  const update = (id, field, val) => onChange(slots.map(s => s.id === id ? { ...s, [field]: val } : s));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {slots.map(slot => (
        <div key={slot.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="date" value={slot.date} onChange={e => update(slot.id, 'date', e.target.value)}
            disabled={readOnly} style={inputStyle} />
          <input type="time" value={slot.startTime} onChange={e => update(slot.id, 'startTime', e.target.value)}
            disabled={readOnly} style={{ ...inputStyle, width: 100 }} placeholder="Début" />
          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>→</span>
          <input type="time" value={slot.endTime} onChange={e => update(slot.id, 'endTime', e.target.value)}
            disabled={readOnly} style={{ ...inputStyle, width: 100 }} placeholder="Fin" />
          {!readOnly && (
            <button type="button" onClick={() => remove(slot.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}>
              ✕
            </button>
          )}
        </div>
      ))}
      {!readOnly && (
        <button type="button" onClick={add}
          style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed #cbd5e1', borderRadius: 8, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>
          + Ajouter un créneau
        </button>
      )}
      {slots.length === 0 && readOnly && (
        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aucune disponibilité renseignée.</p>
      )}
    </div>
  );
}

// Timeline helpers for planning view
const TIMELINE_HOURS = ['12','13','14','15','16','17','18','19','20','21','22','23','00','01','02'];
const HOUR_W = 56;
function timeToX(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  const normalH = h < 12 ? h + 24 : h;
  return ((normalH - 12) + m / 60) * HOUR_W;
}
const CAT_COLORS = { concert: '#3b82f6', village: '#10b981', course: '#f59e0b' };

export default function VolunteersView() {
  const { data, addItem, updateItem, deleteItem } = useEvent();
  const { list } = data.poles.volunteers;
  const schedule = data.poles.programming?.schedule || [];
  const isVolunteer = data.user.role === 'volunteer';

  const [activeView, setActiveView] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openAdd = () => { setEditingItem(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (v) => {
    setEditingItem(v);
    setForm({
      name: v.name || '', email: v.email || '', phone: v.phone || '',
      role: v.role || 'Bénévole', notes: v.notes || '',
      inspiredPoles: v.inspiredPoles || [],
      hoursPerShift: v.hoursPerShift || 4,
      numberOfShifts: v.numberOfShifts || 1,
      preferredStartTime: v.preferredStartTime || '14:00',
      availability: v.availability || {},
      availabilitySlots: v.availabilitySlots || [],
      status: v.status || 'confirmed'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateItem('volunteers', 'list', editingItem.id, form);
    } else {
      addItem('volunteers', 'list', form);
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
  };

  const toggleInspiredPole = (pole) => {
    setForm(f => ({
      ...f,
      inspiredPoles: f.inspiredPoles.includes(pole)
        ? f.inspiredPoles.filter(p => p !== pole)
        : [...f.inspiredPoles, pole]
    }));
  };

  // Build volunteer → assigned programme items mapping
  const assignments = {};
  schedule.forEach(item => {
    (item.volunteerNeeds || []).forEach(need => {
      (need.assignedIds || []).forEach(vid => {
        if (!assignments[vid]) assignments[vid] = [];
        assignments[vid].push({ ...item, needRole: need.role });
      });
    });
  });

  // VOLUNTEER VIEW (their personal view)
  const currentVolunteer = list.find(v => v.email === data.user.email) || list[0];
  if (isVolunteer && currentVolunteer) {
    const myAssignments = assignments[currentVolunteer.id] || [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card" style={{ borderLeft: '3px solid var(--primary)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Ma Mission</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <div><p style={{ fontSize: '0.7rem', color: '#64748b' }}>Rôle</p><p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{currentVolunteer.role}</p></div>
            <div><p style={{ fontSize: '0.7rem', color: '#64748b' }}>Heures/tour</p><p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{currentVolunteer.hoursPerShift || '—'}h</p></div>
            <div><p style={{ fontSize: '0.7rem', color: '#64748b' }}>Nb de tours</p><p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{currentVolunteer.numberOfShifts || '—'}</p></div>
          </div>
        </div>
        {myAssignments.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Mes assignations</h3>
            {myAssignments.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f1f3f5' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: CAT_COLORS[item.category] || '#6366f1' }} />
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.title}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.startTime}–{item.endTime}</span>
                <span style={{ fontSize: '0.72rem', background: '#f1f3f5', padding: '1px 8px', borderRadius: 99 }}>{item.needRole}</span>
              </div>
            ))}
          </div>
        )}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Mes disponibilités</h3>
          <AvailabilitySlots slots={currentVolunteer.availabilitySlots || []} readOnly />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '3px', background: '#f1f3f5', borderRadius: 10, padding: '3px' }}>
          {[{ id: 'list', label: `Bénévoles (${list.length})` }, { id: 'planning', label: 'Planning' }].map(v => (
            <button
              key={v.id} onClick={() => setActiveView(v.id)}
              style={{
                padding: '0.35rem 0.875rem', borderRadius: 8, border: 'none',
                background: activeView === v.id ? 'white' : 'transparent',
                color: activeView === v.id ? '#1a1a1b' : '#64748b',
                fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                boxShadow: activeView === v.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}>
          <Plus size={15} /> Nouveau bénévole
        </button>
      </div>

      {/* LIST VIEW */}
      {activeView === 'list' && (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {list.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              Aucun bénévole.{' '}
              <button onClick={openAdd} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 700 }}>+ Ajouter</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    {['NOM', 'RÔLE', 'CONTACT', 'DISPOS', 'TOURS COURSE', 'POSTES INSPIRANTS', 'NOTES', ''].map(h => (
                      <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map(v => {
                    const availCount = (v.availabilitySlots || []).length;
                    const myItems = assignments[v.id] || [];
                    return (
                      <tr key={v.id} style={{ borderBottom: '1px solid #f1f3f5' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '0.7rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.68rem', fontWeight: 800, flexShrink: 0 }}>
                              {v.name.slice(0, 1)}
                            </div>
                            <div>
                              <p style={{ fontSize: '0.82rem', fontWeight: 700 }}>{v.name}</p>
                              {myItems.length > 0 && <p style={{ fontSize: '0.65rem', color: '#10b981' }}>✓ {myItems.length} assignation{myItems.length > 1 ? 's' : ''}</p>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.7rem 1rem' }}>
                          <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700 }}>{v.role}</span>
                        </td>
                        <td style={{ padding: '0.7rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', color: '#94a3b8' }}>
                            {v.email && <a href={`mailto:${v.email}`} style={{ color: '#94a3b8', display: 'flex' }}><Mail size={13} /></a>}
                            {v.phone && <a href={`tel:${v.phone}`} style={{ color: '#94a3b8', display: 'flex' }}><Phone size={13} /></a>}
                          </div>
                        </td>
                        <td style={{ padding: '0.7rem 1rem', maxWidth: 200 }}>
                          {(v.availabilitySlots || []).length === 0 ? (
                            <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>—</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {(v.availabilitySlots || []).map(s => (
                                <span key={s.id} style={{ fontSize: '0.68rem', color: '#475569', whiteSpace: 'nowrap' }}>
                                  {s.date ? new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
                                  {(s.startTime || s.endTime) && ` · ${s.startTime || ''}→${s.endTime || ''}`}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.7rem 1rem', fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                          {v.numberOfShifts != null ? v.numberOfShifts : '—'}
                        </td>
                        <td style={{ padding: '0.7rem 1rem', maxWidth: 160 }}>
                          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                            {(v.inspiredPoles || []).slice(0, 3).map(p => (
                              <span key={p} style={{ background: '#f1f3f5', color: '#475569', padding: '1px 7px', borderRadius: 99, fontSize: '0.65rem', fontWeight: 600 }}>{p}</span>
                            ))}
                            {(v.inspiredPoles || []).length > 3 && <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>+{v.inspiredPoles.length - 3}</span>}
                          </div>
                        </td>
                        <td style={{ padding: '0.7rem 1rem', fontSize: '0.72rem', color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.notes || <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>
                        <td style={{ padding: '0.7rem 0.875rem', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button onClick={() => openEdit(v)} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 5 }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#f1f3f5'; e.currentTarget.style.color = '#475569'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => deleteItem('volunteers', 'list', v.id)} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: 5 }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                            >
                              <Trash2 size={13} />
                            </button>
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
      )}

      {/* PLANNING VIEW */}
      {activeView === 'planning' && (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 200 + TIMELINE_HOURS.length * HOUR_W }}>
              {/* Hour header */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: '#fafafa', height: 32 }}>
                <div style={{ width: 200, minWidth: 200, borderRight: '1px solid var(--border)', padding: '0 1rem', display: 'flex', alignItems: 'center', fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', position: 'sticky', left: 0, background: '#fafafa', zIndex: 5 }}>
                  BÉNÉVOLE
                </div>
                {TIMELINE_HOURS.map(h => (
                  <div key={h} style={{ width: HOUR_W, minWidth: HOUR_W, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, borderRight: '1px solid #f1f3f5' }}>
                    {h}:00
                  </div>
                ))}
              </div>

              {/* Volunteer rows */}
              {list.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Aucun bénévole.</div>
              ) : list.map((v, idx) => {
                const myItems = assignments[v.id] || [];
                const rowBg = idx % 2 === 0 ? '#fff' : '#fafafa';
                return (
                  <div key={v.id} style={{ display: 'flex', height: 44, borderBottom: '1px solid #f1f3f5', background: rowBg }}>
                    <div style={{ width: 200, minWidth: 200, padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid var(--border)', position: 'sticky', left: 0, background: rowBg, zIndex: 3 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.6rem', fontWeight: 800, flexShrink: 0 }}>
                        {v.name.slice(0, 1)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</p>
                        <p style={{ fontSize: '0.62rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.role}</p>
                      </div>
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                      {TIMELINE_HOURS.map((h, i) => (
                        <div key={h} style={{ position: 'absolute', left: i * HOUR_W, top: 0, bottom: 0, width: 1, background: '#f1f3f5' }} />
                      ))}
                      {myItems.map(item => {
                        const x = timeToX(item.startTime);
                        const endX = timeToX(item.endTime);
                        const barW = Math.max(HOUR_W / 2, endX - x);
                        const color = CAT_COLORS[item.category] || '#6366f1';
                        return (
                          <div key={item.id + v.id} style={{ position: 'absolute', left: x, width: barW, top: 6, bottom: 6, background: `${color}18`, border: `1.5px solid ${color}`, borderRadius: 5, display: 'flex', alignItems: 'center', paddingLeft: 6, fontSize: '0.6rem', fontWeight: 700, color, overflow: 'hidden', whiteSpace: 'nowrap', zIndex: 2 }}>
                            {item.title}
                          </div>
                        );
                      })}
                      {myItems.length === 0 && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                          <span style={{ fontSize: '0.65rem', color: '#e2e8f0' }}>Non assigné</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={editingItem ? 'Modifier le bénévole' : 'Nouveau bénévole'} maxWidth="580px">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>NOM COMPLET *</label>
              <input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>RÔLE / POSTE</label>
              <input type="text" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inputStyle} placeholder="Ex: Bénévole, Lead Pôle..." />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>EMAIL</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>TÉLÉPHONE</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} placeholder="06 XX XX XX XX" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>HEURES / TOUR</label>
              <input type="number" min={1} max={24} value={form.hoursPerShift} onChange={e => setForm(f => ({ ...f, hoursPerShift: parseInt(e.target.value) || 1 }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>TOURS COURSE</label>
              <p style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.6rem', margin: '0 0 0.3rem' }}>(ne compte pas comme bénévolat)</p>
              <input type="number" min={0} value={form.numberOfShifts} onChange={e => setForm(f => ({ ...f, numberOfShifts: parseInt(e.target.value) || 0 }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>HEURE PRÉFÉRÉE</label>
              <input type="time" value={form.preferredStartTime} onChange={e => setForm(f => ({ ...f, preferredStartTime: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>POSTES INSPIRANTS</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {INSPIRED_POLES.map(pole => {
                const active = form.inspiredPoles.includes(pole);
                return (
                  <button
                    key={pole} type="button"
                    onClick={() => toggleInspiredPole(pole)}
                    style={{
                      padding: '4px 12px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                      border: active ? '1.5px solid #3b82f6' : '1.5px solid #e9ecef',
                      background: active ? '#eff6ff' : '#f8f9fa',
                      color: active ? '#2563eb' : '#64748b',
                      transition: 'all 0.15s'
                    }}
                  >
                    {pole}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>DISPONIBILITÉS</label>
            <AvailabilitySlots slots={form.availabilitySlots || []} onChange={slots => setForm(f => ({ ...f, availabilitySlots: slots }))} />
          </div>

          <div>
            <label style={labelStyle}>NOTES</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} placeholder="Informations particulières, compétences..." />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '0.25rem' }}>
            {editingItem ? 'Mettre à jour' : 'Enregistrer le bénévole'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
