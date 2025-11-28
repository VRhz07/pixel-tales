import { create } from 'zustand';

export interface Character {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  personality: string[];
  tags: string[];
  createdAt: Date;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  pages: StoryPage[];
  characters: Character[];
  genre: string;
  ageGroup: string;
  illustrationStyle: string;
  createdAt: Date;
  lastModified: Date;
}

export interface StoryPage {
  id: string;
  text: string;
  illustration: string;
  characters: string[]; // character IDs
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  category: 'writing' | 'illustration' | 'character' | 'streak' | 'quality';
}

interface CreationState {
  // Current creation flow
  currentFlow: 'story' | 'character' | null;
  currentStep: number;
  
  // Story creation state
  storyPrompt: string;
  selectedGenres: string[]; // Changed to array for multiple genres
  selectedAgeGroup: string;
  selectedIllustrationStyle: string;
  selectedArtStyle: string; // New: art style for story generation
  storyPages: StoryPage[];
  
  // Character creation state
  characterName: string;
  characterDescription: string;
  characterPersonality: string[];
  
  // User progress
  achievements: Achievement[];
  skillPoints: {
    writing: number;
    illustration: number;
    character: number;
  };
  creationStreak: number;
  lastCreationDate: Date | null;
  
  // UI state
  isGenerating: boolean;
  showAchievementModal: boolean;
  newAchievement: Achievement | null;
  
  // Actions
  setCurrentFlow: (flow: 'story' | 'character' | null) => void;
  setCurrentStep: (step: number) => void;
  updateStoryPrompt: (prompt: string) => void;
  setSelectedGenres: (genres: string[]) => void; // Changed to array
  toggleGenre: (genre: string) => void; // New: toggle genre selection
  setSelectedAgeGroup: (ageGroup: string) => void;
  setSelectedIllustrationStyle: (style: string) => void;
  setSelectedArtStyle: (style: string) => void; // New: set art style
  updateCharacterName: (name: string) => void;
  updateCharacterDescription: (description: string) => void;
  togglePersonalityTrait: (trait: string) => void;
  setIsGenerating: (generating: boolean) => void;
  addSkillPoints: (category: 'writing' | 'illustration' | 'character', points: number) => void;
  updateAchievementProgress: (achievementId: string, progress: number) => void;
  unlockAchievement: (achievement: Achievement) => void;
  dismissAchievementModal: () => void;
  resetCreationState: () => void;
}

const initialAchievements: Achievement[] = [
  {
    id: 'first-story',
    name: 'First Story',
    description: 'Create your very first story',
    icon: '📖',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    category: 'writing'
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    description: 'Create 5 stories',
    icon: '📚',
    progress: 0,
    maxProgress: 5,
    unlocked: false,
    category: 'writing'
  },
  {
    id: 'artist',
    name: 'Artist',
    description: 'Create 10 custom illustrations',
    icon: '🎨',
    progress: 0,
    maxProgress: 10,
    unlocked: false,
    category: 'illustration'
  },
  {
    id: 'character-creator',
    name: 'Character Creator',
    description: 'Create 5 unique characters',
    icon: '👥',
    progress: 0,
    maxProgress: 5,
    unlocked: false,
    category: 'character'
  },
  {
    id: 'week-streak',
    name: 'Creative Week',
    description: 'Create something for 7 days in a row',
    icon: '🔥',
    progress: 0,
    maxProgress: 7,
    unlocked: false,
    category: 'streak'
  }
];

export const useCreationStore = create<CreationState>((set, get) => ({
  // Initial state
  currentFlow: null,
  currentStep: 0,
  storyPrompt: '',
  selectedGenres: [], // Changed to array
  selectedAgeGroup: '',
  selectedIllustrationStyle: '',
  selectedArtStyle: '', // New: art style
  storyPages: [],
  characterName: '',
  characterDescription: '',
  characterPersonality: [],
  achievements: initialAchievements,
  skillPoints: {
    writing: 0,
    illustration: 0,
    character: 0
  },
  creationStreak: 0,
  lastCreationDate: null,
  isGenerating: false,
  showAchievementModal: false,
  newAchievement: null,

  // Actions
  setCurrentFlow: (flow) => set({ currentFlow: flow, currentStep: 0 }),
  setCurrentStep: (step) => set({ currentStep: step }),
  updateStoryPrompt: (prompt) => set({ storyPrompt: prompt }),
  setSelectedGenres: (genres) => set({ selectedGenres: genres }),
  toggleGenre: (genre) => set((state) => {
    const isSelected = state.selectedGenres.includes(genre);
    return {
      selectedGenres: isSelected
        ? state.selectedGenres.filter(g => g !== genre)
        : [...state.selectedGenres, genre]
    };
  }),
  setSelectedAgeGroup: (ageGroup) => set({ selectedAgeGroup: ageGroup }),
  setSelectedIllustrationStyle: (style) => set({ selectedIllustrationStyle: style }),
  setSelectedArtStyle: (style) => set({ selectedArtStyle: style }),
  updateCharacterName: (name) => set({ characterName: name }),
  updateCharacterDescription: (description) => set({ characterDescription: description }),
  togglePersonalityTrait: (trait) => set((state) => ({
    characterPersonality: state.characterPersonality.includes(trait)
      ? state.characterPersonality.filter(t => t !== trait)
      : [...state.characterPersonality, trait]
  })),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  
  addSkillPoints: (category, points) => set((state) => ({
    skillPoints: {
      ...state.skillPoints,
      [category]: state.skillPoints[category] + points
    }
  })),
  
  updateAchievementProgress: (achievementId, progress) => set((state) => {
    const achievements = state.achievements.map(achievement => {
      if (achievement.id === achievementId) {
        const newProgress = Math.min(progress, achievement.maxProgress);
        const shouldUnlock = newProgress >= achievement.maxProgress && !achievement.unlocked;
        
        if (shouldUnlock) {
          // Trigger achievement unlock
          setTimeout(() => {
            get().unlockAchievement({ ...achievement, progress: newProgress, unlocked: true });
          }, 100);
        }
        
        return { ...achievement, progress: newProgress };
      }
      return achievement;
    });
    
    return { achievements };
  }),
  
  unlockAchievement: (achievement) => set((state) => ({
    achievements: state.achievements.map(a => 
      a.id === achievement.id ? { ...a, unlocked: true } : a
    ),
    showAchievementModal: true,
    newAchievement: achievement
  })),
  
  dismissAchievementModal: () => set({ 
    showAchievementModal: false, 
    newAchievement: null 
  }),
  
  resetCreationState: () => set({
    currentFlow: null,
    currentStep: 0,
    storyPrompt: '',
    selectedGenres: [],
    selectedAgeGroup: '',
    selectedIllustrationStyle: '',
    selectedArtStyle: '',
    storyPages: [],
    characterName: '',
    characterDescription: '',
    characterPersonality: [],
    isGenerating: false
  })
}));
