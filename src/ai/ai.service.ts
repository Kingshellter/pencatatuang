import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor() {
    // Inisialisasi SDK Gemini dengan API Key dari .env
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  async analyzeReceipt(base64Image: string) {
    this.logger.log('Menganalisa struk menggunakan Gemini 2.5 Flash...');
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          // Paksa output agar PASTI berwujud JSON, mencegah JSON terpotong.
          responseMimeType: "application/json",
        }
      });

      const prompt = `Anda adalah asisten keuangan pintar. Ekstrak informasi total pembelian terakhir dari gambar struk ini.
Kembalikan keluaran HANYA dalam JSON dengan struktur ini:
{
  "amount": <angka murni total belanja>,
  "description": "<ringkasan benda di struk, maksimal 5-7 kata>",
  "type": "expense"
}`;

      const imageParts = [
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg', // Asumsikan foto dari telegram adalah JPG/PNG compress
          },
        },
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const content = result.response.text();
      
      return JSON.parse(content);
    } catch (error: any) {
      this.logger.error('Gagal analisis visi oleh Gemini: ' + error.message);
      return null;
    }
  }

  async parseTextQuery(text: string) {
    this.logger.log(`Memproses teks: ${text}`);
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const prompt = `Anda adalah asisten pencatat pengeluaran. Analisa kalimat user berikut: "${text}"
Keluarkan HANYA format JSON valid ini:
{
  "amount": <nominal angka dari teks>,
  "description": "<deskripsi singkat>",
  "type": "<income atau expense, pilih salah satu sesuai logika kalimat tersebut>"
}`;

      const result = await model.generateContent(prompt);
      const content = result.response.text();
      
      return JSON.parse(content);
    } catch (error: any) {
      this.logger.error('Gagal mem-parse text oleh Gemini: ' + error.message);
      return null;
    }
  }
}
