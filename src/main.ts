import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://instagram-chat-bot-admin-panel.vercel.app',
      'https://pug-simple-tadpole.ngrok-free.app',
    ],
    //   [
    //   'http://localhost:3000',
    //   'https://instagram-chat-bot-admin-panel.vercel.app/',
    // ], // TODO: Replace on env later
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(configService.get('APP_PORT'));
  console.log(`INSTAGRAM CHAT BOT running on: ${await app.getUrl()}`);
}
bootstrap();
