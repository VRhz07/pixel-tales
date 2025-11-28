import { useState, useEffect, useCallback, useRef } from 'react';
import { useI18nStore } from '../stores/i18nStore';

// Check if browser supports Web Speech API
const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}) => {
  const { language } = useI18nStore();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(isSpeechRecognitionSupported);
  
  const recognitionRef = useRef<any>(null);
  const optionsRef = useRef(options);

  // Language mapping for Web Speech API
  const getLanguageCode = useCallback(() => {
    switch (language) {
      case 'tl':
        return 'tl-PH'; // Tagalog (Philippines)
      case 'en':
      default:
        return 'en-US'; // English (US)
    }
  }, [language]);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Initialize speech recognition ONCE
  useEffect(() => {
    if (!isSpeechRecognitionSupported) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = optionsRef.current.continuous ?? false;
    recognition.interimResults = optionsRef.current.interimResults ?? true;
    recognition.maxAlternatives = optionsRef.current.maxAlternatives ?? 1;
    recognition.lang = getLanguageCode();
    
    // Important: Some browsers require these settings for localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Running on localhost - speech recognition may have limitations');
    }

    recognition.onstart = () => {
      console.log('Speech recognition started');
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
        if (optionsRef.current.onResult) {
          optionsRef.current.onResult(finalText.trim());
        }
      }

      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'aborted':
          // Ignore aborted errors - these happen when stopping recognition
          console.log('Recognition aborted (normal)');
          return;
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
          // Network error can be misleading - might be CORS or API access issue
          console.warn('Network error - this might be a CORS issue or temporary API problem');
          errorMessage = language === 'tl'
            ? 'May problema sa koneksyon. Subukan ulit o i-refresh ang page.'
            : 'Connection issue. Try again or refresh the page. (Your internet is working, this may be a browser API issue)';
          break;
        default:
          errorMessage = language === 'tl'
            ? `Error: ${event.error}`
            : `Error: ${event.error}`;
      }

      setError(errorMessage);
      setIsListening(false);
      
      if (optionsRef.current.onError) {
        optionsRef.current.onError(errorMessage);
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      // Only abort if component is unmounting
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore errors during cleanup
          console.log('Cleanup: recognition already stopped');
        }
      }
    };
  }, []); // Only run once on mount

  // Update language when it changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = getLanguageCode();
    }
  }, [getLanguageCode]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    try {
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      
      // Make sure recognition is stopped before starting
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      
      // Small delay to ensure clean state
      setTimeout(() => {
        try {
          recognitionRef.current.start();
          console.log('Recognition start() called');
        } catch (startErr: any) {
          console.error('Error in start():', startErr);
          setError(language === 'tl' 
            ? 'Hindi masimulan ang voice recognition'
            : 'Failed to start voice recognition');
        }
      }, 100);
      
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError(language === 'tl' 
        ? 'Hindi masimulan ang voice recognition'
        : 'Failed to start voice recognition');
    }
  }, [isListening, language]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
    }
  }, [isListening]);

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
    startListening,
    stopListening,
    resetTranscript,
  };
};
