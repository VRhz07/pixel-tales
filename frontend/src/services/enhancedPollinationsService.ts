// Enhanced Pollinations service with extreme scene-based prompt engineering

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

// Page-specific scenario configuration for optimal storytelling
interface PageScenario {
  sceneType: string;
  environmentFocus: string;
  cameraInstruction: string;
  compositionRules: string;
  lightingStyle: string;
  characterAction: string;
}

const getPageScenario = (pageNumber: number, totalPages: number): PageScenario => {
  const position = pageNumber / totalPages;
  
  // Page 1: Introduction/Establishing Shot
  if (pageNumber === 1) {
    return {
      sceneType: 'ESTABLISHING SCENE INTRODUCTION',
      environmentFocus: 'DETAILED WORLD BUILDING ENVIRONMENT',
      cameraInstruction: 'WIDE ESTABLISHING SHOT, character small in vast environment',
      compositionRules: 'character in lower third, environment dominates frame, rule of thirds',
      lightingStyle: 'welcoming bright natural lighting, inviting atmosphere',
      characterAction: 'character entering scene, beginning journey, looking ahead into environment'
    };
  }
  
  // Final Page: Resolution/Peaceful Ending
  if (pageNumber === totalPages) {
    return {
      sceneType: 'PEACEFUL RESOLUTION SCENE',
      environmentFocus: 'SERENE HARMONIOUS ENVIRONMENT',
      cameraInstruction: 'WIDE PEACEFUL SHOT, character content in beautiful setting',
      compositionRules: 'character small and peaceful, lots of negative space, balanced composition',
      lightingStyle: 'soft golden hour lighting, peaceful sunset/sunrise glow',
      characterAction: 'character at rest, satisfied, enjoying peaceful moment in environment'
    };
  }
  
  // Early Pages (0-30%): World Building & Setup
  if (position <= 0.3) {
    return {
      sceneType: 'WORLD EXPLORATION SCENE',
      environmentFocus: 'RICH DETAILED ENVIRONMENT FOR EXPLORATION',
      cameraInstruction: 'MEDIUM WIDE SHOT, character discovering environment',
      compositionRules: 'character off-center, interacting with environment elements',
      lightingStyle: 'clear natural lighting, good visibility for exploration',
      characterAction: 'character exploring, investigating, interacting with environment objects'
    };
  }
  
  // Rising Action (30-60%): Building Tension & Movement
  if (position <= 0.6) {
    return {
      sceneType: 'DYNAMIC ACTION SCENE',
      environmentFocus: 'ENVIRONMENT IN MOTION, DYNAMIC SETTING',
      cameraInstruction: 'DYNAMIC ANGLE SHOT, character in motion through environment',
      compositionRules: 'diagonal composition, character moving through frame, motion lines',
      lightingStyle: 'dramatic directional lighting, shadows and highlights for movement',
      characterAction: 'character running, chasing, moving with purpose through environment'
    };
  }
  
  // Climax Approach (60-85%): Emotional Peak
  if (position <= 0.85) {
    return {
      sceneType: 'EMOTIONAL DRAMATIC SCENE',
      environmentFocus: 'ENVIRONMENT REFLECTING EMOTIONAL STATE',
      cameraInstruction: 'MEDIUM DRAMATIC SHOT, character and environment in emotional harmony',
      compositionRules: 'character positioned for emotional impact, environment supports mood',
      lightingStyle: 'dramatic mood lighting, strong contrasts, emotional atmosphere',
      characterAction: 'character showing strong emotion, reacting to environment, pivotal moment'
    };
  }
  
  // Climax (85-95%): Peak Drama
  if (position <= 0.95) {
    return {
      sceneType: 'CLIMACTIC DRAMATIC SCENE',
      environmentFocus: 'DRAMATIC POWERFUL ENVIRONMENT',
      cameraInstruction: 'DRAMATIC LOW ANGLE or BIRD\'S EYE VIEW, powerful perspective',
      compositionRules: 'strong diagonal lines, character in powerful position, dramatic framing',
      lightingStyle: 'intense dramatic lighting, strong shadows, peak visual impact',
      characterAction: 'character in climactic action, overcoming challenge, moment of triumph'
    };
  }
  
  // Resolution (95-100%): Winding Down
  return {
    sceneType: 'CALMING RESOLUTION SCENE',
    environmentFocus: 'PEACEFUL SETTLING ENVIRONMENT',
    cameraInstruction: 'MEDIUM WIDE SHOT, character finding peace in environment',
    compositionRules: 'balanced composition, character centered in peaceful setting',
    lightingStyle: 'soft calming lighting, gentle shadows, relief atmosphere',
    characterAction: 'character settling down, finding resolution, peaceful interaction with environment'
  };
};

// Page-specific prompt engineering for optimal storytelling
const createScenePrompt = (
  description: string,
  artStyle: string,
  pageNumber?: number,
  totalPages?: number,
  mood?: string
): string => {
  // Get page-specific scenario settings
  const pageScenario = getPageScenario(pageNumber || 1, totalPages || 5);
  
  // Force scene-based composition with page-specific keywords
  const sceneKeywords = [
    'SCENE ILLUSTRATION',
    'ENVIRONMENTAL STORYTELLING', 
    pageScenario.sceneType,
    pageScenario.environmentFocus,
    pageScenario.cameraInstruction,
    'FULL SCENE CONTEXT',
    'STORYBOOK SCENE'
  ].join(', ');

  // Extreme anti-portrait keywords
  const antiPortrait = [
    'NO PORTRAIT',
    'NO HEADSHOT', 
    'NO CLOSE-UP FACE',
    'NO CHARACTER LOOKING AT CAMERA',
    'NO CENTERED CHARACTER',
    'NO STUDIO PHOTO',
    'NO MUGSHOT',
    'NO SELFIE',
    'NOT A PORTRAIT'
  ].join(', ');

  // Style-specific scene keywords with environmental emphasis
  const styleSceneMap: Record<string, string> = {
    cartoon: 'CARTOON SCENE ILLUSTRATION, Disney Pixar movie scene style, animated environment, character in cartoon world setting, colorful cartoon background',
    watercolor: 'WATERCOLOR SCENE PAINTING, character in watercolor environment, painted landscape scene, soft watercolor background, atmospheric painting',
    sketch: 'PENCIL SKETCH SCENE, hand-drawn environment, character sketched in scene context, detailed sketch background, artistic line work',
    digital: 'DIGITAL SCENE ILLUSTRATION, character in digital painted environment, modern digital art scene, clean digital background',
    realistic: 'PAINTED SCENE ILLUSTRATION, character in painted storybook scene, artistic painted environment, storybook painting style',
    anime: 'ANIME SCENE ILLUSTRATION, character in anime environment, Studio Ghibli scene style, detailed anime background'
  };

  const styleScene = styleSceneMap[artStyle] || styleSceneMap.cartoon;

  // Use page-specific lighting (override mood if page scenario is more specific)
  let finalLighting = pageScenario.lightingStyle;
  if (mood) {
    const moodLower = mood.toLowerCase();
    if (moodLower.includes('happy') || moodLower.includes('exciting')) {
      finalLighting += ', enhanced with bright cheerful energy';
    } else if (moodLower.includes('sad') || moodLower.includes('calm')) {
      finalLighting += ', softened with gentle melancholy';
    } else if (moodLower.includes('dramatic') || moodLower.includes('tense')) {
      finalLighting += ', intensified with dramatic tension';
    }
  }

  // Page-specific environment and composition
  const environmentAndComposition = [
    pageScenario.environmentFocus,
    pageScenario.compositionRules,
    'detailed environmental storytelling',
    'rich background context',
    'atmospheric depth'
  ].join(', ');

  // Page-specific character action and positioning
  const characterInstructions = [
    pageScenario.characterAction,
    'character not looking at camera',
    'character naturally positioned in scene',
    'character engaged with environment'
  ].join(', ');

  // Final quality and safety keywords
  const qualityKeywords = [
    'professional children\'s book illustration',
    'high quality storybook art',
    'safe for children',
    'age-appropriate content',
    'colorful friendly illustration'
  ].join(', ');

  // Construct the page-optimized prompt
  return `${sceneKeywords}. ${styleScene}. ${pageScenario.cameraInstruction} showing: ${description}. ${environmentAndComposition}. ${finalLighting}. ${characterInstructions}. ${qualityKeywords}. IMPORTANT: ${antiPortrait}`;
};

// Generate image with multiple fallback strategies
export const generateEnhancedPollinationsImage = async (params: EnhancedImageParams): Promise<string> => {
  const { prompt, artStyle, pageNumber, totalPages, mood, width = 512, height = 512 } = params;

  // Strategy 1: Ultra scene-focused prompt
  const scenePrompt = createScenePrompt(prompt, artStyle, pageNumber, totalPages, mood);
  
  // Strategy 2: Environment-first approach
  const environmentPrompt = `ENVIRONMENTAL SCENE ILLUSTRATION, ${artStyle} style. SETTING: detailed environment showing ${prompt}. Character small in scene, wide composition, rich background details, environmental storytelling. NOT A PORTRAIT, NO CLOSE-UP, character in scene context`;
  
  // Strategy 3: Action-focused approach
  const actionPrompt = `ACTION SCENE, ${artStyle} illustration. CHARACTER DOING: ${prompt}. Dynamic scene composition, character in motion, environmental action, detailed background. WIDE SHOT, NOT PORTRAIT, scene-based illustration`;

  // Strategy 4: Storybook scene approach
  const storybookPrompt = `CHILDREN'S BOOK SCENE, ${artStyle} style storybook illustration. SCENE: ${prompt}. Professional children's book art, environmental storytelling, character in storybook scene, detailed background. NO PORTRAIT, SCENE ILLUSTRATION`;

  const prompts = [scenePrompt, environmentPrompt, actionPrompt, storybookPrompt];

  // Try each strategy with different seeds
  for (let i = 0; i < prompts.length; i++) {
    try {
      const encodedPrompt = encodeURIComponent(prompts[i]);
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&enhance=true`;
      
      console.log(`🎨 Trying enhanced Pollinations strategy ${i + 1}:`, prompts[i].substring(0, 80) + '...');
      
      return imageUrl;
    } catch (error) {
      console.warn(`Strategy ${i + 1} failed:`, error);
    }
  }

  // Ultimate fallback with the most scene-focused prompt
  const ultimatePrompt = `WIDE SCENE ILLUSTRATION, ${artStyle} children's book scene. ENVIRONMENT: ${prompt}. Character in detailed environment, NOT PORTRAIT, scene composition, environmental storytelling`;
  const encodedPrompt = encodeURIComponent(ultimatePrompt);
  const seed = Date.now(); // Use timestamp as seed
  
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&enhance=true`;
};

// Generate multiple variations for user to choose from
export const generateImageVariations = async (
  params: EnhancedImageParams,
  count: number = 3
): Promise<string[]> => {
  const variations: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const basePrompt = createScenePrompt(
      params.prompt, 
      params.artStyle, 
      params.pageNumber, 
      params.totalPages, 
      params.mood
    );
    
    // Add variation keywords
    const variationKeywords = [
      'composition variation A',
      'composition variation B', 
      'composition variation C'
    ];
    
    const variedPrompt = `${basePrompt}. ${variationKeywords[i] || 'unique composition'}`;
    const encodedPrompt = encodeURIComponent(variedPrompt);
    const seed = Math.floor(Math.random() * 1000000) + i * 1000;
    
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${params.width || 512}&height=${params.height || 512}&seed=${seed}&enhance=true`;
    variations.push(imageUrl);
  }
  
  return variations;
};

// Test function to verify the service works
export const testEnhancedPollinations = async (): Promise<boolean> => {
  try {
    const testUrl = await generateEnhancedPollinationsImage({
      prompt: 'a cat sitting in a garden',
      artStyle: 'cartoon'
    });
    
    console.log('Test image URL:', testUrl);
    return true;
  } catch (error) {
    console.error('Enhanced Pollinations test failed:', error);
    return false;
  }
};
