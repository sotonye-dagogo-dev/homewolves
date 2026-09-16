import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../app.module';
import { DrizzleService } from '../drizzle/drizzle.service';
import { createDrizzleMock, createChain } from './drizzle.mock';

const mocks = createDrizzleMock();

const adminUser = { id: 'admin-1', email: 'admin@homewolves.africa', role: 'SUPER_ADMIN' };
const buyerUser = { id: 'buyer-1', email: 'buyer@homewolves.africa', role: 'BUYER' };

describe('API integration (supertest)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DrizzleService)
      .useValue(mocks.db)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    mocks.select.mockImplementation(() => createChain([]));
    mocks.insert.mockImplementation(() => createChain([]));
    mocks.update.mockImplementation(() => createChain([]));
    mocks.delete.mockImplementation(() => createChain([]));
    mocks.table('listings').findMany.mockResolvedValue([]);
    mocks.table('listings').findFirst.mockResolvedValue(null);
    mocks.table('blogPosts').findFirst.mockResolvedValue(null);
    mocks.table('blogPosts').findMany.mockResolvedValue([]);
  });

  const tokenFor = (user: typeof adminUser) => jwt.sign({ sub: user.id, email: user.email, role: user.role });

  describe('auth guard (401)', () => {
    it('rejects a protected route without a token', async () => {
      await request(app.getHttpServer()).get('/api/v1/activity/stats').expect(401);
    });

    it('rejects a protected route with an invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/activity/stats')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);
    });
  });

  describe('role guard (403)', () => {
    it('rejects a non-admin on an admin-only route', async () => {
      mocks.select.mockReturnValue(createChain([buyerUser]));
      await request(app.getHttpServer())
        .post('/api/v1/blog')
        .set('Authorization', `Bearer ${tokenFor(buyerUser)}`)
        .send({ title: 'Valid Title', slug: 'valid-title', excerpt: 'Excerpt', content: '<p>Body</p>' })
        .expect(403);
    });

    it('allows an admin on an admin-only route', async () => {
      mocks.select.mockReturnValue(createChain([adminUser]));
      mocks.insert.mockReturnValue(createChain([{ id: 'post-1', title: 'Valid Title', slug: 'valid-title' }]));
      mocks.table('blogPosts').findFirst.mockResolvedValue({ id: 'post-1', title: 'Valid Title', slug: 'valid-title' });

      const res = await request(app.getHttpServer())
        .post('/api/v1/blog')
        .set('Authorization', `Bearer ${tokenFor(adminUser)}`)
        .send({ title: 'Valid Title', slug: 'valid-title', excerpt: 'Excerpt', content: '<p>Body</p>' })
        .expect(201);

      expect(res.body).toEqual(expect.objectContaining({ title: 'Valid Title' }));
    });
  });

  describe('validation (400)', () => {
    it('rejects an invalid register payload', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email' })
        .expect(400);
    });

    it('rejects an invalid blog payload with a strict schema', async () => {
      mocks.select.mockReturnValue(createChain([adminUser]));
      const res = await request(app.getHttpServer())
        .post('/api/v1/blog')
        .set('Authorization', `Bearer ${tokenFor(adminUser)}`)
        .send({ title: 'x', slug: 'invalid slug with spaces', excerpt: 'E', content: 'C' })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects unknown keys on a strict schema', async () => {
      mocks.select.mockReturnValue(createChain([adminUser]));
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'ok@homewolves.africa', unexpected: 'nope' })
        .expect(400);
    });
  });

  describe('not found (404)', () => {
    it('returns 404 for an unknown listing', async () => {
      await request(app.getHttpServer()).get('/api/v1/listings/does-not-exist').expect(404);
    });

    it('returns 404 for an unknown blog slug', async () => {
      mocks.table('blogPosts').findFirst.mockResolvedValue(null);
      await request(app.getHttpServer()).get('/api/v1/blog/unknown-slug').expect(404);
    });
  });

  describe('health (public)', () => {
    it('returns liveness on /health', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });

    it('returns readiness shape on /health/ready', async () => {
      (mocks.db as unknown as { execute: ReturnType<typeof import('vitest').vi.fn> }).execute.mockResolvedValue([]);
      const res = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);
      expect(res.body.services).toBeDefined();
      expect(res.body.services.database).toBeDefined();
      expect(res.body.services.paystack).toBeDefined();
      expect(res.body.services.email).toBeDefined();
    });
  });

  describe('public routes (200)', () => {
    it('returns the listings feed', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/listings').expect(200);
      expect(res.body).toEqual(expect.objectContaining({ listings: [] }));
    });

    it('returns the blog category list', async () => {
      mocks.select.mockReturnValue(createChain([{ categories: ['Market news'] }]));
      const res = await request(app.getHttpServer()).get('/api/v1/blog/categories').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns rate-limit metadata shape on over-limit requests', async () => {
      const server = app.getHttpServer();
      let blocked = false;
      for (let i = 0; i < 200 && !blocked; i++) {
        const res = await request(server).get('/api/v1/listings');
        if (res.status === 429) {
          expect(res.body.code).toBe('RATE_LIMITED');
          blocked = true;
        } else {
          expect(res.status).toBe(200);
        }
      }
      expect(blocked).toBe(true);
    });
  });
});