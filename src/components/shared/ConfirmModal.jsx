import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Modale de confirmation universelle pour les suppressions.
 * Usage :
 *   <ConfirmModal
 *     isOpen={!!toDelete}
 *     onConfirm={() => { deleteItem(...); setToDelete(null); }}
 *     onCancel={() => setToDelete(null)}
 *     title="Supprimer la tâche ?"
 *     description="Cette action est irréversible."
 *   />
 */
export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title       = 'Confirmer la suppression',
  description = 'Cette action est irréversible.',
  confirmLabel = 'Supprimer',
  cancelLabel  = 'Annuler',
  variant      = 'danger', // 'danger' | 'warning'
}) {
  const isDanger  = variant === 'danger';
  const accentColor = isDanger ? 'var(--danger)' : 'var(--warning)';
  const accentSoft  = isDanger ? 'var(--danger-soft)' : 'var(--warning-soft)';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(4px)',
              zIndex: 2000,
            }}
          />

          {/* Dialog */}
          <div style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '92%', maxWidth: 380,
            zIndex: 2001,
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {/* Icon + close */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: 40, height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: accentSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isDanger
                    ? <Trash2 size={18} color={accentColor} />
                    : <AlertTriangle size={18} color={accentColor} />
                  }
                </div>
                <button
                  onClick={onCancel}
                  style={{
                    background: 'var(--bg-hover)', border: 'none', cursor: 'pointer',
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Text */}
              <div>
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>
                  {title}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {description}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={onCancel}
                  className="btn-secondary"
                  style={{ height: 34 }}
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className="btn-danger"
                  style={{ height: 34 }}
                  autoFocus
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
