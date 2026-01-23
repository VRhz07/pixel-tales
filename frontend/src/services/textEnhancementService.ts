/**
 * Text Enhancement Service
 * Provides AI-powered text improvements for children's storybook creation
 */

import { generateStoryWithGemini } from './geminiProxyService';

export type EnhancementType = 'grammar' | 'extend' | 'simplify' | 'creative';

export interface EnhancementResult {
  originalText: string;
  enhancedText: string;
  type: EnhancementType;
  changes?: string[];
}

class TextEnhancementService {
  /**
   * Fix grammar and spelling errors in the text
   */
  async fixGrammar(text: string): Promise<EnhancementResult> {
    const prompt = `You are a helpful writing assistant for children's storybooks. Fix any grammar and spelling errors in the following text while keeping the original meaning and style. Keep it simple and age-appropriate for children aged 5-12.

IMPORTANT: 
- The text can be in English, Tagalog, or a mix of both languages (Taglish). Maintain the same language(s) used in the original text.
- Keep the output to 3-5 sentences maximum. This is for a storybook page.
- Do not make it longer than necessary.

Original text:
${text}

Return ONLY the corrected text without any explanations or additional comments.`;

    try {
      const enhancedText = await generateStoryWithGemini(prompt);
      
      return {
        originalText: text,
        enhancedText: enhancedText.trim(),
        type: 'grammar'
      };
    } catch (error) {
      console.error('Error fixing grammar:', error);
      throw new Error('Failed to fix grammar. Please try again.');
    }
  }

  /**
   * Extend short text into fuller sentences/paragraphs
   */
  async extendText(text: string): Promise<EnhancementResult> {
    const prompt = `You are a creative writing assistant for children's storybooks. Extend and elaborate on the following text to make it more descriptive and engaging for children aged 5-12. Add vivid details, sensory descriptions, and make it more interesting while keeping the original story direction.

IMPORTANT: 
- The text can be in English, Tagalog, or a mix of both languages (Taglish). Maintain the same language(s) used in the original text.
- Keep the output to 3-5 sentences maximum. This is for a storybook page.
- Add details but stay within the 3-5 sentence limit.

Original text:
${text}

Return ONLY the extended text without any explanations or additional comments.`;

    try {
      const enhancedText = await generateStoryWithGemini(prompt);
      
      return {
        originalText: text,
        enhancedText: enhancedText.trim(),
        type: 'extend'
      };
    } catch (error) {
      console.error('Error extending text:', error);
      throw new Error('Failed to extend text. Please try again.');
    }
  }

  /**
   * Simplify text to make it more appropriate for children
   */
  async simplifyText(text: string): Promise<EnhancementResult> {
    const prompt = `You are a helpful writing assistant for children's storybooks. Simplify the following text to make it easier for children aged 5-12 to understand. Use simple words, shorter sentences, and clear language while keeping the story engaging.

IMPORTANT: 
- The text can be in English, Tagalog, or a mix of both languages (Taglish). Maintain the same language(s) used in the original text.
- Keep the output to 3-5 sentences maximum. This is for a storybook page.
- Use simple, short sentences.

Original text:
${text}

Return ONLY the simplified text without any explanations or additional comments.`;

    try {
      const enhancedText = await generateStoryWithGemini(prompt);
      
      return {
        originalText: text,
        enhancedText: enhancedText.trim(),
        type: 'simplify'
      };
    } catch (error) {
      console.error('Error simplifying text:', error);
      throw new Error('Failed to simplify text. Please try again.');
    }
  }

  /**
   * Make the text more creative and engaging
   */
  async makeCreative(text: string): Promise<EnhancementResult> {
    const prompt = `You are a creative writing assistant for children's storybooks. Make the following text more creative, imaginative, and engaging for children aged 5-12. Add colorful descriptions, interesting adjectives, and make it more magical and fun while keeping the core story the same.

IMPORTANT: 
- The text can be in English, Tagalog, or a mix of both languages (Taglish). Maintain the same language(s) used in the original text.
- Keep the output to 3-5 sentences maximum. This is for a storybook page.
- Be creative but concise.

Original text:
${text}

Return ONLY the enhanced creative text without any explanations or additional comments.`;

    try {
      const enhancedText = await generateStoryWithGemini(prompt);
      
      return {
        originalText: text,
        enhancedText: enhancedText.trim(),
        type: 'creative'
      };
    } catch (error) {
      console.error('Error making text creative:', error);
      throw new Error('Failed to enhance creativity. Please try again.');
    }
  }

  /**
   * All-in-one enhancement: fix grammar, improve readability, and make it engaging
   */
  async enhanceAll(text: string): Promise<EnhancementResult> {
    const prompt = `You are a helpful writing assistant for children's storybooks. Improve the following text by:
1. Fixing any grammar and spelling errors
2. Making it more engaging and descriptive for children aged 5-12
3. Using simple, age-appropriate language
4. Adding vivid details where appropriate

IMPORTANT: 
- The text can be in English, Tagalog, or a mix of both languages (Taglish). Maintain the same language(s) used in the original text.
- Keep the output to 3-5 sentences maximum. This is for a storybook page.
- Be concise and engaging.

Original text:
${text}

Return ONLY the improved text without any explanations or additional comments.`;

    try {
      const enhancedText = await generateStoryWithGemini(prompt);
      
      return {
        originalText: text,
        enhancedText: enhancedText.trim(),
        type: 'creative'
      };
    } catch (error) {
      console.error('Error enhancing text:', error);
      throw new Error('Failed to enhance text. Please try again.');
    }
  }

  /**
   * Get enhancement based on type
   */
  async enhance(text: string, type: EnhancementType): Promise<EnhancementResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Please enter some text to enhance.');
    }

    if (text.trim().length < 10) {
      throw new Error('Text is too short. Please enter at least 10 characters.');
    }

    switch (type) {
      case 'grammar':
        return this.fixGrammar(text);
      case 'extend':
        return this.extendText(text);
      case 'simplify':
        return this.simplifyText(text);
      case 'creative':
        return this.makeCreative(text);
      default:
        return this.enhanceAll(text);
    }
  }
}

export const textEnhancementService = new TextEnhancementService();
