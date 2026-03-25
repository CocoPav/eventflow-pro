import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useEvent } from '../../context/EventContext';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

// Views
import BudgetView from '../../poles/Budget/BudgetView';
import LogisticsView from '../../poles/Logistics/LogisticsView';
import VolunteersView from '../../poles/Volunteers/VolunteersView';
import PlanningView from '../../poles/Volunteers/PlanningView';
import CommunicationView from '../../poles/Communication/CommunicationView';
import MeetingsView from '../../poles/Meetings/MeetingsView';
import ProgrammingView from '../../poles/Programming/ProgrammingView';
import PlanView from '../../poles/Plan/PlanView';
import DashboardView from '../../poles/Dashboard/DashboardView';
import TasksHubView from '../../poles/Tasks/TasksHubView';

export default function Shell() {
  const [activeView, setActiveView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const { data } = useEvent();

  const renderView = () => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      
      const results = [
        ...data.poles.communication.tasks.filter(t => t.title.toLowerCase().includes(searchLower) || (t.description && t.description.toLowerCase().includes(searchLower))).map(t => ({ pole: 'COMMUNICATION', title: t.title, sub: t.description, id: `com-${t.id}` })),
        ...data.poles.volunteers.list.filter(v => v.name.toLowerCase().includes(searchLower)).map(v => ({ pole: 'BÉNÉVOLES', title: v.name, sub: v.role, id: `vol-${v.id}` })),
        ...data.poles.budget.expenses.filter(e => e.label.toLowerCase().includes(searchLower)).map(e => ({ pole: 'BUDGET (Dépense)', title: e.label, sub: `-${e.amount}€`, id: `bud-exp-${e.id}` })),
        ...data.poles.budget.revenues.filter(r => r.label.toLowerCase().includes(searchLower)).map(r => ({ pole: 'BUDGET (Recette)', title: r.label, sub: `+${r.amount}€`, id: `bud-rev-${r.id}` })),
        ...data.poles.logistics.materials.filter(m => m.name.toLowerCase().includes(searchLower)).map(m => ({ pole: 'LOGISTIQUE', title: m.name, sub: m.category, id: `log-${m.id}` })),
      ];

      return (
        <div style={{ padding: '2rem 3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Search Results for "{searchTerm}"</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {results.length > 0 ? results.map(res => (
              <div key={res.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>{res.pole}</span>
                  <p style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>{res.title}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{res.sub}</p>
                </div>
                <ChevronRight size={20} color="var(--border-strong)" />
              </div>
            )) : (
              <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                No results found for your search.
              </div>
            )}
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard': return <DashboardView onViewChange={setActiveView} />;
      case 'tasks': return <TasksHubView />;
      case 'communication': return <CommunicationView />;
      case 'volunteers': return <VolunteersView />;
      case 'budget': return <BudgetView />;
      case 'logistics': return <LogisticsView />;
      case 'programming': return <ProgrammingView />;
      case 'plan': return <PlanView />;
      case 'meetings': return <MeetingsView />;
      default: return <DashboardView onViewChange={setActiveView} />;
    }
  };

  return (
    <div style={{ display: 'flex', background: '#f8f9fa', minHeight: '100vh' }}>
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main style={{ flex: 1, marginLeft: '280px', display: 'flex', flexDirection: 'column' }}>
        <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} activeView={activeView} />
        <div style={{ padding: '3rem', flex: 1, background: 'white' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView + searchTerm}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
