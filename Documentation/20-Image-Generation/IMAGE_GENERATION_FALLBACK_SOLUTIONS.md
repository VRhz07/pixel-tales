// Enhanced Pollinations service with multiple prompt strategies

interface EnhancedImageParams {
  prompt: string;
  artStyle: string;
  pageNumber?: number;
  totalPages?: number;
  mood?: string;
  narrativePurpose?: string;
  width?: number;
  height?: number;
}

// Extreme prompt engineering for Pollinations
const createScenePrompt = (
  description: string,
  artStyle: string,
  pageNumber?: number,
  totalPages?: number,
  mood?: string
): string => {
  // Force scene-based composition
  const sceneKeywords = [
    'SCENE ILLUSTRATION',
    'ENVIRONMENTAL STORYTELLING', 
    'CHARACTER IN ACTION',
    'DETAILED BACKGROUND',
    'WIDE SHOT',
    'FULL SCENE CONTEXT'
  ].join(', ');

  // Anti-portrait keywords
  const antiPortrait = [
    'NO PORTRAIT',
    'NO HEADSHOT', 
    'NO CLOSE-UP FACE',
    'NO CHARACTER LOOKING AT CAMERA',
    'NO CENTERED CHARACTER',
    'NO STUDIO PHOTO'
  ].join(', ');

  // Style-specific scene keywords
  const styleSceneMap: Record<string, string> = {
    cartoon: 'CARTOON SCENE ILLUSTRATION, Disney Pixar movie scene, animated environment, character in cartoon world',
    watercolor: 'WATERCOLOR SCENE PAINTING, character in watercolor environment, painted landscape scene',
    sketch: 'PENCIL SKETCH SCENE, hand-drawn environment, character sketched in scene context',
    digital: 'DIGITAL SCENE ILLUSTRATION, character in digital painted environment',
    realistic: 'PAINTED SCENE ILLUSTRATION, character in painted storybook scene',
    anime: 'ANIME SCENE ILLUSTRATION, character in anime environment, Studio Ghibli scene style'
  };

  const styleScene = styleSceneMap[artStyle] || styleSceneMap.cartoon;

  // Camera angle based on page
  let cameraAngle = 'WIDE ESTABLISHING SHOT';
  if (pageNumber && totalPages) {
    const position = pageNumber / totalPages;
    if (position < 0.3) cameraAngle = 'WIDE ENVIRONMENTAL SHOT';
    else if (position < 0.5) cameraAngle = 'DYNAMIC ACTION SCENE';
    else if (position < 0.7) cameraAngle = 'MEDIUM ENVIRONMENTAL SHOT';
    else if (position < 0.9) cameraAngle = 'DRAMATIC SCENE ANGLE';
    else cameraAngle = 'PEACEFUL WIDE SCENE';
  }

  // Environment emphasis
  const environmentKeywords = [
    'detailed environment',
    'rich background',
    'atmospheric scene',
    'environmental context',
    'scene composition',
    'landscape elements'
  ].join(', ');

  // Mood-based environment
  let moodEnvironment = 'natural lighting';
  if (mood) {
    const moodMap: Record<string, string> = {
      happy: 'bright cheerful environment, sunny atmosphere, colorful scene',
      sad: 'soft muted environment, gentle atmosphere, peaceful scene',
      exciting: 'dynamic vibrant environment, energetic atmosphere, action scene',
      dramatic: 'dramatic environment, intense atmosphere, powerful scene',
      calm: 'serene environment, tranquil atmosphere, quiet scene'
    };
    moodEnvironment = moodMap[mood.toLowerCase()] || moodEnvironment;
  }

  // Construct the prompt with extreme emphasis on scenes
  return `${sceneKeywords}. ${styleScene}. ${cameraAngle} showing: ${description}. ${environmentKeywords}, ${moodEnvironment}. Children's book scene illustration, professional storybook art, environmental storytelling, character positioned naturally in scene, NOT A PORTRAIT. ${antiPortrait}`;
};

// Generate multiple variations and pick the best
export const generateEnhancedPollinationsImage = async (params: EnhancedImageParams): Promise<string> => {
  const { prompt, artStyle, pageNumber, totalPages, mood, width = 512, height = 512 } = params;

  // Create multiple prompt variations
  const prompts = [
    // Version 1: Scene-focused
    createScenePrompt(prompt, artStyle, pageNumber, totalPages, mood),
    
    // Version 2: Environment-first
    `ENVIRONMENTAL SCENE, ${artStyle} style environment showing: ${prompt}. Character small in detailed scene, wide shot, rich background, NOT PORTRAIT`,
    
    // Version 3: Action-focused  
    `ACTION SCENE ILLUSTRATION, ${artStyle} style, character doing action: ${prompt}. Dynamic scene composition, environmental context, NOT CLOSE-UP`
  ];

  // Try each prompt variation
  for (let i = 0; i < prompts.length; i++) {
    try {
      const encodedPrompt = encodeURIComponent(prompts[i]);
      const seed = Math.floor(Math.random() * 1000000); // Random seed for variation
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}`;
      
      console.log(`Trying Pollinations prompt variation ${i + 1}:`, prompts[i].substring(0, 100) + '...');
      
      // Test if the URL is accessible
      const testResponse = await fetch(imageUrl, { method: 'HEAD' });
      if (testResponse.ok) {
        console.log(`✅ Pollinations variation ${i + 1} successful`);
        return imageUrl;
      }
    } catch (error) {
      console.warn(`Pollinations variation ${i + 1} failed:`, error);
    }
  }

  // If all variations fail, return the first one anyway
  const fallbackPrompt = prompts[0];
  const encodedPrompt = encodeURIComponent(fallbackPrompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}`;
};

// Batch generate with different seeds for variety
export const generateMultipleVariations = async (
  params: EnhancedImageParams,
  count: number = 3
): Promise<string[]> => {
  const variations: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const prompt = createScenePrompt(
      params.prompt, 
      params.artStyle, 
      params.pageNumber, 
      params.totalPages, 
      params.mood
    );
    
    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${params.width || 512}&height=${params.height || 512}&seed=${seed}`;
    
    variations.push(imageUrl);
  }
  
  return variations;
};
