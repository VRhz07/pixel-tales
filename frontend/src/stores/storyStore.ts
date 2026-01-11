import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuthStore } from './authStore';
import { storyApiService } from '../services/storyApiService';
import { createHybridStorage } from '../utils/hybridStorage';

export interface StoryPage {
  id: string;
  text: string;
  canvasData?: string; // Base64 encoded canvas data
  canvasOperations?: any[]; // Drawing operations for collaboration sync
  canvasDrawingState?: any; // Full Paper.js drawing state for solo mode
  characterIds: string[]; // IDs of characters on this page
  order: number;
}

export interface Story {
  id: string;
  backendId?: number; // Django database ID for syncing
  title: string;
  author?: string; // Author name
  authors_names?: string[]; // Co-authors for collaborative stories
  is_collaborative?: boolean; // Whether this is a collaborative story
  description?: string;
  pages: StoryPage[];
  coverImage?: string; // Base64 encoded cover image
  coverImageOperations?: any[]; // Drawing operations for cover image collaboration sync
  coverImageDrawingState?: any; // Full Paper.js drawing state for cover image solo mode
  genre?: string;
  ageGroup?: string;
  illustrationStyle?: string;
  language?: string; // Story language (en, tl, etc.)
  creationType?: 'manual' | 'ai_assisted'; // Track creation method for achievements
  createdAt: Date;
  lastModified: Date;
  wordCount: number;
  isPublished: boolean;
  isDraft: boolean; // True when story has unsaved changes
  tags: string[];
}

export interface Character {
  id: string;
  name: string;
  description: string;
  imageData?: string; // Base64 encoded character image
  personality: string[];
  tags: string[];
  createdAt: Date;
  usedInStories: string[]; // Story IDs where this character is used
}

// User-specific library data structure
interface UserLibrary {
  stories: Story[];
  characters: Character[];
  offlineStories: Story[]; // Stories saved for offline reading
  deletedStoryIds: number[]; // Backend IDs of stories that have been deleted
}

// Debounce timers for syncing (to prevent duplicate story creation)
const syncTimers: Record<string, ReturnType<typeof setTimeout>> = {};

interface StoryState {
  // User-specific libraries (keyed by user ID)
  userLibraries: Record<string, UserLibrary>;
  currentUserId: string | null;
  
  // Current session data
  currentStory: Story | null;
  currentPageIndex: number;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // User management
  setCurrentUser: (userId: string | null) => void;
  clearUserData: (userId: string) => void;
  
  // Story CRUD Operations
  createStory: (title: string) => Story;
  updateStory: (id: string, updates: Partial<Story>) => void;
  deleteStory: (id: string) => void;
  getStory: (id: string) => Story | undefined;
  setCurrentStory: (story: Story | null) => void;
  
  // Page Operations
  addPage: (storyId: string, text?: string) => StoryPage;
  addPageWithId: (storyId: string, pageId: string, text?: string) => StoryPage;
  insertPageAt: (storyId: string, index: number, text?: string) => StoryPage;
  insertPageAtWithId: (storyId: string, index: number, pageId: string, text?: string) => StoryPage;
  updatePage: (storyId: string, pageId: string, updates: Partial<StoryPage>) => void;
  deletePage: (storyId: string, pageId: string) => void;
  reorderPages: (storyId: string, pageIds: string[]) => void;
  setCurrentPageIndex: (index: number) => void;
  
  // Character Operations
  createCharacter: (name: string, description: string) => Character;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  getCharacter: (id: string) => Character | undefined;
  
  // Canvas Operations
  saveCanvasData: (storyId: string, pageId: string, canvasData: string) => void;
  getCanvasData: (storyId: string, pageId: string) => string | undefined;
  
  // Utility Functions
  calculateWordCount: (storyId: string) => number;
  getRecentStories: (limit?: number) => Story[];
  getDraftStories: (limit?: number) => Story[];
  getPublishedStories: (limit?: number) => Story[];
  searchStories: (query: string) => Story[];
  exportStory: (id: string) => string;
  importStory: (data: string) => Story;
  publishStory: (id: string) => void;
  unpublishStory: (id: string) => void;
  markAsDraft: (id: string) => void;
  markAsSaved: (id: string) => void;
  
  // API Sync Operations
  syncStoriesToBackend: () => Promise<void>;
  loadStoriesFromBackend: () => Promise<void>;
  syncStoryToBackend: (id: string) => Promise<string>; // Returns backend ID
  
  // Statistics
  getStats: () => {
    totalStories: number;
    totalPages: number;
    totalWords: number;
    totalCharacters: number;
  };
  
  // Computed getters for current user
  stories: Story[];
  characters: Character[];
  offlineStories: Story[];
  
  // Offline story management
  saveStoryOffline: (story: Story) => void;
  removeOfflineStory: (storyId: string) => void;
  isStorySavedOffline: (storyId: string) => boolean;
  
  // Demo data management
  initializeDemoData: () => void;
  resetToDemoData: () => void;
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Demo data for John Doe VIP account
const demoStories: Story[] = [
  {
    id: 'story-1',
    title: 'The Magical Forest Adventure',
    author: 'John Doe',
    description: 'A young explorer discovers a hidden world filled with talking animals and mystical creatures.',
    pages: [
      {
        id: 'page-1-1',
        text: 'Once upon a time, in a small village nestled between rolling hills, lived a curious young girl named Luna. She had always been fascinated by the mysterious forest that bordered her hometown.',
        characterIds: ['char-1'],
        order: 0
      },
      {
        id: 'page-1-2',
        text: 'One sunny morning, Luna decided to venture into the forest. As she walked deeper into the woods, she noticed the trees seemed to whisper secrets in the wind.',
        characterIds: ['char-1', 'char-2'],
        order: 1
      },
      {
        id: 'page-1-3',
        text: 'Suddenly, a wise old owl perched on a branch above her spoke: "Welcome, young adventurer. You have entered the realm where magic still lives."',
        characterIds: ['char-1', 'char-2'],
        order: 2
      }
    ],
    genre: 'Fantasy',
    ageGroup: '8-12',
    illustrationStyle: 'Watercolor',
    createdAt: new Date('2024-09-15'),
    lastModified: new Date('2024-09-20'),
    wordCount: 156,
    isPublished: true,
    isDraft: false,
    tags: ['adventure', 'magic', 'forest', 'animals']
  },
  {
    id: 'story-2',
    title: 'Captain Stardust\'s Space Journey',
    author: 'John Doe',
    description: 'An intergalactic adventure following Captain Stardust as she explores distant planets and meets alien friends.',
    pages: [
      {
        id: 'page-2-1',
        text: 'Captain Stardust adjusted her silver helmet and looked out at the vast expanse of space through her ship\'s viewport. Today would be the day she discovered a new planet.',
        characterIds: ['char-3'],
        order: 0
      },
      {
        id: 'page-2-2',
        text: 'Her spaceship, the Cosmic Wanderer, hummed softly as it approached a beautiful blue and green planet with three moons orbiting around it.',
        characterIds: ['char-3'],
        order: 1
      }
    ],
    genre: 'Science Fiction',
    ageGroup: '6-10',
    illustrationStyle: 'Digital Art',
    createdAt: new Date('2024-09-10'),
    lastModified: new Date('2024-09-18'),
    wordCount: 89,
    isPublished: true,
    isDraft: false,
    tags: ['space', 'adventure', 'planets', 'exploration']
  },
  {
    id: 'story-3',
    title: 'The Dragon\'s Secret Garden',
    author: 'John Doe',
    description: 'A friendly dragon tends to a magical garden where flowers grant wishes to those pure of heart.',
    pages: [
      {
        id: 'page-3-1',
        text: 'Deep in the mountains, where clouds kissed the peaks, lived Ember the dragon. Unlike other dragons, Ember didn\'t hoard gold - she collected seeds.',
        characterIds: ['char-4'],
        order: 0
      }
    ],
    genre: 'Fantasy',
    ageGroup: '5-9',
    illustrationStyle: 'Cartoon',
    createdAt: new Date('2024-09-25'),
    lastModified: new Date('2024-09-28'),
    wordCount: 45,
    isPublished: false,
    isDraft: true,
    tags: ['dragon', 'garden', 'magic', 'friendship']
  },
  {
    id: 'story-4',
    title: 'The Time-Traveling Bicycle',
    author: 'John Doe',
    description: 'A mysterious bicycle takes its rider on adventures through different time periods.',
    pages: [
      {
        id: 'page-4-1',
        text: 'Tommy found the old bicycle in his grandmother\'s attic. It was covered in dust and had strange symbols carved into its frame.',
        characterIds: ['char-5'],
        order: 0
      }
    ],
    genre: 'Adventure',
    ageGroup: '8-12',
    illustrationStyle: 'Comic Book',
    createdAt: new Date('2024-09-30'),
    lastModified: new Date('2024-10-02'),
    wordCount: 32,
    isPublished: false,
    isDraft: true,
    tags: ['time travel', 'bicycle', 'adventure', 'history']
  }
];

const demoCharacters: Character[] = [
  {
    id: 'char-1',
    name: 'Luna the Explorer',
    description: 'A brave and curious young girl with a love for adventure and discovery.',
    personality: ['brave', 'curious', 'kind', 'determined'],
    tags: ['protagonist', 'human', 'adventurer'],
    createdAt: new Date('2024-09-15'),
    usedInStories: ['story-1']
  },
  {
    id: 'char-2',
    name: 'Wisdom the Owl',
    description: 'An ancient and wise owl who serves as a guide to lost travelers in the magical forest.',
    personality: ['wise', 'patient', 'mysterious', 'helpful'],
    tags: ['mentor', 'animal', 'magical'],
    createdAt: new Date('2024-09-15'),
    usedInStories: ['story-1']
  },
  {
    id: 'char-3',
    name: 'Captain Stardust',
    description: 'A fearless space explorer with a heart full of wonder and a mission to discover new worlds.',
    personality: ['brave', 'adventurous', 'optimistic', 'leader'],
    tags: ['protagonist', 'human', 'space explorer'],
    createdAt: new Date('2024-09-10'),
    usedInStories: ['story-2']
  },
  {
    id: 'char-4',
    name: 'Ember the Garden Dragon',
    description: 'A gentle dragon who tends to a magical garden instead of hoarding treasure.',
    personality: ['gentle', 'nurturing', 'magical', 'peaceful'],
    tags: ['protagonist', 'dragon', 'magical'],
    createdAt: new Date('2024-09-25'),
    usedInStories: ['story-3']
  },
  {
    id: 'char-5',
    name: 'Tommy the Time Traveler',
    description: 'A young boy who discovers a magical bicycle that can transport him through time.',
    personality: ['curious', 'adventurous', 'smart', 'brave'],
    tags: ['protagonist', 'human', 'time traveler'],
    createdAt: new Date('2024-09-30'),
    usedInStories: ['story-4']
  }
];

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      // User-specific libraries
      userLibraries: {},
      currentUserId: null,
      
      // Current session data
      currentStory: null,
      currentPageIndex: 0,
      isLoading: false,
      error: null,
      
      // Computed getters for current user's data
      get stories() {
        try {
          const state = get();
          if (!state || !state.currentUserId) return [];
          const library = state.userLibraries?.[state.currentUserId];
          return library?.stories || [];
        } catch (error) {
          return [];
        }
      },
      
      get characters() {
        try {
          const state = get();
          if (!state || !state.currentUserId) return [];
          const library = state.userLibraries?.[state.currentUserId];
          return library?.characters || [];
        } catch (error) {
          return [];
        }
      },
      
      get offlineStories() {
        try {
          const state = get();
          if (!state || !state.currentUserId) return [];
          const library = state.userLibraries?.[state.currentUserId];
          return library?.offlineStories || [];
        } catch (error) {
          return [];
        }
      },
      
      // User management
      setCurrentUser: (userId: string | null) => {
        set({ currentUserId: userId });
        
        // Initialize library for new user if it doesn't exist
        if (userId && !get().userLibraries[userId]) {
          set((state) => ({
            userLibraries: {
              ...state.userLibraries,
              [userId]: {
                stories: [],
                characters: [],
                offlineStories: [],
                deletedStoryIds: []
              }
            }
          }));
        }
      },
      
      clearUserData: (userId: string) => {
        set((state) => {
          const newLibraries = { ...state.userLibraries };
          delete newLibraries[userId];
          return { userLibraries: newLibraries };
        });
      },

      // Story CRUD Operations
      createStory: (title: string) => {
        const state = get();
        if (!state.currentUserId) {
          console.error('âŒ Cannot create story: No user logged in');
          throw new Error('No user logged in');
        }
        
        // Get author name from auth store
        const authUser = useAuthStore.getState().user;
        const authorName = authUser?.name || authUser?.email?.split('@')[0] || 'Unknown Author';
        
        const newStory: Story = {
          id: generateId(),
          title: title || 'Untitled Story',
          author: authorName,
          pages: [{
            id: generateId(),
            text: '',
            characterIds: [],
            order: 0
          }],
          createdAt: new Date(),
          lastModified: new Date(),
          wordCount: 0,
          isPublished: false,
          isDraft: true, // New stories start as drafts
          tags: []
        };

        set((state) => {
          const currentLibrary = state.userLibraries[state.currentUserId!] || { stories: [], characters: [], offlineStories: [] };
          return {
            userLibraries: {
              ...state.userLibraries,
              [state.currentUserId!]: {
                ...currentLibrary,
                stories: [...currentLibrary.stories, newStory]
              }
            },
            currentStory: newStory,
            currentPageIndex: 0
          };
        });

        // Don't auto-sync empty stories - wait until they have content
        // Stories will sync when first page is added/updated

        return newStory;
      },

      updateStory: (id: string, updates: Partial<Story>) => {
        // Debug: Log what's being updated
        if (updates.pages) {
          console.log(`ðŸ“ updateStory called for ${id}:`, {
            updatingPages: true,
            pageCount: updates.pages.length,
            pagesWithImages: updates.pages.filter(p => p.canvasData).length,
            page1HasImage: !!updates.pages[0]?.canvasData,
            page1ImagePreview: updates.pages[0]?.canvasData?.substring(0, 50)
          });
        }
        
        set((state) => {
          if (!state.currentUserId) return state;
          
          const currentLibrary = state.userLibraries[state.currentUserId];
          if (!currentLibrary) return state;
          
          const updatedStories = currentLibrary.stories.map(story => 
            story.id === id 
              ? { 
                  ...story, 
                  ...updates, 
                  lastModified: new Date(),
                  wordCount: updates.pages ? 
                    updates.pages.reduce((count, page) => count + page.text.split(/\s+/).filter(word => word.length > 0).length, 0) :
                    story.wordCount
                }
              : story
          );
          
          const updatedCurrentStory = state.currentStory?.id === id 
            ? updatedStories.find(s => s.id === id) || null
            : state.currentStory;

          return {
            userLibraries: {
              ...state.userLibraries,
              [state.currentUserId]: {
                ...currentLibrary,
                stories: updatedStories
              }
            },
            currentStory: updatedCurrentStory
          };
        });

        // Auto-sync to backend after update (only if story has content)
        // Debounced to prevent creating duplicate stories during AI generation
        const updatedStory = get().userLibraries[get().currentUserId!]?.stories.find(s => s.id === id);
        const hasContent = updatedStory?.pages.some(page => page.text.trim().length > 0);
        
        // Skip auto-sync for AI stories that are still generating (don't have images yet)
        const isAiStoryGenerating = updatedStory?.creationType === 'ai_assisted' && 
          updatedStory.pages.length > 0 && 
          !updatedStory.pages[0]?.canvasData; // First page doesn't have image yet
        
        if (hasContent && !isAiStoryGenerating) {
          // Clear existing timer for this story
          if (syncTimers[id]) {
            clearTimeout(syncTimers[id]);
          }
          
          // Set new timer - only sync after 3 seconds of no updates
          // This prevents duplicate creation during rapid AI page generation
          syncTimers[id] = setTimeout(() => {
            const currentStory = get().userLibraries[get().currentUserId!]?.stories.find(s => s.id === id);
            
            // Only sync if story still exists and has content
            if (currentStory && currentStory.pages.some(p => p.text.trim().length > 0)) {
              get().syncStoryToBackend(id).catch(err => {
                // Silently fail if backend is unavailable - story is safe in localStorage
                if (err?.status !== 404) {
                  console.warn('Failed to sync story update to backend:', err);
                }
              });
            }
            delete syncTimers[id];
          }, 3000); // Increased to 3 seconds
        }
      },

      deleteStory: (id: string) => {
        // Get story BEFORE deleting from state
        const state = get();
        const story = state.userLibraries[state.currentUserId!]?.stories.find(s => s.id === id);
        
        set((state) => {
          if (!state.currentUserId) return state;
          
          const currentLibrary = state.userLibraries[state.currentUserId];
          if (!currentLibrary) return state;
          
          // Track deleted story backend ID to prevent it from reappearing
          const deletedIds = currentLibrary.deletedStoryIds || [];
          const updatedDeletedIds = story?.backendId 
            ? [...deletedIds, story.backendId]
            : deletedIds;
          
          return {
            userLibraries: {
              ...state.userLibraries,
              [state.currentUserId]: {
                ...currentLibrary,
                stories: currentLibrary.stories.filter(story => story.id !== id),
                deletedStoryIds: updatedDeletedIds
              }
            },
            currentStory: state.currentStory?.id === id ? null : state.currentStory,
            currentPageIndex: state.currentStory?.id === id ? 0 : state.currentPageIndex
          };
        });

        // Auto-sync deletion to backend
        if (story?.backendId) {
          storyApiService.deleteStory(story.backendId.toString()).catch(err => {
            // 404 is expected if story was already deleted
            if (err?.status === 404) {
              console.log('âœ… Story was already deleted from backend (or never synced)');
            } else {
              console.warn('âŒ Failed to delete story from backend:', err);
            }
          });
        } else {
          console.log('â„¹ï¸ Story has no backend ID, skipping backend deletion');
        }
      },

      getStory: (id: string) => {
        const state = get();
        if (!state.currentUserId) return undefined;
        
        // First check regular stories
        const regularStory = state.userLibraries[state.currentUserId]?.stories.find(story => story.id === id);
        if (regularStory) return regularStory;
        
        // If not found, check offline stories
        const offlineStory = state.userLibraries[state.currentUserId]?.offlineStories?.find(story => story.id === id);
        return offlineStory;
      },

      setCurrentStory: (story: Story | null) => {
        set({ currentStory: story, currentPageIndex: 0 });
      },

      // Page Operations
      addPage: (storyId: string, text = '') => {
        const story = get().getStory(storyId);
        if (!story) throw new Error('Story not found');

        const newPage: StoryPage = {
          id: generateId(),
          text,
          characterIds: [],
          order: story.pages.length
        };

        const updatedPages = [...story.pages, newPage];
        get().updateStory(storyId, { pages: updatedPages });

        return newPage;
      },

      addPageWithId: (storyId: string, pageId: string, text = '') => {
        const story = get().getStory(storyId);
        if (!story) throw new Error('Story not found');

        const newPage: StoryPage = {
          id: pageId,
          text,
          characterIds: [],
          order: story.pages.length
        };

        const updatedPages = [...story.pages, newPage];
        get().updateStory(storyId, { pages: updatedPages });

        return newPage;
      },

      insertPageAt: (storyId: string, index: number, text = '') => {
        const story = get().getStory(storyId);
        if (!story) throw new Error('Story not found');
        const clamped = Math.max(0, Math.min(index, story.pages.length));
        const newPage: StoryPage = {
          id: generateId(),
          text,
          characterIds: [],
          order: clamped
        };
        const updatedPages = [...story.pages];
        updatedPages.splice(clamped, 0, newPage);
        const reOrdered = updatedPages.map((p, i) => ({ ...p, order: i }));
        get().updateStory(storyId, { pages: reOrdered });
        return newPage;
      },

      insertPageAtWithId: (storyId: string, index: number, pageId: string, text = '') => {
        const story = get().getStory(storyId);
        if (!story) throw new Error('Story not found');
        const clamped = Math.max(0, Math.min(index, story.pages.length));
        const newPage: StoryPage = {
          id: pageId,
          text,
          characterIds: [],
          order: clamped
        };
        const updatedPages = [...story.pages];
        updatedPages.splice(clamped, 0, newPage);
        const reOrdered = updatedPages.map((p, i) => ({ ...p, order: i }));
        get().updateStory(storyId, { pages: reOrdered });
        return newPage;
      },

      updatePage: (storyId: string, pageId: string, updates: Partial<StoryPage>) => {
        const story = get().getStory(storyId);
        if (!story) {
          console.error('âŒ updatePage: Story not found:', storyId);
          return;
        }

        console.log(`ðŸ“ updatePage called: storyId=${storyId}, pageId=${pageId}`, {
          hasCanvasData: !!updates.canvasData,
          canvasDataPreview: updates.canvasData?.substring(0, 50),
          otherUpdates: Object.keys(updates).filter(k => k !== 'canvasData')
        });

        const updatedPages = story.pages.map(page =>
          page.id === pageId ? { ...page, ...updates } : page
        );
        
        console.log(`âœ… Updated pages:`, {
          totalPages: updatedPages.length,
          pagesWithImages: updatedPages.filter(p => p.canvasData).length
        });

        get().updateStory(storyId, { pages: updatedPages });
        
        // Verify the update actually stuck
        setTimeout(() => {
          const verifyStory = get().getStory(storyId);
          console.log(`ðŸ” Verification after updatePage:`, {
            storyId,
            pageId,
            pagesInStore: verifyStory?.pages.length,
            pagesWithImages: verifyStory?.pages.filter(p => p.canvasData).length,
            targetPageHasImage: !!verifyStory?.pages.find(p => p.id === pageId)?.canvasData
          });
        }, 100);
      },

      deletePage: (storyId: string, pageId: string) => {
        const story = get().getStory(storyId);
        if (!story || story.pages.length <= 1) return; // Don't delete the last page

        const updatedPages = story.pages
          .filter(page => page.id !== pageId)
          .map((page, index) => ({ ...page, order: index }));

        get().updateStory(storyId, { pages: updatedPages });

        // Adjust current page index if necessary
        const state = get();
        if (state.currentPageIndex >= updatedPages.length) {
          set({ currentPageIndex: Math.max(0, updatedPages.length - 1) });
        }
      },

      reorderPages: (storyId: string, pageIds: string[]) => {
        const story = get().getStory(storyId);
        if (!story) return;

        const reorderedPages = pageIds.map((pageId, index) => {
          const page = story.pages.find(p => p.id === pageId);
          return page ? { ...page, order: index } : null;
        }).filter(Boolean) as StoryPage[];

        get().updateStory(storyId, { pages: reorderedPages });
      },

      setCurrentPageIndex: (index: number) => {
        set({ currentPageIndex: index });
      },

      // Character Operations
      createCharacter: (name: string, description: string) => {
        const state = get();
        if (!state.currentUserId) {
          throw new Error('No user logged in');
        }
        
        const newCharacter: Character = {
          id: generateId(),
          name,
          description,
          personality: [],
          tags: [],
          createdAt: new Date(),
          usedInStories: []
        };

        set((state) => ({
          userLibraries: {
            ...state.userLibraries,
            [state.currentUserId!]: {
              ...state.userLibraries[state.currentUserId!],
              characters: [...(state.userLibraries[state.currentUserId!]?.characters || []), newCharacter]
            }
          }
        }));

        return newCharacter;
      },

      updateCharacter: (id: string, updates: Partial<Character>) => {
        set((state) => {
          if (!state.currentUserId) return state;
          
          const currentLibrary = state.userLibraries[state.currentUserId];
          if (!currentLibrary) return state;
          
          return {
            userLibraries: {
              ...state.userLibraries,
              [state.currentUserId]: {
                ...currentLibrary,
                characters: currentLibrary.characters.map(character =>
                  character.id === id ? { ...character, ...updates } : character
                )
              }
            }
          };
        });
      },

      deleteCharacter: (id: string) => {
        set((state) => {
          if (!state.currentUserId) return state;
          
          const currentLibrary = state.userLibraries[state.currentUserId];
          if (!currentLibrary) return state;
          
          return {
            userLibraries: {
              ...state.userLibraries,
              [state.currentUserId]: {
                ...currentLibrary,
                characters: currentLibrary.characters.filter(character => character.id !== id)
              }
            }
          };
        });

        // Remove character references from all stories
        const state = get();
        const currentLibrary = state.currentUserId ? state.userLibraries[state.currentUserId] : null;
        if (currentLibrary) {
          currentLibrary.stories.forEach(story => {
            const updatedPages = story.pages.map(page => ({
              ...page,
              characterIds: page.characterIds.filter(charId => charId !== id)
            }));
            
            if (updatedPages.some((page, index) => 
              page.characterIds.length !== story.pages[index].characterIds.length
            )) {
              get().updateStory(story.id, { pages: updatedPages });
            }
          });
        }
      },

      getCharacter: (id: string) => {
        const state = get();
        if (!state.currentUserId) return undefined;
        return state.userLibraries[state.currentUserId]?.characters.find(character => character.id === id);
      },

      // Canvas Operations
      saveCanvasData: (storyId: string, pageId: string, canvasData: string | any) => {
        // Special handling for cover image
        const COVER_OPERATIONS_KEY = '__cover_operations__';
        if (pageId === COVER_OPERATIONS_KEY) {
          const story = get().getStory(storyId);
          if (!story) return;
          
          if (typeof canvasData === 'object' && canvasData !== null) {
            get().updateStory(storyId, {
              coverImageOperations: canvasData.operations || [],
              coverImageDrawingState: canvasData.drawingState // Save drawing state for solo mode
            });
          }
          return;
        }
        
        // Handle both string (base64 image) and object (with operations/drawingState)
        if (typeof canvasData === 'string') {
          get().updatePage(storyId, pageId, { canvasData });
        } else if (canvasData && typeof canvasData === 'object') {
          // Store operations, drawing state, and snapshot separately
          get().updatePage(storyId, pageId, { 
            canvasData: canvasData.canvasDataUrl || canvasData.lastRemoteDrawing,
            canvasOperations: canvasData.operations || [],
            canvasDrawingState: canvasData.drawingState // Save drawing state for solo mode
          });
        }
      },

      getCanvasData: (storyId: string, pageId: string) => {
        // Special handling for cover image
        const COVER_OPERATIONS_KEY = '__cover_operations__';
        if (pageId === COVER_OPERATIONS_KEY) {
          const story = get().getStory(storyId);
          
          // Return full data if we have operations or drawing state
          if (story?.coverImageOperations || story?.coverImageDrawingState) {
            return {
              canvasDataUrl: story.coverImage,
              operations: story.coverImageOperations || [],
              drawingState: story.coverImageDrawingState
            } as any;
          }
          return story?.coverImage;
        }
        
        const story = get().getStory(storyId);
        const page = story?.pages.find(p => p.id === pageId);
        
        // Return full data if we have operations or drawing state
        if (page?.canvasOperations || page?.canvasDrawingState) {
          return {
            canvasDataUrl: page.canvasData,
            operations: page.canvasOperations || [],
            drawingState: page.canvasDrawingState
          } as any;
        }
        
        return page?.canvasData;
      },

      // Utility Functions
      calculateWordCount: (storyId: string) => {
        const story = get().getStory(storyId);
        if (!story) return 0;

        return story.pages.reduce((total, page) => {
          const words = page.text.split(/\s+/).filter(word => word.length > 0);
          return total + words.length;
        }, 0);
      },

      getRecentStories: (limit = 5) => {
        const state = get();
        if (!state.currentUserId) return [];
        const stories = state.userLibraries[state.currentUserId]?.stories || [];
        return stories
          .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
          .slice(0, limit);
      },

      getDraftStories: (limit = 10) => {
        const state = get();
        if (!state.currentUserId) return [];
        const stories = state.userLibraries[state.currentUserId]?.stories || [];
        return stories
          .filter(story => !story.isPublished)
          .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
          .slice(0, limit);
      },

      getPublishedStories: (limit = 10) => {
        const state = get();
        if (!state.currentUserId) return [];
        const stories = state.userLibraries[state.currentUserId]?.stories || [];
        return stories
          .filter(story => story.isPublished)
          .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
          .slice(0, limit);
      },

      searchStories: (query: string) => {
        const state = get();
        if (!state.currentUserId) return [];
        const stories = state.userLibraries[state.currentUserId]?.stories || [];
        const lowercaseQuery = query.toLowerCase();
        return stories.filter(story =>
          story.title.toLowerCase().includes(lowercaseQuery) ||
          story.description?.toLowerCase().includes(lowercaseQuery) ||
          story.pages.some(page => page.text.toLowerCase().includes(lowercaseQuery)) ||
          story.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        );
      },

      exportStory: (id: string) => {
        const story = get().getStory(id);
        if (!story) throw new Error('Story not found');
        
        return JSON.stringify(story, null, 2);
      },

      importStory: (data: string) => {
        try {
          const importedStory = JSON.parse(data) as Story;
          
          // Generate new ID to avoid conflicts
          const newStory: Story = {
            ...importedStory,
            id: generateId(),
            createdAt: new Date(),
            lastModified: new Date(),
            pages: importedStory.pages.map((page, index) => ({
              ...page,
              id: generateId(),
              order: index
            }))
          };

          set((state) => ({
            stories: [...state.stories, newStory]
          }));

          return newStory;
        } catch (error) {
          throw new Error('Invalid story data format');
        }
      },

      publishStory: (id: string) => {
        // Update story to published and trigger sync
        get().updateStory(id, { isPublished: true });
        
        // DO NOT reload from backend - this would strip the images!
        // The story is already in localStorage with all images intact
        // When viewing published stories from backend, they will fetch fresh with images
      },

      unpublishStory: (id: string) => {
        get().updateStory(id, { isPublished: false });
      },

      markAsDraft: (id: string) => {
        get().updateStory(id, { isDraft: true, isPublished: false });
      },

      markAsSaved: (id: string) => {
        get().updateStory(id, { isDraft: false, isPublished: false });
      },

      // Statistics
      getStats: () => {
        const state = get();
        if (!state.currentUserId) {
          return {
            totalStories: 0,
            totalPages: 0,
            totalWords: 0,
            totalCharacters: 0
          };
        }
        
        const library = state.userLibraries[state.currentUserId];
        if (!library) {
          return {
            totalStories: 0,
            totalPages: 0,
            totalWords: 0,
            totalCharacters: 0
          };
        }
        
        return {
          totalStories: library.stories.length,
          totalPages: library.stories.reduce((total, story) => total + story.pages.length, 0),
          totalWords: library.stories.reduce((total, story) => total + story.wordCount, 0),
          totalCharacters: library.characters.length
        };
      },

      // Offline story management
      saveStoryOffline: (story: Story) => {
        const state = get();
        if (!state.currentUserId) {
          console.error('âŒ Cannot save offline: No user logged in');
          return;
        }
        
        const currentLibrary = state.userLibraries[state.currentUserId] || { stories: [], characters: [], offlineStories: [] };
        
        // Ensure offlineStories array exists
        const offlineStories = currentLibrary.offlineStories || [];
        
        // Check if story is already saved offline (by both id and backendId)
        const isAlreadySaved = offlineStories.some(s => 
          s.id === story.id || 
          (s.backendId && story.backendId && s.backendId === story.backendId)
        );
        if (isAlreadySaved) {
          console.log('â„¹ï¸ Story already saved offline');
          return;
        }
        
        // Add story to offline storage
        set((state) => ({
          userLibraries: {
            ...state.userLibraries,
            [state.currentUserId!]: {
              ...currentLibrary,
              offlineStories: [...offlineStories, story]
            }
          }
        }));
        
        console.log('âœ… Story saved offline:', story.title);
      },
      
      removeOfflineStory: (storyId: string) => {
        const state = get();
        if (!state.currentUserId) return;
        
        const currentLibrary = state.userLibraries[state.currentUserId];
        if (!currentLibrary) return;
        
        // Ensure offlineStories array exists
        const offlineStories = currentLibrary.offlineStories || [];
        
        // Filter by both id and backendId to handle different story ID formats
        set((state) => ({
          userLibraries: {
            ...state.userLibraries,
            [state.currentUserId!]: {
              ...currentLibrary,
              offlineStories: offlineStories.filter(s => 
                s.id !== storyId && 
                (!s.backendId || s.backendId.toString() !== storyId)
              )
            }
          }
        }));
        
        console.log('âœ… Removed offline story:', storyId);
      },
      
      isStorySavedOffline: (storyId: string) => {
        const state = get();
        if (!state.currentUserId) return false;
        
        const currentLibrary = state.userLibraries[state.currentUserId];
        if (!currentLibrary || !currentLibrary.offlineStories) return false;
        
        // Check by both id and backendId to handle different story ID formats
        return currentLibrary.offlineStories.some(s => 
          s.id === storyId || 
          (s.backendId && s.backendId.toString() === storyId) ||
          (s.id === storyId.toString())
        );
      },

      // Initialize demo data for John Doe
      initializeDemoData: () => {
        const state = get();
        const userId = state.currentUserId;
        
        if (!userId) return;
        
        // Only initialize if no stories exist for this user
        const userLibrary = state.userLibraries[userId];
        if (!userLibrary || userLibrary.stories.length === 0) {
          set((state) => ({
            userLibraries: {
              ...state.userLibraries,
              [userId]: {
                stories: demoStories,
                characters: demoCharacters,
                offlineStories: []
              }
            }
          }));
        }
      },

      // Reset to demo data (for demo purposes)
      resetToDemoData: () => {
        const state = get();
        const userId = state.currentUserId;
        
        if (!userId) return;
        
        set((state) => ({
          userLibraries: {
            ...state.userLibraries,
            [userId]: {
              stories: demoStories,
              characters: demoCharacters,
              offlineStories: []
            }
          },
          currentStory: null,
          currentPageIndex: 0
        }));
      },

      // API Sync Operations
      syncStoriesToBackend: async () => {
        const state = get();
        if (!state.currentUserId) {
          console.warn('Cannot sync: No user logged in');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const userStories = state.userLibraries[state.currentUserId]?.stories || [];
          const result = await storyApiService.syncLocalStories(userStories);
          console.log(`Synced ${result.success} stories, ${result.failed} failed`);
        } catch (error) {
          console.error('Error syncing stories to backend:', error);
          set({ error: 'Failed to sync stories to backend' });
        } finally {
          set({ isLoading: false });
        }
      },

      loadStoriesFromBackend: async () => {
        const state = get();
        if (!state.currentUserId) {
          console.warn('Cannot load: No user logged in');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          console.log('ðŸ“¥ Fetching stories from backend...');
          const apiStories = await storyApiService.getUserStories();
          console.log('ðŸ“¦ Raw API response:', apiStories);
          
          const backendStories = apiStories.map(apiStory => storyApiService.convertFromApiFormat(apiStory));
          console.log('âœ… Converted stories:', backendStories);
          
          // Get list of deleted story IDs to exclude
          const deletedIds = state.userLibraries[state.currentUserId!]?.deletedStoryIds || [];
          console.log('ðŸ—‘ï¸ Deleted story IDs to exclude:', deletedIds);

          // Filter out stories that were deleted by the user
          const filteredStories = backendStories.filter(story => 
            !deletedIds.includes(story.backendId!)
          );
          
          if (filteredStories.length < backendStories.length) {
            console.log(`ðŸ—‘ï¸ Filtered out ${backendStories.length - filteredStories.length} deleted stories`);
          }

          // Get existing localStorage stories
          const localStories = state.userLibraries[state.currentUserId!]?.stories || [];
          
          // CRITICAL FIX: Preserve local images when merging with backend
          // Instead of removing images, we merge backend text with local images
          console.log('ðŸ–¼ï¸ Preserving local images during backend sync...');
          
          const mergedStories = filteredStories.map(backendStory => {
            // Find matching local story by backend ID
            const localStory = localStories.find(ls => ls.backendId === backendStory.backendId);
            
            if (localStory) {
              console.log(`ðŸ”„ Merging story ${backendStory.title}:`, {
                hasLocalCover: !!localStory.coverImage,
                localPagesWithImages: localStory.pages.filter(p => p.canvasData).length,
                backendPages: backendStory.pages.length
              });
              
              // Merge backend data with local images
              return {
                ...backendStory, // Use backend text and metadata
                coverImage: localStory.coverImage || backendStory.coverImage, // Use local if available, otherwise backend
                coverImageOperations: localStory.coverImageOperations,
                coverImageDrawingState: localStory.coverImageDrawingState,
                isDraft: localStory.isDraft || backendStory.isDraft, // Preserve draft state
                pages: backendStory.pages.map((backendPage, index) => {
                  // Find matching local page by order or text similarity
                  const localPage = localStory.pages.find(lp => lp.order === backendPage.order) ||
                                   localStory.pages[index];
                  
                  if (localPage?.canvasData) {
                    console.log(`  âœ… Preserved image for page ${index + 1}`);
                  }
                  
                  return {
                    ...backendPage, // Use backend text
                    canvasData: localPage?.canvasData || backendPage.canvasData, // Use local if available, otherwise backend
                    canvasOperations: localPage?.canvasOperations,
                    canvasDrawingState: localPage?.canvasDrawingState,
                  };
                })
              };
            }
            
            // No local story found - use backend story as-is (includes images from backend)
            console.log('Using backend story', backendStory.title, 'as-is (no local copy)', {
              hasCoverImage: !!backendStory.coverImage,
              pagesWithImages: backendStory.pages.filter(p => p.canvasData).length
            });
            return backendStory;
          });
          
          // Find stories that exist in localStorage but not in backend (unsaved drafts)
          const localOnlyStories = localStories.filter(localStory => 
            !localStory.backendId && // No backend ID
            !mergedStories.some(backendStory => backendStory.id === localStory.id) // Not in backend
          );
          
          console.log(`ðŸ“ Found ${localOnlyStories.length} local-only stories (unsaved drafts)`);
          
          // Add local-only stories
          mergedStories.push(...localOnlyStories);

          set((state) => ({
            userLibraries: {
              ...state.userLibraries,
              [state.currentUserId!]: {
                ...state.userLibraries[state.currentUserId!],
                stories: mergedStories
              }
            },
            isLoading: false
          }));

          console.log(`âœ… Loaded ${backendStories.length} stories from backend + ${localOnlyStories.length} local drafts`);
          
          // Sync local-only stories to backend in the background
          if (localOnlyStories.length > 0) {
            console.log('ðŸ”„ Syncing local-only stories to backend...');
            localOnlyStories.forEach(story => {
              // Only sync stories with content
              const hasContent = story.pages.some(page => page.text.trim().length > 0);
              if (hasContent) {
                get().syncStoryToBackend(story.id).catch(err => {
                  console.warn(`Failed to sync local story ${story.id}:`, err);
                });
              } else {
                console.log(`â­ï¸ Skipping empty story ${story.id} (no content to sync)`);
              }
            });
          }
          
          // Force extraction of images to IndexedDB to prevent quota issues
          // TEMPORARILY DISABLED - causes infinite loop
          /* try {
            const { hybridStorage } = await import('../utils/hybridStorage');
            const sizeCheck = hybridStorage.checkStorageSize();
            
            if (sizeCheck.needsExtraction) {
              console.log('🔄 State is large, forcing image extraction...');
              await hybridStorage.forceExtractAllImages();
              console.log('✅ Image extraction complete');
            }
          } catch (error) {
            console.error('❌ Failed to extract images after backend load:', error);
          } */
        } catch (error) {
          console.error('âŒ Error loading stories from backend:', error);
          set({ error: 'Failed to load stories from backend', isLoading: false });
        }
      },

      syncStoryToBackend: async (id: string): Promise<string> => {
        const state = get();
        if (!state.currentUserId) {
          console.warn('Cannot sync: No user logged in');
          throw new Error('No user logged in');
        }

        const story = state.userLibraries[state.currentUserId]?.stories.find(s => s.id === id);
        if (!story) {
          console.warn(`Story ${id} not found`);
          throw new Error(`Story ${id} not found`);
        }

        try {
         // Ensure a safe non-empty title before syncing
         const safeTitle = (story.title || '').trim() || 'Untitled Story';
         const storyForSync = { ...story, title: safeTitle } as typeof story;
         const apiData = storyApiService.convertToApiFormat(storyForSync as any);

          
          // If story has backendId, update it. Otherwise, create it.
          if (story.backendId) {
            try {
              await storyApiService.updateStory(story.backendId.toString(), apiData);
              console.log(`âœ… Updated story ${story.backendId} on backend`);
              return story.backendId.toString();
            } catch (updateError: any) {
              if (updateError?.status === 404) {
                // Backend story was deleted, create new one
                const response = await storyApiService.createStory(apiData as any);
                // Store the new backend ID directly in state
                set((state) => ({
                  userLibraries: {
                    ...state.userLibraries,
                    [state.currentUserId!]: {
                      ...state.userLibraries[state.currentUserId!],
                      stories: state.userLibraries[state.currentUserId!].stories.map(s =>
                        s.id === id ? { ...s, backendId: response.story.id } : s
                      )
                    }
                  }
                }));
                console.log(`âœ… Created story ${response.story.id} on backend (old ID was deleted)`);
                return response.story.id.toString();
              } else {
                throw updateError;
              }
            }
          } else {
            // No backend ID yet, create new story
            const response = await storyApiService.createStory(apiData as any);
            // Store the backend ID directly in state
            set((state) => ({
              userLibraries: {
                ...state.userLibraries,
                [state.currentUserId!]: {
                  ...state.userLibraries[state.currentUserId!],
                  stories: state.userLibraries[state.currentUserId!].stories.map(s =>
                    s.id === id ? { ...s, backendId: response.story.id } : s
                  )
                }
              }
            }));
            console.log(`âœ… Created story ${response.story.id} on backend`);
            return response.story.id.toString();
          }
        } catch (error: any) {
          console.error(`âŒ Error syncing story ${id} to backend:`, error);
          console.error('ðŸ“‹ Error details:', error?.details);
          console.error('ðŸ“‹ Error message:', error?.message);
          console.error('ðŸ“‹ Full error object:', JSON.stringify(error, null, 2));
          throw error;
        }
      }
    }),
    {
      name: 'story-store',
      version: 5, // Incremented - disabled partialize to fix image stripping bug
      storage: createHybridStorage(),
      // DISABLED: partialize was stripping images even from drafts
      // Testing without it to see if images persist correctly
      /* partialize: (state) => {
        // Save state to localStorage
        // For published stories, we can remove images since they're on backend
        // For unpublished/draft stories, KEEP images so they don't get lost!
        
        // DEBUG: Check what state we're receiving
        const allStories = Object.values(state.userLibraries).flatMap(lib => lib.stories);
        const eggbert = allStories.find(s => s.title?.includes('Eggbert'));
        if (eggbert) {
          console.log('ðŸ” partialize INPUT - Eggbert state:', {
            title: eggbert.title,
            pagesWithImages: eggbert.pages.filter(p => p.canvasData).length,
            hasCoverImage: !!eggbert.coverImage
          });
        }
        
        const sanitizedLibraries: Record<string, UserLibrary> = {};
        
        Object.keys(state.userLibraries).forEach(userId => {
          const library = state.userLibraries[userId];
          
          sanitizedLibraries[userId] = {
            stories: library.stories.map(story => {
              // Check image count before processing
              const pagesWithImages = story.pages.filter(p => p.canvasData).length;
              
              // DEBUG: Log the first page to see what's in canvasData
              if (story.pages[0]?.canvasData) {
                console.log(`ðŸ” DEBUG story "${story.title}" page 1 canvasData:`, story.pages[0].canvasData.substring(0, 100));
              } else {
                console.log(`ðŸ” DEBUG story "${story.title}" page 1 has NO canvasData`);
              }
              
              // ONLY strip images from PUBLISHED stories (backend has them)
              // KEEP images for drafts/unpublished stories (only in localStorage)
              if (story.isPublished && story.backendId) {
                console.log(`ðŸ—œï¸ Stripping images from published story "${story.title}" (${pagesWithImages} images)`);
                return {
                  ...story,
                  coverImage: undefined, // Backend has it
                  pages: story.pages.map(page => ({
                    ...page,
                    canvasData: undefined, // Backend has it
                    canvasDrawingState: undefined,
                  }))
                };
              }
              
              // For drafts/unpublished: KEEP ALL IMAGES
              console.log(`âœ… Keeping images for draft "${story.title}" (${pagesWithImages} images, isPublished: ${story.isPublished}, backendId: ${story.backendId})`);
              return story;
            }),
            characters: library.characters.map(char => ({
              ...char,
              imageData: undefined // Remove character images
            })),
            offlineStories: library.offlineStories || []
          };
        });
        
        return {
          userLibraries: sanitizedLibraries,
          currentUserId: state.currentUserId
        };
      },
      // Ensure proper hydration from localStorage
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Story store hydration error:', error);
            return;
          }
          
          if (!state) return;
          
          // Convert date strings back to Date objects and ensure offlineStories exists
          if (state.userLibraries) {
            Object.keys(state.userLibraries).forEach(userId => {
              const library = state.userLibraries[userId];
              
              // Ensure offlineStories array exists (for backward compatibility)
              if (library && !library.offlineStories) {
                library.offlineStories = [];
              }
              
              if (library?.stories) {
                library.stories = library.stories.map(story => ({
                  ...story,
                  createdAt: new Date(story.createdAt),
                  lastModified: new Date(story.lastModified)
                }));
              }
              if (library?.characters) {
                library.characters = library.characters.map(char => ({
                  ...char,
                  createdAt: new Date(char.createdAt)
                }));
              }
            });
          }
        };
      }, */
      // Handle storage migrations
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          return {
            userLibraries: persistedState.userLibraries || {},
            currentUserId: persistedState.currentUserId || null
          };
        }
        return persistedState;
      }
    }
  )
);

