/**
 * OCR Service - Text Extraction from Images
 * Supports multiple OCR engines:
 * 1. Tesseract.js (default, free, offline)
 * 2. OCR.space API (free tier, no credit card required)
 * 3. Google Cloud Vision (requires API key and billing)
 */

import { createWorker, Worker, PSM } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
  lines: Array<{
    text: string;
    confidence: number;
    words: string[];
  }>;
}

export interface OCRProgress {
  status: string;
  progress: number;
}

class OCRService {
  private worker: Worker | null = null;
  private isInitialized = false;

  /**
   * Preprocess image to improve OCR accuracy - optimized for handwriting
   */
  private async preprocessImage(imageSource: string, isHandwritten: boolean = false): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(imageSource);
          return;
        }

        // Scale intelligently - don't make it too large (causes timeout)
        // Target size: 2000px max for handwriting (fast preprocessing), 1500px for print
        const targetSize = isHandwritten ? 2000 : 1500;
        let scale;
        const maxDimension = Math.max(img.width, img.height);
        
        if (maxDimension < targetSize) {
          // Upscale small images
          scale = targetSize / maxDimension;
        } else {
          // Downscale large images to target size (prevents timeout)
          scale = targetSize / maxDimension;
        }
        
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        
        console.log(`📐 Original: ${img.width}x${img.height}, Scaled: ${canvas.width}x${canvas.height} (${scale.toFixed(2)}x)`);

        // Draw image with smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        if (isHandwritten) {
          // Enhanced preprocessing for handwriting - OPTIMIZED VERSION
          console.log('🎨 Applying handwriting-optimized preprocessing...');
          
          // Step 1: Convert to grayscale
          for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }

          // Step 2: Fast Otsu's method for optimal threshold
          console.log(`⚡ Building histogram for ${canvas.width}x${canvas.height} image...`);
          
          let histogram = new Array(256).fill(0);
          const totalPixels = canvas.width * canvas.height;
          
          // Build histogram - single pass
          for (let i = 0; i < data.length; i += 4) {
            histogram[data[i]]++;
          }
          
          console.log('⚡ Calculating optimal threshold...');
          
          // Calculate total sum
          let sum = 0;
          for (let i = 0; i < 256; i++) {
            sum += i * histogram[i];
          }
          
          // Find optimal threshold using Otsu's method
          let sumB = 0;
          let wB = 0;
          let wF = 0;
          let maxVariance = 0;
          let threshold = 0;
          
          for (let t = 0; t < 256; t++) {
            wB += histogram[t];
            if (wB === 0) continue;
            
            wF = totalPixels - wB;
            if (wF === 0) break;
            
            sumB += t * histogram[t];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            const variance = wB * wF * (mB - mF) * (mB - mF);
            
            if (variance > maxVariance) {
              maxVariance = variance;
              threshold = t;
            }
          }
          
          // Apply threshold - slightly lower for handwriting (darker)
          threshold = Math.max(0, threshold - 20);
          console.log(`📊 Calculated threshold: ${threshold}`);
          
          for (let i = 0; i < data.length; i += 4) {
            const value = data[i] < threshold ? 0 : 255;
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
          }
          
          // Count black vs white pixels to verify we have text
          let blackPixels = 0;
          let whitePixels = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] < 128) blackPixels++;
            else whitePixels++;
          }
          const blackRatio = blackPixels / (blackPixels + whitePixels);
          console.log(`📊 Black pixels: ${blackPixels} (${(blackRatio * 100).toFixed(1)}%)`);
          console.log(`📊 White pixels: ${whitePixels} (${((1 - blackRatio) * 100).toFixed(1)}%)`);
          
          // If almost all white or all black, threshold may be wrong
          if (blackRatio < 0.01) {
            console.warn('⚠️ Warning: Very few black pixels detected. Image may be too light.');
          } else if (blackRatio > 0.5) {
            console.warn('⚠️ Warning: Too many black pixels. Image may be too dark or threshold too high.');
          }
          
          console.log('✅ Handwriting preprocessing complete');
        } else {
          // Standard preprocessing for printed text
          for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            
            // Strong contrast to make text stand out
            const contrast = 2.0;
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            let adjusted = factor * (gray - 128) + 128;
            
            // Apply adaptive threshold
            if (adjusted < 140) {
              adjusted = Math.max(0, adjusted - 40); // Darken text
            } else {
              adjusted = Math.min(255, adjusted + 40); // Lighten background
            }
            
            data[i] = adjusted;
            data[i + 1] = adjusted;
            data[i + 2] = adjusted;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const processedDataUrl = canvas.toDataURL('image/png');
        
        // Log preprocessed image for debugging (you can view this in console)
        console.log('🖼️ Preprocessed image (right-click to open in new tab):', processedDataUrl.substring(0, 100) + '...');
        console.log('💡 To view preprocessed image: copy the data URL from console and paste in browser address bar');
        
        // Optional: Download preprocessed image for inspection
        if (typeof window !== 'undefined' && (window as any).__OCR_DEBUG_MODE__) {
          const link = document.createElement('a');
          link.download = `ocr-preprocessed-${Date.now()}.png`;
          link.href = processedDataUrl;
          link.click();
          console.log('💾 Preprocessed image downloaded for debugging');
        }
        
        resolve(processedDataUrl);
      };

      img.onerror = () => {
        console.warn('Failed to preprocess image, using original');
        resolve(imageSource);
      };

      img.src = imageSource;
    });
  }

  /**
   * Initialize the OCR worker with optional handwriting support
   */
  async initialize(onProgress?: (progress: OCRProgress) => void, isHandwritten: boolean = false): Promise<void> {
    if (this.isInitialized && this.worker) {
      return;
    }

    try {
      console.log('🔤 Initializing OCR worker...');
      
      // Create worker with v6 API - pass language directly
      this.worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (onProgress) {
            onProgress({
              status: m.status,
              progress: m.progress || 0
            });
          }
          console.log('OCR:', m.status, m.progress ? `${Math.round(m.progress * 100)}%` : '');
        }
      });

      // Configure Tesseract parameters optimized for handwriting or print
      if (isHandwritten) {
        await this.worker.setParameters({
          tessedit_pageseg_mode: PSM.AUTO, // Auto detect layout - better for handwriting
          preserve_interword_spaces: '1',
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?-\'\"', // Common handwriting characters
          // Handwriting-specific parameters
          textord_heavy_nr: '1', // Enable heavy noise removal
          segment_penalty_dict_nonword: '0.5', // Allow non-dictionary words (common in handwriting)
          language_model_penalty_non_freq_dict_word: '0.5',
          language_model_penalty_non_dict_word: '0.5',
        });
      } else {
        await this.worker.setParameters({
          tessedit_pageseg_mode: PSM.AUTO, // Auto detect for better multi-line support
          preserve_interword_spaces: '1',
        });
      }

      this.isInitialized = true;
      console.log(`✅ OCR worker initialized (${isHandwritten ? 'handwriting' : 'print'} mode)`);
    } catch (error) {
      console.error('❌ Failed to initialize OCR worker:', error);
      throw new Error('Failed to initialize OCR service');
    }
  }

  /**
   * Extract text from an image
   * @param imageSource - Image URL, File, or base64 string
   * @param language - Language code (default: 'eng')
   * @param isHandwritten - Whether the text is handwritten (enables optimizations)
   * @returns OCR result with extracted text and metadata
   */
  async extractText(
    imageSource: string | File,
    language: string = 'eng',
    onProgress?: (progress: OCRProgress) => void,
    isHandwritten: boolean = false
  ): Promise<OCRResult> {
    try {
      // Initialize worker if not already done
      if (!this.isInitialized) {
        await this.initialize(onProgress, isHandwritten);
      }

      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }

      console.log(`🔍 Starting text extraction (${isHandwritten ? 'handwriting' : 'print'} mode)...`);
      
      // Preprocess image if it's a base64 string
      let processedImage = imageSource;
      if (typeof imageSource === 'string' && imageSource.startsWith('data:image')) {
        console.log('🎨 Preprocessing image for better OCR...');
        if (onProgress) {
          onProgress({ status: 'preprocessing image', progress: 0.1 });
        }
        
        const startTime = Date.now();
        processedImage = await this.preprocessImage(imageSource, isHandwritten);
        const preprocessTime = Date.now() - startTime;
        
        console.log(`✅ Preprocessing completed in ${preprocessTime}ms`);
        if (onProgress) {
          onProgress({ status: 'preprocessing complete', progress: 0.2 });
        }
      }
      
      // Perform OCR - note that recognize() doesn't emit progress events itself
      // Progress only happens during initialization
      console.log('📸 Starting recognition...');
      if (onProgress) {
        onProgress({ status: 'recognizing text', progress: 0 });
      }
      
      const result = await this.worker.recognize(processedImage);
      
      // Recognition complete
      if (onProgress) {
        onProgress({ status: 'recognition complete', progress: 1 });
      }
      
      console.log('✅ Text extraction complete');
      console.log(`📝 Raw extracted text (${result.data.text.length} chars):`, result.data.text);
      console.log(`🎯 Confidence: ${Math.round(result.data.confidence)}%`);

      // Clean up the text - remove excessive whitespace but keep content
      const cleanedText = result.data.text
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
        .trim();

      console.log(`📝 Cleaned text (${cleanedText.length} chars):`, cleanedText);

      // Format the result
      const ocrResult: OCRResult = {
        text: cleanedText,
        confidence: result.data.confidence,
        words: (result.data as any).words?.map((word: any) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox
        })) || [],
        lines: (result.data as any).lines?.map((line: any) => ({
          text: line.text,
          confidence: line.confidence,
          words: line.words?.map((w: any) => w.text) || []
        })) || []
      };

      return ocrResult;
    } catch (error) {
      console.error('❌ OCR extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Extract text with multiple language support
   */
  async extractTextMultiLanguage(
    imageSource: string | File,
    languages: string[] = ['eng'],
    onProgress?: (progress: OCRProgress) => void,
    isHandwritten: boolean = false
  ): Promise<OCRResult> {
    try {
      // Terminate existing worker
      if (this.worker) {
        await this.worker.terminate();
        this.isInitialized = false;
      }

      // Create worker with multiple languages
      const langString = languages.join('+');
      console.log(`🌐 Initializing OCR with languages: ${langString}`);

      this.worker = await createWorker(langString, 1, {
        logger: (m) => {
          if (onProgress) {
            onProgress({
              status: m.status,
              progress: m.progress || 0
            });
          }
        }
      });

      // Configure Tesseract parameters optimized for handwriting or print
      if (isHandwritten) {
        await this.worker.setParameters({
          tessedit_pageseg_mode: PSM.AUTO,
          preserve_interword_spaces: '1',
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?-\'\"',
          textord_heavy_nr: '1',
          segment_penalty_dict_nonword: '0.5',
          language_model_penalty_non_freq_dict_word: '0.5',
          language_model_penalty_non_dict_word: '0.5',
        });
      } else {
        await this.worker.setParameters({
          tessedit_pageseg_mode: PSM.AUTO,
          preserve_interword_spaces: '1',
        });
      }

      this.isInitialized = true;

      return await this.extractText(imageSource, langString, onProgress, isHandwritten);
    } catch (error) {
      console.error('❌ Multi-language OCR failed:', error);
      throw new Error('Failed to extract text with multiple languages');
    }
  }

  /**
   * Clean up and terminate the worker
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      console.log('🛑 Terminating OCR worker...');
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      console.log('✅ OCR worker terminated');
    }
  }

  /**
   * Check if text extraction is likely to be successful
   * Returns a quick analysis of the image
   */
  async quickAnalyze(imageSource: string | File): Promise<{
    hasText: boolean;
    estimatedTextAmount: 'none' | 'low' | 'medium' | 'high';
    recommendation: string;
  }> {
    try {
      // Do a quick OCR pass
      const result = await this.extractText(imageSource);
      
      const textLength = result.text.length;
      const wordCount = result.words.length;
      const avgConfidence = result.confidence;

      let hasText = textLength > 10;
      let estimatedTextAmount: 'none' | 'low' | 'medium' | 'high' = 'none';
      let recommendation = '';

      if (textLength === 0) {
        estimatedTextAmount = 'none';
        recommendation = 'No text detected. Try using "Generate Story" mode instead.';
      } else if (textLength < 50) {
        estimatedTextAmount = 'low';
        recommendation = 'Small amount of text detected. This will be used as context for story generation.';
      } else if (textLength < 200) {
        estimatedTextAmount = 'medium';
        recommendation = 'Good amount of text detected. This will enhance your story!';
      } else {
        estimatedTextAmount = 'high';
        recommendation = 'Lots of text detected! Perfect for creating a detailed story.';
      }

      if (avgConfidence < 50) {
        recommendation += ' Note: Text quality is low, results may vary.';
      }

      return {
        hasText,
        estimatedTextAmount,
        recommendation
      };
    } catch (error) {
      return {
        hasText: false,
        estimatedTextAmount: 'none',
        recommendation: 'Could not analyze image. Please try a clearer photo.'
      };
    }
  }
}

// Export singleton instance
export const ocrService = new OCRService();

/**
 * OCR.space API - Free alternative OCR service
 * Free tier: 25,000 requests/month, no credit card required
 * Get your free API key at: https://ocr.space/ocrapi
 */
export const extractTextWithOCRSpace = async (
  imageSource: string | File,
  apiKey: string = 'K87899142388957', // Free public API key (limited)
  language: string = 'eng',
  isHandwritten: boolean = false
): Promise<OCRResult> => {
  try {
    console.log('🌐 Using OCR.space API for text extraction...');
    
    // Convert File to base64 if needed
    let imageData: string;
    if (typeof imageSource === 'string') {
      imageData = imageSource;
    } else {
      imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageSource);
      });
    }
    
    // Prepare form data
    const formData = new FormData();
    formData.append('apikey', apiKey);
    formData.append('base64Image', imageData);
    formData.append('language', language);
    formData.append('isOverlayRequired', 'true'); // Get word positions
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true'); // Auto-scale for better accuracy
    formData.append('OCREngine', isHandwritten ? '2' : '1'); // Engine 2 better for handwriting
    
    // Make API request
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`OCR.space API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage?.[0] || 'OCR.space processing failed');
    }
    
    // Extract text from response
    const parsedText = result.ParsedResults?.[0];
    if (!parsedText) {
      throw new Error('No text detected by OCR.space');
    }
    
    const extractedText = parsedText.ParsedText || '';
    const confidence = parsedText.FileParseExitCode === 1 ? 85 : 50; // Estimate confidence
    
    console.log('✅ OCR.space extraction complete');
    console.log(`📝 Extracted text (${extractedText.length} chars):`, extractedText);
    
    // Parse word-level data if available
    const words: OCRResult['words'] = [];
    if (parsedText.TextOverlay?.Lines) {
      for (const line of parsedText.TextOverlay.Lines) {
        for (const word of line.Words || []) {
          words.push({
            text: word.WordText,
            confidence: confidence,
            bbox: {
              x0: word.Left,
              y0: word.Top,
              x1: word.Left + word.Width,
              y1: word.Top + word.Height
            }
          });
        }
      }
    }
    
    // Parse line-level data
    const lines: OCRResult['lines'] = [];
    if (parsedText.TextOverlay?.Lines) {
      for (const line of parsedText.TextOverlay.Lines) {
        lines.push({
          text: line.LineText,
          confidence: confidence,
          words: line.Words?.map((w: any) => w.WordText) || []
        });
      }
    }
    
    return {
      text: extractedText.trim(),
      confidence: confidence,
      words: words,
      lines: lines
    };
    
  } catch (error) {
    console.error('❌ OCR.space extraction failed:', error);
    throw error;
  }
};

/**
 * Hybrid OCR: Try Tesseract first, fallback to Gemini AI if confidence is low
 * This gives the best of both worlds - speed of Tesseract with accuracy of AI
 */
export const extractTextHybrid = async (
  imageSource: string | File,
  onProgress?: (progress: OCRProgress) => void,
  isHandwritten: boolean = false,
  confidenceThreshold: number = 60
): Promise<OCRResult> => {
  try {
    // Try Tesseract first
    console.log('🔄 Trying Tesseract OCR first...');
    const tesseractResult = await ocrService.extractText(imageSource, 'eng', onProgress, isHandwritten);
    
    console.log(`📊 Tesseract confidence: ${tesseractResult.confidence}%`);
    
    // If confidence is good or no text found, return Tesseract result
    if (tesseractResult.confidence >= confidenceThreshold || !tesseractResult.text) {
      console.log('✅ Using Tesseract result (good confidence)');
      return tesseractResult;
    }
    
    // Low confidence - try Gemini AI as fallback
    console.log(`⚠️ Low confidence (${tesseractResult.confidence}%). Trying Gemini AI...`);
    
    // Import Gemini service dynamically
    const { extractTextWithGemini } = await import('./geminiService');
    
    // Convert File to data URL if needed
    let imageDataUrl: string;
    if (typeof imageSource === 'string') {
      imageDataUrl = imageSource;
    } else {
      // Convert File to data URL
      imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageSource);
      });
    }
    
    if (onProgress) {
      onProgress({ status: 'using AI fallback', progress: 0.5 });
    }
    
    const geminiResult = await extractTextWithGemini(imageDataUrl);
    
    console.log('✅ Using Gemini AI result (better accuracy for handwriting)');
    
    // Return in OCRResult format
    return {
      text: geminiResult.text,
      confidence: geminiResult.confidence,
      words: [],
      lines: []
    };
    
  } catch (error) {
    console.error('❌ Hybrid OCR failed:', error);
    throw error;
  }
};

// Export helper functions
export const extractTextFromImage = (
  imageSource: string | File,
  onProgress?: (progress: OCRProgress) => void,
  isHandwritten: boolean = false
) => ocrService.extractText(imageSource, 'eng', onProgress, isHandwritten);

export const extractTextMultiLanguage = (
  imageSource: string | File,
  languages: string[],
  onProgress?: (progress: OCRProgress) => void,
  isHandwritten: boolean = false
) => ocrService.extractTextMultiLanguage(imageSource, languages, onProgress, isHandwritten);

export const terminateOCR = () => ocrService.terminate();
