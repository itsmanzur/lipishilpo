/**
 * Lipishilpo JSON Project Backup & Restore Engine
 * Allows 100% full fidelity backup and cross-site migration of manuscripts.
 */
import { type Chapter, type Project } from '../api';
import { createId } from './id';

export interface LipishilpoBackupFile {
  version: string;
  exportedAt: string;
  app: string;
  project: BackupProject;
}

export type BackupProject = Pick<Project, 'title' | 'genre' | 'language' | 'chapters' | 'codex' | 'snapshots' | 'comments' | 'edits'>;

export function createProjectBackup(project: Project): LipishilpoBackupFile {
  return {
    version: '2.0.0', exportedAt: new Date().toISOString(), app: 'Lipishilpo',
    project: {
      title: project.title, genre: project.genre, language: project.language,
      chapters: project.chapters.map((chapter) => ({ ...chapter })),
      codex: project.codex ?? { characters: [], lore: [] },
      snapshots: project.snapshots ?? {}, comments: project.comments ?? {}, edits: project.edits ?? {},
    },
  };
}

/** Export project to a downloadable JSON file */
export function exportProjectToJson(project: Project) {
  const payload = createProjectBackup(project);

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = (project.title || 'manuscript').toLowerCase().replace(/[^\w\u0980-\u09FF]+/g, '-');
  a.href = url;
  a.download = `${slug}-backup-${new Date().toISOString().slice(0, 10)}.lipishilpo.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Validate and parse an imported Lipishilpo JSON file */
export async function parseProjectBackup(file: File): Promise<BackupProject> {
  const parsed: unknown = JSON.parse(await file.text());
  const isRecord = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
  const data = Array.isArray(parsed) ? { chapters: parsed } : isRecord(parsed) && isRecord(parsed.project) ? parsed.project : null;
  if (!data || !Array.isArray(data.chapters)) throw new Error('Invalid project backup');
  if (isRecord(parsed) && parsed.version && !['1.0.0', '2.0.0'].includes(parsed.version)) throw new Error('Unsupported backup version');
  const ids = new Set<string>();
  const chapters: Chapter[] = data.chapters.map((c: unknown, index: number) => {
    if (!isRecord(c) || typeof c.text !== 'string') throw new Error('Invalid chapter');
    const id = typeof c.id === 'string' && c.id ? c.id : createId();
    if (ids.has(id)) throw new Error('Duplicate chapter ID');
    ids.add(id);
    if (c.status !== undefined && !['draft', 'in_progress', 'revised', 'final'].includes(c.status)) throw new Error('Invalid chapter status');
    for (const field of ['title', 'notes', 'partTitle']) {
      if (c[field] !== undefined && typeof c[field] !== 'string') throw new Error('Invalid chapter field');
    }
    return { id, title: c.title || 'Chapter ' + (index + 1), text: c.text, notes: c.notes ?? '', status: c.status ?? 'draft', partTitle: c.partTitle ?? '' };
  });
  const map = (key: string): Record<string, unknown[]> => {
    const value = data[key] ?? {};
    if (!isRecord(value) || Object.values(value).some((items) => !Array.isArray(items) || items.some((item: unknown) => !isRecord(item)))) throw new Error('Invalid backup metadata');
    return value;
  };
  const codex = data.codex ?? { characters: [], lore: [] };
  if (!isRecord(codex) || !Array.isArray(codex.characters) || !Array.isArray(codex.lore) || [...codex.characters, ...codex.lore].some((item) => !isRecord(item))) throw new Error('Invalid codex');
  for (const field of ['title', 'genre', 'language']) {
    if (data[field] !== undefined && typeof data[field] !== 'string') throw new Error('Invalid project field');
  }
  return {
    title: data.title || file.name.replace(/\.lipishilpo\.json$|\.json$/, ''),
    genre: data.genre || 'General Writing', language: data.language || 'Bengali',
    chapters, codex: { characters: codex.characters, lore: codex.lore },
    snapshots: map('snapshots'), comments: map('comments'), edits: map('edits'),
  };
}
