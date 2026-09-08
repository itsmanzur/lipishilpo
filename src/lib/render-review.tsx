import React from 'react';

/**
 * Parses inline rich typography and tags (<mark>, **bold**, *italic*, :::poem, :::dropcap, etc.)
 * into React elements for the Visual Review Paper Surface.
 */
export function renderFormattedSpan(rawText: string, keyPrefix: string): React.ReactNode {
  if (!rawText) return null;

  // Regex pattern for all supported inline/block constructs:
  // 1: Callout box :::box[Title] Content :::
  // 2: Poem block :::poem Content :::
  // 3: Drop cap block :::dropcap Content :::
  // 4: Scene dividers (--- | ❖ ❖ ❖ | ~ ❦ ~ | — ✦ — | * * * | ❧ ❧ ❧)
  // 5: Headings ## or ###
  // 6: Blockquote >
  // 7: <mark class="...">...</mark> or <mark>...</mark>
  // 8: Footnote definition [^N]: Text
  // 9: Footnote reference [^N]
  // 10: **bold**
  // 11: *italic*
  const pattern = /(:::box\[(.*?)\]([\s\S]*?):::)|(:::poem([\s\S]*?):::)|(:::dropcap([\s\S]*?):::)|(\n?(?:---|\u2756\s+\u2756\s+\u2756|~\s*\u2766\s*~|—\s*\u2726\s*—|\*\s*\*\s*\*|\u2767\s+\u2767\s+\u2767)\n?)|(\n?#{2,3}\s+[^\n]+)|(\n?>\s+[^\n]+)|(<mark(?:\s+class="([^"]*)")?>([\s\S]*?)<\/mark>)|(\n?\[\^([0-9\u09E6-\u09EF]+)\]:\s*([^\n]+))|(\[\^([0-9\u09E6-\u09EF]+)\])|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = pattern.exec(rawText)) !== null) {
    const matchStart = match.index;
    const matchEnd = pattern.lastIndex;
    const matchedStr = match[0];

    // Push preceding plain text
    if (matchStart > lastIndex) {
      parts.push(
        <span key={`${keyPrefix}-p-${idx++}`}>
          {rawText.slice(lastIndex, matchStart)}
        </span>
      );
    }

    // 1. Callout Box :::box[Title] Content :::
    if (match[1]) {
      const boxTitle = match[2] || 'তথ্য নোট';
      const boxBody = match[3] || '';
      parts.push(
        <div key={`${keyPrefix}-box-${idx++}`} className="review-callout-box">
          <div className="review-callout-title">
            <span>📌</span> {boxTitle}
          </div>
          <div className="review-callout-body">{boxBody.trim()}</div>
        </div>
      );
    }
    // 2. Poem Block :::poem Content :::
    else if (match[4]) {
      const poemBody = match[5] || '';
      parts.push(
        <div key={`${keyPrefix}-poem-${idx++}`} className="review-poem-block">
          <div className="review-poem-content">{poemBody.trim()}</div>
        </div>
      );
    }
    // 3. Drop Cap Block :::dropcap Content :::
    else if (match[6]) {
      const dropBody = (match[7] || '').trim();
      const firstChar = dropBody.charAt(0);
      const restText = dropBody.slice(1);
      parts.push(
        <div key={`${keyPrefix}-dropcap-${idx++}`} className="review-dropcap-block">
          <span className="review-dropcap-letter">{firstChar}</span>
          <span className="review-dropcap-text">{restText}</span>
        </div>
      );
    }
    // 4. Scene Divider
    else if (match[8]) {
      const dividerContent = matchedStr.trim() || '❖ ❖ ❖';
      parts.push(
        <div key={`${keyPrefix}-div-${idx++}`} className="review-scene-divider">
          <span>{dividerContent}</span>
        </div>
      );
    }
    // 5. Headings ## / ###
    else if (match[9]) {
      const hText = matchedStr.replace(/^\n?#{2,3}\s+/, '').trim();
      if (matchedStr.includes('###')) {
        parts.push(
          <h3 key={`${keyPrefix}-h3-${idx++}`} className="review-h3">
            {hText}
          </h3>
        );
      } else {
        parts.push(
          <h2 key={`${keyPrefix}-h2-${idx++}`} className="review-h2">
            {hText}
          </h2>
        );
      }
    }
    // 6. Blockquote >
    else if (match[10]) {
      const qText = matchedStr.replace(/^\n?>\s+/, '').trim();
      parts.push(
        <blockquote key={`${keyPrefix}-bq-${idx++}`} className="review-blockquote">
          {qText}
        </blockquote>
      );
    }
    // 7. <mark class="...">...</mark>
    else if (match[11]) {
      const markClass = match[12] || 'hl-yellow';
      const markContent = match[13] || '';
      parts.push(
        <mark key={`${keyPrefix}-mk-${idx++}`} className={`review-mark-highlight ${markClass}`}>
          {markContent}
        </mark>
      );
    }
    // 8. Footnote definition [^N]: Text
    else if (match[14]) {
      const fnNum = match[15];
      const fnText = match[16];
      parts.push(
        <div key={`${keyPrefix}-fndef-${idx++}`} className="review-footnote-def">
          <span className="review-footnote-num">[{fnNum}]</span>
          <span className="review-footnote-text">{fnText}</span>
        </div>
      );
    }
    // 9. Footnote reference [^N]
    else if (match[17]) {
      const fnNum = match[18];
      parts.push(
        <sup key={`${keyPrefix}-fnref-${idx++}`} className="review-footnote-ref">
          [{fnNum}]
        </sup>
      );
    }
    // 10. **bold**
    else if (match[19]) {
      const boldContent = matchedStr.slice(2, -2);
      parts.push(
        <strong key={`${keyPrefix}-b-${idx++}`} className="review-bold">
          {boldContent}
        </strong>
      );
    }
    // 11. *italic*
    else if (match[20]) {
      const italicContent = matchedStr.slice(1, -1);
      parts.push(
        <em key={`${keyPrefix}-i-${idx++}`} className="review-italic">
          {italicContent}
        </em>
      );
    }

    lastIndex = matchEnd;
  }

  // Remaining trailing text
  if (lastIndex < rawText.length) {
    parts.push(
      <span key={`${keyPrefix}-tail`}>
        {rawText.slice(lastIndex)}
      </span>
    );
  }

  return <>{parts}</>;
}