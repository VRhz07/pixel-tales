import axios from 'axios';

/**
 * Offline Fallback Service
 * Acts as a mock backend router when the application is offline or the actual API is unreachable.
 * Reads static bundled JSON files from the public/data directory.
 */
class OfflineFallbackService {
  private bundledStories: any = null;
  private bundledGames: any = null;
  
  /**
   * Load bundled JSON files into memory if not already loaded.
   */
  private async loadBundledData(): Promise<void> {
    try {
      if (!this.bundledStories) {
        const storiesRes = await axios.get('/data/bundled_stories.json');
        this.bundledStories = storiesRes.data;
        console.log('[OfflineFallback] Loaded bundled stories');
      }
      if (!this.bundledGames) {
        const gamesRes = await axios.get('/data/bundled_games.json');
        this.bundledGames = gamesRes.data;
        console.log('[OfflineFallback] Loaded bundled games');
      }
    } catch (error) {
      console.error('[OfflineFallback] Failed to load bundled data JSON files', error);
      throw error;
    }
  }

  /**
   * Get bundled stories directly (for pre-installed library view)
   */
  async getBundledStories(): Promise<any[]> {
    await this.loadBundledData();
    return this.bundledStories?.results || [];
  }

  /**
   * Mock the GET API endpoint routing
   */
  async handleGetRequest(url: string): Promise<any> {
    console.log(`[OfflineFallback] Handling fallback for GET: ${url}`);
    await this.loadBundledData();
    
    // Normalize URL
    const cleanUrl = url.split('?')[0]; // Remove query params
    
    try {
      // 1. Stories List Endpoint
      if (cleanUrl.match(/^\/stories\/?$/)) {
        return this.bundledStories;
      }
      
      // 2. Single Story Endpoint (/stories/:id/)
      const storyMatch = cleanUrl.match(/^\/stories\/([a-zA-Z0-9_-]+)\/?$/);
      if (storyMatch) {
        const id = storyMatch[1];
        const results = this.bundledStories?.results || [];
        const story = results.find((s: any) => s.id.toString() === id);
        if (story) return story;
        throw new Error(`Story ${id} not found in offline bundle`);
      }
      
      // 3. Story Games List Endpoint (/games/story/:id/)
      const storyGamesMatch = cleanUrl.match(/^\/games\/story\/([a-zA-Z0-9_-]+)\/?$/);
      if (storyGamesMatch) {
        const id = storyGamesMatch[1];
        const storyGames = this.bundledGames?.story_games?.[id];
        if (storyGames) return storyGames;
        // Return empty games list rather than error so UI handles it gracefully
        return { story_title: 'Offline Story', games: [] };
      }
      
      // 4. Game Preview / Data Endpoint (/games/:id/preview/)
      const gamePreviewMatch = cleanUrl.match(/^\/games\/([a-zA-Z0-9_-]+)\/preview\/?$/);
      if (gamePreviewMatch) {
        const id = gamePreviewMatch[1];
        const gameData = this.bundledGames?.games_data?.[id];
        if (gameData) return gameData;
        throw new Error(`Game ${id} not found in offline bundle`);
      }
      
      // If we don't know how to route it, throw so the original error bubbles up
      throw new Error(`No offline fallback route defined for ${url}`);
      
    } catch (e: any) {
      console.error(`[OfflineFallback] Fallback routing failed:`, e.message);
      throw e;
    }
  }
}

export const offlineFallbackService = new OfflineFallbackService();
export default offlineFallbackService;
