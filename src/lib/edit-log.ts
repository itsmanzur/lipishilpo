export type EditKind =
  | 'spelling'
  | 'grammar'
  | 'style'
  | 'punctuation'
  | 'replace'
  | 'custom';

export interface ChapterEdit {
  id: string;
  kind: EditKind;
  from: string;
  to: string;
  why?: string;
  count: number;
  date: string;
  customized?: boolean;
}

const KINDS: readonly EditKind[] = [
  'spelling',
  'grammar',
  'style',
  'punctuation',
  'replace',
  'custom',
];

export function isEditKind(value: string): value is EditKind {
  return (KINDS as readonly string[]).includes(value);
}

export function clipEditText(value: string, max = 180): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1) + '…';
}

function isBoundary(ch: string | undefined): boolean {
  return !ch || /[\s।!?…]/.test(ch);
}

/** One phrase-level hunk from a pause in typing — enough for a writer’s last change. */
export function diffManualEdits(
  before: string,
  after: string,
  why: string,
): Omit<ChapterEdit, 'id' | 'date'>[] {
  if (before === after) return [];

  let start = 0;
  const limit = Math.min(before.length, after.length);
  while (start < limit && before[start] === after[start]) start++;

  let endOld = before.length;
  let endNew = after.length;
  while (endOld > start && endNew > start && before[endOld - 1] === after[endNew - 1]) {
    endOld--;
    endNew--;
  }

  while (start > 0 && !isBoundary(before[start - 1]) && !isBoundary(after[start - 1])) {
    start--;
  }
  while (endOld < before.length && !isBoundary(before[endOld])) endOld++;
  while (endNew < after.length && !isBoundary(after[endNew])) endNew++;

  const from = before.slice(start, endOld).replace(/\s+/g, ' ').trim();
  const to = after.slice(start, endNew).replace(/\s+/g, ' ').trim();
  if (!from && !to) return [];
  if (from === to) return [];

  return [{
    kind: 'custom',
    from,
    to,
    why,
    count: 1,
    customized: true,
  }];
}
