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

interface UseTextToSpeechOptions {
  storyLanguage?: 'en' | 'tl'; // Override language for specific story
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

export const useTextToSpeech = (options?: UseTextToSpeechOptions): UseTextToSpeechReturn => {
  const { language: appLanguage } = useI18nStore();
  // Use story language if provided, otherwise fall back to app language
  const language = options?.storyLanguage || appLanguage;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  
  // Load cloudVoiceId from localStorage with proper initialization
  const [cloudVoiceId, setCloudVoiceId] = useState<string>(() => {
    const saved = localStorage.getItem('tts_cloudVoiceId');
    return saved || 'female_english';
  });
  
  // Load useCloudTTS preference from localStorage
  const [useCloudTTS, setUseCloudTTS] = useState(() => {
    const saved = localStorage.getItem('tts_useCloudTTS');
    return saved !== null ? saved === 'true' : true; // Default to cloud when available
  });
  
  const isOnline = useOnlineStatus();
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const totalWordsRef = useRef(0);
  const currentWordRef = useRef(0);
  const fullTextRef = useRef<string>('');
  const wordsArrayRef = useRef<string[]>([]);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const isNativePlatform = Capacitor.isNativePlatform();
  
  // Save cloudVoiceId to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('tts_cloudVoiceId', cloudVoiceId);
    console.log('🎤 TTS: Saved cloud voice preference:', cloudVoiceId);
  }, [cloudVoiceId]);
  
  // Save useCloudTTS to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('tts_useCloudTTS', String(useCloudTTS));
    console.log('🎤 TTS: Saved cloud TTS preference:', useCloudTTS);
  }, [useCloudTTS]);

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
              const nameLower = v.name ? v.name.toLowerCase() : '';
              
              // Include ONLY English US voices (en-US specifically)
              const isEnglishUS = langLower === 'en-us' || langLower === 'en_us';
              
              // Include Filipino/Tagalog voices - BE STRICT to avoid Bengali/Arabic
              const isFilipino = langLower.startsWith('fil') || 
                                 langLower.startsWith('tl-') ||
                                 langLower === 'tl' ||
                                 (langLower.includes('ph') && (langLower.startsWith('fil') || langLower.startsWith('tl'))) ||
                                 nameLower.includes('filipino') ||
                                 nameLower.includes('tagalog');
              
              // Explicitly EXCLUDE Arabic and Bengali
              const isArabic = langLower.startsWith('ar') || nameLower.includes('arabic') || nameLower.includes('عربي');
              const isBengali = langLower.startsWith('bn') || nameLower.includes('bengali') || nameLower.includes('বাংলা');
              
              return (isEnglishUS || isFilipino) && !isArabic && !isBengali;
            }).map((v, index) => ({
              ...v,
              originalIndex: result.voices.indexOf(v) // Store original index for voice selection
            }));
            
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
          const nameLower = v.name ? v.name.toLowerCase() : '';
          
          // Include ONLY English US voices (en-US specifically)
          const isEnglishUS = langLower === 'en-us' || langLower === 'en_us';
          
          // Include Filipino/Tagalog voices - BE STRICT to avoid Bengali/Arabic
          const isFilipino = langLower.startsWith('fil') || 
                             langLower.startsWith('tl-') ||
                             langLower === 'tl' ||
                             (langLower.includes('ph') && (langLower.startsWith('fil') || langLower.startsWith('tl'))) ||
                             nameLower.includes('filipino') ||
                             nameLower.includes('tagalog');
          
          // Explicitly EXCLUDE Arabic and Bengali
          const isArabic = langLower.startsWith('ar') || nameLower.includes('arabic') || nameLower.includes('عربي');
          const isBengali = langLower.startsWith('bn') || nameLower.includes('bengali') || nameLower.includes('বাংলা');
          
          return (isEnglishUS || isFilipino) && !isArabic && !isBengali;
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

  // Auto-switch voice when language changes (for story language switching)
  useEffect(() => {
    if (!isSupported || voices.length === 0) return;
    
    console.log('📢 TTS: Language changed to:', language);
    
    // Find a voice that matches the current language
    const langCode = language === 'tl' ? 'fil' : language;
    const matchingVoice = voices.find(v => 
      v.lang && (
        v.lang.toLowerCase().includes(langCode) || 
        v.lang.toLowerCase().startsWith('fil') ||
        (language === 'tl' && v.lang.toLowerCase().includes('ph'))
      )
    );
    
    // If we found a matching voice and it's different from current
    if (matchingVoice && matchingVoice !== currentVoice) {
      console.log('📢 TTS: Auto-switching voice to match language:', matchingVoice);
      setCurrentVoice(matchingVoice);
    } else if (matchingVoice) {
      console.log('📢 TTS: Voice already matches language:', matchingVoice);
    } else {
      console.log('📢 TTS: No matching voice found for language:', language);
    }
  }, [language, voices, isSupported]); // Watch language changes

  // Auto-switch Cloud TTS voice ID when language changes
  useEffect(() => {
    console.log('🌥️ TTS: Checking Cloud voice for language:', language, 'Current voice:', cloudVoiceId);
    
    // Define default cloud voice IDs for each language
    const defaultCloudVoices: { [key: string]: string } = {
      'en': 'female_english',
      'tl': 'female_filipino'
    };
    
    const langKey = language === 'tl' ? 'tl' : 'en';
    const recommendedVoiceId = defaultCloudVoices[langKey];
    
    // Only auto-switch if the current voice doesn't match the language
    // Check if current voice ID contains language indicator
    const currentIsEnglish = cloudVoiceId.toLowerCase().includes('english');
    const currentIsFilipino = cloudVoiceId.toLowerCase().includes('filipino') || cloudVoiceId.toLowerCase().includes('tagalog');
    const needsEnglish = language === 'en';
    const needsFilipino = language === 'tl';
    
    console.log('🌥️ TTS: Voice check -', {
      cloudVoiceId,
      currentIsEnglish,
      currentIsFilipino,
      needsEnglish,
      needsFilipino,
      recommendedVoiceId
    });
    
    // Auto-switch if language doesn't match current voice
    if ((needsEnglish && !currentIsEnglish) || (needsFilipino && !currentIsFilipino)) {
      console.log('🌥️ TTS: Auto-switching Cloud voice from', cloudVoiceId, 'to', recommendedVoiceId);
      setCloudVoiceId(recommendedVoiceId);
    } else {
      console.log('🌥️ TTS: Cloud voice already matches language:', cloudVoiceId);
    }
  }, [language, cloudVoiceId]); // Watch language AND cloudVoiceId changes

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
      const response = await fetch(`${API_BASE_URL}/tts/synthesize/`, {
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
        
        // Get voice's ORIGINAL index from the device (not filtered array index)
        const voiceIndex = currentVoice && (currentVoice as any).originalIndex !== undefined 
          ? (currentVoice as any).originalIndex 
          : undefined;
        
        const ttsOptions: any = {
          text: text,
          rate: options?.rate ?? rate,
          pitch: options?.pitch ?? pitch,
          volume: options?.volume ?? volume,
          category: 'ambient',
        };
        
        // Add voice index if available - this will use the voice's native language
        if (voiceIndex !== undefined && voiceIndex >= 0) {
          ttsOptions.voice = voiceIndex;
          console.log('📢 TTS: Using voice ORIGINAL index:', voiceIndex, 'Voice:', currentVoice?.name, 'Language:', currentVoice?.lang);
        } else {
          // Only set lang if no specific voice is selected (fallback)
          ttsOptions.lang = currentVoice?.lang || (language === 'tl' ? 'fil-PH' : 'en-US');
          console.log('📢 TTS: No voice selected, using lang fallback:', ttsOptions.lang);
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
    
    // If using Cloud TTS (audio element)
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
      console.log('🌥️ TTS: Cloud audio paused');
      return;
    }
    
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
    
    // If using Cloud TTS (audio element)
    if (audioRef.current) {
      audioRef.current.play();
      setIsPaused(false);
      console.log('🌥️ TTS: Cloud audio resumed');
      return;
    }
    
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
