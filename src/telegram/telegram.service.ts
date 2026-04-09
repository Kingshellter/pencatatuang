import { Command, Start, Update, On, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
export class TelegramService {
  @Start()
  async start(@Ctx() ctx: Context) {
    await ctx.reply(
      'Halo! Saya bot Pencatat Uang. Kirimkan pengeluaran atau struk Anda, saya akan mencatatnya!',
    );
  }

  @Command('saldo')
  async cekSaldo(@Ctx() ctx: Context) {
    // Logika mengambil saldo dari database
    await ctx.reply('Saldo Anda saat ini adalah: Rp 0');
  }

  @On('text')
  async onMessage(@Ctx() ctx: Context) {
    // Menangkap pesan teks dari user
    // Misalnya user ketik: "Makan siang 50000"
    const message = (ctx.message as any).text;

    // Di sini Anda bisa lempar text nya ke AI (Ollama/Gemini)
    await ctx.reply(`Sedang memproses instruksi: "${message}"...`);
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: Context) {
    // Jika user mengirimkan foto struk, proses di sini
    await ctx.reply('Memproses gambar struk Anda...');
  }
}
