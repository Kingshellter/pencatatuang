import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000',
  });

  // HTTP request logger middleware
  const logger = new Logger('HTTP');
  app.use((req: any, res: any, next: any) => {
    const { method, url } = req;
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      logger.log(`${method} ${url} ${statusCode} - ${duration}ms`);
    });
    next();
  });

  await app.listen(3001);
}
bootstrap();
