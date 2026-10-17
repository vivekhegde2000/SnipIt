/**
 * Editor height. Containers set `--editor-height` (responsively), so the real editor and its
 * loading placeholder are always exactly the same size. Kept out of CodeEditor.tsx so importing
 * it never pulls CodeMirror into the main bundle.
 */
export const EDITOR_HEIGHT = 'var(--editor-height, 240px)'
