import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

const LOGIN = 'matearg';
const TTL = 6 * 60 * 60 * 1000;
// GitHub's quartile enum, in order, so the index is the 0-4 heat level.
const LEVELS = [
  'NONE',
  'FIRST_QUARTILE',
  'SECOND_QUARTILE',
  'THIRD_QUARTILE',
  'FOURTH_QUARTILE',
];

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

interface Day {
  date: string;
  count: number;
  level: number;
}

export interface Contributions {
  total: number;
  commits: number;
  pullRequests: number;
  longestStreak: number;
  days: Day[];
}

export function longestStreak(days: Day[]) {
  let best = 0;
  let run = 0;
  for (const d of days) {
    run = d.count ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

@Injectable()
export class GithubService {
  private cache?: { at: number; data: Contributions };

  async contributions(): Promise<Contributions> {
    if (this.cache && Date.now() - this.cache.at < TTL) return this.cache.data;
    try {
      const data = await this.fetch();
      this.cache = { at: Date.now(), data };
      return data;
    } catch (err) {
      // Stale beats nothing when GitHub is down.
      if (this.cache) return this.cache.data;
      throw err;
    }
  }

  private async fetch(): Promise<Contributions> {
    if (!process.env.GITHUB_TOKEN) {
      throw new ServiceUnavailableException('GITHUB_TOKEN is not set');
    }
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'portfolio-api',
      },
      body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
    });
    const body = res.ok
      ? ((await res.json()) as {
          data?: { user: { contributionsCollection: Collection } | null };
        })
      : null;
    const c = body?.data?.user?.contributionsCollection;
    if (!c) {
      throw new BadGatewayException(`GitHub query failed (${res.status})`);
    }
    const days = c.contributionCalendar.weeks.flatMap((w) =>
      w.contributionDays.map((d) => ({
        date: d.date,
        count: d.contributionCount,
        level: Math.max(0, LEVELS.indexOf(d.contributionLevel)),
      })),
    );
    return {
      total: c.contributionCalendar.totalContributions,
      commits: c.totalCommitContributions,
      pullRequests: c.totalPullRequestContributions,
      longestStreak: longestStreak(days),
      days,
    };
  }
}

interface Collection {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  contributionCalendar: {
    totalContributions: number;
    weeks: {
      contributionDays: {
        date: string;
        contributionCount: number;
        contributionLevel: string;
      }[];
    }[];
  };
}
