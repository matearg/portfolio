import { createHash } from 'node:crypto';
import { sign } from './cloudinary.service.js';

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
