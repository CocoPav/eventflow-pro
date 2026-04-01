import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, User, Euro, Ticket, ChevronRight, AlertCircle, Loader } from 'lucide-react';
import Modal from './Modal';
import { useEvent } from '../../context/EventContext';

// Toutes les requêtes passent par le proxy Vite (/helloasso → https://api.helloasso.com)
// pour contourner les restrictions CORS du navigateur.
const HA_BASE = '/helloasso';
const fmt = v => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

async function getToken(clientId, clientSecret) {
  const resp = await fetch(`${HA_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!resp.ok) throw new Error(`Authentification échouée (${resp.status})`);
  const json = await resp.json();
  return json.access_token;
}


// Récupère tous les tickets vendus (paginé)
async function fetchAllItems(token, orgSlug, formType, formSlug) {
  const all = [];
  let pageIndex = 1;
  let totalPages = 1;
  do {
    const resp = await fetch(
      `${HA_BASE}/v5/organizations/${encodeURIComponent(orgSlug)}/forms/${formType}/${encodeURIComponent(formSlug)}/items?pageSize=100&pageIndex=${pageIndex}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!resp.ok) throw new Error(`Erreur billetterie (${resp.status})`);
    const json = await resp.json();
    all.push(...(json.data || []));
    totalPages = json.pagination?.totalPages || 1;
    pageIndex++;
  } while (pageIndex <= totalPages && pageIndex <= 20);
  return all;
}

// Tente de récupérer les tiers (capacités max) — retourne [] si non dispo
async function fetchTiers(token, orgSlug, formType, formSlug) {
  try {
    const resp = await fetch(
      `${HA_BASE}/v5/organizations/${encodeURIComponent(orgSlug)}/forms/${formType}/${encodeURIComponent(formSlug)}/tiers`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!resp.ok) return [];
    const json = await resp.json();
    return json.data || [];
  } catch { return []; }
}

function getOrderLabel(order) {
  return order?.ticketName || order?.items?.[0]?.name || 'Billet';
}

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

function ProgressBar({ sold, max, color }) {
  const pct = max > 0 ? Math.min((sold / max) * 100, 100) : 0;
  const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : color;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${pct}%`,
          background: barColor,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

function ConfigForm({ formState, setFormState, onSave, onCancel }) {
  return (
    <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--bg-hover)', borderRadius: '0 0 14px 14px' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
        Configuration Hello Asso
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {[
          { key: 'clientId', label: 'Client ID', placeholder: 'votre-client-id' },
          { key: 'clientSecret', label: 'Client Secret', placeholder: '••••••••', type: 'password' },
          { key: 'orgSlug', label: 'Slug organisation', placeholder: 'squat-club' },
          { key: 'formSlug', label: 'Slug formulaire', placeholder: 'la-grande-basse-court' },
        ].map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>{label}</label>
            <input
              type={type || 'text'}
              value={formState[key]}
              onChange={e => setFormState(s => ({ ...s, [key]: e.target.value }))}
              placeholder={placeholder}
              style={{
                width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.78rem',
                border: '1px solid var(--border)', borderRadius: 8,
                background: 'var(--bg-card)', color: 'var(--text-main)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Type de formulaire</label>
          <select
            value={formState.formType}
            onChange={e => setFormState(s => ({ ...s, formType: e.target.value }))}
            style={{
              width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.78rem',
              border: '1px solid var(--border)', borderRadius: 8,
              background: 'var(--bg-card)', color: 'var(--text-main)',
              outline: 'none', boxSizing: 'border-box',
            }}
          >
            {['Event', 'CrowdFunding', 'Membership', 'Donation', 'PaymentForm', 'Shop'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '0.35rem 0.875rem', fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--border)', borderRadius: 8, background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          Annuler
        </button>
        <button
          onClick={onSave}
          disabled={!formState.clientId || !formState.clientSecret || !formState.orgSlug || !formState.formSlug}
          style={{ padding: '0.35rem 0.875rem', fontSize: '0.75rem', fontWeight: 700, border: 'none', borderRadius: 8, background: '#49D38A', color: 'white', cursor: 'pointer' }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

export default function HelloAssoWidget() {
  const { data, setData } = useEvent();
  const config = data.event?.helloasso || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [showLastModal, setShowLastModal] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const tokenRef = useRef(null);
  const tokenExpiryRef = useRef(0);
  const isFetchingRef = useRef(false);
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  const isConfigured = !!(config.clientId && config.clientSecret && config.orgSlug && config.formSlug);

  // fetchData est stable (pas de dépendances sur config) → pas de re-création au moindre keystroke
  const fetchData = useCallback(async () => {
    const cfg = configRef.current;
    if (!cfg.clientId || !cfg.clientSecret || !cfg.orgSlug || !cfg.formSlug) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      if (!tokenRef.current || Date.now() > tokenExpiryRef.current) {
        tokenRef.current = await getToken(cfg.clientId, cfg.clientSecret);
        tokenExpiryRef.current = Date.now() + 25 * 60 * 1000;
      }

      const formType = cfg.formType || 'Event';

      const [soldItems, tiers] = await Promise.all([
        fetchAllItems(tokenRef.current, cfg.orgSlug, formType, cfg.formSlug),
        fetchTiers(tokenRef.current, cfg.orgSlug, formType, cfg.formSlug),
      ]);

      // Grouper les tickets vendus par type (tierId)
      const tierMap = {};
      let lastItem = null;
      let totalAmount = 0;

      soldItems.forEach(item => {
        if (item.state !== 'Processed') return;

        // Ticket le plus récent = dernier inscrit
        if (!lastItem || new Date(item.order?.date) > new Date(lastItem.order?.date)) {
          lastItem = item;
        }

        const key = String(item.tierId || item.name || 'default');
        if (!tierMap[key]) {
          tierMap[key] = {
            tierId: item.tierId,
            label: item.name || 'Billet',
            soldCount: 0,
            price: (item.initialAmount || item.amount || 0) / 100,
            maxQuantity: null,
          };
        }
        tierMap[key].soldCount++;
        totalAmount += (item.amount || 0) / 100;
      });

      // Injecter les capacités max depuis les tiers si disponibles
      tiers.forEach(tier => {
        const key = String(tier.id || tier.tierId);
        if (tierMap[key] && tier.maxQuantity != null) {
          tierMap[key].maxQuantity = tier.maxQuantity;
        }
      });

      const enrichedItems = Object.values(tierMap);
      const totalSold = enrichedItems.reduce((s, t) => s + t.soldCount, 0);

      const lastRegistrant = lastItem ? {
        firstName: lastItem.user?.firstName || lastItem.payer?.firstName || '',
        lastName: lastItem.user?.lastName || lastItem.payer?.lastName || '',
        email: lastItem.payer?.email || '',
        registrationDate: lastItem.order?.date || '',
        amount: (lastItem.amount || 0) / 100,
        ticketName: lastItem.name || 'Billet',
      } : null;

      setStats({
        items: enrichedItems,
        totalAmount,
        totalCount: totalSold,
        lastRegistrant,
      });
      setLastRefresh(new Date());

      // Sync total collecté → recettes budget
      const syncedRevenue = {
        id: 'helloasso-revenue',
        label: 'Billetterie Hello Asso',
        amount: totalAmount,
        cat: 'Billetterie',
        source: 'helloasso',
        date: new Date().toISOString().split('T')[0],
        notes: `${totalSold} inscription(s) via Hello Asso`,
      };
      setData(prev => {
        const revenues = prev.poles?.budget?.revenues || [];
        const exists = revenues.some(r => r.id === 'helloasso-revenue');
        return {
          ...prev,
          poles: {
            ...prev.poles,
            budget: {
              ...prev.poles.budget,
              revenues: exists
                ? revenues.map(r => r.id === 'helloasso-revenue' ? syncedRevenue : r)
                : [...revenues, syncedRevenue],
            },
          },
        };
      });
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('429')) {
        setError('Trop de requêtes Hello Asso. Attends quelques minutes avant de réessayer.');
      } else {
        setError(msg);
      }
      tokenRef.current = null; // reset sur toute erreur auth
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []); // stable — lit la config via configRef

  const isConfiguredRef = useRef(isConfigured);
  useEffect(() => { isConfiguredRef.current = isConfigured; }, [isConfigured]);

  // Fetch initial uniquement quand on passe de non-configuré à configuré
  useEffect(() => {
    if (isConfigured) fetchData();
  }, [isConfigured]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh toutes les 5 min
  useEffect(() => {
    const id = setInterval(() => { if (isConfiguredRef.current) fetchData(); }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lastReg = stats?.lastRegistrant;
  const lastLabel = lastReg ? getOrderLabel(lastReg) : '';
  const lastDate = lastReg ? new Date(lastReg.registrationDate || '') : null;

  // Label colors
  const itemColors = ['#6366f1', '#f97316', '#14b8a6', '#8b5cf6', '#ec4899'];

  return (
    <>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem', borderBottom: stats || error || !isConfigured ? '1px solid var(--border)' : 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(73,211,138,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ticket size={16} color="#49D38A" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '-0.01em' }}>Hello Asso</p>
            {lastRefresh && (
              <p style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                Actualisé {timeAgo(lastRefresh)}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            {loading && <Loader size={13} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />}
            {isConfigured && !loading && (
              <button
                onClick={fetchData}
                title="Actualiser"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <RefreshCw size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Not configured state */}
        {!isConfigured && (
          <div style={{ padding: '1.25rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Connecte Hello Asso dans<br />
              <strong style={{ color: 'var(--text-main)' }}>Administration → Paramètres API</strong>
            </p>
          </div>
        )}

        {/* Error state */}
        {isConfigured && error && (
          <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <AlertCircle size={15} color="#ef4444" />
            <p style={{ fontSize: '0.78rem', color: '#ef4444', flex: 1 }}>{error}</p>
            <button onClick={fetchData} style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}>
              Réessayer
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isConfigured && loading && !stats && (
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 80, height: 10, borderRadius: 99, background: 'var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ width: 40, height: 10, borderRadius: 99, background: 'var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
        )}

        {/* Data display */}
        {isConfigured && stats && (
          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

            {/* Ticket types */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {stats.items.map((item, i) => {
                const pct = item.maxQuantity > 0 ? Math.round((item.soldCount / item.maxQuantity) * 100) : 0;
                const color = itemColors[i % itemColors.length];
                const alertColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : color;
                return (
                  <div key={item.id || item.label}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: alertColor, flexShrink: 0 }} />
                      <p style={{ flex: 1, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.label}
                      </p>
                      <p style={{ fontSize: '0.78rem', fontWeight: 800, color: alertColor, flexShrink: 0 }}>
                        {item.soldCount}
                        {item.maxQuantity > 0 && (
                          <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>/{item.maxQuantity}</span>
                        )}
                      </p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', width: 28, textAlign: 'right', flexShrink: 0 }}>
                        {pct}%
                      </p>
                    </div>
                    <ProgressBar sold={item.soldCount} max={item.maxQuantity} color={color} />
                  </div>
                );
              })}
              {stats.items.length === 0 && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Aucun tarif trouvé.</p>
              )}
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.625rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <Euro size={11} color="#22c55e" />
                  <p style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collecté</p>
                </div>
                <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#22c55e', letterSpacing: '-0.03em' }}>{fmt(stats.totalAmount)}</p>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <User size={11} color="#6366f1" />
                  <p style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total inscrits</p>
                </div>
                <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#6366f1', letterSpacing: '-0.03em' }}>{stats.totalCount}</p>
              </div>
            </div>

            {/* Last registrant */}
            {lastReg && (
              <button
                onClick={() => setShowLastModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.625rem 0.75rem', borderRadius: 10,
                  background: 'rgba(73,211,138,0.06)', border: '1px solid rgba(73,211,138,0.18)',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(73,211,138,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(73,211,138,0.06)'}
              >
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(73,211,138,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={14} color="#49D38A" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lastReg.firstName} {lastReg.lastName}
                  </p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {lastLabel} · {timeAgo(lastDate)}
                  </p>
                </div>
                <ChevronRight size={13} color="var(--text-muted)" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Last registrant modal */}
      <Modal isOpen={showLastModal} onClose={() => setShowLastModal(false)} title="Dernier inscrit" maxWidth="420px">
        {lastReg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Avatar + name */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(73,211,138,0.06)', borderRadius: 14, border: '1px solid rgba(73,211,138,0.15)' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(73,211,138,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={28} color="#49D38A" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                  {lastReg.firstName} {lastReg.lastName}
                </p>
                {lastReg.email && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{lastReg.email}</p>
                )}
              </div>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Type de billet', value: lastLabel, color: '#6366f1' },
                {
                  label: "Date d'inscription",
                  value: lastDate && !isNaN(lastDate)
                    ? lastDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—',
                },
                { label: 'Montant', value: lastReg.amount != null ? fmt(lastReg.amount) : '—', color: '#22c55e' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</p>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: color || 'var(--text-main)' }}>{value}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Inscrit {timeAgo(lastDate)} · Données Hello Asso
            </p>
          </div>
        )}
      </Modal>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </>
  );
}
