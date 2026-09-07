export type DiffOp = { type: 'eq' | 'add' | 'del'; text: string };

export function splitDiffUnits(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n');
  if (normalized.includes('\n') && normalized.length > 80) {
    const lines = normalized.split('\n');
    return lines.map((line, i) => (i < lines.length - 1 ? `${line}\n` : line)).filter((u, i, arr) => u !== '' || i < arr.length - 1);
  }
  return normalized.split(/(\s+)/).filter(Boolean);
}

function coarseDiff(a: string[], b: string[]): DiffOp[] {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
  let endA = a.length - 1;
  let endB = b.length - 1;
  while (endA >= start && endB >= start && a[endA] === b[endB]) {
    endA -= 1;
    endB -= 1;
  }
  const out: DiffOp[] = [];
  if (start > 0) out.push({ type: 'eq', text: a.slice(0, start).join('') });
  if (endA >= start) out.push({ type: 'del', text: a.slice(start, endA + 1).join('') });
  if (endB >= start) out.push({ type: 'add', text: b.slice(start, endB + 1).join('') });
  if (endA + 1 < a.length) out.push({ type: 'eq', text: a.slice(endA + 1).join('') });
  return mergeOps(out);
}

function lcsDiff(a: string[], b: string[]): DiffOp[] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: 'eq', text: a[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', text: a[i] });
      i += 1;
    } else {
      out.push({ type: 'add', text: b[j] });
      j += 1;
    }
  }
  while (i < n) {
    out.push({ type: 'del', text: a[i] });
    i += 1;
  }
  while (j < m) {
    out.push({ type: 'add', text: b[j] });
    j += 1;
  }
  return mergeOps(out);
}

function mergeOps(ops: DiffOp[]): DiffOp[] {
  const merged: DiffOp[] = [];
  for (const op of ops) {
    if (!op.text) continue;
    const last = merged[merged.length - 1];
    if (last && last.type === op.type) last.text += op.text;
    else merged.push({ ...op });
  }
  return merged;
}

export function diffTexts(before: string, after: string): DiffOp[] {
  if (before === after) return before ? [{ type: 'eq', text: before }] : [];
  const a = splitDiffUnits(before);
  const b = splitDiffUnits(after);
  if (a.length * b.length > 180000) return coarseDiff(a, b);
  return lcsDiff(a, b);
}

export function diffStats(ops: DiffOp[]) {
  let added = 0;
  let removed = 0;
  for (const op of ops) {
    const words = op.text.trim() ? op.text.trim().split(/\s+/).length : 0;
    if (op.type === 'add') added += words;
    if (op.type === 'del') removed += words;
  }
  return { added, removed };
}
