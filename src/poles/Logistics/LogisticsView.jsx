import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import Badge from '../../components/shared/Badge';
import { Package, Truck, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import Modal from '../../components/shared/Modal';

export default function LogisticsView() {
  const { data, addMaterialWithBudget, deleteItem } = useEvent();
  const { materials, consumables } = data.poles.logistics;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', quantity: 1, unit: 'pcs', unitPrice: 0 });

  const stats = {
    totalItems: materials.length + consumables.length,
    toDeliver: materials.filter(m => m.status === 'todo').length,
    alerts: consumables.filter(c => c.stock < 5).length
  };

  const handleAdd = (e) => {
    e.preventDefault();
    addMaterialWithBudget({
      label: formData.name,
      qty: parseInt(formData.quantity),
      unit: formData.unit,
      status: 'todo',
      unitPrice: parseFloat(formData.unitPrice)
    });
    setIsModalOpen(false);
    setFormData({ name: '', quantity: 1, unit: 'pcs', unitPrice: 0 });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
            <Package color="var(--primary)" size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL ÉLÉMENTS</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.totalItems}</p>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px' }}>
            <Truck color="var(--warning)" size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>EN ATTENTE</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.toDeliver}</p>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
            <AlertTriangle color="var(--danger)" size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>ALERTES STOCK</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.alerts}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Inventaire Matériel</h3>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Nouveau Matériel
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>NOM</th>
              <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>QUANTITÉ</th>
              <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUT</th>
              <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}></th>
            </tr>
          </thead>
          <tbody>
            {materials.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>{m.label}</td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.8125rem' }}>{m.qty} {m.unit}</td>
                <td style={{ padding: '1rem 1.5rem' }}><Badge status={m.status} /></td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                  <button onClick={() => deleteItem('logistics', 'materials', m.id)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajouter du matériel">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NOM DU MATÉRIEL</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              placeholder="Ex: Barrière Vauban"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>QUANTITÉ</label>
              <input 
                type="number"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              />
            </div>
             <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>PRIX UNITAIRE (€)</label>
              <input 
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={e => setFormData({...formData, unitPrice: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              />
            </div>
          </div>
          <p style={{ fontSize: '0.65rem', color: 'var(--primary)', fontStyle: 'italic' }}>
            Note: Cette action créera automatiquement une dépense dans le pôle Budget.
          </p>
          <button type="submit" className="btn-primary" style={{ padding: '0.75rem', marginTop: '1rem' }}>
            Confirmer & Ajouter au Budget
          </button>
        </form>
      </Modal>
    </div>
  );
}
