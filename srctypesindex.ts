export type LanguageMode = 'egyptian' | 'fusha';
export type VoicePersona = 'man' | 'woman' | 'child' | 'teenager';

export interface GenerationOptions {
  text: string;
  language: LanguageMode;
  persona: VoicePersona;
  dramatic: boolean;
  speed: number;      // 0.5 - 2.0
  pitch: number;      // 0.5 - 2.0
  refVoiceDescription?: string;
  signal?: AbortSignal;
}