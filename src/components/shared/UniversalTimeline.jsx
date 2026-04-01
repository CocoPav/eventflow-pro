import React, { useState, useRef, useCallback } from 'react';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';

/**
 * Universal Timeline — même style sur toutes les pages.
 *
 * Props :
 *   items        : [{
 *     id, title, group, start (Date|string), end (Date|string),
 *     color?, dependencies?: [id,...], subtitle?
 *   }]
 *   groupBy      : 'group' (default) — clé utilisée pour regrouper
 *   groupLabel?  : (groupKey) => string
 *   minDate?     : Date
 *   maxDate?     : Date
 *   resizable?   : bool  — enable cliqué-étiré (rétroplanning)
 *   onUpdate?    : (id, { start, end }) => void
 *   showDeps?    : bool  — afficher les dépendances
 */
export default function UniversalTimeline({
  items = [],
  groupBy    = 'group',
  groupLabel,
  minDate: propMin,
  maxDate: propMax,
  resizable  = false,
  onUpdate,
  showDeps   = true,
}) {
  const [collapsed, setCollapsed] = useState({});
  const [dragging, setDragging]   = useState(null); // { id, edge: 'start'|'end', origX, origStart, origEnd }
  const containerRef = useRef(null);

  /* ── Date bounds ── */
  const allDates = items.flatMap(it => [new Date(it.start), new Date(it.end)]).filter(d => !isNaN(d));
  const minDate  = propMin || (allDates.length ? new Date(Math.min(...allDates)) : new Date());
  const maxDate  = propMax || (allDates.length ? new Date(Math.max(...allDates)) : new Date());

  // Add 2-day padding on each side
  const paddedMin = new Date(minDate); paddedMin.setDate(paddedMin.getDate() - 2);
  const paddedMax = new Date(maxDate); paddedMax.setDate(paddedMax.getDate() + 2);
  const totalMs   = paddedMax - paddedMin;

  const pct = (date) => {
    const d = new Date(date);
    if (isNaN(d)) return 0;
    return Math.max(0, Math.min(100, ((d - paddedMin) / totalMs) * 100));
  };

  /* ── Groups ── */
  const groups = {};
  items.forEach(it => {
    const g = it[groupBy] || 'Autre';
    if (!groups[g]) groups[g] = [];
    groups[g].push(it);
  });
  // Sort each group by start date
  Object.values(groups).forEach(g => g.sort((a, b) => new Date(a.start) - new Date(b.start)));

  const toggleGroup = (g) => setCollapsed(prev => ({ ...prev, [g]: !prev[g] }));

  /* ── Resize handlers ── */
  const startResize = useCallback((e, id, edge) => {
    if (!resizable) return;
    e.preventDefault();
    const item = items.find(i => i.id === id);
    setDragging({
      id, edge,
      origX: e.clientX,
      origStart: new Date(item.start),
      origEnd:   new Date(item.end),
    });

    const onMove = (ev) => {
      const cont = containerRef.current;
      if (!cont || !dragging) return;
      const dx   = ev.clientX - e.clientX;
      const pxW  = cont.offsetWidth;
      const dMs  = (dx / pxW) * totalMs;
      const it   = items.find(i => i.id === id);
      const newStart = new Date(item.start);
      const newEnd   = new Date(item.end);
      if (edge === 'start') newStart.setTime(newStart.getTime() + dMs);
      if (edge === 'end')   newEnd.setTime(newEnd.getTime() + dMs);
      if (newEnd > newStart) onUpdate?.(id, { start: newStart, end: newEnd });
    };
    const onUp = () => {
      setDragging(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [resizable, items, totalMs, onUpdate]);

  /* ── Day labels ── */
  const dayTicks = [];
  const d = new Date(paddedMin);
  while (d <= paddedMax) {
    dayTicks.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  // Only show every N days to avoid crowding
  const step = Math.max(1, Math.floor(dayTicks.length / 12));
  const visibleTicks = dayTicks.filter((_, i) => i % step === 0);

  /* ── Dependency lines (SVG overlay — simplified) ── */
  // We render them as inline indicators for now (full SVG overlay would need position measurement)

  const COLORS = [
    '#3b82f6','#6366f1','#8b5cf6','#ec4899',
    '#f59e0b','#10b981','#14b8a6','#ef4444',
  ];
  const groupColors = {};
  Object.keys(groups).forEach((g, i) => { groupColors[g] = COLORS[i % COLORS.length]; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Axis header */}
      <div style={{
        position: 'sticky',
        top: 0, zIndex: 5,
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        padding: '6px 0',
        overflow: 'hidden',
      }}
        ref={containerRef}
      >
        <div style={{ position: 'relative', height: 24, marginLeft: 180 }}>
          {visibleTicks.map((tick, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${pct(tick)}%`,
                transform: 'translateX(-50%)',
                fontSize: '0.6rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {tick.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </div>
          ))}
        </div>
      </div>

      {/* Groups */}
      <div style={{
        border: '1px solid var(--border)',
        borderTop: 'none',
        borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
        background: 'var(--bg-card)',
        overflow: 'hidden',
      }}>
        {Object.entries(groups).map(([groupKey, groupItems], gi) => {
          const isCollapsed = collapsed[groupKey];
          const color       = groupColors[groupKey];
          const label       = groupLabel ? groupLabel(groupKey) : groupKey;

          // Collapsed: show one fat bar spanning all items
          const groupStart = groupItems.reduce((m, it) => new Date(it.start) < m ? new Date(it.start) : m, new Date(groupItems[0].start));
          const groupEnd   = groupItems.reduce((m, it) => new Date(it.end)   > m ? new Date(it.end)   : m, new Date(groupItems[0].end));

          return (
            <div key={groupKey} style={{ borderBottom: gi < Object.keys(groups).length - 1 ? '1px solid var(--border)' : 'none' }}>

              {/* Group header row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0,
                  background: 'var(--bg-elevated)',
                  cursor: 'pointer',
                  padding: '5px 0',
                  userSelect: 'none',
                }}
                onClick={() => toggleGroup(groupKey)}
              >
                {/* Label cell */}
                <div style={{
                  width: 180, flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0 10px',
                  overflow: 'hidden',
                }}>
                  <div style={{ width: 3, height: 14, borderRadius: 99, background: color, flexShrink: 0 }} />
                  {isCollapsed
                    ? <ChevronRight size={12} color="var(--text-muted)" />
                    : <ChevronDown  size={12} color="var(--text-muted)" />
                  }
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700,
                    color: 'var(--text-main)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </span>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700,
                    background: `${color}18`,
                    color,
                    padding: '1px 5px', borderRadius: 99,
                    flexShrink: 0,
                  }}>
                    {groupItems.length}
                  </span>
                </div>

                {/* Bar area */}
                <div style={{ flex: 1, position: 'relative', height: 24 }}>
                  {isCollapsed && (
                    <div style={{
                      position: 'absolute',
                      left: `${pct(groupStart)}%`,
                      width: `${Math.max(pct(groupEnd) - pct(groupStart), 1)}%`,
                      top: '50%', transform: 'translateY(-50%)',
                      height: 14,
                      background: color,
                      borderRadius: 99,
                      opacity: 0.35,
                    }} />
                  )}
                </div>
              </div>

              {/* Items rows */}
              {!isCollapsed && groupItems.map((item, ii) => {
                const startPct = pct(item.start);
                const widthPct = Math.max(pct(item.end) - startPct, 1);
                const hasDeps  = showDeps && item.dependencies?.length > 0;

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      borderTop: '1px solid var(--border)',
                      background: ii % 2 === 1 ? 'rgba(0,0,0,0.01)' : 'transparent',
                    }}
                  >
                    {/* Label cell */}
                    <div style={{
                      width: 180, flexShrink: 0,
                      padding: '5px 10px 5px 22px',
                      overflow: 'hidden',
                    }}>
                      <p style={{
                        fontSize: '0.75rem', fontWeight: 500,
                        color: 'var(--text-main)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.subtitle}
                        </p>
                      )}
                      {hasDeps && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 1 }}>
                          <ArrowRight size={9} color="var(--text-subtle)" />
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-subtle)' }}>
                            {item.dependencies.length} dép.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bar area */}
                    <div style={{ flex: 1, position: 'relative', height: 32 }}>
                      {/* Gridlines */}
                      {visibleTicks.map((tick, ti) => (
                        <div key={ti} style={{
                          position: 'absolute',
                          left: `${pct(tick)}%`,
                          top: 0, bottom: 0,
                          width: 1,
                          background: 'var(--border)',
                          opacity: 0.5,
                        }} />
                      ))}

                      {/* Bar */}
                      <div
                        style={{
                          position: 'absolute',
                          left: `${startPct}%`,
                          width: `${widthPct}%`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          height: 18,
                          background: item.color || color,
                          borderRadius: 99,
                          display: 'flex',
                          alignItems: 'center',
                          overflow: 'hidden',
                          minWidth: 8,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                          cursor: resizable ? 'col-resize' : 'default',
                        }}
                        title={`${item.title} — ${new Date(item.start).toLocaleDateString('fr-FR')} → ${new Date(item.end).toLocaleDateString('fr-FR')}`}
                      >
                        {/* Left resize handle */}
                        {resizable && (
                          <div
                            onMouseDown={e => startResize(e, item.id, 'start')}
                            style={{ width: 6, height: '100%', cursor: 'w-resize', flexShrink: 0, background: 'rgba(0,0,0,0.15)' }}
                          />
                        )}
                        <span style={{
                          flex: 1, fontSize: '0.6rem', fontWeight: 700,
                          color: 'white', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          padding: '0 4px',
                          pointerEvents: 'none',
                        }}>
                          {item.title}
                        </span>
                        {/* Right resize handle */}
                        {resizable && (
                          <div
                            onMouseDown={e => startResize(e, item.id, 'end')}
                            style={{ width: 6, height: '100%', cursor: 'e-resize', flexShrink: 0, background: 'rgba(0,0,0,0.15)' }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
