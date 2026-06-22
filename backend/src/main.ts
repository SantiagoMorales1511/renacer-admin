import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppModule } from './app.module';
import { getCorsOrigins } from './common/env';
import { syncUsers } from './bootstrap/sync-users';

async function bootstrap() {
  const prisma = new PrismaClient();
  try {
    await syncUsers(prisma);
  } finally {
    await prisma.$disconnect();
  }

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Renacer Admin API escuchando en el puerto ${port} (prefijo /api)`);
}

bootstrap();
