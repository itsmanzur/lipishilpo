export type HighlightColor = 'yellow' | 'green' | 'purple' | 'pink';

const HTML_MARK_RE = /<mark(?:\s+class="hl-(yellow|green|purple|pink)")?>([\s\S]*?)<\/mark>/gi;
const MD_COLORED_RE = /^==(yellow|green|purple|pink):([\s\S]*)==$/;
const MD_PLAIN_RE = /^==([\s\S]*)==$/;
const HTML_WRAP_RE = /^<mark(?:\s+class="hl-(yellow|green|purple|pink)")?>([\s\S]*)<\/mark>$/i;

export function htmlMarksToMarkdown(text: string): string {
  return text.replace(HTML_MARK_RE, (_full, color, inner) => {
    const c = String(color || 'yellow').toLowerCase() as HighlightColor;
    return wrapHighlight(inner, c === 'green' || c === 'purple' || c === 'pink' ? c : 'yellow');
  });
}

export function wrapHighlight(inner: string, color: HighlightColor): string {
  return color === 'yellow' ? `==${inner}==` : `==${color}:${inner}==`;
}

export function unwrapHighlight(selected: string): {
  inner: string;
  wrapped: boolean;
  color: HighlightColor | null;
} {
  const colored = selected.match(MD_COLORED_RE);
  if (colored) {
    return { inner: colored[2], wrapped: true, color: colored[1] as HighlightColor };
  }
  const plain = selected.match(MD_PLAIN_RE);
  if (plain && !/^(yellow|green|purple|pink):/.test(plain[1])) {
    return { inner: plain[1], wrapped: true, color: 'yellow' };
  }
  const html = selected.match(HTML_WRAP_RE);
  if (html) {
    const c = (html[1] || 'yellow').toLowerCase() as HighlightColor;
    return { inner: html[2], wrapped: true, color: c };
  }
  return { inner: selected, wrapped: false, color: null };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const MARK_STYLE: Record<HighlightColor, string> = {
  yellow: 'background:#fef08a;color:#854d0e',
  green: 'background:#bbf7d0;color:#166534',
  purple: 'background:#e9d5ff;color:#6b21a8',
  pink: 'background:#fce7f3;color:#9d174d',
};

/** Convert manuscript markup to HTML for WordPress publish / HTML export. */
export function markupToHtml(src: string): string {
  let s = escapeHtml(htmlMarksToMarkdown(src));
  s = s.replace(/==(yellow|green|purple|pink):([\s\S]*?)==/g, (_m, color: HighlightColor, inner: string) => {
    return `<mark class="hl-${color}" style="${MARK_STYLE[color]}">${inner}</mark>`;
  });
  s = s.replace(/==([\s\S]*?)==/g, (_m, inner: string) => {
    return `<mark class="hl-yellow" style="${MARK_STYLE.yellow}">${inner}</mark>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  s = s.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  s = s.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  return s
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p.startsWith('<h2>') || p.startsWith('<h3>') || p.startsWith('<blockquote>')
      ? p.replace(/\n/g, '<br/>')
      : `<p>${p.replace(/\n/g, '<br/>')}</p>`))
    .join('\n');
}
