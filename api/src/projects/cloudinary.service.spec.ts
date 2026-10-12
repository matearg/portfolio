import { createHash } from 'node:crypto';
import {
  CloudinaryService,
  publicIdFromUrl,
  sign,
} from './cloudinary.service.js';

describe('CloudinaryService.destroy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('is a no-op without CLOUDINARY_URL', async () => {
    vi.stubEnv('CLOUDINARY_URL', '');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const svc = new CloudinaryService();
    expect(
      svc.publicIdOf(
        'https://res.cloudinary.com/demo/image/upload/portfolio/a.jpg',
      ),
    ).toBeFalsy();
    await svc.destroy('portfolio/a');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('posts a signed destroy for the public id', async () => {
    vi.stubEnv('CLOUDINARY_URL', 'cloudinary://key:s%40cret@demo');
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetch);
    await new CloudinaryService().destroy('portfolio/a');
    const [url, { body }] = fetch.mock.calls[0] as [string, { body: FormData }];
    expect(url).toBe('https://api.cloudinary.com/v1_1/demo/image/destroy');
    expect(body.get('public_id')).toBe('portfolio/a');
    expect(body.get('api_key')).toBe('key');
    expect(body.get('signature')).toBe(
      sign(
        { public_id: 'portfolio/a', timestamp: Number(body.get('timestamp')) },
        's@cret',
      ),
    );
  });
});

describe('publicIdFromUrl', () => {
  const base = 'https://res.cloudinary.com/demo/image/upload';

  it('drops the version segment and extension, keeps the folder', () => {
    expect(
      publicIdFromUrl(`${base}/v1712345678/portfolio/abc.jpg`, 'demo'),
    ).toBe('portfolio/abc');
  });

  it('works without a version segment', () => {
    expect(publicIdFromUrl(`${base}/portfolio/abc.webp`, 'demo')).toBe(
      'portfolio/abc',
    );
  });

  it('rejects external URLs, other clouds and other folders', () => {
    expect(
      publicIdFromUrl('https://example.com/portfolio/abc.jpg', 'demo'),
    ).toBeNull();
    expect(publicIdFromUrl(`${base}/v1/portfolio/abc.jpg`, 'other')).toBeNull();
    expect(publicIdFromUrl(`${base}/v1/elsewhere/abc.jpg`, 'demo')).toBeNull();
  });
});

describe('sign', () => {
  it('sorts params, joins with &, appends the secret and SHA-1s it', () => {
    const expected = createHash('sha1')
      .update('folder=portfolio&timestamp=1315060510abcd')
      .digest('hex');
    expect(sign({ timestamp: 1315060510, folder: 'portfolio' }, 'abcd')).toBe(
      expected,
    );
  });
});
