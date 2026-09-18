import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //Strips any properties from input which isnt in DTO
      forbidNonWhitelisted: true, //Throws error instead of silently stripping
    }),
  );

  app.enableCors({
    origin: [
      'https://intern-management-system-frontend-pi.vercel.app',
      'http://localhost:5173',
    ],
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
