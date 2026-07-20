// OpenRouter AI Service for story text generation
// Routes through the secure Django backend proxy — API key never exposed to browser.
// Backend endpoint: POST /api/ai/openrouter/generate-story/

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Free chat models verified to work with /chat/completions on OpenRouter:
//   google/gemma-4-27b-it:free  ← current default (instruction-tuned, returns clean JSON)
//   mistralai/mistral-7b-instruct:free
//   meta-llama/llama-3.1-8b-instruct:free
// AVOID: embedding models (nvidia/llama-nemotron-embed-*), reasoning/thinking models (openrouter/free, deepseek-r1)
const OPENROUTER_MODEL = 'google/gemma-4-26b-a4b-it:free';

export interface OpenRouterGenerationConfig {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/**
 * Generate a story using OpenRouter AI.
 *
 * @param storyIdea    The user's story idea
 * @param options      Genre, artStyle, pageCount, language
 * @param config       Optional generation config
 * @returns Parsed story data object
 */
export async function generateStoryWithOpenRouter(
  storyIdea: string,
  options: {
    genres: string[];
    artStyle: string;
    pageCount: number;
    language: 'en' | 'tl';
  },
  config: OpenRouterGenerationConfig = {}
): Promise<{
  title: string;
  description: string;
  characterDescription: string;
  colorScheme: string;
  pages: Array<{ text: string; imagePrompt: string }>;
}> {
  const { temperature = 0.85, maxTokens = 2048, model = OPENROUTER_MODEL } = config;
  const { genres, artStyle, pageCount, language } = options;

  const langInstruction =
    language === 'tl'
      ? 'Write ALL story text in natural child-friendly TAGALOG. JSON keys stay in English.'
      : 'Write ALL story text in natural child-friendly ENGLISH.';

  // Map user-facing art style names to Flux-friendly style anchors
  const styleAnchorMap: Record<string, string> = {
    cartoon: "children's book illustration, Pixar style, cute cartoon, soft pastel colors",
    watercolor: "children's book illustration, soft watercolor, hand-painted, pastel tones",
    digital: "children's book illustration, digital art, flat design, vibrant colors",
    sketch: "children's book illustration, pencil sketch, hand-drawn, warm tones",
    realistic: "children's book illustration, painterly storybook art, warm tones",
    anime: "children's book illustration, anime style, Studio Ghibli, soft colors",
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

  console.log('[OpenRouter] Sending request via backend proxy — text and imagePrompts');
  console.log('[OpenRouter] Model:', model);

  const token = localStorage.getItem('access_token');
  const response = await fetch(`${BACKEND_URL}/api/ai/openrouter/generate-story/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            "You are a creative children's story writer. " +
            'Your ENTIRE response must be a single valid JSON object — no explanation, no markdown, no code fences. ' +
            'Start your response with { and end with }. ' +
            'JSON must be complete and parseable by JSON.parse(). No trailing commas.',
        },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('[OpenRouter] Proxy error:', err);
    const errMsg = err?.error || `OpenRouter proxy error ${response.status}`;
    if (response.status === 401) throw new Error('OpenRouter API key is invalid or not configured on server.');
    if (response.status === 429) throw new Error('OpenRouter rate limit hit. Please wait a moment and try again.');
    if (response.status === 503) throw new Error(errMsg);
    throw new Error(errMsg);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned an empty response.');

  console.log('[OpenRouter] Raw response length:', content.length, 'chars');

  // ── Robust JSON Extraction ──────────────────────────────────────────
  // Some free models (especially reasoning/thinking ones) output chain-of-thought
  // before the final JSON. We scan backwards from the last '}' to find the
  // last complete top-level JSON object in the response.
  let storyData: any;

  function extractLastJson(raw: string): string | null {
    // Strip markdown code fences first
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) return fenceMatch[1].trim();

    // Find the LAST closing brace and walk backwards to its matching opener
    const lastClose = raw.lastIndexOf('}');
    if (lastClose === -1) return null;

    let depth = 0;
    for (let i = lastClose; i >= 0; i--) {
      if (raw[i] === '}') depth++;
      if (raw[i] === '{') depth--;
      if (depth === 0) return raw.substring(i, lastClose + 1);
    }
    return null;
  }

  function sanitizeJson(raw: string): string {
    return raw
      .replace(/,\s*([}\]])/g, '$1') // trailing commas
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ') // control chars (keep \t \n \r)
      .replace(/^\uFEFF/, '') // BOM
      .trim();
  }

  const extracted = extractLastJson(content);
  if (!extracted) {
    console.error('[OpenRouter] No JSON object found. Raw output:', content);
    throw new Error('OpenRouter response contained no JSON. Please try again.');
  }

  const jsonText = sanitizeJson(extracted);

  try {
    storyData = JSON.parse(jsonText);
  } catch (e) {
    console.error('[OpenRouter] JSON parse failed after extraction. Sanitized text:', jsonText);
    throw new Error('OpenRouter response was not valid JSON. Please try again.');
  }

  if (!storyData.pages || !Array.isArray(storyData.pages)) {
    throw new Error('OpenRouter response missing pages array.');
  }

  console.log('[OpenRouter] ✅ Story generated with', storyData.pages.length, 'pages');

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
 * Check if OpenRouter is available (backend will handle the key check)
 */
export function isOpenRouterConfigured(): boolean {
  return true; // Key is on the backend; assume available
}
