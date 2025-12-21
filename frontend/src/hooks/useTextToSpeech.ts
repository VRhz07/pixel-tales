import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Helper function to resume background music when TTS finishes
  const resumeBackgroundMusic = useCallback(() => {
    if (soundService.isBackgroundMusicEnabled()) {
      console.log('🎵 Resuming background music after TTS');
      soundService.resumeBackgroundMusic();
    }
  }, []);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Persist device voice selection (native TTS) using a stable key
  // Format: name|||lang|||originalIndex
  const [deviceVoiceId, setDeviceVoiceId] = useState<string>(() => {
    const saved = localStorage.getItem('tts_deviceVoiceId');
    return saved || '';
  });
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Used to ignore late native completion callbacks after Stop is pressed
  const nativeSpeakTokenRef = useRef(0);
  
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

  // Save device voice selection key to localStorage when it changes
  useEffect(() => {
    if (deviceVoiceId) {
      localStorage.setItem('tts_deviceVoiceId', deviceVoiceId);
    } else {
      localStorage.removeItem('tts_deviceVoiceId');
    }
  }, [deviceVoiceId]);

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
            setVoices(filteredVoices);

            // Restore saved device voice if available; otherwise auto-select by language
            if (filteredVoices.length > 0) {
              let preferredVoice: any = null;

              if (deviceVoiceId) {
                const [savedName, savedLang, savedIndexStr] = deviceVoiceId.split('|||');
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

              const preferredId = `${preferredVoice.name || ''}|||${preferredVoice.lang || ''}|||${(preferredVoice as any).originalIndex ?? ''}`;
              setDeviceVoiceId(preferredId);
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
  }, [isSupported, isNativePlatform, language]);

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
      
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Call backend API with abort signal
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
        }),
        signal: abortControllerRef.current.signal
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
      
      // Check if component is still mounted before proceeding
      if (!isMountedRef.current) {
        console.log('🌥️ TTS: Component unmounted, aborting playback');
        return true;
      }
      
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
        resumeBackgroundMusic();
      };
      
      audio.onerror = (error) => {
        console.error('🌥️ TTS: Audio playback error:', error);
        setIsSpeaking(false);
        setProgress(0);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        resumeBackgroundMusic();
      };
      
      // Check again before playing
      if (!isMountedRef.current) {
        console.log('🌥️ TTS: Component unmounted, not playing audio');
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        return true;
      }
      
      await audio.play();
      console.log('🌥️ TTS: Cloud TTS playback started');
      return true; // Success
      
    } catch (error) {
      // Check if error is due to abort
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🌥️ TTS: Fetch aborted (user left page)');
        setIsSpeaking(false);
        setProgress(0);
        return true; // Not a real error, just aborted
      }
      
      console.error('🌥️ TTS: Cloud TTS error:', error);
      setIsSpeaking(false);
      setProgress(0);
      return false; // Indicate fallback needed
    }
  }, [language, cloudVoiceId, rate, pitch, volume]);

  // Speak text
  const setVoice = useCallback((voice: SpeechSynthesisVoice | null) => {
    setCurrentVoice(voice);

    // Persist native/device voice selection as a stable key
    if (voice) {
      const originalIndex = (voice as any).originalIndex;
      const id = `${voice.name || ''}|||${voice.lang || ''}|||${originalIndex ?? ''}`;
      setDeviceVoiceId(id);
    } else {
      setDeviceVoiceId('');
    }
  }, []);

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
    
    // If using Cloud TTS (audio element)
    if (audioRef.current) {
      audioRef.current.play();
      setIsPaused(false);
      console.log('🌥️ TTS: Cloud audio resumed');
      return;
    }
    
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
    voices,
    currentVoice,
    setVoice,
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
