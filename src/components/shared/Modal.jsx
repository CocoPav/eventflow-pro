import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Modale universelle.
 * Props : isOpen, onClose, title, children, maxWidth?, footer?
 */
export default function Modal({ isOpen, onClose, title, children, maxWidth = '560px', footer }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
            }}
          />

          {/* Centering wrapper — transform géré par CSS, pas Framer */}
          <div style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '92%', maxWidth,
            zIndex: 1001,
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '88vh',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}>
                <h3 style={{
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-main)',
                }}>
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  style={{
                    background: 'var(--bg-hover)',
                    border: 'none',
                    cursor: 'pointer',
                    width: 28, height: 28,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)',
                    transition: 'background 0.12s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-active)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Body */}
              <div style={{
                padding: '1.25rem',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.875rem',
              }}>
                {children}
              </div>

              {/* Optional footer */}
              {footer && (
                <div style={{
                  padding: '0.875rem 1.25rem',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 8,
                  flexShrink: 0,
                }}>
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
