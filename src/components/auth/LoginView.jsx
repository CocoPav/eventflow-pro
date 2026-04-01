import React, { useState, useEffect, useRef } from 'react';
import { useAuth, USERS } from '../../context/AuthContext';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

/*
  Séquence complète
  ─────────────────
  splash       : plein écran, logo+AOZA centré
  collapsing   : clip-path → forme de carte gauche
  login        : overlay fade, formulaire révélé
  expanding    : carte gauche s'expand plein écran (login réussi)
  → commitLogin() → WelcomeScreen prend le relai
*/

const INPUT_STYLE = (err) => ({
  width: '100%', padding: '0.875rem 1rem', borderRadius: 12,
  background: '#f8f9fa', border: `1.5px solid ${err ? '#fecaca' : '#e9ecef'}`,
  color: '#1a1a1b', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.15s',
});

function Grain({ id = 'grain-login' }) {
  return (
    <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.22 }}>
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export default function LoginView() {
  const { validateLogin, commitLogin } = useAuth();
  const [phase, setPhase]               = useState('splash');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPwd, setShowPwd]           = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [overlayMounted, setOverlayMounted] = useState(true);
  // Expand overlay: only mounts on login success
  const [expandMounted, setExpandMounted] = useState(false);
  const [expandClip, setExpandClip]       = useState(false);
  const pendingUser = useRef(null);

  /* ── Intro sequence ── */
  useEffect(() => {
    const t0 = setTimeout(() => setContentVisible(true), 80);
    const t1 = setTimeout(() => setPhase('collapsing'), 1800);
    const t2 = setTimeout(() => setPhase('login'), 2650);
    const t3 = setTimeout(() => setOverlayMounted(false), 3050);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 350));
    const user = validateLogin(email, password);
    if (!user) { setError('Email ou mot de passe incorrect.'); setLoading(false); return; }
    // Valid → trigger expand animation, then commit
    pendingUser.current = user;
    setLoading(false);
    // Mount overlay at card position, then expand next frame
    setExpandMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setExpandClip(true));
    });
    setTimeout(() => commitLogin(user), 680);
  };

  const quickLogin = (u) => { setEmail(u.email); setPassword(u.password); };
  const organizers = USERS.filter(u => u.role === 'organizer');
  const volunteers = USERS.filter(u => u.role === 'volunteer');

  const isLogin = phase === 'login';

  const clipFull = 'inset(0% 0% 0% 0% round 0px)';
  const clipCard = 'inset(1.25rem calc(52% + 1.25rem) 1.25rem 1.25rem round 20px)';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'white', overflow: 'hidden' }}>

      {/* ── Intro overlay (splash → collapse) ── */}
      {overlayMounted && (
        <div className="login-gradient" style={{
          position: 'fixed', inset: 0, zIndex: 999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          clipPath: phase === 'collapsing' || phase === 'login' ? clipCard : clipFull,
          opacity: phase === 'login' ? 0 : 1,
          transition: phase === 'collapsing'
            ? 'clip-path 0.82s cubic-bezier(0.76, 0, 0.24, 1)'
            : phase === 'login' ? 'opacity 0.35s ease' : 'none',
        }}>
          <Grain id="grain-intro" />
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem',
            position: 'relative', zIndex: 1,
            opacity: contentVisible && phase === 'splash' ? 1 : 0,
            transform: contentVisible && phase === 'splash' ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(16px)',
            transition: phase === 'collapsing'
              ? 'opacity 0.3s ease, transform 0.3s ease'
              : 'opacity 0.6s cubic-bezier(0.34,1.56,0.64,1), transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <img src="/aoza-logo-white.png" alt="Aoza" style={{ width: 72, height: 72, objectFit: 'contain' }} />
            <span style={{ fontFamily: "'Caprasimo', cursive", fontSize: '6rem', color: 'white', lineHeight: 1 }}>AOZA</span>
          </div>
        </div>
      )}

      {/* ── Expand overlay — only mounts when login validated ── */}
      {expandMounted && (
        <div className="login-gradient" style={{
          position: 'fixed', inset: 0, zIndex: 998, pointerEvents: 'none',
          clipPath: expandClip ? clipFull : clipCard,
          transition: expandClip ? 'clip-path 0.62s cubic-bezier(0.76, 0, 0.24, 1)' : 'none',
        }}>
          <Grain id="grain-expand" />
        </div>
      )}

      {/* ── Left card ── */}
      <div style={{ padding: '1.25rem', width: '48%', flexShrink: 0 }}>
        <div className="login-gradient" style={{
          height: '100%', minHeight: 'calc(100vh - 2.5rem)',
          borderRadius: 20, position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '2rem',
        }}>
          <Grain id="grain-card" />

          <div style={{
            position: 'relative', display: 'flex', alignItems: 'center', gap: 12,
            opacity: isLogin ? 1 : 0,
            transform: isLogin ? 'translateY(0)' : 'translateY(-12px)',
            transition: 'opacity 0.5s 0.1s ease, transform 0.5s 0.1s ease',
          }}>
            <img src="/aoza-logo-white.png" alt="Aoza" style={{ width: 48, height: 48, objectFit: 'contain' }} />
            <span style={{ fontFamily: "'Caprasimo', cursive", fontSize: '1.9rem', color: 'white', lineHeight: 1 }}>AOZA</span>
          </div>

          <div style={{
            position: 'relative',
            opacity: isLogin ? 1 : 0,
            transform: isLogin ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s 0.25s ease, transform 0.6s 0.25s ease',
          }}>
            <p style={{ fontFamily: "'Caprasimo', cursive", fontSize: '3.4rem', color: 'white', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              Structurez, centralisez,<br />pilotez votre association.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right — form ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem',
        opacity: isLogin ? 1 : 0,
        transform: isLogin ? 'translateX(0)' : 'translateX(40px)',
        transition: 'opacity 0.6s 0.35s ease, transform 0.6s 0.35s ease',
      }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: "'Caprasimo', cursive", fontSize: '2.6rem', fontWeight: 400, letterSpacing: '-0.01em', marginBottom: '0.5rem', lineHeight: 1.1 }}>Connexion</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Entrez vos identifiants pour accéder à la plateforme.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</label>
              <input type="email" required value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="prenom@eventflow.fr"
                style={INPUT_STYLE(!!error)}
                onFocus={e => e.target.style.borderColor = '#5b65f5'}
                onBlur={e => e.target.style.borderColor = error ? '#fecaca' : '#e9ecef'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} required value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  style={{ ...INPUT_STYLE(!!error), paddingRight: '3rem' }}
                  onFocus={e => e.target.style.borderColor = '#5b65f5'}
                  onBlur={e => e.target.style.borderColor = error ? '#fecaca' : '#e9ecef'}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#dc2626', fontSize: '0.8rem', fontWeight: 600 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ padding: '1rem', borderRadius: 12, background: '#1a1a1b', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.9375rem', cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s' }}>
              <LogIn size={18} /> {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div style={{ marginTop: '2.5rem', borderTop: '1px solid #e9ecef', paddingTop: '2rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Accès rapide — Organisateurs</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {organizers.map(u => (
                <button key={u.id} onClick={() => quickLogin(u)}
                  style={{ padding: '4px 12px', borderRadius: 99, border: '1px solid #e9ecef', background: 'white', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#1a1a1b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800 }}>{u.avatar[0]}</div>
                  {u.name.split(' ')[0]}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Accès rapide — Bénévoles</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {volunteers.map(u => (
                <button key={u.id} onClick={() => quickLogin(u)}
                  style={{ padding: '4px 12px', borderRadius: 99, border: '1px solid #e0e7ff', background: '#eff6ff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800 }}>{u.avatar[0]}</div>
                  {u.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
