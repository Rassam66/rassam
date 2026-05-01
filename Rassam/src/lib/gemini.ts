import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY is missing');

const ai = new GoogleGenAI({ apiKey });

/**
 * Converts text to speech using Gemini 2.0 Flash (experimental multimodal)
 * Returns base64-encoded PCM audio (16-bit, 24kHz, mono)
 */
export async function generateSpeech(options: {
  text: string;
  language: 'egyptian' | 'fusha';
  persona: VoicePersona;
  dramatic: boolean;
  speed: number;
  pitch: number;
  refVoiceDescription?: string;
  signal?: AbortSignal;
}): Promise<string> {
  const { text, language, persona, dramatic, speed, pitch, refVoiceDescription, signal } = options;
  
  if (!text.trim()) throw new Error('النص فارغ');
  
  // Build system prompt
  let dialectPrompt = '';
  if (language === 'egyptian') {
    dialectPrompt = 'استخدم اللهجة المصرية العامية (القاهرية) بدقة، بأسلوب طبيعي غير مبالغ فيه.';
  } else {
    dialectPrompt = 'استخدم العربية الفصحى الحديثة مع تشكيل واضح ونطق سليم.';
  }
  
  const emotionPrompt = dramatic 
    ? 'أضف أداءً درامياً وانفعالياً مناسباً للنص (فرح، حزن، غضب، حماس) حسب السياق.'
    : 'أدِّ النص بصورة محايدة وواضحة، بوتيرة معتدلة.';
  
  const voicePrompt = `أنت ممثل صوتي ${persona === 'man' ? 'رجل بالغ' : persona === 'woman' ? 'امرأة بالغة' : persona === 'child' ? 'طفل/طفلة' : 'مراهق/مراهقة'}. ${dialectPrompt} ${emotionPrompt}
سرعة النطق: ${speed} (1.0 سرعة عادية).
درجة الصوت: ${pitch} (1.0 طبيعي).
${refVoiceDescription ? `قلِّد هذا الأسلوب الصوتي: ${refVoiceDescription}` : ''}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ role: 'user', parts: [{ text: `النص: ${text}` }] }],
      config: {
        systemInstruction: voicePrompt,
        responseModalities: ['AUDIO'],
        audioConfig: { sampleRateBitsPerSecond: 24000 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
        ]
      },
      signal
    });
    
    const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.audio?.data);
    if (!audioPart?.audio?.data) throw new Error('لم يستجب النموذج بصوت');
    
    return audioPart.audio.data; // base64 string
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    console.error('Gemini TTS error:', err);
    throw new Error('فشل توليد الصوت، حاول مرة أخرى.');
  }
}

/**
 * Analyze uploaded voice sample to extract style description
 */
export async function analyzeVoice(audioBase64: string, mimeType: string): Promise<string> {
  const prompt = `حلّل هذا المقطع الصوتي واصفاً خصائصه الصوتية بالتفصيل (طبقة الصوت، الإيقاع، اللهجة، النبر، العواطف الظاهرة، إن كان ذكراً أو أنثى أو طفلاً). اكتب وصفاً قصيراً مناسباً لاستخدامه في تقليد الصوت.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: [
      { role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType, data: audioBase64 } }] }
    ],
    config: { temperature: 0.2 }
  });
  
  return response.text || 'صوت طبيعي واضح';
}

/**
 * Splits long text into smaller chunks for processing
 */
export function splitText(text: string, maxLength: number = 500): string[] {
  const sentences = text.split(/(?<=[.!?؟،])/g);
  const chunks: string[] = [];
  let current = '';
  
  for (const sentence of sentences) {
    if ((current + sentence).length <= maxLength) {
      current += sentence;
    } else {
      if (current) chunks.push(current.trim());
      current = sentence;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}