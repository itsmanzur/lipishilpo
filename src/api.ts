/**
 * WordPress REST API client — লিপিশিল্প
 *
 * WordPress-এর root element থেকে configuration নেওয়া হয়।
 * Profder-এর Cloudflare fetch এবং localStorage replace করে।
 */

export interface WPConfig {
  restUrl: string;
  adminUrl: string;
  nonce: string;
  userId: number;
  isPro: boolean;
  version: string;
}

/** WordPress root element থেকে config পড়া */
export function getWPConfig(): WPConfig {
  const el = document.getElementById('lipishilpo-root');
  return {
    restUrl: el?.dataset.restUrl ?? '/wp-json/lipishilpo/v1',
    adminUrl: el?.dataset.adminUrl ?? '/wp-admin/',
    nonce: el?.dataset.nonce ?? '',
    userId: parseInt(el?.dataset.userId ?? '0', 10),
    isPro: el?.dataset.pro === '1',
    version: el?.dataset.version ?? '1.0.0',
  };
}

const config = getWPConfig();

/** WordPress REST API-তে নিরাপদ fetch */
async function wpFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = config.restUrl.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  const headers: Record<string, string> = {
    'X-WP-Nonce': config.nonce,
    ...(options.headers as Record<string, string>),
  };

  if (
    options.method === 'POST' ||
    options.method === 'PUT' ||
    options.method === 'PATCH'
  ) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, { ...options, headers });
}

// ── Types ──────────────────────────────────────────────────────────────────
export type Chapter = { id: string; title: string; text: string; notes?: string };
export type Project = {
  id: string;  // WP API থেকে number আসে — fetchProjects()-এ String() করা হয়
  title: string;
  genre: string;
  language: string;
  chapters: Chapter[];
  created?: string;
  modified?: string;
};

export interface PublishParams {
  title: string;
  content: string;
  status: 'draft' | 'publish';
  post_type: 'post' | 'page';
}

export interface PublishResult {
  success: boolean;
  postId: number;
  editUrl: string;
  viewUrl: string;
  status: string;
}

// ── Projects API ───────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  const r = await wpFetch('projects');
  if (!r.ok) throw new Error('প্রজেক্ট লোড হয়নি।');
  const list = await r.json() as Project[];
  // WP API numeric id → string
  return list.map((p) => ({ ...p, id: String(p.id) }));
}

export async function createProject(data: {
  title: string;
  genre: string;
  language: string;
}): Promise<Project> {
  const r = await wpFetch('projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || 'প্রজেক্ট তৈরি হয়নি।');
  }
  const p = await r.json() as Project;
  return { ...p, id: String(p.id) };
}

export async function updateProject(
  id: number | string,
  data: Partial<Pick<Project, 'title' | 'genre' | 'language' | 'chapters'>>
): Promise<Project> {
  const r = await wpFetch(`projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || 'প্রজেক্ট আপডেট হয়নি।');
  }
  return r.json();
}

export async function deleteProject(id: number | string): Promise<void> {
  const r = await wpFetch(`projects/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error('প্রজেক্ট মুছে ফেলা যায়নি।');
}

// ── Proofread API (Free) ───────────────────────────────────────────────────

export interface ProofIssue {
  from: string;
  to: string;
  why: string;
  kind: string;
  optional?: boolean;
  count?: number;
}

export async function proofread(
  text: string,
  language: string
): Promise<ProofIssue[]> {
  const r = await wpFetch('proofread', {
    method: 'POST',
    body: JSON.stringify({ text, language }),
  });
  if (!r.ok) throw new Error('প্রুফরিডিং করা যায়নি।');
  const data = await r.json();
  return data.issues ?? [];
}

// ── Analyze API (Pro) ──────────────────────────────────────────────────────

export interface AnalyzeStatus {
  configured: boolean;
  pro: boolean;
  model: string;
  maxPartChars: number;
}

export async function fetchAnalyzeStatus(): Promise<AnalyzeStatus> {
  const r = await wpFetch('analyze');
  if (!r.ok) return { configured: false, pro: false, model: '', maxPartChars: 12000 };
  return r.json();
}

export async function analyzeChapter(body: unknown, signal?: AbortSignal): Promise<unknown> {
  const r = await wpFetch('analyze', {
    method: 'POST',
    body: JSON.stringify(body),
    signal,
  } as RequestInit);
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || data.error || 'বিশ্লেষণ করা যায়নি।');
  return data;
}

// ── Export Status (Pro) ────────────────────────────────────────────────────

export interface ExportStatus {
  pro: boolean;
  docx: boolean;
  pdf: boolean;
  epub: boolean;
  txt: boolean;
}

export async function fetchExportStatus(): Promise<ExportStatus> {
  const r = await wpFetch('export/status');
  if (!r.ok) return { pro: false, docx: false, pdf: false, epub: false, txt: true };
  return r.json();
}

/** ১-ক্লিকে ওয়ার্ডপ্রেসের ড্রাফট বা পাবলিশড পোস্টে পাঠানো */
export async function publishToWordPress(params: PublishParams): Promise<PublishResult> {
  const r = await wpFetch('publish', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || 'পোস্ট তৈরি করা যায়নি।');
  }
  return await r.json() as PublishResult;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** অটোসেভ — debounce দিয়ে API কল */
export function createAutosave(
  projectId: number | string,
  onSaved: () => void,
  onError: (msg: string) => void,
  delayMs = 1500
) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return function save(chapters: Chapter[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        await updateProject(projectId, { chapters });
        onSaved();
      } catch (e) {
        onError(e instanceof Error ? e.message : 'সংরক্ষণ হয়নি।');
      }
    }, delayMs);
  };
}

export { config as wpConfig };
