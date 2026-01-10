/**
 * Image Caching Utilities for Offline Storage
 * Converts HTTP URLs to data URLs for offline access
 */

/**
 * Convert an image URL to a base64 data URL
 * @param url - The image URL (HTTP or data URL)
 * @returns Promise<string> - The data URL or original URL if conversion fails
 */
export async function convertImageToDataUrl(url: string): Promise<string> {
  // Already a data URL - return as-is
  if (!url || url.startsWith('data:')) {
    return url;
  }

  // Not an HTTP URL - return as-is
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }

  try {
    console.log('🔄 Converting image to data URL:', url.substring(0, 50) + '...');
    
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
    
    // Convert blob to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        console.log('✅ Image converted to data URL, size:', Math.round(dataUrl.length / 1024), 'KB');
        resolve(dataUrl);
      };
      reader.onerror = () => {
        console.error('❌ FileReader error');
        reject(new Error('Failed to read blob'));
      };
      reader.readAsDataURL(blob);
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
