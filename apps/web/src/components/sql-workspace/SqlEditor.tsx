import { useEffect, useRef } from 'react';
import { defaultKeymap } from '@codemirror/commands';
import { sql } from '@codemirror/lang-sql';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';

type SqlEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onRun: (sqlOverride?: string) => void;
  disabled?: boolean;
};

const editableCompartment = new Compartment();

const editorTheme = EditorView.theme({
  '&': {
    fontSize: '0.8125rem',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    height: '100%',
  },
  '.cm-scroller': {
    overflow: 'auto',
    height: '100%',
  },
  '.cm-content': {
    minHeight: '100%',
    caretColor: 'var(--accent)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-muted)',
    borderRight: '1px solid var(--border)',
  },
  '&.cm-focused': {
    outline: '2px solid var(--accent-soft)',
    outlineOffset: '-1px',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--bg-hover)',
  },
});

function getSqlToRun(view: EditorView): string {
  const { from, to } = view.state.selection.main;

  if (from !== to) {
    const selected = view.state.sliceDoc(from, to).trim();

    if (selected) {
      return selected;
    }
  }

  return view.state.doc.toString();
}

export function SqlEditor({ value, onChange, onRun, disabled = false }: SqlEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);

  useEffect(() => {
    onChangeRef.current = onChange;
    onRunRef.current = onRun;
  }, [onChange, onRun]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          sql(),
          EditorView.lineWrapping,
          editorTheme,
          editableCompartment.of(EditorView.editable.of(!disabled)),
          keymap.of([
            ...defaultKeymap,
            {
              key: 'Mod-Enter',
              run: (editorView) => {
                onRunRef.current(getSqlToRun(editorView));
                return true;
              },
            },
            {
              key: 'Mod-Shift-f',
              run: () => false,
            },
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      }),
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  useEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    view.dispatch({
      effects: editableCompartment.reconfigure(EditorView.editable.of(!disabled)),
    });
  }, [disabled]);

  useEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    const current = view.state.doc.toString();

    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return <div className="sql-editor-cm sql-editor-cm--fill" ref={containerRef} />;
}
