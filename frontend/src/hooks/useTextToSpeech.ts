import { useState, useEffect, useCallback, useRef } from 'react';
import { useI18nStore } from '../stores/i18nStore';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

interface TextToSpeechOptions {
  rate?: number; // 0.1 to 10, default 1
  pitch?: number; // 0 to 2, default 1
  volume?: number; // 0 to 1, default 1
  voice?: SpeechSynthesisVoice | null;
}

interface UseTextToSpeechReturn {
  speak: (text: string, options?: TextToSpeechOptions) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (progressPercent: number) => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
  setVoice: (voice: SpeechSynthesisVoice | null) => void;
  rate: number;
  setRate: (rate: number) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  progress: number; // 0 to 100
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const { language } = useI18nStore();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const totalWordsRef = useRef(0);
  const currentWordRef = useRef(0);
  const fullTextRef = useRef<string>('');
  const wordsArrayRef = useRef<string[]>([]);
  
  const isNativePlatform = Capacitor.isNativePlatform();

  // Check if TTS is supported (always true on mobile with plugin, check Web Speech API on web)
  const isSupported = isNativePlatform || (typeof window !== 'undefined' && 'speechSynthesis' in window);

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;
    
    // Skip voice loading on native platform (uses Capacitor TTS)
    if (isNativePlatform) return;

    const loadVoices = () => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      
      const availableVoices = window.speechSynthesis.getVoices();
      console.log('📢 TTS: Available voices:', availableVoices.length, availableVoices);
      setVoices(availableVoices);

      // Auto-select voice based on current language
      if (availableVoices.length > 0 && !currentVoice) {
        const langCode = language === 'tl' ? 'fil' : 'en'; // Filipino or English
        const preferredVoice = availableVoices.find(v => 
          v.lang.startsWith(langCode) || v.lang.startsWith(language)
        ) || availableVoices[0];
        console.log('📢 TTS: Selected voice:', preferredVoice);
        setCurrentVoice(preferredVoice);
      }
    };

    // Try loading voices immediately
    loadVoices();
    
    // Also listen for voiceschanged event (needed on some browsers/devices)
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Retry after a delay (Android WebView sometimes needs this)
    const retryTimer = setTimeout(() => {
      loadVoices();
    }, 1000);

    return () => {
      clearTimeout(retryTimer);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported, isNativePlatform, language, currentVoice]);

  // Speak text
  const speak = useCallback(async (text: string, options?: TextToSpeechOptions) => {
    if (!isSupported || !text.trim()) return;

    // Store full text for seeking
    fullTextRef.current = text;
    const words = text.split(/\s+/).filter(w => w.length > 0);
    wordsArrayRef.current = words;
    totalWordsRef.current = words.length;
    currentWordRef.current = 0;

    if (isNativePlatform) {
      // Use Capacitor TTS for mobile
      try {
        console.log('📢 TTS: Using Capacitor TTS on native platform');
        console.log('📢 TTS: Text length:', text.length, 'Language:', language);
        
        // Stop any ongoing speech
        await TextToSpeech.stop();
        
        setIsSpeaking(true);
        setIsPaused(false);
        setProgress(0);
        
        const ttsOptions = {
          text: text,
          lang: language === 'tl' ? 'fil-PH' : 'en-US',
          rate: options?.rate ?? rate,
          pitch: options?.pitch ?? pitch,
          volume: options?.volume ?? volume,
          category: 'ambient',
        };
        
        console.log('📢 TTS: Speaking with options:', ttsOptions);
        await TextToSpeech.speak(ttsOptions);
        console.log('📢 TTS: Speech completed successfully');
        
        // On mobile, we don't get word-by-word progress, so simulate it
        const estimatedDuration = (text.length / 15) * 1000; // ~15 chars per second
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            const next = prev + 2;
            if (next >= 100) {
              clearInterval(progressInterval);
              setIsSpeaking(false);
              setProgress(100);
              return 100;
            }
            return next;
          });
        }, estimatedDuration / 50);
        
      } catch (error) {
        console.error('📢 TTS Error on native platform:', error);
        console.error('📢 TTS Error details:', JSON.stringify(error));
        setIsSpeaking(false);
        setIsPaused(false);
        setProgress(0);
        
        // Show user-friendly error
        alert('Text-to-Speech is not available. Please ensure a TTS engine (like Google Text-to-Speech) is installed and enabled on your device.');
      }
    } else {
      // Use Web Speech API for web
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.error('Web Speech API not available');
        return;
      }
      
      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate ?? rate;
      utterance.pitch = options?.pitch ?? pitch;
      utterance.volume = options?.volume ?? volume;
      utterance.voice = options?.voice ?? currentVoice;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setProgress(0);
      };

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          currentWordRef.current++;
          const newProgress = (currentWordRef.current / totalWordsRef.current) * 100;
          setProgress(Math.min(newProgress, 100));
        }
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setProgress(100);
        utteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        setIsPaused(false);
        setProgress(0);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [isSupported, isNativePlatform, rate, pitch, volume, currentVoice, language]);

  // Pause speech
  const pause = useCallback(async () => {
    if (!isSupported || !isSpeaking) return;
    
    if (isNativePlatform) {
      // Capacitor TTS doesn't support pause, so we'll just stop
      await TextToSpeech.stop();
      setIsSpeaking(false);
      setIsPaused(false);
      setProgress(0);
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  }, [isSupported, isNativePlatform, isSpeaking]);

  // Resume speech
  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;
    
    if (isNativePlatform) {
      // On mobile, we can't resume, so just note that it's not paused
      setIsPaused(false);
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      }
    }
  }, [isSupported, isNativePlatform, isPaused]);

  // Stop speech
  const stop = useCallback(async () => {
    if (!isSupported) return;
    
    if (isNativePlatform) {
      await TextToSpeech.stop();
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
    
    setIsSpeaking(false);
    setIsPaused(false);
    setProgress(0);
    utteranceRef.current = null;
  }, [isSupported, isNativePlatform]);

  // Seek to specific position (0-100)
  const seek = useCallback((progressPercent: number) => {
    if (!isSupported || !fullTextRef.current) return;
    
    // Seeking not supported on native platform
    if (isNativePlatform) return;
    
    // Clamp progress between 0 and 100
    const clampedProgress = Math.max(0, Math.min(100, progressPercent));
    
    // Calculate word index based on progress
    const targetWordIndex = Math.floor((clampedProgress / 100) * totalWordsRef.current);
    
    // Get text from target position onwards
    const remainingWords = wordsArrayRef.current.slice(targetWordIndex);
    const textToSpeak = remainingWords.join(' ');
    
    if (!textToSpeak.trim()) {
      stop();
      return;
    }
    
    // Update current word index
    currentWordRef.current = targetWordIndex;
    setProgress(clampedProgress);
    
    // Stop current speech and start from new position
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    utterance.voice = currentVoice;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        currentWordRef.current++;
        const newProgress = (currentWordRef.current / totalWordsRef.current) * 100;
        setProgress(Math.min(newProgress, 100));
      }
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setProgress(100);
      utteranceRef.current = null;
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };
    
    utteranceRef.current = utterance;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.speak(utterance);
    }
  }, [isSupported, isNativePlatform, rate, pitch, volume, currentVoice, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported && !isNativePlatform && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported, isNativePlatform]);

  return {
    speak,
    pause,
    resume,
    stop,
    seek,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    currentVoice,
    setVoice: setCurrentVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
    progress,
  };
};
