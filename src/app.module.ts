import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionsModule } from './transactions/transactions.module';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramUpdate } from './telegram/telegram.update';
import { AiModule } from './ai/ai.module';
import * as dotenv from 'dotenv';

dotenv.config(); // Memuat variabel .env

@Module({
  imports: [
    TransactionsModule,
    AiModule,
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN || 'DUMMY',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, TelegramUpdate],
})
export class AppModule {}
