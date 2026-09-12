import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://intern-management-system-frontend-pi.vercel.app',
      'http://localhost:3000',
    ],
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
