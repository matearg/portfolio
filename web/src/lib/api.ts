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
}

// An API outage degrades to the empty state instead of a 500.
export async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${import.meta.env.API_URL ?? 'http://localhost:3000'}/projects`);
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('getProjects failed:', err);
    return [];
  }
}
