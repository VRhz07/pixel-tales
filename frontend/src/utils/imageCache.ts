/**
 * Image Caching Utilities for Offline Storage
 * Converts HTTP URLs to data URLs for offline access
 */

/**
 * Convert an image URL to a base64 data URL
 * @param url - The image URL (HTTP or data URL)
 * @returns Promise<string> - The data URL or original URL if conversion fails
 */
export async function convertImageToDataUrl(url: string, maxWidth = 800, quality = 0.8): Promise<string> {
  // Already a data URL - return as-is
  if (!url || url.startsWith('data:')) {
    return url;
  }

  // Not an HTTP URL - return as-is
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }

  try {
    console.log('🔄 Converting and compressing image:', url.substring(0, 50) + '...');
    
    // Fetch the image
    const response = await fetch(url, {
      mode: 'cors',
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Convert to blob
    const blob = await response.blob();
    
    // Create image element to compress
    const img = new Image();
    const imgUrl = URL.createObjectURL(blob);
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        URL.revokeObjectURL(imgUrl);
        
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Create canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to compressed data URL (JPEG for smaller size)
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        const originalSize = Math.round(blob.size / 1024);
        const compressedSize = Math.round(dataUrl.length / 1024);
        const savings = Math.round((1 - compressedSize / originalSize) * 100);
        
        console.log(`✅ Image compressed: ${originalSize}KB → ${compressedSize}KB (${savings}% smaller)`);
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(imgUrl);
        reject(new Error('Failed to load image'));
      };
      
      img.src = imgUrl;
    });
  } catch (error) {
    console.warn('⚠️ Failed to convert image to data URL:', error);
    // Return original URL if conversion fails
    return url;
  }
}

/**
 * Convert all images in a story to data URLs for offline storage
 * @param story - The story object with potential HTTP image URLs
 * @returns Promise<Story> - Story with all images converted to data URLs
 */
export async function convertStoryImagesToDataUrls(story: any): Promise<any> {
  console.log('🖼️ Converting story images for offline storage:', story.title);
  
  const convertedStory = { ...story };
  let totalConverted = 0;
  let totalFailed = 0;

  // Convert cover image
  if (convertedStory.coverImage) {
    try {
      const originalUrl = convertedStory.coverImage;
      convertedStory.coverImage = await convertImageToDataUrl(originalUrl);
      
      if (convertedStory.coverImage !== originalUrl && !originalUrl.startsWith('data:')) {
        totalConverted++;
        console.log('  ✅ Cover image converted');
      }
    } catch (error) {
      console.error('  ❌ Failed to convert cover image:', error);
      totalFailed++;
    }
  }

  // Convert page images
  if (convertedStory.pages && Array.isArray(convertedStory.pages)) {
    for (let i = 0; i < convertedStory.pages.length; i++) {
      const page = convertedStory.pages[i];
      
      if (page.canvasData) {
        try {
          const originalUrl = page.canvasData;
          page.canvasData = await convertImageToDataUrl(originalUrl);
          
          if (page.canvasData !== originalUrl && !originalUrl.startsWith('data:')) {
            totalConverted++;
            console.log(`  ✅ Page ${i + 1} image converted`);
          }
        } catch (error) {
          console.error(`  ❌ Failed to convert page ${i + 1} image:`, error);
          totalFailed++;
        }
      }
    }
  }

  console.log(`📊 Image conversion complete: ${totalConverted} converted, ${totalFailed} failed`);
  
  return convertedStory;
}

/**
 * Check if an image URL is accessible (for testing)
 * @param url - The image URL to check
 * @returns Promise<boolean> - True if accessible
 */
export async function isImageAccessible(url: string): Promise<boolean> {
  if (!url || url.startsWith('data:')) {
    return true; // Data URLs are always accessible
  }

  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'cors' });
    return response.ok;
  } catch (error) {
    return false;
  }
}
