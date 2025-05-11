import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
// import { getCorsSettings } from '@libs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://pug-simple-tadpole.ngrok-free.app',
      'https://instagram-chat-bot-admin-panel.vercel.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'ngrok-skip-browser-warning',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 3600,
  });

  const env = configService.get('NODE_ENV');
  const port = configService.get(env === 'dev' ? 'APP_PORT_LOCAL' : 'APP_PORT');
  await app.listen(port);
  console.log(`INSTAGRAM CHAT BOT running on: ${await app.getUrl()}`);
}
bootstrap();
