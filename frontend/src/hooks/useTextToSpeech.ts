import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useI18nStore } from '../stores/i18nStore';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';
import { useOnlineStatus } from './useOnlineStatus';
import { AndroidTtsVoices } from '../services/androidTtsVoices';
import { API_BASE_URL } from '../config/constants';
import soundService from '../services/soundService';

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
  hasFilipinoVoices: boolean;
  storyLanguage: string;
}

export const useTextToSpeech = (options?: UseTextToSpeechOptions): UseTextToSpeechReturn => {
  const { language: appLanguage } = useI18nStore();
  // Use story language if provided, otherwise fall back to app language
  const language = options?.storyLanguage || appLanguage;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Helper function to resume background music when TTS finishes
  const resumeBackgroundMusic = useCallback(() => {
    if (soundService.isBackgroundMusicEnabled()) {
      console.log('🎵 Resuming background music after TTS');
      soundService.resumeBackgroundMusic();
    }
  }, []);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [allVoices, setAllVoices] = useState<SpeechSynthesisVoice[]>([]); // all loaded voices
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);

  // (Removed deviceVoiceId state, we read/write to localStorage directly per language)
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  
  const isOnline = useOnlineStatus();
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const totalWordsRef = useRef(0);
  const currentWordRef = useRef(0);
  const fullTextRef = useRef<string>('');
  const wordsArrayRef = useRef<string[]>([]);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Used to ignore late native completion callbacks after Stop is pressed
  const nativeSpeakTokenRef = useRef(0);
  
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
          const isAndroid = Capacitor.getPlatform() === 'android';

          // Always fetch the community plugin voices, because the `voice` you pass to `TextToSpeech.speak()`
          // must be an index into *this* list.
          const supported = await TextToSpeech.getSupportedVoices();
          const supportedVoices: any[] = supported?.voices || [];

          // Android: also fetch the real installed/offline voices from the native engine.
          // We'll use this as an allow-list to hide voices that are not actually downloaded.
          let installedKeys = new Set<string>();
          if (isAndroid) {
            try {
              const installed = await AndroidTtsVoices.getInstalledVoices({ localOnly: true });
              const installedVoices: any[] = (installed as any).voices || [];
              installedKeys = new Set(
                installedVoices.map(v => `${(v.name || '').toLowerCase()}|||${(v.lang || '').toLowerCase()}`)
              );
              console.log('📢 TTS: Android installed/offline voices:', installedVoices.length, installedVoices);
            } catch (e) {
              console.warn('📢 TTS: Failed to query Android installed voices. Falling back to supported voices only.', e);
            }
          }

          console.log('📢 TTS: Native supported voices loaded:', supportedVoices.length, supportedVoices);

          if (supportedVoices.length > 0) {
            const rawVoices: any[] = supportedVoices;
            // Filter to show only EN-US and Filipino voices
            // On Android we also *prefer* offline (downloaded) voices, which are typically marked as "local".
            // Some engines expose "network" voices which can cause glitches when selected while offline.
            const baseFiltered = rawVoices.filter(v => {
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
            });

            // If we have an installed/offline allow-list (Android), restrict to those voices.
            const allowListed = (isAndroid && installedKeys.size > 0)
              ? baseFiltered.filter(v => installedKeys.has(`${(v.name || '').toLowerCase()}|||${(v.lang || '').toLowerCase()}`))
              : baseFiltered;

            // IMPORTANT: voice index passed to TextToSpeech.speak must match supportedVoices ordering.
            const mappedVoices = allowListed.map((v) => ({
              ...v,
              originalIndex: rawVoices.indexOf(v)
            }));

            // Android: at this point, if installedKeys was available, we are already limited to installed voices.
            // Keep the extra heuristic as a safety net when installedKeys is empty.
            let filteredVoices = mappedVoices;
            if (isAndroid && installedKeys.size === 0) {
              const explicitLocal = mappedVoices.filter(v => (v.name || '').toLowerCase().includes('local'));
              filteredVoices = explicitLocal.length > 0
                ? explicitLocal
                : mappedVoices.filter(v => !(v.name || '').toLowerCase().includes('network'));
            }

            console.log('📢 TTS: Filtered voices (English & Filipino only):', filteredVoices.length, filteredVoices);
            setAllVoices(filteredVoices);
            setVoices(filteredVoices);

            // Restore saved device voice if available; otherwise auto-select by language
            if (filteredVoices.length > 0) {
              let preferredVoice: any = null;

              const langPrefix = language.split('-')[0];
              const storageKey = `tts_deviceVoiceId_${langPrefix}`;
              const savedId = localStorage.getItem(storageKey);

              if (savedId) {
                const [savedName, savedLang, savedIndexStr] = savedId.split('|||');
                const savedIndex = Number(savedIndexStr);
                preferredVoice = filteredVoices.find(v => {
                  const originalIndex = (v as any).originalIndex;
                  return (
                    (savedName ? v.name === savedName : true) &&
                    (savedLang ? v.lang === savedLang : true) &&
                    (!Number.isNaN(savedIndex) ? originalIndex === savedIndex : true)
                  );
                }) || null;
              }

              if (!preferredVoice) {
                // For Tagalog, look for Filipino voices
                const langCode = language === 'tl' ? 'fil' : language;
                preferredVoice = filteredVoices.find(v =>
                  v.lang && (
                    v.lang.toLowerCase().includes(langCode) ||
                    v.lang.toLowerCase().startsWith('fil') ||
                    (language === 'tl' && v.lang.toLowerCase().includes('ph'))
                  )
                ) || filteredVoices[0];
              }

              // Ensure currentVoice always references an object from the current voices array
              setCurrentVoice(preferredVoice);

              if (preferredVoice) {
                const preferredId = `${preferredVoice.name || ''}|||${preferredVoice.lang || ''}|||${(preferredVoice as any).originalIndex ?? ''}`;
                localStorage.setItem(storageKey, preferredId);
              }
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
        setAllVoices(filteredVoices);
        setVoices(filteredVoices);

        if (filteredVoices.length > 0) {
          let preferredVoice: any = null;

          const langPrefix = language.split('-')[0];
          const storageKey = `tts_deviceVoiceId_${langPrefix}`;
          const savedId = localStorage.getItem(storageKey);

          // Attempt to restore saved device voice
          if (savedId) {
            const [savedName, savedLang, savedIndexStr] = savedId.split('|||');
            const savedIndex = savedIndexStr !== '' ? Number(savedIndexStr) : NaN;
            
            preferredVoice = filteredVoices.find((v, index) => {
              const originalIndex = (v as any).originalIndex;
              const compareIdx = originalIndex !== undefined ? originalIndex : index;
              return (
                (savedName ? v.name === savedName : true) &&
                (savedLang ? v.lang === savedLang : true) &&
                (!Number.isNaN(savedIndex) ? compareIdx === savedIndex : true)
              );
            }) || null;
          }

          // Auto-select voice based on current language if no saved voice or saved voice doesn't match language
          const currentLangCode = language === 'tl' ? 'fil' : 'en';
          
          if (!preferredVoice || !preferredVoice.lang.toLowerCase().includes(currentLangCode)) {
            preferredVoice = filteredVoices.find(v => 
              v.lang.toLowerCase().includes(currentLangCode) || v.lang.toLowerCase().startsWith(language)
            ) || filteredVoices[0];
          }

          if (preferredVoice) {
            console.log('📢 TTS: Selected web voice:', preferredVoice);
            setCurrentVoice(preferredVoice);
            
            const preferredId = `${preferredVoice.name || ''}|||${preferredVoice.lang || ''}|||${(preferredVoice as any).originalIndex ?? filteredVoices.indexOf(preferredVoice)}`;
            localStorage.setItem(storageKey, preferredId);
          }
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
  }, [isSupported, isNativePlatform, language]);

  // Auto-switch voice when language changes (for story language switching)
  useEffect(() => {
    if (!isSupported || allVoices.length === 0) return;
    
    console.log('📢 TTS: Language changed to:', language);
    
    const langCode = language === 'tl' ? 'fil' : 'en';

    // Helper: does a voice strictly match the desired language?
    const voiceMatchesLang = (v: SpeechSynthesisVoice) => {
      const l = v.lang.toLowerCase();
      if (language === 'tl') {
        return l.startsWith('fil') || l.startsWith('tl-') || l === 'tl' || l.includes('-ph-');
      } else {
        return (l === 'en-us' || l === 'en_us' || (l.startsWith('en') && !l.startsWith('fil') && !l.startsWith('tl')));
      }
    };
    
    // Check if currentVoice already strictly matches the new language
    if (currentVoice && voiceMatchesLang(currentVoice)) {
      console.log('📢 TTS: Current voice already matches language:', currentVoice);
      return;
    }

    // Try to restore saved preference for this language
    const langPrefix = language.split('-')[0];
    const storageKey = `tts_deviceVoiceId_${langPrefix}`;
    const savedId = localStorage.getItem(storageKey);
    let matchingVoice: SpeechSynthesisVoice | undefined;

    if (savedId) {
      const [savedName, savedLang] = savedId.split('|||');
      matchingVoice = allVoices.find(v =>
        (savedName ? v.name === savedName : true) &&
        (savedLang ? v.lang === savedLang : true)
      );
    }

    // Fall back to first voice that matches language
    if (!matchingVoice) {
      matchingVoice = allVoices.find(v => voiceMatchesLang(v));
    }
    
    if (matchingVoice) {
      console.log('📢 TTS: Auto-switching voice to match language:', matchingVoice);
      setCurrentVoice(matchingVoice);
    } else {
      console.log('📢 TTS: No matching voice found for language:', language);
    }
  }, [language, allVoices, isSupported]); // Watch language changes

  // Compute filtered voices to only show voices matching the story language in the UI
  const filteredVoicesForUI = useMemo(() => {
    if (allVoices.length === 0) return voices; // fall back to all voices
    const filtered = allVoices.filter(v => {
      const l = v.lang.toLowerCase();
      if (language === 'tl') {
        return l.startsWith('fil') || l.startsWith('tl-') || l === 'tl' || l.includes('-ph-') || l.includes('tagalog') || l.includes('filipino');
      } else {
        return l === 'en-us' || l === 'en_us' || (l.startsWith('en') && !l.includes('fil') && !l.startsWith('tl'));
      }
    });
    // If no voices match the target language, return ALL voices as fallback
    // so the user can still pick something usable
    return filtered.length > 0 ? filtered : allVoices;
  }, [allVoices, voices, language]);

  // True if there are actual Filipino voices available in the loaded set
  const hasFilipinoVoices = useMemo(() => {
    return allVoices.some(v => {
      const l = v.lang.toLowerCase();
      return l.startsWith('fil') || l.startsWith('tl-') || l === 'tl' || l.includes('-ph-');
    });
  }, [allVoices]);

  const setVoice = useCallback((voice: SpeechSynthesisVoice | null) => {
    setCurrentVoice(voice);

    const langPrefix = language.split('-')[0];
    const storageKey = `tts_deviceVoiceId_${langPrefix}`;

    // Persist native/device voice selection as a stable key per language
    if (voice) {
      const originalIndex = (voice as any).originalIndex;
      const id = `${voice.name || ''}|||${voice.lang || ''}|||${originalIndex !== undefined ? originalIndex : ''}`;
      localStorage.setItem(storageKey, id);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [language]);

  const speak = useCallback(async (text: string, options?: TextToSpeechOptions) => {
    if (!isSupported || !text.trim()) return;

    // Pause background music when TTS starts
    if (soundService.isBackgroundMusicPlaying()) {
      console.log('🎵 Pausing background music for TTS');
      soundService.pauseBackgroundMusic();
    }

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
        console.log('📢 TTS: Selected voice:', currentVoice);
        
        // Stop any ongoing speech
        await TextToSpeech.stop();

        // New token for this speak call
        const speakToken = ++nativeSpeakTokenRef.current;
        
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
          // If a newer speak/stop happened, ignore this completion
          if (speakToken !== nativeSpeakTokenRef.current) {
            console.log('📢 TTS: Ignoring stale native completion callback');
            return;
          }

          console.log('📢 TTS: Speech completed successfully');
          
          // Clear interval and set final state
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          
          setIsSpeaking(false);
          setProgress(100);
          resumeBackgroundMusic();
          
          // Reset progress after a short delay
          setTimeout(() => {
            setProgress(0);
          }, 1000);
        }).catch((error) => {
          // If a newer speak/stop happened, ignore this error
          if (speakToken !== nativeSpeakTokenRef.current) {
            console.log('📢 TTS: Ignoring stale native error callback');
            return;
          }

          console.error('📢 TTS: Speech error:', error);
          
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          
          setIsSpeaking(false);
          setProgress(0);
          resumeBackgroundMusic();
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
      // Set lang so the browser's speech engine knows what language is being spoken
      utterance.lang = language === 'tl' ? 'fil-PH' : 'en-US';

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
        resumeBackgroundMusic();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        setIsPaused(false);
        setProgress(0);
        utteranceRef.current = null;
        resumeBackgroundMusic();
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [isSupported, isNativePlatform, rate, pitch, volume, currentVoice, language]);

  const pause = useCallback(async () => {
    if (!isSupported || !isSpeaking) return;
    
    if (isNativePlatform) {
      // Native (Android/iOS) plugin does not support pause. Treat pause as stop.
      await stop();
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
      // Native plugin cannot resume because it cannot pause.
      // No-op.
      return;
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
    
    console.log('🛑 TTS: Stopping playback and cleanup');
    
    // Abort any pending fetch requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Stop audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ''; // Clear source to prevent further loading
      audioRef.current = null;
    }
    
    if (isNativePlatform) {
      // Invalidate any pending native completion callbacks
      nativeSpeakTokenRef.current++;
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
    
    // Resume background music when TTS stops
    resumeBackgroundMusic();
  }, [isSupported, isNativePlatform, resumeBackgroundMusic]);

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
      resumeBackgroundMusic();
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
    isMountedRef.current = true;
    
    return () => {
      console.log('🧹 TTS: Component unmounting, cleaning up');
      isMountedRef.current = false;
      
      // Abort any pending fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Stop audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = ''; // Clear source to prevent further loading
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
    voices: filteredVoicesForUI,
    currentVoice,
    setVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
    progress,
    hasFilipinoVoices,
    storyLanguage: language,
  };
};
