// Image Generation Service using Pollinations.ai with backend proxy for API key authentication
import { apiConfigService } from './apiConfig.service';
import apiService from './api';
import { getVariedCompositionGuidelines, resetCompositionMemory, getEnvironmentSuggestions } from './imageVariety';
// Alternative: Can be switched to Hugging Face or other services

/**
 * Wait for Pollinations to actually generate the image
 * Polls the URL to check if image is ready (not a placeholder)
 */
const waitForImageGeneration = async (
  imageUrl: string, 
  pageNumber: number,
  onProgress?: (current: number, total: number, message: string) => void,
  totalPages?: number
): Promise<boolean> => {
  const maxAttempts = 60; // Try for up to 60 seconds (60 attempts x 1 second)
  const delayMs = 1000; // Check every 1 second
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Update progress
      if (onProgress && totalPages) {
        const progressMessage = `Waiting for page ${pageNumber} image (${attempt}/${maxAttempts})...`;
        onProgress(pageNumber, totalPages, progressMessage);
      }
      
      // Fetch the image to check size
      const response = await fetch(imageUrl, { cache: 'no-cache' });
      if (!response.ok) {
        console.log(`⏳ Page ${pageNumber}: Attempt ${attempt}/${maxAttempts} - Not ready yet (${response.status})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      
      const blob = await response.blob();
      const sizeKB = blob.size / 1024;
      
      console.log(`📊 Page ${pageNumber}: Attempt ${attempt}/${maxAttempts} - Image size: ${sizeKB.toFixed(1)}KB`);
      
      // Pollinations placeholders are LARGE (1-2MB), real images are smaller (50-100KB)
      // Accept images that are reasonably sized (< 500KB)
      if (sizeKB < 500 && sizeKB > 10) {
        console.log(`✅ Page ${pageNumber}: Real image ready! Size: ${sizeKB.toFixed(1)}KB (attempt ${attempt}/${maxAttempts})`);
        return true;
      }
      
      console.log(`⏳ Page ${pageNumber}: Large placeholder detected (${sizeKB.toFixed(1)}KB), waiting...`);
      
    } catch (error) {
      console.log(`⏳ Page ${pageNumber}: Attempt ${attempt}/${maxAttempts} - Error checking image:`, error);
    }
    
    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  console.warn(`⚠️ Page ${pageNumber}: Timeout after ${maxAttempts} attempts - image may not be ready`);
  return false;
};

export interface ImageGenerationParams {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  pageNumber?: number;
  totalPages?: number;
  mood?: string;
  narrativePurpose?: string;
}

// Enhanced composition guidelines with dynamic camera work and environments
const getCompositionGuidelines = (pageNumber: number, totalPages: number, mood?: string): string => {
  const position = pageNumber / totalPages;
  let composition = '';
  
  // Dynamic camera angles and character positioning based on page position
  if (pageNumber === 1) {
    composition = 'WIDE ESTABLISHING SHOT, character in environment context, full scene visible, character positioned in lower third of frame, detailed background setting, environmental storytelling';
  } else if (pageNumber === totalPages) {
    composition = 'PEACEFUL WIDE SHOT, character in serene environment, lots of negative space, character small in frame, beautiful landscape background, resolution atmosphere';
  } else if (position < 0.3) {
    composition = 'MEDIUM WIDE SHOT, character interacting with environment, 3/4 view angle, character not looking at camera, environmental details visible, action in context';
  } else if (position < 0.5) {
    composition = 'DYNAMIC ACTION SHOT, character in motion, diagonal composition, side profile or back view, environment blurred with movement, character positioned off-center';
  } else if (position < 0.7) {
    composition = 'MEDIUM SHOT with environment, character showing emotion, profile or 3/4 angle, environmental mood matching character emotion, background supporting the story';
  } else if (position < 0.9) {
    composition = 'DRAMATIC CAMERA ANGLE (low angle or bird\'s eye view), character in powerful pose, environmental drama, strong perspective, character not facing camera directly';
  } else {
    composition = 'RESOLUTION WIDE SHOT, character in peaceful environment, environmental harmony, character positioned naturally in scene, satisfying environmental closure';
  }
  
  // Add mood-based lighting and environmental atmosphere
  if (mood) {
    const moodLower = mood.toLowerCase();
    if (moodLower.includes('happy') || moodLower.includes('exciting')) {
      composition += ', BRIGHT ENVIRONMENTAL LIGHTING, vibrant colorful environment, cheerful atmosphere, warm sunlight';
    } else if (moodLower.includes('sad') || moodLower.includes('calm')) {
      composition += ', SOFT ENVIRONMENTAL LIGHTING, muted environment colors, peaceful atmosphere, gentle ambient light';
    } else if (moodLower.includes('dramatic') || moodLower.includes('tense')) {
      composition += ', DRAMATIC ENVIRONMENTAL LIGHTING, contrasting environment, intense atmosphere, strong directional light';
    } else {
      composition += ', NATURAL ENVIRONMENTAL LIGHTING, balanced atmosphere, realistic environment lighting';
    }
  }
  
  return composition;
};

// Color tone recommendations based on mood
const getMoodColorTones = (mood?: string): string => {
  if (!mood) return 'balanced natural colors';
  
  const moodLower = mood.toLowerCase();
  if (moodLower.includes('happy') || moodLower.includes('joyful')) {
    return 'warm tones, bright yellows and oranges';
  } else if (moodLower.includes('sad') || moodLower.includes('melancholy')) {
    return 'cool tones, blues and grays';
  } else if (moodLower.includes('exciting') || moodLower.includes('action')) {
    return 'vibrant saturated colors, high energy';
  } else if (moodLower.includes('calm') || moodLower.includes('peaceful')) {
    return 'soft pastels, gentle colors';
  } else if (moodLower.includes('dramatic') || moodLower.includes('tense')) {
    return 'high contrast, deep shadows';
  } else if (moodLower.includes('mysterious')) {
    return 'dark purples and blues, atmospheric';
  }
  return 'balanced natural colors';
}

/**
 * Check if Pollinations AI service is healthy and operational via backend proxy
 * Since we use backend proxy with Flux model (no rate limits), we always return true
 * The backend will handle any actual service issues
 * @returns true (always, since backend proxy handles availability)
 */
export const checkPollinationsHealth = async (): Promise<boolean> => {
  // IMPORTANT: We no longer check direct Pollinations URL because:
  // 1. Direct URLs are blocked (403 Forbidden) - we must use backend proxy
  // 2. Backend proxy uses SDXL Turbo model with API key
  // 3. Backend will handle any actual service issues gracefully
  
  console.log('✅ Using backend proxy with SDXL Turbo model (API key credits)');
  
  // Always return true - let backend handle any issues
  // This prevents false negatives from direct URL checks
  return true;
};

/**
 * Generate an image using Replicate API (Free credits available)
 * @param params Image generation parameters
 * @returns URL of the generated image or null if generation fails
 */
export const generateImageWithReplicate = async (params: ImageGenerationParams): Promise<string | null> => {
  const { prompt, width = 1024, height = 1024, seed } = params;
  
  try {
    console.log('🎨 Generating image with Replicate (FLUX model)...');
    const response = await apiService.post('/ai/replicate/generate-image/', {
      prompt: prompt,
      width,
      height,
      model: 'flux-schnell', // Fast and free model
      seed: seed || Math.floor(Math.random() * 1000000),
    });

    if (!response) {
      console.error('❌ Backend returned invalid response (no data)');
      return null;
    }

    if (response.success && response.imageUrl) {
      console.log('✅ Image generated via Replicate backend proxy');
      console.log('🔗 Image URL:', response.imageUrl);
      return response.imageUrl;
    } else {
      console.error('❌ Backend returned unsuccessful response:', response);
      return null;
    }
  } catch (error: any) {
    console.error('❌ Replicate image generation failed:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
};

/**
 * Generate an image using Pollinations.ai (Free service, no API key required)
 * @param params Image generation parameters
 * @returns URL of the generated image or null if service is down
 */
export const generateImage = async (params: ImageGenerationParams): Promise<string | null> => {
  const { prompt, width = 512, height = 512, seed } = params;
  
  try {
    console.log('🎨 Generating image with Pollinations (Flux Schnell model)...');
    const response = await apiService.post('/ai/pollinations/generate-image/', {
      prompt: prompt,
      width,
      height,
      model: 'flux-schnell', // Flux Schnell model (fast and free)
      seed: seed || Math.floor(Math.random() * 1000000),
      nologo: true,
      enhance: true
    });

    if (!response) {
      console.error('❌ Backend returned invalid response (no data)');
      return null;
    }

    if (response.success && response.imageUrl) {
      console.log('✅ Image URL generated via Pollinations backend proxy');
      
      // If URL is relative (starts with /api/), prepend the API base URL
      let finalUrl = response.imageUrl;
      if (finalUrl.startsWith('/api/')) {
        const apiBaseUrl = apiConfigService.getApiUrl();
        // Remove /api suffix from base URL if present, then add the full path
        const baseWithoutApi = apiBaseUrl.replace(/\/api\/?$/, '');
        finalUrl = baseWithoutApi + finalUrl;
      }
      
      console.log('🔗 Full Image URL:', finalUrl);
      return finalUrl;
    } else {
      console.error('❌ Backend returned unsuccessful response:', response);
      return null;
    }
  } catch (error: any) {
    console.error('❌ Pollinations image generation failed:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
};

/**
 * Generate a child-friendly illustration prompt from a description
 * @param description The illustration description from the story
 * @param artStyle The art style (cartoon, watercolor, etc.)
 * @param characterDescription Consistent character appearance description
 * @param pageNumber Current page number
 * @param totalPages Total number of pages in story
 * @param mood The mood/emotion of the scene
 * @param narrativePurpose The narrative purpose (introduction, problem, climax, etc.)
 * @returns Enhanced prompt for image generation
 */
export const createIllustrationPrompt = (
  description: string, 
  artStyle: string,
  characterDescription?: string,
  pageNumber?: number,
  totalPages?: number,
  mood?: string,
  narrativePurpose?: string
): string => {
  // ENHANCED style prompts with anatomy quality emphasis and environmental focus
  const stylePrompts: Record<string, string> = {
    cartoon: 'CARTOON ILLUSTRATION STYLE, CORRECT ANATOMY, proper proportions, well-drawn hands and feet, accurate limb count, flat colors, bold outlines, simple shapes, cute characters, Disney Pixar style, animated movie look, vector art, detailed cartoon environments, NO REALISM, child-friendly cartoon, environmental storytelling, professional character design',
    watercolor: 'WATERCOLOR PAINTING, CORRECT ANATOMY, proper proportions, well-drawn hands, accurate body structure, soft edges, paint bleeding, paper texture visible, artistic brushstrokes, pastel colors, traditional watercolor medium, NOT DIGITAL, hand-painted look, children\'s book watercolor, atmospheric environments, professional illustration quality',
    digital: 'DIGITAL PAINTING, CORRECT ANATOMY, proper proportions, well-drawn limbs, accurate character design, clean vector lines, flat color blocks, modern graphic design, Adobe Illustrator style, smooth gradients, polished digital art, children\'s book digital illustration, detailed digital environments, professional quality',
    sketch: 'PENCIL SKETCH DRAWING, CORRECT ANATOMY, proper proportions, well-drawn hands and feet, hand-drawn lines, graphite texture, sketch marks visible, rough pencil strokes, black and white or light shading, NOT REALISTIC, artistic sketch style, children\'s book sketch illustration, environmental sketching, professional sketch quality',
    realistic: 'SEMI-REALISTIC PAINTING, CORRECT ANATOMY, proper proportions, well-drawn body parts, painterly style, soft brush strokes, storybook illustration quality, warm colors, NOT PHOTOGRAPHIC, artistic painting, children\'s book painted illustration, painted environments, professional painting quality',
    anime: 'ANIME MANGA STYLE, CORRECT ANATOMY, proper proportions, well-drawn hands, big expressive eyes, Japanese animation style, cel-shaded, bold outlines, vibrant anime colors, Studio Ghibli inspired, child-appropriate anime illustration, detailed anime backgrounds, professional anime quality'
  };
  
  const styleText = stylePrompts[artStyle] || stylePrompts.cartoon;
  
  // Include character description for consistency if provided
  const characterText = characterDescription ? `Character: ${characterDescription}. ` : '';
  
  // Add composition guidelines based on page position
  let compositionText = '';
  if (pageNumber && totalPages) {
    compositionText = getVariedCompositionGuidelines(pageNumber, totalPages, mood) + '. ';
  }
  
  // Add color tone based on mood
  const colorTones = getMoodColorTones(mood);
  
  // Add narrative purpose context
  let purposeText = '';
  if (narrativePurpose) {
    const purposeMap: Record<string, string> = {
      'introduction': 'welcoming and inviting atmosphere',
      'problem': 'building tension, visual conflict',
      'action': 'dynamic movement, energy',
      'climax': 'dramatic peak moment, intense',
      'resolution': 'relief and closure, peaceful'
    };
    purposeText = purposeMap[narrativePurpose.toLowerCase()] || '';
    if (purposeText) purposeText = purposeText + '. ';
  }
  
  // COMPREHENSIVE negative prompts targeting anatomy issues and quality problems
  const negativePrompts = [
    // Anatomy issues - CRITICAL
    'extra limbs', 'extra arms', 'extra legs', 'extra fingers', 'extra hands', 'extra feet',
    'missing limbs', 'missing arms', 'missing legs', 'missing fingers', 'missing hands',
    'deformed hands', 'deformed fingers', 'mutated hands', 'poorly drawn hands', 'fused fingers',
    'deformed anatomy', 'bad anatomy', 'wrong anatomy', 'distorted body', 'twisted limbs',
    'broken limbs', 'disconnected limbs', 'floating limbs', 'duplicate limbs',
    'malformed body', 'disfigured', 'mutation', 'mutilated', 'gross proportions',
    'long neck', 'elongated body', 'disproportionate', 'asymmetric body',
    // Face/head issues
    'deformed face', 'ugly face', 'bad face', 'poorly drawn face', 'cloned face',
    'extra eyes', 'missing eyes', 'deformed eyes', 'cross-eyed', 'fused eyes',
    'extra heads', 'two heads', 'multiple heads', 'floating head',
    // MULTI-CHARACTER ISSUES - CRITICAL FOR PREVENTING MERGING
    'merged characters', 'fused characters', 'characters melting together', 'blended bodies',
    'conjoined characters', 'overlapping bodies', 'characters sharing limbs', 'merged faces',
    'characters connected', 'fused bodies', 'body parts merging', 'characters touching inappropriately',
    'unclear character boundaries', 'ambiguous character separation', 'morphed characters',
    'characters blending into each other', 'shared anatomy between characters', 'hybrid characters',
    'characters with mixed features', 'indistinct character separation', 'confused character identity',
    // Realism issues
    'photorealistic', 'realistic photo', 'photograph', 'camera shot', '3d render',
    'close-up portrait', 'headshot', 'mugshot', 'passport photo', 'selfie',
    'character looking at camera', 'character staring at viewer', 'direct eye contact',
    // Composition issues
    'cropped image', 'zoomed in face', 'tight framing', 'no environment',
    'plain background', 'white background', 'studio lighting', 'professional photography',
    'realistic skin texture', 'photographic lighting', 'depth of field blur',
    'bokeh effect', 'lens flare', 'camera artifacts', 'digital noise',
    // Quality issues
    'low quality', 'worst quality', 'blurry', 'jpeg artifacts', 'watermark',
    'signature', 'text', 'username', 'error', 'lowres', 'bad quality',
    'poorly drawn', 'amateur', 'sketch', 'unfinished', 'messy'
  ].join(', ');
  
  // Detect if multiple characters are mentioned in the description
  const hasMultipleCharacters = /\b(and|with|two|three|multiple|both|together|group|friends|family|characters)\b/i.test(description);
  
  // Add multi-character specific instructions if needed
  let multiCharacterGuidelines = '';
  if (hasMultipleCharacters) {
    multiCharacterGuidelines = ' MULTI-CHARACTER SCENE REQUIREMENTS: Each character must be CLEARLY SEPARATED with visible space between them. Each character has DISTINCT and COMPLETE anatomy (their own 2 arms, 2 legs, 1 head, separate bodies). Characters positioned with CLEAR BOUNDARIES - no overlapping bodies, no shared limbs, no merged anatomy. Each character maintains INDIVIDUAL IDENTITY with distinct features, clothing, and colors. Spatial separation between characters (at least arm\'s length apart). Characters can interact but bodies remain COMPLETELY SEPARATE. Clear visual distinction between each character. NO body parts merging or blending between characters.';
  }
  
  // Place style at the beginning and end for emphasis, with STRONG anatomy quality focus
  return `${styleText}, ${characterText}${compositionText}Scene: ${description}. ${purposeText}Color palette: ${colorTones}. CRITICAL QUALITY REQUIREMENTS: correct anatomy, proper proportions, accurate limb count (2 arms, 2 legs), well-drawn hands with correct finger count, well-drawn feet, symmetrical body structure, no deformities, professional character design.${multiCharacterGuidelines} Environmental storytelling, character positioned naturally in scene, dynamic camera work, detailed background environment, atmospheric perspective. IMPORTANT: ${styleText}. Professional children's book illustration following storybook composition rules, focal point placement for text space (top or sides), consistent character design, atmospheric lighting matching mood, rich environmental details, masterpiece quality, best quality, high resolution, safe for children, no text or words in image. NEGATIVE PROMPTS TO AVOID: ${negativePrompts}`;
};

/**
 * Batch generate images for multiple pages with consistent character appearance
 * @param pages Array of page data with illustration descriptions, mood, and narrative purpose
 * @param artStyle The art style to use
 * @param characterDescription Consistent character appearance description
 * @param colorScheme Overall color scheme for the story
 * @returns Array of image URLs
 */
export const generateStoryIllustrations = async (
  pages: Array<{ 
    illustrationDescription: string;
    mood?: string;
    narrativePurpose?: string;
  }>,
  artStyle: string,
  characterDescription?: string,
  colorScheme?: string
): Promise<string[]> => {
  const totalPages = pages.length;
  const results: (string | null)[] = [];
  
  // Process pages sequentially to avoid Replicate rate limits
  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];
    
    if (!page.illustrationDescription) {
      results.push(null);
      continue;
    }
    
    try {
      const pageNumber = index + 1;
      
      // Use character description for consistency across all pages
      // Include page position, mood, and narrative purpose for better composition
      let enhancedDescription = page.illustrationDescription;
      
      // Add color scheme context if provided
      if (colorScheme && !enhancedDescription.toLowerCase().includes('color')) {
        enhancedDescription += `. Overall story color palette: ${colorScheme}`;
      }
      
      const enhancedPrompt = createIllustrationPrompt(
        enhancedDescription,
        artStyle,
        characterDescription,
        pageNumber,
        totalPages,
        page.mood,
        page.narrativePurpose
      );
      
      // Use similar seeds for consistency but with slight variation
      const baseSeed = characterDescription ? characterDescription.length * 100 : 1000;
      
      console.log(`🖼️ Page ${pageNumber}/${totalPages}: Starting image generation...`);
      
      // Try Replicate first, fallback to Pollinations
      let imageUrl = await generateImageWithReplicate({
        prompt: enhancedPrompt,
        width: 1024,
        height: 1024,
        seed: baseSeed + (index * 10), // Small increments for consistency
        pageNumber,
        totalPages,
        mood: page.mood,
        narrativePurpose: page.narrativePurpose
      });
      
      // Fallback to Pollinations if Replicate fails
      // TEMPORARILY DISABLED: Pollinations is making generation slower
      /*
      if (!imageUrl) {
        console.log(`⚠️ Page ${pageNumber}: Replicate failed, falling back to Pollinations...`);
        imageUrl = await generateImage({
          prompt: enhancedPrompt,
          width: 512,
          height: 512,
          seed: baseSeed + (index * 10),
          pageNumber,
          totalPages,
          mood: page.mood,
          narrativePurpose: page.narrativePurpose
        });
      }
      */
      
      if (!imageUrl) {
        console.warn(`⚠️ Page ${pageNumber}: Replicate failed, skipping fallback for now`);
      }
      
      results.push(imageUrl);
      
      // Delay between pages to avoid Replicate rate limits (6 req/min = 10 sec between)
      if (index < pages.length - 1) {
        console.log(`⏳ Waiting 12 seconds before next image to avoid rate limit...`);
        await new Promise(resolve => setTimeout(resolve, 12000)); // 12 second pause
      }
      
    } catch (error) {
      console.error(`❌ Page ${index + 1}: Error during generation:`, error);
      results.push(null);
    }
  }
  
  console.log(`🎉 Image generation complete! ${results.filter(r => r !== null).length}/${totalPages} images ready`);
  return results.filter(url => url !== null) as string[];
};

/**
 * NEW: Generate images using detailed prompts directly from Gemini AI
 * This function uses the pre-generated imagePrompt from Gemini without additional enhancement
 * @param pages Array of page data with Gemini-generated imagePrompts
 * @param characterDescription Consistent character appearance description (for seed generation)
 * @returns Array of image URLs
 */
/**
 * Convert an image URL to a data URL for persistence
 * This avoids rate limits on subsequent fetches from Pollinations
 */
const convertImageToDataUrl = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Failed to get canvas context');
          resolve(null);
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (error) {
        console.error('Error converting image to data URL:', error);
        resolve(null);
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load image for data URL conversion');
      resolve(null);
    };
    
    img.src = url;
  });
};

/**
 * Wait for an image URL to be fully loaded/rendered AND verify it's not a placeholder
 * Pollinations generates images asynchronously, so we need to wait
 * Also checks file size to ensure it's not the "rate limit" placeholder
 */
const waitForImageToLoad = (url: string, maxRetries = 10, delayMs = 3000): Promise<void> => {
  return new Promise((resolve, reject) => {
    let retries = 0;
    
    const checkImage = async () => {
      try {
        // Fetch the image to check its size
        const response = await fetch(url);
        const blob = await response.blob();
        const sizeKB = blob.size / 1024;
        
        console.log(`📏 Image size: ${sizeKB.toFixed(1)}KB`);
        
        // Rate limit placeholder is typically small (< 100KB)
        // Real generated images are larger (> 500KB)
        if (sizeKB < 100) {
          retries++;
          if (retries >= maxRetries) {
            console.warn(`⚠️ Image still showing placeholder after ${maxRetries} retries (${sizeKB.toFixed(1)}KB), continuing anyway...`);
            resolve();
          } else {
            console.log(`⏳ Image is placeholder (${sizeKB.toFixed(1)}KB), retrying in ${delayMs}ms... (attempt ${retries}/${maxRetries})`);
            setTimeout(checkImage, delayMs);
          }
        } else {
          console.log(`✅ Real image loaded successfully (${sizeKB.toFixed(1)}KB) after ${retries + 1} attempts`);
          resolve();
        }
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          console.warn(`⚠️ Failed to check image after ${maxRetries} retries, continuing anyway...`);
          resolve();
        } else {
          console.log(`⏳ Error checking image, retrying in ${delayMs}ms... (attempt ${retries}/${maxRetries})`);
          setTimeout(checkImage, delayMs);
        }
      }
    };
    
    checkImage();
  });
};

/**
 * Wait for Pollinations to actually generate an image (can take 2-3 minutes!)
 * Checks if the image is a real generated image vs placeholder
 */
const waitForPollinationsImage = async (
  url: string, 
  pageNumber: number,
  maxRetries: number = 40, // 40 retries = ~3.3 minutes with 5s delay
  delayMs: number = 5000    // 5 seconds between retries
): Promise<boolean> => {
  console.log(`⏳ Page ${pageNumber}: Waiting for Pollinations to generate image...`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Fetch the image to check if it's ready
      // Use GET instead of HEAD since backend doesn't support HEAD
      const response = await fetch(url, { 
        method: 'GET',
        cache: 'no-cache' // Don't cache placeholder images
      });
      
      if (response.ok) {
        // Get the actual blob size (more accurate than content-length header)
        const blob = await response.blob();
        const sizeKB = blob.size / 1024;
        
        // Real images are typically > 200KB
        // Placeholders/errors are usually < 100KB
        if (sizeKB > 200) {
          console.log(`✅ Page ${pageNumber}: Image ready! (${sizeKB.toFixed(1)}KB) after ${attempt} attempts`);
          return true;
        } else {
          console.log(`⏳ Page ${pageNumber}: Still generating... (${sizeKB.toFixed(1)}KB) [Attempt ${attempt}/${maxRetries}]`);
        }
      }
    } catch (error) {
      console.log(`⏳ Page ${pageNumber}: Checking... [Attempt ${attempt}/${maxRetries}]`);
    }
    
    // Wait before next retry
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.warn(`⚠️ Page ${pageNumber}: Image not ready after ${maxRetries} attempts (~${(maxRetries * delayMs / 60000).toFixed(1)} minutes)`);
  return false;
};

export const generateStoryIllustrationsFromPrompts = async (
  pages: Array<{ 
    imagePrompt?: string;
    text?: string;
    pageNumber?: number;
  }>,
  characterDescription?: string,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<(string | null)[]> => {
  console.log('🎨 generateStoryIllustrationsFromPrompts called with:', {
    pageCount: pages.length,
    characterDescription: characterDescription?.substring(0, 50) + '...',
    pagesStructure: pages.map((p, i) => ({
      index: i,
      hasImagePrompt: !!p.imagePrompt,
      hasText: !!p.text,
      imagePromptPreview: p.imagePrompt?.substring(0, 80) + '...',
      keys: Object.keys(p)
    }))
  });
  
  const results: (string | null)[] = [];
  
  // Process pages sequentially to avoid overwhelming Pollinations
  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];
    
    if (!page.imagePrompt) {
      console.error(`❌ Page ${index + 1} missing imagePrompt field!`);
      console.error(`   Available keys:`, Object.keys(page));
      results.push(null);
      continue;
    }
    
    try {
      console.log(`🖼️ Page ${index + 1}/${pages.length}: Starting image generation...`);
      if (onProgress) {
        onProgress(index + 1, pages.length, `Generating image for page ${index + 1}...`);
      }
      
      // Generate unique seed
      const uniqueSeed = Date.now() + (index * 10000);
      
      // Try Replicate first, fallback to Pollinations
      let imageUrl = await generateImageWithReplicate({
        prompt: page.imagePrompt,
        width: 1024,
        height: 1024,
        seed: uniqueSeed,
        pageNumber: page.pageNumber || (index + 1),
        totalPages: pages.length
      });
      
      // Fallback to Pollinations if Replicate fails
      // TEMPORARILY DISABLED: Pollinations is making generation slower
      /*
      if (!imageUrl) {
        console.log(`⚠️ Page ${index + 1}: Replicate failed, falling back to Pollinations...`);
        imageUrl = await generateImage({
          prompt: page.imagePrompt,
          width: 512,
          height: 512,
          seed: uniqueSeed,
          pageNumber: page.pageNumber || (index + 1),
          totalPages: pages.length
        });
      }
      */
      
      if (!imageUrl) {
        console.error(`❌ Page ${index + 1}: Replicate failed, no fallback enabled`);
        results.push(null);
        continue;
      }
      
      console.log(`📝 Page ${index + 1}: URL received: ${imageUrl.substring(0, 100)}...`);
      
      // Poll the URL to wait for real image (not placeholder)
      console.log(`⏳ Page ${index + 1}: Waiting for real image to be generated...`);
      
      const isImageReady = await waitForImageGeneration(imageUrl, index + 1, onProgress, pages.length);
      
      if (!isImageReady) {
        console.warn(`⚠️ Page ${index + 1}: Image generation timed out after 60 seconds`);
        console.warn(`⚠️ Saving URL anyway - image may still be generating in background`);
      } else {
        console.log(`✅ Page ${index + 1}: Real image verified and ready!`);
      }
      
      results.push(imageUrl);
      
      // Delay between pages to avoid Replicate rate limits (6 req/min = 10 sec between)
      if (index < pages.length - 1) {
        console.log(`? Waiting 12 seconds before next image to avoid rate limit...`);
        await new Promise(resolve => setTimeout(resolve, 12000)); // 12 second pause
      }
      
    } catch (error) {
      console.error(`❌ Page ${index + 1}: Error during generation:`, error);
      results.push(null);
    }
  }
  
  console.log(`🎉 Image generation complete! ${results.filter(r => r !== null).length}/${pages.length} images ready`);
  return results;
};

/**
 * Generate a cover illustration for the story
 * @param storyTitle The title of the story
 * @param storyDescription Brief description or theme of the story
 * @param artStyle The art style to use
 * @param characterDescription Consistent character appearance description
 * @param colorScheme Overall color scheme for the story
 * @returns Cover image URL
 */
/**
 * Add title text overlay to a cover image
 * @param baseImageUrl The base cover illustration URL
 * @param title The story title to overlay
 * @returns Base64 image with title overlay
 */
export const addTitleOverlayToCover = async (
  baseImageUrl: string,
  title: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.warn('❌ Canvas context not available, using base image');
      resolve(baseImageUrl); // Fallback to original image
      return;
    }
    
    const img = new Image();
    // CRITICAL: Use anonymous crossOrigin for CORS
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log('✅ Cover image loaded successfully, adding title overlay...');
      
      // Calculate space needed for title (roughly 15% of image height)
      const titleAreaHeight = Math.floor(img.height * 0.15);
      
      // Set canvas size to be taller to accommodate title at top
      canvas.width = img.width;
      canvas.height = img.height + titleAreaHeight;
      
      // Fill title area with gradient background
      const titleGradient = ctx.createLinearGradient(0, 0, 0, titleAreaHeight);
      titleGradient.addColorStop(0, '#667eea');
      titleGradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = titleGradient;
      ctx.fillRect(0, 0, canvas.width, titleAreaHeight);
      
      // Draw the base image BELOW the title area
      ctx.drawImage(img, 0, titleAreaHeight);
      
      // Configure text styling - playful and bold
      const baseFontSize = Math.floor(canvas.width / 14);
      const maxWidth = canvas.width * 0.9; // 90% of canvas width for padding
      
      // Function to wrap text into lines
      const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
        ctx.font = `bold ${fontSize}px "Comic Sans MS", "Chalkboard SE", "Arial Rounded MT Bold", cursive, sans-serif`;
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
          const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
          const testWidth = ctx.measureText(testLine).width;
          
          if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = words[i];
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          lines.push(currentLine);
        }
        return lines;
      };
      
      // Try wrapping with base font size first
      let fontSize = baseFontSize;
      let lines = wrapText(title, maxWidth, fontSize);
      
      // If we have too many lines (more than 2 for title area), reduce font size
      while (lines.length > 2 && fontSize > 24) {
        fontSize -= 3;
        lines = wrapText(title, maxWidth, fontSize);
      }
      
      // Set final font
      ctx.font = `bold ${fontSize}px "Comic Sans MS", "Chalkboard SE", "Arial Rounded MT Bold", cursive, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add text shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Calculate starting Y position - center text in title area
      const lineHeight = fontSize * 1.2;
      const totalTextHeight = lines.length * lineHeight;
      let titleY = (titleAreaHeight - totalTextHeight) / 2 + lineHeight / 2;
      
      // Draw each line
      lines.forEach((line, index) => {
        const y = titleY + (index * lineHeight);
        
        // Stroke (outline) - white with thicker border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = fontSize / 8;
        ctx.strokeText(line, canvas.width / 2, y);
        
        // Fill (main text) - purple gradient
        const textGradient = ctx.createLinearGradient(0, y - fontSize/2, 0, y + fontSize/2);
        textGradient.addColorStop(0, '#FCD34D');
        textGradient.addColorStop(1, '#F59E0B');
        ctx.fillStyle = textGradient;
        ctx.fillText(line, canvas.width / 2, y);
      });
      
      // Note: No subtitle here - this is used by Photo Story which adds "A Photo Story"
      // AI Story doesn't use this function's title overlay
      
      // Convert canvas to base64
      const coverImageWithText = canvas.toDataURL('image/png', 0.95);
      console.log('✅ Cover with title overlay created successfully');
      resolve(coverImageWithText);
    };
    
    img.onerror = (error) => {
      console.error('❌ Failed to load image for title overlay:', error);
      console.error('Image URL that failed:', baseImageUrl);
      console.warn('⚠️ CORS issue detected - returning original image URL');
      
      // Return the original image URL without title overlay
      // The image will load naturally in the UI like any other image
      // No gradient fallback - just let the image load on its own
      resolve(baseImageUrl);
    };
    
    // Add timeout to prevent infinite waiting
    // If canvas loading times out, just return the original URL
    // The image will load naturally in the UI
    const timeoutId = setTimeout(() => {
      if (!img.complete) {
        console.warn('⚠️ Canvas title overlay timeout - returning original image URL');
        console.log('Image will load naturally in the UI without title overlay');
        clearTimeout(timeoutId);
        resolve(baseImageUrl); // Return original URL, let it load naturally
      }
    }, 10000); // 10 second timeout for canvas operations only
    
    // Try to load image with cache-busting for title overlay
    // If this fails (CORS), img.onerror will return the original URL
    const cacheBustUrl = baseImageUrl + (baseImageUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
    img.src = cacheBustUrl;
  });
};

export const generateCoverIllustration = async (
  storyTitle: string,
  storyDescription: string,
  artStyle: string,
  characterDescription?: string,
  colorScheme?: string
): Promise<string | null> => {
  // Cover-specific style prompts with anatomy quality emphasis
  const stylePrompts: Record<string, string> = {
    cartoon: 'CARTOON BOOK COVER ILLUSTRATION, CORRECT ANATOMY, proper proportions, well-drawn hands and feet, professional children\'s book cover art, flat colors, bold outlines, cute characters, Disney Pixar poster style, eye-catching composition, vector art, title-ready layout, masterpiece quality',
    watercolor: 'WATERCOLOR BOOK COVER ART, CORRECT ANATOMY, proper proportions, well-drawn limbs, soft edges, artistic brushstrokes, pastel colors, traditional watercolor medium, hand-painted children\'s book cover, beautiful atmospheric art, professional quality',
    digital: 'DIGITAL BOOK COVER ART, CORRECT ANATOMY, proper proportions, accurate character design, clean lines, modern graphic design, polished digital illustration, professional children\'s book cover, vibrant and inviting, high quality',
    sketch: 'PENCIL SKETCH BOOK COVER, CORRECT ANATOMY, proper proportions, well-drawn hands, hand-drawn artistic cover, sketch illustration style, children\'s book cover art, charming sketch aesthetic, professional quality',
    realistic: 'SEMI-REALISTIC BOOK COVER PAINTING, CORRECT ANATOMY, proper proportions, well-drawn body parts, painterly cover art, storybook illustration quality, professional children\'s book cover, warm inviting colors, masterpiece quality',
    anime: 'ANIME MANGA BOOK COVER, CORRECT ANATOMY, proper proportions, well-drawn hands, big expressive eyes, Japanese animation poster style, vibrant anime colors, Studio Ghibli inspired cover art, eye-catching anime illustration, professional quality'
  };

  const styleText = stylePrompts[artStyle] || stylePrompts.cartoon;
  
  // Create cover-specific prompt with character and story description
  const characterText = characterDescription ? `Main character: ${characterDescription}. ` : '';
  const colorText = colorScheme ? `Color palette: ${colorScheme}. ` : '';
  
  // IMPORTANT: Include story description prominently so cover relates to story
  const storyContext = `Story is about: ${storyDescription}. `;
  
  // Cover composition - use variety system for dynamic covers
  const coverComposition = getVariedCompositionGuidelines(1, 1, 'inviting') + ', BOOK COVER COMPOSITION showing the main story setting and atmosphere, main character visible doing something related to the story, inviting composition perfect for a children\'s book cover, balanced layout, environmental elements that reflect the story theme, NO TEXT, NO TITLE, NO WORDS on the cover';
  
  // Enhanced cover prompt with comprehensive anatomy quality requirements
  const coverNegativePrompts = [
    'extra limbs', 'extra arms', 'extra legs', 'extra fingers', 'deformed hands', 'bad anatomy',
    'missing limbs', 'poorly drawn hands', 'mutated hands', 'fused fingers', 'distorted body',
    'photorealistic', 'realistic photo', 'photograph', 'plain background', 'boring composition',
    'generic stock image', 'low quality', 'worst quality', 'blurry', 'deformed', 'disfigured',
    'mutation', 'gross proportions', 'malformed', 'ugly', 'bad quality', 'text', 'words', 'title'
  ].join(', ');
  
  const coverPrompt = `${styleText}, ${storyContext}${characterText}${colorText}${coverComposition}. COVER MUST VISUALLY REPRESENT THE STORY: ${storyDescription}. The illustration should clearly show elements from the story description. CRITICAL QUALITY: correct anatomy, proper proportions, accurate limb count, well-drawn hands and feet, symmetrical body, professional character design. Professional children's book cover illustration that captures the essence of the story, eye-catching design, inviting atmosphere. NO TEXT, NO TITLE, NO WORDS - illustration only`;
  
  // Use consistent seed based on title for reproducibility
  const titleSeed = storyTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Try Replicate first for higher quality cover
  let baseImageUrl = await generateImageWithReplicate({
    prompt: coverPrompt,
    width: 1024,
    height: 1365, // 3:4 ratio for book covers (1024 * 1.333)
    seed: titleSeed * 100
  });
  
  // Fallback to Pollinations if Replicate fails
  if (!baseImageUrl) {
    console.log('⚠️ Replicate failed for cover, falling back to Pollinations...');
    baseImageUrl = await generateImage({
      prompt: coverPrompt,
      width: 512,
      height: 683, // Slightly taller aspect ratio for book covers (3:4 ratio)
      seed: titleSeed * 100
    });
  }
  
  if (!baseImageUrl) {
    console.error('❌ Failed to generate base cover illustration');
    return null;
  }
  
  console.log('✅ Cover illustration generated');
  
  // Return the base image URL directly (no title overlay)
  // Let the browser load it naturally like page images
  return baseImageUrl;
};

// Alternative: Hugging Face API (requires free API key)
// Get key from: https://huggingface.co/settings/tokens
export const generateImageHuggingFace = async (
  prompt: string,
  apiKey: string
): Promise<Blob> => {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt }),
    }
  );

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.statusText}`);
  }

  return await response.blob();
};


