import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module.js';
import { PrismaService } from './prisma/prisma.service.js';

describe('admin routes', () => {
  let app: INestApplication;
  const project = { findMany: vi.fn().mockResolvedValue([]) };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const mod = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ project })
      .compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(() => app.close());

  const routes = [
    ['get', '/admin/projects'],
    ['get', '/admin/projects/1'],
    ['post', '/admin/projects'],
    ['patch', '/admin/projects/1'],
    ['delete', '/admin/projects/1'],
    ['post', '/admin/projects/cover'],
  ] as const;

  it.each(routes)('%s %s needs a valid token', async (method, path) => {
    await request(app.getHttpServer())[method](path).expect(401);
    await request(app.getHttpServer())
      [method](path)
      .auth('forged', { type: 'bearer' })
      .expect(401);
  });

  it('keeps GET /projects public', async () => {
    await request(app.getHttpServer()).get('/projects').expect(200);
  });

  it('validates the body once authorized', async () => {
    const token = new JwtService({ secret: 'test-secret' }).sign({
      sub: 'admin',
    });
    const res = await request(app.getHttpServer())
      .post('/admin/projects')
      .auth(token, { type: 'bearer' })
      .send({
        title: 'x',
        slug: 'Bad Slug',
        summaryEn: 'a',
        summaryEs: 'b',
        tags: [],
      })
      .expect(400);
    expect(res.body.message).toContain('slug may only contain a-z, 0-9 and -');
  });
});
