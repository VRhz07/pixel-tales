/**
 * Sound Service
 * Manages audio playback for UI sound effects throughout the app
 */

export type SoundType =
  // Button sounds
  | 'button-click'
  | 'button-toggle'
  | 'button-success'
  | 'button-cancel'
  
  // Navigation sounds
  | 'page-turn'
  | 'tab-switch'
  | 'swipe'
  
  // Notification sounds
  | 'notification'
  | 'message-received'
  | 'achievement'
  | 'error'
  | 'warning'
  
  // Creation & Drawing sounds
  | 'brush-stroke'
  | 'eraser'
  | 'color-pick'
  | 'tool-select'
  
  // AI & Loading
  | 'ai-thinking'
  | 'loading-complete'
  | 'magic-sparkle'
  
  // Social & Interaction
  | 'like'
  | 'friend-request'
  | 'collaboration-invite';

export type BackgroundMusicTrack =
  | 'track-1'
  | 'track-2'
  | 'track-3'
  | 'track-4'
  | 'track-5'
  | 'random'; // Special value for random selection

interface SoundConfig {
  volume: number;
  loop?: boolean;
  playbackRate?: number;
}

class SoundService {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private globalVolume: number = 0.5;
  
  // Background music
  private backgroundMusic: HTMLAudioElement | null = null;
  private backgroundMusicEnabled: boolean = true;
  private backgroundMusicVolume: number = 0.2; // Lower volume for background
  private isMusicPlaying: boolean = false;
  private currentTrack: BackgroundMusicTrack | null = null;
  private selectedTrack: BackgroundMusicTrack = 'random'; // Default to random
  private loopCount: number = 0; // Count how many times current track has looped
  private readonly loopsBeforeChange: number = 2; // Change track after 2 loops in random mode
  
  // Available background music tracks
  private readonly availableTracks: Exclude<BackgroundMusicTrack, 'random'>[] = [
    'track-1',
    'track-2',
    'track-3',
    'track-4',
    'track-5',
  ];
  
  // Default volume levels for different sound types
  private readonly defaultVolumes: Partial<Record<SoundType, number>> = {
    'button-click': 0.3,
    'button-toggle': 0.35,
    'button-success': 0.5,
    'button-cancel': 0.3,
    'page-turn': 0.4,
    'tab-switch': 0.3,
    'swipe': 0.35,
    'notification': 0.6,
    'message-received': 0.55,
    'achievement': 0.7,
    'error': 0.5,
    'warning': 0.5,
    'brush-stroke': 0.25,
    'eraser': 0.25,
    'color-pick': 0.3,
    'tool-select': 0.35,
    'ai-thinking': 0.2,
    'loading-complete': 0.5,
    'magic-sparkle': 0.6,
    'like': 0.4,
    'friend-request': 0.6,
    'collaboration-invite': 0.6,
  };

  constructor() {
    // Load sound enabled preference from localStorage
    const savedPreference = localStorage.getItem('soundEffectsEnabled');
    this.enabled = savedPreference !== 'false'; // Default to true
    
    // Load global volume from localStorage
    const savedVolume = localStorage.getItem('soundEffectsVolume');
    if (savedVolume) {
      this.globalVolume = parseFloat(savedVolume);
    }
    
    // Load background music preferences
    const savedMusicPreference = localStorage.getItem('backgroundMusicEnabled');
    this.backgroundMusicEnabled = savedMusicPreference !== 'false'; // Default to true
    
    const savedMusicVolume = localStorage.getItem('backgroundMusicVolume');
    if (savedMusicVolume) {
      this.backgroundMusicVolume = parseFloat(savedMusicVolume);
    }
    
    const savedMusicTrack = localStorage.getItem('backgroundMusicTrack') as BackgroundMusicTrack;
    if (savedMusicTrack && (savedMusicTrack === 'random' || this.availableTracks.includes(savedMusicTrack as any))) {
      this.selectedTrack = savedMusicTrack;
    }
    
    this.preloadCommonSounds();
    // Don't initialize background music here - it will be initialized when first played
  }

  /**
   * Preload commonly used sounds for better performance
   */
  private preloadCommonSounds() {
    const commonSounds: SoundType[] = [
      'button-click',
      'button-toggle',
      'page-turn',
      'notification',
    ];
    
    commonSounds.forEach(sound => {
      this.loadSound(sound);
    });
  }

  /**
   * Load a sound file
   */
  private loadSound(soundType: SoundType): HTMLAudioElement | null {
    try {
      const audio = new Audio(`/sounds/${soundType}.mp3`);
      audio.preload = 'auto';
      
      // Set default volume
      const defaultVolume = this.defaultVolumes[soundType] || 0.5;
      audio.volume = defaultVolume * this.globalVolume;
      
      this.sounds.set(soundType, audio);
      return audio;
    } catch (error) {
      console.warn(`Failed to load sound: ${soundType}`, error);
      return null;
    }
  }

  /**
   * Play a sound effect
   */
  async playSound(soundType: SoundType, config?: Partial<SoundConfig>): Promise<void> {
    if (!this.enabled) return;

    try {
      let audio = this.sounds.get(soundType);
      
      // Load sound if not already loaded
      if (!audio) {
        audio = this.loadSound(soundType);
        if (!audio) return;
      }

      // Clone the audio element to allow overlapping plays
      const audioClone = audio.cloneNode() as HTMLAudioElement;
      
      // Apply custom config
      if (config) {
        if (config.volume !== undefined) {
          audioClone.volume = config.volume * this.globalVolume;
        }
        if (config.loop !== undefined) {
          audioClone.loop = config.loop;
        }
        if (config.playbackRate !== undefined) {
          audioClone.playbackRate = config.playbackRate;
        }
      }

      // Play the sound
      await audioClone.play();
      
      // Clean up after playing (unless looping)
      if (!config?.loop) {
        audioClone.onended = () => {
          audioClone.remove();
        };
      }
    } catch (error) {
      // Silently fail - sounds are optional
      console.debug(`Could not play sound: ${soundType}`, error);
    }
  }

  /**
   * Stop a looping sound
   */
  stopSound(soundType: SoundType) {
    const audio = this.sounds.get(soundType);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Stop all sounds
   */
  stopAllSounds() {
    this.sounds.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  /**
   * Enable or disable sound effects
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('soundEffectsEnabled', String(enabled));
    
    if (!enabled) {
      this.stopAllSounds();
    }
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set global volume (0.0 to 1.0)
   */
  setGlobalVolume(volume: number) {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('soundEffectsVolume', String(this.globalVolume));
    
    // Update volume for all loaded sounds
    this.sounds.forEach((audio, soundType) => {
      const defaultVolume = this.defaultVolumes[soundType] || 0.5;
      audio.volume = defaultVolume * this.globalVolume;
    });
  }

  /**
   * Get current global volume
   */
  getGlobalVolume(): number {
    return this.globalVolume;
  }

  /**
   * Preload a specific sound for better performance
   */
  preload(soundType: SoundType) {
    if (!this.sounds.has(soundType)) {
      this.loadSound(soundType);
    }
  }

  /**
   * Preload multiple sounds
   */
  preloadSounds(soundTypes: SoundType[]) {
    soundTypes.forEach(sound => this.preload(sound));
  }

  /**
   * Play a success sound with haptic feedback (if available)
   */
  async playSuccessWithHaptic() {
    await this.playSound('button-success');
    this.triggerHaptic('light');
  }

  /**
   * Play an error sound with haptic feedback
   */
  async playErrorWithHaptic() {
    await this.playSound('error');
    this.triggerHaptic('medium');
  }

  /**
   * Trigger haptic feedback (for mobile devices)
   */
  private triggerHaptic(intensity: 'light' | 'medium' | 'heavy' = 'light') {
    if ('vibrate' in navigator) {
      const duration = intensity === 'light' ? 10 : intensity === 'medium' ? 20 : 50;
      navigator.vibrate(duration);
    }
  }

  /**
   * Play haptic feedback without sound
   */
  playHaptic(intensity: 'light' | 'medium' | 'heavy' = 'light') {
    this.triggerHaptic(intensity);
  }

  /**
   * Initialize background music with a specific track
   */
  private initBackgroundMusic(track: Exclude<BackgroundMusicTrack, 'random'>) {
    try {
      // Clean up previous instance
      if (this.backgroundMusic) {
        this.backgroundMusic.pause();
        this.backgroundMusic.removeEventListener('ended', this.handleTrackEnded);
        this.backgroundMusic.src = '';
        this.backgroundMusic = null;
      }

      // Map track names to actual file names
      const trackFiles: Record<Exclude<BackgroundMusicTrack, 'random'>, string> = {
        'track-1': 'background-music.mp3',
        'track-2': 'background-music-2.mp3',
        'track-3': 'background-music-3.mp3',
        'track-4': 'background-music-4.mp3',
        'track-5': 'background-music-5.mp3',
      };
      
      this.backgroundMusic = new Audio(`/sounds/${trackFiles[track]}`);
      this.backgroundMusic.loop = false; // Don't use native loop - we'll handle it manually
      this.backgroundMusic.volume = this.backgroundMusicVolume;
      this.backgroundMusic.preload = 'auto';
      this.currentTrack = track;
      this.loopCount = 0; // Reset loop count for new track
      
      // Listen for track end to handle loop counting and random track changes
      this.backgroundMusic.addEventListener('ended', this.handleTrackEnded);
      
      // Handle page visibility changes (only set up once)
      if (!this.hasSetupVisibilityHandler) {
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            this.pauseBackgroundMusic();
          } else if (this.isMusicPlaying && this.backgroundMusicEnabled) {
            this.resumeBackgroundMusic();
          }
        });
        this.hasSetupVisibilityHandler = true;
      }
    } catch (error) {
      console.error(`Failed to initialize background music track: ${track}`, error);
    }
  }

  /**
   * Handle track ended event - loop or switch to new track in random mode
   */
  private handleTrackEnded = () => {
    if (!this.isMusicPlaying || !this.backgroundMusic) return;

    this.loopCount++;

    // If in random mode and we've reached the loop limit, switch to a new track
    if (this.selectedTrack === 'random' && this.loopCount >= this.loopsBeforeChange) {
      console.log(`🎵 Switching to new random track after ${this.loopCount} loops`);
      this.switchToRandomTrack();
    } else {
      // Otherwise, just restart the same track
      this.backgroundMusic.currentTime = 0;
      this.backgroundMusic.play().catch(err => {
        console.error('Failed to loop track:', err);
      });
    }
  };

  /**
   * Switch to a new random track with smooth transition
   */
  private async switchToRandomTrack() {
    if (!this.backgroundMusic) return;

    try {
      // Get a new random track (different from current)
      const newTrack = this.getRandomTrack();
      
      // Fade out current track
      await this.fadeOutMusic(1000);
      
      // Initialize new track
      this.initBackgroundMusic(newTrack);
      
      if (!this.backgroundMusic) return;
      
      // Start new track with fade in
      this.backgroundMusic.volume = 0;
      await this.backgroundMusic.play();
      this.fadeInMusic(1500);
      
      console.log(`🎵 Now playing: ${this.getCurrentTrackName()}`);
    } catch (error) {
      console.error('Failed to switch to random track:', error);
    }
  }

  private hasSetupVisibilityHandler = false;

  /**
   * Get a random track from available tracks (excluding current track)
   */
  private getRandomTrack(): Exclude<BackgroundMusicTrack, 'random'> {
    // If there's a current track and we have more than one track, avoid repeating it
    if (this.currentTrack && this.availableTracks.length > 1) {
      const availableTracksExcludingCurrent = this.availableTracks.filter(
        track => track !== this.currentTrack
      );
      const randomIndex = Math.floor(Math.random() * availableTracksExcludingCurrent.length);
      return availableTracksExcludingCurrent[randomIndex];
    }
    
    const randomIndex = Math.floor(Math.random() * this.availableTracks.length);
    return this.availableTracks[randomIndex];
  }

  /**
   * Get the track to play based on settings
   */
  private getTrackToPlay(): Exclude<BackgroundMusicTrack, 'random'> {
    if (this.selectedTrack === 'random') {
      return this.getRandomTrack();
    }
    return this.selectedTrack as Exclude<BackgroundMusicTrack, 'random'>;
  }

  /**
   * Start playing background music with fade in
   */
  async startBackgroundMusic(fadeInDuration: number = 2000): Promise<void> {
    if (!this.backgroundMusicEnabled) {
      return;
    }

    try {
      // Determine which track to play
      const trackToPlay = this.getTrackToPlay();
      
      // Initialize or switch track if needed
      if (!this.backgroundMusic || this.currentTrack !== trackToPlay) {
        this.initBackgroundMusic(trackToPlay);
      }

      if (!this.backgroundMusic) {
        throw new Error('Failed to initialize background music');
      }

      // Reset to start if already playing
      if (this.isMusicPlaying) {
        this.backgroundMusic.currentTime = 0;
      }

      // Start with volume at 0 for fade in
      this.backgroundMusic.volume = 0;
      await this.backgroundMusic.play();
      this.isMusicPlaying = true;

      // Fade in
      this.fadeInMusic(fadeInDuration);
    } catch (error: any) {
      this.isMusicPlaying = false;
      throw error; // Re-throw so caller can handle
    }
  }

  /**
   * Stop background music with fade out
   */
  async stopBackgroundMusic(fadeOutDuration: number = 1000): Promise<void> {
    if (!this.backgroundMusic || !this.isMusicPlaying) {
      return;
    }

    await this.fadeOutMusic(fadeOutDuration);
    this.backgroundMusic.pause();
    this.backgroundMusic.currentTime = 0;
    this.isMusicPlaying = false;
  }

  /**
   * Pause background music
   */
  pauseBackgroundMusic() {
    if (this.backgroundMusic && this.isMusicPlaying) {
      this.backgroundMusic.pause();
    }
  }

  /**
   * Resume background music
   */
  resumeBackgroundMusic() {
    if (this.backgroundMusic && this.isMusicPlaying && this.backgroundMusicEnabled) {
      this.backgroundMusic.play().catch(err => {
        console.debug('Could not resume background music', err);
      });
    }
  }

  /**
   * Fade in music
   */
  private fadeInMusic(duration: number) {
    if (!this.backgroundMusic) return;

    const targetVolume = this.backgroundMusicVolume;
    const steps = 50;
    const stepDuration = duration / steps;
    const volumeIncrement = targetVolume / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      if (!this.backgroundMusic || currentStep >= steps) {
        clearInterval(fadeInterval);
        if (this.backgroundMusic) {
          this.backgroundMusic.volume = targetVolume;
        }
        return;
      }

      this.backgroundMusic.volume = Math.min(targetVolume, volumeIncrement * currentStep);
      currentStep++;
    }, stepDuration);
  }

  /**
   * Fade out music
   */
  private fadeOutMusic(duration: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.backgroundMusic) {
        resolve();
        return;
      }

      const startVolume = this.backgroundMusic.volume;
      const steps = 50;
      const stepDuration = duration / steps;
      const volumeDecrement = startVolume / steps;
      let currentStep = 0;

      const fadeInterval = setInterval(() => {
        if (!this.backgroundMusic || currentStep >= steps) {
          clearInterval(fadeInterval);
          if (this.backgroundMusic) {
            this.backgroundMusic.volume = 0;
          }
          resolve();
          return;
        }

        this.backgroundMusic.volume = Math.max(0, startVolume - (volumeDecrement * currentStep));
        currentStep++;
      }, stepDuration);
    });
  }

  /**
   * Set background music volume (0.0 to 1.0)
   */
  setBackgroundMusicVolume(volume: number) {
    this.backgroundMusicVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('backgroundMusicVolume', String(this.backgroundMusicVolume));
    
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.backgroundMusicVolume;
    }
  }

  /**
   * Get background music volume
   */
  getBackgroundMusicVolume(): number {
    return this.backgroundMusicVolume;
  }

  /**
   * Enable or disable background music
   */
  setBackgroundMusicEnabled(enabled: boolean) {
    this.backgroundMusicEnabled = enabled;
    localStorage.setItem('backgroundMusicEnabled', String(enabled));
    
    if (!enabled && this.isMusicPlaying) {
      this.stopBackgroundMusic();
    }
  }

  /**
   * Check if background music is enabled
   */
  isBackgroundMusicEnabled(): boolean {
    return this.backgroundMusicEnabled;
  }

  /**
   * Check if background music is currently playing
   */
  isBackgroundMusicPlaying(): boolean {
    return this.isMusicPlaying;
  }

  /**
   * Set the background music track selection
   */
  setBackgroundMusicTrack(track: BackgroundMusicTrack) {
    this.selectedTrack = track;
    this.loopCount = 0; // Reset loop count when manually changing track
    localStorage.setItem('backgroundMusicTrack', track);
    
    // If music is currently playing, restart with new track
    if (this.isMusicPlaying) {
      this.stopBackgroundMusic(500).then(() => {
        this.startBackgroundMusic(1000);
      });
    }
  }

  /**
   * Get the currently selected track
   */
  getSelectedMusicTrack(): BackgroundMusicTrack {
    return this.selectedTrack;
  }

  /**
   * Get all available music tracks
   */
  getAvailableTracks(): BackgroundMusicTrack[] {
    return ['random', ...this.availableTracks];
  }

  /**
   * Get the currently playing track name
   */
  getCurrentTrackName(): string | null {
    if (!this.currentTrack) return null;
    
    // Convert track ID to display name
    const trackNames: Record<Exclude<BackgroundMusicTrack, 'random'>, string> = {
      'track-1': 'Melody One',
      'track-2': 'Melody Two',
      'track-3': 'Melody Three',
      'track-4': 'Melody Four',
      'track-5': 'Melody Five',
    };
    
    return trackNames[this.currentTrack];
  }

  /**
   * Get display name for a track
   */
  getTrackDisplayName(track: BackgroundMusicTrack): string {
    if (track === 'random') return '🎲 Random (Surprise Me!)';
    
    const trackNames: Record<Exclude<BackgroundMusicTrack, 'random'>, string> = {
      'track-1': '🎵 Melody One',
      'track-2': '🎶 Melody Two',
      'track-3': '🎼 Melody Three',
      'track-4': '🎹 Melody Four',
      'track-5': '🎸 Melody Five',
    };
    
    return trackNames[track as Exclude<BackgroundMusicTrack, 'random'>] || track;
  }
}

// Create singleton instance
const soundService = new SoundService();

export default soundService;
