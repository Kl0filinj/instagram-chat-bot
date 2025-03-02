import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
// import { getCorsSettings } from '@libs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  // app.enableCors(getCorsSettings(process.env.CORS_ALLOW || '')); // TODO: Enable cors later after tests

  await app.listen(configService.get('APP_PORT'));
  console.log(`INSTAGRAM CHAT BOT running on: ${await app.getUrl()}`);
}
bootstrap();
