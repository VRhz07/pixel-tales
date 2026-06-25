// Groq AI Service for story text generation
// Strategy: Groq ONLY generates story text (not imagePrompts).
// ImagePrompts are built client-side from page text — keeps tokens tiny.
// Model: llama-3.3-70b-versatile (current production model on Groq)

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Current Groq production model

export interface GroqGenerationConfig {
  temperature?: number;
  maxTokens?: number;
}


/**
 * Auto-build an imagePrompt for a page without calling any AI.
 * Generate a story using Groq AI (llama-3.3-70b-versatile).
 *
 * IMPORTANT: We ask Groq for ONLY story text (title, description,
 * characterDescription, colorScheme, pages[].text).
 * imagePrompts are built client-side by buildImagePromptFromText().
 * This keeps the entire request under ~1,500 tokens — well within
 * the 6,000 TPM free-tier limit.
 *
 * @param storyIdea    The user's story idea
 * @param options      Genre, artStyle, pageCount, language
 * @param config       Optional generation config
 * @returns Parsed story data object (same shape as Gemini output)
 */
export async function generateStoryWithGroq(
  storyIdea: string,
  options: {
    genres: string[];
    artStyle: string;
    pageCount: number;
    language: 'en' | 'tl';
  },
  config: GroqGenerationConfig = {}
): Promise<{
  title: string;
  description: string;
  characterDescription: string;
  colorScheme: string;
  pages: Array<{ text: string; imagePrompt: string }>;
}> {
  if (!GROQ_API_KEY) {
    throw new Error(
      'Groq API key not configured. Please add VITE_GROQ_API_KEY to your .env file.'
    );
  }

  const { temperature = 0.85, maxTokens = 2048 } = config;
  const { genres, artStyle, pageCount, language } = options;

  const langInstruction =
    language === 'tl'
      ? 'Write ALL story text in natural child-friendly TAGALOG. JSON keys stay in English.'
      : 'Write ALL story text in natural child-friendly ENGLISH.';

  // Map user-facing art style names to Flux-friendly style anchors
  const styleAnchorMap: Record<string, string> = {
    cartoon:   "children's book illustration, Pixar style, cute cartoon, soft pastel colors",
    watercolor:"children's book illustration, soft watercolor, hand-painted, pastel tones",
    digital:   "children's book illustration, digital art, flat design, vibrant colors",
    sketch:    "children's book illustration, pencil sketch, hand-drawn, warm tones",
    realistic: "children's book illustration, painterly storybook art, warm tones",
    anime:     "children's book illustration, anime style, Studio Ghibli, soft colors",
  };
  const styleAnchor = styleAnchorMap[artStyle] || styleAnchorMap.cartoon;

  const prompt = `You are a children's storybook writer and prompt engineer.

${langInstruction}

Write a ${pageCount}-page ${genres.join(', ')} story for children aged 6-8.
Story idea: "${storyIdea}"

Respond ONLY with this JSON (no markdown, no explanation):
{
  "title": "Story title",
  "description": "2-3 sentence summary of the story",
  "characterDescription": "Describe ALL main characters physically in ONE concise sentence total (e.g. 'Timmy is a 7-year-old blonde boy in a blue shirt and his friend Max is a brown mule.')",
  "colorScheme": "Overall color palette for the story (e.g. warm sunset tones with orange and pink)",
  "pages": [
    {
      "text": "1-3 sentences for page 1",
      "imagePrompt": "WRITE THE imagePrompt BASED ON THE page text (see rules below)"
    }
  ]
}

IMAGE PROMPT RULES — read carefully:
Structure: [STYLE ANCHOR], [ALL CHARACTERS IN THIS SCENE], [SCENE FROM PAGE TEXT], [SETTING], [MOOD], [QUALITY SUFFIX]

1. STYLE ANCHOR (always first):
   "${styleAnchor}"

2. CHARACTERS:
   - List EVERY character that appears in the page text BY THEIR PHYSICAL DESCRIPTION, not just their name.
   - Example: "a 7-year-old blonde boy in a blue shirt, and beside him a brown mule"
   - For 2+ characters: add "two clearly separated characters, distinct individuals, visible space between them"

3. SCENE: translate the page "text" into a specific visual action.
   - WHAT is happening? WHERE exactly?
   - Each page MUST show a DIFFERENT action and DIFFERENT location.

4. SETTING DETAIL: one short environment phrase, varied each page.

5. MOOD: cheerful / nervous / adventurous / sad / excited / peaceful / dramatic

6. QUALITY SUFFIX (always last):
   "full body, normal anatomy, correct proportions, 4 limbs, vibrant colors, high quality, safe for children, no text"

Rules:
- Exactly ${pageCount} pages
- Valid JSON only, no trailing commas`.trim();

  console.log('[Groq] Sending request — text and imagePrompts');
  console.log('[Groq] Model:', GROQ_MODEL);
  console.log('[Groq] Estimated input tokens: ~', Math.ceil(prompt.length / 4));

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content:
            "You are a creative children's story writer. " +
            'Always respond with valid JSON only — no markdown, no code blocks. ' +
            'JSON must be complete and parseable by JSON.parse().',
        },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('[Groq] Error:', err);
    if (response.status === 401) throw new Error('Groq API key is invalid.');
    if (response.status === 413 || response.status === 429) {
      throw new Error('Groq rate limit hit. Please wait a moment and try again.');
    }
    throw new Error(`Groq API error ${response.status}: ${JSON.stringify(err)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned an empty response.');

  console.log('[Groq] Raw response length:', content.length, 'chars');

  // Parse JSON
  let storyData: any;
  try {
    storyData = JSON.parse(content);
  } catch {
    // Try to extract JSON from any surrounding text
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Groq response was not valid JSON. Please try again.');
    storyData = JSON.parse(match[0]);
  }

  if (!storyData.pages || !Array.isArray(storyData.pages)) {
    throw new Error('Groq response missing pages array.');
  }

  console.log('[Groq] ✅ Story generated with', storyData.pages.length, 'pages');

  return {
    title: storyData.title || 'My Story',
    description: storyData.description || '',
    characterDescription: storyData.characterDescription || '',
    colorScheme: storyData.colorScheme || '',
    pages: storyData.pages.map((p: any) => ({
      text: p.text || '',
      imagePrompt: p.imagePrompt || '',
    })),
  };
}

/**
 * Check if Groq API key is configured
 */
export function isGroqConfigured(): boolean {
  return !!import.meta.env.VITE_GROQ_API_KEY;
}
