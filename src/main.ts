import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
// import { getCorsSettings } from '@libs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  // app.enableCors(getCorsSettings(process.env.CORS_ALLOW || '')); // TODO: Enable cors later after tests

  const env = configService.get('NODE_ENV');
  const port = configService.get(env === 'dev' ? 'APP_PORT_LOCAL' : 'APP_PORT');
  await app.listen(port);
  console.log(`INSTAGRAM CHAT BOT running on: ${await app.getUrl()}`);
}
bootstrap();
