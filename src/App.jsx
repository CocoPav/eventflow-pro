import React from 'react';
import { EventProvider } from './context/EventContext';
import Shell from './components/layout/Shell';
import './index.css';

function App() {
  return (
    <EventProvider>
      <Shell />
    </EventProvider>
  );
}

export default App;
