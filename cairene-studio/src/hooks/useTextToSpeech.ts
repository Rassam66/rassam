import { useState, useRef, useCallback } from 'react';
import { generateSpeech, splitText, GenerationOptions } from '../lib/gemini';
import { useAudioPlayer } from './useAudioPlayer';

export function useTextToSpeech() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { playPCM, isPlaying, stop, currentTime, duration } = useAudioPlayer();

  const generateAndPlay = useCallback(async (options: Omit<GenerationOptions, 'signal'>) => {
    // Cancel any ongoing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    stop(); // stop playing previous audio
    setError(null);
    setIsGenerating(true);
    setProgress(0);
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      const textChunks = splitText(options.text);
      let combinedAudio: string | null = null;
      
      for (let i = 0; i < textChunks.length; i++) {
        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
        setProgress((i / textChunks.length) * 100);
        
        const audioBase64 = await generateSpeech({
          ...options,
          text: textChunks[i],
          signal: controller.signal
        });
        
        if (!combinedAudio) {
          combinedAudio = audioBase64;
        } else {
          // Merge PCM: simply concatenate base64 strings? No, need binary merge.
          // For simplicity, we'll just play chunk by chunk sequentially.
          // In production, merge PCM buffers.
          await playPCM(audioBase64);
          await new Promise(r => setTimeout(r, 200));
        }
      }
      if (combinedAudio && textChunks.length === 1) {
        await playPCM(combinedAudio);
      }
      setProgress(100);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('تم إلغاء العملية.');
      } else {
        setError(err instanceof Error ? err.message : 'خطأ غير متوقع');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
      setProgress(0);
    }
  }, [stop, playPCM]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stop();
    setIsGenerating(false);
  }, [stop]);

  return {
    generateAndPlay,
    cancel,
    isGenerating,
    isPlaying,
    error,
    progress,
    currentTime,
    duration,
    stop,
  };
}