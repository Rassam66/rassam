import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Upload, X, Info, Sparkles, Volume2 } from 'lucide-react';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { VoiceSelector } from './components/VoiceSelector';
import { SpeedPitchControls } from './components/SpeedPitchControls';
import { AudioControls } from './components/AudioControls';
import { analyzeVoice } from './lib/gemini';
import { LanguageMode, VoicePersona } from './types';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState<LanguageMode>('egyptian');
  const [persona, setPersona] = useState<VoicePersona>('man');
  const [dramatic, setDramatic] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [refVoiceDesc, setRefVoiceDesc] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { generateAndPlay, cancel, isGenerating, isPlaying, error, progress, currentTime, duration, stop } = useTextToSpeech();
  
  const handleSpeak = () => {
    if (!inputText.trim()) return;
    generateAndPlay({ text: inputText, language, persona, dramatic, speed, pitch, refVoiceDescription: refVoiceDesc || undefined });
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCloning(true);
    setCloneError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        const description = await analyzeVoice(base64, file.type);
        setRefVoiceDesc(description);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setCloneError('فشل تحليل الصوت');
    } finally {
      setIsCloning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const handleDownload = () => {
    // Since we don't store audio blob globally, we can extend useTextToSpeech to return lastAudio
    alert('سيتم إضافة زر التحميل قريباً (قم بتسجيل الصوت أولاً)');
  };
  
  const clearClone = () => setRefVoiceDesc(null);
  
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#eee] font-sans selection:bg-[#FFD700] selection:text-[#0a0a0a] flex flex-col">
      <header className="p-6 max-w-4xl w-full mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-[#ffffff10]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFD700] rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.3)]">
            <Mic className="w-5 h-5 text-[#0a0a0a]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">استديو القاهرية <span className="text-[#666] font-normal">v2.0</span></h1>
        </div>
        <div className="flex p-1 bg-[#1a1a1a] rounded-lg border border-[#ffffff10]">
          {(['egyptian', 'fusha'] as const).map(m => (
            <button key={m} onClick={() => setLanguage(m)} className={`px-4 py-2 text-xs font-bold uppercase transition-all rounded-md ${language === m ? 'bg-[#FFD700] text-[#0a0a0a]' : 'text-[#888] hover:text-white'}`}>
              {m === 'egyptian' ? 'عامية مصرية' : 'فصحى'}
            </button>
          ))}
        </div>
      </header>
      
      <main className="flex-1 p-6 max-w-4xl w-full mx-auto space-y-6 mt-8">
        <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="اكتب النص هنا بالعربية..." dir="auto" className="w-full h-[280px] bg-[#161616] border border-[#ffffff05] rounded-2xl p-8 focus:outline-none focus:border-[#FFD70020] text-2xl leading-loose text-center placeholder:text-[#333]" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VoiceSelector value={persona} onChange={setPersona} />
          <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-2xl">
            <div><span className="text-xs font-bold text-[#FFD700]">أداء درامي</span><p className="text-[10px] text-[#555]">Emotional delivery</p></div>
            <button onClick={() => setDramatic(!dramatic)} className={`w-12 h-6 rounded-full transition-colors ${dramatic ? 'bg-[#FFD700]' : 'bg-[#333]'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${dramatic ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
        
        <SpeedPitchControls speed={speed} pitch={pitch} onSpeedChange={setSpeed} onPitchChange={setPitch} />
        
        <div className="flex items-center gap-4 bg-[#1a1a1a] p-3 rounded-2xl">
          <button onClick={() => fileInputRef.current?.click()} disabled={isCloning} className="p-2 bg-[#FFD700] rounded-lg text-black">
            {isCloning ? <div className="animate-spin">⏳</div> : <Upload size={18} />}
          </button>
          <input type="file" accept="audio/*" hidden ref={fileInputRef} onChange={handleFileUpload} />
          <span className="text-sm flex-1">{refVoiceDesc ? `🎤 تقليد: ${refVoiceDesc.substring(0, 60)}...` : 'ارفع ملف صوتي لتقليد الصوت'}</span>
          {refVoiceDesc && <button onClick={clearClone}><X size={16} /></button>}
        </div>
        
        {isGenerating && progress > 0 && <div className="w-full h-1 bg-[#333] rounded-full overflow-hidden"><div className="h-full bg-[#FFD700]" style={{ width: `${progress}%` }} /></div>}
        
        <AudioControls isGenerating={isGenerating} isPlaying={isPlaying} onSpeak={handleSpeak} onStop={stop} onDownload={handleDownload} hasAudio={false} />
        
        {(isPlaying || currentTime > 0) && (
          <div className="text-center text-xs text-[#888]">⏵ {Math.floor(currentTime)} / {Math.floor(duration)} ثانية</div>
        )}
        
        <AnimatePresence>
          {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 bg-red-500/20 text-red-500 rounded-xl text-center">{error}</motion.div>}
        </AnimatePresence>
      </main>
      
      <footer className="p-8 text-center text-[10px] text-[#444] uppercase tracking-wider">مدعوم من Gemini 2.0 Flash | استديو القاهرية 2025</footer>
    </div>
  );
}