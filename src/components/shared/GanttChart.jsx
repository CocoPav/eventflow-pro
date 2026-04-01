import React from 'react';
import { format, addDays, differenceInDays, startOfDay, isToday, eachMonthOfInterval, endOfMonth, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

const PALETTE = [
  { bg: 'rgba(59,130,246,0.12)', border: '#3b82f6', text: '#1d4ed8' },
  { bg: 'rgba(16,185,129,0.12)', border: '#10b981', text: '#065f46' },
  { bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', text: '#92400e' },
  { bg: 'rgba(99,102,241,0.12)', border: '#6366f1', text: '#3730a3' },
  { bg: 'rgba(239,68,68,0.12)', border: '#ef4444', text: '#991b1b' },
];

function getColor(task, idx) {
  if (task.priority === 'high') return PALETTE[4];
  if (task.category === 'concert') return PALETTE[0];
  if (task.category === 'village') return PALETTE[1];
  if (task.category === 'course') return PALETTE[2];
  return PALETTE[idx % PALETTE.length];
}

export default function GanttChart({ tasks = [], rangeStart, rangeEnd }) {
  const today = startOfDay(new Date());
  const start = rangeStart ? startOfDay(new Date(rangeStart)) : new Date(2026, 2, 1);
  const end = rangeEnd ? startOfDay(new Date(rangeEnd)) : new Date(2026, 6, 1);
  const totalDays = Math.max(1, differenceInDays(end, start) + 1);
  const DAY_W = 22;
  const ROW_H = 36;
  const LABEL_W = 220;

  const getX = (dateStr) => {
    if (!dateStr) return -1;
    const d = startOfDay(new Date(dateStr));
    return differenceInDays(d, start) * DAY_W;
  };

  const todayX = differenceInDays(today, start) * DAY_W;
  const days = Array.from({ length: totalDays }, (_, i) => addDays(start, i));

  // Month spans
  const months = eachMonthOfInterval({ start, end });
  const monthSpans = months.map(month => {
    const mStart = month < start ? start : startOfMonth(month);
    const mEnd = month > end ? end : endOfMonth(month);
    return {
      label: format(month, 'MMMM yyyy', { locale: fr }),
      width: (differenceInDays(mEnd, mStart) + 1) * DAY_W
    };
  });

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: LABEL_W + totalDays * DAY_W }}>

          {/* Month header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: '#fafafa', height: 36 }}>
            <div style={{
              width: LABEL_W, minWidth: LABEL_W, borderRight: '1px solid var(--border)',
              padding: '0 14px', display: 'flex', alignItems: 'center',
              fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em',
              position: 'sticky', left: 0, background: '#fafafa', zIndex: 10
            }}>
              TÂCHE
            </div>
            {monthSpans.map((m, i) => (
              <div key={i} style={{
                width: m.width, minWidth: m.width, padding: '0 10px',
                display: 'flex', alignItems: 'center',
                fontSize: '0.7rem', fontWeight: 700, color: '#1a1a1b',
                borderRight: '1px solid var(--border)', textTransform: 'capitalize'
              }}>
                {m.label}
              </div>
            ))}
          </div>

          {/* Day header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: '#fafafa', height: 26 }}>
            <div style={{
              width: LABEL_W, minWidth: LABEL_W, borderRight: '1px solid var(--border)',
              position: 'sticky', left: 0, background: '#fafafa', zIndex: 10
            }} />
            {days.map(d => {
              const isWE = [0, 6].includes(d.getDay());
              const isT = isToday(d);
              return (
                <div key={d.toString()} style={{
                  width: DAY_W, minWidth: DAY_W, textAlign: 'center',
                  fontSize: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isT ? '#3b82f6' : isWE ? '#94a3b8' : '#cbd5e1',
                  fontWeight: isT ? 800 : 400,
                  borderRight: '1px solid #f8f9fa',
                  background: isT ? '#eff6ff' : 'transparent'
                }}>
                  {format(d, 'd')}
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {tasks.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
              Aucune tâche à afficher dans le rétroplanning.
            </div>
          ) : tasks.map((task, idx) => {
            const colors = getColor(task, idx);
            const endX = getX(task.dueDate || task.endDate || task.date);
            const startX = task.startDate ? getX(task.startDate) : Math.max(0, endX - 6 * DAY_W);
            const barWidth = Math.max(DAY_W * 1.5, endX - startX + DAY_W);
            const rowBg = idx % 2 === 0 ? '#fff' : '#fafafa';

            return (
              <div key={task.id} style={{
                display: 'flex', height: ROW_H,
                borderBottom: '1px solid #f1f3f5',
                background: rowBg, position: 'relative'
              }}>
                {/* Label */}
                <div style={{
                  width: LABEL_W, minWidth: LABEL_W,
                  padding: '0 14px', fontSize: '0.78rem', fontWeight: 600, color: '#1a1a1b',
                  borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                  position: 'sticky', left: 0, background: rowBg, zIndex: 5, gap: 6
                }}>
                  {task.status === 'done' && (
                    <span style={{ color: '#10b981', fontSize: '0.7rem' }}>✓</span>
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </span>
                </div>

                {/* Timeline */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                  {/* Weekend shading */}
                  {days.map((d, i) => [0, 6].includes(d.getDay()) && (
                    <div key={i} style={{
                      position: 'absolute', left: i * DAY_W, top: 0, bottom: 0,
                      width: DAY_W, background: 'rgba(99,102,241,0.03)'
                    }} />
                  ))}
                  {/* Today line */}
                  {todayX >= 0 && todayX < totalDays * DAY_W && (
                    <div style={{
                      position: 'absolute', left: todayX + DAY_W / 2 - 1, top: 0, bottom: 0,
                      width: 2, background: '#3b82f6', opacity: 0.5, zIndex: 3
                    }} />
                  )}
                  {/* Bar */}
                  {endX >= 0 && (
                    <div style={{
                      position: 'absolute', left: startX, width: barWidth,
                      top: 6, height: ROW_H - 12,
                      background: colors.bg,
                      border: `1.5px solid ${colors.border}`,
                      borderRadius: 6,
                      display: 'flex', alignItems: 'center', paddingLeft: 8,
                      fontSize: '0.62rem', fontWeight: 700, color: colors.text,
                      overflow: 'hidden', whiteSpace: 'nowrap', zIndex: 2
                    }}>
                      {task.assignee || task.title}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
