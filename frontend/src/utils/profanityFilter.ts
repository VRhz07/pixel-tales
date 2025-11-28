/**
 * Profanity Filter Utility
 * Detects and censors inappropriate words in English and Tagalog
 * Now fetches words from the backend database
 */

import profanityService from '../services/profanity.service';

// Default profanity list (fallback if API fails)
const DEFAULT_ENGLISH_PROFANITY: string[] = [
  'fuck', 'shit', 'damn', 'hell', 'ass', 'bitch', 'bastard',
  'crap', 'piss', 'dick', 'cock', 'pussy', 'whore', 'slut',
  'fag', 'nigger', 'nigga', 'retard', 'stupid', 'idiot',
  'dumb', 'moron', 'imbecile', 'jackass', 'asshole', 'tits', 'boobs',
];

const DEFAULT_TAGALOG_PROFANITY: string[] = [
  'putang ina', 'putangina', 'puta', 'gago', 'tanga',
  'bobo', 'ulol', 'tarantado', 'peste',
  'leche', 'yawa', 'tangina', 'buwisit', 'punyeta',
  'hinayupak', 'kingina', 'pokpok', 'shunga', 'inutil',
  'walang kwenta', 'walang hiya', 'kupal', 'tamod', 'puday', 'tite', 'betlog',
  'utong', 'pukingina', 'kantot', 'kinakantot', 'chupa', 'tsupa',
];

// Dynamic profanity list (loaded from API)
let ALL_PROFANITY: string[] = [...DEFAULT_ENGLISH_PROFANITY, ...DEFAULT_TAGALOG_PROFANITY];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch active profanity words from the backend
 */
async function fetchProfanityWords() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (now - lastFetchTime < CACHE_DURATION) {
    return;
  }
  
  try {
    const words = await profanityService.getActiveProfanityWords('all');
    if (words && words.length > 0) {
      ALL_PROFANITY = words;
      lastFetchTime = now;
      console.log('✅ Profanity words loaded from API:', words.length);
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch profanity words, using defaults:', error);
    // Continue using default list
  }
}

// Initialize profanity list on module load
fetchProfanityWords();

/**
 * Creates a regex pattern for detecting profanity
 * Handles variations like spaces, special characters, and letter substitutions
 */
function createProfanityPattern(word: string): RegExp {
  // Escape special regex characters
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Replace letters with patterns that match common substitutions
  const pattern = escaped
    .replace(/a/gi, '[a@4]')
    .replace(/e/gi, '[e3]')
    .replace(/i/gi, '[i1!]')
    .replace(/o/gi, '[o0]')
    .replace(/s/gi, '[s$5]')
    .replace(/t/gi, '[t7]')
    .replace(/\s/g, '[\\s\\-_]*'); // Allow spaces, hyphens, underscores between letters
  
  return new RegExp(`\\b${pattern}\\b`, 'gi');
}

/**
 * Detects if text contains profanity
 * Automatically refreshes word list if needed
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  
  // Refresh profanity words if cache expired
  fetchProfanityWords();
  
  const lowerText = text.toLowerCase();
  
  // Check for exact matches and variations
  return ALL_PROFANITY.some(word => {
    const pattern = createProfanityPattern(word);
    return pattern.test(lowerText);
  });
}

/**
 * Finds all profane words in text
 */
export function findProfanity(text: string): string[] {
  if (!text) return [];
  
  const found: string[] = [];
  const lowerText = text.toLowerCase();
  
  ALL_PROFANITY.forEach(word => {
    const pattern = createProfanityPattern(word);
    const matches = lowerText.match(pattern);
    if (matches) {
      found.push(...matches);
    }
  });
  
  return [...new Set(found)]; // Remove duplicates
}

/**
 * Censors profanity by replacing with asterisks
 * Preserves first and last letter for context
 */
export function censorProfanity(text: string): string {
  if (!text) return text;
  
  let censored = text;
  
  ALL_PROFANITY.forEach(word => {
    const pattern = createProfanityPattern(word);
    censored = censored.replace(pattern, (match) => {
      if (match.length <= 2) {
        return '*'.repeat(match.length);
      }
      // Keep first and last letter, censor middle
      return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
    });
  });
  
  return censored;
}

/**
 * Gets a warning message based on detected profanity
 */
export function getProfanityWarning(text: string): string | null {
  if (!containsProfanity(text)) return null;
  
  const profaneWords = findProfanity(text);
  const count = profaneWords.length;
  
  if (count === 1) {
    return 'Inappropriate language detected and censored';
  }
  return `${count} inappropriate words detected and censored`;
}

/**
 * Validates text and returns censored version with warning
 */
export function validateAndCensor(text: string): {
  censored: string;
  hasProfanity: boolean;
  warning: string | null;
} {
  const hasProfanity = containsProfanity(text);
  const censored = hasProfanity ? censorProfanity(text) : text;
  const warning = getProfanityWarning(text);
  
  return {
    censored,
    hasProfanity,
    warning,
  };
}
