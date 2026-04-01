import React, { useState } from 'react';
import { ArrowLeft, Music, Users, Package, FileText, Map, CalendarDays, Flag, LayoutGrid } from 'lucide-react';

// All existing pole views
import ProgrammingView from '../Programming/ProgrammingView';
import VolunteersView from '../Volunteers/VolunteersView';
import LogisticsView from '../Logistics/LogisticsView';
import MeetingsView from '../Meetings/MeetingsView';
import PlanView from '../Plan/PlanView';
import CalendarView from '../CalendarView/CalendarView';
import CourseView from '../Course/CourseView';
import TasksHubView from '../Tasks/TasksHubView';

const TABS = [
  { id: 'programme',  label: 'Programme',   icon: Music,        component: ProgrammingView },
  { id: 'benevoles',  label: 'Bénévoles',   icon: Users,        component: VolunteersView },
  { id: 'logistique', label: 'Logistique',  icon: Package,      component: LogisticsView },
  { id: 'reunions',   label: 'Réunions',    icon: FileText,     component: MeetingsView },
  { id: 'plan',       label: 'Plan',        icon: Map,          component: PlanView },
  { id: 'calendrier', label: 'Calendrier',  icon: CalendarDays, component: CalendarView },
  { id: 'course',     label: 'Course',      icon: Flag,         component: CourseView },
  { id: 'taches',     label: 'Tâches',      icon: LayoutGrid,   component: TasksHubView },
];

export default function EventDetailView({ eventId, onBack }) {
  const [activeTab, setActiveTab] = useState('programme');

  const tab = TABS.find(t => t.id === activeTab) || TABS[0];
  const ActiveComponent = tab.component;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Sub-header */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-app)', position: 'sticky', top: 60, zIndex: 80 }}>
        <div style={{ padding: '0 2.5rem', display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto' }}>
          <button
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', padding: '0.875rem 0', marginRight: '1rem', flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            <ArrowLeft size={14} /> Événements
          </button>

          <div style={{ width: 1, height: 20, background: 'var(--border)', marginRight: '1rem', flexShrink: 0 }} />

          {TABS.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0.875rem 0.875rem',
                  background: 'none', border: 'none',
                  borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                  color: active ? 'var(--text-main)' : 'var(--text-muted)',
                  cursor: 'pointer', fontWeight: active ? 700 : 400,
                  fontSize: '0.82rem', flexShrink: 0, whiteSpace: 'nowrap',
                  transition: 'color 0.12s', marginBottom: -1,
                }}
              >
                <Icon size={14} strokeWidth={active ? 2.5 : 1.8} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <ActiveComponent />
      </div>
    </div>
  );
}
