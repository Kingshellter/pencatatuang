import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionsModule } from './transactions/transactions.module';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramUpdate } from './telegram/telegram.update';
import { AiModule } from './ai/ai.module';
import * as dotenv from 'dotenv';

dotenv.config(); // Memuat variabel .env

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramEnabled = !!telegramToken && telegramToken !== 'DUMMY';

@Module({
  imports: [
    TransactionsModule,
    AiModule,
    ...(telegramEnabled
      ? [TelegrafModule.forRoot({ token: telegramToken! })]
      : []),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ...(telegramEnabled ? [TelegramUpdate] : []),
  ],
})
export class AppModule {}
