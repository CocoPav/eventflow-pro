import React from 'react';
import { EventProvider } from './context/EventContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Shell from './components/layout/Shell';
import LoginView from './components/auth/LoginView';
import VolunteerPortal from './poles/VolunteerPortal/VolunteerPortal';
import './index.css';

function AppRouter() {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) return <LoginView />;
  if (currentUser.role === 'volunteer') return <VolunteerPortal />;

  return <Shell />;
}

function App() {
  return (
    <AuthProvider>
      <EventProvider>
        <NotificationProvider>
          <AppRouter />
        </NotificationProvider>
      </EventProvider>
    </AuthProvider>
  );
}

export default App;
