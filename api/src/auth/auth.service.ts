import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, timingSafeEqual } from 'node:crypto';

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60_000;

// Hashing first gives equal-length buffers, which timingSafeEqual requires.
const same = (a: string, b: string) =>
  timingSafeEqual(
    createHash('sha256').update(a).digest(),
    createHash('sha256').update(b).digest(),
  );

@Injectable()
export class AuthService {
  // shortcut: lockout is global (every login arrives via the Astro server), fine for one admin; key by client IP if that changes.
  private failures: number[] = [];

  constructor(private readonly jwt: JwtService) {}

  async login(email: string, password: string) {
    const now = Date.now();
    this.failures = this.failures.filter((t) => now - t < WINDOW_MS);
    if (this.failures.length >= MAX_FAILURES) {
      throw new HttpException(
        'Too many attempts, try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    // Evaluate both comparisons so timing doesn't reveal which one failed.
    const emailOk =
      !!ADMIN_EMAIL && same(email.toLowerCase(), ADMIN_EMAIL.toLowerCase());
    const passwordOk = !!ADMIN_PASSWORD && same(password, ADMIN_PASSWORD);
    if (!emailOk || !passwordOk) {
      this.failures.push(now);
      throw new UnauthorizedException('Wrong email or password');
    }
    return { token: await this.jwt.signAsync({ sub: ADMIN_EMAIL }) };
  }
}
