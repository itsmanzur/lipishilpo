import React from 'react';

/**
 * Parses inline rich typography and tags (<mark>, **bold**, *italic*, etc.)
 * into React elements for the Visual Review Paper Surface.
 */
export function renderFormattedSpan(rawText: string, keyPrefix: string): React.ReactNode {
  if (!rawText) return null;

  // Regex pattern for all supported inline/block constructs
  // 1: Callout box :::box[Title] Content :::
  // 2: Scene divider (--- or ❖ ❖ ❖)
  // 3: Headings ## or ###
  // 4: Blockquote >
  // 5: <mark>...</mark>
  // 6: **bold**
  // 7: *italic*
  const pattern = /(:::box\[(.*?)\]([\s\S]*?):::)|(\n?---\n?|\n?❖ ❖ ❖\n?)|(\n?#{2,3}\s+[^\n]+)|(\n?>\s+[^\n]+)|(<mark(?:\s+[^>]*)?>([\s\S]*?)<\/mark>)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;

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
    // 2. Scene Divider --- or ❖ ❖ ❖
    else if (match[4]) {
      parts.push(
        <div key={`${keyPrefix}-div-${idx++}`} className="review-scene-divider">
          <span>❖ ❖ ❖</span>
        </div>
      );
    }
    // 3. Headings ## / ###
    else if (match[5]) {
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
    // 4. Blockquote >
    else if (match[6]) {
      const qText = matchedStr.replace(/^\n?>\s+/, '').trim();
      parts.push(
        <blockquote key={`${keyPrefix}-bq-${idx++}`} className="review-blockquote">
          {qText}
        </blockquote>
      );
    }
    // 5. <mark>...</mark>
    else if (match[7]) {
      const markContent = match[8] || '';
      parts.push(
        <mark key={`${keyPrefix}-mk-${idx++}`} className="review-mark-highlight">
          {markContent}
        </mark>
      );
    }
    // 6. **bold**
    else if (match[9]) {
      const boldContent = matchedStr.slice(2, -2);
      parts.push(
        <strong key={`${keyPrefix}-b-${idx++}`} className="review-bold">
          {boldContent}
        </strong>
      );
    }
    // 7. *italic*
    else if (match[10]) {
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