/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Play, 
  Square, 
  Volume2, 
  Sparkles,
  RefreshCw,
  Info,
  User,
  Users,
  Baby,
  Smile,
  Upload,
  Download,
  X
} from 'lucide-react';
import { generateSpeech, VoicePersona, analyzeVoice } from './lib/gemini.ts';

// --- Wav Helper for Download ---
function getWavBlob(base64Data: string) {
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const samples = new Int16Array(bytes.buffer);
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, 24000, true); // Sample Rate
  view.setUint32(28, 24000 * 2, true); // Byte Rate
  view.setUint16(32, 2, true); // Block Align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * 2, samples[i], true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

// --- Audio Utility ---
async function playPCM(base64Data: string) {
  const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
  const audioCtx = new AudioContextClass();
  
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const floatData = new Float32Array(bytes.buffer.byteLength / 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < floatData.length; i++) {
    floatData[i] = view.getInt16(i * 2, true) / 32768.0;
  }

  const audioBuffer = audioCtx.createBuffer(1, floatData.length, 24000);
  audioBuffer.getChannelData(0).set(floatData);

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);
  return new Promise<void>((resolve) => {
    source.onended = () => {
      audioCtx.close();
      resolve();
    };
    source.start();
  });
}

export default function App() {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'egyptian' | 'fusha'>('egyptian');
  const [persona, setPersona] = useState<VoicePersona>('man');
  const [isDramatic, setIsDramatic] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [refVoiceDescription, setRefVoiceDescription] = useState<string | null>(null);
  const [latestAudio, setLatestAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCloning(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const description = await analyzeVoice(base64, file.type);
          setRefVoiceDescription(description);
          setSuccessMsg('تم تحليل البصمة الصوتية بنجاح');
          setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err) {
          setError('فشل تحليل الملف الصوتي.');
        } finally {
          setIsCloning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('حدث خطأ أثناء قراءة الملف.');
      setIsCloning(false);
    }
  };

  const handleSpeak = async () => {
    if (!inputText.trim()) return;
    
    setIsPlaying(true);
    setError(null);
    try {
      const audioData = await generateSpeech(inputText, mode, isDramatic, persona, refVoiceDescription || undefined);
      if (audioData) {
        setLatestAudio(audioData);
        await playPCM(audioData);
      } else {
        setError('تعذر توليد الصوت حالياً.');
      }
    } catch (err) {
      console.error(err);
      setError('خطأ في توليد الصوت.');
    } finally {
      setIsPlaying(false);
    }
  };

  const handleDownload = () => {
    if (!latestAudio) return;
    const blob = getWavBlob(latestAudio);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cairene-studio-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const personas = [
    { id: 'man' as VoicePersona, label: 'رجل', icon: User },
    { id: 'woman' as VoicePersona, label: 'امرأة', icon: Users },
    { id: 'child' as VoicePersona, label: 'طفل', icon: Baby },
    { id: 'teenager' as VoicePersona, label: 'مراهق', icon: Smile },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#eee] font-sans selection:bg-[#FFD700] selection:text-[#0a0a0a] flex flex-col">
      <header className="p-6 max-w-4xl w-full mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-[#ffffff10]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFD700] rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.3)]">
            <Mic className="w-5 h-5 text-[#0a0a0a]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Cairene Studio <span className="text-[#666] font-normal">v1.2</span></h1>
        </div>
        
        <div className="flex p-1 bg-[#1a1a1a] rounded-lg border border-[#ffffff10]">
          {(['egyptian', 'fusha'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 text-xs font-bold uppercase transition-all rounded-md ${mode === m ? 'bg-[#FFD700] text-[#0a0a0a]' : 'text-[#888] hover:text-white'}`}
            >
              {m === 'egyptian' ? 'القاهرية' : 'الفصحى'}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-6 max-w-4xl w-full mx-auto space-y-6 mt-8">
        <div className="relative group">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="اكتب النص هنا لبدء التسجيل المباشر..."
            dir="auto"
            className="w-full h-[320px] bg-[#161616] border border-[#ffffff05] shadow-2xl rounded-2xl p-8 focus:outline-none focus:border-[#FFD70020] transition-all resize-none text-2xl leading-loose text-center placeholder:text-[#333]"
          />
          {inputText && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-[#FFD70010] border border-[#FFD70020] rounded-full">
              <Sparkles className="w-3 h-3 text-[#FFD700]" />
              <span className="text-[10px] text-[#FFD700] font-mono uppercase tracking-widest">Active Studio</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid grid-cols-4 gap-2 bg-[#1a1a1a] p-2 rounded-2xl border border-[#ffffff10]">
            {personas.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setPersona(p.id);
                    setRefVoiceDescription(null); // Deselect clone if manual persona picked
                  }}
                  className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl transition-all ${persona === p.id && !refVoiceDescription ? 'bg-[#FFD700] text-[#0a0a0a]' : 'text-[#444] hover:bg-[#ffffff05] hover:text-[#888]'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-bold">{p.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#ffffff10] rounded-2xl relative overflow-hidden">
            <div className="flex flex-col z-10">
              <span className="text-xs font-bold text-[#FFD700] uppercase tracking-wider">استنساخ صوت</span>
              <span className="text-[10px] text-[#555]">{refVoiceDescription ? 'بصمة صوتية نشطة' : 'Upload Audio Reference'}</span>
            </div>
            
            <div className="flex items-center gap-2 z-10">
              {refVoiceDescription ? (
                <button 
                  onClick={() => setRefVoiceDescription(null)}
                  className="p-2 bg-[#FF444420] text-[#FF4444] rounded-lg hover:bg-[#FF444430] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <label className="cursor-pointer p-2 bg-[#FFD700] text-[#0a0a0a] rounded-lg hover:shadow-[0_0_10px_rgba(255,215,0,0.4)] transition-all">
                  {isCloning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} disabled={isCloning} />
                </label>
              )}
            </div>
            {refVoiceDescription && (
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                className="absolute bottom-0 left-0 h-0.5 bg-[#FFD700]"
              />
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#ffffff10] rounded-2xl">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#FFD700] uppercase tracking-wider">أداء درامي وانفعالي</span>
              <span className="text-[10px] text-[#555]">Emotional & Theatrical Delivery</span>
            </div>
            <button 
              onClick={() => setIsDramatic(!isDramatic)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isDramatic ? 'bg-[#FFD700]' : 'bg-[#333]'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isDramatic ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSpeak}
            disabled={isPlaying || !inputText.trim()}
            className={`flex-1 h-20 flex items-center justify-center gap-4 rounded-2xl font-black text-2xl transition-all ${
              isPlaying 
                ? 'bg-[#FF444420] text-[#FF4444] border border-[#FF444430] cursor-not-allowed shadow-[0_0_20px_rgba(255,68,68,0.05)]' 
                : 'bg-white text-black hover:bg-[#FFD700] active:scale-[0.98]'
            }`}
          >
            {isPlaying ? (
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="flex items-center gap-4">
                <Square className="w-6 h-6 fill-current" />
                <span>جاري التسجيل...</span>
              </motion.div>
            ) : (
              <>
                <Play className="w-6 h-6 fill-current" />
                <span>توليد التعليق الصوتي</span>
              </>
            )}
          </button>

          {latestAudio && !isPlaying && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleDownload}
              className="w-20 h-20 flex flex-col items-center justify-center gap-1 bg-[#1a1a1a] border border-[#ffffff10] text-[#FFD700] rounded-2xl hover:bg-[#222] transition-colors"
              title="تحميل الملف الصوتي"
            >
              <Download className="w-6 h-6" />
              <span className="text-[10px] font-bold">WAV</span>
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {(error || successMsg) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`p-4 rounded-xl text-sm flex items-center justify-center gap-3 ${error ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}
            >
              <Info className="w-4 h-4" />
              <span>{error || successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-8 mt-auto border-t border-[#ffffff05] flex justify-center gap-8 text-[10px] text-[#444] uppercase tracking-[0.3em]">
        <div className="flex items-center gap-2"><Volume2 className="w-3 h-3" /> 24KHZ PCM</div>
        <div>PREMIUM VOICE-OVER</div>
        <div>Cairene Studio v1.2</div>
      </footer>
    </div>
  );
}
