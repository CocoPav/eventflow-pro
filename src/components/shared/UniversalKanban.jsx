import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, GripVertical, MoreHorizontal } from 'lucide-react';

/**
 * Universal Kanban — même style sur toutes les pages.
 *
 * Props :
 *   columns      : [{ id, label, color }]
 *   cards        : [{ id, columnId, title, subtitle?, meta?, priority?, assignee?, ... }]
 *   onCardMove   : (cardId, newColumnId, insertBeforeId?) => void
 *   onCardClick? : (card) => void
 *   onAddCard?   : (columnId) => void
 *   renderCard?  : (card) => ReactNode   — surcharge le rendu de la tuile
 *   maxColHeight?: string
 */
export default function UniversalKanban({
  columns = [],
  cards   = [],
  onCardMove,
  onCardClick,
  onAddCard,
  renderCard,
  maxColHeight = '70vh',
}) {
  const [dragging, setDragging] = useState(null);     // { cardId }
  const [dropTarget, setDropTarget] = useState(null); // { columnId, beforeId, position }
  const scrollRef = useRef(null);
  const autoScrollTimer = useRef(null);

  /* ── Auto-scroll horizontal quand on approche du bord ── */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const { left, right } = el.getBoundingClientRect();
    const zone = 80;
    clearInterval(autoScrollTimer.current);
    if (e.clientX < left + zone) {
      autoScrollTimer.current = setInterval(() => { el.scrollLeft -= 12; }, 16);
    } else if (e.clientX > right - zone) {
      autoScrollTimer.current = setInterval(() => { el.scrollLeft += 12; }, 16);
    }
  }, []);

  useEffect(() => () => clearInterval(autoScrollTimer.current), []);

  /* ── Drag handlers ── */
  const handleDragStart = (e, cardId) => {
    setDragging({ cardId });
    e.dataTransfer.effectAllowed = 'move';
    // transparent ghost
    const ghost = document.createElement('div');
    ghost.style.opacity = '0';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragEnd = () => {
    clearInterval(autoScrollTimer.current);
    if (dragging && dropTarget) {
      onCardMove?.(dragging.cardId, dropTarget.columnId, dropTarget.beforeId);
    }
    setDragging(null);
    setDropTarget(null);
  };

  const handleCardDragOver = (e, columnId, cardId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragging || dragging.cardId === cardId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mid  = rect.top + rect.height / 2;
    const pos  = e.clientY < mid ? 'above' : 'below';
    setDropTarget({ columnId, beforeId: pos === 'above' ? cardId : null, afterId: pos === 'below' ? cardId : null, position: pos });
  };

  const handleColDragOver = (e, columnId) => {
    e.preventDefault();
    // Only activate when not hovering a card
    if (!dropTarget || dropTarget.columnId !== columnId) {
      setDropTarget({ columnId, beforeId: null, afterId: null, position: 'end' });
    }
    handleDragOver(e);
  };

  /* ── Helpers ── */
  const cardsByCol = (colId) => cards.filter(c => c.columnId === colId);

  const priorityColor = (p) => {
    if (p === 'high')   return '#ef4444';
    if (p === 'medium') return '#f59e0b';
    return '#d1d5db';
  };

  /* ── Default card render ── */
  const DefaultCard = ({ card }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Priority bar + title */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{
          width: 3, borderRadius: 99, flexShrink: 0,
          alignSelf: 'stretch',
          background: priorityColor(card.priority),
          minHeight: 16,
        }} />
        <p style={{
          fontSize: '0.8rem', fontWeight: 600,
          color: 'var(--text-main)', lineHeight: 1.35,
          flex: 1,
        }}>
          {card.title}
        </p>
      </div>

      {/* Subtitle */}
      {card.subtitle && (
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: 11, lineHeight: 1.4 }}>
          {card.subtitle}
        </p>
      )}

      {/* Meta row */}
      {(card.assignee || card.dueDate || card.meta) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          paddingLeft: 11, flexWrap: 'wrap',
        }}>
          {card.assignee && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 600,
              background: 'var(--bg-elevated)',
              color: 'var(--text-muted)',
              padding: '1px 6px', borderRadius: 99,
              border: '1px solid var(--border)',
            }}>
              {card.assignee}
            </span>
          )}
          {card.dueDate && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {card.dueDate}
            </span>
          )}
          {card.meta}
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 8,
        alignItems: 'flex-start',
      }}
      onDragOver={handleDragOver}
    >
      {columns.map((col) => {
        const colCards = cardsByCol(col.id);
        const isOver   = dropTarget?.columnId === col.id;

        return (
          <div
            key={col.id}
            onDragOver={e => handleColDragOver(e, col.id)}
            onDrop={handleDragEnd}
            style={{
              flexShrink: 0,
              width: 260,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              background: isOver && dropTarget?.position === 'end' && !dropTarget?.beforeId
                ? 'var(--bg-elevated)'
                : 'transparent',
              borderRadius: 'var(--radius-lg)',
              padding: '2px',
              transition: 'background 0.15s',
            }}
          >
            {/* Column header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 6px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: col.color || 'var(--text-muted)',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {col.label}
                </span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700,
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                  padding: '1px 6px', borderRadius: 99,
                  border: '1px solid var(--border)',
                }}>
                  {colCards.length}
                </span>
              </div>
              {onAddCard && (
                <button
                  onClick={() => onAddCard(col.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                    padding: 2, borderRadius: 4, transition: 'color 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Plus size={13} />
                </button>
              )}
            </div>

            {/* Cards area */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                maxHeight: maxColHeight,
                overflowY: 'auto',
                padding: '2px 0',
                minHeight: 40,
                borderRadius: 'var(--radius-md)',
                border: isOver ? '1.5px dashed var(--primary)' : '1.5px dashed transparent',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              {colCards.length === 0 && (
                <div style={{
                  padding: '12px 8px',
                  textAlign: 'center',
                  color: 'var(--text-subtle)',
                  fontSize: '0.72rem',
                }}>
                  Déposer ici
                </div>
              )}

              {colCards.map((card) => {
                const isDraggingThis = dragging?.cardId === card.id;
                const isDropAbove    = dropTarget?.columnId === col.id && dropTarget?.beforeId === card.id && dropTarget?.position === 'above';
                const isDropBelow    = dropTarget?.columnId === col.id && dropTarget?.afterId  === card.id && dropTarget?.position === 'below';

                return (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={e => handleDragStart(e, card.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => handleCardDragOver(e, col.id, card.id)}
                    onClick={() => onCardClick?.(card)}
                    className={isDraggingThis ? 'kanban-dragging' : ''}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '9px 10px',
                      cursor: 'grab',
                      transition: 'box-shadow 0.12s, border-color 0.12s, opacity 0.12s',
                      boxShadow: isDropAbove
                        ? '0 -3px 0 var(--primary)'
                        : isDropBelow
                        ? '0 3px 0 var(--primary)'
                        : 'var(--shadow-sm)',
                      borderColor: (isDropAbove || isDropBelow)
                        ? 'var(--primary)'
                        : 'var(--border)',
                    }}
                    onMouseEnter={e => { if (!isDraggingThis) e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                    onMouseLeave={e => { if (!isDraggingThis && !isDropAbove && !isDropBelow) e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                  >
                    {renderCard ? renderCard(card) : <DefaultCard card={card} />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
