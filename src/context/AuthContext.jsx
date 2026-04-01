import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

// ── Utilisateurs hardcodés ────────────────────────────────────────────────────
export const USERS = [
  { id: 'u1', name: 'Corentin Pavoine', email: 'corentin@eventflow.fr', password: 'admin',    role: 'organizer', avatar: 'CP', volunteerId: null },
  { id: 'u2', name: 'Ophélie Garnier',  email: 'ophelie@eventflow.fr',  password: 'admin',    role: 'organizer', avatar: 'OG', volunteerId: null },
  { id: 'u3', name: 'Malo Morvan',      email: 'malo@eventflow.fr',     password: 'admin',    role: 'organizer', avatar: 'MM', volunteerId: null },
  { id: 'u4', name: 'Yannig Etienne',   email: 'yannig@email.com',      password: 'benevole', role: 'volunteer', avatar: 'YE', volunteerId: 'v1' },
  { id: 'u5', name: 'Paolo Ossieux',    email: 'paolo@email.com',        password: 'benevole', role: 'volunteer', avatar: 'PO', volunteerId: 'v2' },
  { id: 'u6', name: 'Léa Marchand',     email: 'lea@email.com',          password: 'benevole', role: 'volunteer', avatar: 'LM', volunteerId: 'v3' },
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('eventflow_auth');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = (email, password) => {
    const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return false;
    const { password: _, ...safeUser } = user;
    setCurrentUser(safeUser);
    sessionStorage.setItem('eventflow_auth', JSON.stringify(safeUser));
    return true;
  };

  // Validate without committing (for animation sequencing)
  const validateLogin = (email, password) => {
    const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return null;
    const { password: _, ...safeUser } = user;
    return safeUser;
  };

  const commitLogin = (safeUser) => {
    setCurrentUser(safeUser);
    sessionStorage.setItem('eventflow_auth', JSON.stringify(safeUser));
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('eventflow_auth');
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, login, validateLogin, commitLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
