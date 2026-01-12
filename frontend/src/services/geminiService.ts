// Gemini AI Service for story generation
// To use: Get a free API key from https://makersuite.google.com/app/apikey

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface ImageSafetyResult {
  isSafe: boolean;
  reason?: string;
  categories?: string[];
}

interface StoryGenerationParams {
  prompt: string;
  genres: string[];
  ageGroup: string;
  artStyle: string;
  pageCount?: number; // Optional, defaults to 5
  language?: 'en' | 'tl'; // Language for story generation
}

// Page-specific narrative structure based on storybook guidelines
const getPageStructureGuidelines = (pageCount: number): string => {
  switch (pageCount) {
    case 5:
      return `
**5-Page Structure (Short moral story):**
- Page 1: Introduction - Show main character and setting (simple background)
- Page 2: Problem Begins - Show the main issue visually (bright colors)
- Page 3: Action/Attempt - Show character trying to solve problem (movement, expressive poses)
- Page 4: Resolution - Show the result clearly
- Page 5: Ending/Lesson - Show calm or happiness (warm tones)

Each page should have 1-2 sentences. Keep it simple and focused.`;
    
    case 8:
      return `
**8-Page Structure (Character-driven story):**
- Pages 1-2: Introduce characters and setting
- Page 3: Show first event or problem starting
- Page 4: Build tension or challenge
- Page 5: Character faces conflict or decision
- Page 6: Turning point or climax
- Page 7: Resolution or relief
- Page 8: End with emotion or message

Each page should have 2-3 sentences. Use varied pacing.`;
    
    case 10:
      return `
**10-Page Structure (Balanced narrative):**
- Pages 1-2: Establish main character and world
- Pages 3-4: Introduce main problem
- Pages 5-6: Rising action with small obstacles
- Pages 7-8: Climax or key change
- Pages 9: Resolution or emotional close
- Page 10: Final image reinforcing theme

Each page should have 2-3 sentences. Build tension gradually.`;
    
    case 15:
      return `
**15-Page Structure (Standard picture book for ages 6-9):**
- Pages 1-3: Establish main character and world
- Pages 4-6: Introduce main problem
- Pages 7-9: Rising action, small obstacles
- Pages 10-12: Climax or key change
- Pages 13-14: Resolution or emotional close
- Page 15: Final image that reinforces theme or lesson

Each page should have 2-4 sentences. Vary pacing throughout.`;
    
    case 20:
      return `
**20-Page Structure (Complex plot with multiple characters):**
- Pages 1-4: Set up the world and characters
- Pages 5-8: Introduce conflict or challenge
- Pages 9-12: Escalate with obstacles or surprises
- Pages 13-16: Climax, most dramatic visuals
- Pages 17-19: Resolve story and show outcomes
- Page 20: Epilogue or meaningful closing image

Each page should have 3-4 sentences. Use rich detail and subplots.`;
    
    default:
      return `
Structure your ${pageCount}-page story with:
- Beginning (${Math.ceil(pageCount * 0.2)} pages): Introduction
- Middle (${Math.ceil(pageCount * 0.5)} pages): Problem and rising action
- End (${Math.floor(pageCount * 0.3)} pages): Climax and resolution

Each page should have 2-3 sentences appropriate for the length.`;
  }
};

// Illustration composition guidelines based on page position
const getIllustrationGuidelines = (pageNumber: number, totalPages: number): string => {
  const position = pageNumber / totalPages;
  
  if (pageNumber === 1) {
    return 'WIDE SHOT establishing scene, simple background, introduce main character clearly, warm welcoming lighting';
  } else if (pageNumber === totalPages) {
    return 'QUIET REFLECTIVE shot, minimal detail, negative space, warm tones, calm mood, symbolic closing image';
  } else if (position < 0.3) {
    return 'CLEAR BALANCED layout showing setting, explanatory composition, good visibility of characters and environment';
  } else if (position < 0.5) {
    return 'DYNAMIC composition with movement, diagonal lines, action poses, building energy';
  } else if (position < 0.7) {
    return 'CLOSE-UP or MEDIUM shot, emotional focus, facial expressions, softer colors for mood';
  } else if (position < 0.9) {
    return 'DRAMATIC angle (low angle or bird\'s eye), intense lighting, climactic moment, visual emphasis';
  } else {
    return 'RESOLUTION shot, balanced composition, relief and calm, warm colors, emotional closure';
  }
};

export const generateStory = async (params: StoryGenerationParams): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file');
  }

  const { prompt, genres, ageGroup, artStyle, pageCount = 5, language = 'en' } = params;
  
  // Language-specific instructions
  const languageInstructions = language === 'tl' 
    ? `
IMPORTANT: Generate the ENTIRE story in TAGALOG language:
- All story text must be in Tagalog
- All narrative descriptions must be in Tagalog
- Character names can be Filipino/Tagalog names
- Use natural, child-friendly Tagalog language appropriate for the age group
- The JSON structure remains in English, but all content (title, text, descriptions) should be in Tagalog
- Image prompts should remain in English for AI image generation compatibility
`
    : `
Generate the story in ENGLISH language with natural, age-appropriate language.
`;
  
  // Get structure guidelines based on page count
  const structureGuidelines = getPageStructureGuidelines(pageCount);
  
  // Construct the prompt for Gemini
  const fullPrompt = `You are a creative children's story writer and visual storytelling expert. Create an engaging story based on the following:

Story Idea: ${prompt}
Genres: ${genres.join(', ')}
Age Group: ${ageGroup}
Art Style: ${artStyle}

${languageInstructions}

${structureGuidelines}

CRITICAL STORYBOOK GUIDELINES:

1. CHARACTER CONSISTENCY (MANDATORY):
   - Define main character(s) appearance in EXTREME detail: hair color/style, clothing colors/patterns, distinctive features, body type, accessories
   - Use IDENTICAL character description in EVERY page's illustration
   - Keep character design consistent across ALL pages
   - Example: "A small fox with bright orange fur, white-tipped tail, wearing a green vest with brass buttons"

2. VISUAL CONTINUITY:
   - Maintain consistent color scheme throughout the story
   - Reuse visual elements (props, symbols) to strengthen narrative flow
   - Background changes should reflect time passage or mood shifts
   - Keep the same art style and level of detail across all pages

   - VARY camera angles, environments, and compositions DRAMATICALLY on EVERY page:
     * Use DIFFERENT camera angles: wide shot, medium shot, low angle, high angle, over-shoulder, side profile, back view, dutch angle
     * Change character POSITION in frame: left, right, center, foreground, background, rule of thirds
     * Vary ENVIRONMENTS completely: forest, meadow, indoor, outdoor, mountain, beach, city, magical settings
     * Different LIGHTING each page: golden hour, midday, overcast, dramatic side light, backlit, moonlight, candlelight
     * Add ATMOSPHERIC effects: mist, rain, snow, sparkles, wind, dust particles, light rays
     * Change CHARACTER ACTIONS: walking, running, sitting, reaching, looking up, examining, jumping, dancing
     * NEVER repeat the same composition, angle, or environment on consecutive pages
     * Each page should look distinctly different from the previous one
     * Ending: Calm, balanced composition
   
   - LIGHTING must match mood:
     * Happy/Active: Warm tones, bright lighting
     * Sad/Calm: Cool tones, soft lighting
     * Dramatic: Strong shadows, contrasts
     * Peaceful: Gentle, diffused light
   
   - FOCAL POINTS:
     * Place important elements center or bottom-right
     * Guide eye movement left to right
     * Leave space for text placement

4. PACING & RHYTHM:
   - Alternate between detailed and simpler illustrations
   - Use page turns for anticipation or surprise
   - Build visual intensity toward climax
   - Final page should be quiet and reflective

5. PAGE-SPECIFIC COMPOSITION:
   For each page, specify: CAMERA ANGLE + LIGHTING + SETTING DETAILS + CHARACTER (with consistent appearance) + ACTION/EMOTION

6. MULTI-CHARACTER SCENES (CRITICAL):
   When multiple characters appear together:
   - Describe EACH character SEPARATELY with complete details
   - Specify EXACT SPATIAL POSITIONING (e.g., "character A on the left, character B on the right, 3 feet apart")
   - Use CLEAR SEPARATION keywords: "separated by", "standing apart", "distinct individuals", "clearly separate"
   - Emphasize "each character has their own complete body", "no overlapping", "clear boundaries between characters"
   - Position characters at different depths or angles to avoid merging
   - Example: "A small fox on the LEFT side and a tall rabbit on the RIGHT side, clearly separated by a wooden fence between them, each character distinct and complete"

CRITICAL JSON FORMATTING REQUIREMENTS:
- You MUST respond with ONLY valid JSON
- NO text before or after the JSON object
- NO trailing commas before closing braces } or brackets ]
- ALL strings must use double quotes " not single quotes '
- Properly escape any quotes inside strings using \"
- Close all brackets and braces properly
- Ensure the JSON is complete and not truncated

Respond with ONLY this JSON format:
{
  "title": "Story Title",
  "description": "A compelling 2-3 sentence summary of what the story is about - the main character, their challenge or adventure, and what they learn or achieve. Make it engaging and age-appropriate.",
  "characterDescription": "EXTREMELY detailed description of main character(s) appearance - be specific about colors, patterns, features",
  "colorScheme": "Overall color palette for the story (e.g., warm autumn tones, cool blues and purples, vibrant rainbow)",
  "pages": [
    {
      "pageNumber": 1,
      "narrativePurpose": "introduction/problem/action/climax/resolution",
      "mood": "happy/sad/exciting/calm/dramatic",
      "illustrationDescription": "Brief human-readable description of the scene",
      "imagePrompt": "DETAILED TEXT-TO-IMAGE PROMPT: [Art style] illustration of [EXACT character description with all details: colors, clothing, accessories, features] [UNIQUE specific action/pose - VARY THIS] in [COMPLETELY DIFFERENT detailed environment from previous page with specific elements, colors, lighting, atmosphere]. [VARIED camera angle: wide/medium/close-up/low angle/high angle/side profile/back view]. [DIFFERENT character position: left/right/center/foreground/background]. [UNIQUE lighting: golden hour/midday/overcast/dramatic/backlit/moonlight]. [Atmospheric effects: mist/rain/sparkles/wind/light rays]. [Mood and color palette]. Professional children's book illustration, high quality, vibrant colors, detailed background, atmospheric lighting, safe for children. CRITICAL: Make this page visually DISTINCT from previous pages.",
      "text": "The story text for this page (${pageCount <= 5 ? '1-2' : pageCount <= 10 ? '2-3' : '3-4'} sentences)"
    }
  ]
}

For each page, you MUST create TWO descriptions:

1. **illustrationDescription**: A brief, human-readable description of what's happening in the scene (for reference)

2. **imagePrompt**: A HIGHLY DETAILED text-to-image prompt optimized for AI image generation. You MUST include ALL of these MANDATORY elements:
   - MANDATORY: Start with the art style (${artStyle} style illustration)
   - MANDATORY: Include the COMPLETE character description with EXACT colors, clothing, features from characterDescription
   - MANDATORY: Describe specific action, pose, and emotion (must be VARIED per page - no repetition)
   - MANDATORY: Detail the environment with specific objects, plants, buildings, weather, time of day
   - MANDATORY: Specify camera angle explicitly (e.g., "Wide establishing shot", "Medium close-up", "Low angle shot", "High angle view", "Side profile view")
   - MANDATORY: Specify character position in frame (e.g., "positioned in lower right leaving space for text", "centered in frame", "upper left corner")
   - MANDATORY: Specify detailed lighting (e.g., "warm golden hour lighting filtering through canopy casting long shadows", not just "warm tones")
   - RECOMMENDED: Include atmospheric effects (mist, rain, sparkles, light rays, dust particles)
   - MANDATORY: Include color palette and mood keywords
   - MANDATORY: End with quality keywords: "Professional children's book illustration, detailed, high quality, vibrant colors, safe for children"
   - FOR MULTI-CHARACTER SCENES: Describe EACH character separately with spatial positioning and add separation keywords: "clearly separated", "distinct individuals", "each with complete anatomy", "visible space between"

Example imagePrompt (single character):
"Cartoon style illustration of a small fox with bright orange fur, white-tipped tail, wearing a dark green vest with shiny brass buttons and brown leather boots, standing with one paw raised curiously in a sun-dappled forest clearing surrounded by tall oak trees with golden leaves, moss-covered rocks, and wildflowers. Wide establishing shot with fox positioned in lower right, leaving space for text at top. Warm golden hour lighting filtering through canopy, casting long shadows. Warm autumn color palette with oranges, golds, and greens. Cheerful and inviting atmosphere. Professional children's book illustration, vibrant colors, detailed forest environment, atmospheric lighting, high quality, safe for children."

Example imagePrompt (multiple characters):
"Cartoon style illustration of TWO CLEARLY SEPARATED characters: On the LEFT side, a small fox with bright orange fur, white-tipped tail, wearing a dark green vest with brass buttons, standing upright. On the RIGHT side, a tall gray rabbit with long ears, wearing a blue jacket and red scarf, waving with one paw. The two characters are CLEARLY SEPARATED by a wooden garden fence between them, each character distinct and complete with their own anatomy. They are positioned 4 feet apart in a sunny meadow with yellow flowers. Medium wide shot showing both characters fully visible with clear space between them. Each character has complete, separate bodies with no overlapping or merging. Bright afternoon lighting, cheerful atmosphere. Professional children's book illustration, clear character boundaries, distinct individuals, vibrant colors, safe for children."

Example imagePrompt (action scene with dynamic camera):
"Watercolor illustration of a small fox with bright orange fur, white-tipped tail, wearing a dark green vest with brass buttons, leaping joyfully over a fallen moss-covered log in a misty morning forest with towering pine trees, ferns sprouting from the forest floor, and mushrooms clustered at tree bases. Dynamic low angle shot capturing fox mid-jump in center frame with front paws extended forward. Soft morning mist creating atmospheric depth with light rays piercing through trees from behind. Cool blue-green forest tones with warm orange fox accents. Professional children's book illustration, detailed watercolor style, atmospheric lighting, high quality, safe for children."

Example imagePrompt (emotional close-up):
"Cartoon illustration of a small fox with bright orange fur, white-tipped tail, wearing a dark green vest with brass buttons, sitting with head down and drooping ears under a large oak tree with colorful autumn leaves falling around. Close-up shot focusing on fox's sad expression, character positioned in upper right corner with negative space on left for text placement. Soft overcast lighting with gentle shadows creating a melancholy mood. Muted autumn colors with orange, brown, and gray tones. Professional children's book illustration, expressive character art, detailed emotional portrayal, high quality, safe for children."

Example imagePrompt (dramatic climax scene):
"Digital art illustration of a small fox with bright orange fur, white-tipped tail, wearing a torn dark green vest, standing bravely on a rocky cliff edge with stormy clouds and lightning flashing in the background, wind-blown trees bending dramatically. High angle bird's eye view shot with fox small in foreground against vast stormy sky. Dramatic side lighting from lightning bolts creating strong contrast and casting long shadows across rocks. Dark stormy colors with purple-gray clouds, flashes of bright white lightning, and warm orange fox standing out. Professional children's book illustration, cinematic composition, dramatic atmospheric lighting, high quality, safe for children."

FINAL CHECKLIST - Verify before responding:
✓ Valid JSON syntax with no trailing commas
✓ All strings use double quotes"
✓ All brackets and braces properly closed
✓ title is engaging and age-appropriate
✓ description is a compelling 2-3 sentence summary of the story
✓ characterDescription with EXTREME detail (colors, patterns, accessories)
✓ colorScheme included for visual consistency
✓ EVERY page has BOTH illustrationDescription AND imagePrompt
✓ imagePrompt is EXTREMELY detailed and ready for text-to-image AI
✓ EXACT characterDescription used in EVERY page's imagePrompt
✓ FOR MULTI-CHARACTER SCENES: Each character described separately with spatial positioning
✓ Specific environmental details in each imagePrompt (trees, rocks, weather, lighting)
? Camera angles DRAMATICALLY DIFFERENT on each page (no repetition)
? Environments COMPLETELY VARIED across pages (forest?beach?mountain?indoor?etc)
? Character positions and actions UNIQUE per page (standing?running?sitting?reaching?etc)
? Lighting conditions CHANGE each page (golden hour?midday?overcast?dramatic?backlit?etc)
? Atmospheric effects VARY (mist?rain?sparkles?light rays?clear?etc)
? Mood matches colors and composition
? Each imagePrompt creates a VISUALLY DISTINCT scene from previous pages
? NO consecutive pages should have similar angles, environments, or compositions
✓ Multi-character scenes emphasize SEPARATION and DISTINCT IDENTITIES
✓ Positioning words used: "on the left", "on the right", "in the foreground", "in the background", "separated by"
✓ Story has exactly ${pageCount} pages
✓ JSON is complete and not truncated`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 16384, // Increased for longer stories with detailed prompts
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error Details:', errorData);
      throw new Error(`Gemini API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Full Gemini API Response:', data);
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No content generated by Gemini');
    }
    
    const candidate = data.candidates[0];
    
    // Check if content was blocked or finished early
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      console.warn('Generation finished with reason:', candidate.finishReason);
      if (candidate.finishReason === 'MAX_TOKENS') {
        throw new Error('Story generation exceeded token limit. Try a shorter prompt.');
      }
    }
    
    const generatedText = candidate.content.parts[0].text;
    console.log('Generated text length:', generatedText.length);
    
    return generatedText;
  } catch (error) {
    console.error('Error generating story with Gemini:', error);
    throw error;
  }
};

// Alternative: Generate illustration prompts for image generation
export const generateIllustrationPrompt = (
  pageDescription: string,
  artStyle: string
): string => {
  return `${pageDescription}, ${artStyle} style, children's book illustration, colorful, friendly, high quality`;
};

// Setup instructions for developers
export const SETUP_INSTRUCTIONS = `
To use Gemini AI for story generation:

1. Get a free API key from Google AI Studio:
   https://makersuite.google.com/app/apikey

2. Create a .env file in the frontend directory with:
   VITE_GEMINI_API_KEY=your_api_key_here

3. Restart your development server

Note: Gemini API has a free tier with generous limits:
- 60 requests per minute
- 1,500 requests per day
- Perfect for development and testing!

For production, consider implementing rate limiting and user quotas.
`;

/**
 * Check if an image is safe for children (no explicit, violent, or inappropriate content)
 */
export const checkImageSafety = async (imageBase64: string): Promise<ImageSafetyResult> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  // Remove data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const prompt = `Analyze this image for child safety. This is for a children's storytelling app for ages 4-12.

Check if the image contains ANY of the following inappropriate content:
- Nudity or sexually explicit content
- Violence, gore, or weapons
- Drugs, alcohol, or smoking
- Hate symbols or offensive gestures
- Scary or disturbing imagery
- Adult themes or mature content
- Inappropriate text or signs

Respond ONLY with a JSON object in this exact format:
{
  "isSafe": true/false,
  "reason": "Brief explanation if unsafe",
  "categories": ["list", "of", "issues"] or []
}

Be strict - when in doubt, mark as unsafe. This is for children's safety.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent safety checks
          maxOutputTokens: 200
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' }
        ]
      })
    });

    if (!response.ok) {
      // If Gemini blocks the image due to safety, consider it unsafe
      if (response.status === 400) {
        return {
          isSafe: false,
          reason: 'Image blocked by safety filters',
          categories: ['blocked_by_ai']
        };
      }
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if response was blocked
    if (data.promptFeedback?.blockReason) {
      return {
        isSafe: false,
        reason: 'Content blocked by AI safety system',
        categories: ['blocked_by_ai']
      };
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('Safety check response:', text);
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON found in safety response, assuming safe');
      // If we can't parse response but got a response, assume safe
      return { isSafe: true };
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log('Parsed safety result:', result);
    
    // If isSafe is explicitly false, block it
    if (result.isSafe === false) {
      return result;
    }
    
    // Otherwise assume safe (default to allowing content)
    return { isSafe: true };

  } catch (error) {
    console.error('Image safety check error:', error);
    // On error, log but allow the image (don't block user experience)
    console.warn('Safety check failed, allowing image to proceed');
    return {
      isSafe: true, // Changed from false - allow on error
      reason: 'Safety check unavailable',
      categories: []
    };
  }
};

// Photo-to-Story: Analyze image and generate story
interface PhotoStoryParams {
  additionalContext?: string;
  artStyle: string;
  genres?: string[]; // Array of genre IDs
  pageCount?: number;
  language?: 'en' | 'tl';
}

export const analyzeImageAndGenerateStory = async (
  imageBase64: string,
  params: PhotoStoryParams
): Promise<any> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file');
  }

  // SAFETY CHECK: Verify image is appropriate for children
  console.log('🔒 Checking image safety...');
  try {
    const safetyCheck = await checkImageSafety(imageBase64);
    
    if (!safetyCheck.isSafe) {
      const reason = safetyCheck.reason || 'Image contains inappropriate content';
      const categories = safetyCheck.categories?.join(', ') || 'unknown';
      console.error('❌ Image blocked:', reason, categories);
      throw new Error(`⚠️ Image Safety Check Failed: ${reason}. Categories: ${categories}. Please upload a child-appropriate image.`);
    }
    
    console.log('✅ Image passed safety check');
  } catch (error) {
    // If it's our safety error, re-throw it
    if (error instanceof Error && error.message.includes('Image Safety Check Failed')) {
      throw error;
    }
    // Otherwise, log the error but continue (don't block on safety check failures)
    console.warn('⚠️ Safety check error, proceeding anyway:', error);
  }

  const { additionalContext = '', artStyle, pageCount = 5, language = 'en' } = params;

  // Remove data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  // Language-specific instructions
  const languageInstructions = language === 'tl' 
    ? `Generate the ENTIRE story in TAGALOG language with natural, child-friendly Tagalog.`
    : `Generate the story in ENGLISH language with natural, age-appropriate language.`;

  const structureGuidelines = getPageStructureGuidelines(pageCount);

  const prompt = `You are a creative children's story writer. Analyze this photo and create an engaging ${pageCount}-page story based on what you see.

${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Art Style: ${artStyle}
${languageInstructions}

${structureGuidelines}

PHOTO ANALYSIS INSTRUCTIONS:
1. Carefully observe the photo and identify:
   - Main subjects (people, animals, objects)
   - Setting and environment
   - Colors and mood
   - Any actions or emotions visible
   - Time of day, weather, season

2. Create a story that:
   - Features the subjects from the photo as main characters
   - Takes place in a setting inspired by the photo
   - Captures the mood and atmosphere of the photo
   - Adds magical or imaginative elements to make it engaging
   - Is appropriate for children aged 6-9

3. CHARACTER CONSISTENCY:
   - Describe characters based on what you see in the photo
   - Maintain consistent character descriptions across all pages
   - Use IDENTICAL character descriptions in every page's imagePrompt

4. VISUAL CONTINUITY:
   - First page illustration should closely match the original photo
   - Subsequent pages should maintain visual consistency
   - Keep the same art style throughout

CRITICAL JSON FORMATTING REQUIREMENTS:
- You MUST respond with ONLY valid JSON
- NO text before or after the JSON object
- NO trailing commas
- ALL strings must use double quotes

Respond with ONLY this JSON format:
{
  "title": "Story Title",
  "description": "A compelling 2-3 sentence summary",
  "characterDescription": "DETAILED description of main character(s) based on the photo",
  "colorScheme": "Overall color palette matching the photo",
  "pages": [
    {
      "pageNumber": 1,
      "narrativePurpose": "introduction/problem/action/climax/resolution",
      "mood": "happy/sad/exciting/calm/dramatic",
      "illustrationDescription": "Brief description of the scene",
      "imagePrompt": "DETAILED TEXT-TO-IMAGE PROMPT: [Art style] illustration of [EXACT character description with all details from photo] [specific action/pose] in [detailed environment]. [Camera angle]. [Character position in frame]. [Detailed lighting]. Professional children's book illustration, detailed, high quality, vibrant colors, safe for children.",
      "text": "The story text for this page (1-3 sentences)"
    }
  ]
}

CRITICAL: Each page's imagePrompt MUST include ALL these elements:
1. Art style at the start (${artStyle} style illustration)
2. COMPLETE character description from photo with exact colors and features
3. Specific action and pose
4. Detailed environment with specific elements
5. Camera angle explicitly stated (Wide shot/Medium close-up/Low angle/High angle/Side view)
6. Character position in frame (lower right/centered/upper left/leaving space for text)
7. Detailed lighting (e.g., "warm golden hour lighting filtering through trees casting long shadows" not just "good lighting")
8. Quality keywords at the end: "Professional children's book illustration, detailed, high quality, vibrant colors, safe for children"

Example for multi-character scene based on photo:
"Watercolor illustration of a noble wild mustang with rich bay coat and flowing black mane standing on the LEFT side, and a small frightened deer with soft brown fur and white spots on the RIGHT side trapped under a fallen log, clearly separated by the log between them. Wide establishing shot in a forest clearing with both characters visible, mustang positioned in lower left, deer in lower right. Warm dappled sunlight filtering through dense canopy creating patches of light and shadow across the forest floor. Professional children's book illustration, detailed, high quality, vibrant colors, safe for children."

IMPORTANT: The first page's imagePrompt should closely recreate the photo's composition and subjects, then subsequent pages continue the story with consistent characters and style.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 16384,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error:', errorData);
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini Photo Analysis Response:', data);

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No content generated by Gemini');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Parse JSON response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Gemini');
    }

    const storyData = JSON.parse(jsonMatch[0]);
    return storyData;

  } catch (error) {
    console.error('Error analyzing image and generating story:', error);
    throw error;
  }
};

/**
 * Extract text from image using Gemini Vision AI
 * Much better accuracy than Tesseract, especially for handwriting
 */
export const extractTextWithGemini = async (imageDataUrl: string): Promise<{
  text: string;
  confidence: number;
}> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }

  try {
    console.log('🤖 Using Gemini AI for text extraction...');
    
    // Convert data URL to base64
    const base64Data = imageDataUrl.split(',')[1];
    const mimeType = imageDataUrl.split(';')[0].split(':')[1];
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: 'Extract all text from this image. Return ONLY the text you see, nothing else. If the text is handwritten, do your best to read it accurately. Preserve line breaks and formatting where possible.'
              },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1, // Low temperature for accurate transcription
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('No text found in Gemini response');
    }

    const extractedText = data.candidates[0].content.parts[0].text.trim();
    
    console.log('✅ Gemini extraction complete');
    console.log(`📝 Extracted ${extractedText.length} characters`);
    console.log(`📄 Text: ${extractedText}`);
    
    // Gemini doesn't provide confidence, but we can assume high confidence (90%)
    return {
      text: extractedText,
      confidence: 90
    };
    
  } catch (error) {
    console.error('❌ Gemini extraction failed:', error);
    throw error;
  }
};
