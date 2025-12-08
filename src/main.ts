import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe  } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,             // quita campos extra
      forbidNonWhitelisted: false,  // revienta si mandan campos no permitidos
      transform: false,             // convierte tipos (string -> number, etc.)
    }),
  );


  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  app.use((req, _res, next) => {
    Logger.log('REQ', req.method, req.url, 'BODY:', req.body);
    next();
  });

  Logger.log(`🚀 collab-bff running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
