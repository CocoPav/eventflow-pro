import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEvent } from '../../context/EventContext';
import {
  CalendarDays, MapPin, ArrowRight, AlertTriangle,
  CheckCircle2, Check, RefreshCw, User, Ticket, Loader,
} from 'lucide-react';

const fmt = v => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
const fmtPct = v => `${Math.round(v * 100)}%`;
const fmtK = v => {
  const abs = Math.abs(v);
  if (abs >= 1000) return `${(v / 1000).toFixed(1).replace('.', ',')}K`;
  return String(Math.round(v));
};

const HA_BASE = '/helloasso';
const PALETTE     = ['#6B63CC', '#F86B1A', '#C040C4', '#FF8200', '#EF4444', '#FCD34D', '#8B5CF6'];
const TIER_COLORS = PALETTE;
const EXP_COLORS  = ['#F86B1A', '#C040C4', '#FF8200', '#6B63CC', '#EF4444', '#8B5CF6', '#F86B1A'];

function getTierMax(label = '') {
  const l = label.toLowerCase();
  if (l.includes('couri') || l.includes('coureu') || l.includes('run')) return 300;
  if (l.includes('festoy') || l.includes('festiv') || l.includes('fêtard')) return 700;
  return null;
}
const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// ── HelloAsso ─────────────────────────────────────────────────────────────────
async function haGetToken(id, secret) {
  const r = await fetch(`${HA_BASE}/oauth2/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }),
  });
  if (!r.ok) throw new Error(`Auth HA (${r.status})`);
  return (await r.json()).access_token;
}
async function haFetchItems(token, org, type, slug) {
  const all = []; let page = 1, total = 1;
  do {
    const r = await fetch(`${HA_BASE}/v5/organizations/${encodeURIComponent(org)}/forms/${type}/${encodeURIComponent(slug)}/items?pageSize=100&pageIndex=${page}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`HA items (${r.status})`);
    const j = await r.json(); all.push(...(j.data || [])); total = j.pagination?.totalPages || 1; page++;
  } while (page <= total && page <= 20);
  return all;
}
function timeAgo(date) {
  if (!date) return '';
  const m = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (m < 2) return "à l'instant"; if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60); if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ArcProgress({ pct, size = 88, stroke = 10, color = '#6366f1', track = 'rgba(99,102,241,0.1)' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct, 0.9999) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
    </svg>
  );
}

// Legend item — matches image style: dot · LABEL / big value + green badge
function StatRow({ color, label, value, badge, badgeColor = '#22c55e' }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <p style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
        <p style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--text-main)' }}>{value}</p>
        {badge && (
          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: badgeColor + '1a', color: badgeColor, flexShrink: 0 }}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

// Stacked pill bars (image style)
function StackedBars({ bars, H = 100 }) {
  // bars: [{segments: [{color, value}]}]  all values relative (0-1 or absolute)
  const maxVal = Math.max(...bars.map(b => b.reduce((s, seg) => s + seg.v, 0)), 1);
  const N = bars.length, GAP = 6;
  const W = Math.max(N * 20 + (N - 1) * GAP, 60);
  const bW = Math.floor((W - (N - 1) * GAP) / N);
  const rx = Math.round(bW / 2);

  return (
    <svg width={W} height={H} style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        {bars.map((_, i) => (
          <clipPath key={i} id={`sb${i}`}>
            <rect x={i * (bW + GAP)} y={0} width={bW} height={H} rx={rx} />
          </clipPath>
        ))}
      </defs>
      {bars.map((segs, i) => {
        const total = segs.reduce((s, seg) => s + seg.v, 0);
        const barH = (total / maxVal) * (H - 4);
        const x = i * (bW + GAP);
        let cursor = H;
        return (
          <g key={i}>
            <rect x={x} y={0} width={bW} height={H} rx={rx} fill="rgba(0,0,0,0.05)" />
            <g clipPath={`url(#sb${i})`}>
              {[...segs].reverse().map((seg, si) => {
                const segH = (seg.v / total) * barH;
                cursor -= segH;
                return <rect key={si} x={x} y={cursor} width={bW} height={segH} fill={seg.c} />;
              })}
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const CARD = { background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '1.375rem' };
const LABEL_S = { fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.11em' };

function CardBtn({ onClick, children, style = {} }) {
  return (
    <button onClick={onClick} style={{ ...CARD, cursor: 'pointer', textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', transition: 'border-color 0.15s, box-shadow 0.15s', ...style }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.07)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
      {children}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardView({ onViewChange }) {
  const { data, setData } = useEvent();
  const event = data.event || {};
  const haConfig = data.event?.helloasso || {};
  const isHaConfigured = !!(haConfig.clientId && haConfig.clientSecret && haConfig.orgSlug && haConfig.formSlug);

  const [haLoading, setHaLoading] = useState(false);
  const [haError, setHaError] = useState(null);
  const [haStats, setHaStats] = useState(null);
  const [haRefreshed, setHaRefreshed] = useState(null);
  const tokenRef = useRef(null); const tokenExpiryRef = useRef(0);
  const fetchingRef = useRef(false); const configRef = useRef(haConfig);
  useEffect(() => { configRef.current = haConfig; }, [haConfig]);

  const fetchHA = useCallback(async () => {
    const cfg = configRef.current;
    if (!cfg.clientId || !cfg.clientSecret || !cfg.orgSlug || !cfg.formSlug) return;
    if (fetchingRef.current) return;
    fetchingRef.current = true; setHaLoading(true); setHaError(null);
    try {
      if (!tokenRef.current || Date.now() > tokenExpiryRef.current) {
        tokenRef.current = await haGetToken(cfg.clientId, cfg.clientSecret);
        tokenExpiryRef.current = Date.now() + 25 * 60 * 1000;
      }
      const items = await haFetchItems(tokenRef.current, cfg.orgSlug, cfg.formType || 'Event', cfg.formSlug);
      const tierMap = {}; let lastItem = null, totalAmount = 0;
      items.forEach(item => {
        if (item.state !== 'Processed') return;
        if (!lastItem || new Date(item.order?.date) > new Date(lastItem.order?.date)) lastItem = item;
        const key = String(item.tierId || item.name || 'default');
        if (!tierMap[key]) tierMap[key] = { label: item.name || 'Billet', soldCount: 0 };
        tierMap[key].soldCount++; totalAmount += (item.amount || 0) / 100;
      });
      const tiers = Object.values(tierMap);
      const totalSold = tiers.reduce((s, t) => s + t.soldCount, 0);
      const lastRegistrant = lastItem ? {
        firstName: lastItem.user?.firstName || lastItem.payer?.firstName || '',
        lastName: lastItem.user?.lastName || lastItem.payer?.lastName || '',
        ticketName: lastItem.name || 'Billet', date: lastItem.order?.date || '',
        amount: (lastItem.amount || 0) / 100,
      } : null;
      setHaStats({ tiers, totalAmount, totalSold, lastRegistrant }); setHaRefreshed(new Date());
      const syncRev = { id: 'helloasso-revenue', label: 'Billetterie Hello Asso', amount: totalAmount, cat: 'Billetterie', source: 'helloasso', date: new Date().toISOString().split('T')[0], notes: `${totalSold} inscription(s)` };
      setData(prev => {
        const revs = prev.poles?.budget?.revenues || [];
        const ex = revs.some(r => r.id === 'helloasso-revenue');
        return { ...prev, poles: { ...prev.poles, budget: { ...prev.poles.budget, revenues: ex ? revs.map(r => r.id === 'helloasso-revenue' ? syncRev : r) : [...revs, syncRev] } } };
      });
    } catch (err) {
      setHaError(err.message?.includes('429') ? 'Trop de requêtes.' : err.message); tokenRef.current = null;
    } finally { setHaLoading(false); fetchingRef.current = false; }
  }, [setData]);

  const isHaRef = useRef(isHaConfigured);
  useEffect(() => { isHaRef.current = isHaConfigured; }, [isHaConfigured]);
  useEffect(() => { if (isHaConfigured) fetchHA(); }, [isHaConfigured]); // eslint-disable-line
  useEffect(() => { const id = setInterval(() => { if (isHaRef.current) fetchHA(); }, 5 * 60 * 1000); return () => clearInterval(id); }, []); // eslint-disable-line

  // ── Data ──────────────────────────────────────────────────────────────────
  const firstName = (data.user?.name || 'Corentin').split(' ')[0];

  const revenues = data.poles?.budget?.revenues || [];
  const expenses = data.poles?.budget?.expenses || [];
  const totalRev = revenues.reduce((s, r) => s + r.amount, 0);
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalRev - totalExp;

  const volunteers = data.poles?.volunteers?.list || [];
  const confirmedVol = volunteers.filter(v => v.status === 'confirmed').length;
  const pendingVol = volunteers.filter(v => !v.status || v.status === 'pending').length;
  const declinedVol = volunteers.filter(v => v.status === 'declined').length;
  const benPct = volunteers.length > 0 ? confirmedVol / volunteers.length : 0;

  const comTasks = data.poles?.communication?.tasks || [];
  const doneCom = comTasks.filter(t => t.status === 'done').length;
  const pendingCom = comTasks.length - doneCom;
  const myName = (data.user?.name || '').split(' ')[0];
  const myTasks = comTasks.filter(t => t.assignee === myName && t.status !== 'done').slice(0, 5);

  const planZones = data.poles?.plan?.zones || [];
  const planParcours = data.poles?.plan?.parcours || [];
  const planCount = planZones.length + planParcours.length;

  const materials = data.poles?.logistics?.materials || [];
  const pendingMat = materials.filter(m => ['to_ask', 'asking', 'to_buy', 'to_create'].includes(m.status)).length;
  const artists = data.poles?.programming?.artists || [];
  const confirmedArtists = artists.filter(a => a.status === 'confirmed').length;

  const meetings = data.poles?.meetings?.entries || [];
  const today = new Date().toISOString().slice(0, 10);
  const nextMeeting = [...meetings].filter(m => m.date >= today && m.status !== 'done').sort((a, b) => a.date.localeCompare(b.date))[0]
    || [...meetings].sort((a, b) => b.date.localeCompare(a.date))[0];
  const daysUntilMeeting = nextMeeting?.date ? Math.ceil((new Date(nextMeeting.date) - new Date()) / 86400000) : null;

  const daysLeft = event.date ? Math.ceil((new Date(event.date) - new Date()) / 86400000) : null;

  const alerts = [
    balance < 0 && { text: 'Solde budget négatif', color: '#ef4444', view: 'budget' },
    pendingVol > 0 && { text: `${pendingVol} bénévole(s) à confirmer`, color: '#f59e0b', view: 'volunteers' },
    pendingMat > 0 && { text: `${pendingMat} matériel(s) à acquérir`, color: '#f97316', view: 'logistics' },
    confirmedArtists < artists.length && artists.length > 0 && { text: `${artists.length - confirmedArtists} artiste(s) à confirmer`, color: '#8b5cf6', view: 'programming' },
    pendingCom > 0 && { text: `${pendingCom} tâche(s) com en cours`, color: '#ec4899', view: 'communication' },
  ].filter(Boolean);

  const cdGrad = daysLeft !== null && daysLeft < 30
    ? 'linear-gradient(160deg,#EF4444 0%,#F97316 100%)'
    : 'linear-gradient(160deg,#6B63CC 0%,#C040C4 30%,#EF2525 58%,#F86B1A 82%,#FF8200 100%)';

  // Budget bars data — grouped by category
  const catMap = {};
  revenues.forEach(r => { const k = r.cat || 'Autres'; catMap[k] = catMap[k] || { rev: 0, exp: 0 }; catMap[k].rev += r.amount; });
  expenses.forEach(e => { const k = e.cat || 'Autres'; catMap[k] = catMap[k] || { rev: 0, exp: 0 }; catMap[k].exp += e.amount; });
  const hasBudgetData = Object.keys(catMap).length > 0;

  const BUDGET_FAKE = [
    [{ v: 40, c: '#6B63CC' }, { v: 20, c: '#F86B1A' }],
    [{ v: 0,  c: '#6B63CC' }, { v: 55, c: '#C040C4' }],
    [{ v: 60, c: '#6B63CC' }, { v: 10, c: '#F86B1A' }],
    [{ v: 0,  c: '#6B63CC' }, { v: 78, c: '#C040C4' }],
    [{ v: 20, c: '#6B63CC' }, { v: 35, c: '#FF8200' }],
    [{ v: 0,  c: '#6B63CC' }, { v: 44, c: '#F86B1A' }],
    [{ v: 30, c: '#6B63CC' }, { v: 25, c: '#C040C4' }],
  ];

  const budgetBarsData = hasBudgetData
    ? Object.entries(catMap).slice(0, 7).map(([, v], i) => [
        { v: v.rev, c: '#6B63CC' },
        { v: v.exp, c: EXP_COLORS[i % EXP_COLORS.length] },
      ].filter(s => s.v > 0))
    : BUDGET_FAKE;

  // Volunteer bars — 1 bar per pole (inspiredPoles), shows volunteer interest per pole
  const VOL_POLE_NAMES = ['Scène', 'Buvette', 'Restauration', 'Sécurité', 'Accueil', 'Communication', 'Logistique'];
  const volBarsData = VOL_POLE_NAMES.map((pole, i) => {
    const count = volunteers.filter(v => (v.inspiredPoles || []).includes(pole)).length;
    return [{ v: count || 0.5, c: PALETTE[i % PALETTE.length] }];
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem', padding: '1.75rem 2rem', boxSizing: 'border-box', minHeight: '100%' }}>

      {/* ── Greeting — full width ─────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', lineHeight: 1 }}>
          <p style={{ fontFamily: "'Caprasimo', cursive", fontSize: '3.25rem', letterSpacing: '-0.01em', color: 'var(--text-muted)', lineHeight: 1 }}>Bienvenu,</p>
          <p style={{ fontFamily: "'Caprasimo', cursive", fontSize: '3.25rem', letterSpacing: '-0.01em', color: 'var(--text-main)', lineHeight: 1 }}>{firstName}.</p>
        </div>
        {event.date && (
          <div style={{ display: 'flex', gap: '0.625rem', marginTop: 8, alignItems: 'center' }}>
            {event.date && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--text-muted)' }}><CalendarDays size={11} />{new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
            {event.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--text-muted)' }}><MapPin size={11} />{event.location}</span>}
          </div>
        )}
      </div>

      {/* ── Two-column body ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1.125rem', alignItems: 'flex-start', flex: 1 }}>

        {/* ══ LEFT ══════════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

          {/* Budget · Bénévoles — 2 equal columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'stretch' }}>

            {/* Budget */}
            <CardBtn onClick={() => onViewChange('budget')} style={{ gap: '0.875rem' }}>
              <p style={{ ...LABEL_S }}>Budget</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 1, color: balance >= 0 ? '#6B63CC' : '#ef4444' }}>
                {fmtK(balance)} €
              </p>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flex: 1 }}>
                <StackedBars bars={budgetBarsData} H={90} />
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1, paddingBottom: 4, gap: '0.75rem' }}>
                  <StatRow
                    color="#6B63CC" label="Recettes"
                    value={fmtK(totalRev) + ' €'}
                    badge={totalRev > 0 ? `+${fmtPct(totalRev / Math.max(totalRev + totalExp, 1))}` : '—'}
                    badgeColor="#6B63CC"
                  />
                  <StatRow
                    color="#F86B1A" label="Dépenses"
                    value={fmtK(totalExp) + ' €'}
                    badge={totalExp > 0 ? `-${fmtPct(totalExp / Math.max(totalRev + totalExp, 1))}` : '—'}
                    badgeColor="#F86B1A"
                  />
                  <StatRow
                    color={balance >= 0 ? '#C040C4' : '#ef4444'} label="Solde"
                    value={(balance >= 0 ? '+' : '') + fmtK(balance) + ' €'}
                    badge={totalRev > 0 ? `${Math.round((balance / totalRev) * 100)}%` : '—'}
                    badgeColor={balance >= 0 ? '#C040C4' : '#ef4444'}
                  />
                </div>
              </div>
            </CardBtn>

            {/* Bénévoles */}
            <CardBtn onClick={() => onViewChange('volunteers')} style={{ gap: '0.875rem' }}>
              <p style={{ ...LABEL_S }}>Bénévoles</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 1, color: '#6B63CC' }}>
                {confirmedVol}
              </p>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                  <StackedBars bars={volBarsData} H={90} />
                  <p style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>par pôle</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1, paddingBottom: 4, gap: '0.75rem' }}>
                  <StatRow
                    color="#6B63CC" label="Confirmés"
                    value={confirmedVol}
                    badge={volunteers.length > 0 ? `+${fmtPct(benPct)}` : '—'}
                    badgeColor="#6B63CC"
                  />
                  <StatRow
                    color="#FCD34D" label="En attente"
                    value={pendingVol}
                    badge={pendingVol > 0 ? `${pendingVol} restant` : 'OK'}
                    badgeColor="#F86B1A"
                  />
                  <StatRow
                    color="#C040C4" label="Total inscrits"
                    value={volunteers.length}
                    badge={declinedVol > 0 ? `${declinedVol} refus` : undefined}
                    badgeColor="#C040C4"
                  />
                </div>
              </div>
            </CardBtn>
          </div>

          {/* ── Inscrits (HelloAsso) ──────────────────────────────────────── */}
          <div style={{ ...CARD }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(107,99,204,0.12)', border: '1px solid rgba(107,99,204,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ticket size={13} color="#6B63CC" strokeWidth={2.5} />
                </div>
                <div>
                  <p style={{ ...LABEL_S }}>Inscrits · Hello Asso</p>
                  {haRefreshed && <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 1 }}>{timeAgo(haRefreshed)}</p>}
                </div>
              </div>
              {isHaConfigured && (
                <button onClick={fetchHA} disabled={haLoading}
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 9px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  {haLoading ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={12} />}
                </button>
              )}
            </div>

            {!isHaConfigured ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Configure Hello Asso dans <strong style={{ color: 'var(--text-main)' }}>Paramètres → API</strong>
              </p>
            ) : haError ? (
              <p style={{ fontSize: '0.75rem', color: '#ef4444' }}>{haError}</p>
            ) : haLoading && !haStats ? (
              <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
                <div style={{ height: 48, width: 72, borderRadius: 10, background: 'var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1, 2].map(i => <div key={i} style={{ height: 8, borderRadius: 99, background: 'var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
                </div>
              </div>
            ) : haStats ? (
              <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
                {/* Big number + amount */}
                <div style={{ flexShrink: 0 }}>
                  <p style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, color: '#6B63CC' }}>{haStats.totalSold}</p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>inscrits</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F86B1A', marginTop: 6 }}>{fmt(haStats.totalAmount)}</p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>collectés</p>
                </div>

                {/* Tier bars */}
                {haStats.tiers.length > 0 && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {haStats.tiers.map((tier, i) => {
                      const max = getTierMax(tier.label);
                      const pctOfTotal = haStats.totalSold > 0 ? tier.soldCount / haStats.totalSold : 0;
                      const pctOfMax = max ? Math.min(tier.soldCount / max, 1) : pctOfTotal;
                      const color = TIER_COLORS[i % TIER_COLORS.length];
                      return (
                        <div key={tier.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
                              <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>{tier.label}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              {max && <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: color + '18', color }}>{tier.soldCount} / {max}</span>}
                              {!max && <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: color + '18', color }}>{fmtPct(pctOfTotal)}</span>}
                              <p style={{ fontSize: '0.9rem', fontWeight: 900, color, width: 24, textAlign: 'right' }}>{tier.soldCount}</p>
                          </div>
                        </div>
                        <div style={{ height: 5, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pctOfMax * 100}%`, borderRadius: 99, background: color, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Dernier inscrit */}
              {haStats.lastRegistrant && (
                <div style={{ flexShrink: 0, padding: '0.875rem 1rem', borderRadius: 12, background: 'rgba(107,99,204,0.05)', border: '1px solid rgba(107,99,204,0.15)', minWidth: 155 }}>
                  <p style={{ fontSize: '0.58rem', fontWeight: 700, color: '#6B63CC', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Dernier inscrit</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(107,99,204,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={14} color="#6B63CC" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{haStats.lastRegistrant.firstName} {haStats.lastRegistrant.lastName}</p>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{haStats.lastRegistrant.ticketName}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.88rem', fontWeight: 900, color: '#F86B1A' }}>{fmt(haStats.lastRegistrant.amount)}</p>
                    <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{timeAgo(haStats.lastRegistrant.date)}</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* ── Bottom row: Plan · Réunion ───────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

          {/* Plan du site */}
          <CardBtn onClick={() => onViewChange('plan')} style={{ flexDirection: 'row', alignItems: 'center', gap: '1.5rem', padding: '1.25rem 1.375rem' }}>
            <div style={{ flexShrink: 0 }}>
              <p style={{ ...LABEL_S, marginBottom: 5 }}>Plan du site</p>
              <p style={{ fontSize: '2.75rem', fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 1, color: '#6B63CC' }}>{planCount}</p>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>éléments</p>
            </div>
            <div style={{ display: 'flex', gap: '0.875rem', flex: 1 }}>
              <div style={{ padding: '0.75rem 0.875rem', borderRadius: 10, background: 'rgba(107,99,204,0.06)', border: '1px solid rgba(107,99,204,0.1)', flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#6B63CC', lineHeight: 1 }}>{planZones.length}</p>
                <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 3, fontWeight: 600 }}>Zones</p>
              </div>
              <div style={{ padding: '0.75rem 0.875rem', borderRadius: 10, background: 'rgba(248,107,26,0.06)', border: '1px solid rgba(248,107,26,0.1)', flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#F86B1A', lineHeight: 1 }}>{planParcours.length}</p>
                <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 3, fontWeight: 600 }}>Parcours</p>
              </div>
            </div>
            <ArrowRight size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          </CardBtn>

          {/* Prochaine réunion */}
          <CardBtn onClick={() => onViewChange('meetings')} style={{ gap: '0.625rem', padding: '1.25rem 1.375rem' }}>
            <p style={{ ...LABEL_S }}>Prochaine réunion</p>
            {nextMeeting ? (
              <>
                <p style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.25 }}>{nextMeeting.title}</p>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(107,99,204,0.08)', color: '#6B63CC' }}>
                    {new Date(nextMeeting.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  {daysUntilMeeting !== null && daysUntilMeeting >= 0 && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: (daysUntilMeeting <= 3 ? '#ef4444' : daysUntilMeeting <= 7 ? '#f59e0b' : '#22c55e') + '18', color: daysUntilMeeting <= 3 ? '#ef4444' : daysUntilMeeting <= 7 ? '#f59e0b' : '#22c55e' }}>
                      {daysUntilMeeting === 0 ? "Aujourd'hui !" : `dans ${daysUntilMeeting}j`}
                    </span>
                  )}
                </div>
                {nextMeeting.location && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{nextMeeting.location}</p>}
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 'auto' }}>{meetings.length} réunion{meetings.length !== 1 ? 's' : ''} au total</p>
              </>
            ) : (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune réunion prévue</p>
            )}
          </CardBtn>
        </div>
      </div>

        {/* ══ RIGHT sidebar ══════════════════════════════════════════════════ */}
        <div style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* J-X Countdown — top of sidebar, aligned with budget/bénévoles row */}
          {daysLeft !== null ? (
            <div style={{
              borderRadius: 16, position: 'relative', overflow: 'hidden',
              background: cdGrad, color: 'white',
              padding: '1.625rem 1.25rem', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4, textAlign: 'center',
            }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: NOISE, backgroundSize: '256px', opacity: 0.09, mixBlendMode: 'overlay', pointerEvents: 'none' }} />
              <p style={{ position: 'relative', zIndex: 1, fontSize: '0.58rem', fontWeight: 700, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Compte à rebours</p>
              <p style={{ position: 'relative', zIndex: 1, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '4rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, textShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
                J-{daysLeft}
              </p>
              <p style={{ position: 'relative', zIndex: 1, fontSize: '0.78rem', opacity: 0.82, marginTop: 4 }}>Avant l'événement</p>
              {event.date && <p style={{ position: 'relative', zIndex: 1, fontSize: '0.62rem', opacity: 0.55 }}>{new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>}
            </div>
          ) : (
            <div style={{ ...CARD, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.625rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date non définie</p>
            </div>
          )}

          {/* Mes tâches */}
          <div style={{ ...CARD }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <p style={{ ...LABEL_S }}>Mes tâches</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {myTasks.length > 0 && (
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, background: '#6B63CC', color: 'white', borderRadius: 99, padding: '1px 6px', minWidth: 16, textAlign: 'center' }}>{myTasks.length}</span>
                )}
                <button onClick={() => onViewChange('tasks')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B63CC', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                  Tout <ArrowRight size={10} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {myTasks.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.375rem 0' }}>
                  <Check size={13} color="#22c55e" />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tout est à jour !</p>
                </div>
              ) : myTasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.625rem', borderRadius: 9, background: 'var(--bg-hover)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#F86B1A' : '#94a3b8' }} />
                  <p style={{ fontSize: '0.775rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Alertes */}
          <div style={{ ...CARD }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <p style={{ ...LABEL_S }}>Alertes</p>
              {alerts.length > 0 && <span style={{ fontSize: '0.6rem', fontWeight: 700, background: '#ef4444', color: 'white', borderRadius: 99, padding: '1px 6px' }}>{alerts.length}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {alerts.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.375rem 0' }}>
                  <CheckCircle2 size={13} color="#22c55e" />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aucune alerte</p>
                </div>
              ) : alerts.map((a, i) => (
                <button key={i} onClick={() => onViewChange(a.view)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.625rem', borderRadius: 9, background: a.color + '10', border: `1px solid ${a.color}22`, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = a.color + '1e'}
                  onMouseLeave={e => e.currentTarget.style.background = a.color + '10'}>
                  <AlertTriangle size={11} color={a.color} style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-main)', flex: 1, lineHeight: 1.3 }}>{a.text}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caprasimo&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}
