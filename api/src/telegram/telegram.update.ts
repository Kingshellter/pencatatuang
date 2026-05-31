import { Update, Start, On, Ctx, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import axios from 'axios';
import { AiService } from '../ai/ai.service';
import { TransactionsService } from '../transactions/transactions.service';

@Update()
export class TelegramUpdate {
  constructor(
    private readonly aiService: AiService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    await ctx.reply(
      'Sistem Pencatat Uang LLaVa Aktif! Kirim transaksi teks atau unggah struk Anda ke sini.\n\nCommand tersedia:\n/saldo - Cek saldo\n/topup [nominal] - Tambah saldo rutin',
    );
  }

  @Command('saldo')
  async cekSaldo(@Ctx() ctx: Context) {
    const summary = await this.transactionsService.getSummary();
    const replyText = `💳 *Saldo Tersisa : Rp ${summary.balance.toLocaleString('id-ID')}*`;

    await ctx.reply(replyText, { parse_mode: 'Markdown' });
  }

  @Command('topup')
  async topup(@Ctx() ctx: Context) {
    const text = (ctx.message as any).text || '';
    const parts = text.split(' ');
    const amountStr = parts[1]; // Mengambil kata kedua dari "/topup 50000"

    const amount = Number(amountStr);
    if (!amountStr || isNaN(amount) || amount <= 0) {
      await ctx.reply(
        '❌ Format salah.\nGunakan: `/topup [nominal]` tanpa titik/koma.\nContoh: `/topup 50000`',
        { parse_mode: 'Markdown' },
      );
      return;
    }

    await this.transactionsService.create({
      amount: amount,
      description: 'Topup via Telegram',
      type: 'income',
      category: 'other-in',
    });

    const summary = await this.transactionsService.getSummary();

    await ctx.reply(
      `✅ Berhasil topup saldo sebesar Rp ${amount.toLocaleString('id-ID')}!\n(Sisa Saldo saat ini: Rp ${summary.balance.toLocaleString('id-ID')})`,
    );
  }

  @On('text')
  async onMessage(@Ctx() ctx: Context) {
    const message = (ctx.message as any).text;
    const loadingMessage = await ctx.reply(
      '⏳ Sedang menganalisis teks menggunakan Ollama...',
    );

    // Pindahkan proses lambat ke latar belakang agar Telegraf tidak Timeout (90 detik)
    (async () => {
      try {
        const data = await this.aiService.parseTextQuery(message);

        if (!data || !data.amount) {
          throw new Error(
            'Gagal mendeteksi nominal atau instruksi tidak jelas dari LLaVa.',
          );
        }

        const txType = data.type === 'income' ? 'income' : 'expense';
        await this.transactionsService.create({
          amount: Number(data.amount),
          description: data.description || 'Dari Telegram Text',
          type: txType,
          category:
            typeof data.category === 'string' && data.category
              ? data.category
              : txType === 'income'
                ? 'other-in'
                : 'other-out',
        });

        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          loadingMessage.message_id,
          undefined,
          `✅ Berhasil dicatat ke database!\n💰 Rp ${data.amount}\n📝 ${data.description}\n🏷️ ${data.type}${data.category ? ` (${data.category})` : ''}`,
        );
      } catch (error: any) {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          loadingMessage.message_id,
          undefined,
          '❌ Gagal: ' + error.message,
        );
      }
    })();
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: Context) {
    const loadingMessage = await ctx.reply(
      '⏳ Mengunduh dan menganalisis struk belanja Anda...\n(Proses AI Lokal mungkin memakan waktu lebih dari 1 menit)',
    );

    // Pindahkan ke latar belakang agar Telegraf tidak Timeout
    (async () => {
      try {
        const photos = (ctx.message as any).photo;
        // Ambil resolusi gambar tertinggi (terakhir di array)
        const fileId = photos[photos.length - 1].file_id;

        // Dapatkan URL gambar dari Telegram
        const fileLink = await ctx.telegram.getFileLink(fileId);

        // Unduh gambar ke memori buffer menggunakan Axios
        const response = await axios.get(fileLink.href, {
          responseType: 'arraybuffer',
        });
        const buffer = Buffer.from(response.data, 'binary');
        const base64Image = buffer.toString('base64');

        // Lempar ke Ollama LLaVa
        const data = await this.aiService.analyzeReceipt(base64Image);

        if (!data || !data.amount) {
          throw new Error(
            'LLaVa kesulitan/gagal menemukan format total pembelian pada struk ini.',
          );
        }

        // Masukkan ke Database Prisma
        await this.transactionsService.create({
          amount: Number(data.amount),
          description: data.description || 'Dari Struk LLaVa',
          type: data.type === 'income' ? 'income' : 'expense',
          category:
            typeof data.category === 'string' && data.category
              ? data.category
              : 'other-out',
        });

        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          loadingMessage.message_id,
          undefined,
          `🛒 Struk Berhasil Diproses & Disimpan!\n💰 Rp ${data.amount}\n📝 ${data.description}${data.category ? `\n🏷️ ${data.category}` : ''}`,
        );
      } catch (error: any) {
        console.error(error);
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          loadingMessage.message_id,
          undefined,
          '❌ Gagal menganalisis struk: ' + error.message,
        );
      }
    })();
  }
}
