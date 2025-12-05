import { useState, useEffect, useCallback, useRef } from 'react';
import { useI18nStore } from '../stores/i18nStore';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';
import { useOnlineStatus } from './useOnlineStatus';
import { API_BASE_URL } from '../config/constants';

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
  cloudVoiceId: string;
  setCloudVoiceId: (voiceId: string) => void;
  useCloudTTS: boolean;
  setUseCloudTTS: (use: boolean) => void;
  isOnline: boolean;
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
  const [cloudVoiceId, setCloudVoiceId] = useState<string>('female_english');
  const [useCloudTTS, setUseCloudTTS] = useState(true); // Default to cloud when available
  const isOnline = useOnlineStatus();
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const totalWordsRef = useRef(0);
  const currentWordRef = useRef(0);
  const fullTextRef = useRef<string>('');
  const wordsArrayRef = useRef<string[]>([]);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const isNativePlatform = Capacitor.isNativePlatform();

  // Check if TTS is supported (always true on mobile with plugin, check Web Speech API on web)
  const isSupported = isNativePlatform || (typeof window !== 'undefined' && 'speechSynthesis' in window);

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;
    
    const loadVoices = async () => {
      if (isNativePlatform) {
        // Load native platform voices using Capacitor TTS
        try {
          console.log('📢 TTS: Loading native voices from device...');
          const result = await TextToSpeech.getSupportedVoices();
          console.log('📢 TTS: Native voices loaded:', result.voices.length, result.voices);
          
          if (result.voices && result.voices.length > 0) {
            // Filter to show only EN-US and Filipino voices
            const filteredVoices = result.voices.filter(v => {
              if (!v.lang) return false;
              const langLower = v.lang.toLowerCase();
              
              // Include ONLY English US voices (en-US specifically)
              const isEnglishUS = langLower === 'en-us' || langLower === 'en_us';
              
              // Include Filipino/Tagalog voices (fil, fil-PH, tl, tl-PH)
              const isFilipino = langLower.startsWith('fil') || 
                                 langLower.startsWith('tl') || 
                                 langLower.includes('ph') ||
                                 langLower.includes('filipino') ||
                                 langLower.includes('tagalog');
              
              return isEnglishUS || isFilipino;
            });
            
            console.log('📢 TTS: Filtered voices (English & Filipino only):', filteredVoices.length, filteredVoices);
            setVoices(filteredVoices);
            
            // Auto-select voice based on current language
            if (!currentVoice && filteredVoices.length > 0) {
              // For Tagalog, look for Filipino voices
              const langCode = language === 'tl' ? 'fil' : language;
              const preferredVoice = filteredVoices.find(v => 
                v.lang && (
                  v.lang.toLowerCase().includes(langCode) || 
                  v.lang.toLowerCase().startsWith('fil') ||
                  (language === 'tl' && v.lang.toLowerCase().includes('ph'))
                )
              ) || filteredVoices[0];
              
              console.log('📢 TTS: Auto-selected voice:', preferredVoice);
              setCurrentVoice(preferredVoice);
            }
          } else {
            console.warn('📢 TTS: No native voices found. User may need to install a TTS engine.');
          }
        } catch (error) {
          console.error('📢 TTS: Error loading native voices:', error);
          // Fall back to empty array - user needs to install TTS engine
          setVoices([]);
        }
      } else {
        // Load web voices
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        
        const availableVoices = window.speechSynthesis.getVoices();
        console.log('📢 TTS: Available web voices:', availableVoices.length, availableVoices);
        
        // Filter to show only EN-US and Filipino voices
        const filteredVoices = availableVoices.filter(v => {
          const langLower = v.lang.toLowerCase();
          
          // Include ONLY English US voices (en-US specifically)
          const isEnglishUS = langLower === 'en-us' || langLower === 'en_us';
          
          // Include Filipino/Tagalog voices (fil, fil-PH, tl, tl-PH)
          const isFilipino = langLower.startsWith('fil') || 
                             langLower.startsWith('tl') || 
                             langLower.includes('ph') ||
                             langLower.includes('filipino') ||
                             langLower.includes('tagalog');
          
          return isEnglishUS || isFilipino;
        });
        
        console.log('📢 TTS: Filtered web voices (English & Filipino only):', filteredVoices.length, filteredVoices);
        setVoices(filteredVoices);

        // Auto-select voice based on current language
        if (filteredVoices.length > 0 && !currentVoice) {
          const langCode = language === 'tl' ? 'fil' : 'en'; // Filipino or English
          const preferredVoice = filteredVoices.find(v => 
            v.lang.startsWith(langCode) || v.lang.startsWith(language)
          ) || filteredVoices[0];
          console.log('📢 TTS: Selected web voice:', preferredVoice);
          setCurrentVoice(preferredVoice);
        }
      }
    };

    // Try loading voices immediately
    loadVoices();
    
    if (!isNativePlatform) {
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
    }
  }, [isSupported, isNativePlatform, language, currentVoice]);

  // Speak with Google Cloud TTS
  const speakWithCloudTTS = useCallback(async (text: string) => {
    try {
      console.log('🌥️ TTS: Using Google Cloud TTS');
      
      setIsSpeaking(true);
      setIsPaused(false);
      setProgress(0);
      
      // Determine language code
      const lang = language === 'tl' ? 'fil' : 'en';
      
      // Log the request for debugging
      console.log('🌥️ TTS: Cloud request:', {
        voice_id: cloudVoiceId,
        language: lang,
        text_length: text.length,
        rate,
        pitch,
        volume
      });
      
      // Call backend API
      const response = await fetch(`${API_BASE_URL}/api/tts/synthesize/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_id: cloudVoiceId,
          language: lang,
          rate: rate,
          pitch: pitch,
          volume: volume
        })
      });
      
      console.log('🌥️ TTS: Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // If cloud TTS fails and fallback is suggested, use device TTS
        if (errorData.fallback) {
          console.log('🌥️ TTS: Cloud TTS not available, falling back to device TTS');
          return false; // Indicate fallback needed
        }
        
        throw new Error(`Cloud TTS failed: ${response.status}`);
      }
      
      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Clean up previous audio if exists
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onloadedmetadata = () => {
        console.log('🌥️ TTS: Audio loaded, duration:', audio.duration);
      };
      
      audio.ontimeupdate = () => {
        if (audio.duration) {
          const progressPercent = (audio.currentTime / audio.duration) * 100;
          setProgress(progressPercent);
        }
      };
      
      audio.onended = () => {
        console.log('🌥️ TTS: Audio playback completed');
        setIsSpeaking(false);
        setProgress(100);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      
      audio.onerror = (error) => {
        console.error('🌥️ TTS: Audio playback error:', error);
        setIsSpeaking(false);
        setProgress(0);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      
      await audio.play();
      console.log('🌥️ TTS: Cloud TTS playback started');
      return true; // Success
      
    } catch (error) {
      console.error('🌥️ TTS: Cloud TTS error:', error);
      return false; // Indicate fallback needed
    }
  }, [language, cloudVoiceId, rate, pitch, volume]);

  // Speak text
  const speak = useCallback(async (text: string, options?: TextToSpeechOptions) => {
    if (!isSupported || !text.trim()) return;

    // Store full text for seeking
    fullTextRef.current = text;
    const words = text.split(/\s+/).filter(w => w.length > 0);
    wordsArrayRef.current = words;
    totalWordsRef.current = words.length;
    currentWordRef.current = 0;

    // Try cloud TTS first if enabled and online
    if (useCloudTTS && isOnline) {
      const success = await speakWithCloudTTS(text);
      if (success) {
        return; // Cloud TTS worked, we're done
      }
      // If cloud TTS failed, fall through to device TTS
      console.log('📢 TTS: Falling back to device TTS');
    }

    if (isNativePlatform) {
      // Use Capacitor TTS for mobile
      try {
        console.log('📢 TTS: Using Capacitor TTS on native platform');
        console.log('📢 TTS: Text length:', text.length, 'Language:', language);
        console.log('📢 TTS: Selected voice:', currentVoice);
        
        // Stop any ongoing speech
        await TextToSpeech.stop();
        
        setIsSpeaking(true);
        setIsPaused(false);
        setProgress(0);
        
        // Get voice index if a voice is selected
        const voiceIndex = currentVoice ? voices.findIndex(v => 
          v.name === currentVoice.name && v.lang === currentVoice.lang
        ) : undefined;
        
        const ttsOptions: any = {
          text: text,
          lang: language === 'tl' ? 'fil-PH' : 'en-US',
          rate: options?.rate ?? rate,
          pitch: options?.pitch ?? pitch,
          volume: options?.volume ?? volume,
          category: 'ambient',
        };
        
        // Add voice index if available
        if (voiceIndex !== undefined && voiceIndex >= 0) {
          ttsOptions.voice = voiceIndex;
          console.log('📢 TTS: Using voice index:', voiceIndex);
        }
        
        console.log('📢 TTS: Speaking with options:', ttsOptions);
        
        // Clear any existing progress interval
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        // Calculate estimated duration based on text length and speech rate
        // Average speaking rate is ~150 words per minute, adjusted by rate setting
        const wordCount = words.length;
        const wordsPerMinute = 150 * rate; // Adjust for speech rate
        const estimatedDurationMs = (wordCount / wordsPerMinute) * 60 * 1000;
        
        console.log('📢 TTS: Estimated duration:', estimatedDurationMs / 1000, 'seconds for', wordCount, 'words');
        
        // Start progress simulation
        const startTime = Date.now();
        progressIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progressPercent = Math.min((elapsed / estimatedDurationMs) * 100, 99);
          
          setProgress(progressPercent);
          
          // Don't reach 100% until speech actually completes
          if (progressPercent >= 99) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
          }
        }, 100); // Update every 100ms for smooth progress
        
        // Start speaking (this is fire-and-forget, doesn't wait for completion)
        TextToSpeech.speak(ttsOptions).then(() => {
          console.log('📢 TTS: Speech completed successfully');
          
          // Clear interval and set final state
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          
          setIsSpeaking(false);
          setProgress(100);
          
          // Reset progress after a short delay
          setTimeout(() => {
            setProgress(0);
          }, 1000);
        }).catch((error) => {
          console.error('📢 TTS: Speech error:', error);
          
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          
          setIsSpeaking(false);
          setProgress(0);
        });
        
      } catch (error) {
        console.error('📢 TTS Error on native platform:', error);
        console.error('📢 TTS Error details:', JSON.stringify(error));
        setIsSpeaking(false);
        setIsPaused(false);
        setProgress(0);
        
        // Show user-friendly error with option to install TTS engine
        const install = confirm(
          'Text-to-Speech is not available or no voices are installed.\n\n' +
          'Would you like to install a TTS engine?\n\n' +
          'Recommended: Google Text-to-Speech (supports Filipino voices)'
        );
        
        if (install) {
          try {
            await TextToSpeech.openInstall();
          } catch (installError) {
            console.error('📢 TTS: Could not open install page:', installError);
            alert('Please install "Google Text-to-Speech" from the Play Store for better voice quality, including Filipino voices.');
          }
        }
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
  }, [isSupported, isNativePlatform, rate, pitch, volume, currentVoice, language, useCloudTTS, isOnline, speakWithCloudTTS]);

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
    
    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Stop audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
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
      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Stop audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
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
    cloudVoiceId,
    setCloudVoiceId,
    useCloudTTS,
    setUseCloudTTS,
    isOnline
  };
};
