import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const jwt = new JwtService({ secret: 'test' });
  let auth: AuthService;

  beforeEach(() => {
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ADMIN_PASSWORD = 'right';
    auth = new AuthService(jwt);
  });

  it('returns a token carrying the admin email', async () => {
    const { token } = await auth.login('Admin@Example.com', 'right');
    expect(jwt.verify(token).sub).toBe('admin@example.com');
  });

  it('rejects a wrong password', async () => {
    await expect(
      auth.login('admin@example.com', 'wrong'),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('fails closed when no password is configured', async () => {
    delete process.env.ADMIN_PASSWORD;
    await expect(auth.login('admin@example.com', '')).rejects.toMatchObject({
      status: 401,
    });
  });

  it('locks out after 5 failures, even for the right password', async () => {
    for (let i = 0; i < 5; i++) {
      await expect(
        auth.login('admin@example.com', 'wrong'),
      ).rejects.toMatchObject({ status: 401 });
    }
    await expect(
      auth.login('admin@example.com', 'right'),
    ).rejects.toMatchObject({ status: 429 });
  });
});
