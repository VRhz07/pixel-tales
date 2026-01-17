import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  XMarkIcon, 
  CameraIcon,
  PhotoIcon,
  SparklesIcon,
  ArrowPathIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useThemeStore } from '../../stores/themeStore';
import { useStoryStore } from '../../stores/storyStore';
import { useI18nStore } from '../../stores/i18nStore';
import { ART_STYLE_OPTIONS, AI_GENRE_OPTIONS } from '../../constants/genres';
import { analyzeImageWithGemini } from '../../services/geminiProxyService';
import { generateStoryIllustrationsFromPrompts } from '../../services/imageGenerationService';
import { VoiceFilteredTextarea } from '../common/VoiceFilteredTextarea';
import { processImageWithOCR } from '../../services/ocrProxyService';

interface PhotoStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CreationMode = 'photo' | 'ocr';

interface PhotoFormData {
  capturedImage: string | null;
  additionalContext: string;
  selectedArtStyle: string | null;
  selectedGenres: string[]; // Changed to array for multi-select
  pageCount: number;
  storyLanguage: 'en' | 'tl';
}

const PhotoStoryModal = ({ isOpen, onClose }: PhotoStoryModalProps) => {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const { createStory, updateStory, addPage, updatePage, getStory } = useStoryStore();
  const { language } = useI18nStore();
  
  const [formData, setFormData] = useState<PhotoFormData>({
    capturedImage: null,
    additionalContext: '',
    selectedArtStyle: null,
    selectedGenres: [], // Empty array for multi-select
    pageCount: 5,
    storyLanguage: language as 'en' | 'tl' // Use current app language
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  
  // OCR-specific state
  const [creationMode, setCreationMode] = useState<CreationMode>('photo');
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [ocrResult, setOcrResult] = useState<{ text: string; success: boolean } | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatus, setOcrStatus] = useState<string>('');
  const [isHandwritten, setIsHandwritten] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // No cleanup needed for Google Cloud Vision (API-based)

  if (!isOpen) return null;

  console.log('PhotoStoryModal rendered', { isOpen, showCamera, capturedImage: formData.capturedImage });

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, capturedImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Start camera
  const startCamera = async () => {
    console.log('Starting camera...');
    
    // Check if camera API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(
        'Camera access is not available.\n\n' +
        'This could be because:\n' +
        '• You\'re accessing the site over HTTP (not HTTPS)\n' +
        '• Your browser doesn\'t support camera access\n\n' +
        'Please use file upload instead, or access the site via HTTPS.'
      );
      return;
    }
    
    // First, set showCamera to true so the video element is rendered
    setShowCamera(true);
    
    // Wait a tick for React to render the video element
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        console.log('Camera stream obtained:', stream);
        console.log('videoRef.current:', videoRef.current);
        
        if (videoRef.current) {
          console.log('Setting stream to video element...');
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, playing...');
            videoRef.current?.play().then(() => {
              console.log('Video is now playing!');
            }).catch(err => {
              console.error('Error playing video:', err);
            });
          };
        } else {
          console.error('videoRef.current is still null after timeout!');
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Unable to access camera: ${errorMessage}\n\nPlease make sure you've granted camera permissions and try again, or use file upload instead.`);
        setShowCamera(false); // Reset on error
      }
    }, 100); // Give React time to render
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 with good quality
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setFormData(prev => ({ ...prev, capturedImage: imageData }));
        stopCamera();
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  // Extract text from image using secure backend OCR proxy
  const handleExtractText = async () => {
    if (!formData.capturedImage) {
      alert('Please capture or upload a photo first');
      return;
    }

    setIsExtractingText(true);
    setOcrProgress(0);
    setOcrStatus('Initializing OCR...');

    try {
      console.log(`🔒 Using secure backend OCR proxy (${isHandwritten ? 'handwriting' : 'print'} mode)...`);
      setOcrStatus('Processing image...');
      setOcrProgress(30);

      const result = await processImageWithOCR(
        formData.capturedImage,
        isHandwritten
      );
      
      setOcrProgress(100);
      setOcrStatus('Text extraction complete!');
      setOcrResult(result);
      setExtractedText(result.text);
      
      console.log(`📝 Extracted ${result.text.length} characters`);
      console.log(`📄 Text content:`, result.text);

      // If text was found, automatically add it to additional context
      if (result.text && result.text.length > 0) {
        setFormData(prev => ({
          ...prev,
          additionalContext: prev.additionalContext 
            ? `${prev.additionalContext}\n\nExtracted text: ${result.text}`
            : `Extracted text: ${result.text}`
        }));
        
        // Show success message
        if (result.text.length < 10) {
          alert(`Text extracted: "${result.text}"\n\nNote: Only a small amount of text was detected. Consider using "Photo Story" mode for better results.`);
        }
      } else {
        // No text detected
        alert('No text was detected in the image. Try using "Photo Story" mode instead.');
      }

    } catch (error) {
      console.error('❌ OCR extraction failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(
        '❌ OCR Extraction Failed\n\n' +
        `Error: ${errorMessage}\n\n` +
        'Please try again or use Photo Story mode instead.'
      );
    } finally {
      setIsExtractingText(false);
      setOcrProgress(0);
      setOcrStatus('');
    }
  };

  // Generate story from photo
  const handleGenerateStory = async () => {
    if (!formData.capturedImage || !formData.selectedArtStyle || formData.selectedGenres.length === 0) {
      alert('Please capture/upload a photo, select an art style, and choose at least one genre');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStage('Analyzing your photo...');

    try {
      // Step 1: Analyze image and generate story (20%)
      setGenerationProgress(20);
      
      // Build prompt for image analysis
      const analysisPrompt = `
Analyze this photo and create an engaging ${formData.pageCount}-page story based on what you see.

${formData.additionalContext ? `Additional Context: ${formData.additionalContext}` : ''}
Art Style: ${formData.selectedArtStyle}
Genres: ${formData.selectedGenres.join(', ')}
Language: ${formData.storyLanguage === 'tl' ? 'Tagalog' : 'English'}

Create a story with the following JSON format (no markdown, just pure JSON):
{
  "title": "Story Title",
  "description": "Brief description",
  "characterDescription": "DETAILED character description for AI image generation - describe appearance, clothing, colors, distinctive features. BE VERY SPECIFIC to ensure consistency across all images.",
  "colorScheme": "Consistent color palette to use throughout all images",
  "coverImagePrompt": "Wide establishing shot showing main character and setting. Include: [characterDescription], scene details, lighting, composition. Art style: ${formData.selectedArtStyle}. IMPORTANT: Correct anatomy, proper proportions.",
  "pages": [
    {
      "text": "Page text content",
      "imagePrompt": "${formData.selectedArtStyle} illustration: [USE EXACT characterDescription HERE]. Scene: [what's happening]. Camera: [angle]. Position: [in frame]. Lighting: [detailed]. Style: ${formData.selectedArtStyle}"
    }
  ]
}

EXAMPLE of good characterDescription:
"A 7-year-old girl with curly brown hair in two pigtails, bright green eyes, wearing a red and white striped t-shirt, blue denim overalls, and white sneakers"

CRITICAL imagePrompt STRUCTURE - You MUST follow this EXACT format for EVERY page:

"${formData.selectedArtStyle} illustration of [EXACT characterDescription with all details]. [Specific action/pose - VARIED per page]. [Detailed environment with specific objects, plants, weather]. [Camera angle: Wide establishing shot/Medium shot/Close-up shot/Low angle/High angle]. [Character position: positioned in lower right leaving space for text/centered in frame/upper left]. [Detailed lighting: warm golden hour lighting filtering through trees casting long shadows/soft overcast lighting/dramatic side lighting/backlit with rim light]. [Atmospheric effects: morning mist/dust particles in air/lens flare/bokeh background]. Professional children's book illustration, highly detailed, vibrant colors, sharp focus."

EXAMPLE 1 (establishing shot):
"${formData.selectedArtStyle} illustration of a 7-year-old girl with curly brown hair in two pigtails, bright green eyes, wearing a red and white striped t-shirt, blue denim overalls, and white sneakers, standing with arms raised excitedly in a sun-dappled backyard garden with tall oak trees, colorful wildflowers, a white picket fence, and a mysterious glowing door. Wide establishing shot with girl positioned in lower right, leaving space for text at top. Warm golden hour lighting filtering through tree canopy, casting dappled shadows on grass. Morning mist softly glowing. Professional children's book illustration, highly detailed, vibrant colors, sharp focus."

EXAMPLE 2 (close-up emotional):
"${formData.selectedArtStyle} illustration of a 7-year-old girl with curly brown hair in two pigtails, bright green eyes, wearing a red and white striped t-shirt, blue denim overalls, and white sneakers, sitting cross-legged with a curious expression examining a glowing magical key in her hands, surrounded by floating sparkles. Close-up shot focusing on girl's face and hands, positioned in upper right with negative space on left for text. Soft magical glow from key illuminating her face from below, creating wonder in her eyes. Sparkles creating bokeh effect in background. Professional children's book illustration, highly detailed, vibrant colors, sharp focus."

EXAMPLE 3 (action scene):
"${formData.selectedArtStyle} illustration of a 7-year-old girl with curly brown hair in two pigtails, bright green eyes, wearing a red and white striped t-shirt, blue denim overalls, and white sneakers, running joyfully through a field of tall sunflowers with butterflies flying around her. Dynamic low angle shot capturing movement with girl in center frame, showing energy and motion. Bright afternoon sunlight creating strong shadows and highlighting the golden sunflowers. Blue butterflies adding pops of color. Dust particles visible in sunbeams. Professional children's book illustration, highly detailed, vibrant colors, sharp focus."

Make sure EVERY page's imagePrompt:
1. Starts with EXACT SAME characterDescription
2. Has DIFFERENT specific action/pose
3. Has UNIQUE environment details
4. Includes explicit camera angle (Wide/Medium/Close-up/Low/High)
5. Includes character position in frame (lower right/centered/upper left - for text spacing)
6. Has detailed lighting description (golden hour/overcast/dramatic/backlit)
7. Includes atmospheric effects (mist/dust/lens flare/bokeh)
8. CRITICAL: Correct anatomy - proper proportions, realistic poses, no extra limbs, correct finger count
9. For humans: "5 fingers on each hand, 2 arms, 2 legs, correct facial proportions"
10. For animals: "correct [species] anatomy, proper leg count, realistic features"
11. Ends with quality keywords: "Professional children's book illustration, highly detailed, vibrant colors, sharp focus"
      `.trim();
      
      const storyJSON = await analyzeImageWithGemini(formData.capturedImage, analysisPrompt);
      
      // Parse the JSON response
      const jsonMatch = storyJSON.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from AI');
      }
      
      const storyData = JSON.parse(jsonMatch[0]);

      // Step 2: Create story in store (25%)
      setGenerationStage('Creating your story...');
      setGenerationProgress(25);
      
      const newStory = createStory(storyData.title);
      
      // Step 2.3: Check image service health (25-28%)
      setGenerationStage('🔍 Checking image service...');
      setGenerationProgress(27);
      
      const { checkPollinationsHealth } = await import('../../services/imageGenerationService');
      const isServiceHealthy = await checkPollinationsHealth();
      
      if (!isServiceHealthy) {
        const shouldContinue = window.confirm(
          '⚠️ Image Generation Service Unavailable\n\n' +
          'The image generation service (Pollinations AI) is currently down or unavailable. ' +
          'This may be temporary.\n\n' +
          'Your story will still be created with text, but images may not load.\n\n' +
          'Options:\n' +
          '• Click "OK" to continue without images (you can add them later)\n' +
          '• Click "Cancel" to wait and try again later'
        );
        
        if (!shouldContinue) {
          throw new Error('Image generation service is unavailable. Please try again later.');
        }
        
        console.warn('⚠️ User chose to continue despite service being down');
      }
      
      // Step 2.5: Generate cover illustration (25-35%)
      setGenerationStage('Creating cover illustration...');
      setGenerationProgress(30);
      
      try {
        // Generate a UNIQUE cover image (different from page 1)
        // Cover should be more zoomed out, showing the overall scene/setting
        const coverPrompt = storyData.coverImagePrompt || 
          `Book cover illustration for "${storyData.title}". WIDE ESTABLISHING SHOT showing the main setting and atmosphere. ${storyData.characterDescription} visible in the scene. Beautiful, inviting composition perfect for a children's book cover. ${formData.selectedArtStyle} art style. NO TEXT, NO TITLE on the image - just the illustration.`;
        
        console.log('🎨 Generating cover with prompt:', coverPrompt);
        
        const coverImageUrls = await generateStoryIllustrationsFromPrompts(
          [{ imagePrompt: coverPrompt, pageNumber: 0 }],
          storyData.characterDescription
        );
        
        const baseImageUrl = coverImageUrls[0];
        console.log('✅ Base cover illustration generated');
        
        // Wait 12 seconds before generating page images to avoid rate limit
        console.log('⏳ Waiting 12 seconds before generating page images...');
        await new Promise(resolve => setTimeout(resolve, 12000));
        
        // Create a canvas to add the title text overlay
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Load the generated image
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              // Set canvas size to match image
              canvas.width = img.width;
              canvas.height = img.height;
              
              // Draw the base image
              ctx.drawImage(img, 0, 0);
              
              // Add semi-transparent overlay at top for better text readability
              const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.4);
              gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
              gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, canvas.width, canvas.height * 0.4);
              
              // Configure text styling - playful and bold
              const baseFontSize = Math.floor(canvas.width / 12);
              const maxWidth = canvas.width * 0.85; // 85% of canvas width for padding
              
              // Function to wrap text into lines
              const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
                ctx.font = `bold ${fontSize}px "Comic Sans MS", "Chalkboard SE", "Arial Rounded MT Bold", cursive, sans-serif`;
                const words = text.split(' ');
                const lines: string[] = [];
                let currentLine = '';
                
                for (let i = 0; i < words.length; i++) {
                  const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
                  const testWidth = ctx.measureText(testLine).width;
                  
                  if (testWidth > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = words[i];
                  } else {
                    currentLine = testLine;
                  }
                }
                if (currentLine) {
                  lines.push(currentLine);
                }
                return lines;
              };
              
              // Try wrapping with base font size first
              let fontSize = baseFontSize;
              let lines = wrapText(storyData.title, maxWidth, fontSize);
              
              // If we have too many lines (more than 3), reduce font size
              while (lines.length > 3 && fontSize > 30) {
                fontSize -= 4;
                lines = wrapText(storyData.title, maxWidth, fontSize);
              }
              
              // Set final font
              ctx.font = `bold ${fontSize}px "Comic Sans MS", "Chalkboard SE", "Arial Rounded MT Bold", cursive, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              
              console.log(`📝 Title "${storyData.title}" split into ${lines.length} line(s) at ${fontSize}px:`, lines);
              
              // Add text shadow for better visibility
              ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
              ctx.shadowBlur = 15;
              ctx.shadowOffsetX = 3;
              ctx.shadowOffsetY = 3;
              
              // Calculate starting Y position to center multiple lines
              const lineHeight = fontSize * 1.2;
              const totalHeight = lines.length * lineHeight;
              let titleY = canvas.height * 0.08; // Start a bit higher
              
              // Draw each line
              lines.forEach((line, index) => {
                const y = titleY + (index * lineHeight);
                
                // Stroke (outline) - colorful
                ctx.strokeStyle = '#8B5CF6'; // Purple
                ctx.lineWidth = fontSize / 10;
                ctx.strokeText(line, canvas.width / 2, y);
                
                // Fill (main text) - white
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(line, canvas.width / 2, y);
              });
              
              // Add "A Photo Story" subtitle below the title
              const subtitleSize = Math.floor(fontSize * 0.4);
              const subtitleY = titleY + (lines.length * lineHeight) + 5;
              ctx.font = `italic ${subtitleSize}px "Comic Sans MS", cursive, sans-serif`;
              ctx.shadowBlur = 10;
              ctx.fillStyle = '#FCD34D'; // Yellow
              ctx.fillText('A Photo Story', canvas.width / 2, subtitleY);
              
              resolve();
            };
            img.onerror = reject;
            img.src = baseImageUrl;
          });
          
          // Convert canvas to base64
          const coverImageWithText = canvas.toDataURL('image/jpeg', 0.95);
          console.log('✅ Cover illustration with title text created');
          
          // Update story with cover image
          updateStory(newStory.id, {
            description: storyData.description,
            genre: 'Photo Story',
            illustrationStyle: formData.selectedArtStyle,
            coverImage: coverImageWithText,
            language: formData.storyLanguage, // Set the story language
            creationType: 'ai_assisted', // Mark as AI-assisted for achievement tracking
            isDraft: false,
            isPublished: false
          });
        } else {
          // Fallback: use image without text if canvas fails
          updateStory(newStory.id, {
            description: storyData.description,
            genre: 'Photo Story',
            illustrationStyle: formData.selectedArtStyle,
            coverImage: baseImageUrl,
            language: formData.storyLanguage, // Set the story language
            creationType: 'ai_assisted', // Mark as AI-assisted for achievement tracking
            isDraft: false,
            isPublished: false
          });
        }
      } catch (error) {
        console.error('Error generating cover illustration:', error);
        // Update story without cover image if generation fails
        updateStory(newStory.id, {
          description: storyData.description,
          genre: 'Photo Story',
          illustrationStyle: formData.selectedArtStyle,
          language: formData.storyLanguage, // Set the story language
          creationType: 'ai_assisted', // Mark as AI-assisted for achievement tracking
          isDraft: false,
          isPublished: false
        });
      }

      // Step 3: Generate illustrations for each page (35-95%)
      setGenerationStage('Generating page illustrations...');
      const totalPages = storyData.pages.length;
      
      // Get the current story to check for default empty page
      const currentStory = getStory(newStory.id);
      const hasEmptyFirstPage = currentStory && currentStory.pages.length === 1 && currentStory.pages[0].text === '';
      
      if (hasEmptyFirstPage) {
        console.log('✅ Detected default empty page - will replace it with first story page');
      }
      
      // Generate ALL images at once with proper sequential processing and 12-second delays
      setGenerationStage(`Generating all ${totalPages} illustrations with rate limit protection...`);
      console.log(`🎨 Generating illustrations for all ${totalPages} pages with 12-second delays...`);
      
      try {
        const imageUrls = await generateStoryIllustrationsFromPrompts(
          storyData.pages.map((page, index) => ({
            imagePrompt: page.imagePrompt,
            pageNumber: index + 1
          })),
          storyData.characterDescription,
          (current, total, message) => {
            const progress = 35 + (current / total) * 60;
            setGenerationProgress(progress);
            setGenerationStage(message);
          }
        );
        
        console.log(`✅ All images generated: ${imageUrls.length}/${totalPages}`);
        
        // Now save each page with its corresponding image
        for (let i = 0; i < totalPages; i++) {
          const page = storyData.pages[i];
          const imageUrl = imageUrls[i];
          
          if (imageUrl) {
            console.log(`✅ Saving page ${i + 1} with image: ${imageUrl.substring(0, 60)}...`);
            
            // For the first page, update the existing empty page instead of adding new one
            if (i === 0 && hasEmptyFirstPage && currentStory) {
              console.log(`📝 Replacing empty page with Page ${i + 1} content`);
              updatePage(newStory.id, currentStory.pages[0].id, {
                text: page.text,
                canvasData: imageUrl,
                order: 0
              });
            } else {
              // For subsequent pages, add new pages
              console.log(`➕ Adding Page ${i + 1}`);
              const newPage = addPage(newStory.id, page.text);
              updatePage(newStory.id, newPage.id, {
                canvasData: imageUrl,
                order: i
              });
            }
          } else {
            console.warn(`⚠️ No image for page ${i + 1}, adding text only`);
            
            if (i === 0 && hasEmptyFirstPage && currentStory) {
              updatePage(newStory.id, currentStory.pages[0].id, {
                text: page.text,
                order: 0
              });
            } else {
              const newPage = addPage(newStory.id, page.text);
              updatePage(newStory.id, newPage.id, {
                order: i
              });
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ Error generating illustrations:`, error);
        
        // If image generation fails, add all pages with text only
        for (let i = 0; i < totalPages; i++) {
          const page = storyData.pages[i];
          
          if (i === 0 && hasEmptyFirstPage && currentStory) {
            console.log(`📝 Adding page ${i + 1} with text only (no image)`);
            updatePage(newStory.id, currentStory.pages[0].id, {
              text: page.text,
              order: 0
            });
          } else {
            console.log(`➕ Adding page ${i + 1} with text only (no image)`);
            const newPage = addPage(newStory.id, page.text);
            updatePage(newStory.id, newPage.id, {
              order: i
            });
          }
        }
      }

      // Step 4: Finalize (100%)
      setGenerationProgress(100);
      setGenerationStage('Story complete!');

      // CRITICAL FIX: Sync story to backend immediately to get backendId
      // This prevents duplicate stories when user clicks "Save" later
      try {
        console.log('🔄 Syncing story to backend to prevent duplicates...');
        const backendId = await useStoryStore.getState().syncStoryToBackend(newStory.id);
        console.log(`✅ Story synced to backend with ID: ${backendId}`);
      } catch (error) {
        console.warn('⚠️ Failed to sync story to backend:', error);
        // Continue anyway - story is saved locally
      }

      // Clear the captured image from memory
      console.log('Clearing captured image from memory...');
      setFormData(prev => ({ ...prev, capturedImage: null }));

      // Navigate to story reader
      setTimeout(() => {
        navigate(`/story/${newStory.id}`);
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Error generating photo story:', error);
      alert('Failed to generate story. Please try again.');
      // Clear image even on error to free memory
      setFormData(prev => ({ ...prev, capturedImage: null }));
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStage('');
    }
  };

  // Reset form
  const handleClose = () => {
    stopCamera();
    
    // Reset all states immediately
    setIsExtractingText(false);
    setOcrProgress(0);
    setOcrStatus('');
    setOcrResult(null);
    setExtractedText('');
    setIsGenerating(false);
    setGenerationProgress(0);
    setGenerationStage('');
    setCreationMode('photo');
    setIsHandwritten(false);
    
    setFormData({
      capturedImage: null,
      additionalContext: '',
      selectedArtStyle: null,
      selectedGenres: [], // Reset genres array
      pageCount: 5,
      storyLanguage: 'en'
    });
    
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className={`modal-content ${isDarkMode ? 'dark' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <SparklesIcon className="modal-icon" />
            <div>
              <h2 className="modal-title">Create Story from Photo</h2>
              <p className="modal-subtitle">
                Capture or upload a photo and let AI create a magical story
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="modal-close-button">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {isGenerating || isExtractingText ? (
            /* Generation/OCR Progress */
            <div className="generation-progress">
              <div className="progress-animation">
                {isExtractingText ? (
                  <DocumentTextIcon className="w-16 h-16 text-blue-500 animate-pulse" />
                ) : (
                  <SparklesIcon className="w-16 h-16 text-purple-500 animate-pulse" />
                )}
              </div>
              <h3 className="progress-title">
                {isExtractingText 
                  ? (ocrStatus || 'Extracting text...')
                  : generationStage
                }
              </h3>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${isExtractingText ? ocrProgress : generationProgress}%` }}
                />
              </div>
              <p className="progress-percentage">
                {isExtractingText 
                  ? `${Math.round(ocrProgress)}%`
                  : `${Math.round(generationProgress)}%`
                }
              </p>
              {isExtractingText && (
                <button
                  onClick={() => {
                    console.log('🛑 User cancelled OCR extraction');
                    setIsExtractingText(false);
                    setOcrProgress(0);
                    setOcrStatus('');
                  }}
                  className="modal-button-secondary"
                  style={{ marginTop: '1rem', width: '100%' }}
                >
                  Cancel Extraction
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mode Toggle */}
              <div className="form-section">
                <label className="form-label">
                  <SparklesIcon className="w-5 h-5" />
                  Creation Mode
                </label>
                <div className="mode-toggle-container">
                  <button
                    onClick={() => setCreationMode('photo')}
                    className={`mode-toggle-button ${creationMode === 'photo' ? 'active' : ''}`}
                  >
                    <EyeIcon className="w-5 h-5" />
                    <div>
                      <div className="mode-title">Photo Story</div>
                      <div className="mode-description">AI analyzes image and creates story</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setCreationMode('ocr')}
                    className={`mode-toggle-button ${creationMode === 'ocr' ? 'active' : ''}`}
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                    <div>
                      <div className="mode-title">Text Extraction</div>
                      <div className="mode-description">Extract text from image using OCR</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Photo Capture/Upload Section */}
              <div className="form-section">
                <label className="form-label">
                  <PhotoIcon className="w-5 h-5" />
                  Your Photo
                </label>
                
                {formData.capturedImage ? (
                  /* Photo Preview */
                  <div className="photo-preview">
                    <img 
                      src={formData.capturedImage} 
                      alt="Captured" 
                      className="preview-image"
                    />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, capturedImage: null }))}
                      className="remove-photo-button"
                    >
                      <XMarkIcon className="w-5 h-5" />
                      Remove Photo
                    </button>
                  </div>
                ) : showCamera ? (
                  /* Camera View */
                  <div className="camera-container">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline
                      muted
                      className="camera-video"
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <div className="camera-overlay">
                      <div className="camera-frame" />
                      <div className="camera-hint">Position your subject in the frame</div>
                    </div>
                    <div className="camera-controls">
                      <button onClick={capturePhoto} className="capture-button">
                        <CameraIcon className="w-6 h-6" />
                        Capture Photo
                      </button>
                      <button onClick={stopCamera} className="cancel-button">
                        <XMarkIcon className="w-5 h-5" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Photo Options */
                  <div className="photo-options">
                    <button onClick={startCamera} className="photo-option-button">
                      <CameraIcon className="w-8 h-8" />
                      <span>Take Photo</span>
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="photo-option-button"
                    >
                      <PhotoIcon className="w-8 h-8" />
                      <span>Upload Photo</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}
              </div>

              {/* OCR Mode: Handwriting Toggle and Extract Button */}
              {creationMode === 'ocr' && formData.capturedImage && !ocrResult && (
                <>
                  <div className="form-section">
                    <label className="form-label">
                      ✍️ Text Type
                    </label>
                    <div className="handwriting-toggle">
                      <label className="toggle-option">
                        <input
                          type="checkbox"
                          checked={isHandwritten}
                          onChange={(e) => setIsHandwritten(e.target.checked)}
                          className="toggle-checkbox"
                        />
                        <div className="toggle-content">
                          <div className="toggle-title">✍️ Handwritten Text</div>
                          <div className="toggle-description">
                            Enable for better recognition of handwritten notes, letters, or documents
                          </div>
                        </div>
                      </label>
                    </div>
                    {import.meta.env.VITE_OCR_SPACE_API_KEY ? (
                      <div style={{ 
                        marginTop: '0.5rem', 
                        padding: '0.75rem', 
                        backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#86efac' : '#15803d',
                        border: '1px solid',
                        borderColor: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.2)'
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>🌐 Powered by OCR.space API</div>
                        <div style={{ fontSize: '0.8125rem', opacity: 0.9 }}>
                          Cloud-based OCR with great accuracy on handwriting. Free tier: 25,000 requests/month!
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        marginTop: '0.5rem', 
                        padding: '0.75rem', 
                        backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#93c5fd' : '#1e40af',
                        border: '1px solid',
                        borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)'
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>📖 Powered by Tesseract.js</div>
                        <div style={{ fontSize: '0.8125rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                          Free offline OCR. For better handwriting recognition, get a free OCR.space API key!
                        </div>
                        <a 
                          href="https://ocr.space/ocrapi" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            fontSize: '0.8125rem', 
                            textDecoration: 'underline',
                            color: isDarkMode ? '#60a5fa' : '#2563eb'
                          }}
                        >
                          Get free API key (no credit card) →
                        </a>
                      </div>
                    )}
                    <div className="ocr-tips" style={{ 
                      marginTop: '0.75rem', 
                      padding: '0.75rem', 
                      backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      color: isDarkMode ? '#93c5fd' : '#1e40af'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>💡 Tips for best results:</div>
                      <ul style={{ paddingLeft: '1.25rem', margin: 0, lineHeight: '1.6' }}>
                        {isHandwritten ? (
                          <>
                            <li>Use clear, legible handwriting (block letters work best)</li>
                            <li>Ensure good lighting and avoid shadows</li>
                            <li>Hold camera perpendicular to the paper</li>
                            <li>Use high contrast (dark pen on white paper)</li>
                          </>
                        ) : (
                          <>
                            <li>Use good lighting and avoid glare</li>
                            <li>Keep text in focus and camera steady</li>
                            <li>Position camera perpendicular to text</li>
                            <li>Works best with printed text and clear fonts</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="form-section">
                    <button 
                      onClick={handleExtractText}
                      disabled={isExtractingText}
                      className="modal-button-primary w-full"
                    >
                      <DocumentTextIcon className="w-5 h-5" />
                      {isExtractingText ? 'Extracting Text...' : `Extract ${isHandwritten ? 'Handwritten' : 'Printed'} Text`}
                    </button>
                  </div>
                </>
              )}

              {/* OCR Result Display */}
              {creationMode === 'ocr' && ocrResult && (
                <div className="form-section">
                  <label className="form-label">
                    <DocumentTextIcon className="w-5 h-5" />
                    Extracted Text ({ocrResult.text.length} characters)
                  </label>
                  <div className="ocr-result-container">
                    <textarea
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      className="form-textarea ocr-textarea"
                      rows={8}
                      placeholder="Extracted text will appear here..."
                    />
                    <div className="ocr-actions">
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            additionalContext: extractedText
                          }));
                          setCreationMode('photo');
                        }}
                        className="ocr-action-button"
                      >
                        <SparklesIcon className="w-4 h-4" />
                        Use as Story Context
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(extractedText);
                          alert('Text copied to clipboard!');
                        }}
                        className="ocr-action-button"
                      >
                        📋 Copy Text
                      </button>
                      <button
                        onClick={() => {
                          setOcrResult(null);
                          setExtractedText('');
                        }}
                        className="ocr-action-button danger"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                        Re-extract
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Context */}
              {formData.capturedImage && creationMode === 'photo' && (
                <>
                  <div className="form-section">
                    <label className="form-label">
                      <SparklesIcon className="w-5 h-5" />
                      Additional Context (Optional)
                    </label>
                    <VoiceFilteredTextarea
                      value={formData.additionalContext}
                      onChange={(value: string) => setFormData(prev => ({ 
                        ...prev, 
                        additionalContext: value 
                      }))}
                      placeholder="e.g., Make it an adventure story, Include a magical element... (or click mic to speak)"
                      className="form-textarea"
                      rows={3}
                      showWarning={true}
                    />
                  </div>

                  {/* Art Style Selection */}
                  <div className="form-section">
                    <label className="form-label">
                      <PaintBrushIcon className="w-5 h-5" />
                      Art Style
                    </label>
                    <div className="art-style-grid">
                      {ART_STYLE_OPTIONS.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            selectedArtStyle: style.id 
                          }))}
                          className={`art-style-button ${
                            formData.selectedArtStyle === style.id ? 'selected' : ''
                          }`}
                        >
                          <span className="art-style-emoji">{style.icon}</span>
                          <span className="art-style-name">{style.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Genre Selection - Multi-select */}
                  <div className="form-section">
                    <label className="form-label">
                      <SparklesIcon className="w-5 h-5" />
                      Genre (Select 1-3)
                    </label>
                    <div className="art-style-grid">
                      {AI_GENRE_OPTIONS.map((genre) => (
                        <button
                          key={genre.id}
                          onClick={() => {
                            setFormData(prev => {
                              const isSelected = prev.selectedGenres.includes(genre.id);
                              if (isSelected) {
                                // Remove genre
                                return {
                                  ...prev,
                                  selectedGenres: prev.selectedGenres.filter(g => g !== genre.id)
                                };
                              } else {
                                // Add genre (max 3)
                                if (prev.selectedGenres.length < 3) {
                                  return {
                                    ...prev,
                                    selectedGenres: [...prev.selectedGenres, genre.id]
                                  };
                                }
                                return prev;
                              }
                            });
                          }}
                          className={`art-style-button ${formData.selectedGenres?.includes(genre.id) ? 'selected' : ''}`}
                        >
                          <span className="art-style-emoji">{genre.icon}</span>
                          <span className="art-style-name">{genre.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language Selection */}
                  <div className="form-section">
                    <label className="form-label">
                      🌐 Story Language
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, storyLanguage: 'en' }))}
                        className={`art-style-button ${formData.storyLanguage === 'en' ? 'selected' : ''}`}
                        style={{ flex: 1 }}
                      >
                        <span className="art-style-emoji">🇺🇸</span>
                        <span className="art-style-name">English</span>
                      </button>
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, storyLanguage: 'tl' }))}
                        className={`art-style-button ${formData.storyLanguage === 'tl' ? 'selected' : ''}`}
                        style={{ flex: 1 }}
                      >
                        <span className="art-style-emoji">🇵🇭</span>
                        <span className="art-style-name">Tagalog</span>
                      </button>
                    </div>
                  </div>

                  {/* Page Count */}
                  <div className="form-section">
                    <label className="form-label">
                      Story Length: {formData.pageCount} pages
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="15"
                      step="5"
                      value={formData.pageCount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        pageCount: parseInt(e.target.value) 
                      }))}
                      className="form-range"
                    />
                    <div className="range-labels">
                      <span>Short (5)</span>
                      <span>Medium (10)</span>
                      <span>Long (15)</span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isGenerating && !isExtractingText && formData.capturedImage && creationMode === 'photo' && (
          <div className="modal-footer">
            <button onClick={handleClose} className="modal-button-secondary">
              Cancel
            </button>
            <button 
              onClick={handleGenerateStory}
              disabled={!formData.selectedArtStyle || formData.selectedGenres.length === 0}
              className="modal-button-primary"
            >
              <SparklesIcon className="w-5 h-5" />
              Generate Story
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoStoryModal;
