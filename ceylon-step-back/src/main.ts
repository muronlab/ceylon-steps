import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './bootstrap/setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await setupApp(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
