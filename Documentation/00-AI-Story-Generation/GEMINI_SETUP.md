# Gemini AI Integration Setup

## Overview
The Imaginary Worlds app uses Google's Gemini AI for story generation. Gemini is free to use with generous limits and excellent for creative writing tasks.

## Why Gemini?
- ✅ **Free Tier**: 60 requests/minute, 1,500 requests/day
- ✅ **Excellent for Creative Writing**: Specifically designed for text generation
- ✅ **Easy Integration**: Simple REST API
- ✅ **No Credit Card Required**: Free tier doesn't require payment info
- ✅ **Multimodal Support**: Can handle text and images (future feature)

## Setup Instructions

### 1. Get Your Free API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure Your Environment

Create a `.env` file in the `frontend` directory:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

### 3. Restart Development Server

```bash
npm run dev
```

## How It Works

### Story Generation Flow

1. **User Input**:
   - Story prompt/idea
   - Multiple genres (Fantasy, Adventure, etc.)
   - Age group (3-5, 6-8, 9-12, Teen)
   - Art style (Cartoon, Watercolor, etc.)

2. **Gemini Processing**:
   - Receives structured prompt
   - Generates age-appropriate story
   - Creates 5-8 pages with text
   - Provides illustration descriptions

3. **Response Format**:
```json
{
  "title": "The Magical Adventure",
  "pages": [
    {
      "pageNumber": 1,
      "illustrationDescription": "A young girl standing at the edge of a magical forest",
      "text": "Once upon a time, Luna discovered a hidden path in the woods."
    }
  ]
}
```

## API Limits

### Free Tier
- **Requests per minute**: 60
- **Requests per day**: 1,500
- **Tokens per request**: 32,000 input + 8,000 output

This is more than enough for:
- Development and testing
- Small to medium user base
- Prototype/MVP deployment

## Cost Considerations

### Free Tier (Current)
- Perfect for development
- Suitable for MVP with <100 daily active users
- No credit card required

### Paid Tier (If Needed Later)
- $0.00025 per 1K characters input
- $0.0005 per 1K characters output
- Very affordable even at scale

## Alternative AI Options

If you need alternatives, consider:

1. **OpenAI GPT-3.5** (Paid)
   - More expensive but very reliable
   - $0.0015 per 1K tokens

2. **Anthropic Claude** (Paid)
   - Good for creative writing
   - Similar pricing to OpenAI

3. **Hugging Face Models** (Free/Paid)
   - Open source options
   - Requires more setup

## Security Best Practices

1. ✅ **Never commit API keys** to version control
2. ✅ **Use environment variables** for all secrets
3. ✅ **Implement rate limiting** in production
4. ✅ **Add user quotas** to prevent abuse
5. ✅ **Monitor API usage** through Google AI Studio dashboard

## Future Enhancements

- [ ] Add image generation for illustrations (Gemini Vision)
- [ ] Implement caching for common requests
- [ ] Add retry logic for failed requests
- [ ] Create user quota system
- [ ] Add story quality scoring

## Troubleshooting

### Error: "API key not configured"
- Check your `.env` file exists in the `frontend` directory
- Verify the variable name is `VITE_GEMINI_API_KEY`
- Restart your dev server after adding the key

### Error: "429 Too Many Requests"
- You've hit the rate limit (60/minute or 1,500/day)
- Implement request queuing or wait before retrying

### Error: "Invalid API key"
- Verify your API key is correct
- Check if the key is active in Google AI Studio
- Ensure no extra spaces in the `.env` file

## Support

For issues with:
- **Gemini API**: [Google AI Documentation](https://ai.google.dev/docs)
- **This Integration**: Check the `geminiService.ts` file
- **Rate Limits**: [Google AI Studio Dashboard](https://makersuite.google.com/)
