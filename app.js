/* ==========================================================================
   Folio — Markdown studio
   Application logic: rendering, view modes, theming, templates, localisation
   and export to Word / HTML / Markdown.
   ========================================================================== */

(() => {
  'use strict';

  const STORAGE_KEY = 'folio.state.v1';
  const TOAST_MS = 2000;

  /* ------------------------------------------------------------------------
     Font stacks. Word and the browser both read the first available family.
     ------------------------------------------------------------------------ */

  const FONT_SERIF = '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, "Times New Roman", serif';
  const FONT_GEORGIA = 'Georgia, "Times New Roman", serif';
  const FONT_GARAMOND = '"EB Garamond", Garamond, "Book Antiqua", "Palatino Linotype", serif';
  const FONT_CHARTER = 'Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif';
  const FONT_HUMANIST = 'Optima, Candara, "Gill Sans", "Gill Sans MT", "Trebuchet MS", sans-serif';
  const FONT_GROTESK = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const FONT_VERDANA = 'Verdana, Geneva, Tahoma, sans-serif';
  const FONT_MONO = '"SFMono-Regular", "JetBrains Mono", Menlo, Consolas, "Liberation Mono", monospace';
  const FONT_CONSOLAS = 'Consolas, "Liberation Mono", Menlo, monospace';
  const FONT_COURIER = '"Courier New", Courier, monospace';
  const FONT_PLEX = '"IBM Plex Mono", "DejaVu Sans Mono", "Courier New", monospace';

  const FONT_OPTIONS = [
    { label: 'Iowan / Palatino', css: FONT_SERIF },
    { label: 'Georgia', css: FONT_GEORGIA },
    { label: 'Garamond', css: FONT_GARAMOND },
    { label: 'Charter / Cambria', css: FONT_CHARTER },
    { label: 'Optima / Candara', css: FONT_HUMANIST },
    { label: 'Helvetica / Arial', css: FONT_GROTESK },
    { label: 'Verdana', css: FONT_VERDANA },
  ];

  const MONO_OPTIONS = [
    { label: 'JetBrains / Menlo', css: FONT_MONO },
    { label: 'Consolas', css: FONT_CONSOLAS },
    { label: 'IBM Plex Mono', css: FONT_PLEX },
    { label: 'Courier', css: FONT_COURIER },
  ];

  /* Heading size ratios relative to the base size. */
  const HEADING_RATIOS = [2, 1.6, 1.32, 1.15, 1, 0.9];
  const HEADING_PT_RATIOS = [2, 1.55, 1.28, 1.12, 1, 0.92];

  /* Theme-aware default colours. Custom colours survive a theme switch. */
  const THEME_COLORS = {
    light: { headingColor: '#191a1c', linkColor: '#1f6f78', codeBg: '#ededf0' },
    dark: { headingColor: '#f1f1ec', linkColor: '#69ccc1', codeBg: '#23262b' },
  };

  const DEFAULT_TEMPLATE = Object.freeze({
    preset: 'minimal',
    bodyFont: FONT_SERIF,
    baseSize: 16,
    lineHeight: 1.6,
    paraSpacing: 0.75,
    textAlign: 'left',
    linkColor: THEME_COLORS.light.linkColor,
    headingFont: 'inherit',
    headingColor: THEME_COLORS.light.headingColor,
    headingWeight: 700,
    headingScale: 1,
    headingCase: 'normal',
    numberHeadings: false,
    numberDepth: 3,
    monoFont: FONT_MONO,
    codeBg: THEME_COLORS.light.codeBg,
    pageSize: 'A4',
    pageMargin: 22,
  });

  const PRESETS = {
    minimal: {
      bodyFont: FONT_SERIF, baseSize: 16, lineHeight: 1.6, paraSpacing: 0.75,
      textAlign: 'left', headingFont: 'inherit', headingWeight: 700, headingScale: 1,
      headingCase: 'normal', numberHeadings: false, numberDepth: 3, monoFont: FONT_MONO,
      pageSize: 'A4', pageMargin: 22,
    },
    report: {
      bodyFont: FONT_HUMANIST, baseSize: 15, lineHeight: 1.5, paraSpacing: 0.6,
      textAlign: 'justify', headingFont: 'inherit', headingWeight: 700, headingScale: 0.95,
      headingCase: 'normal', numberHeadings: true, numberDepth: 3, monoFont: FONT_CONSOLAS,
      pageSize: 'A4', pageMargin: 25,
    },
    book: {
      bodyFont: FONT_GARAMOND, baseSize: 17, lineHeight: 1.75, paraSpacing: 0.35,
      textAlign: 'justify', headingFont: FONT_GARAMOND, headingWeight: 600, headingScale: 1.05,
      headingCase: 'normal', numberHeadings: true, numberDepth: 2, monoFont: FONT_COURIER,
      pageSize: 'A4', pageMargin: 24,
    },
    modern: {
      bodyFont: FONT_GROTESK, baseSize: 16, lineHeight: 1.65, paraSpacing: 1,
      textAlign: 'left', headingFont: FONT_GROTESK, headingWeight: 800, headingScale: 1.1,
      headingCase: 'uppercase', numberHeadings: false, numberDepth: 3, monoFont: FONT_PLEX,
      pageSize: 'Letter', pageMargin: 20,
    },
  };

  /* ------------------------------------------------------------------------
     Interface translations: English, Spanish, Valencian.
     ------------------------------------------------------------------------ */

  const I18N = {
    en: {
      'app.tagline': 'Markdown studio',
      'mode.group': 'View mode',
      'mode.editor': 'Editor',
      'mode.split': 'Split',
      'mode.preview': 'Preview',
      'toolbar.language': 'Language',
      'toolbar.template': 'Template',
      'toolbar.theme': 'Theme',
      'toolbar.themeLight': 'Switch to light theme',
      'toolbar.themeDark': 'Switch to dark theme',
      'doc.title': 'Document title',
      'action.save': 'Save',
      'action.saveAs': 'Save as',
      'action.listUnordered': 'Bulleted list',
      'action.listOrdered': 'Numbered list',
      'action.smartTable': 'Smart table',
      'toast.noSelection': 'Select some text first',
      'confirm.tableHeader': 'Does the first line contain the column headers?',
      'table.columnPrefix': 'Column',
      'editor.label': 'Markdown editor',
      'editor.placeholder': 'Write Markdown here…',
      'panel.title': 'Style template',
      'panel.close': 'Close',
      'panel.preset': 'Preset',
      'panel.typography': 'Body text',
      'panel.bodyFont': 'Font family',
      'panel.baseSize': 'Base size',
      'panel.lineHeight': 'Line height',
      'panel.paraSpacing': 'Paragraph spacing',
      'panel.textAlign': 'Alignment',
      'panel.alignLeft': 'Left',
      'panel.alignJustify': 'Justified',
      'panel.linkColor': 'Link color',
      'panel.headings': 'Headings',
      'panel.headingFont': 'Font family',
      'panel.headingMatch': 'Match body text',
      'panel.headingColor': 'Color',
      'panel.headingWeight': 'Weight',
      'panel.headingScale': 'Scale',
      'panel.headingCase': 'Letter case',
      'panel.caseNormal': 'Normal',
      'panel.caseUpper': 'Uppercase',
      'panel.caseSmallCaps': 'Small caps',
      'panel.numberHeadings': 'Number headings',
      'panel.numberDepth': 'Numbering depth',
      'panel.code': 'Code',
      'panel.monoFont': 'Monospace font',
      'panel.codeBg': 'Background',
      'panel.page': 'Page & export',
      'panel.pageSize': 'Paper size',
      'panel.pageMargin': 'Margin',
      'panel.reset': 'Reset template',
      'status.words': 'words',
      'status.chars': 'characters',
      'status.reading': 'min read',
      'status.template': 'Template',
      'action.exportWord': 'Export to Word',
      'action.exportHtml': 'Export HTML',
      'action.exportMarkdown': 'Download .md',
      'toast.exported': 'File exported',
      'toast.word': 'Word document exported',
      'toast.saved': 'Document saved',
      'toast.saveError': 'Could not save the document. Check the console for details.',
      'toast.reset': 'Template reset',
      'empty.preview': 'Start typing to see the preview.',
      'preset.minimal': 'Minimal',
      'preset.report': 'Report',
      'preset.book': 'Book',
      'preset.modern': 'Modern',
      'preset.custom': 'Custom',
    },
    es: {
      'app.tagline': 'Estudio Markdown',
      'mode.group': 'Modo de vista',
      'mode.editor': 'Editor',
      'mode.split': 'Dividida',
      'mode.preview': 'Vista previa',
      'toolbar.language': 'Idioma',
      'toolbar.template': 'Plantilla',
      'toolbar.theme': 'Tema',
      'toolbar.themeLight': 'Cambiar a tema claro',
      'toolbar.themeDark': 'Cambiar a tema oscuro',
      'doc.title': 'Título del documento',
      'action.save': 'Guardar',
      'action.saveAs': 'Guardar como',
      'action.listUnordered': 'Lista con viñetas',
      'action.listOrdered': 'Lista numerada',
      'action.smartTable': 'Tabla inteligente',
      'toast.noSelection': 'Selecciona primero algo de texto',
      'confirm.tableHeader': '¿La primera línea contiene las cabeceras de columna?',
      'table.columnPrefix': 'Columna',
      'editor.label': 'Editor de Markdown',
      'editor.placeholder': 'Escribe Markdown aquí…',
      'panel.title': 'Plantilla de estilo',
      'panel.close': 'Cerrar',
      'panel.preset': 'Ajuste predefinido',
      'panel.typography': 'Texto del cuerpo',
      'panel.bodyFont': 'Tipografía',
      'panel.baseSize': 'Tamaño base',
      'panel.lineHeight': 'Interlineado',
      'panel.paraSpacing': 'Espacio entre párrafos',
      'panel.textAlign': 'Alineación',
      'panel.alignLeft': 'Izquierda',
      'panel.alignJustify': 'Justificado',
      'panel.linkColor': 'Color de enlaces',
      'panel.headings': 'Títulos',
      'panel.headingFont': 'Tipografía',
      'panel.headingMatch': 'Igual que el cuerpo',
      'panel.headingColor': 'Color',
      'panel.headingWeight': 'Grosor',
      'panel.headingScale': 'Escala',
      'panel.headingCase': 'Mayúsculas',
      'panel.caseNormal': 'Normal',
      'panel.caseUpper': 'Mayúsculas',
      'panel.caseSmallCaps': 'Versalitas',
      'panel.numberHeadings': 'Numerar títulos',
      'panel.numberDepth': 'Profundidad',
      'panel.code': 'Código',
      'panel.monoFont': 'Tipografía monoespaciada',
      'panel.codeBg': 'Fondo',
      'panel.page': 'Página y exportación',
      'panel.pageSize': 'Tamaño de papel',
      'panel.pageMargin': 'Margen',
      'panel.reset': 'Restablecer plantilla',
      'status.words': 'palabras',
      'status.chars': 'caracteres',
      'status.reading': 'min de lectura',
      'status.template': 'Plantilla',
      'action.exportWord': 'Exportar a Word',
      'action.exportHtml': 'Exportar HTML',
      'action.exportMarkdown': 'Descargar .md',
      'toast.exported': 'Archivo exportado',
      'toast.word': 'Documento de Word exportado',
      'toast.saved': 'Documento guardado',
      'toast.saveError': 'No se pudo guardar el documento. Consulta la consola para más detalles.',
      'toast.reset': 'Plantilla restablecida',
      'empty.preview': 'Empieza a escribir para ver la vista previa.',
      'preset.minimal': 'Minimalista',
      'preset.report': 'Informe',
      'preset.book': 'Libro',
      'preset.modern': 'Moderno',
      'preset.custom': 'Personalizada',
    },
    val: {
      'app.tagline': 'Estudi Markdown',
      'mode.group': 'Mode de vista',
      'mode.editor': 'Editor',
      'mode.split': 'Dividida',
      'mode.preview': 'Vista prèvia',
      'toolbar.language': 'Idioma',
      'toolbar.template': 'Plantilla',
      'toolbar.theme': 'Tema',
      'toolbar.themeLight': 'Canviar a tema clar',
      'toolbar.themeDark': 'Canviar a tema fosc',
      'doc.title': 'Títol del document',
      'action.save': 'Guardar',
      'action.saveAs': 'Guardar com',
      'action.listUnordered': 'Llista amb pics',
      'action.listOrdered': 'Llista numerada',
      'action.smartTable': 'Taula intel·ligent',
      'toast.noSelection': 'Selecciona primer un text',
      'confirm.tableHeader': 'La primera línia conté les capçaleres de columna?',
      'table.columnPrefix': 'Columna',
      'editor.label': 'Editor de Markdown',
      'editor.placeholder': 'Escriu Markdown ací…',
      'panel.title': 'Plantilla d’estil',
      'panel.close': 'Tancar',
      'panel.preset': 'Ajust predefinit',
      'panel.typography': 'Text del cos',
      'panel.bodyFont': 'Tipografia',
      'panel.baseSize': 'Tamany base',
      'panel.lineHeight': 'Interlineat',
      'panel.paraSpacing': 'Espai entre paràgrafs',
      'panel.textAlign': 'Alineació',
      'panel.alignLeft': 'Esquerra',
      'panel.alignJustify': 'Justificat',
      'panel.linkColor': 'Color d’enllaços',
      'panel.headings': 'Títols',
      'panel.headingFont': 'Tipografia',
      'panel.headingMatch': 'Igual que el cos',
      'panel.headingColor': 'Color',
      'panel.headingWeight': 'Grossor',
      'panel.headingScale': 'Escala',
      'panel.headingCase': 'Majúscules',
      'panel.caseNormal': 'Normal',
      'panel.caseUpper': 'Majúscules',
      'panel.caseSmallCaps': 'Versaletes',
      'panel.numberHeadings': 'Numerar títols',
      'panel.numberDepth': 'Profunditat',
      'panel.code': 'Codi',
      'panel.monoFont': 'Tipografia monoespaiada',
      'panel.codeBg': 'Fons',
      'panel.page': 'Pàgina i exportació',
      'panel.pageSize': 'Tamany de paper',
      'panel.pageMargin': 'Marge',
      'panel.reset': 'Restablir plantilla',
      'status.words': 'paraules',
      'status.chars': 'caràcters',
      'status.reading': 'min de lectura',
      'status.template': 'Plantilla',
      'action.exportWord': 'Exportar a Word',
      'action.exportHtml': 'Exportar HTML',
      'action.exportMarkdown': 'Descàrregar .md',
      'toast.exported': 'Arxiu exportat',
      'toast.word': 'Document de Word exportat',
      'toast.saved': 'Document guardat',
      'toast.saveError': 'No s’ha pogut guardar el document. Consulta la consola per a més detalls.',
      'toast.reset': 'Plantilla restablida',
      'empty.preview': 'Comença a escriure per a vore la vista prèvia.',
      'preset.minimal': 'Minimaliste',
      'preset.report': 'Informe',
      'preset.book': 'Llibre',
      'preset.modern': 'Modern',
      'preset.custom': 'Personalitzada',
    },
  };

  /* ------------------------------------------------------------------------
     Sample document.
     ------------------------------------------------------------------------ */

  const SAMPLE_MARKDOWN = `# Folio

**Folio** is a small Markdown studio. Write on the left, watch it render on
the right, shape the typography, then export a clean Word file that keeps the
styles you designed.

## Why it exists

Most editors either bury the styling or lock it away. Folio keeps the template
in plain view:

1. Pick a preset or tune every value.
2. Number the headings when the document is sequential.
3. Export to Word with the same styles you previewed.

> A document should look the way its author intended.

## Features

- Three view modes: editor, split and preview
- Light and dark themes
- A CSS-style template with live preview
- Word, HTML and Markdown export

### Code

\`\`\`js
const greeting = (name) => \`Hello, \${name}\`;
console.log(greeting("world"));
\`\`\`

### Table

| Mode    | What it shows          |
| ------- | ---------------------- |
| Editor  | Markdown source        |
| Split   | Source and preview     |
| Preview | Rendered document      |

---

*Folio* runs offline with no dependencies beyond Marked.
`;

  /* ------------------------------------------------------------------------
     Small utilities.
     ------------------------------------------------------------------------ */

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /**
   * Round a number to a fixed number of decimals and drop trailing zeros.
   * @param {number} value - Number to round.
   * @param {number} [decimals=2] - Decimal places to keep.
   * @returns {number} The rounded number.
   */
  const round = (value, decimals = 2) => Number(value.toFixed(decimals));

  /**
   * Delay a function until it stops being called for the given time.
   * @param {Function} callback - Function to debounce.
   * @param {number} [wait=150] - Idle time in milliseconds.
   * @returns {Function} The debounced function.
   */
  const debounce = (callback, wait = 150) => {
    let timer = 0;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => callback(...args), wait);
    };
  };

  /**
   * Turn a title into a safe file name.
   * @param {string} text - Source title.
   * @returns {string} A slug suitable for downloads.
   */
  const slugify = (text) =>
    (text || 'document')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'document';

  /**
   * Escape text before putting it inside an HTML string.
   * @param {string} text - Raw text.
   * @returns {string} Escaped text.
   */
  const escapeHtml = (text) =>
    String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  /**
   * Trigger a browser download for a blob.
   * @param {Blob} blob - File contents.
   * @param {string} filename - Suggested file name.
   */
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /* ------------------------------------------------------------------------
     Markdown rendering and sanitisation.
     ------------------------------------------------------------------------ */

  /**
   * Remove dangerous nodes and attributes from rendered HTML.
   * @param {string} html - HTML produced by Marked.
   * @returns {string} Safe HTML markup.
   */
  const sanitizeHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const blocked = 'script,style,iframe,object,embed,form,link,meta,base';
    doc.querySelectorAll(blocked).forEach((node) => node.remove());
    doc.querySelectorAll('*').forEach((node) => {
      Array.from(node.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();
        const isHandler = name.startsWith('on');
        const isScriptUrl = (name === 'href' || name === 'src') && value.startsWith('javascript:');
        if (isHandler || isScriptUrl) {
          node.removeAttribute(attr.name);
        }
      });
    });
    return doc.body.innerHTML;
  };

  /**
   * Prefix headings with hierarchical numbers such as 1, 1.1, 1.1.1.
   * @param {HTMLElement} root - Container holding the rendered document.
   * @param {number} depth - Deepest heading level to number.
   */
  const numberHeadings = (root, depth) => {
    const counters = [0, 0, 0, 0, 0, 0];
    root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
      const level = Number(heading.tagName.charAt(1));
      counters[level - 1] += 1;
      for (let i = level; i < counters.length; i += 1) {
        counters[i] = 0;
      }
      if (level > depth) {
        return;
      }
      const label = counters.slice(0, level).join('.');
      const span = document.createElement('span');
      span.className = 'h-num';
      span.textContent = `${label}\u00a0\u00a0`;
      heading.prepend(span);
    });
  };

  /**
   * Render Markdown into safe HTML, applying heading numbering when enabled.
   * @param {string} markdown - Source Markdown.
   * @param {object} template - Active style template.
   * @returns {string} Rendered, sanitised HTML.
   */
  const renderDocument = (markdown, template) => {
    const clean = sanitizeHtml(marked.parse(markdown || ''));
    const holder = document.createElement('div');
    holder.innerHTML = clean;
    if (template.numberHeadings) {
      numberHeadings(holder, template.numberDepth);
    }
    return holder.innerHTML;
  };

  /* ------------------------------------------------------------------------
     State.
     ------------------------------------------------------------------------ */

  const state = {
    content: SAMPLE_MARKDOWN,
    title: 'Untitled document',
    mode: 'split',
    theme: 'light',
    lang: 'en',
    template: { ...DEFAULT_TEMPLATE },
  };

  let toastTimer = 0;
  let currentFileHandle = null;

  /* ------------------------------------------------------------------------
     Persistence.
     ------------------------------------------------------------------------ */

  const loadState = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!stored) {
        return;
      }
      Object.assign(state, {
        content: typeof stored.content === 'string' ? stored.content : state.content,
        title: stored.title || state.title,
        mode: ['editor', 'split', 'preview'].includes(stored.mode) ? stored.mode : state.mode,
        theme: stored.theme === 'dark' ? 'dark' : 'light',
        lang: I18N[stored.lang] ? stored.lang : state.lang,
      });
      state.template = { ...DEFAULT_TEMPLATE, ...(stored.template || {}) };
    } catch (error) {
      console.warn('Folio: could not restore the saved session.', error);
    }
  };

  const saveState = debounce(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Folio: could not save the session.', error);
    }
  }, 300);

  /* ------------------------------------------------------------------------
     Cached elements.
     ------------------------------------------------------------------------ */

  const el = {};

  const cacheDom = () => {
    el.app = $('.app');
    el.editor = $('#editor');
    el.preview = $('#preview');
    el.docTitle = $('#doc-title');
    el.langSelect = $('#lang-select');
    el.themeToggle = $('#theme-toggle');
    el.templateToggle = $('#template-toggle');
    el.panel = $('#template-panel');
    el.panelClose = $('#panel-close');
    el.scrim = $('#scrim');
    el.toast = $('#toast');
    el.statWords = $('#stat-words');
    el.statChars = $('#stat-chars');
    el.statReading = $('#stat-reading');
    el.statTemplate = $('#stat-template');
    el.controls = {
      preset: $('#tpl-preset'),
      bodyFont: $('#tpl-body-font'),
      headingFont: $('#tpl-heading-font'),
      monoFont: $('#tpl-mono-font'),
      baseSize: $('#tpl-base-size'),
      lineHeight: $('#tpl-line-height'),
      paraSpacing: $('#tpl-para-spacing'),
      align: $('#tpl-align'),
      linkColor: $('#tpl-link-color'),
      headingColor: $('#tpl-heading-color'),
      headingWeight: $('#tpl-heading-weight'),
      headingScale: $('#tpl-heading-scale'),
      headingCase: $('#tpl-heading-case'),
      numberHeadings: $('#tpl-number-headings'),
      numberDepth: $('#tpl-number-depth'),
      codeBg: $('#tpl-code-bg'),
      pageSize: $('#tpl-page-size'),
      pageMargin: $('#tpl-page-margin'),
    };
    el.outputs = {
      baseSize: $('#out-base-size'),
      lineHeight: $('#out-line-height'),
      paraSpacing: $('#out-para-spacing'),
      headingWeight: $('#out-heading-weight'),
      headingScale: $('#out-heading-scale'),
      numberDepth: $('#out-number-depth'),
      pageMargin: $('#out-page-margin'),
    };
    el.exportWord = $('#export-word');
    el.exportHtml = $('#export-html');
    el.exportMd = $('#export-md');
    el.save = $('#save-document');
    el.saveAs = $('#save-as-document');
    el.listUnordered = $('#list-unordered');
    el.listOrdered = $('#list-ordered');
    el.smartTable = $('#smart-table');
    el.reset = $('#tpl-reset');
  };

  /* ------------------------------------------------------------------------
     Theming, localisation and view modes.
     ------------------------------------------------------------------------ */

  const applyTheme = () => {
    document.documentElement.dataset.theme = state.theme;
    el.themeToggle.setAttribute('aria-pressed', String(state.theme === 'dark'));
    const dark = state.theme === 'dark';
    el.themeToggle.dataset.i18nTitle = dark ? 'toolbar.themeLight' : 'toolbar.themeDark';
    el.themeToggle.title = I18N[state.lang][el.themeToggle.dataset.i18nTitle];
  };

  const t = (key) => (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;

  const applyLanguage = () => {
    document.documentElement.lang = state.lang === 'val' ? 'ca' : state.lang;
    $$('[data-i18n]').forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    $$('[data-i18n-placeholder]').forEach((node) => {
      node.placeholder = t(node.dataset.i18nPlaceholder);
    });
    $$('[data-i18n-title]').forEach((node) => {
      node.title = t(node.dataset.i18nTitle);
    });
    $$('[data-i18n-aria-label]').forEach((node) => {
      node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel));
    });
    applyTheme();
    renderStatus();
  };

  const applyMode = () => {
    el.app.dataset.mode = state.mode;
    $$('.seg-btn').forEach((button) => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  /* ------------------------------------------------------------------------
     Template application.
     ------------------------------------------------------------------------ */

  const resolveHeadingFont = (template) =>
    template.headingFont === 'inherit' ? template.bodyFont : template.headingFont;

  /**
   * Push the active template into the preview as CSS custom properties.
   */
  const applyTemplateToPreview = () => {
    const template = state.template;
    const style = el.preview.style;
    const base = `${template.baseSize}px`;
    style.setProperty('--doc-body-font', template.bodyFont);
    style.setProperty('--doc-heading-font', template.headingFont);
    style.setProperty('--doc-mono-font', template.monoFont);
    style.setProperty('--doc-base', base);
    style.setProperty('--doc-line', template.lineHeight);
    style.setProperty('--doc-para', `${template.paraSpacing}em`);
    style.setProperty('--doc-align', template.textAlign);
    style.setProperty('--doc-link', template.linkColor);
    style.setProperty('--doc-code-bg', template.codeBg);
    style.setProperty('--doc-heading-color', template.headingColor);
    style.setProperty('--doc-heading-weight', template.headingWeight);
    style.setProperty('--doc-heading-case', template.headingCase === 'small-caps' ? 'none' : template.headingCase);
    style.setProperty('--doc-heading-variant', template.headingCase === 'small-caps' ? 'small-caps' : 'normal');
    HEADING_RATIOS.forEach((ratio, index) => {
      style.setProperty(`--doc-h${index + 1}`, `calc(${base} * ${round(ratio * template.headingScale, 3)})`);
    });
  };

  /**
   * Fill every template control with the current state values.
   */
  const renderTemplateControls = () => {
    const template = state.template;
    const controls = el.controls;
    controls.preset.value = template.preset;
    controls.bodyFont.value = template.bodyFont;
    controls.headingFont.value = template.headingFont;
    controls.monoFont.value = template.monoFont;
    controls.baseSize.value = template.baseSize;
    controls.lineHeight.value = template.lineHeight;
    controls.paraSpacing.value = template.paraSpacing;
    controls.align.value = template.textAlign;
    controls.linkColor.value = template.linkColor;
    controls.headingColor.value = template.headingColor;
    controls.headingWeight.value = template.headingWeight;
    controls.headingScale.value = template.headingScale;
    controls.headingCase.value = template.headingCase;
    controls.numberHeadings.checked = template.numberHeadings;
    controls.numberDepth.value = template.numberDepth;
    controls.codeBg.value = template.codeBg;
    controls.pageSize.value = template.pageSize;
    controls.pageMargin.value = template.pageMargin;
    updateOutputs();
  };

  const updateOutputs = () => {
    const template = state.template;
    el.outputs.baseSize.value = `${template.baseSize}px`;
    el.outputs.lineHeight.value = template.lineHeight.toFixed(2);
    el.outputs.paraSpacing.value = `${template.paraSpacing.toFixed(1)}em`;
    el.outputs.headingWeight.value = template.headingWeight;
    el.outputs.headingScale.value = `${template.headingScale.toFixed(2)}×`;
    el.outputs.numberDepth.value = template.numberDepth;
    el.outputs.pageMargin.value = `${template.pageMargin}mm`;
  };

  /**
   * Merge a change into the template and refresh the interface.
   * @param {object} patch - Template keys to update.
   */
  const patchTemplate = (patch) => {
    state.template = { ...state.template, ...patch };
    if (!('preset' in patch)) {
      state.template.preset = 'custom';
    }
    renderTemplateControls();
    applyTemplateToPreview();
    renderStatus();
    if ('numberHeadings' in patch || 'numberDepth' in patch) {
      renderPreview();
    }
    saveState();
  };

  const applyPreset = (name) => {
    const preset = PRESETS[name];
    if (!preset) {
      return;
    }
    const colors = THEME_COLORS[state.theme];
    state.template = { ...state.template, ...preset, preset: name, ...colors };
    renderTemplateControls();
    applyTemplateToPreview();
    renderPreview();
    renderStatus();
    saveState();
  };

  const syncThemeColors = (previous, next) => {
    const before = THEME_COLORS[previous];
    const after = THEME_COLORS[next];
    const patch = {};
    ['headingColor', 'linkColor', 'codeBg'].forEach((key) => {
      if (state.template[key] === before[key]) {
        patch[key] = after[key];
      }
    });
    state.template = { ...state.template, ...patch };
  };

  /* ------------------------------------------------------------------------
     Rendering the preview and status.
     ------------------------------------------------------------------------ */

  const renderPreview = () => {
    if (!state.content.trim()) {
      el.preview.innerHTML = `<p class="preview-empty">${escapeHtml(t('empty.preview'))}</p>`;
      return;
    }
    el.preview.innerHTML = renderDocument(state.content, state.template);
  };

  const renderStatus = () => {
    const words = state.content.trim() ? state.content.trim().split(/\s+/).length : 0;
    el.statWords.textContent = words.toLocaleString(state.lang === 'val' ? 'ca' : state.lang);
    el.statChars.textContent = state.content.length.toLocaleString(state.lang === 'val' ? 'ca' : state.lang);
    el.statReading.textContent = String(Math.max(1, Math.ceil(words / 200)));
    const name = state.template.preset;
    el.statTemplate.textContent = name === 'custom' ? t('preset.custom') : t(`preset.${name}`);
  };

  const render = () => {
    renderPreview();
    renderStatus();
  };

  /* ------------------------------------------------------------------------
     Export stylesheet shared by Word and HTML exports.
     ------------------------------------------------------------------------ */

  const pageDimensions = (size) => (size === 'Letter' ? '21.59cm 27.94cm' : '21cm 29.7cm');

  /**
   * Build the CSS block used by exported documents.
   * @param {object} template - Active style template.
   * @param {boolean} forWord - Append Word-specific properties.
   * @returns {string} CSS text.
   */
  const buildDocumentCss = (template, forWord) => {
    const basePt = round(template.baseSize * 0.75);
    const paraPt = round(template.paraSpacing * basePt);
    const headingTop = round(basePt * 1.5);
    const headingBottom = round(basePt * 0.55);
    const headingFont = resolveHeadingFont(template);
    const headingCase = template.headingCase === 'small-caps' ? 'none' : template.headingCase;
    const headingVariant = template.headingCase === 'small-caps' ? 'small-caps' : 'normal';
    const lines = [];

    if (forWord) {
      lines.push(
        `@page WordSection1 { size: ${pageDimensions(template.pageSize)}; margin: ${template.pageMargin}mm; }`,
        '.WordSection1 { page: WordSection1; }'
      );
    }
    lines.push(
      `body { font-family: ${template.bodyFont}; font-size: ${basePt}pt; line-height: ${template.lineHeight}; color: #1a1a1a; }`,
      `p { margin: 0 0 ${paraPt}pt; text-align: ${template.textAlign}; }`
    );
    HEADING_PT_RATIOS.forEach((ratio, index) => {
      const level = index + 1;
      const size = round(basePt * ratio * template.headingScale);
      const outline = forWord ? ` mso-outline-level: ${level};` : '';
      lines.push(
        `h${level} { font-family: ${headingFont}; font-size: ${size}pt; font-weight: ${template.headingWeight}; ` +
        `color: ${template.headingColor}; font-variant: ${headingVariant}; text-transform: ${headingCase}; ` +
        `line-height: 1.25; margin: ${headingTop}pt 0 ${headingBottom}pt;${outline} }`
      );
    });
    lines.push(
      '.h-num { margin-right: 0.5em; }',
      `a { color: ${template.linkColor}; text-decoration: underline; }`,
      `ul, ol { margin: 0 0 ${paraPt}pt; padding-left: 1.6em; }`,
      'li { margin-bottom: 2pt; }',
      `blockquote { margin: 0 0 ${paraPt}pt; padding-left: 10pt; border-left: 3pt solid ${template.linkColor}; color: #55585e; font-style: italic; }`,
      `code { font-family: ${template.monoFont}; font-size: 0.9em; background: ${template.codeBg}; padding: 1pt 3pt; }`,
      `pre { font-family: ${template.monoFont}; font-size: 0.86em; background: ${template.codeBg}; padding: 8pt 10pt; white-space: pre-wrap; }`,
      'pre code { background: transparent; padding: 0; }',
      'table { border-collapse: collapse; width: 100%; margin-bottom: ' + paraPt + 'pt; }',
      'th, td { border: 1pt solid #b9b9b4; padding: 5pt 7pt; text-align: left; }',
      `th { background: ${template.codeBg}; font-weight: 600; }`,
      `hr { border: 0; border-top: 1pt solid #b9b9b4; margin: 18pt 0; }`,
      'img { max-width: 100%; }'
    );
    if (!forWord) {
      lines.push(
        'body { max-width: 46rem; margin: 0 auto; padding: 3rem 2rem 6rem; background: #ffffff; }'
      );
    }
    return lines.join('\n');
  };

  /**
   * Wrap rendered content in a standalone HTML document.
   * @param {string} contentHtml - Rendered document body.
   * @param {object} template - Active style template.
   * @param {string} title - Document title.
   * @param {boolean} forWord - Use Word-compatible markup.
   * @returns {string} A complete HTML document.
   */
  const buildExportDocument = (contentHtml, template, title, forWord) => {
    const wordMeta = forWord
      ? '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>' +
        '<w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->'
      : '';
    const ns = forWord
      ? ' xmlns:o="urn:schemas-microsoft-com:office:office" ' +
        'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"'
      : '';
    return [
      `<!doctype html><html${ns}><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>`,
      wordMeta,
      `<style>${buildDocumentCss(template, forWord)}</style>`,
      '</head><body>',
      `<div class="${forWord ? 'WordSection1' : 'doc'}">${contentHtml}</div>`,
      '</body></html>',
    ].join('\n');
  };

  /* ------------------------------------------------------------------------
     Export actions.
     ------------------------------------------------------------------------ */

  const exportAs = (kind) => {
    try {
      const html = renderDocument(state.content, state.template);
      const base = slugify(state.title);
      if (kind === 'md') {
        downloadBlob(new Blob([state.content], { type: 'text/markdown;charset=utf-8' }), `${base}.md`);
        showToast(t('toast.exported'));
        return;
      }
      if (kind === 'word') {
        const doc = buildExportDocument(html, state.template, state.title, true);
        downloadBlob(new Blob([`\ufeff${doc}`], { type: 'application/msword' }), `${base}.doc`);
        showToast(t('toast.word'));
        return;
      }
      const doc = buildExportDocument(html, state.template, state.title, false);
      downloadBlob(new Blob([doc], { type: 'text/html;charset=utf-8' }), `${base}.html`);
      showToast(t('toast.exported'));
    } catch (error) {
      console.error('Folio: export failed.', error);
      alert('Export failed. See the console for details.');
    }
  };

  const saveToHandle = async (fileHandle) => {
    const writable = await fileHandle.createWritable();
    try {
      await writable.write(state.content);
      await writable.close();
    } catch (error) {
      try {
        await writable.abort();
      } catch (abortError) {
        console.warn('Folio: could not abort the failed file write.', abortError);
      }
      throw error;
    }
  };

  const saveAsDocument = async () => {
    if (typeof window.showSaveFilePicker !== 'function') {
      downloadBlob(
        new Blob([state.content], { type: 'text/markdown;charset=utf-8' }),
        `${slugify(state.title)}.md`
      );
      showToast(t('toast.saved'));
      return;
    }

    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: `${slugify(state.title)}.md`,
        types: [{
          description: 'Markdown document',
          accept: { 'text/markdown': ['.md'] },
        }],
        excludeAcceptAllOption: true,
      });
      await saveToHandle(fileHandle);
      currentFileHandle = fileHandle;
      showToast(t('toast.saved'));
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Folio: save failed.', error);
      showToast(t('toast.saveError'));
    }
  };

  const saveDocument = async () => {
    if (!currentFileHandle) {
      await saveAsDocument();
      return;
    }

    try {
      await saveToHandle(currentFileHandle);
      showToast(t('toast.saved'));
    } catch (error) {
      console.error('Folio: save failed.', error);
      showToast(t('toast.saveError'));
    }
  };

  /* ------------------------------------------------------------------------
     Text transformations: lists and smart tables.
     ------------------------------------------------------------------------ */

  const LIST_MARKER_RE = /^(?:[-*+]|\d+[.)])\s+/;

  const extractListItems = (text) => text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(LIST_MARKER_RE, '').trim());

  const toUnorderedList = (text) => {
    const items = extractListItems(text);
    if (items.length === 0) {
      return null;
    }
    return items.map((item) => `- ${item}`).join('\n');
  };

  const toOrderedList = (text) => {
    const items = extractListItems(text);
    if (items.length === 0) {
      return null;
    }
    return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
  };

  const splitTableRowCells = (line) => {
    if (line.includes('\t')) {
      return line.split(/\t+/).map((cell) => cell.trim());
    }
    if (/\s{2,}/.test(line)) {
      return line.split(/\s{2,}/).map((cell) => cell.trim());
    }
    if (line.includes(',')) {
      return line.split(',').map((cell) => cell.trim());
    }
    if (line.includes(';')) {
      return line.split(';').map((cell) => cell.trim());
    }
    return [line.trim()];
  };

  const escapeTableCell = (cell) => cell.replace(/\|/g, '\\|');

  const buildSmartTable = (text, hasHeader, columnPrefix) => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length === 0) {
      return null;
    }

    const rows = lines.map(splitTableRowCells);
    const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const normalizedRows = rows.map((row) => {
      const padded = row.slice();
      while (padded.length < columnCount) {
        padded.push('');
      }
      return padded;
    });

    const headerRow = hasHeader
      ? normalizedRows[0]
      : Array.from({ length: columnCount }, (_, index) => `${columnPrefix} ${index + 1}`);
    const bodyRows = hasHeader ? normalizedRows.slice(1) : normalizedRows;

    const formatRow = (cells) => `| ${cells.map(escapeTableCell).join(' | ')} |`;
    const separatorRow = `| ${Array(columnCount).fill('---').join(' | ')} |`;

    return [formatRow(headerRow), separatorRow, ...bodyRows.map(formatRow)].join('\n');
  };

  const applySelectionTransform = (transformFn) => {
    const start = el.editor.selectionStart;
    const end = el.editor.selectionEnd;
    if (start === end) {
      showToast(t('toast.noSelection'));
      return;
    }
    const selected = el.editor.value.slice(start, end);
    const result = transformFn(selected);
    if (result === null) {
      showToast(t('toast.noSelection'));
      return;
    }
    el.editor.setRangeText(result, start, end, 'end');
    state.content = el.editor.value;
    renderStatus();
    saveState();
    scheduleRender();
  };

  const transformSelectionToUnorderedList = () => applySelectionTransform(toUnorderedList);

  const transformSelectionToOrderedList = () => applySelectionTransform(toOrderedList);

  const transformSelectionToSmartTable = () => applySelectionTransform((text) =>
    buildSmartTable(text, window.confirm(t('confirm.tableHeader')), t('table.columnPrefix'))
  );

  /* ------------------------------------------------------------------------
     UI helpers.
     ------------------------------------------------------------------------ */

  const showToast = (message) => {
    el.toast.textContent = message;
    el.toast.hidden = false;
    requestAnimationFrame(() => el.toast.classList.add('is-visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.classList.remove('is-visible');
      setTimeout(() => { el.toast.hidden = true; }, 200);
    }, TOAST_MS);
  };

  const openPanel = () => {
    el.panel.classList.add('is-open');
    el.panel.setAttribute('aria-hidden', 'false');
    el.templateToggle.setAttribute('aria-expanded', 'true');
    el.scrim.hidden = false;
    requestAnimationFrame(() => el.scrim.classList.add('is-visible'));
    el.controls.preset.focus();
  };

  const closePanel = () => {
    el.panel.classList.remove('is-open');
    el.panel.setAttribute('aria-hidden', 'true');
    el.templateToggle.setAttribute('aria-expanded', 'false');
    el.scrim.classList.remove('is-visible');
    setTimeout(() => { el.scrim.hidden = true; }, 200);
    el.templateToggle.focus();
  };

  /* ------------------------------------------------------------------------
     Building selects for fonts.
     ------------------------------------------------------------------------ */

  const fillFontSelect = (select, options, extra) => {
    const entries = extra ? [extra, ...options] : options;
    entries.forEach((option) => {
      const node = document.createElement('option');
      node.value = option.css;
      node.textContent = option.label;
      if (option.i18n) {
        node.dataset.i18n = option.i18n;
      }
      select.appendChild(node);
    });
  };

  /* ------------------------------------------------------------------------
     Event wiring.
     ------------------------------------------------------------------------ */

  const bindEvents = () => {
    $$('.seg-btn').forEach((button) => {
      button.addEventListener('click', () => {
        state.mode = button.dataset.mode;
        applyMode();
        saveState();
      });
    });

    el.themeToggle.addEventListener('click', () => {
      const previous = state.theme;
      state.theme = previous === 'dark' ? 'light' : 'dark';
      syncThemeColors(previous, state.theme);
      applyTheme();
      applyTemplateToPreview();
      renderTemplateControls();
      renderPreview();
      saveState();
    });

    el.langSelect.addEventListener('change', () => {
      state.lang = el.langSelect.value;
      applyLanguage();
      renderStatus();
      renderPreview();
      saveState();
    });

    el.docTitle.addEventListener('input', () => {
      state.title = el.docTitle.value;
      saveState();
    });

    el.templateToggle.addEventListener('click', openPanel);
    el.panelClose.addEventListener('click', closePanel);
    el.scrim.addEventListener('click', closePanel);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && el.panel.classList.contains('is-open')) {
        closePanel();
      }
    });

    el.editor.addEventListener('input', () => {
      state.content = el.editor.value;
      renderStatus();
      saveState();
      scheduleRender();
    });

    el.editor.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') {
        return;
      }
      event.preventDefault();
      const start = el.editor.selectionStart;
      const end = el.editor.selectionEnd;
      el.editor.setRangeText('  ', start, end, 'end');
      state.content = el.editor.value;
      renderStatus();
      saveState();
      scheduleRender();
    });

    bindTemplateControls();
    el.save.addEventListener('click', saveDocument);
    el.saveAs.addEventListener('click', saveAsDocument);
    el.listUnordered.addEventListener('click', transformSelectionToUnorderedList);
    el.listOrdered.addEventListener('click', transformSelectionToOrderedList);
    el.smartTable.addEventListener('click', transformSelectionToSmartTable);
    el.exportWord.addEventListener('click', () => exportAs('word'));
    el.exportHtml.addEventListener('click', () => exportAs('html'));
    el.exportMd.addEventListener('click', () => exportAs('md'));
  };

  const bindTemplateControls = () => {
    const controls = el.controls;
    controls.preset.addEventListener('change', () => {
      if (controls.preset.value === 'custom') {
        return;
      }
      applyPreset(controls.preset.value);
    });
    controls.bodyFont.addEventListener('change', () => patchTemplate({ bodyFont: controls.bodyFont.value }));
    controls.headingFont.addEventListener('change', () => patchTemplate({ headingFont: controls.headingFont.value }));
    controls.monoFont.addEventListener('change', () => patchTemplate({ monoFont: controls.monoFont.value }));
    controls.baseSize.addEventListener('input', () => patchTemplate({ baseSize: Number(controls.baseSize.value) }));
    controls.lineHeight.addEventListener('input', () => patchTemplate({ lineHeight: Number(controls.lineHeight.value) }));
    controls.paraSpacing.addEventListener('input', () => patchTemplate({ paraSpacing: Number(controls.paraSpacing.value) }));
    controls.align.addEventListener('change', () => patchTemplate({ textAlign: controls.align.value }));
    controls.linkColor.addEventListener('input', () => patchTemplate({ linkColor: controls.linkColor.value }));
    controls.headingColor.addEventListener('input', () => patchTemplate({ headingColor: controls.headingColor.value }));
    controls.headingWeight.addEventListener('input', () => patchTemplate({ headingWeight: Number(controls.headingWeight.value) }));
    controls.headingScale.addEventListener('input', () => patchTemplate({ headingScale: Number(controls.headingScale.value) }));
    controls.headingCase.addEventListener('change', () => patchTemplate({ headingCase: controls.headingCase.value }));
    controls.numberHeadings.addEventListener('change', () => patchTemplate({ numberHeadings: controls.numberHeadings.checked }));
    controls.numberDepth.addEventListener('input', () => patchTemplate({ numberDepth: Number(controls.numberDepth.value) }));
    controls.codeBg.addEventListener('input', () => patchTemplate({ codeBg: controls.codeBg.value }));
    controls.pageSize.addEventListener('change', () => patchTemplate({ pageSize: controls.pageSize.value }));
    controls.pageMargin.addEventListener('input', () => patchTemplate({ pageMargin: Number(controls.pageMargin.value) }));
    el.reset.addEventListener('click', () => {
      const colors = THEME_COLORS[state.theme];
      state.template = { ...DEFAULT_TEMPLATE, ...colors };
      renderTemplateControls();
      applyTemplateToPreview();
      renderPreview();
      renderStatus();
      saveState();
      showToast(t('toast.reset'));
    });
  };

  const scheduleRender = debounce(renderPreview, 120);

  /* ------------------------------------------------------------------------
     Bootstrap.
     ------------------------------------------------------------------------ */

  const init = () => {
    cacheDom();
    marked.use({ gfm: true, breaks: false });

    fillFontSelect(el.controls.bodyFont, FONT_OPTIONS);
    fillFontSelect(el.controls.headingFont, FONT_OPTIONS, {
      label: 'Match body text',
      css: 'inherit',
      i18n: 'panel.headingMatch',
    });
    fillFontSelect(el.controls.monoFont, MONO_OPTIONS);

    loadState();

    el.editor.value = state.content;
    el.docTitle.value = state.title;
    el.langSelect.value = state.lang;

    renderTemplateControls();
    applyTemplateToPreview();
    applyTheme();
    applyLanguage();
    applyMode();
    render();
    bindEvents();
  };

  document.addEventListener('DOMContentLoaded', init);
})();
