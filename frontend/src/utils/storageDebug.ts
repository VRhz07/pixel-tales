/**
 * Storage Debug Utilities
 * Helper functions to debug localStorage issues
 */

export const checkLocalStorage = () => {
  console.log('🔍 Checking localStorage...');
  
  try {
    // Check if localStorage is available
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    console.log('✅ localStorage is available');
  } catch (e) {
    console.error('❌ localStorage is NOT available:', e);
    return false;
  }
  
  // Check story-store
  const storyStoreRaw = localStorage.getItem('story-store');
  console.log('📦 story-store raw value:', storyStoreRaw ? 'EXISTS' : 'NULL');
  
  if (storyStoreRaw) {
    try {
      const parsed = JSON.parse(storyStoreRaw);
      console.log('📊 story-store parsed:', parsed);
      console.log('📚 User libraries:', Object.keys(parsed.state?.userLibraries || {}));
      console.log('👤 Current user ID:', parsed.state?.currentUserId);
    } catch (e) {
      console.error('❌ Failed to parse story-store:', e);
    }
  } else {
    console.log('ℹ️ story-store is empty - this is normal on first load');
  }
  
  // Check auth-storage
  const authStoreRaw = localStorage.getItem('auth-storage');
  console.log('🔐 auth-storage:', authStoreRaw ? 'EXISTS' : 'NULL');
  
  if (authStoreRaw) {
    try {
      const parsed = JSON.parse(authStoreRaw);
      console.log('👤 Authenticated user:', parsed.state?.user?.id);
    } catch (e) {
      console.error('❌ Failed to parse auth-storage:', e);
    }
  }
  
  return true;
};

export const forceStorageSave = (key: string, data: any) => {
  console.log(`💾 Force saving to localStorage: ${key}`);
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log('✅ Save successful');
    
    // Verify it was saved
    const retrieved = localStorage.getItem(key);
    if (retrieved) {
      console.log('✅ Verified: Data exists in localStorage');
      return true;
    } else {
      console.error('❌ Verification failed: Data not found after save');
      return false;
    }
  } catch (e) {
    console.error('❌ Failed to save to localStorage:', e);
    return false;
  }
};

export const clearStorageForUser = (userId: string) => {
  console.log(`🗑️ Clearing storage for user: ${userId}`);
  
  const storyStoreRaw = localStorage.getItem('story-store');
  if (storyStoreRaw) {
    try {
      const parsed = JSON.parse(storyStoreRaw);
      if (parsed.state?.userLibraries?.[userId]) {
        delete parsed.state.userLibraries[userId];
        localStorage.setItem('story-store', JSON.stringify(parsed));
        console.log('✅ User data cleared');
      }
    } catch (e) {
      console.error('❌ Failed to clear user data:', e);
    }
  }
};
