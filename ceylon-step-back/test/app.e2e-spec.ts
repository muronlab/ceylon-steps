import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { setupApp } from './../src/bootstrap/setup-app';
import { PrismaService } from './../src/prisma/prisma.service';
import { GoogleStrategy } from './../src/auth/oauth/strategies/google.strategy';
import { FacebookStrategy } from './../src/auth/oauth/strategies/facebook.strategy';
import { AppleOauthStrategy } from './../src/auth/oauth/strategies/apple.strategy';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(GoogleStrategy)
      .useValue({})
      .overrideProvider(FacebookStrategy)
      .useValue({})
      .overrideProvider(AppleOauthStrategy)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await setupApp(app);
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });

  it('/security/csrf (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/security/csrf').expect(200);
    expect(res.body).toHaveProperty('csrfToken');
  });

  afterEach(async () => {
    await app?.close();
  });
});
