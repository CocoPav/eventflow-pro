import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { FileText, Plus, CheckCircle, Clock, ExternalLink, Download } from 'lucide-react';
import Modal from '../../components/shared/Modal';

export default function MeetingsView() {
  const { data, addItem } = useEvent();
  const { entries } = data.poles.meetings;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], title: '', pole: 'General', decision: '' });
  const [showReport, setShowReport] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    addItem('meetings', 'entries', { ...formData, id: Date.now().toString(), status: 'done' });
    setIsModalOpen(false);
    setFormData({ date: new Date().toISOString().split('T')[0], title: '', pole: 'General', decision: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Réunions & Decisions</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowReport(true)} className="btn-secondary" style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} /> Rapport Global
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Nouveau Compte-rendu
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {entries.sort((a,b) => new Date(b.date) - new Date(a.date)).map(entry => (
          <div key={entry.id} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>{entry.pole}</span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{entry.title}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.date}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={16} color="var(--success)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)' }}>Validé</span>
              </div>
            </div>
            <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Décision : </span>
                {entry.decision}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau Compte-rendu">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DATE</label>
              <input 
                required
                type="date" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>PÔLE CONCERNÉ</label>
              <select 
                value={formData.pole}
                onChange={e => setFormData({...formData, pole: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              >
                <option>General</option>
                <option>Communication</option>
                <option>Budget</option>
                <option>Logistique</option>
                <option>Bénévoles</option>
                <option>Plan</option>
                <option>Programmation</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TITRE DE LA RÉUNION</label>
            <input 
              required
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              placeholder="Ex: Point Hebdo Logistique"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DÉCISION PRINCIPALE</label>
            <textarea 
              required
              value={formData.decision}
              onChange={e => setFormData({...formData, decision: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', resize: 'vertical', minHeight: '100px' }}
              placeholder="Décrire la décision validée..."
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.75rem', marginTop: '1rem' }}>
            Enregistrer la décision
          </button>
        </form>
      </Modal>

      <Modal isOpen={showReport} onClose={() => setShowReport(false)} title="Compte-rendu Global">
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Ce rapport consolide toutes les décisions prises à ce jour.</p>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {entries.map(e => (
               <div key={e.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                 <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>{e.date} • {e.pole}</p>
                 <p style={{ fontWeight: 600 }}>{e.title}</p>
                 <p style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>"{e.decision}"</p>
               </div>
             ))}
           </div>
           <button onClick={() => alert('Téléchargement du PDF simulé...')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
             <Download size={18} /> Télécharger (PDF)
           </button>
         </div>
      </Modal>
    </div>
  );
}
