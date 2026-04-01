import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

const NotificationContext = createContext();

// ── Types ─────────────────────────────────────────────────────────────────────
export const NOTIF_TYPES = {
  deadline:   { color: '#ef4444', bg: '#fef2f2', icon: '⏰', label: 'Échéance' },
  overdue:    { color: '#dc2626', bg: '#fef2f2', icon: '🚨', label: 'En retard' },
  warning:    { color: '#f59e0b', bg: '#fffbeb', icon: '⚠️', label: 'Attention' },
  success:    { color: '#10b981', bg: '#f0fdf4', icon: '✅', label: 'Succès' },
  info:       { color: '#6366f1', bg: '#eff6ff', icon: 'ℹ️', label: 'Info' },
};

// ── Compute notifications from data ───────────────────────────────────────────
function computeNotifications(data) {
  const notifs = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in3days = new Date(today); in3days.setDate(in3days.getDate() + 3);

  // 1. Communication tasks with deadline ≤ 3 days
  (data.poles.communication.tasks || []).forEach(t => {
    if (!t.dueDate || t.status === 'done') return;
    const due = new Date(t.dueDate);
    if (due <= today) {
      notifs.push({ id: `task_overdue_${t.id}`, type: 'overdue', title: `Tâche en retard`, message: t.title, link: 'communication', createdAt: t.dueDate });
    } else if (due <= in3days) {
      notifs.push({ id: `task_deadline_${t.id}`, type: 'deadline', title: `Échéance dans ${Math.ceil((due - today) / 86400000)}j`, message: t.title, link: 'communication', createdAt: t.dueDate });
    }
  });

  // 2. Meeting decisions overdue
  (data.poles.meetings.entries || []).forEach(m => {
    (m.decisions || []).forEach(d => {
      if (!d.deadline || d.status === 'done') return;
      const due = new Date(d.deadline);
      if (due < today) {
        notifs.push({ id: `decision_overdue_${d.id}`, type: 'overdue', title: `Décision en retard`, message: `${d.title} — ${d.responsible || 'N/A'}`, link: 'meetings', createdAt: d.deadline });
      }
    });
  });

  // 3. Logistics materials stuck at 'to_ask'
  const toAsk = (data.poles.logistics.materials || []).filter(m => m.status === 'to_ask');
  if (toAsk.length > 0) {
    notifs.push({ id: `logistics_to_ask`, type: 'warning', title: `${toAsk.length} matériel(s) à commander`, message: toAsk.slice(0, 2).map(m => m.title || m.label).join(', ') + (toAsk.length > 2 ? `… +${toAsk.length - 2}` : ''), link: 'logistics', createdAt: null });
  }

  // 4. Volunteers still pending
  const pendingVols = (data.poles.volunteers.list || []).filter(v => v.status === 'pending');
  if (pendingVols.length > 0) {
    notifs.push({ id: `volunteers_pending`, type: 'info', title: `${pendingVols.length} bénévole(s) en attente`, message: pendingVols.map(v => v.name).join(', '), link: 'volunteers', createdAt: null });
  }

  // 5. Artists still as prospects (no contact)
  const prospects = (data.poles.programming.artists || []).filter(a => a.status === 'prospect' && !a.contact);
  if (prospects.length > 0) {
    notifs.push({ id: `artists_prospect`, type: 'info', title: `${prospects.length} artiste(s) à contacter`, message: prospects.map(a => a.name).join(', '), link: 'programming', createdAt: null });
  }

  // 6. Campaigns overdue
  (data.poles.communication.campaigns || []).forEach(c => {
    if (!c.endDate || c.status === 'done' || c.status === 'cancelled') return;
    if (new Date(c.endDate) < today) {
      notifs.push({ id: `campaign_overdue_${c.id}`, type: 'warning', title: `Campagne en retard`, message: c.name, link: 'communication', createdAt: c.endDate });
    }
  });

  return notifs;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export const NotificationProvider = ({ children }) => {
  const [dismissedIds, setDismissedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aoza_dismissed_notifs') || '[]'); }
    catch { return []; }
  });

  // Action-based notifications (e.g. "Budget synced")
  const [actionNotifs, setActionNotifs] = useState([]);

  const push = useCallback((notif) => {
    const id = notif.id || `action_${Date.now()}`;
    setActionNotifs(prev => {
      if (prev.find(n => n.id === id)) return prev;
      return [{ ...notif, id, createdAt: new Date().toISOString() }, ...prev];
    });
    // Auto-dismiss action notifs after 8s
    setTimeout(() => {
      setDismissedIds(prev => {
        const next = [...prev, id];
        localStorage.setItem('aoza_dismissed_notifs', JSON.stringify(next));
        return next;
      });
    }, 8000);
  }, []);

  const dismiss = useCallback((id) => {
    setDismissedIds(prev => {
      const next = [...prev, id];
      localStorage.setItem('aoza_dismissed_notifs', JSON.stringify(next));
      return next;
    });
  }, []);

  const dismissAll = useCallback((ids) => {
    setDismissedIds(prev => {
      const next = [...new Set([...prev, ...ids])];
      localStorage.setItem('aoza_dismissed_notifs', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ dismissedIds, actionNotifs, push, dismiss, dismissAll, computeNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (data) => {
  const ctx = useContext(NotificationContext);
  const computed = useMemo(() => data ? computeNotifications(data) : [], [data]);
  const all = useMemo(() => [...ctx.actionNotifs, ...computed], [ctx.actionNotifs, computed]);
  const visible = useMemo(() => all.filter(n => !ctx.dismissedIds.includes(n.id)), [all, ctx.dismissedIds]);
  return { ...ctx, all, visible, count: visible.length };
};
