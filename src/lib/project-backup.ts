/**
 * Lipishilpo JSON Project Backup & Restore Engine
 * Allows 100% full fidelity backup and cross-site migration of manuscripts.
 */
import { type Project } from '../api';

export interface LipishilpoBackupFile {
  version: string;
  exportedAt: string;
  app: string;
  project: {
    title: string;
    genre: string;
    language: string;
    chapters: Array<{
      id: string;
      title: string;
      text: string;
      notes?: string;
    }>;
  };
}

/** Export project to a downloadable JSON file */
export function exportProjectToJson(project: Project) {
  const payload: LipishilpoBackupFile = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    app: 'Lipishilpo',
    project: {
      title: project.title,
      genre: project.genre || 'General Writing',
      language: project.language || 'Bengali',
      chapters: project.chapters.map((c) => ({
        id: c.id,
        title: c.title,
        text: c.text,
        notes: c.notes || '',
      })),
    },
  };

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
export async function parseProjectBackup(file: File): Promise<{
  title: string;
  genre: string;
  language: string;
  chapters: Array<{ id: string; title: string; text: string; notes?: string }>;
}> {
  const text = await file.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('অকার্যকর ফাইল ফরম্যাট (Invalid JSON)');
  }

  // Check structure
  if (parsed.project && Array.isArray(parsed.project.chapters)) {
    return {
      title: parsed.project.title || file.name.replace(/\.lipishilpo\.json$|\.json$/, ''),
      genre: parsed.project.genre || 'General Writing',
      language: parsed.project.language || 'Bengali',
      chapters: parsed.project.chapters.map((c: any, i: number) => ({
        id: c.id || crypto.randomUUID(),
        title: c.title || `Chapter ${i + 1}`,
        text: c.text || '',
        notes: c.notes || '',
      })),
    };
  }

  // Fallback for simple array of chapters
  if (Array.isArray(parsed)) {
    return {
      title: file.name.replace(/\.json$/, ''),
      genre: 'General Writing',
      language: 'Bengali',
      chapters: parsed.map((c: any, i: number) => ({
        id: c.id || crypto.randomUUID(),
        title: c.title || `Chapter ${i + 1}`,
        text: c.text || '',
        notes: c.notes || '',
      })),
    };
  }

  throw new Error('লিপিশিল্প প্রজেক্টের সঠিক ডেটা পাওয়া যায়নি।');
}
