/**
 * Unified manuscript import: Lipishilpo JSON backup + Word (.docx).
 * Parsing stays in the browser so the file is never uploaded elsewhere.
 */
import { createId } from './id';
import { parseProjectBackup } from './project-backup';

export type ImportSource = 'json' | 'docx' | 'markdown' | 'text';

export interface ImportedManuscript {
  title: string;
  genre: string;
  language: string;
  chapters: Array<{ id: string; title: string; text: string; notes?: string }>;
  source: ImportSource;
}

export type ImportErrorCode =
  | 'too_large'
  | 'legacy_doc'
  | 'unsupported'
  | 'empty'
  | 'invalid_json'
  | 'parse_failed'
  | 'too_long';

export class ManuscriptImportError extends Error {
  constructor(public readonly code: ImportErrorCode) {
    super(code);
    this.name = 'ManuscriptImportError';
  }
}

const MAX_BYTES = 12 * 1024 * 1024;
const MAX_CHAPTERS = 200;
const MAX_CHARS = 500_000;
const CHAPTER_LINE = /^(?:অধ্যায়|অধ্যায়|পরিচ্ছেদ|দৃশ্য|Chapter|CHAPTER)\s*[\d০-৯IVXLCDM]+/u;

function fileNameTitle(file: File): string {
  return file.name
    .replace(/\.lipishilpo\.json$/i, '')
    .replace(/\.(json|docx|doc|txt|md|markdown)$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim() || 'Imported manuscript';
}

function detectLanguage(text: string): string {
  const bn = (text.match(/[\u0980-\u09FF]/g) || []).length;
  const en = (text.match(/[A-Za-z]/g) || []).length;
  if (bn > 20 && en > 20) return 'English + বাংলা';
  if (bn > en) return 'বাংলা';
  return 'English';
}

function newId(): string {
  return createId();
}

function htmlToPlain(root: ParentNode): string {
  const blocks = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'LI', 'TR', 'BLOCKQUOTE', 'TABLE']);
  const parts: string[] = [];

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.textContent || '');
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    if (el.tagName === 'BR') {
      parts.push('\n');
      return;
    }
    if (el.tagName === 'IMG') return;
    el.childNodes.forEach(walk);
    if (blocks.has(el.tagName)) parts.push('\n\n');
  };

  root.childNodes.forEach(walk);
  return parts.join('').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function makeChapter(title: string, text: string, index: number) {
  return {
    id: newId(),
    title: (title.trim() || `Chapter ${index + 1}`).slice(0, 120),
    text: text.trim(),
    notes: '',
  };
}

function splitByMarkers(text: string): Array<{ title: string; text: string }> | null {
  const lines = text.split(/\r?\n/);
  const starts: number[] = [];
  lines.forEach((line, i) => {
    if (CHAPTER_LINE.test(line.trim())) starts.push(i);
  });
  if (starts.length < 2) return null;

  const sections: Array<{ title: string; text: string }> = [];
  const preface = lines.slice(0, starts[0]).join('\n').trim();
  if (preface) {
    sections.push({ title: 'ভূমিকা', text: preface });
  }
  starts.forEach((start, i) => {
    const end = starts[i + 1] ?? lines.length;
    sections.push({
      title: lines[start].trim(),
      text: lines.slice(start + 1, end).join('\n').trim(),
    });
  });
  return sections;
}

function splitMarkdownHeadings(rawText: string, fallbackTitle: string): { title: string; chapters: ImportedManuscript['chapters'] } {
  const lines = rawText.split(/\r?\n/);
  const chapters: ImportedManuscript['chapters'] = [];
  let projectTitle = fallbackTitle;
  let currentTitle = '';
  let currentLines: string[] = [];

  const headingMatch = (l: string) => {
    const m = l.match(/^(#{1,3})\s+(.*)$/);
    if (m) return { level: m[1].length, text: m[2].trim() };
    return null;
  };

  lines.forEach((line) => {
    const heading = headingMatch(line);
    if (heading) {
      if (!currentTitle && currentLines.length === 0 && heading.level === 1) {
        projectTitle = heading.text;
        currentTitle = heading.text;
      } else {
        if (currentTitle || currentLines.join('\n').trim()) {
          chapters.push(makeChapter(currentTitle || fallbackTitle, currentLines.join('\n'), chapters.length));
        }
        currentTitle = heading.text;
        currentLines = [];
      }
    } else {
      currentLines.push(line);
    }
  });

  if (currentTitle || currentLines.join('\n').trim()) {
    chapters.push(makeChapter(currentTitle || fallbackTitle, currentLines.join('\n'), chapters.length));
  }

  if (chapters.length <= 1) {
    const marked = splitByMarkers(rawText);
    if (marked && marked.length > 1) {
      return {
        title: projectTitle.slice(0, 120),
        chapters: marked.map((s, i) => makeChapter(s.title, s.text, i)).slice(0, MAX_CHAPTERS),
      };
    }
  }

  if (chapters.length === 0) {
    chapters.push(makeChapter(fallbackTitle, rawText, 0));
  }

  return { title: projectTitle.slice(0, 120), chapters: chapters.slice(0, MAX_CHAPTERS) };
}

function splitHtmlByHeading(root: Element, tag: 'h1' | 'h2', fallbackTitle: string) {
  const chapters: ImportedManuscript['chapters'] = [];
  let title = fallbackTitle;
  let bucket = root.ownerDocument.createElement('div');

  const flush = () => {
    const text = htmlToPlain(bucket);
    if (!text && chapters.length === 0) {
      bucket = root.ownerDocument.createElement('div');
      return;
    }
    if (!text && !title.trim()) {
      bucket = root.ownerDocument.createElement('div');
      return;
    }
    chapters.push(makeChapter(title, text, chapters.length));
    bucket = root.ownerDocument.createElement('div');
  };

  Array.from(root.childNodes).forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === tag.toUpperCase()) {
      flush();
      title = ((node as Element).textContent || '').trim() || `Chapter ${chapters.length + 1}`;
      return;
    }
    bucket.appendChild(node.cloneNode(true));
  });
  flush();
  return chapters.filter((c) => c.text || c.title);
}

function chaptersFromHtml(html: string, fallbackTitle: string): { title: string; chapters: ImportedManuscript['chapters'] } {
  const doc = new DOMParser().parseFromString(`<div id="lipi-import">${html}</div>`, 'text/html');
  const root = doc.getElementById('lipi-import') || doc.body;
  const h1s = root.querySelectorAll('h1');
  const h2s = root.querySelectorAll('h2');

  let projectTitle = fallbackTitle;
  let chapters: ImportedManuscript['chapters'] = [];

  if (h1s.length >= 2) {
    projectTitle = (h1s[0].textContent || '').trim() || fallbackTitle;
    chapters = splitHtmlByHeading(root, 'h1', fallbackTitle);
  } else if (h1s.length === 1 && h2s.length >= 2) {
    projectTitle = (h1s[0].textContent || '').trim() || fallbackTitle;
    h1s[0].remove();
    chapters = splitHtmlByHeading(root, 'h2', fallbackTitle);
  } else if (h1s.length === 1) {
    chapters = splitHtmlByHeading(root, 'h1', fallbackTitle);
    if (chapters.length === 1) projectTitle = chapters[0].title || fallbackTitle;
  } else if (h2s.length >= 2) {
    chapters = splitHtmlByHeading(root, 'h2', fallbackTitle);
  } else {
    const text = htmlToPlain(root);
    const marked = splitByMarkers(text);
    if (marked) {
      chapters = marked.map((s, i) => makeChapter(s.title, s.text, i));
    } else {
      chapters = [makeChapter(fallbackTitle, text, 0)];
    }
  }

  if (chapters.length <= 1) {
    const combined = chapters.map((c) => c.text).join('\n\n');
    const marked = splitByMarkers(combined);
    if (marked && marked.length > 1) {
      chapters = marked.map((s, i) => makeChapter(s.title, s.text, i));
    }
  }

  if (chapters.length === 0) {
    throw new ManuscriptImportError('empty');
  }

  return { title: projectTitle.slice(0, 120), chapters: chapters.slice(0, MAX_CHAPTERS) };
}

async function sniffHeader(file: File): Promise<Uint8Array> {
  const buf = await file.slice(0, 8).arrayBuffer();
  return new Uint8Array(buf);
}

function isOleDoc(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
}

function isZip(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

async function parseDocx(file: File): Promise<ImportedManuscript> {
  const header = await sniffHeader(file);
  if (isOleDoc(header)) throw new ManuscriptImportError('legacy_doc');
  if (!isZip(header)) throw new ManuscriptImportError('unsupported');

  let html: string;
  try {
    const mammothMod = await import('mammoth');
    const mammoth = mammothMod.default ?? mammothMod;
    const result = await mammoth.convertToHtml(
      { arrayBuffer: await file.arrayBuffer() },
      { convertImage: mammoth.images.imgElement(() => Promise.resolve({ src: '' })) }
    );
    html = result.value || '';
  } catch {
    throw new ManuscriptImportError('parse_failed');
  }

  if (!html.replace(/<[^>]+>/g, '').trim()) {
    throw new ManuscriptImportError('empty');
  }

  const { title, chapters } = chaptersFromHtml(html, fileNameTitle(file));
  const allText = chapters.map((c) => c.text).join('\n');
  if (allText.length > MAX_CHARS) throw new ManuscriptImportError('too_long');

  return {
    title,
    genre: 'General Writing',
    language: detectLanguage(allText),
    chapters,
    source: 'docx',
  };
}

async function parseMarkdown(file: File): Promise<ImportedManuscript> {
  const rawText = await file.text();
  if (!rawText.trim()) throw new ManuscriptImportError('empty');
  if (rawText.length > MAX_CHARS) throw new ManuscriptImportError('too_long');

  const { title, chapters } = splitMarkdownHeadings(rawText, fileNameTitle(file));
  const allText = chapters.map((c) => c.text).join('\n');

  return {
    title,
    genre: 'General Writing',
    language: detectLanguage(allText),
    chapters,
    source: 'markdown',
  };
}

async function parsePlainText(file: File): Promise<ImportedManuscript> {
  const rawText = await file.text();
  if (!rawText.trim()) throw new ManuscriptImportError('empty');
  if (rawText.length > MAX_CHARS) throw new ManuscriptImportError('too_long');

  const fallback = fileNameTitle(file);
  const marked = splitByMarkers(rawText);
  let chapters: ImportedManuscript['chapters'];

  if (marked && marked.length > 1) {
    chapters = marked.map((s, i) => makeChapter(s.title, s.text, i));
  } else {
    chapters = [makeChapter(fallback, rawText, 0)];
  }

  const allText = chapters.map((c) => c.text).join('\n');

  return {
    title: fallback,
    genre: 'General Writing',
    language: detectLanguage(allText),
    chapters: chapters.slice(0, MAX_CHAPTERS),
    source: 'text',
  };
}

export async function importManuscriptFile(file: File): Promise<ImportedManuscript> {
  if (file.size > MAX_BYTES) throw new ManuscriptImportError('too_large');

  const name = file.name.toLowerCase();
  if (name.endsWith('.doc') && !name.endsWith('.docx')) {
    throw new ManuscriptImportError('legacy_doc');
  }

  if (name.endsWith('.json') || name.endsWith('.lipishilpo.json')) {
    try {
      const parsed = await parseProjectBackup(file);
      if (!parsed.chapters.length) throw new ManuscriptImportError('empty');
      return { ...parsed, source: 'json' };
    } catch (err) {
      if (err instanceof ManuscriptImportError) throw err;
      throw new ManuscriptImportError('invalid_json');
    }
  }

  if (name.endsWith('.md') || name.endsWith('.markdown')) {
    return parseMarkdown(file);
  }

  if (name.endsWith('.txt')) {
    return parsePlainText(file);
  }

  if (name.endsWith('.docx') || file.type.includes('wordprocessingml') || file.type === 'application/msword') {
    if (file.type === 'application/msword' && !name.endsWith('.docx')) {
      throw new ManuscriptImportError('legacy_doc');
    }
    return parseDocx(file);
  }

  const header = await sniffHeader(file);
  if (isOleDoc(header)) throw new ManuscriptImportError('legacy_doc');
  if (isZip(header)) return parseDocx(file);

  return parsePlainText(file);
}

