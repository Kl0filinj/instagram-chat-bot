import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  await app.listen(configService.get('APP_PORT'));
  console.log(`INSTAGRAM CHAT BOT running on: ${await app.getUrl()}`);
}
bootstrap();
