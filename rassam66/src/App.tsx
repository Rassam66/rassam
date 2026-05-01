import { useState } from 'react';

export default function App() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'egyptian' | 'fusha'>('egyptian');
  const [output, setOutput] = useState('');

  const handleGenerate = () => {
    if (!text.trim()) return;
    setOutput(`✅ تم استلام النص: "${text}"\n🌐 اللغة: ${mode === 'egyptian' ? 'عامية مصرية' : 'فصحى'}\n⏳ جاري تطوير ميزة تحويل النص إلى صوت...`);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#FFD700' }}>🎙️ استديو القاهرية</h1>
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={() => setMode('egyptian')}
          style={{ background: mode === 'egyptian' ? '#FFD700' : '#ccc', marginLeft: '0.5rem', padding: '0.5rem 1rem', border: 'none', borderRadius: '8px' }}
        >
          🇪🇬 عامية مصرية
        </button>
        <button 
          onClick={() => setMode('fusha')}
          style={{ background: mode === 'fusha' ? '#FFD700' : '#ccc', padding: '0.5rem 1rem', border: 'none', borderRadius: '8px' }}
        >
          📖 فصحى
        </button>
      </div>
      <textarea
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="اكتب النص هنا..."
        style={{ width: '100%', padding: '0.8rem', fontSize: '1.2rem', borderRadius: '12px', border: '1px solid #ddd' }}
      />
      <button 
        onClick={handleGenerate}
        style={{ marginTop: '1rem', padding: '0.8rem 2rem', fontSize: '1.2rem', background: '#FFD700', border: 'none', borderRadius: '40px', fontWeight: 'bold', cursor: 'pointer' }}
      >
        توليد الصوت
      </button>
      {output && <pre style={{ marginTop: '2rem', background: '#f5f5f5', padding: '1rem', borderRadius: '12px' }}>{output}</pre>}
    </div>
  );
}