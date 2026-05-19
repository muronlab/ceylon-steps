import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import session from 'express-session';
import createPgSessionStore from 'connect-pg-simple';
import pg from 'pg';
import csrf from 'csurf';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';

export async function setupApp(app: INestApplication) {
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'x-csrf-token'],
  });

  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ceylon Step API')
    .setDescription('Backend API documentation')
    .setVersion('v1')
    .addCookieAuth(process.env.SESSION_COOKIE_NAME ?? 'sid')
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDoc);

  const config = app.get(ConfigService);
  const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';
  const PgSessionStore = createPgSessionStore(session);

  const cookieSecure = config.get<boolean>('SESSION_COOKIE_SECURE') ?? false;
  const cookieSameSite = config.get<'lax' | 'strict' | 'none'>('SESSION_COOKIE_SAMESITE') ?? 'lax';
  const cookieDomain = (config.get<string>('SESSION_COOKIE_DOMAIN') ?? '').trim() || undefined;

  const pool =
    nodeEnv === 'test' ? null : new pg.Pool({ connectionString: config.get<string>('DATABASE_URL') });
  app.use(
    session({
      name: config.get<string>('SESSION_COOKIE_NAME') ?? 'sid',
      secret: config.get<string>('SESSION_SECRET')!,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite,
        domain: cookieDomain,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
      store:
        nodeEnv === 'test'
          ? new session.MemoryStore()
          : new PgSessionStore({
              pool: pool!,
              tableName: 't_sessions',
              createTableIfMissing: true,
            }),
    }),
  );

  const csrfEnabled = config.get<boolean>('CSRF_ENABLED') ?? true;
  if (csrfEnabled) {
    app.use(csrf());
  }
}

