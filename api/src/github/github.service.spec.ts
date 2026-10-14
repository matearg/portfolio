import { GithubService, longestStreak } from './github.service.js';

const day = (date: string, count: number, contributionLevel = 'NONE') => ({
  date,
  contributionCount: count,
  contributionLevel,
});

const reply = (days: ReturnType<typeof day>[]) => ({
  ok: true,
  status: 200,
  json: async () => ({
    data: {
      user: {
        contributionsCollection: {
          totalCommitContributions: 3,
          totalPullRequestContributions: 1,
          contributionCalendar: {
            totalContributions: 4,
            weeks: [{ contributionDays: days }],
          },
        },
      },
    },
  }),
});

describe('GithubService', () => {
  beforeEach(() => vi.stubEnv('GITHUB_TOKEN', 'tok'));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('maps the calendar and computes the streak', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        reply([
          day('2026-01-01', 1, 'FIRST_QUARTILE'),
          day('2026-01-02', 3, 'FOURTH_QUARTILE'),
          day('2026-01-03', 0),
        ]),
      );
    vi.stubGlobal('fetch', fetch);
    const out = await new GithubService().contributions();
    expect(out).toEqual({
      total: 4,
      commits: 3,
      pullRequests: 1,
      longestStreak: 2,
      days: [
        { date: '2026-01-01', count: 1, level: 1 },
        { date: '2026-01-02', count: 3, level: 4 },
        { date: '2026-01-03', count: 0, level: 0 },
      ],
    });
    const [, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer tok');
  });

  it('caches for 6h and serves stale data when GitHub fails', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockResolvedValue(reply([day('2026-01-01', 1)]));
    vi.stubGlobal('fetch', fetch);
    const svc = new GithubService();
    const first = await svc.contributions();
    await svc.contributions();
    expect(fetch).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(6 * 60 * 60 * 1000);
    fetch.mockResolvedValue({ ok: false, status: 502 });
    expect(await svc.contributions()).toBe(first);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('throws without a token or when the user is missing', async () => {
    vi.stubEnv('GITHUB_TOKEN', '');
    await expect(new GithubService().contributions()).rejects.toThrow(
      'GITHUB_TOKEN',
    );
    vi.stubEnv('GITHUB_TOKEN', 'tok');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { user: null } }),
      }),
    );
    await expect(new GithubService().contributions()).rejects.toThrow(
      'GitHub query failed',
    );
  });
});

describe('longestStreak', () => {
  it('counts the longest run of non-zero days', () => {
    const d = (count: number) => ({ date: '', count, level: 0 });
    expect(longestStreak([])).toBe(0);
    expect(longestStreak([1, 1, 0, 1, 1, 1, 0].map(d))).toBe(3);
  });
});
