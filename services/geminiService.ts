import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; 
// Fallback logic handled in calls if key is missing/invalid for UI stability

let ai: GoogleGenAI | null = null;
if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

export const generateExpeditionStory = async (location: string, outcome: 'success' | 'failure', rewardSummary: string): Promise<string> => {
  if (!ai) return `Sefer tamamlandı: ${location}. Sonuç: ${outcome === 'success' ? 'Başarılı' : 'Başarısız'}. ${rewardSummary}`;

  try {
    const prompt = `
      Sen fantastik bir RPG oyununun anlatıcısısın.
      Oyuncu "${location}" bölgesine bir sefere çıktı.
      Sonuç: ${outcome === 'success' ? 'Başarılı oldu' : 'Yaralandı ve kaçtı'}.
      Kazanılanlar: ${rewardSummary}.
      
      Lütfen bu olay hakkında Türkçede, 2 cümlelik, atmosferik ve kısa bir hikaye yaz.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Sefer raporu alınamadı.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Sefer tamamlandı. ${rewardSummary}`;
  }
};

export const generateEnemyNameAndDescription = async (level: number): Promise<{ name: string, description: string }> => {
  if (!ai) return { name: `Vahşi Savaşçı (Seviye ${level})`, description: "Tehlikeli görünen bir rakip." };

  try {
    const prompt = `
      Fantastik bir gladyatör arenası için seviye ${level} gücünde bir düşman ismi ve çok kısa (1 cümle) fiziksel tasviri oluştur.
      JSON formatında döndür: { "name": "...", "description": "..." }.
      Sadece JSON döndür.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { name: `Arena Gladyatörü (S${level})`, description: "Gözleri ateş saçan bir savaşçı." };
  }
};