import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { getFrontendOrigin } from './modules/auth/auth.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // En prod l'API est derrière Caddy : sans ça, req.ip vaut l'IP de Caddy pour
  // TOUS les visiteurs (limite de requêtes et anti-brute-force partagés par tous).
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(
    helmet({
      // Les photos des chambres (/rooms/*) sont affichées par le front, servi
      // depuis un autre domaine : sans ça, le navigateur les bloquerait.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());

  const corsOrigins =
    process.env.NODE_ENV === 'production'
      ? [getFrontendOrigin()]
      : [getFrontendOrigin(), 'http://localhost:3000', 'http://127.0.0.1:3000'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(3001);
}

void bootstrap();
