import React from 'react';
import { Construction } from 'lucide-react';

export default function InscriptionView() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 400,
      gap: '1rem',
      color: 'var(--text-muted)',
    }}>
      <Construction size={40} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
        Page en construction
      </h2>
      <p style={{ fontSize: '0.85rem', margin: 0 }}>Cette section sera disponible prochainement.</p>
    </div>
  );
}
