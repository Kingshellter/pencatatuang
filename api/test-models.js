require('dotenv').config();
async function run() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await res.json();
  const models = data.models.filter(m => m.name.includes('flash') && m.supportedGenerationMethods.includes('generateContent')).map(m => m.name);
  console.log("AVAILABLE FLASH:", models);
}
run();
