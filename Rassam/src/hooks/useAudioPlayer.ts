import { useEffect, useRef, useState } from 'react';

export function useAudioPlayer() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>();

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const stop = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setIsPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setCurrentTime(0);
  };

  const playPCM = async (base64Data: string): Promise<void> => {
    stop();
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    
    // Assume 16-bit PCM, mono, 24kHz
    const samples = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) floatData[i] = samples[i] / 32768.0;
    
    const audioBuffer = ctx.createBuffer(1, floatData.length, 24000);
    audioBuffer.getChannelData(0).set(floatData);
    
    setDuration(audioBuffer.duration);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    source.start();
    sourceRef.current = source;
    setIsPlaying(true);
    startTimeRef.current = ctx.currentTime;
    
    const updateTime = () => {
      if (sourceRef.current && ctx) {
        const elapsed = ctx.currentTime - startTimeRef.current;
        setCurrentTime(Math.min(elapsed, audioBuffer.duration));
        rafRef.current = requestAnimationFrame(updateTime);
      }
    };
    rafRef.current = requestAnimationFrame(updateTime);
  };

  useEffect(() => {
    return () => {
      stop();
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return { playPCM, isPlaying, stop, currentTime, duration };
}