import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import Badge from '../../components/shared/Badge';
import { Users, Calendar, Shield, Search, Plus, Trash2, Phone, Mail } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import AvailabilityGrid from '../../components/shared/AvailabilityGrid';

export default function VolunteersView() {
  const { data, addItem, updateItem, deleteItem } = useEvent();
  const { list } = data.poles.volunteers;
  const isVolunteer = data.user.role === 'volunteer';
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Bénévole', availability: {} });

  const handleAdd = (e) => {
    e.preventDefault();
    addItem('volunteers', 'list', { ...formData, status: 'confirmed' });
    setIsModalOpen(false);
    setFormData({ name: '', email: '', role: 'Bénévole', availability: {} });
  };

  const currentVolunteer = list.find(v => v.email === data.user.email) || list[0];

  if (isVolunteer) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="card glass" style={{ borderLeft: '4px solid var(--primary)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Ma Mission</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rôle</p>
              <p style={{ fontWeight: 700 }}>{currentVolunteer.role}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Responsable</p>
              <p style={{ fontWeight: 700 }}>Ophélie (Com)</p>
            </div>
             <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lieu</p>
              <p style={{ fontWeight: 700 }}>Accueil Artistes</p>
            </div>
          </div>
        </div>

        <section className="card glass">
           <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Mes disponibilités enregistrées</h3>
           <AvailabilityGrid availability={currentVolunteer.availability} readOnly={true} />
        </section>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="card glass" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={18} color="var(--primary)" />
            <span style={{ fontWeight: 700 }}>{list.length} Bénévoles</span>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Nouveau Bénévole
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>NOM</th>
              <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>RÔLE</th>
              <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>CONTACT</th>
              <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}></th>
            </tr>
          </thead>
          <tbody>
            {list.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v.name}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Confirmé</p>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                   <Badge status="medium" label={v.role} />
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <Mail size={14} style={{ cursor: 'pointer' }} />
                    <Phone size={14} style={{ cursor: 'pointer' }} />
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                  <button onClick={() => deleteItem('volunteers', 'list', v.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau Bénévole">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NOM COMPLET</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>RÔLE</label>
              <select 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              >
                <option>Bénévole</option>
                <option>Lead Pôle</option>
                <option>Staff</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>EMAIL</label>
            <input 
              required
              type="email" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)' }}
            />
          </div>
          <div>
             <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DISPONIBILITÉS</label>
             <AvailabilityGrid availability={formData.availability} onChange={avail => setFormData({...formData, availability: avail})} />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.75rem', marginTop: '1rem' }}>
            Enregistrer le bénévole
          </button>
        </form>
      </Modal>
    </div>
  );
}
