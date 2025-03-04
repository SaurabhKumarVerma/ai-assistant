import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { clerkMiddleware } from '@clerk/express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    clerkMiddleware({
      secretKey: process.env.CLERK_SECRET_KEY,
    }),
  );
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
