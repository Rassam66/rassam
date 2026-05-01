export function SpeedPitchControls({ speed, pitch, onSpeedChange, onPitchChange }: any) {
  return (
    <div className="flex gap-4 bg-[#1a1a1a] p-3 rounded-2xl border border-[#ffffff10]">
      <div className="flex-1">
        <label className="text-[10px] text-[#FFD700] uppercase tracking-wider">السرعة</label>
        <input type="range" min="0.5" max="2" step="0.05" value={speed} onChange={e => onSpeedChange(parseFloat(e.target.value))} className="w-full mt-1" />
        <span className="text-xs text-[#888]">{speed.toFixed(2)}x</span>
      </div>
      <div className="flex-1">
        <label className="text-[10px] text-[#FFD700] uppercase tracking-wider">طبقة الصوت</label>
        <input type="range" min="0.5" max="2" step="0.05" value={pitch} onChange={e => onPitchChange(parseFloat(e.target.value))} className="w-full mt-1" />
        <span className="text-xs text-[#888]">{pitch.toFixed(2)}</span>
      </div>
    </div>
  );
}