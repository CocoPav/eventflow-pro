import React, { createContext, useContext, useState, useEffect } from 'react';

const EventContext = createContext();

const INITIAL_DATA = {
  user: {
    id: 'u1',
    name: 'Corentin Pavoine',
    email: 'cpavoine@gmail.com',
    role: 'organizer', // 'organizer', 'lead', 'volunteer'
    poles: ['all']
  },
  event: {
    name: "La Grande Basse Court",
    edition: "Édition 3",
    date: "2026-06-06",
    location: "Saint-Malo-de-Phily",
  },
  poles: {
    communication: {
      tasks: [
        {
          id: 'c1',
          title: 'Campagne Facebook',
          description: 'Création et boost du post d\'annonce de l\'évent.',
          status: 'todo',
          priority: 'high',
          dueDate: '2026-04-10',
          assignee: 'Ophélie',
          support: 'Réseaux Sociaux',
          location: 'Bureau',
          dependencies: [],
          attachments: []
        },
        {
          id: 'c2',
          title: 'Impression affiches',
          description: 'Commander 50 affiches A3 chez l\'imprimeur local.',
          status: 'done',
          priority: 'medium',
          dueDate: '2026-03-15',
          assignee: 'Corentin',
          support: 'Print',
          location: 'Imprimerie',
          dependencies: [],
          attachments: []
        }
      ],
      history: [
        { date: '21 Mars', action: 'Validation de la charte graphique' },
        { date: '15 Mars', action: 'Lancement de la recherche de bénévoles' }
      ]
    },
    volunteers: {
      list: [
        { id: 'v1', name: 'Yannig Etienne', role: 'Restauration', status: 'confirmed', contact: 'Malo', assignedLead: 'u1', shift: '15h-18h' },
        { id: 'v2', name: 'Paolo Ossieux', role: 'Buvette', status: 'confirmed', contact: 'Corentin', assignedLead: 'u1', shift: '18h-21h' }
      ],
      availability: {} // Date based availability
    },
    budget: {
      expenses: [
        { id: 'e1', label: 'Protection Civile', cat: 'Sécurité', amount: 1041, linkedId: null },
        { id: 'e2', label: 'BPM Bros (Cachet)', cat: 'Concerts', amount: 450, linkedId: 'art1' }
      ],
      revenues: [
        { id: 'r1', label: 'Billetterie Coureurs', cat: 'Billetterie', amount: 2000 },
        { id: 'r2', label: 'Subvention Commune', cat: 'Subventions', amount: 1700 }
      ]
    },
    logistics: {
      materials: [
        { id: 'm1', label: 'Gobelets 25cl', qty: 1000, unitPrice: 0.15, status: 'ordered' },
        { id: 'm2', label: 'Barrières Vauban', qty: 50, unitPrice: 5, status: 'todo' }
      ],
      consumables: [
        { id: 'co1', label: 'Fûts bière', qty: 55, unitPrice: 70, status: 'todo' }
      ]
    },
    programming: {
      concerts: [
        { id: 'art1', name: 'BPM Bros', style: 'Electro', fee: 450, status: 'confirmed', time: '20h-21h' },
        { id: 'art2', name: 'Soul Nation', style: 'Funk', fee: 900, status: 'pending', time: '22h-00h' }
      ],
      animations: [
        { id: 'an1', name: 'Course 5km', type: 'Sport', time: '15h00' },
        { id: 'an2', name: 'Théâtre de rue', type: 'Spectacle', time: '16h30' }
      ]
    },
    meetings: [
      { id: 'mt1', date: '2025-03-25', title: 'Réunion Orga #4', decisions: [
        { id: 'd1', text: 'Validation du budget sécurité', pole: 'budget' }
      ]}
    ]
  }
};

export const EventProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('eventflow_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  useEffect(() => {
    localStorage.setItem('eventflow_data', JSON.stringify(data));
  }, [data]);

  // CRUD Operations
  const updatePoleData = (pole, key, updateFn) => {
    setData(prev => ({
      ...prev,
      poles: {
        ...prev.poles,
        [pole]: {
          ...prev.poles[pole],
          [key]: typeof updateFn === 'function' ? updateFn(prev.poles[pole][key]) : updateFn
        }
      }
    }));
  };

  const addItem = (pole, type, item) => {
    setData(prev => {
      const newItem = { 
        ...item, 
        id: item.id || Date.now().toString() 
      };
      
      const newData = {
        ...prev,
        poles: {
          ...prev.poles,
          [pole]: {
            ...prev.poles[pole],
            [type]: [...prev.poles[pole][type], newItem]
          }
        }
      };
      
      localStorage.setItem('eventflow_data', JSON.stringify(newData));
      return newData;
    });
  };

  const updateItem = (pole, key, id, updates) => {
    updatePoleData(pole, key, (items) => items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteItem = (pole, key, id) => {
    updatePoleData(pole, key, (items) => items.filter(item => item.id !== id));
  };

  // Cross-pole actions
  const addMaterialWithBudget = (material) => {
    const id = Math.random().toString(36).substr(2, 9);
    const cost = material.qty * material.unitPrice;
    
    setData(prev => ({
      ...prev,
      poles: {
        ...prev.poles,
        logistics: {
          ...prev.poles.logistics,
          materials: [...prev.poles.logistics.materials, { ...material, id }]
        },
        budget: {
          ...prev.poles.budget,
          expenses: [...prev.poles.budget.expenses, {
            id: 'e_' + id,
            label: `Matériel: ${material.label}`,
            cat: 'Logistique',
            amount: cost,
            linkedId: id
          }]
        }
      }
    }));
  };

  const switchRole = () => {
    setData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        role: prev.user.role === 'organizer' ? 'volunteer' : 'organizer'
      }
    }));
  };

  // Helper to get all "Task-like" items from all poles
  const getGlobalTasks = () => {
    const comTasks = data.poles.communication.tasks.map(t => ({ ...t, pole: 'Communication', type: 'task' }));
    const logTasks = data.poles.logistics.materials.map(m => ({ 
      id: m.id, 
      title: `Logistique: ${m.label}`, 
      status: m.status === 'todo' ? 'todo' : 'done',
      pole: 'Logistique',
      type: 'material',
      priority: 'medium',
      dueDate: '2026-06-01', // Default or linked to event
      description: `Matériel à prévoir : ${m.qty} ${m.unit || 'uds'}`
    }));
    return [...comTasks, ...logTasks];
  };

  const value = {
    data,
    setData,
    updatePoleData,
    addItem,
    updateItem,
    deleteItem,
    addMaterialWithBudget,
    switchRole,
    getGlobalTasks
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error('useEvent must be used within an EventProvider');
  return context;
};
