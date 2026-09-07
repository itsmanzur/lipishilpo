/**
 * WordPress REST API client — লিপিশিল্প
 */

export interface WPConfig {
  restUrl: string;
  adminUrl: string;
  nonce: string;
  userId: number;
  isPro: boolean;
  version: string;
  dictsUrl: string;
}

export function getWPConfig(): WPConfig {
  const el = document.getElementById('lipishilpo-root');
  return {
    restUrl: el?.dataset.restUrl ?? '/wp-json/lipishilpo/v1',
    adminUrl: el?.dataset.adminUrl ?? '/wp-admin/',
    nonce: el?.dataset.nonce ?? '',
    userId: parseInt(el?.dataset.userId ?? '0', 10),
    isPro: el?.dataset.pro === '1',
    version: el?.dataset.version ?? '1.0.0',
    dictsUrl: el?.dataset.dictsUrl ?? '',
  };
}

const config = getWPConfig();

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

function normalizeProject(p: Project): Project {
  return {
    ...p,
    id: String(p.id),
    snapshots: p.snapshots ?? {},
    comments: p.comments ?? {},
    edits: p.edits ?? {},
  };
}

export type ChapterStatus = 'draft' | 'in_progress' | 'revised' | 'final';

export type Chapter = {
  id: string;
  title: string;
  text: string;
  notes?: string;
  status?: ChapterStatus;
  partTitle?: string;
};
export type Project = {
  id: string;
  title: string;
  genre: string;
  language: string;
  chapters: Chapter[];
  snapshots?: Record<string, unknown[]>;
  comments?: Record<string, unknown[]>;
  edits?: Record<string, unknown[]>;
  created?: string;
  modified?: string;
};

export interface ProjectList {
  items: Project[];
  total: number;
  pages: number;
}

export interface UserPrefs {
  dictionary: string[];
  dailyTarget: number;
  streak: number;
  lastStreakDate: string;
}

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

export async function fetchProjects(page = 1, perPage = 40): Promise<ProjectList> {
  const r = await wpFetch(`projects?page=${page}&per_page=${perPage}`);
  if (!r.ok) throw new Error('প্রজেক্ট লোড হয়নি।');
  const list = await r.json() as Project[];
  return {
    items: list.map(normalizeProject),
    total: parseInt(r.headers.get('X-WP-Total') ?? String(list.length), 10),
    pages: parseInt(r.headers.get('X-WP-TotalPages') ?? '1', 10),
  };
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
  return normalizeProject(await r.json() as Project);
}

export async function updateProject(
  id: number | string,
  data: Partial<Pick<Project, 'title' | 'genre' | 'language' | 'chapters' | 'snapshots' | 'comments' | 'edits'>>
): Promise<Project> {
  const r = await wpFetch(`projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || 'প্রজেক্ট আপডেট হয়নি।');
  }
  return normalizeProject(await r.json() as Project);
}

export async function deleteProject(id: number | string): Promise<void> {
  const r = await wpFetch(`projects/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error('প্রজেক্ট মুছে ফেলা যায়নি।');
}

export async function fetchPrefs(): Promise<UserPrefs> {
  const fallback: UserPrefs = { dictionary: [], dailyTarget: 500, streak: 0, lastStreakDate: '' };
  try {
    const r = await wpFetch('prefs');
    if (!r.ok) return fallback;
    return await r.json() as UserPrefs;
  } catch {
    return fallback;
  }
}

export async function updatePrefs(data: Partial<UserPrefs>): Promise<UserPrefs> {
  const r = await wpFetch('prefs', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || 'সেটিংস সংরক্ষণ হয়নি।');
  }
  return await r.json() as UserPrefs;
}

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

export { config as wpConfig };
