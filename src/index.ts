import { startTelegram } from './telegram';
import './server';

async function bootstrap() {
  await startTelegram();
}

bootstrap();
