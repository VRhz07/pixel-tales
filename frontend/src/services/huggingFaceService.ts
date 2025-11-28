const HF_API_KEY = import.meta.env.VITE_HUGGING_FACE_API_KEY || '';
const HF_API_URL = 'https://api-inference.huggingface.co/models';

// Style-specific models for better art style control
const STYLE_MODELS: Record<string, string> = {
  cartoon: 'prompthero/openjourney-v4',
  watercolor: 'SG161222/Realistic_Vision_V5.1_noVAE', 
  sketch: 'nitrosocke/Arcane-Diffusion',
  anime: 'Linaqruf/anything-v3.0',
  digital: 'runwayml/stable-diffusion-v1-5',
  realistic: 'stabilityai/stable-diffusion-2-1'
};

export const generateImageHF = async (
  prompt: string,
  artStyle: string
): Promise<string> => {
  if (!HF_API_KEY) {
    throw new Error('Hugging Face API key not configured');
  }

  const model = STYLE_MODELS[artStyle] || STYLE_MODELS.cartoon;
  
  try {
    console.log(`Generating image with Hugging Face model: ${model}`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);
    
    const response = await fetch(`${HF_API_URL}/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          negative_prompt: 'photorealistic, photograph, realistic photo, camera, 3d render, close-up portrait, headshot, character looking at camera',
          num_inference_steps: 30,
          guidance_scale: 7.5,
          width: 512,
          height: 512
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API Error Response:', errorText);
      
      // Check for specific error types
      if (response.status === 503) {
        throw new Error('Model is loading, please try again in a few minutes');
      } else if (response.status === 401) {
        throw new Error('Invalid Hugging Face API key');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded, please try again later');
      } else {
        throw new Error(`HF API error: ${response.statusText} - ${errorText}`);
      }
    }

    const blob = await response.blob();
    
    // Check if the response is actually an image
    if (!blob.type.startsWith('image/')) {
      const text = await blob.text();
      console.error('Non-image response:', text);
      throw new Error('Invalid response from Hugging Face API');
    }
    
    const imageUrl = URL.createObjectURL(blob);
    console.log('Successfully generated image with Hugging Face');
    return imageUrl;
    
  } catch (error) {
    console.error('Hugging Face generation failed:', error);
    throw error;
  }
};

// Check if Hugging Face is available
export const isHuggingFaceAvailable = (): boolean => {
  return !!HF_API_KEY;
};

// Test the API key
export const testHuggingFaceAPI = async (): Promise<boolean> => {
  if (!HF_API_KEY) {
    return false;
  }
  
  try {
    const response = await fetch(`${HF_API_URL}/runwayml/stable-diffusion-v1-5`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: 'test image',
        parameters: { num_inference_steps: 1 }
      }),
    });
    
    return response.ok || response.status === 503; // 503 means model is loading but key is valid
  } catch (error) {
    console.error('HF API test failed:', error);
    return false;
  }
};
