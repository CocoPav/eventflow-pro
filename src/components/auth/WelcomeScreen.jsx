import React, { useState, useEffect } from 'react';

function Grain() {
  return (
    <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.22 }}>
      <filter id="grain-welcome">
        <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-welcome)" />
    </svg>
  );
}

export default function WelcomeScreen({ user, assoName, onDone }) {
  const [show, setShow] = useState(false);
  const [exit, setExit] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t0 = setTimeout(() => setShow(true),  60);
    const t1 = setTimeout(() => setExit(true),  2600);
    const t2 = setTimeout(() => { setGone(true); onDone(); }, 3300);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (gone) return null;

  const firstName = user?.name?.split(' ')[0] || 'vous';

  const textAnim = (delay) => ({
    opacity: show && !exit ? 1 : 0,
    transform: show && !exit ? 'translateY(0)' : exit ? 'translateY(-30px)' : 'translateY(24px)',
    transition: exit
      ? `opacity 0.35s ${delay * 0.4}s ease, transform 0.35s ${delay * 0.4}s ease`
      : `opacity 0.65s ${delay}s ease, transform 0.65s ${delay}s cubic-bezier(0.34,1.4,0.64,1)`,
  });

  // Curtain halves: top slides up, bottom slides down
  const curtainTop = {
    transform: exit ? 'translateY(-100%)' : 'translateY(0)',
    transition: exit ? 'transform 0.65s 0.1s cubic-bezier(0.76, 0, 0.24, 1)' : 'none',
  };
  const curtainBottom = {
    transform: exit ? 'translateY(100%)' : 'translateY(0)',
    transition: exit ? 'transform 0.65s 0.1s cubic-bezier(0.76, 0, 0.24, 1)' : 'none',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none' }}>
      {/* Top curtain half */}
      <div className="login-gradient" style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: '50%',
        overflow: 'hidden',
        ...curtainTop,
      }}>
        <Grain />
        {/* Clip the background so it looks like one seamless panel */}
        <div style={{ position: 'absolute', inset: 0, background: 'inherit' }} />
      </div>

      {/* Bottom curtain half */}
      <div className="login-gradient" style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%',
        overflow: 'hidden',
        ...curtainBottom,
      }}>
        <Grain />
      </div>

      {/* Text — sits above both halves, fades with text animation */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 1,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={textAnim(0)}>
            <p style={{
              fontFamily: "'Caprasimo', cursive",
              fontSize: 'clamp(3.5rem, 8vw, 6.5rem)',
              color: 'white',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
            }}>
              Bienvenue {firstName}
            </p>
          </div>

          <div style={{ ...textAnim(0.22), marginTop: '1.5rem' }}>
            <p style={{
              fontFamily: "'Caprasimo', cursive",
              fontSize: 'clamp(1.4rem, 2.8vw, 2rem)',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.5,
            }}>
              Vous entrez sur l'espace de gestion<br />de votre association {assoName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
