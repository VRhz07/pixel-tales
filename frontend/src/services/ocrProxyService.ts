/**
 * Secure OCR Service - Proxy through Backend
 * API keys are kept secure on the backend server
 * This replaces direct frontend calls to OCR APIs
 */

import { API_BASE_URL } from '../config/constants';

interface OCRResult {
  text: string;
  success: boolean;
}

/**
 * Process image with OCR (via backend proxy)
 * Uses Gemini Vision API on the backend
 */
export async function processImageWithOCR(
  imageData: string,
  detectHandwriting: boolean = false
): Promise<OCRResult> {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${API_BASE_URL}/ai/ocr/process/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        image: imageData,
        detectHandwriting,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `OCR processing failed: ${response.statusText}`);
    }

    const result: OCRResult = await response.json();
    return result;
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw error;
  }
}

/**
 * Extract text from image file
 */
export async function extractTextFromImage(
  file: File,
  detectHandwriting: boolean = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const imageData = e.target?.result as string;
        const result = await processImageWithOCR(imageData, detectHandwriting);
        
        if (result.success && result.text) {
          resolve(result.text);
        } else {
          reject(new Error('No text extracted from image'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Check if OCR service is available
 */
export async function isOCRAvailable(): Promise<boolean> {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/ai/status/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const status = await response.json();
    return status.ocr_available || false;
  } catch (error) {
    console.error('Failed to check OCR availability:', error);
    return false;
  }
}
