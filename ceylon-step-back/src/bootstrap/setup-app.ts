import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import csrf from 'csurf';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { getCorsOriginConfig } from './cors';
import { buildSessionMiddleware } from './session';

export async function setupApp(app: INestApplication) {
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');

  const config = app.get(ConfigService);
  const corsOriginConfig = getCorsOriginConfig({
    NODE_ENV: config.get('NODE_ENV'),
    CORS_ALLOW_ALL_ORIGINS: config.get('CORS_ALLOW_ALL_ORIGINS'),
    CORS_ALLOWED_ORIGINS: config.get('CORS_ALLOWED_ORIGINS'),
  });

  app.enableCors({
    origin: corsOriginConfig,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'x-csrf-token'],
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

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

  SwaggerModule.setup('api/docs', app, swaggerDoc, {
    customCssUrl: 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css',
    customJs: [
      'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js',
      'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js',
    ],
  });

  // Cookie session is shared with the WebSocket gateway via buildSessionMiddleware.
  app.use(buildSessionMiddleware(config));

  const csrfEnabled = config.get<boolean>('CSRF_ENABLED') ?? true;
  if (csrfEnabled) {
    app.use(csrf());
  }
}
