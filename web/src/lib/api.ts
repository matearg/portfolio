export interface Project {
  id: number;
  title: string;
  slug: string;
  summaryEn: string;
  summaryEs: string;
  tags: string[];
  repoUrl: string | null;
  liveUrl: string | null;
  imageUrl: string | null;
  year: number | null;
  featured: boolean;
  order: number;
  published: boolean;
  updatedAt: string;
}

const API = import.meta.env.API_URL ?? 'http://localhost:3000';

// Public fetch that degrades to `fallback` instead of throwing.
async function getPublic<T, F>(path: string, fallback: F): Promise<T | F> {
  try {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`GET ${path} failed:`, err);
    return fallback;
  }
}

// An API outage degrades to the empty state instead of a 500.
export const getProjects = () => getPublic<Project[], Project[]>('/projects', []);

export interface Contributions {
  total: number;
  commits: number;
  pullRequests: number;
  longestStreak: number;
  days: { date: string; count: number; level: number }[];
}

// Null hides the section: GitHub activity is optional on the landing.
export const getContributions = () => getPublic<Contributions, null>('/github/contributions', null);

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Admin calls surface failures (unlike getProjects) so the admin sees what went wrong.
export async function adminFetch<T = unknown>(token: string | undefined, path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new ApiError(res.status, msg ?? `API responded ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
