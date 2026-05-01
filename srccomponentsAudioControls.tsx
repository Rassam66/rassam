import { Play, Square, Download } from 'lucide-react';

export function AudioControls({ isGenerating, isPlaying, onSpeak, onStop, onDownload, hasAudio }: any) {
  return (
    <div className="flex gap-4">
      <button
        onClick={onSpeak}
        disabled={isGenerating}
        className={`flex-1 h-20 flex items-center justify-center gap-4 rounded-2xl font-black text-2xl transition-all ${isGenerating ? 'bg-[#FF444420] text-[#FF4444] border border-[#FF444430]' : 'bg-white text-black hover:bg-[#FFD700] active:scale-[0.98]'}`}
      >
        {isGenerating ? <Square className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
        <span>{isGenerating ? 'جاري التوليد...' : (isPlaying ? 'يتحدث...' : 'توليد التعليق الصوتي')}</span>
      </button>
      {isPlaying && (
        <button onClick={onStop} className="w-20 h-20 bg-[#1a1a1a] border border-[#ffffff10] rounded-2xl text-white">إيقاف</button>
      )}
      {hasAudio && !isPlaying && (
        <button onClick={onDownload} className="w-20 h-20 flex flex-col items-center justify-center gap-1 bg-[#1a1a1a] border border-[#ffffff10] text-[#FFD700] rounded-2xl">
          <Download className="w-6 h-6" /><span className="text-[10px]">تحميل</span>
        </button>
      )}
    </div>
  );
}