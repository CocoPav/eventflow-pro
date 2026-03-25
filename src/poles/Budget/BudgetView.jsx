import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign } from 'lucide-react';
import Modal from '../../components/shared/Modal';

export default function BudgetView() {
  const { data, addItem, deleteItem } = useEvent();
  const { expenses, revenues } = data.poles.budget;
  const [activeTab, setActiveTab] = useState('expenses');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ label: '', amount: '', category: 'Autre' });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenues = revenues.reduce((sum, r) => sum + r.amount, 0);
  const balance = totalRevenues - totalExpenses;

  const fmt = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

  const handleSubmit = (e) => {
    e.preventDefault();
    addItem('budget', activeTab, { 
      label: formData.label, 
      amount: parseFloat(formData.amount), 
      category: formData.category,
      date: new Date().toISOString()
    });
    setIsModalOpen(false);
    setFormData({ label: '', amount: '', category: 'Autre' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>DÉPENSES</span>
            <ArrowDownRight size={18} color="var(--danger)" />
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>{fmt(totalExpenses)}</p>
        </div>
        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>RECETTES</span>
            <ArrowUpRight size={18} color="var(--success)" />
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{fmt(totalRevenues)}</p>
        </div>
        <div className="card glass" style={{ background: balance >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SOLDE ACTUEL</span>
            <TrendingUp size={18} color={balance >= 0 ? 'var(--success)' : 'var(--danger)'} />
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{fmt(balance)}</p>
        </div>
      </div>

      {/* Tabs and Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <button 
            onClick={() => setActiveTab('expenses')}
            style={{ padding: '1rem 0', background: 'transparent', border: 'none', color: activeTab === 'expenses' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', position: 'relative' }}
          >
            Dépenses {activeTab === 'expenses' && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--primary)' }} />}
          </button>
          <button 
            onClick={() => setActiveTab('revenues')}
            style={{ padding: '1rem 0', background: 'transparent', border: 'none', color: activeTab === 'revenues' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', position: 'relative' }}
          >
            Recettes {activeTab === 'revenues' && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--primary)' }} />}
          </button>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Ajouter {activeTab === 'expenses' ? 'une dépense' : 'une recette'}
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>LIBELLÉ</th>
              <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>CATÉGORIE</th>
              <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>MONTANT</th>
              <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}></th>
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'expenses' ? expenses : revenues).map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>{item.label}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                   <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-sidebar)', border: '1px solid var(--border)' }}>{item.category}</span>
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 700, color: activeTab === 'expenses' ? 'var(--danger)' : 'var(--success)' }}>
                  {activeTab === 'expenses' ? '-' : '+'}{fmt(item.amount)}
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                  <button onClick={() => deleteItem('budget', activeTab, item.id)} style={{ padding: '0.5rem', borderRadius: '8px', background: 'transparent', border: 'none', color: 'rgba(239, 68, 68, 0.5)', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.5)'}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={activeTab === 'expenses' ? 'Nouvelle Dépense' : 'Nouvelle Recette'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>LIBELLÉ</label>
            <input 
              required
              type="text" 
              value={formData.label} 
              onChange={(e) => setFormData({...formData, label: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
              placeholder="Ex: Facture Electricité"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>MONTANT (€)</label>
              <input 
                required
                type="number" 
                step="0.01"
                value={formData.amount} 
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
                placeholder="150.00"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>CATÉGORIE</label>
              <select 
                value={formData.category} 
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
              >
                <option>Communication</option>
                <option>Logistique</option>
                <option>Artistes</option>
                <option>Technique</option>
                <option>Autre</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.75rem', marginTop: '1rem' }}>
            Enregistrer
          </button>
        </form>
      </Modal>
    </div>
  );
}
