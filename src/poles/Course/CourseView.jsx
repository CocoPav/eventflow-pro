import React, { useState, useMemo } from 'react';
import { useEvent } from '../../context/EventContext';
import { Plus, Edit2, Trash2, Trophy, Timer, Users, Search, Download, CheckCircle2, XCircle, AlertCircle, Flag } from 'lucide-react';
import Modal from '../../components/shared/Modal';

// ── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { code: 'ESH', label: 'Espoir H',   gender: 'H', color: '#6366f1' },
  { code: 'ESF', label: 'Espoir F',   gender: 'F', color: '#ec4899' },
  { code: 'SEH', label: 'Senior H',   gender: 'H', color: '#3b82f6' },
  { code: 'SEF', label: 'Senior F',   gender: 'F', color: '#f472b6' },
  { code: 'M1H', label: 'Master 1 H', gender: 'H', color: '#0ea5e9' },
  { code: 'M1F', label: 'Master 1 F', gender: 'F', color: '#e879f9' },
  { code: 'M2H', label: 'Master 2 H', gender: 'H', color: '#10b981' },
  { code: 'M2F', label: 'Master 2 F', gender: 'F', color: '#a3e635' },
  { code: 'M3H', label: 'Master 3 H', gender: 'H', color: '#f59e0b' },
  { code: 'M3F', label: 'Master 3 F', gender: 'F', color: '#fb923c' },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.code, c]));

const STATUSES = {
  registered: { label: 'Inscrit',   color: '#6366f1', bg: '#eff6ff', icon: CheckCircle2 },
  finished:   { label: 'Arrivé',    color: '#10b981', bg: '#f0fdf4', icon: CheckCircle2 },
  dns:        { label: 'DNS',       color: '#94a3b8', bg: '#f8fafc', icon: XCircle },
  dnf:        { label: 'Abandon',   color: '#f59e0b', bg: '#fffbeb', icon: AlertCircle },
};

const EMPTY_RUNNER = { firstName: '', lastName: '', gender: 'H', category: 'SEH', club: '', email: '', phone: '', finishTime: '', status: 'registered' };

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeToSeconds(t) {
  if (!t) return Infinity;
  const parts = t.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Infinity;
}

function StatusBadge({ status }) {
  const s = STATUSES[status] || STATUSES.registered;
  return (
    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: s.color, background: s.bg, borderRadius: 99, padding: '3px 9px', border: `1px solid ${s.color}30` }}>
      {s.label}
    </span>
  );
}

function RankBadge({ rank }) {
  const medals = { 1: { bg: '#fef9c3', color: '#ca8a04', icon: '🥇' }, 2: { bg: '#f1f5f9', color: '#475569', icon: '🥈' }, 3: { bg: '#fff7ed', color: '#c2410c', icon: '🥉' } };
  const m = medals[rank];
  if (m) return <span style={{ fontSize: '0.9rem' }}>{m.icon}</span>;
  return <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', minWidth: '20px', textAlign: 'center', display: 'inline-block' }}>{rank}</span>;
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '2.5rem', borderBottom: '1px solid var(--border)' }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '1.25rem 0', background: 'transparent', border: 'none', color: active === tab.id ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: 800, cursor: 'pointer', position: 'relative', fontSize: '0.9375rem' }}>
          <tab.icon size={17} strokeWidth={active === tab.id ? 2.5 : 2} />
          {tab.label}
          {active === tab.id && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, background: 'var(--primary)', borderRadius: '3px 3px 0 0' }} />}
        </button>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CourseView() {
  const { data, addRunner, updateRunner, deleteRunner } = useEvent();
  const runners = data.poles.course?.runners || [];

  const [activeTab, setActiveTab] = useState('inscriptions');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY_RUNNER);
  const [chronoInput, setChronoInput] = useState({ dossard: '', time: '' });
  const [rankCat, setRankCat] = useState('');

  // ── Stats ──
  const finished   = runners.filter(r => r.status === 'finished');
  const dns        = runners.filter(r => r.status === 'dns');
  const dnf        = runners.filter(r => r.status === 'dnf');
  const registered = runners.filter(r => r.status === 'registered');

  const nextDossard = runners.length > 0 ? Math.max(...runners.map(r => r.dossard || 0)) + 1 : 1;

  // ── Filtered runners ──
  const filtered = useMemo(() => runners.filter(r => {
    const s = search.toLowerCase();
    const matchSearch = !s || r.firstName.toLowerCase().includes(s) || r.lastName.toLowerCase().includes(s) || String(r.dossard).includes(s) || (r.club || '').toLowerCase().includes(s);
    const matchCat = !catFilter || r.category === catFilter;
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  }), [runners, search, catFilter, statusFilter]);

  // ── Rankings ──
  const rankings = useMemo(() => {
    const finishedRunners = runners.filter(r => r.status === 'finished' && r.finishTime);
    const sorted = [...finishedRunners].sort((a, b) => timeToSeconds(a.finishTime) - timeToSeconds(b.finishTime));
    return sorted.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [runners]);

  const catRankings = useMemo(() => {
    const byCat = {};
    runners.filter(r => r.status === 'finished' && r.finishTime).forEach(r => {
      if (!byCat[r.category]) byCat[r.category] = [];
      byCat[r.category].push(r);
    });
    Object.keys(byCat).forEach(cat => {
      byCat[cat].sort((a, b) => timeToSeconds(a.finishTime) - timeToSeconds(b.finishTime));
      byCat[cat] = byCat[cat].map((r, i) => ({ ...r, catRank: i + 1 }));
    });
    return byCat;
  }, [runners]);

  // ── Handlers ──
  const openModal = (runner = null) => {
    setForm(runner ? { ...runner } : { ...EMPTY_RUNNER, dossard: nextDossard });
    setModal({ open: true, editing: runner });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, dossard: parseInt(form.dossard) || nextDossard };
    if (modal.editing) {
      updateRunner(modal.editing.id, payload);
    } else {
      addRunner({ ...payload, id: 'r_' + Date.now() });
    }
    setModal({ open: false, editing: null });
  };

  const handleChrono = (e) => {
    e.preventDefault();
    const doss = parseInt(chronoInput.dossard);
    const runner = runners.find(r => r.dossard === doss);
    if (!runner) { alert(`Dossard #${doss} introuvable.`); return; }
    updateRunner(runner.id, { finishTime: chronoInput.time, status: 'finished' });
    setChronoInput({ dossard: '', time: '' });
  };

  const markStatus = (id, status) => updateRunner(id, { status, ...(status !== 'finished' ? { finishTime: '' } : {}) });

  const exportCSV = () => {
    const header = 'Dossard,Prénom,Nom,Genre,Catégorie,Club,Temps,Statut\n';
    const rows = [...rankings].map(r => `${r.dossard},${r.firstName},${r.lastName},${r.gender},${r.category},${r.club || ''},${r.finishTime},${r.status}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'resultats_course.csv'; a.click();
  };

  const tabs = [
    { id: 'inscriptions', label: 'Inscriptions',  icon: Users },
    { id: 'chrono',       label: 'Chrono',         icon: Timer },
    { id: 'classements',  label: 'Classements',    icon: Trophy },
    { id: 'stats',        label: 'Stats',          icon: Flag },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          {activeTab === 'classements' && (
            <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.625rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
              <Download size={15} /> Export CSV
            </button>
          )}
          {activeTab === 'inscriptions' && (
            <button onClick={() => openModal()} className="btn-primary" style={{ background: 'var(--primary)', color: 'white' }}>
              <Plus size={18} /> Inscrire
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Inscrits',  value: runners.length,     color: '#6366f1' },
          { label: 'Arrivés',   value: finished.length,    color: '#10b981' },
          { label: 'DNS',       value: dns.length,         color: '#94a3b8' },
          { label: 'Abandons',  value: dnf.length,         color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.75rem', fontWeight: 900, color: k.color, letterSpacing: '-0.02em' }}>{k.value}</p>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Inscriptions ── */}
      {activeTab === 'inscriptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, prénom, dossard, club…" style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 36px', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', fontSize: '0.875rem' }} />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '0.75rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', fontSize: '0.875rem' }}>
              <option value="">Toutes catégories</option>
              {CATEGORIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.75rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', fontSize: '0.875rem' }}>
              <option value="">Tous statuts</option>
              {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  {['#', 'Coureur', 'Catégorie', 'Club', 'Temps', 'Statut', ''].map(h => (
                    <th key={h} style={{ padding: '0.875rem 1.25rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const cat = CAT_MAP[r.category];
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-muted)' }}>#{r.dossard}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.firstName} {r.lastName}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.gender === 'H' ? '♂' : '♀'} {r.email}</p>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: cat?.color || '#64748b', background: (cat?.color || '#64748b') + '18', borderRadius: 99, padding: '3px 10px' }}>{r.category}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.club || '—'}</td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'monospace', color: r.finishTime ? '#10b981' : 'var(--text-muted)' }}>{r.finishTime || '—'}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}><StatusBadge status={r.status} /></td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          <button onClick={() => openModal(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><Edit2 size={13} /></button>
                          <button onClick={() => deleteRunner(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucun coureur trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Chrono ── */}
      {activeTab === 'chrono' && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2rem', alignItems: 'start' }}>
          {/* Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.25rem' }}>Saisie du temps</h3>
              <form onSubmit={handleChrono} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>N° DOSSARD</label>
                  <input
                    type="number" min="1" required
                    value={chronoInput.dossard}
                    onChange={e => setChronoInput({ ...chronoInput, dossard: e.target.value })}
                    placeholder="Ex: 7"
                    style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', fontSize: '1.25rem', fontWeight: 800, textAlign: 'center' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TEMPS (HH:MM:SS)</label>
                  <input
                    type="text" required
                    value={chronoInput.time}
                    onChange={e => setChronoInput({ ...chronoInput, time: e.target.value })}
                    placeholder="00:23:45"
                    pattern="\d{2}:\d{2}:\d{2}"
                    style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 800, textAlign: 'center' }}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '1rem', background: '#10b981', color: 'white', borderRadius: '14px', fontSize: '0.9rem', fontWeight: 800 }}>
                  ✓ Valider l'arrivée
                </button>
              </form>
            </div>

            {/* Quick status actions */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Marquer DNS / Abandon</h3>
              {runners.filter(r => r.status === 'registered').map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>#{r.dossard} {r.firstName} {r.lastName}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => markStatus(r.id, 'dns')} style={{ padding: '3px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', color: '#94a3b8' }}>DNS</button>
                    <button onClick={() => markStatus(r.id, 'dnf')} style={{ padding: '3px 10px', borderRadius: 8, border: '1px solid #fef3c7', background: '#fffbeb', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', color: '#f59e0b' }}>Abandon</button>
                  </div>
                </div>
              ))}
              {runners.filter(r => r.status === 'registered').length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aucun coureur en attente.</p>}
            </div>
          </div>

          {/* Live arrivals list */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Arrivées en direct ({finished.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[...finished].sort((a, b) => timeToSeconds(a.finishTime) - timeToSeconds(b.finishTime)).map((r, i) => {
                const cat = CAT_MAP[r.category];
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: i === 0 ? '#fefce8' : '#f8f9fa', borderRadius: '12px', border: i === 0 ? '1px solid #fde68a' : '1px solid transparent' }}>
                    <RankBadge rank={i + 1} />
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', flexShrink: 0 }}>
                      {r.dossard}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{r.firstName} {r.lastName}</span>
                      <span style={{ marginLeft: '8px', fontSize: '0.65rem', fontWeight: 800, color: cat?.color, background: cat?.color + '18', borderRadius: 99, padding: '1px 7px' }}>{r.category}</span>
                    </div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', color: '#10b981' }}>{r.finishTime}</span>
                  </div>
                );
              })}
              {finished.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>En attente des premières arrivées…</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Classements ── */}
      {activeTab === 'classements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* General ranking */}
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem' }}>🏆 Classement Général</h3>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    {['Place', 'Dossard', 'Coureur', 'Catégorie', 'Club', 'Temps', 'Place Cat.'].map(h => (
                      <th key={h} style={{ padding: '0.875rem 1.25rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((r) => {
                    const cat = CAT_MAP[r.category];
                    const catRank = (catRankings[r.category] || []).findIndex(cr => cr.id === r.id) + 1;
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', background: r.rank <= 3 ? r.rank === 1 ? '#fefce8' : r.rank === 2 ? '#f8fafc' : '#fff7ed' : 'white' }}>
                        <td style={{ padding: '0.875rem 1.25rem' }}><RankBadge rank={r.rank} /></td>
                        <td style={{ padding: '0.875rem 1.25rem', fontWeight: 800, color: 'var(--text-muted)' }}>#{r.dossard}</td>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <p style={{ fontWeight: 700 }}>{r.firstName} {r.lastName}</p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.gender === 'H' ? '♂' : '♀'}</p>
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: cat?.color, background: cat?.color + '18', borderRadius: 99, padding: '3px 10px' }}>{r.category}</span>
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.club || '—'}</td>
                        <td style={{ padding: '0.875rem 1.25rem', fontFamily: 'monospace', fontWeight: 900, color: '#10b981', fontSize: '1rem' }}>{r.finishTime}</td>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: catRank <= 3 ? '#f59e0b' : 'var(--text-muted)' }}>{catRank === 1 ? '🥇' : catRank === 2 ? '🥈' : catRank === 3 ? '🥉' : `${catRank}e`}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {rankings.length === 0 && <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Aucun temps enregistré.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cat selector */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Classement par Catégorie</h3>
              <select value={rankCat} onChange={e => setRankCat(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}>
                <option value="">Toutes</option>
                {Object.keys(catRankings).map(c => <option key={c} value={c}>{CAT_MAP[c]?.label || c}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {Object.entries(catRankings).filter(([cat]) => !rankCat || cat === rankCat).map(([cat, cRunners]) => {
                const catInfo = CAT_MAP[cat];
                return (
                  <div key={cat} className="card" style={{ padding: '1.5rem', borderTop: `3px solid ${catInfo?.color || '#64748b'}` }}>
                    <h4 style={{ fontWeight: 800, fontSize: '0.875rem', color: catInfo?.color, marginBottom: '1rem' }}>{catInfo?.label || cat} — {cRunners.length} arrivé{cRunners.length > 1 ? 's' : ''}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {cRunners.map((r, i) => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: i < cRunners.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <RankBadge rank={i + 1} />
                          <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 700 }}>#{r.dossard} {r.firstName} {r.lastName}</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', color: '#10b981' }}>{r.finishTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {Object.keys(catRankings).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucun résultat enregistré.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      {activeTab === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* By category */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.5rem' }}>Inscrits par catégorie</h3>
            {CATEGORIES.map(cat => {
              const count = runners.filter(r => r.category === cat.code).length;
              if (count === 0) return null;
              const pct = Math.round((count / runners.length) * 100);
              return (
                <div key={cat.code} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{cat.label}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: cat.color }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '7px', background: '#f1f3f5', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: cat.color, borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gender split */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.5rem' }}>Répartition genre</h3>
            {['H', 'F'].map(g => {
              const count = runners.filter(r => r.gender === g).length;
              const pct = runners.length ? Math.round((count / runners.length) * 100) : 0;
              const color = g === 'H' ? '#3b82f6' : '#ec4899';
              return (
                <div key={g} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{g === 'H' ? '♂ Hommes' : '♀ Femmes'}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '12px', background: '#f1f3f5', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <h4 style={{ fontWeight: 800, fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Taux de completion</h4>
              {[
                { label: 'Arrivés', count: finished.length, color: '#10b981' },
                { label: 'DNS', count: dns.length, color: '#94a3b8' },
                { label: 'Abandon', count: dnf.length, color: '#f59e0b' },
                { label: 'En attente', count: registered.length, color: '#6366f1' },
              ].map(s => {
                const pct = runners.length ? Math.round((s.count / runners.length) * 100) : 0;
                return (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', flex: 1 }}>{s.label}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: s.color }}>{s.count}</span>
                    <div style={{ width: '80px', height: '6px', background: '#f1f3f5', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top times */}
          {rankings.length > 0 && (
            <div className="card" style={{ padding: '2rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.5rem' }}>Podium Général</h3>
              {rankings.slice(0, 3).map((r, i) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', marginBottom: '8px', borderRadius: '14px', background: i === 0 ? '#fefce8' : i === 1 ? '#f8fafc' : '#fff7ed', border: `1px solid ${i === 0 ? '#fde68a' : i === 1 ? '#e2e8f0' : '#fed7aa'}` }}>
                  <span style={{ fontSize: '1.5rem' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>{r.firstName} {r.lastName}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>#{r.dossard} · {CAT_MAP[r.category]?.label}</p>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.1rem', color: '#10b981' }}>{r.finishTime}</span>
                </div>
              ))}
            </div>
          )}

          {/* Club ranking */}
          {(() => {
            const byClub = {};
            runners.forEach(r => { const c = r.club || 'Sans club'; byClub[c] = (byClub[c] || 0) + 1; });
            const sorted = Object.entries(byClub).sort((a, b) => b[1] - a[1]);
            return (
              <div className="card" style={{ padding: '2rem' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.5rem' }}>Clubs représentés</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sorted.map(([club, count], i) => (
                    <div key={club} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', minWidth: '16px' }}>{i + 1}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: club === 'Sans club' ? 400 : 700, color: club === 'Sans club' ? 'var(--text-muted)' : 'var(--text-main)' }}>{club}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Modal inscription ── */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, editing: null })} title={modal.editing ? 'Modifier le coureur' : 'Inscrire un coureur'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DOSSARD</label>
              <input type="number" min="1" required value={form.dossard} onChange={e => setForm({ ...form, dossard: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', textAlign: 'center', fontWeight: 800 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>PRÉNOM</label>
              <input required type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NOM</label>
              <input required type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>GENRE</label>
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}>
                <option value="H">♂ Homme</option>
                <option value="F">♀ Femme</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>CATÉGORIE</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}>
                {CATEGORIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>STATUT</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}>
                {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>CLUB</label>
              <input type="text" value={form.club} onChange={e => setForm({ ...form, club: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TEMPS (si déjà connu)</label>
              <input type="text" value={form.finishTime} onChange={e => setForm({ ...form, finishTime: e.target.value })} placeholder="00:23:45" style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', fontFamily: 'monospace' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>EMAIL</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TÉLÉPHONE</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: '#f8f9fa', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }} />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '1rem', background: 'var(--text-main)', color: 'white', borderRadius: '14px' }}>
            {modal.editing ? 'Enregistrer' : 'Inscrire le coureur'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
