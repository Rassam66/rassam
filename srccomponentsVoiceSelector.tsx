import { User, Users, Baby, Smile } from 'lucide-react';
import { VoicePersona } from '../types';

const personas: { id: VoicePersona; label: string; icon: any }[] = [
  { id: 'man', label: 'رجل', icon: User },
  { id: 'woman', label: 'امرأة', icon: Users },
  { id: 'child', label: 'طفل', icon: Baby },
  { id: 'teenager', label: 'مراهق', icon: Smile },
];

export function VoiceSelector({ value, onChange }: { value: VoicePersona; onChange: (p: VoicePersona) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2 bg-[#1a1a1a] p-2 rounded-2xl border border-[#ffffff10]">
      {personas.map(p => {
        const Icon = p.icon;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl transition-all ${value === p.id ? 'bg-[#FFD700] text-[#0a0a0a]' : 'text-[#444] hover:bg-[#ffffff05] hover:text-[#888]'}`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] font-bold">{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}