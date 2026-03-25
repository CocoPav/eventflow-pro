import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(26, 26, 27, 0.4)',
              backdropFilter: 'blur(12px)',
              zIndex: 1000
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '600px',
              background: 'white',
              border: 'none',
              borderRadius: '24px',
              boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.25)',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid #f1f3f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.025em' }}>{title}</h3>
              <button onClick={onClose} style={{ background: '#f8f9fa', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'} onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}>
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div style={{ padding: '2.5rem', overflowY: 'auto', flex: 1 }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
