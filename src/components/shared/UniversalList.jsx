import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

/**
 * Universal List — même style sur toutes les pages.
 *
 * Props :
 *   columns   : [{ key, label, width?, render?, align? }]
 *   rows      : array of objects
 *   onRowClick?: (row) => void
 *   searchable?: bool
 *   searchKeys?: [key, ...]     — champs utilisés pour la recherche
 *   emptyLabel?: string
 *   stickyHeader?: bool
 *   maxHeight?: string          — active le scroll vertical
 *
 * Exemple colonne :
 *   { key: 'status', label: 'Statut', width: 110,
 *     render: (row) => <Badge status={row.status} /> }
 */
export default function UniversalList({
  columns = [],
  rows = [],
  onRowClick,
  searchable = false,
  searchKeys = [],
  emptyLabel = 'Aucun élément',
  stickyHeader = true,
  maxHeight,
}) {
  const [query, setQuery]       = useState('');
  const [sortKey, setSortKey]   = useState(null);
  const [sortDir, setSortDir]   = useState('asc');

  /* ── Search ── */
  const searched = query.trim()
    ? rows.filter(row =>
        searchKeys.some(k => String(row[k] ?? '').toLowerCase().includes(query.toLowerCase()))
      )
    : rows;

  /* ── Sort ── */
  const sorted = sortKey
    ? [...searched].sort((a, b) => {
        const va = a[sortKey] ?? '';
        const vb = b[sortKey] ?? '';
        const cmp = String(va).localeCompare(String(vb), 'fr', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : searched;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Search bar */}
      {searchable && (
        <div style={{ position: 'relative', maxWidth: 300 }}>
          <Search
            size={13}
            style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Rechercher…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '5px 10px 5px 28px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              fontSize: '0.78rem',
              color: 'var(--text-main)',
              outline: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
      )}

      {/* Table wrapper */}
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-sm)',
        maxHeight: maxHeight || undefined,
        overflowY: maxHeight ? 'auto' : undefined,
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}>
          {/* Colgroup pour les largeurs fixes */}
          <colgroup>
            {columns.map((col, i) => (
              <col key={i} style={{ width: col.width ? `${col.width}px` : undefined }} />
            ))}
          </colgroup>

          {/* Header */}
          <thead style={{
            position: stickyHeader ? 'sticky' : undefined,
            top: 0,
            zIndex: stickyHeader ? 1 : undefined,
          }}>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => !col.noSort && handleSort(col.key)}
                  style={{
                    padding: '7px 12px',
                    textAlign: col.align || 'left',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    cursor: col.noSort ? 'default' : 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    {col.label}
                    {!col.noSort && sortKey === col.key && (
                      sortDir === 'asc'
                        ? <ChevronUp size={10} />
                        : <ChevronDown size={10} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '2.5rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                  }}
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              sorted.map((row, ri) => (
                <tr
                  key={row.id ?? ri}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    borderBottom: ri < sorted.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        color: 'var(--text-main)',
                        textAlign: col.align || 'left',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        verticalAlign: 'middle',
                      }}
                    >
                      {col.render ? col.render(row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Count */}
      {sorted.length > 0 && (
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: 2 }}>
          {sorted.length} élément{sorted.length > 1 ? 's' : ''}
          {query && ` sur ${rows.length}`}
        </p>
      )}
    </div>
  );
}
