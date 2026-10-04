/* ==========================================================================
   emdme — Markdown studio
   Application logic: rendering, view modes, theming, templates, localisation
   and export to Word / HTML / Markdown.
   ========================================================================== */

(() => {
  'use strict';

  const STORAGE_KEY = 'emdme-app.state.v1';
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

  /* Editor text size bounds, in rem. */
  const EDITOR_FONT_MIN = 0.65;
  const EDITOR_FONT_MAX = 1.6;
  const EDITOR_FONT_STEP = 0.05;
  const EDITOR_FONT_DEFAULT = 0.95;

  /* Theme-aware default colours. Custom colours survive a theme switch. */
  const THEME_COLORS = {
    light: {
      headingColor: '#191a1c', linkColor: '#1f6f78', codeBg: '#ededf0',
      tableHeadBg: '#ededf0', tableHeadColor: '#191a1c',
    },
    dark: {
      headingColor: '#f1f1ec', linkColor: '#69ccc1', codeBg: '#23262b',
      tableHeadBg: '#23262b', tableHeadColor: '#f1f1ec',
    },
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
    numberStyle: 'decimal',
    monoFont: FONT_MONO,
    codeBg: THEME_COLORS.light.codeBg,
    tableSize: 0.95,
    tablePadding: 0.5,
    tableHeadBg: THEME_COLORS.light.tableHeadBg,
    tableHeadColor: THEME_COLORS.light.tableHeadColor,
    tableHeadWeight: 600,
    pageSize: 'A4',
    pageMargin: 22,
  });

  const PRESETS = {
    minimal: {
      bodyFont: FONT_SERIF, baseSize: 16, lineHeight: 1.6, paraSpacing: 0.75,
      textAlign: 'left', headingFont: 'inherit', headingWeight: 700, headingScale: 1,
      headingCase: 'normal', numberHeadings: false, numberDepth: 3, numberStyle: 'decimal', monoFont: FONT_MONO,
      pageSize: 'A4', pageMargin: 22,
    },
    report: {
      bodyFont: FONT_HUMANIST, baseSize: 15, lineHeight: 1.5, paraSpacing: 0.6,
      textAlign: 'justify', headingFont: 'inherit', headingWeight: 700, headingScale: 0.95,
      headingCase: 'normal', numberHeadings: true, numberDepth: 3, numberStyle: 'decimal', monoFont: FONT_CONSOLAS,
      pageSize: 'A4', pageMargin: 25,
    },
    book: {
      bodyFont: FONT_GARAMOND, baseSize: 17, lineHeight: 1.75, paraSpacing: 0.35,
      textAlign: 'justify', headingFont: FONT_GARAMOND, headingWeight: 600, headingScale: 1.05,
      headingCase: 'normal', numberHeadings: true, numberDepth: 2, numberStyle: 'decimal', monoFont: FONT_COURIER,
      pageSize: 'A4', pageMargin: 24,
    },
    modern: {
      bodyFont: FONT_GROTESK, baseSize: 16, lineHeight: 1.65, paraSpacing: 1,
      textAlign: 'left', headingFont: FONT_GROTESK, headingWeight: 800, headingScale: 1.1,
      headingCase: 'uppercase', numberHeadings: false, numberDepth: 3, numberStyle: 'decimal', monoFont: FONT_PLEX,
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
      'toolbar.outline': 'Contents',
      'toolbar.theme': 'Theme',
      'toolbar.themeLight': 'Switch to light theme',
      'toolbar.themeDark': 'Switch to dark theme',
      'doc.title': 'Document title',
      'action.save': 'Save',
      'action.saveAs': 'Save as',
      'action.open': 'Open',
      'action.listUnordered': 'Bulleted list',
      'action.listOrdered': 'Numbered list',
      'action.smartTable': 'Smart table',
      'action.fontDecrease': 'Smaller',
      'action.fontIncrease': 'Larger',
      'action.bold': 'Bold',
      'action.italic': 'Italic',
      'action.strikethrough': 'Strikethrough',
      'action.heading': 'Heading',
      'action.inlineCode': 'Code',
      'action.blockquote': 'Quote',
      'action.link': 'Link',
      'toast.noSelection': 'Select some text first',
      'confirm.tableHeader': 'Does the first line contain the column headers?',
      'table.columnPrefix': 'Column',
      'editor.label': 'Markdown editor',
      'editor.placeholder': 'Write Markdown here…',
      'panel.title': 'Style template',
      'panel.close': 'Close',
      'outline.title': 'Contents',
      'outline.depth': 'Show up to level',
      'outline.empty': 'No headings yet',
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
      'panel.numberStyle': 'Numbering style',
      'panel.code': 'Code',
      'panel.monoFont': 'Monospace font',
      'panel.codeBg': 'Background',
      'panel.tables': 'Tables',
      'panel.tableHeadBg': 'Header background',
      'panel.tableHeadColor': 'Header text color',
      'panel.tableHeadWeight': 'Header weight',
      'panel.tableSize': 'Text size',
      'panel.tablePadding': 'Cell padding',
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
      'toast.opened': 'File opened',
      'toast.openError': 'Could not open the file. Check the console for details.',
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
      'toolbar.outline': 'Índice',
      'toolbar.theme': 'Tema',
      'toolbar.themeLight': 'Cambiar a tema claro',
      'toolbar.themeDark': 'Cambiar a tema oscuro',
      'doc.title': 'Título del documento',
      'action.save': 'Guardar',
      'action.saveAs': 'Guardar como',
      'action.open': 'Abrir',
      'action.listUnordered': 'Lista con viñetas',
      'action.listOrdered': 'Lista numerada',
      'action.smartTable': 'Tabla inteligente',
      'action.fontDecrease': 'Menor',
      'action.fontIncrease': 'Mayor',
      'action.bold': 'Negrita',
      'action.italic': 'Cursiva',
      'action.strikethrough': 'Tachado',
      'action.heading': 'Encabezado',
      'action.inlineCode': 'Código',
      'action.blockquote': 'Cita',
      'action.link': 'Enlace',
      'toast.noSelection': 'Selecciona primero algo de texto',
      'confirm.tableHeader': '¿La primera línea contiene las cabeceras de columna?',
      'table.columnPrefix': 'Columna',
      'editor.label': 'Editor de Markdown',
      'editor.placeholder': 'Escribe Markdown aquí…',
      'panel.title': 'Plantilla de estilo',
      'panel.close': 'Cerrar',
      'outline.title': 'Índice',
      'outline.depth': 'Mostrar hasta nivel',
      'outline.empty': 'Aún no hay títulos',
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
      'panel.numberStyle': 'Estilo de numeración',
      'panel.code': 'Código',
      'panel.monoFont': 'Tipografía monoespaciada',
      'panel.codeBg': 'Fondo',
      'panel.tables': 'Tablas',
      'panel.tableHeadBg': 'Fondo de cabecera',
      'panel.tableHeadColor': 'Color de texto de cabecera',
      'panel.tableHeadWeight': 'Grosor de cabecera',
      'panel.tableSize': 'Tamaño de texto',
      'panel.tablePadding': 'Márgenes de celda',
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
      'toast.opened': 'Archivo abierto',
      'toast.openError': 'No se pudo abrir el archivo. Consulta la consola para más detalles.',
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
      'toolbar.outline': 'Índex',
      'toolbar.theme': 'Tema',
      'toolbar.themeLight': 'Canviar a tema clar',
      'toolbar.themeDark': 'Canviar a tema fosc',
      'doc.title': 'Títol del document',
      'action.save': 'Guardar',
      'action.saveAs': 'Guardar com',
      'action.open': 'Obrir',
      'action.listUnordered': 'Llista amb pics',
      'action.listOrdered': 'Llista numerada',
      'action.smartTable': 'Taula intel·ligent',
      'action.fontDecrease': 'Menor',
      'action.fontIncrease': 'Major',
      'action.bold': 'Negreta',
      'action.italic': 'Cursiva',
      'action.strikethrough': 'Ratllat',
      'action.heading': 'Encapçalament',
      'action.inlineCode': 'Codi',
      'action.blockquote': 'Cita',
      'action.link': 'Enllaç',
      'toast.noSelection': 'Selecciona primer un text',
      'confirm.tableHeader': 'La primera línia conté les capçaleres de columna?',
      'table.columnPrefix': 'Columna',
      'editor.label': 'Editor de Markdown',
      'editor.placeholder': 'Escriu Markdown ací…',
      'panel.title': 'Plantilla d’estil',
      'panel.close': 'Tancar',
      'outline.title': 'Índex',
      'outline.depth': 'Mostrar fins a nivell',
      'outline.empty': 'Encara no hi ha títols',
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
      'panel.numberStyle': 'Estil de numeració',
      'panel.code': 'Codi',
      'panel.monoFont': 'Tipografia monoespaiada',
      'panel.codeBg': 'Fons',
      'panel.tables': 'Taules',
      'panel.tableHeadBg': 'Fons de capçalera',
      'panel.tableHeadColor': 'Color de text de capçalera',
      'panel.tableHeadWeight': 'Grossor de capçalera',
      'panel.tableSize': 'Tamany de text',
      'panel.tablePadding': 'Marges de cel·la',
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
      'toast.opened': 'Arxiu obert',
      'toast.openError': 'No s’ha pogut obrir l’arxiu. Consulta la consola per a més detalls.',
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

  const SAMPLE_MARKDOWN = `# emdme

**emdme** is a small Markdown studio. Write on the left, watch it render on
the right, shape the typography, then export a clean Word file that keeps the
styles you designed.

## Why it exists

Most editors either bury the styling or lock it away. emdme keeps the template
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

*emdme* runs offline with no dependencies beyond Marked.
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
   * Convert a number to upper-case roman numerals (1 → I, 4 → IV).
   * @param {number} value - Positive integer.
   * @returns {string} Roman numeral.
   */
  const toRoman = (value) => {
    const table = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
      [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
    ];
    let remaining = value;
    let output = '';
    table.forEach(([amount, symbol]) => {
      while (remaining >= amount) {
        output += symbol;
        remaining -= amount;
      }
    });
    return output;
  };

  /**
   * Convert a number to alphabetic labels (1 → A, 27 → AA).
   * @param {number} value - Positive integer.
   * @returns {string} Alphabetic label.
   */
  const toAlpha = (value) => {
    let remaining = value;
    let output = '';
    while (remaining > 0) {
      const rest = (remaining - 1) % 26;
      output = String.fromCharCode(65 + rest) + output;
      remaining = Math.floor((remaining - 1) / 26);
    }
    return output;
  };

  const NUMBER_STYLES = Object.freeze({
    decimal: (parts) => parts.join('.'),
    'decimal-trailing': (parts) => `${parts.join('.')}.`,
    paren: (parts) => `${parts.join('.')})`,
    outline: (parts) => parts
      .map((value, index) => {
        const level = index + 1;
        if (level === 1) {
          return toRoman(value);
        }
        if (level === 2) {
          return toAlpha(value);
        }
        if (level === 4) {
          return toAlpha(value).toLowerCase();
        }
        if (level === 5) {
          return toRoman(value).toLowerCase();
        }
        return String(value);
      })
      .join('.'),
  });

  const formatHeadingNumber = (counters, level, style) => {
    const parts = counters.slice(0, level);
    const formatter = NUMBER_STYLES[style] || NUMBER_STYLES.decimal;
    return formatter(parts);
  };

  /**
   * Prefix headings with hierarchical numbers such as 1, 1.1, 1.1.1.
   * @param {HTMLElement} root - Container holding the rendered document.
   * @param {number} depth - Deepest heading level to number.
   * @param {string} [style='decimal'] - Numbering scheme key.
   */
  const numberHeadings = (root, depth, style = 'decimal') => {
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
      const label = formatHeadingNumber(counters, level, style);
      const span = document.createElement('span');
      span.className = 'h-num';
      span.textContent = `${label}\u00a0\u00a0`;
      heading.prepend(span);
    });
  };

  /**
   * Render Markdown into safe HTML, applying heading numbering when enabled.
   * When withLines is true, each top-level block is tagged with its source
   * line so the editor and the preview can be scrolled in sync by content.
   * @param {string} markdown - Source Markdown.
   * @param {object} template - Active style template.
   * @param {boolean} [withLines=false] - Tag blocks with their source line.
   * @returns {string} Rendered, sanitised HTML.
   */
  const renderDocument = (markdown, template, withLines = false) => {
    const tokens = marked.lexer(markdown || '');
    const parts = [];
    let line = 0;
    tokens.forEach((token) => {
      const span = token.raw ? (token.raw.match(/\n/g) || []).length : 0;
      if (token.type !== 'space') {
        const block = document.createElement('div');
        block.innerHTML = sanitizeHtml(marked.parser([token]));
        const first = block.firstElementChild;
        if (first) {
          if (withLines) {
            first.dataset.line = String(line);
            first.dataset.lineEnd = String(line + Math.max(1, span));
          }
          parts.push(block.innerHTML);
        }
      }
      line += span;
    });
    const holder = document.createElement('div');
    holder.innerHTML = parts.join('');
    if (template.numberHeadings) {
      numberHeadings(holder, template.numberDepth, template.numberStyle);
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
    editorFontSize: EDITOR_FONT_DEFAULT,
    outlineDepth: 3,
    fileName: '',
    template: { ...DEFAULT_TEMPLATE },
  };

  let toastTimer = 0;
  let currentFileHandle = null;
  let syncing = false;

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
        editorFontSize: typeof stored.editorFontSize === 'number'
          ? clamp(stored.editorFontSize, EDITOR_FONT_MIN, EDITOR_FONT_MAX)
          : state.editorFontSize,
        outlineDepth: Number.isFinite(stored.outlineDepth)
          ? clamp(stored.outlineDepth, 1, 6)
          : state.outlineDepth,
        fileName: typeof stored.fileName === 'string' ? stored.fileName : state.fileName,
      });
      state.template = { ...DEFAULT_TEMPLATE, ...(stored.template || {}) };
    } catch (error) {
      console.warn('emdme: could not restore the saved session.', error);
    }
  };

  const saveState = debounce(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('emdme: could not save the session.', error);
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
    el.previewPane = $('.pane-preview');
    el.langSelect = $('#lang-select');
    el.themeToggle = $('#theme-toggle');
    el.templateToggle = $('#template-toggle');
    el.panel = $('#template-panel');
    el.panelClose = $('#panel-close');
    el.outlineToggle = $('#outline-toggle');
    el.outlinePanel = $('#outline-panel');
    el.outlineClose = $('#outline-close');
    el.outlineList = $('#outline-list');
    el.outlineDepth = $('#outline-depth');
    el.scrim = $('#scrim');
    el.toast = $('#toast');
    el.statWords = $('#stat-words');
    el.statChars = $('#stat-chars');
    el.statReading = $('#stat-reading');
    el.statTemplate = $('#stat-template');
    el.statFile = $('#stat-file');
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
      numberStyle: $('#tpl-number-style'),
      codeBg: $('#tpl-code-bg'),
      tableHeadBg: $('#tpl-table-head-bg'),
      tableHeadColor: $('#tpl-table-head-color'),
      tableHeadWeight: $('#tpl-table-head-weight'),
      tableSize: $('#tpl-table-size'),
      tablePadding: $('#tpl-table-padding'),
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
      tableHeadWeight: $('#out-table-head-weight'),
      tableSize: $('#out-table-size'),
      tablePadding: $('#out-table-padding'),
      pageMargin: $('#out-page-margin'),
    };
    el.exportWord = $('#export-word');
    el.exportHtml = $('#export-html');
    el.exportMd = $('#export-md');
    el.open = $('#open-document');
    el.openFileInput = $('#open-file-input');
    el.save = $('#save-document');
    el.saveAs = $('#save-as-document');
    el.listUnordered = $('#list-unordered');
    el.listOrdered = $('#list-ordered');
    el.smartTable = $('#smart-table');
    el.mdBold = $('#md-bold');
    el.mdItalic = $('#md-italic');
    el.mdStrike = $('#md-strike');
    el.mdHeading = $('#md-heading');
    el.mdCode = $('#md-code');
    el.mdQuote = $('#md-quote');
    el.mdLink = $('#md-link');
    el.editorFontDecrease = $('#editor-font-decrease');
    el.editorFontIncrease = $('#editor-font-increase');
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
      const value = t(node.dataset.i18n);
      const textNode = Array.from(node.childNodes).find((child) => child.nodeType === Node.TEXT_NODE);
      if (node.children.length > 0 && textNode) {
        textNode.textContent = `${value} `;
        return;
      }
      node.textContent = value;
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
    if (el.outlinePanel.classList.contains('is-open')) {
      renderOutline();
    }
  };

  const applyMode = () => {
    el.app.dataset.mode = state.mode;
    $$('.seg-btn').forEach((button) => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  const applyEditorFontSize = () => {
    el.editor.style.setProperty('--editor-font-size', `${state.editorFontSize}rem`);
    el.editorFontDecrease.disabled = state.editorFontSize <= EDITOR_FONT_MIN;
    el.editorFontIncrease.disabled = state.editorFontSize >= EDITOR_FONT_MAX;
    invalidateEditorLayout();
  };

  const previewBlocks = () => Array.from(el.preview.querySelectorAll('[data-line]'));

  let editorLayoutCache = null;

  const invalidateEditorLayout = () => {
    editorLayoutCache = null;
  };

  /**
   * Measure the top offset and height of every source line as the browser lays
   * it out in the editor. Wrapping means several visual lines may belong to one
   * source line, so this uses a hidden mirror to get exact positions.
   * @returns {{offsets:number[], heights:number[]}} Per source line metrics.
   */
  const buildEditorLayout = () => {
    if (editorLayoutCache) {
      return editorLayoutCache;
    }
    const editor = el.editor;
    const style = getComputedStyle(editor);
    const mirror = document.createElement('div');
    mirror.style.position = 'absolute';
    mirror.style.top = '0';
    mirror.style.left = '-9999px';
    mirror.style.visibility = 'hidden';
    mirror.style.pointerEvents = 'none';
    mirror.style.boxSizing = 'border-box';
    mirror.style.width = `${editor.clientWidth}px`;
    mirror.style.padding = style.padding;
    mirror.style.fontFamily = style.fontFamily;
    mirror.style.fontSize = style.fontSize;
    mirror.style.fontWeight = style.fontWeight;
    mirror.style.fontStyle = style.fontStyle;
    mirror.style.letterSpacing = style.letterSpacing;
    mirror.style.lineHeight = style.lineHeight;
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.overflowWrap = 'break-word';
    mirror.style.tabSize = style.tabSize;
    mirror.innerHTML = editor.value
      .split('\n')
      .map((text) => `<div>${escapeHtml(text) || '<br>'}</div>`)
      .join('');
    document.body.appendChild(mirror);
    const offsets = [];
    const heights = [];
    Array.from(mirror.children).forEach((child) => {
      offsets.push(child.offsetTop);
      heights.push(child.offsetHeight);
    });
    document.body.removeChild(mirror);
    editorLayoutCache = { offsets, heights };
    return editorLayoutCache;
  };

  const editorYForLine = (line) => {
    const { offsets, heights } = buildEditorLayout();
    if (offsets.length === 0) {
      return 0;
    }
    const value = clamp(line, 0, offsets.length);
    const index = Math.min(offsets.length - 1, Math.floor(value));
    return offsets[index] + (value - index) * heights[index];
  };

  const editorLineForY = (y) => {
    const { offsets, heights } = buildEditorLayout();
    if (offsets.length === 0) {
      return 0;
    }
    if (y <= offsets[0]) {
      return 0;
    }
    for (let i = 0; i < offsets.length; i += 1) {
      if (y < offsets[i] + heights[i]) {
        const fraction = heights[i] > 0 ? (y - offsets[i]) / heights[i] : 0;
        return i + fraction;
      }
    }
    return offsets.length;
  };

  let previewPointsCache = null;

  const invalidatePreviewPoints = () => {
    previewPointsCache = null;
  };

  /**
   * Build the mapping between source lines and preview pixels. Each block knows
   * the source lines it spans, so tall blocks (code, long paragraphs) map
   * accurately instead of collapsing to a single point.
   * @returns {Array<{line:number, y:number}>} Points sorted by line, then pixel.
   */
  const previewPoints = () => {
    if (previewPointsCache) {
      return previewPointsCache;
    }
    const pane = el.previewPane;
    const paneTop = pane.getBoundingClientRect().top - pane.scrollTop;
    const points = [];
    previewBlocks().forEach((block) => {
      const start = Number(block.dataset.line);
      const end = Number(block.dataset.lineEnd) || start + 1;
      const rect = block.getBoundingClientRect();
      const top = rect.top - paneTop;
      points.push({ line: start, y: top });
      points.push({ line: end, y: top + rect.height });
    });
    points.sort((a, b) => (a.line - b.line) || (a.y - b.y));
    previewPointsCache = points;
    return points;
  };

  /**
   * Map a source line to a pixel offset inside the preview content.
   * @param {number} line - Source line (may be fractional).
   * @returns {number} Pixel offset.
   */
  const previewYForLine = (line) => {
    const points = previewPoints();
    if (points.length === 0) {
      return 0;
    }
    if (line <= points[0].line) {
      return points[0].y;
    }
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      if (line <= b.line) {
        const span = b.line - a.line;
        const fraction = span > 0 ? (line - a.line) / span : 0;
        return a.y + fraction * (b.y - a.y);
      }
    }
    return points[points.length - 1].y;
  };

  /**
   * Map a pixel offset inside the preview content to a source line.
   * @param {number} y - Pixel offset.
   * @returns {number} Source line (may be fractional).
   */
  const previewLineForY = (y) => {
    const points = previewPoints();
    if (points.length === 0) {
      return 0;
    }
    if (y <= points[0].y) {
      return points[0].line;
    }
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      if (y <= b.y) {
        const span = b.y - a.y;
        const fraction = span > 0 ? (y - a.y) / span : 0;
        return a.line + fraction * (b.line - a.line);
      }
    }
    return points[points.length - 1].line;
  };

  /**
   * Scroll the preview so the line at the top of the editor sits at the top of
   * the preview. Both mappings are per source line, so the panes always show
   * overlapping content even when the document lengths differ.
   */
  const alignPreviewToEditor = () => {
    if (state.mode !== 'split' || previewPoints().length === 0) {
      return;
    }
    const topLine = editorLineForY(el.editor.scrollTop);
    const maxScroll = Math.max(0, el.previewPane.scrollHeight - el.previewPane.clientHeight);
    el.previewPane.scrollTop = clamp(previewYForLine(topLine), 0, maxScroll);
  };

  /**
   * Scroll the editor so the line at the top of the preview sits at the top of
   * the editor.
   */
  const alignEditorToPreview = () => {
    if (state.mode !== 'split' || previewPoints().length === 0) {
      return;
    }
    const line = previewLineForY(el.previewPane.scrollTop);
    const maxScroll = Math.max(0, el.editor.scrollHeight - el.editor.clientHeight);
    el.editor.scrollTop = clamp(editorYForLine(line), 0, maxScroll);
  };

  /**
   * Keep both panes in step using their content. The syncing flag stops the
   * scroll event triggered by the target pane from bouncing back.
   * @param {'editor'|'preview'} source - Pane the user is scrolling.
   */
  const syncScrollPosition = (source) => {
    if (syncing) {
      return;
    }
    syncing = true;
    if (source === 'editor') {
      alignPreviewToEditor();
    } else {
      alignEditorToPreview();
    }
    requestAnimationFrame(() => { syncing = false; });
  };

  /**
   * Nudge the editor text size by one step, keeping it within bounds.
   * @param {number} delta - Amount to add, in rem.
   */
  const changeEditorFontSize = (delta) => {
    state.editorFontSize = clamp(round(state.editorFontSize + delta, 2), EDITOR_FONT_MIN, EDITOR_FONT_MAX);
    applyEditorFontSize();
    saveState();
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
    style.setProperty('--doc-table-size', `${template.tableSize}em`);
    style.setProperty('--doc-table-padding', `${template.tablePadding}em`);
    style.setProperty('--doc-table-head-bg', template.tableHeadBg);
    style.setProperty('--doc-table-head-color', template.tableHeadColor);
    style.setProperty('--doc-table-head-weight', template.tableHeadWeight);
    HEADING_RATIOS.forEach((ratio, index) => {
      style.setProperty(`--doc-h${index + 1}`, `calc(${base} * ${round(ratio * template.headingScale, 3)})`);
    });
    invalidatePreviewPoints();
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
    controls.numberStyle.value = template.numberStyle;
    controls.codeBg.value = template.codeBg;
    controls.tableHeadBg.value = template.tableHeadBg;
    controls.tableHeadColor.value = template.tableHeadColor;
    controls.tableHeadWeight.value = template.tableHeadWeight;
    controls.tableSize.value = template.tableSize;
    controls.tablePadding.value = template.tablePadding;
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
    el.outputs.numberDepth.value = formatHeadingNumber(
      [1, 1, 1, 1, 1, 1],
      clamp(template.numberDepth, 1, 6),
      template.numberStyle
    );
    el.outputs.tableHeadWeight.value = template.tableHeadWeight;
    el.outputs.tableSize.value = `${template.tableSize.toFixed(2)}em`;
    el.outputs.tablePadding.value = `${template.tablePadding.toFixed(2)}em`;
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
    if ('numberHeadings' in patch || 'numberDepth' in patch || 'numberStyle' in patch) {
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
    ['headingColor', 'linkColor', 'codeBg', 'tableHeadBg', 'tableHeadColor'].forEach((key) => {
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
    } else {
      el.preview.innerHTML = renderDocument(state.content, state.template, true);
      invalidatePreviewPoints();
      invalidateEditorLayout();
      syncScrollPosition('editor');
    }
    if (el.outlinePanel.classList.contains('is-open')) {
      renderOutline();
    }
  };

  const renderStatus = () => {
    const words = state.content.trim() ? state.content.trim().split(/\s+/).length : 0;
    el.statWords.textContent = words.toLocaleString(state.lang === 'val' ? 'ca' : state.lang);
    el.statChars.textContent = state.content.length.toLocaleString(state.lang === 'val' ? 'ca' : state.lang);
    el.statReading.textContent = String(Math.max(1, Math.ceil(words / 200)));
    const name = state.template.preset;
    el.statTemplate.textContent = name === 'custom' ? t('preset.custom') : t(`preset.${name}`);
    el.statFile.value = state.fileName || '';
    el.statFile.title = state.fileName || '';
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
    const tablePadV = round(template.tablePadding * basePt * template.tableSize);
    const tablePadH = round(tablePadV * 1.4);
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
      'li > p { margin: 0; }',
      `blockquote { margin: 0 0 ${paraPt}pt; padding-left: 10pt; border-left: 3pt solid ${template.linkColor}; color: #55585e; font-style: italic; }`,
      `code { font-family: ${template.monoFont}; font-size: 0.9em; background: ${template.codeBg}; padding: 1pt 3pt; }`,
      `pre { font-family: ${template.monoFont}; font-size: 0.86em; background: ${template.codeBg}; padding: 8pt 10pt; white-space: pre-wrap; }`,
      'pre code { background: transparent; padding: 0; }',
      'table { border-collapse: collapse; width: 100%; margin-bottom: ' + paraPt + 'pt; font-size: ' + template.tableSize + 'em; }',
      `th, td { border: 1pt solid #b9b9b4; padding: ${tablePadV}pt ${tablePadH}pt; text-align: left; }`,
      `th { background: ${template.tableHeadBg}; color: ${template.tableHeadColor}; font-weight: ${template.tableHeadWeight}; }`,
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
      console.error('emdme: export failed.', error);
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
        console.warn('emdme: could not abort the failed file write.', abortError);
      }
      throw error;
    }
  };

  const saveAsDocument = async () => {
    if (typeof window.showSaveFilePicker !== 'function') {
      const name = `${slugify(state.title)}.md`;
      downloadBlob(
        new Blob([state.content], { type: 'text/markdown;charset=utf-8' }),
        name
      );
      state.fileName = name;
      renderStatus();
      saveState();
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
      state.fileName = fileHandle.name;
      renderStatus();
      saveState();
      showToast(t('toast.saved'));
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('emdme: save failed.', error);
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
      console.error('emdme: save failed.', error);
      showToast(t('toast.saveError'));
    }
  };

  /**
   * Load a document's text into the editor, preview and status bar.
   * @param {string} name - File name, used to derive the document title.
   * @param {string} text - File contents.
   * @param {FileSystemFileHandle|null} [handle] - Handle to keep for quick saves.
   */
  const applyDocument = (name, text, handle = null) => {
    state.content = text;
    state.title = (name || '').replace(/\.[^.]+$/, '') || 'Untitled document';
    state.fileName = name || '';
    currentFileHandle = handle;
    el.editor.value = text;
    el.editor.scrollTop = 0;
    renderStatus();
    renderPreview();
    saveState();
  };

  const openDocument = async () => {
    if (typeof window.showOpenFilePicker !== 'function') {
      el.openFileInput.value = '';
      el.openFileInput.click();
      return;
    }

    try {
      const [fileHandle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{
          description: 'Markdown document',
          accept: { 'text/markdown': ['.md', '.markdown'], 'text/plain': ['.txt'] },
        }],
      });
      const file = await fileHandle.getFile();
      const text = await file.text();
      applyDocument(file.name, text, fileHandle);
      showToast(t('toast.opened'));
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('emdme: open failed.', error);
      showToast(t('toast.openError'));
    }
  };

  const openDocumentFromInput = async () => {
    const file = el.openFileInput.files && el.openFileInput.files[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      applyDocument(file.name, text);
      showToast(t('toast.opened'));
    } catch (error) {
      console.error('emdme: open failed.', error);
      showToast(t('toast.openError'));
    } finally {
      el.openFileInput.value = '';
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

  /**
   * Replace a range of the editor text and restore the caret.
   * Assigning value (instead of setRangeText) forces a repaint: some engines
   * do not paint setRangeText edits until the next text input arrives.
   * @param {number} start - Start of the replaced range.
   * @param {number} end - End of the replaced range.
   * @param {string} replacement - New text for the range.
   * @param {number} [caretStart] - Selection start after the edit.
   * @param {number} [caretEnd] - Selection end after the edit.
   */
  const replaceEditorRange = (start, end, replacement, caretStart, caretEnd) => {
    const value = el.editor.value;
    const nextValue = value.slice(0, start) + replacement + value.slice(end);
    const scrollTop = el.editor.scrollTop;
    el.editor.value = nextValue;
    const from = typeof caretStart === 'number' ? caretStart : start + replacement.length;
    const to = typeof caretEnd === 'number' ? caretEnd : from;
    el.editor.setSelectionRange(from, to);
    el.editor.scrollTop = scrollTop;
    el.editor.focus();
    invalidateEditorLayout();
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
    replaceEditorRange(start, end, result);
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
     Inline Markdown formatting: emphasis, code, links and block elements.
     ------------------------------------------------------------------------ */

  const getSelectionRange = () => ({
    start: el.editor.selectionStart,
    end: el.editor.selectionEnd,
    text: el.editor.value.slice(el.editor.selectionStart, el.editor.selectionEnd),
  });

  /**
   * Write a replacement into the editor and keep the desired selection.
   * @param {number} start - Start of the replaced range.
   * @param {number} end - End of the replaced range.
   * @param {string} replacement - New text for the range.
   * @param {number} [caretStart] - Selection start after the edit.
   * @param {number} [caretEnd] - Selection end after the edit.
   */
  const commitEditorEdit = (start, end, replacement, caretStart, caretEnd) => {
    replaceEditorRange(start, end, replacement, caretStart, caretEnd);
    state.content = el.editor.value;
    renderStatus();
    saveState();
    scheduleRender();
  };

  /**
   * Toggle an inline marker around the selection, removing it when present.
   * @param {string} marker - Opening marker such as ** or `.
   * @param {string} [endMarker] - Closing marker when it differs.
   */
  const toggleInlineMark = (marker, endMarker = marker) => {
    const { start, end, text } = getSelectionRange();
    const value = el.editor.value;
    const openLen = marker.length;
    const closeLen = endMarker.length;
    const wrappedInside = text.length >= openLen + closeLen
      && text.startsWith(marker) && text.endsWith(endMarker);
    const surroundedOutside = start >= openLen
      && value.slice(start - openLen, start) === marker
      && value.slice(end, end + closeLen) === endMarker;

    if (surroundedOutside) {
      const outerStart = start - openLen;
      const outerEnd = end + closeLen;
      const inner = value.slice(outerStart + openLen, outerEnd - closeLen);
      commitEditorEdit(outerStart, outerEnd, inner, outerStart, outerStart + inner.length);
      return;
    }

    if (wrappedInside) {
      const inner = text.slice(openLen, text.length - closeLen);
      commitEditorEdit(start, end, inner, start, start + inner.length);
      return;
    }

    const replacement = `${marker}${text}${endMarker}`;
    const caret = start + openLen;
    commitEditorEdit(start, end, replacement, caret, caret + text.length);
  };

  /**
   * Rewrite every line touched by the selection.
   * @param {Function} transform - Maps an array of lines to new lines.
   */
  const transformSelectedLines = (transform) => {
    const { start, end } = getSelectionRange();
    const value = el.editor.value;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const nextBreak = value.indexOf('\n', end);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const lines = value.slice(lineStart, lineEnd).split('\n');
    const replacement = transform(lines).join('\n');
    commitEditorEdit(lineStart, lineEnd, replacement, lineStart, lineStart + replacement.length);
  };

  const toggleHeading = () => transformSelectedLines((lines) => lines.map((line) => {
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    const level = match ? match[1].length : 0;
    const content = match ? match[2] : line;
    const nextLevel = level >= 3 ? 0 : level + 1;
    return nextLevel === 0 ? content : `${'#'.repeat(nextLevel)} ${content}`;
  }));

  /**
   * Find the contiguous block of non-empty lines around a caret position.
   * @param {string} value - Editor text.
   * @param {number} position - Caret offset.
   * @returns {[number, number]} Start and end offsets of the paragraph.
   */
  const paragraphRangeAt = (value, position) => {
    let start = value.lastIndexOf('\n', position - 1) + 1;
    let end = value.indexOf('\n', position);
    if (end === -1) {
      end = value.length;
    }
    const isBlank = (from, to) => value.slice(from, to).trim() === '';
    while (start > 0) {
      const prevEnd = start - 1;
      const prevStart = value.lastIndexOf('\n', prevEnd - 1) + 1;
      if (isBlank(prevStart, prevEnd)) {
        break;
      }
      start = prevStart;
    }
    while (end < value.length) {
      const nextStart = end + 1;
      let nextEnd = value.indexOf('\n', nextStart);
      if (nextEnd === -1) {
        nextEnd = value.length;
      }
      if (isBlank(nextStart, nextEnd)) {
        break;
      }
      end = nextEnd;
    }
    return [start, end];
  };

  const toggleBlockquote = () => {
    if (el.editor.selectionStart === el.editor.selectionEnd) {
      const [start, end] = paragraphRangeAt(el.editor.value, el.editor.selectionStart);
      el.editor.setSelectionRange(start, end);
    }
    transformSelectedLines((lines) => {
      const quoted = lines.every((line) => /^>\s?/.test(line) || line.trim() === '');
      return lines.map((line) => (quoted ? line.replace(/^>\s?/, '') : `> ${line}`));
    });
  };

  const insertLink = () => {
    const { start, end, text } = getSelectionRange();
    if (text.length > 0) {
      const replacement = `[${text}](url)`;
      const urlStart = start + text.length + 3;
      commitEditorEdit(start, end, replacement, urlStart, urlStart + 3);
      return;
    }
    commitEditorEdit(start, end, '[](url)', start + 1, start + 1);
  };

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

  const outlineHeadingText = (token) => {
    const holder = document.createElement('div');
    holder.innerHTML = sanitizeHtml(marked.parser([token]));
    return (holder.textContent || '').replace(/\s+/g, ' ').trim();
  };

  /**
   * Collect the headings up to the configured level with their source lines.
   * @returns {Array<{level:number, text:string, line:number}>} Outline entries.
   */
  const collectOutline = () => {
    const maxLevel = clamp(Number(el.outlineDepth.value) || state.outlineDepth, 1, 6);
    const tokens = marked.lexer(state.content || '');
    const items = [];
    let line = 0;
    tokens.forEach((token) => {
      if (token.type === 'heading' && token.depth <= maxLevel) {
        items.push({ level: token.depth, text: outlineHeadingText(token), line });
      }
      line += token.raw ? (token.raw.match(/\n/g) || []).length : 0;
    });
    return items;
  };

  const lineStartIndex = (text, line) => {
    let index = 0;
    for (let i = 0; i < line; i += 1) {
      const next = text.indexOf('\n', index);
      if (next === -1) {
        return text.length;
      }
      index = next + 1;
    }
    return index;
  };

  /**
   * Jump the editor and the preview to the heading on the given source line.
   * @param {number} line - Zero-based source line of the heading.
   */
  const jumpToHeading = (line) => {
    const start = lineStartIndex(state.content, line);
    el.editor.focus();
    el.editor.setSelectionRange(start, start);
    el.editor.scrollTop = Math.max(0, editorYForLine(line));
    const block = el.preview.querySelector(`[data-line="${line}"]`);
    if (block) {
      const paneTop = el.previewPane.getBoundingClientRect().top;
      el.previewPane.scrollTop += block.getBoundingClientRect().top - paneTop;
    }
  };

  const renderOutline = () => {
    el.outlineList.textContent = '';
    const items = collectOutline();
    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'outline-empty';
      empty.textContent = t('outline.empty');
      el.outlineList.appendChild(empty);
      return;
    }
    items.forEach((item) => {
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'outline-item';
      link.dataset.level = String(item.level);
      link.textContent = item.text;
      link.addEventListener('click', () => {
        closeOutline();
        jumpToHeading(item.line);
      });
      el.outlineList.appendChild(link);
    });
  };

  const openPanel = () => {
    if (el.outlinePanel.classList.contains('is-open')) {
      closeOutline();
    }
    el.panel.classList.add('is-open');
    el.panel.setAttribute('aria-hidden', 'false');
    el.templateToggle.setAttribute('aria-expanded', 'true');
    el.scrim.hidden = false;
    requestAnimationFrame(() => el.scrim.classList.add('is-visible'));
    el.controls.preset.focus();
  };

  const closePanel = () => {
    if (!el.panel.classList.contains('is-open')) {
      return;
    }
    el.panel.classList.remove('is-open');
    el.panel.setAttribute('aria-hidden', 'true');
    el.templateToggle.setAttribute('aria-expanded', 'false');
    el.scrim.classList.remove('is-visible');
    setTimeout(() => { el.scrim.hidden = true; }, 200);
    el.templateToggle.focus();
  };

  const openOutline = () => {
    if (el.panel.classList.contains('is-open')) {
      closePanel();
    }
    el.outlinePanel.classList.add('is-open');
    el.outlinePanel.setAttribute('aria-hidden', 'false');
    el.outlineToggle.setAttribute('aria-expanded', 'true');
    el.scrim.hidden = false;
    requestAnimationFrame(() => el.scrim.classList.add('is-visible'));
    renderOutline();
    el.outlineDepth.focus();
  };

  const closeOutline = () => {
    if (!el.outlinePanel.classList.contains('is-open')) {
      return;
    }
    el.outlinePanel.classList.remove('is-open');
    el.outlinePanel.setAttribute('aria-hidden', 'true');
    el.outlineToggle.setAttribute('aria-expanded', 'false');
    el.scrim.classList.remove('is-visible');
    setTimeout(() => { el.scrim.hidden = true; }, 200);
    el.outlineToggle.focus();
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
        syncScrollPosition('editor');
        saveState();
      });
    });

    el.editor.addEventListener('scroll', () => syncScrollPosition('editor'));
    el.previewPane.addEventListener('scroll', () => syncScrollPosition('preview'));
    window.addEventListener('resize', () => {
      invalidatePreviewPoints();
      invalidateEditorLayout();
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

    el.templateToggle.addEventListener('click', openPanel);
    el.panelClose.addEventListener('click', closePanel);
    el.outlineToggle.addEventListener('click', openOutline);
    el.outlineClose.addEventListener('click', closeOutline);
    el.outlineDepth.addEventListener('change', () => {
      state.outlineDepth = clamp(Number(el.outlineDepth.value) || state.outlineDepth, 1, 6);
      renderOutline();
      saveState();
    });
    el.scrim.addEventListener('click', () => {
      closePanel();
      closeOutline();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closePanel();
        closeOutline();
      }
    });

    el.editor.addEventListener('input', () => {
      state.content = el.editor.value;
      renderStatus();
      saveState();
      invalidateEditorLayout();
      scheduleRender();
    });

    el.editor.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') {
        return;
      }
      event.preventDefault();
      const start = el.editor.selectionStart;
      const end = el.editor.selectionEnd;
      replaceEditorRange(start, end, '  ');
      state.content = el.editor.value;
      renderStatus();
      saveState();
      scheduleRender();
    });

    bindTemplateControls();
    el.open.addEventListener('click', openDocument);
    el.openFileInput.addEventListener('change', openDocumentFromInput);
    el.save.addEventListener('click', saveDocument);
    el.saveAs.addEventListener('click', saveAsDocument);
    el.listUnordered.addEventListener('click', transformSelectionToUnorderedList);
    el.listOrdered.addEventListener('click', transformSelectionToOrderedList);
    el.smartTable.addEventListener('click', transformSelectionToSmartTable);
    el.mdBold.addEventListener('click', () => toggleInlineMark('**'));
    el.mdItalic.addEventListener('click', () => toggleInlineMark('*'));
    el.mdStrike.addEventListener('click', () => toggleInlineMark('~~'));
    el.mdHeading.addEventListener('click', toggleHeading);
    el.mdCode.addEventListener('click', () => toggleInlineMark('`'));
    el.mdQuote.addEventListener('click', toggleBlockquote);
    el.mdLink.addEventListener('click', insertLink);
    el.editorFontDecrease.addEventListener('click', () => changeEditorFontSize(-EDITOR_FONT_STEP));
    el.editorFontIncrease.addEventListener('click', () => changeEditorFontSize(EDITOR_FONT_STEP));
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
    controls.numberStyle.addEventListener('change', () => patchTemplate({ numberStyle: controls.numberStyle.value }));
    controls.codeBg.addEventListener('input', () => patchTemplate({ codeBg: controls.codeBg.value }));
    controls.tableHeadBg.addEventListener('input', () => patchTemplate({ tableHeadBg: controls.tableHeadBg.value }));
    controls.tableHeadColor.addEventListener('input', () => patchTemplate({ tableHeadColor: controls.tableHeadColor.value }));
    controls.tableHeadWeight.addEventListener('input', () => patchTemplate({ tableHeadWeight: Number(controls.tableHeadWeight.value) }));
    controls.tableSize.addEventListener('input', () => patchTemplate({ tableSize: Number(controls.tableSize.value) }));
    controls.tablePadding.addEventListener('input', () => patchTemplate({ tablePadding: Number(controls.tablePadding.value) }));
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
    el.langSelect.value = state.lang;
    el.outlineDepth.value = String(state.outlineDepth);

    renderTemplateControls();
    applyTemplateToPreview();
    applyTheme();
    applyLanguage();
    applyMode();
    applyEditorFontSize();
    render();
    bindEvents();
  };

  document.addEventListener('DOMContentLoaded', init);
})();
