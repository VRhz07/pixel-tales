import { useState, useEffect, useCallback, useRef } from 'react';
import { useI18nStore } from '../stores/i18nStore';
import { Capacitor } from '@capacitor/core';

// Web Speech API types
const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

// Check if running in native mobile app
const isNativePlatform = Capacitor.isNativePlatform();

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export const useSpeechRecognitionMobile = (options: UseSpeechRecognitionOptions = {}) => {
  const { language } = useI18nStore();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const nativeListenerRef = useRef<any>(null);

  // Language mapping
  const getLanguageCode = useCallback(() => {
    switch (language) {
      case 'tl':
        return 'tl-PH';
      case 'en':
      default:
        return 'en-US';
    }
  }, [language]);

  // Check support on mount
  useEffect(() => {
    const checkSupport = async () => {
      if (isNativePlatform) {
        try {
          // Try to import Capacitor plugin
          const { SpeechRecognition: NativeSpeech } = await import('@capacitor-community/speech-recognition');
          const { available } = await NativeSpeech.available();
          setIsSupported(available);
        } catch (err) {
          // Plugin not installed, fallback to WebView
          setIsSupported(isSpeechRecognitionSupported);
        }
      } else {
        setIsSupported(isSpeechRecognitionSupported);
      }
    };

    checkSupport();
  }, []);

  // Native speech recognition (Capacitor)
  const startNativeSpeechRecognition = useCallback(async () => {
    try {
      const { SpeechRecognition: NativeSpeech } = await import('@capacitor-community/speech-recognition');
      
      // Request permissions
      const { speechRecognition } = await NativeSpeech.requestPermissions();
      
      if (speechRecognition !== 'granted') {
        throw new Error('Permission denied');
      }

      // Start listening
      await NativeSpeech.start({
        language: getLanguageCode(),
        maxResults: options.maxAlternatives || 1,
        prompt: language === 'tl' ? 'Magsalita ngayon...' : 'Speak now...',
        partialResults: options.interimResults ?? true,
        popup: false,
      });

      setIsListening(true);
      setError(null);

      // Listen for results
      nativeListenerRef.current = await NativeSpeech.addListener('partialResults', (data: any) => {
        if (data.matches && data.matches.length > 0) {
          setInterimTranscript(data.matches[0]);
        }
      });

      // Listen for final results
      const finalListener = await NativeSpeech.addListener('finalResults', (data: any) => {
        if (data.matches && data.matches.length > 0) {
          const finalText = data.matches[0];
          setTranscript(prev => prev + finalText + ' ');
          setInterimTranscript('');
          
          if (options.onResult) {
            options.onResult(finalText);
          }
        }
        setIsListening(false);
      });

    } catch (err: any) {
      const errorMessage = language === 'tl'
        ? 'Hindi masimulan ang voice recognition'
        : 'Failed to start voice recognition';
      setError(errorMessage);
      setIsListening(false);
      
      if (options.onError) {
        options.onError(errorMessage);
      }
    }
  }, [language, getLanguageCode, options]);

  // Web Speech API (WebView fallback)
  const initWebSpeechRecognition = useCallback(() => {
    if (!isSpeechRecognitionSupported) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = options.continuous ?? false;
    recognition.interimResults = options.interimResults ?? true;
    recognition.maxAlternatives = options.maxAlternatives ?? 1;
    recognition.lang = getLanguageCode();

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          finalText += transcriptText + ' ';
        } else {
          interimText += transcriptText;
        }
      }

      if (finalText) {
        setTranscript(prev => prev + finalText);
        if (options.onResult) {
          options.onResult(finalText.trim());
        }
      }

      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: any) => {
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = language === 'tl' 
            ? 'Walang narinig na boses. Subukang magsalita ulit.'
            : 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = language === 'tl'
            ? 'Hindi ma-access ang mikropono.'
            : 'Microphone access denied.';
          break;
        case 'not-allowed':
          errorMessage = language === 'tl'
            ? 'Kailangan ng pahintulot para sa mikropono.'
            : 'Microphone permission required.';
          break;
        case 'network':
          errorMessage = language === 'tl'
            ? 'Problema sa network. Suriin ang koneksyon.'
            : 'Network error. Check your connection.';
          break;
        default:
          errorMessage = language === 'tl'
            ? `Error: ${event.error}`
            : `Error: ${event.error}`;
      }

      setError(errorMessage);
      setIsListening(false);
      
      if (options.onError) {
        options.onError(errorMessage);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
  }, [language, getLanguageCode, options]);

  // Initialize appropriate recognition system
  useEffect(() => {
    if (!isNativePlatform) {
      initWebSpeechRecognition();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (nativeListenerRef.current) {
        nativeListenerRef.current.remove();
      }
    };
  }, [isNativePlatform, initWebSpeechRecognition]);

  // Start listening
  const startListening = useCallback(async () => {
    if (isListening) return;
    
    try {
      setTranscript('');
      setInterimTranscript('');
      setError(null);

      if (isNativePlatform) {
        // Use native speech recognition
        await startNativeSpeechRecognition();
      } else {
        // Use Web Speech API
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
      }
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError(language === 'tl' 
        ? 'Hindi masimulan ang voice recognition'
        : 'Failed to start voice recognition');
    }
  }, [isListening, language, isNativePlatform, startNativeSpeechRecognition]);

  // Stop listening
  const stopListening = useCallback(async () => {
    if (!isListening) return;
    
    try {
      if (isNativePlatform) {
        const { SpeechRecognition: NativeSpeech } = await import('@capacitor-community/speech-recognition');
        await NativeSpeech.stop();
      } else {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
    }
  }, [isListening, isNativePlatform]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    isNativePlatform,
    startListening,
    stopListening,
    resetTranscript,
  };
};
