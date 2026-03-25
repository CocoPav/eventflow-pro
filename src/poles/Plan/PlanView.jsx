import React, { useState } from 'react';
import { Map, Pin, Palette, Plus, ChevronRight } from 'lucide-react';
import Modal from '../../components/shared/Modal';

export default function PlanView() {
  const [markers, setMarkers] = useState([
    { id: 1, type: 'infra', label: 'SCÈNE PRINCIPALE', x: 30, y: 20 },
    { id: 2, type: 'tech', label: 'BUVETTE / BBQ', x: 60, y: 50 },
    { id: 3, type: 'deco', label: 'DÉCO ENTRÉE', x: 75, y: 15 },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ label: '', type: 'infra' });

  const handleAdd = (e) => {
    e.preventDefault();
    setMarkers([...markers, { 
      id: Date.now(), 
      ...formData, 
      x: 20 + Math.random() * 60, 
      y: 20 + Math.random() * 60 
    }]);
    setIsModalOpen(false);
    setFormData({ label: '', type: 'infra' });
  };

  const getMarkerColor = (type) => {
    switch(type) {
      case 'infra': return 'var(--primary)';
      case 'tech': return 'var(--warning)';
      case 'deco': return 'var(--success)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        <div className="card" style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: 0 }}>
          <div style={{ 
            width: '100%', height: '100%', 
            backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(0,0,0,0.02) 0%, transparent 20%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.02) 0%, transparent 20%)',
            backgroundSize: '40px 40px',
            backgroundColor: '#f8f9fa'
          }}></div>
          
          {markers.map(m => (
            <div key={m.id} style={{ position: 'absolute', top: `${m.y}%`, left: `${m.x}%`, textAlign: 'center', transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
              {m.type === 'deco' ? <Palette size={24} color={getMarkerColor(m.type)} /> : <Pin size={32} color={getMarkerColor(m.type)} />}
              <p style={{ fontSize: '0.65rem', fontWeight: 700, background: 'var(--bg-sidebar)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', marginTop: '4px', whiteSpace: 'nowrap' }}>
                {m.label}
              </p>
            </div>
          ))}

          <div style={{ position: 'absolute', bottom: '2rem', right: '2rem' }}>
            <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)' }}>
              <Plus size={24} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section className="card">
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>Liste des éléments</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {markers.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getMarkerColor(m.type) }}></div>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card glass">
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>Légende</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                <span>Infrastructures</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--warning)' }}></div>
                <span>Zones Techniques</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)' }}></div>
                <span>Décoration</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajouter un élément au plan">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NOM DE L'ÉLÉMENT</label>
            <input 
              required
              type="text" 
              value={formData.label}
              onChange={e => setFormData({...formData, label: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              placeholder="Ex: Totem Signalétique"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TYPE</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)' }}
            >
              <option value="infra">Infrastructures</option>
              <option value="tech">Zones Techniques</option>
              <option value="deco">Décoration</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.75rem', marginTop: '1rem' }}>
            Placer sur le plan
          </button>
        </form>
      </Modal>
    </div>
  );
}
