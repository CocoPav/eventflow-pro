import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import Badge from '../../components/shared/Badge';
import { Music, Accessibility, Clock, DollarSign, Plus, Trash2 } from 'lucide-react';
import Modal from '../../components/shared/Modal';

export default function ProgrammingView() {
  const { data, addItem, deleteItem } = useEvent();
  const { concerts, animations } = data.poles.programming;
  const [activeTab, setActiveTab] = useState('concerts');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', style: '', time: '20:00', fee: 0, status: 'pending' });

  const fmt = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

  const handleAdd = (e) => {
    e.preventDefault();
    addItem('programming', activeTab, { ...formData, id: Date.now().toString() });
    setIsModalOpen(false);
    setFormData({ name: '', style: '', time: '20:00', fee: 0, status: 'pending' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <button 
            onClick={() => setActiveTab('concerts')}
            style={{ padding: '1rem 0', background: 'transparent', border: 'none', color: activeTab === 'concerts' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', position: 'relative' }}
          >
            Concerts {activeTab === 'concerts' && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--primary)' }} />}
          </button>
          <button 
            onClick={() => setActiveTab('animations')}
            style={{ padding: '1rem 0', background: 'transparent', border: 'none', color: activeTab === 'animations' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', position: 'relative' }}
          >
            Animations {activeTab === 'animations' && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--primary)' }} />}
          </button>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Ajouter {activeTab === 'concerts' ? 'un artiste' : 'une animation'}
        </button>
      </div>

      {activeTab === 'concerts' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {concerts.map(artist => (
            <div key={artist.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{artist.name}</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{artist.style}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Badge status={artist.status} />
                  <button onClick={() => deleteItem('programming', 'concerts', artist.id)} style={{ padding: '4px', background: 'transparent', border: 'none', color: 'rgba(239, 68, 68, 0.5)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-sidebar)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="var(--primary)" />
                  <span style={{ fontSize: '0.8125rem' }}>{artist.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={16} color="var(--success)" />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{fmt(artist.fee)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ANIMATION</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>HORAIRE</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}></th>
                </tr>
              </thead>
              <tbody>
                {animations.map(an => (
                  <tr key={an.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>{an.name}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.8125rem' }}><Clock size={12} style={{ marginRight: '4px' }} /> {an.time}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <button onClick={() => deleteItem('programming', 'animations', an.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={activeTab === 'concerts' ? 'Nouvel Artiste' : 'Nouvelle Animation'}>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NOM</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              placeholder="Ex: The Rolling Stones"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>HORAIRE</label>
              <input 
                required
                type="time" 
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              />
            </div>
            {activeTab === 'concerts' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>CACHET (€)</label>
                <input 
                  required
                  type="number" 
                  value={formData.fee}
                  onChange={e => setFormData({...formData, fee: parseFloat(e.target.value)})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                />
              </div>
            )}
          </div>
          {activeTab === 'concerts' && (
             <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>STYLE</label>
              <input 
                type="text" 
                value={formData.style}
                onChange={e => setFormData({...formData, style: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                placeholder="Rock / Jazz / Pop..."
              />
            </div>
          )}
          <button type="submit" className="btn-primary" style={{ padding: '0.75rem', marginTop: '1rem' }}>
            Enregistrer
          </button>
        </form>
      </Modal>
    </div>
  );
}
