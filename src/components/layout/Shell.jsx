import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useEvent } from '../../context/EventContext';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { ToastProvider } from '../shared/Toast';

// Event views
import BudgetView from '../../poles/Budget/BudgetView';
import LogisticsView from '../../poles/Logistics/LogisticsView';
import VolunteersView from '../../poles/Volunteers/VolunteersView';
import CommunicationView from '../../poles/Communication/CommunicationView';
import MeetingsView from '../../poles/Meetings/MeetingsView';
import ProgrammingView from '../../poles/Programming/ProgrammingView';
import EventMapView from '../../poles/Plan/EventMapView';
import DashboardView from '../../poles/Dashboard/DashboardView';
import TasksHubView from '../../poles/Tasks/TasksHubView';
import CalendarView from '../../poles/CalendarView/CalendarView';
import CourseView from '../../poles/Course/CourseView';
import ConsumablesView from '../../poles/Programming/ConsumablesView';
import SettingsView from '../../poles/Settings/SettingsView';
import InscriptionView from '../../poles/Inscription/InscriptionView';

// Association views
import MembersView from '../../poles/Members/MembersView';
import AdminView from '../../poles/Administration/AdminView';
import SponsorsView from '../../poles/Sponsors/SponsorsView';
import InventoryView from '../../poles/Inventory/InventoryView';
import EventsView from '../../poles/Events/EventsView';
import AssoDashboardView from '../../poles/AssoDashboard/AssoDashboardView';
import AssoTasksView from '../../poles/AssoTasks/AssoTasksView';
import AssoBudgetView from '../../poles/AssoBudget/AssoBudgetView';
import AssoCommunicationView from '../../poles/AssoCommunication/AssoCommunicationView';

export default function Shell() {
  const [appMode, setAppMode]   = useState(() => sessionStorage.getItem('appMode')   || 'asso');
  const [activeView, setView]   = useState(() => sessionStorage.getItem('activeView') || 'dashboard');
  const [assoView, setAssoView] = useState(() => sessionStorage.getItem('assoView')  || 'asso-dashboard');
  const [searchTerm, setSearch] = useState('');
  const { data } = useEvent();

  const handleModeChange = (m) => { setAppMode(m); sessionStorage.setItem('appMode', m); };
  const handleViewChange = (v) => { setView(v);    sessionStorage.setItem('activeView', v); };
  const handleAssoView   = (v) => { setAssoView(v);sessionStorage.setItem('assoView', v); };

  const renderAssoView = () => {
    switch (assoView) {
      case 'asso-dashboard':     return <AssoDashboardView onViewChange={handleAssoView} />;
      case 'events':             return <EventsView onOpenEvent={() => { handleModeChange('event'); handleViewChange('dashboard'); }} />;
      case 'asso-tasks':         return <AssoTasksView />;
      case 'asso-budget':        return <AssoBudgetView />;
      case 'asso-communication': return <AssoCommunicationView />;
      case 'members':            return <MembersView />;
      case 'administration':     return <AdminView />;
      case 'sponsors':           return <SponsorsView />;
      case 'inventory':          return <InventoryView />;
      case 'settings':           return <SettingsView />;
      default:                   return <AssoDashboardView onViewChange={handleAssoView} />;
    }
  };

  const renderView = () => {
    if (appMode === 'asso') return renderAssoView();

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const results = [
        ...data.poles.communication.tasks.filter(t => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)).map(t => ({ pole: 'COMMUNICATION', title: t.title, sub: t.description, id: `com-${t.id}`, view: 'communication' })),
        ...(data.poles.communication.campaigns || []).filter(c => c.name.toLowerCase().includes(q)).map(c => ({ pole: 'CAMPAGNE', title: c.name, sub: c.channel, id: `camp-${c.id}`, view: 'communication' })),
        ...data.poles.volunteers.list.filter(v => v.name.toLowerCase().includes(q) || (v.role || '').toLowerCase().includes(q)).map(v => ({ pole: 'BÉNÉVOLES', title: v.name, sub: v.role, id: `vol-${v.id}`, view: 'volunteers' })),
        ...data.poles.budget.expenses.filter(e => e.label.toLowerCase().includes(q)).map(e => ({ pole: 'BUDGET – Dépense', title: e.label, sub: `-${e.amount}€`, id: `bud-exp-${e.id}`, view: 'budget' })),
        ...data.poles.budget.revenues.filter(r => r.label.toLowerCase().includes(q)).map(r => ({ pole: 'BUDGET – Recette', title: r.label, sub: `+${r.amount}€`, id: `bud-rev-${r.id}`, view: 'budget' })),
        ...data.poles.logistics.materials.filter(m => (m.title || m.label || '').toLowerCase().includes(q)).map(m => ({ pole: 'LOGISTIQUE', title: m.title || m.label, sub: m.pole || '', id: `log-${m.id}`, view: 'logistics' })),
        ...(data.poles.programming.artists || []).filter(a => a.name.toLowerCase().includes(q)).map(a => ({ pole: 'ARTISTE', title: a.name, sub: a.genre, id: `art-${a.id}`, view: 'concerts' })),
        ...(data.poles.programming.animations || []).filter(a => a.name.toLowerCase().includes(q)).map(a => ({ pole: 'ANIMATION', title: a.name, sub: a.type, id: `ani-${a.id}`, view: 'animations' })),
        ...(data.poles.meetings.entries || []).flatMap(m =>
          (m.decisions || []).filter(d => (d.text || '').toLowerCase().includes(q)).map(d => ({ pole: 'DÉCISION', title: d.text, sub: m.title, id: `dec-${d.id}`, view: 'meetings' }))
        ),
      ];

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 className="section-title">Résultats<span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '1.25rem' }}> pour "{searchTerm}"</span></h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {results.length > 0 ? results.map(res => (
              <div key={res.id} className="card" onClick={() => { setSearch(''); handleViewChange(res.view); }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '0.75rem 1rem' }}>
                <div>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{res.pole}</span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: 2 }}>{res.title}</p>
                  {res.sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{res.sub}</p>}
                </div>
                <ChevronRight size={16} color="var(--border-strong)" />
              </div>
            )) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Aucun résultat trouvé.
              </div>
            )}
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':    return <DashboardView onViewChange={handleViewChange} />;
      case 'tasks':        return <TasksHubView />;
      case 'communication':return <CommunicationView />;
      case 'volunteers':   return <VolunteersView />;
      case 'budget':       return <BudgetView />;
      case 'logistics':    return <LogisticsView />;
      case 'concerts':     return <ProgrammingView defaultTab="artists" />;
      case 'animations':   return <ProgrammingView defaultTab="animations" />;
      case 'programme':    return <ProgrammingView defaultTab="schedule" />;
      case 'programming':  return <ProgrammingView />;
      case 'consumables':  return <ConsumablesView />;
      case 'course':       return <CourseView />;
      case 'calendar':     return <CalendarView />;
      case 'plan':         return <EventMapView />;
      case 'meetings':     return <MeetingsView />;
      case 'inscription':  return <InscriptionView />;
      case 'settings':     return <SettingsView />;
      // legacy
      case 'event-admin':  return <SettingsView />;
      default:             return <DashboardView onViewChange={handleViewChange} />;
    }
  };

  const currentId = appMode === 'event' ? activeView : assoView;
  const noPadding = appMode === 'event' && activeView === 'dashboard';

  return (
    <ToastProvider>
      <div style={{ display: 'flex', background: 'var(--bg-app)', minHeight: '100vh' }}>
        <Sidebar
          appMode={appMode}
          onModeChange={handleModeChange}
          activeView={activeView}
          onViewChange={handleViewChange}
          assoView={assoView}
          onAssoViewChange={handleAssoView}
        />
        <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header
            searchTerm={searchTerm}
            onSearchChange={setSearch}
            activeView={currentId}
            onNavigate={appMode === 'event' ? handleViewChange : handleAssoView}
          />
          <div style={{
            flex: 1,
            background: 'var(--bg-card)',
            padding: noPadding ? 0 : '1.75rem 2rem',
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView + assoView + searchTerm}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
