/**
 * Secure Gemini Service - Proxy through Backend
 * API keys are kept secure on the backend server
 * This replaces direct frontend calls to Gemini API
 */

import { apiConfigService } from './apiConfig.service';

interface GenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * Generate story content using Gemini AI (via backend proxy)
 */
export async function generateStoryWithGemini(
  prompt: string,
  generationConfig?: GenerationConfig
): Promise<string> {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${apiConfigService.getApiUrl()}/ai/gemini/generate-story/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt,
        generationConfig: generationConfig || {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Server error: ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text;
      }
    }

    throw new Error('No content generated from AI');
  } catch (error) {
    console.error('Gemini AI generation failed:', error);
    throw error;
  }
}

/**
 * Generate character details using Gemini AI (via backend proxy)
 */
export async function generateCharacterWithGemini(prompt: string): Promise<string> {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${apiConfigService.getApiUrl()}/ai/gemini/generate-character/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Server error: ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text;
      }
    }

    throw new Error('No character data generated from AI');
  } catch (error) {
    console.error('Character generation failed:', error);
    throw error;
  }
}

/**
 * Analyze image with Gemini Vision API (via backend proxy)
 */
export async function analyzeImageWithGemini(
  imageData: string,
  prompt: string = 'Extract all text from this image'
): Promise<string> {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${apiConfigService.getApiUrl()}/ai/gemini/analyze-image/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        image: imageData,
        prompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Server error: ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text;
      }
    }

    throw new Error('No analysis result from AI');
  } catch (error) {
    console.error('Image analysis failed:', error);
    throw error;
  }
}

/**
 * Check if AI services are available on the backend
 */
export async function checkAIServiceStatus(): Promise<{
  gemini_available: boolean;
  ocr_available: boolean;
}> {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${apiConfigService.getApiUrl()}/ai/status/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check AI service status');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to check AI service status:', error);
    return {
      gemini_available: false,
      ocr_available: false,
    };
  }
}

/**
 * Legacy compatibility function - redirects to secure proxy
 * @deprecated Use generateStoryWithGemini instead
 */
export async function generateStory(prompt: string, config?: GenerationConfig): Promise<string> {
  console.warn('⚠️ Using legacy generateStory function. Consider using generateStoryWithGemini directly.');
  return generateStoryWithGemini(prompt, config);
}

/**
 * Legacy compatibility function - redirects to secure proxy
 * @deprecated Use generateCharacterWithGemini instead
 */
export async function generateCharacter(prompt: string): Promise<string> {
  console.warn('⚠️ Using legacy generateCharacter function. Consider using generateCharacterWithGemini directly.');
  return generateCharacterWithGemini(prompt);
}
