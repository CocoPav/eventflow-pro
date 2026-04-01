import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Mark } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import './NotionEditor.css';

// ── Custom Mention mark ──────────────────────────────────────
const MentionMark = Mark.create({
  name: 'mention',
  renderHTML({ HTMLAttributes }) {
    return ['span', { class: 'mention', ...HTMLAttributes }, 0];
  },
  parseHTML() {
    return [{ tag: 'span.mention' }];
  },
  addAttributes() {
    return { 'data-id': { default: null }, 'data-type': { default: null } };
  },
});

// ── Block types for the "/" menu ─────────────────────────────
const BLOCK_TYPES = [
  { id: 'text',    icon: 'T',    label: 'Texte',           desc: 'Paragraphe simple',   cmd: (e) => e.chain().focus().setParagraph().run() },
  { id: 'h1',      icon: 'H1',   label: 'Titre 1',         desc: 'Grand titre',         cmd: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: 'h2',      icon: 'H2',   label: 'Titre 2',         desc: 'Titre secondaire',    cmd: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: 'h3',      icon: 'H3',   label: 'Titre 3',         desc: 'Sous-titre',          cmd: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: 'bullet',  icon: '•',    label: 'Liste à puces',   desc: 'Points de liste',     cmd: (e) => e.chain().focus().toggleBulletList().run() },
  { id: 'ordered', icon: '1.',   label: 'Liste numérotée', desc: 'Étapes numérotées',   cmd: (e) => e.chain().focus().toggleOrderedList().run() },
  { id: 'task',    icon: '☑',    label: 'Cases à cocher',  desc: 'Tâches / décisions',  cmd: (e) => e.chain().focus().toggleTaskList().run() },
  { id: 'quote',   icon: '❝',    label: 'Citation',        desc: 'Bloc mis en valeur',  cmd: (e) => e.chain().focus().toggleBlockquote().run() },
  { id: 'code',    icon: '</>',  label: 'Code',            desc: 'Bloc de code',        cmd: (e) => e.chain().focus().toggleCodeBlock().run() },
  { id: 'hr',      icon: '—',    label: 'Séparateur',      desc: 'Ligne horizontale',   cmd: (e) => e.chain().focus().setHorizontalRule().run() },
];

const bubBtn = (active) => ({
  padding: '4px 9px',
  background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
  border: 'none', borderRadius: 5, cursor: 'pointer',
  color: active ? '#fff' : 'rgba(255,255,255,0.72)',
  fontWeight: active ? 700 : 500,
  fontSize: '0.8rem', lineHeight: 1,
  whiteSpace: 'nowrap',
});

// ════════════════════════════════════════════════════════════════
export default function NotionEditor({ content, onChange, placeholder, readOnly, mentionItems = [] }) {
  const [bubblePos, setBubblePos]   = useState(null); // { top, left } in viewport
  const [slashMenu, setSlashMenu]   = useState(null); // { top, left, filter }
  const [mentionMenu, setMentionMenu] = useState(null); // { top, left, filter }
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [mentionIdx, setMentionIdx] = useState(0);
  const slashStartRef   = useRef(null);
  const mentionStartRef = useRef(null);
  const editorWrapRef = useRef(null);

  // Re-render trigger for active state in bubble menu
  const [, forceUpdate] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: placeholder || 'Écrivez ici, ou tapez / pour insérer un bloc…' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      MentionMark,
    ],
    content: content || '',
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
      forceUpdate(n => n + 1);

      // Detect "/" slash command
      const { from, empty } = ed.state.selection;
      if (!empty) { setSlashMenu(null); return; }
      const $from = ed.state.selection.$from;
      const paraStart = $from.start();
      const textInPara = ed.state.doc.textBetween(paraStart, from);
      const slashIdx = textInPara.lastIndexOf('/');
      if (slashIdx !== -1 && textInPara.slice(0, slashIdx).trim() === '') {
        const filter = textInPara.slice(slashIdx + 1).toLowerCase();
        const coords = ed.view.coordsAtPos(from);
        slashStartRef.current = paraStart + slashIdx;
        setSlashMenu({ top: coords.bottom + 6, left: coords.left, filter });
        setMentionMenu(null);
        setSelectedIdx(0);
        return;
      }
      if (slashMenu) setSlashMenu(null);

      // Detect "@" mention trigger
      const atIdx = textInPara.lastIndexOf('@');
      if (atIdx !== -1) {
        const beforeAt = textInPara.slice(0, atIdx);
        // Only trigger if @ is at start or preceded by a space
        if (beforeAt === '' || beforeAt.endsWith(' ')) {
          const filter = textInPara.slice(atIdx + 1).toLowerCase();
          // Don't show if filter has a space (mention ended)
          if (!filter.includes(' ')) {
            const coords = ed.view.coordsAtPos(from);
            mentionStartRef.current = paraStart + atIdx;
            setMentionMenu({ top: coords.bottom + 6, left: coords.left, filter });
            setMentionIdx(0);
            return;
          }
        }
      }
      if (mentionMenu) setMentionMenu(null);
    },
    onSelectionUpdate: ({ editor: ed }) => {
      forceUpdate(n => n + 1);

      // Bubble menu position from native selection
      const { empty } = ed.state.selection;
      if (!empty) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0) {
            setBubblePos({ top: rect.top - 46, left: rect.left + rect.width / 2 });
            return;
          }
        }
      }
      setBubblePos(null);

      // Close slash menu if cursor moved before "/"
      if (slashMenu && slashStartRef.current !== null) {
        if (ed.state.selection.from < slashStartRef.current) setSlashMenu(null);
      }
    },
    onFocus: () => {},
    onBlur: () => { setTimeout(() => setBubblePos(null), 150); },
  });

  // Sync external content
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const cur = editor.getHTML();
    if (content !== cur) editor.commands.setContent(content || '', false);
  }, [editor, content]);

  // Keyboard nav in slash menu
  const handleKeyDown = useCallback((e) => {
    if (slashMenu) {
      const items = filteredItems(slashMenu.filter);
      if (!items.length) return;
      if (e.key === 'ArrowDown')  { e.preventDefault(); setSelectedIdx(i => (i + 1) % items.length); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx(i => (i - 1 + items.length) % items.length); }
      else if (e.key === 'Enter')     { e.preventDefault(); applyBlock(items[selectedIdx]); }
      else if (e.key === 'Escape')    { e.preventDefault(); setSlashMenu(null); editor?.commands.focus(); }
      return;
    }
    if (mentionMenu) {
      const items = filteredMentions(mentionMenu.filter);
      if (!items.length) return;
      if (e.key === 'ArrowDown')  { e.preventDefault(); setMentionIdx(i => (i + 1) % items.length); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionIdx(i => (i - 1 + items.length) % items.length); }
      else if (e.key === 'Enter')     { e.preventDefault(); applyMention(items[mentionIdx]); }
      else if (e.key === 'Escape')    { e.preventDefault(); setMentionMenu(null); editor?.commands.focus(); }
    }
  }, [slashMenu, selectedIdx, mentionMenu, mentionIdx, editor]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  const filteredItems = (filter) =>
    !filter ? BLOCK_TYPES : BLOCK_TYPES.filter(b => b.label.toLowerCase().includes(filter) || b.id.includes(filter));

  const filteredMentions = (filter) =>
    !filter ? mentionItems : mentionItems.filter(m => m.label.toLowerCase().includes(filter));

  const applyMention = useCallback((item) => {
    if (!editor || !item) return;
    const { from } = editor.state.selection;
    const startPos = mentionStartRef.current;
    if (startPos !== null) {
      editor
        .chain()
        .focus()
        .deleteRange({ from: startPos, to: from })
        .setMark('mention', { 'data-id': item.id, 'data-type': item.type })
        .insertContent(`@${item.label}`)
        .unsetMark('mention')
        .insertContent(' ')
        .run();
    }
    setMentionMenu(null);
    mentionStartRef.current = null;
  }, [editor]);

  const applyBlock = useCallback((block) => {
    if (!editor || !block) return;
    const { from } = editor.state.selection;
    const startPos = slashStartRef.current;
    if (startPos !== null) editor.chain().focus().deleteRange({ from: startPos, to: from }).run();
    block.cmd(editor);
    setSlashMenu(null);
    slashStartRef.current = null;
  }, [editor]);

  if (!editor) return null;

  const slashItems = slashMenu ? filteredItems(slashMenu.filter) : [];

  return (
    <div className="notion-editor" ref={editorWrapRef} style={{ position: 'relative' }}>

      {/* ── Bubble menu (fixed, from viewport coords) ── */}
      {bubblePos && (
        <div
          onMouseDown={e => e.preventDefault()}
          style={{
            position: 'fixed',
            top: Math.max(8, bubblePos.top),
            left: bubblePos.left,
            transform: 'translateX(-50%)',
            zIndex: 9998,
            display: 'flex', alignItems: 'center',
            background: '#1a1a1b', borderRadius: 9, padding: '3px 4px', gap: '1px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.28)',
            pointerEvents: 'all',
          }}
        >
          <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }} style={bubBtn(editor.isActive('bold'))}><strong>G</strong></button>
          <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }} style={bubBtn(editor.isActive('italic'))}><em>I</em></button>
          <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleStrike().run(); }} style={bubBtn(editor.isActive('strike'))}><s>S</s></button>
          <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleCode().run(); }} style={bubBtn(editor.isActive('code'))}>{'<>'}</button>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.14)', margin: '0 3px', height: 18, alignSelf: 'center' }} />
          <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }} style={bubBtn(editor.isActive('heading', { level: 1 }))}>H1</button>
          <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }} style={bubBtn(editor.isActive('heading', { level: 2 }))}>H2</button>
          <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }} style={bubBtn(editor.isActive('heading', { level: 3 }))}>H3</button>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.14)', margin: '0 3px', height: 18, alignSelf: 'center' }} />
          <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }} style={bubBtn(editor.isActive('bulletList'))}>•—</button>
          <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }} style={bubBtn(editor.isActive('orderedList'))}>1.</button>
          <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleTaskList().run(); }} style={bubBtn(editor.isActive('taskList'))}>☑</button>
          <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run(); }} style={bubBtn(editor.isActive('blockquote'))}>❝</button>
        </div>
      )}

      {/* ── "/" slash menu ── */}
      {slashMenu && slashItems.length > 0 && (
        <div
          onMouseDown={e => e.preventDefault()}
          style={{
            position: 'fixed',
            top: Math.min(slashMenu.top, window.innerHeight - 320),
            left: Math.min(slashMenu.left, window.innerWidth - 300),
            zIndex: 9999,
            background: 'white', border: '1px solid #e9ecef',
            borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
            width: 280, maxHeight: 300, overflowY: 'auto', padding: '4px',
          }}
        >
          <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', padding: '4px 8px 2px', margin: 0 }}>BLOCS</p>
          {slashItems.map((b, i) => (
            <div
              key={b.id}
              onClick={() => applyBlock(b)}
              onMouseEnter={() => setSelectedIdx(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                background: i === selectedIdx ? '#f1f3f5' : 'transparent',
                transition: 'background 0.08s',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 7,
                background: '#f8f9fa', border: '1px solid #e9ecef',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.72rem', fontWeight: 800, color: '#1a1a1b', flexShrink: 0,
              }}>
                {b.icon}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600 }}>{b.label}</p>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8' }}>{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── "@" mention menu ── */}
      {mentionMenu && filteredMentions(mentionMenu.filter).length > 0 && (
        <div
          onMouseDown={e => e.preventDefault()}
          style={{
            position: 'fixed',
            top: Math.min(mentionMenu.top, window.innerHeight - 280),
            left: Math.min(mentionMenu.left, window.innerWidth - 280),
            zIndex: 9999,
            background: 'white', border: '1px solid #e9ecef',
            borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
            width: 260, maxHeight: 280, overflowY: 'auto', padding: '4px',
          }}
        >
          <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', padding: '4px 8px 2px', margin: 0 }}>MENTIONNER</p>
          {filteredMentions(mentionMenu.filter).map((item, i) => (
            <div
              key={item.id}
              onClick={() => applyMention(item)}
              onMouseEnter={() => setMentionIdx(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                background: i === mentionIdx ? '#f1f3f5' : 'transparent',
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: item.type === 'person' ? 'rgba(99,102,241,0.12)' : 'rgba(59,130,246,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.72rem', fontWeight: 800,
                color: item.type === 'person' ? '#6366f1' : '#3b82f6',
                flexShrink: 0,
              }}>
                {item.type === 'person' ? item.label.split(' ').map(w => w[0]).join('').slice(0, 2) : item.label.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600 }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8' }}>{item.type === 'person' ? item.sub || 'Membre' : 'Service'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
