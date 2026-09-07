/**
 * Smart Typographic replacements and helpers for Bengali & Multilingual Authoring
 */

export interface SmartTypingConfig {
  smartQuotes: boolean;
  smartDashes: boolean;
  smartEllipsis: boolean;
}

export const DEFAULT_SMART_TYPING_CONFIG: SmartTypingConfig = {
  smartQuotes: true,
  smartDashes: true,
  smartEllipsis: true,
};

/**
 * Handle smart keystrokes on textarea keydown
 */
export function handleSmartKeyDown(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  text: string,
  config: SmartTypingConfig = DEFAULT_SMART_TYPING_CONFIG
): { newText: string; newCursor: number } | null {
  const textarea = e.currentTarget;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  // Only apply when no large range is selected
  if (start !== end) return null;

  const prevChar = start > 0 ? text[start - 1] : '';
  const prev2Char = start > 1 ? text[start - 2] : '';

  // 1. Smart Double Quotes ( " -> “ or ” )
  if (config.smartQuotes && e.key === '"') {
    e.preventDefault();
    const isStart = !prevChar || /\s|[([{\-—]/.test(prevChar);
    const quote = isStart ? '“' : '”';
    const newText = text.substring(0, start) + quote + text.substring(end);
    return { newText, newCursor: start + 1 };
  }

  // 2. Smart Single Quotes ( ' -> ‘ or ’ )
  if (config.smartQuotes && e.key === "'") {
    e.preventDefault();
    const isStart = !prevChar || /\s|[([{\-—]/.test(prevChar);
    const quote = isStart ? '‘' : '’';
    const newText = text.substring(0, start) + quote + text.substring(end);
    return { newText, newCursor: start + 1 };
  }

  // 3. Smart Em-Dash ( - after - -> — )
  if (config.smartDashes && e.key === '-' && prevChar === '-') {
    e.preventDefault();
    // Replace the previous '-' and insert '—'
    const newText = text.substring(0, start - 1) + '—' + text.substring(end);
    return { newText, newCursor: start }; // cursor stays at the same absolute position which replaces 2 dashes with 1 emdash
  }

  // 4. Smart Ellipsis ( . after .. -> … )
  if (config.smartEllipsis && e.key === '.' && prevChar === '.' && prev2Char === '.') {
    e.preventDefault();
    // Replace previous '..' and insert '…'
    const newText = text.substring(0, start - 2) + '…' + text.substring(end);
    return { newText, newCursor: start - 1 };
  }

  return null;
}
