/**
 * Dynamic Image Variety System
 * Adds randomization to camera angles, compositions, and environments
 * to prevent repetitive-looking story illustrations
 */

// Camera angles with variety
const CAMERA_ANGLES = [
  'WIDE ESTABLISHING SHOT',
  'MEDIUM SHOT',
  'MEDIUM CLOSE-UP',
  'OVER-THE-SHOULDER perspective',
  'LOW ANGLE looking up at character',
  'HIGH ANGLE bird\'s eye view',
  'DUTCH ANGLE (tilted camera)',
  'SIDE PROFILE view',
  '3/4 ANGLE view',
  'BACK VIEW showing character from behind',
  'DIAGONAL COMPOSITION',
  'RULE OF THIRDS composition'
];

// Character positions in frame
const CHARACTER_POSITIONS = [
  'character positioned in lower third of frame',
  'character in upper left corner',
  'character in upper right corner',
  'character centered in frame',
  'character off-center to the left',
  'character off-center to the right',
  'character small in the distance',
  'character large in foreground',
  'character in middle ground',
  'character positioned according to rule of thirds'
];

// Environmental settings for variety
const ENVIRONMENTS = [
  'lush forest background with dappled sunlight',
  'open meadow with wildflowers',
  'mountainous landscape with distant peaks',
  'cozy indoor room with warm lighting',
  'magical garden with fantastical elements',
  'beach or waterside setting',
  'urban setting with buildings',
  'countryside with rolling hills',
  'nighttime scene with stars or moon',
  'rainy or stormy atmosphere',
  'snowy winter wonderland',
  'autumn scene with colorful leaves',
  'spring blossoms and fresh greenery',
  'desert or arid landscape',
  'mystical foggy environment'
];

// Lighting conditions
const LIGHTING_CONDITIONS = [
  'GOLDEN HOUR lighting, warm sunset glow',
  'BRIGHT MIDDAY sun, strong shadows',
  'SOFT OVERCAST lighting, even illumination',
  'DRAMATIC side lighting, strong contrast',
  'BACKLIT silhouette effect',
  'MOONLIGHT, cool blue tones',
  'CANDLELIGHT or warm interior glow',
  'DAPPLED LIGHT through trees',
  'STORMY dark clouds with rim lighting',
  'MAGICAL glowing light sources',
  'SUNRISE colors, pink and orange sky',
  'TWILIGHT, purple and blue hues'
];

// Atmospheric effects
const ATMOSPHERIC_EFFECTS = [
  'light rays piercing through atmosphere',
  'gentle mist or fog',
  'dust particles in the air',
  'falling leaves or petals',
  'rain or water droplets',
  'snowflakes falling',
  'sparkles or magical particles',
  'wind effects on environment',
  'clouds in background',
  'clear crisp air'
];

// Character actions/poses variety
const CHARACTER_ACTIONS = [
  'character walking or moving forward',
  'character running or in motion',
  'character standing and observing',
  'character sitting or resting',
  'character reaching or pointing',
  'character looking up at something',
  'character bending down examining something',
  'character with arms outstretched',
  'character in contemplative pose',
  'character jumping or leaping',
  'character dancing or twirling',
  'character climbing or ascending'
];

/**
 * Get a random element from an array, but avoid repeating the same element consecutively
 */
const getRandomVariety = (array: string[], lastUsed?: string): string => {
  if (array.length <= 1) return array[0];
  
  // Filter out the last used item to ensure variety
  const availableOptions = lastUsed 
    ? array.filter(item => item !== lastUsed)
    : array;
  
  const randomIndex = Math.floor(Math.random() * availableOptions.length);
  return availableOptions[randomIndex];
};

/**
 * Track last used values to ensure variety across pages
 */
const compositionMemory: {
  lastAngle?: string;
  lastPosition?: string;
  lastEnvironment?: string;
  lastLighting?: string;
  lastAtmosphere?: string;
  lastAction?: string;
} = {};

/**
 * Generate varied composition guidelines for each page
 * @param pageNumber Current page number
 * @param totalPages Total pages in story
 * @param mood Scene mood (optional)
 * @returns Dynamic composition string with variety
 */
export const getVariedCompositionGuidelines = (
  pageNumber: number, 
  totalPages: number, 
  mood?: string
): string => {
  const position = pageNumber / totalPages;
  
  // Special handling for first and last pages
  if (pageNumber === 1) {
    // First page: Always wide establishing shot but with varied elements
    const environment = getRandomVariety(ENVIRONMENTS);
    const lighting = getRandomVariety(LIGHTING_CONDITIONS);
    compositionMemory.lastEnvironment = environment;
    compositionMemory.lastLighting = lighting;
    
    return `WIDE ESTABLISHING SHOT, character in environment context, full scene visible, ${environment}, ${lighting}, detailed background setting, environmental storytelling`;
  }
  
  if (pageNumber === totalPages) {
    // Last page: Resolution shot but with variety
    const environment = getRandomVariety(ENVIRONMENTS, compositionMemory.lastEnvironment);
    const position = getRandomVariety(CHARACTER_POSITIONS);
    
    return `RESOLUTION SHOT, character in peaceful environment, ${environment}, ${position}, satisfying environmental closure, warm and peaceful atmosphere`;
  }
  
  // Middle pages: Full randomization for variety
  const angle = getRandomVariety(CAMERA_ANGLES, compositionMemory.lastAngle);
  const charPosition = getRandomVariety(CHARACTER_POSITIONS, compositionMemory.lastPosition);
  const environment = getRandomVariety(ENVIRONMENTS, compositionMemory.lastEnvironment);
  const lighting = getRandomVariety(LIGHTING_CONDITIONS, compositionMemory.lastLighting);
  const atmosphere = getRandomVariety(ATMOSPHERIC_EFFECTS, compositionMemory.lastAtmosphere);
  const action = getRandomVariety(CHARACTER_ACTIONS, compositionMemory.lastAction);
  
  // Update memory
  compositionMemory.lastAngle = angle;
  compositionMemory.lastPosition = charPosition;
  compositionMemory.lastEnvironment = environment;
  compositionMemory.lastLighting = lighting;
  compositionMemory.lastAtmosphere = atmosphere;
  compositionMemory.lastAction = action;
  
  // Add mood-specific modifiers
  let moodModifier = '';
  if (mood) {
    const moodLower = mood.toLowerCase();
    if (moodLower.includes('action') || moodLower.includes('exciting')) {
      moodModifier = ', DYNAMIC energy, motion blur effect, fast-paced action';
    } else if (moodLower.includes('sad') || moodLower.includes('emotional')) {
      moodModifier = ', EMOTIONAL depth, intimate framing, expressive character';
    } else if (moodLower.includes('dramatic') || moodLower.includes('tense')) {
      moodModifier = ', DRAMATIC tension, strong contrast, intense atmosphere';
    } else if (moodLower.includes('happy') || moodLower.includes('joyful')) {
      moodModifier = ', CHEERFUL vibrancy, bright colors, uplifting mood';
    } else if (moodLower.includes('mysterious') || moodLower.includes('suspense')) {
      moodModifier = ', MYSTERIOUS atmosphere, shadows and intrigue, suspenseful';
    }
  }
  
  // Vary composition based on story position for pacing
  let pacingNote = '';
  if (position < 0.3) {
    pacingNote = ', story introduction, setting the scene';
  } else if (position < 0.5) {
    pacingNote = ', rising action, building momentum';
  } else if (position < 0.7) {
    pacingNote = ', story development, character depth';
  } else if (position < 0.9) {
    pacingNote = ', approaching climax, heightened intensity';
  }
  
  return `${angle}, ${charPosition}, ${action}, ${environment}, ${lighting}, ${atmosphere}${moodModifier}${pacingNote}, character NOT looking at camera, environmental storytelling, professional composition`;
};

/**
 * Reset composition memory (call at start of new story generation)
 */
export const resetCompositionMemory = (): void => {
  compositionMemory.lastAngle = undefined;
  compositionMemory.lastPosition = undefined;
  compositionMemory.lastEnvironment = undefined;
  compositionMemory.lastLighting = undefined;
  compositionMemory.lastAtmosphere = undefined;
  compositionMemory.lastAction = undefined;
};

/**
 * Get environment-specific scene suggestions
 */
export const getEnvironmentSuggestions = (sceneDescription: string): string => {
  const desc = sceneDescription.toLowerCase();
  
  // Detect scene type and add specific environmental details
  if (desc.includes('forest') || desc.includes('woods') || desc.includes('tree')) {
    return 'dense forest environment with varied tree species, forest floor details, natural lighting through canopy';
  } else if (desc.includes('ocean') || desc.includes('sea') || desc.includes('beach')) {
    return 'coastal environment with waves, sand, seashells, marine elements, water reflections';
  } else if (desc.includes('mountain') || desc.includes('hill') || desc.includes('cliff')) {
    return 'mountainous terrain with rocky outcrops, distant peaks, varied elevation, dramatic vistas';
  } else if (desc.includes('home') || desc.includes('house') || desc.includes('room') || desc.includes('indoor')) {
    return 'detailed interior with furniture, decorations, windows, cozy lived-in details';
  } else if (desc.includes('city') || desc.includes('town') || desc.includes('street')) {
    return 'urban environment with buildings, architectural details, street elements, city atmosphere';
  } else if (desc.includes('garden') || desc.includes('flower') || desc.includes('plant')) {
    return 'lush garden setting with diverse plants, flowers, natural growth, organic shapes';
  } else if (desc.includes('cave') || desc.includes('underground')) {
    return 'cave or underground environment with rock formations, shadows, mysterious depths';
  } else if (desc.includes('sky') || desc.includes('cloud') || desc.includes('flying')) {
    return 'expansive sky environment with clouds, atmospheric perspective, aerial view';
  }
  
  // Default: generic but detailed
  return 'richly detailed environment with foreground, middle ground, and background elements, atmospheric depth';
};
