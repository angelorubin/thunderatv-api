import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createServer } from 'node:net';
import { AppModule } from './app.module';

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, '::');
  });
}

async function findAvailablePort(preferredPort: number): Promise<number> {
  for (let port = preferredPort; port < preferredPort + 100; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(
    `Nenhuma porta disponível entre ${preferredPort} e ${preferredPort + 99}.`,
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'fatal', 'error', 'warn', 'debug', 'verbose'],
  });

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const preferredPort = Number(process.env.PORT ?? 3001);
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.warn(`Porta ${preferredPort} ocupada. Iniciando na porta ${port}.`);
  }

  await app.listen(port);
}

void bootstrap();
