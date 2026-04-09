import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as path from 'path';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: PrismaClient;

  constructor() {
    const dbPath = path.join(process.cwd(), 'dev.db');
    const adapter = new PrismaBetterSqlite3({ url: dbPath });
    this.client = new PrismaClient({ adapter } as any);
  }

  get transaction() {
    return this.client.transaction;
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
