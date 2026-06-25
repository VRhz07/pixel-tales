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

// ─── Camera & lighting variety for auto-built imagePrompts ───────────────────
const CAMERA_ANGLES = [
  'Wide establishing shot',
  'Medium shot',
  'Close-up shot focusing on character expression',
  'Low angle dynamic shot',
  'High angle bird\'s eye view',
  'Side profile view',
  'Over-the-shoulder shot',
];

const LIGHTING_OPTIONS = [
  'warm golden hour lighting casting long shadows',
  'soft overcast natural lighting',
  'bright midday sunlight with vivid colors',
  'dramatic side lighting with deep shadows',
  'gentle morning light with soft gradients',
  'magical glowing ambient light',
  'cool moonlight with soft blue tones',
];

/**
 * Auto-build an imagePrompt for a page without calling any AI.
 * Uses the page text + characterDescription + artStyle to construct a
 * detailed Pollinations-ready prompt — costing 0 additional tokens.
 */
export function buildImagePromptFromText(
  pageText: string,
  characterDescription: string,
  artStyle: string,
  pageNumber: number,
  totalPages: number
): string {
  const idx = (pageNumber - 1) % CAMERA_ANGLES.length;
  const camera = CAMERA_ANGLES[idx];
  const lighting = LIGHTING_OPTIONS[idx % LIGHTING_OPTIONS.length];

  const position = pageNumber / totalPages;
  let compositionHint = 'character positioned in lower right leaving space for text at top';
  if (position < 0.2) compositionHint = 'wide establishing composition, character small in frame';
  else if (position < 0.5) compositionHint = 'character centered in frame, dynamic action pose';
  else if (position < 0.8) compositionHint = 'close focus on emotion, negative space for text';
  else compositionHint = 'peaceful resolution composition, character in harmony with environment';

  const charPart = characterDescription
    ? `${characterDescription}. `
    : '';

  return (
    `${artStyle} style children's book illustration. ` +
    `${charPart}` +
    `Scene: ${pageText.trim()} ` +
    `${camera}, ${compositionHint}. ` +
    `${lighting}. ` +
    `Professional children's book illustration, vibrant colors, detailed background, ` +
    `atmospheric lighting, safe for children, high quality.`
  );
}

/**
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

  // Minimal prompt — only asks for text, NO imagePrompts
  // Keeps token count tiny so it fits within the free 6,000 TPM limit
  const prompt = `You are a children's storybook writer.

${langInstruction}

Write a ${pageCount}-page ${genres.join(', ')} story for children aged 6-8.
Story idea: "${storyIdea}"
Art style (for reference only): ${artStyle}

Respond ONLY with this JSON (no markdown, no explanation):
{
  "title": "Story title",
  "description": "2-3 sentence summary of the story",
  "characterDescription": "Detailed main character appearance: age, hair color/style, eye color, clothing colors, distinctive features",
  "colorScheme": "Overall color palette for the story (e.g. warm sunset tones with orange and pink)",
  "pages": [
    { "text": "1-3 sentences for page 1" },
    { "text": "1-3 sentences for page 2" }
  ]
}

Rules:
- Exactly ${pageCount} pages
- Each page: 1-3 sentences, simple vocabulary, warm tone
- characterDescription must be very specific (exact colors, clothing)
- Valid JSON only, no trailing commas`.trim();

  console.log('[Groq] Sending request — text-only mode (no imagePrompts)');
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

  // Auto-build imagePrompts client-side (costs 0 extra tokens)
  const pagesWithPrompts = storyData.pages.map((page: any, i: number) => ({
    text: page.text || '',
    imagePrompt: buildImagePromptFromText(
      page.text || '',
      storyData.characterDescription || '',
      artStyle,
      i + 1,
      storyData.pages.length
    ),
  }));

  console.log('[Groq] ✅ Story generated with', pagesWithPrompts.length, 'pages');
  console.log('[Groq] imagePrompts auto-built client-side (0 extra tokens)');

  return {
    title: storyData.title || 'My Story',
    description: storyData.description || '',
    characterDescription: storyData.characterDescription || '',
    colorScheme: storyData.colorScheme || '',
    pages: pagesWithPrompts,
  };
}

/**
 * Check if Groq API key is configured
 */
export function isGroqConfigured(): boolean {
  return !!import.meta.env.VITE_GROQ_API_KEY;
}
