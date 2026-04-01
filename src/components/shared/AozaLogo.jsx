import React from 'react';

export default function AozaLogo({ size = 'md', showText = true }) {
  const sizes = {
    sm: { img: 24, font: '1rem' },
    md: { img: 32, font: '1.4rem' },
    lg: { img: 44, font: '1.75rem' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <img
        src="/aoza-logo.png"
        alt="Aoza"
        style={{ width: s.img, height: s.img, objectFit: 'contain', flexShrink: 0 }}
      />
      {showText && (
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800,
          fontSize: s.font,
          color: '#f72f3e',
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}>
          Aoza
        </span>
      )}
    </div>
  );
}
