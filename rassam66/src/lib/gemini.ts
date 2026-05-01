import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type VoicePersona = 'man' | 'woman' | 'child' | 'teenager';

export async function analyzeVoice(base64Audio: string, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { data: base64Audio, mimeType } },
          { text: "Analyze this voice carefully. Describe the gender, approximate age, tone (e.g., raspy, clear, deep, high-pitched), and unique speaking characteristics or dialectal nuances. Keep it concise as a 'Voice Print' for an artist to imitate." }
        ]
      }
    ]
  });
  return response.text || "Professional voice";
}

export async function generateSpeech(
  text: string, 
  mode: 'egyptian' | 'fusha', 
  isDramatic: boolean = false, 
  persona: VoicePersona = 'man',
  referenceDescription?: string
): Promise<string | undefined> {
  const context = mode === 'egyptian' ? 'Egyptian Cairene dialect' : 'Modern Standard Arabic (Fusha)';
  
  const voiceMap = {
    man: { name: 'Charon', desc: 'deep, mature, and resonant adult male voice' },
    woman: { name: 'Kore', desc: 'clear, professional, and elegant adult female voice' },
    child: { name: 'Puck', desc: 'light, high-pitched, playful, and innocent child voice' },
    teenager: { name: 'Zephyr', desc: 'energetic, casual, and slightly breathy teenage voice' }
  };

  const selected = voiceMap[persona];

  const performanceStyle = isDramatic 
    ? 'with an intense dramatic and emotional performance. Use deep feeling, expressive intonation, and theatrical pauses.' 
    : 'in a natural, clear, and professional studio tone.';

  const referencePrompt = referenceDescription 
    ? `IMPOARTANT: Closely imitate the following voice reference: ${referenceDescription}. Use the same timber and pitch if possible.` 
    : `Perform as a ${selected.desc}.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ 
      parts: [{ 
        text: `You are a professional voice artist performing in ${context}. 
               Reference: ${referencePrompt}
               Overall Style: ${performanceStyle}. 
               Text to say: ${text}` 
      }] 
    }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: selected.name },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}
