import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  SparklesIcon, 
  XMarkIcon, 
  BuildingLibraryIcon, 
  RocketLaunchIcon, 
  MagnifyingGlassIcon, 
  BoltIcon, 
  HeartIcon, 
  FaceSmileIcon, 
  AcademicCapIcon,
  HandRaisedIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { useThemeStore } from '../../stores/themeStore';
import { useStoryStore } from '../../stores/storyStore';
import { useI18nStore } from '../../stores/i18nStore';
import { ART_STYLE_OPTIONS, AI_GENRE_OPTIONS } from '../../constants/genres';
import { VoiceFilteredTextarea } from '../common/VoiceFilteredTextarea';
import { ImageGenerationWarningModal } from '../ui/ImageGenerationWarningModal';
import { useSoundEffects } from '../../hooks/useSoundEffects';


interface AIStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StoryFormData {
  storyIdea: string;
  selectedGenres: string[]; // Changed to array for multiple selection
  selectedArtStyle: string | null;
  pageCount: number; // Number of pages to generate
  storyLanguage: 'en' | 'tl'; // Language for story content (independent of interface language)
}

const AIStoryModal = ({ isOpen, onClose }: AIStoryModalProps) => {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const { createStory, updateStory, addPage, updatePage, syncStoryToBackend } = useStoryStore();
  const { language, t } = useI18nStore();
  const { playSound, playSuccess, playError } = useSoundEffects();
  const [formData, setFormData] = useState<StoryFormData>({
    storyIdea: '',
    selectedGenres: [], // Changed to array
    selectedArtStyle: null,
    pageCount: 5, // Default 5 pages
    storyLanguage: language as 'en' | 'tl' // Use current app language
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [imageGenerationWarnings, setImageGenerationWarnings] = useState<string[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);


  // Genre options from design profile with specific colors
  const genres = [
    { 
      id: 'fantasy', 
      name: 'Fantasy', 
      icon: BuildingLibraryIcon,
      color: '#A78BFA' // Purple
    },
    { 
      id: 'adventure', 
      name: 'Adventure', 
      icon: RocketLaunchIcon,
      color: '#06B6D4' // Cyan
    },
    { 
      id: 'mystery', 
      name: 'Mystery', 
      icon: MagnifyingGlassIcon,
      color: '#6366F1' // Indigo
    },
    { 
      id: 'action', 
      name: 'Action', 
      icon: HandRaisedIcon,
      color: '#EF4444' // Red
    },
    { 
      id: 'friendship', 
      name: 'Friendship', 
      icon: HeartIcon,
      color: '#EC4899' // Pink
    },
    { 
      id: 'sciFi', 
      name: 'Sci-Fi', 
      icon: BoltIcon,
      color: '#22D3EE' // Light Cyan
    },
    { 
      id: 'comedy', 
      name: 'Comedy', 
      icon: FaceSmileIcon,
      color: '#F59E0B' // Yellow
    },
    { 
      id: 'educational', 
      name: 'Educational', 
      icon: AcademicCapIcon,
      color: '#10B981' // Green
    }
  ];

  const handleReset = () => {
    setFormData({
      storyIdea: '',
      selectedGenres: [],
      selectedArtStyle: null,
      pageCount: 5,
      storyLanguage: 'en'
    });
    setIsGenerating(false);
    setImageGenerationWarnings([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleGenerate = async () => {
    if (!formData.storyIdea.trim()) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      console.log('Generating story with:', formData);
      
      // Stage 1: Writing the story
      setGenerationStage('✨ Creating your magical story...');
      setGenerationProgress(20);
      
      // Import the Gemini proxy service (secure - API key stays on backend)
      const { generateStoryWithGemini } = await import('../../services/geminiProxyService');
      
      // Build comprehensive prompt
      const selectedGenreNames = formData.selectedGenres.map(id => genres.find(g => g.id === id)?.name || id).join(', ');
      const fullPrompt = `
Generate a ${selectedGenreNames} story for children aged 6-8 with ${formData.pageCount} pages.
Art Style: ${formData.selectedArtStyle || 'cartoon'}
Language: ${formData.storyLanguage === 'tl' ? 'Tagalog' : 'English'}

Story Idea: ${formData.storyIdea}

Please create a complete story with title, description, and pages in JSON format.
Each page should have text and an imagePrompt for illustration generation.
      `.trim();
      
      // Call Gemini API via secure backend proxy
      const generatedText = await generateStoryWithGemini(fullPrompt, {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 16384,
      });
      
      setGenerationProgress(40);
      console.log('Generated story text:', generatedText);
      
      // Parse the JSON response from Gemini
      let storyData;
      try {
        console.log('Raw generated text length:', generatedText.length);
        
        // Extract JSON from markdown code blocks if present
        let jsonText = generatedText;
        
        // Try different markdown patterns
        const patterns = [
          /```json\s*([\s\S]*?)\s*```/,  // ```json ... ```
          /```\s*([\s\S]*?)\s*```/,       // ``` ... ```
          /`([\s\S]*?)`/                   // ` ... `
        ];
        
        for (const pattern of patterns) {
          const match = generatedText.match(pattern);
          if (match) {
            jsonText = match[1].trim();
            break;
          }
        }
        
        // If no code blocks found, try to find JSON object directly
        if (jsonText === generatedText) {
          const jsonStart = generatedText.indexOf('{');
          const jsonEnd = generatedText.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            jsonText = generatedText.substring(jsonStart, jsonEnd + 1);
          }
        }
        
        // Clean up common JSON issues
        console.log('Cleaning JSON text...');
        jsonText = jsonText
          // Remove trailing commas before closing braces/brackets
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          // Fix escaped quotes in strings
          .replace(/\\'/g, "'")
          // Remove any BOM or special characters at start
          .replace(/^\uFEFF/, '')
          .trim();
        
        console.log('Attempting to parse JSON (length:', jsonText.length, ')');
        
        // Try to parse
        try {
          storyData = JSON.parse(jsonText);
        } catch (firstError) {
          console.warn('First parse attempt failed:', firstError);
          
          // Try more aggressive cleaning
          console.log('Attempting aggressive JSON repair...');
          
          // Find the last complete closing brace
          let braceCount = 0;
          let lastValidIndex = -1;
          for (let i = 0; i < jsonText.length; i++) {
            if (jsonText[i] === '{') braceCount++;
            if (jsonText[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                lastValidIndex = i;
              }
            }
          }
          
          if (lastValidIndex > 0) {
            jsonText = jsonText.substring(0, lastValidIndex + 1);
            console.log('Truncated to last valid brace at position:', lastValidIndex);
            storyData = JSON.parse(jsonText);
          } else {
            throw firstError;
          }
        }
        
        // Validate that pages have imagePrompt field
        if (storyData.pages && Array.isArray(storyData.pages)) {
          const pagesWithPrompts = storyData.pages.filter((p: any) => p.imagePrompt);
          console.log(`Story has ${storyData.pages.length} pages, ${pagesWithPrompts.length} have imagePrompt`);
          if (pagesWithPrompts.length > 0) {
            console.log('Sample imagePrompt from first page:', storyData.pages[0].imagePrompt?.substring(0, 150) + '...');
          }
        }
      } catch (parseError: any) {
        console.error('Failed to parse story JSON:', parseError);
        console.error('Error message:', parseError.message);
        
        // Log the problematic area
        if (parseError.message && parseError.message.includes('position')) {
          const posMatch = parseError.message.match(/position (\d+)/);
          if (posMatch) {
            const pos = parseInt(posMatch[1]);
            const start = Math.max(0, pos - 100);
            const end = Math.min(generatedText.length, pos + 100);
            console.error('Context around error position:', generatedText.substring(start, end));
            console.error('Error at character:', generatedText[pos]);
          }
        }
        
        // Save the failed response for debugging
        console.error('Full generated text saved to console');
        console.log('===== FAILED JSON START =====');
        console.log(generatedText);
        console.log('===== FAILED JSON END =====');
        
        throw new Error(`Failed to parse generated story. The AI response was malformed at position ${parseError.message}. Please try again with a simpler prompt or fewer pages.`);
      }
      
      // Create the story in the store
      const genreNames = formData.selectedGenres.map(id => genres.find(g => g.id === id)?.name || id);
      const newStory = createStory(storyData.title || 'AI Generated Story');
      
      console.log('📝 AI-generated description:', storyData.description);
      
      // Update story metadata with AI-generated description
      updateStory(newStory.id, {
        description: storyData.description || formData.storyIdea, // Use AI-generated description, fallback to user input
        genre: genreNames.join(', '),
        tags: genreNames,
        language: formData.storyLanguage, // Set the story language
        creationType: 'ai_assisted', // Mark as AI-assisted for achievement tracking
        isDraft: false, // Mark as saved since it's AI generated
        isPublished: false // Not published yet, but saved as a complete work
      });
      
      // Stage 2: Generate COVER illustration FIRST
      setGenerationStage('🎨 Creating your story cover...');
      setGenerationProgress(45);
      
      console.log('Generating cover illustration...');
      const { generateCoverIllustration, generateStoryIllustrations } = await import('../../services/imageGenerationService');
      
      let coverUrl: string | null = null;
      const warnings: string[] = [];
      
      try {
        coverUrl = await generateCoverIllustration(
          storyData.title || 'AI Generated Story',
          formData.storyIdea,
          formData.selectedArtStyle || 'cartoon',
          storyData.characterDescription,
          storyData.colorScheme
        );
        
        console.log('Generated cover URL:', coverUrl);
        
        // Save cover to story
        updateStory(newStory.id, {
          coverImage: coverUrl
        });
      } catch (error) {
        console.error('Failed to generate cover illustration:', error);
        warnings.push('Cover image failed to generate');
      }
      
      // Stage 3: Generate page illustrations using Gemini's detailed image prompts
      setGenerationStage('🎨 Drawing page illustrations...');
      setGenerationProgress(60);
      
      console.log('Generating page illustrations with detailed prompts from Gemini');
      console.log('Character description:', storyData.characterDescription);
      console.log('Color scheme:', storyData.colorScheme);
      console.log('Using Gemini-generated image prompts for each page');
      
      // Import the new function that uses Gemini's detailed prompts directly
      const { generateStoryIllustrationsFromPrompts } = await import('../../services/imageGenerationService');
      
      // Use Gemini's detailed imagePrompt for each page
      let imageUrls: (string | null)[] = [];
      try {
        imageUrls = await generateStoryIllustrationsFromPrompts(
          storyData.pages || [],
          storyData.characterDescription // Pass character description for seed consistency
        );
        
        console.log('Generated page image URLs:', imageUrls);
        
        // Check for failed images
        const failedImages = imageUrls.filter(url => !url).length;
        if (failedImages > 0) {
          warnings.push(`${failedImages} page illustration(s) failed to generate`);
        }
      } catch (error) {
        console.error('Failed to generate page illustrations:', error);
        warnings.push('Page illustrations failed to generate');
        imageUrls = new Array(storyData.pages?.length || 0).fill(null);
      }
      
      // Update warnings state
      setImageGenerationWarnings(warnings);
      
      // Add pages from the generated story with illustrations
      if (storyData.pages && Array.isArray(storyData.pages)) {
        // Remove the default empty page
        const defaultPage = newStory.pages[0];
        
        // Add all generated pages with illustrations
        storyData.pages.forEach((pageData: any, index: number) => {
          const pageText = pageData.text || '';
          const imageUrl = imageUrls[index];
          
          if (index === 0) {
            // Update the first page instead of creating new
            updatePage(newStory.id, defaultPage.id, {
              text: pageText,
              canvasData: imageUrl || undefined, // Save image as canvas data
              order: index
            });
          } else {
            // Add new pages with image
            const newPage = addPage(newStory.id, pageText);
            if (imageUrl && newPage) {
              updatePage(newStory.id, newPage.id, {
                canvasData: imageUrl
              });
            }
          }
        });
      }
      
      // Stage 4: Organizing pages
      setGenerationStage('📖 Organizing your story pages...');
      setGenerationProgress(85);
      
      console.log('Story created successfully:', newStory);
      
      // Mark story as complete (not a draft) but keep it private until user publishes
      updateStory(newStory.id, { 
        isPublished: false, // Keep in private library - user can publish later
        isDraft: false // Mark as complete work
      });
      
      // CRITICAL: Immediately sync AI-generated story to backend
      // Don't wait for the debounce timer - sync now to prevent data loss
      setGenerationStage('💾 Saving to cloud...');
      setGenerationProgress(90);
      
      try {
        await syncStoryToBackend(newStory.id);
        console.log('✅ AI story synced to backend immediately');
      } catch (error) {
        console.warn('⚠️ Failed to sync AI story to backend:', error);
        // Don't fail the generation - story is still safe in localStorage
      }
      
      // Small delay to show the stage
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGenerationProgress(100);
      
      // Show appropriate completion message based on warnings
      if (warnings.length > 0) {
        setGenerationStage('⚠️ Story created with warnings');
        playSound('warning');
      } else {
        setGenerationStage('✅ Your story is ready!');
        playSound('magic-sparkle');
      }
      
      // Wait a moment to show warnings if any
      await new Promise(resolve => setTimeout(resolve, warnings.length > 0 ? 1500 : 1000));
      
      // Show warning modal if there were image generation failures
      if (warnings.length > 0) {
        setShowWarningModal(true);
        // Store the story ID to navigate after modal closes
        (window as any).pendingStoryNavigation = newStory.id;
      } else {
        // Close modal and navigate to the story
        handleClose();
        navigate(`/story/${newStory.id}`);
      }
      
    } catch (error) {
      console.error('Error generating story:', error);
      playError();
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate story';
      alert(`Error: ${errorMessage}\n\nMake sure your Gemini API key is configured correctly.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = () => {
    return formData.storyIdea.trim().length > 0;
  };

  const handleGenreToggle = (genreId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedGenres: prev.selectedGenres.includes(genreId)
        ? prev.selectedGenres.filter(g => g !== genreId)
        : [...prev.selectedGenres, genreId]
    }));
  };

  const handleArtStyleSelect = (styleId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedArtStyle: prev.selectedArtStyle === styleId ? null : styleId
    }));
  };

  const handleWarningModalClose = () => {
    setShowWarningModal(false);
    handleClose();
    
    // Navigate to the story after closing the warning modal
    const storyId = (window as any).pendingStoryNavigation;
    if (storyId) {
      navigate(`/story/${storyId}`);
      delete (window as any).pendingStoryNavigation;
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className={`modal-content ${isDarkMode ? 'dark' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {isGenerating ? (
          /* Beautiful Loading Animation */
          <div style={{ padding: '40px', textAlign: 'center' }}>
            {/* Animated Icon */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              marginBottom: '24px',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <SparklesIcon style={{ 
                height: '40px', 
                width: '40px', 
                color: 'white',
                animation: 'spin 3s linear infinite'
              }} />
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
              borderRadius: '999px',
              overflow: 'hidden',
              marginBottom: '16px'
            }}>
              <div style={{
                width: `${generationProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '999px',
                transition: 'width 0.5s ease-out'
              }} />
            </div>

            {/* Stage Text */}
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
              marginBottom: '8px'
            }}>
              {generationStage}
            </h3>

            {/* Progress Percentage */}
            <p style={{
              fontSize: '14px',
              color: isDarkMode ? '#9ca3af' : '#6b7280'
            }}>
              {generationProgress}% complete
            </p>

            {/* Fun Loading Messages */}
            <p style={{
              fontSize: '12px',
              color: isDarkMode ? '#6b7280' : '#9ca3af',
              marginTop: '24px',
              fontStyle: 'italic'
            }}>
              {generationProgress < 40 && "Sprinkling magic dust..."}
              {generationProgress >= 40 && generationProgress < 50 && "Painting your book cover..."}
              {generationProgress >= 50 && generationProgress < 75 && "Bringing pages to life..."}
              {generationProgress >= 75 && generationProgress < 100 && "Adding final touches..."}
              {generationProgress === 100 && "Almost there!"}
            </p>

            <style>{`
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
              }
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon-badge">
                  <SparklesIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="modal-title">Create AI Story</h2>
                  <p className="modal-subtitle">
                    Tell us about your story idea and we'll bring it to life with magical illustrations
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="modal-close-button">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body">
              {/* Story Idea Input */}
              <div className="form-section">
                <label className="form-label">
                  <SparklesIcon className="w-5 h-5" />
                  What's your story about?
                </label>
                <VoiceFilteredTextarea
                  value={formData.storyIdea}
                  onChange={(value: string) => setFormData(prev => ({ ...prev, storyIdea: value }))}
                  placeholder="E.g., A brave dragon who's afraid of flying... (or click mic to speak)"
                  className="form-textarea"
                  rows={4}
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
                      onClick={() => handleArtStyleSelect(style.id)}
                      className={`art-style-button ${formData.selectedArtStyle === style.id ? 'selected' : ''}`}
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
                      onClick={() => handleGenreToggle(genre.id)}
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

              {/* Page Count Slider */}
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
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button onClick={handleClose} className="modal-button-secondary">
                Cancel
              </button>
              <button 
                onClick={handleGenerate}
                disabled={!canGenerate() || isGenerating}
                className="modal-button-primary"
              >
                <SparklesIcon className="w-5 h-5" />
                Generate My Story
              </button>
            </div>
          </>
        )}
      </div>
    </div>

    {/* Warning Modal */}
    <ImageGenerationWarningModal
      isOpen={showWarningModal}
      onClose={handleWarningModalClose}
      warnings={imageGenerationWarnings}
    />
    </>
  );
};

export default AIStoryModal;
