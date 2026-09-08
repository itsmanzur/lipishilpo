import React from 'react';

/**
 * Edit-mode overlay: same characters as the textarea (caret stays aligned),
 * with faint markup tokens and visible bold / italic / highlight / blocks.
 */
const PATTERN =
  /(:::box\[(.*?)\]([\s\S]*?):::)|(:::poem([\s\S]*?):::)|(:::dropcap([\s\S]*?):::)|(\n?(?:---|\u2756\s+\u2756\s+\u2756|~\s*\u2766\s*~|—\s*\u2726\s*—|\*\s*\*\s*\*|\u2767\s+\u2767\s+\u2767)\n?)|(\n?#{2,3}\s+[^\n]+)|(\n?>\s+[^\n]+)|(<mark(?:\s+class="([^"]*)")?>([\s\S]*?)<\/mark>)|(\n?\[\^([0-9\u09E6-\u09EF]+)\]:\s*([^\n]+))|(\[\^([0-9\u09E6-\u09EF]+)\])|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(==(yellow|green|purple|pink):([\s\S]*?)==)|(==([\s\S]*?)==)/g;

function Token({ children }: { children: string }) {
  return <span className="live-token">{children}</span>;
}

function renderParts(rawText: string, keyPrefix: string): React.ReactNode[] {
  const pattern = new RegExp(PATTERN.source, 'g');
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = pattern.exec(rawText)) !== null) {
    const matchStart = match.index;
    const matchEnd = pattern.lastIndex;
    const matchedStr = match[0];

    if (matchStart > lastIndex) {
      parts.push(rawText.slice(lastIndex, matchStart));
    }

    if (match[1]) {
      const title = match[2] || '';
      const body = match[3] || '';
      parts.push(
        <span key={`${keyPrefix}-box-${idx++}`} className="live-box">
          <Token>{`:::box[`}</Token>
          <span className="live-box-title">{title}</span>
          <Token>{`]`}</Token>
          {renderParts(body, `${keyPrefix}-bx-${idx}`)}
          <Token>{`:::`}</Token>
        </span>
      );
    } else if (match[4]) {
      const body = match[5] || '';
      parts.push(
        <span key={`${keyPrefix}-poem-${idx++}`} className="live-poem">
          <Token>{`:::poem`}</Token>
          {renderParts(body, `${keyPrefix}-pm-${idx}`)}
          <Token>{`:::`}</Token>
        </span>
      );
    } else if (match[6]) {
      const body = match[7] || '';
      parts.push(
        <span key={`${keyPrefix}-dc-${idx++}`} className="live-dropcap">
          <Token>{`:::dropcap`}</Token>
          {renderParts(body, `${keyPrefix}-dc-${idx}`)}
          <Token>{`:::`}</Token>
        </span>
      );
    } else if (match[8]) {
      parts.push(
        <span key={`${keyPrefix}-div-${idx++}`} className="live-divider">
          {matchedStr}
        </span>
      );
    } else if (match[9]) {
      const isH3 = /#{3}/.test(matchedStr);
      const lead = matchedStr.startsWith('\n') ? '\n' : '';
      const line = lead ? matchedStr.slice(1) : matchedStr;
      const marker = isH3 ? '### ' : '## ';
      const title = line.slice(marker.length);
      parts.push(
        <span key={`${keyPrefix}-h-${idx++}`} className={isH3 ? 'live-h3' : 'live-h2'}>
          {lead}
          <Token>{marker}</Token>
          {title}
        </span>
      );
    } else if (match[10]) {
      const lead = matchedStr.startsWith('\n') ? '\n' : '';
      const line = lead ? matchedStr.slice(1) : matchedStr;
      const markerMatch = line.match(/^>\s+/);
      const marker = markerMatch ? markerMatch[0] : '> ';
      parts.push(
        <span key={`${keyPrefix}-q-${idx++}`} className="live-quote">
          {lead}
          <Token>{marker}</Token>
          {line.slice(marker.length)}
        </span>
      );
    } else if (match[11]) {
      const markClass = match[12] || 'hl-yellow';
      const inner = match[13] || '';
      parts.push(
        <span key={`${keyPrefix}-htmlmk-${idx++}`} className={`live-mark ${markClass}`}>
          <Token>{match[12] ? `<mark class="${match[12]}">` : '<mark>'}</Token>
          {inner}
          <Token>{'</mark>'}</Token>
        </span>
      );
    } else if (match[14]) {
      const lead = matchedStr.startsWith('\n') ? '\n' : '';
      const num = match[15] || '';
      const note = match[16] || '';
      parts.push(
        <span key={`${keyPrefix}-fndef-${idx++}`} className="live-fn-def">
          {lead}
          <Token>{`[^${num}]: `}</Token>
          {note}
        </span>
      );
    } else if (match[17]) {
      parts.push(
        <span key={`${keyPrefix}-fnref-${idx++}`} className="live-fn-ref">
          {matchedStr}
        </span>
      );
    } else if (match[19]) {
      parts.push(
        <span key={`${keyPrefix}-b-${idx++}`} className="live-bold">
          <Token>**</Token>
          {matchedStr.slice(2, -2)}
          <Token>**</Token>
        </span>
      );
    } else if (match[20]) {
      parts.push(
        <span key={`${keyPrefix}-i-${idx++}`} className="live-italic">
          <Token>*</Token>
          {matchedStr.slice(1, -1)}
          <Token>*</Token>
        </span>
      );
    } else if (match[21]) {
      const color = match[22] || 'yellow';
      const inner = match[23] || '';
      parts.push(
        <span key={`${keyPrefix}-mkc-${idx++}`} className={`live-mark hl-${color}`}>
          <Token>{`==${color}:`}</Token>
          {inner}
          <Token>==</Token>
        </span>
      );
    } else if (match[24]) {
      parts.push(
        <span key={`${keyPrefix}-mk-${idx++}`} className="live-mark hl-yellow">
          <Token>==</Token>
          {match[25] || ''}
          <Token>==</Token>
        </span>
      );
    }

    lastIndex = matchEnd;
  }

  if (lastIndex < rawText.length) {
    parts.push(rawText.slice(lastIndex));
  }

  return parts;
}

export function renderLiveOverlay(rawText: string, keyPrefix = 'live'): React.ReactNode {
  if (!rawText) return null;
  return <>{renderParts(rawText, keyPrefix)}</>;
}
