import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AccountSwitchState {
  // Current active account type
  activeAccountType: 'parent' | 'child' | null;
  
  // Active child ID if viewing as child
  activeChildId: number | null;
  
  // Active child name for display
  activeChildName: string | null;
  
  // Actions
  setActiveAccount: (type: 'parent' | 'child', childId?: number, childName?: string) => void;
  clearActiveAccount: () => void;
  isViewingAsChild: () => boolean;
}

export const useAccountSwitchStore = create<AccountSwitchState>()(
  persist(
    (set, get) => ({
      activeAccountType: null,
      activeChildId: null,
      activeChildName: null,

      setActiveAccount: (type: 'parent' | 'child', childId?: number, childName?: string) => {
        set({
          activeAccountType: type,
          activeChildId: type === 'child' ? childId || null : null,
          activeChildName: type === 'child' ? childName || null : null,
        });
      },

      clearActiveAccount: () => {
        set({
          activeAccountType: null,
          activeChildId: null,
          activeChildName: null,
        });
      },

      isViewingAsChild: () => {
        const state = get();
        return state.activeAccountType === 'child' && !!localStorage.getItem('parent_session');
      },
    }),
    {
      name: 'account-switch-storage',
      partialize: (state) => ({
        activeAccountType: state.activeAccountType,
        activeChildId: state.activeChildId,
        activeChildName: state.activeChildName,
      }),
    }
  )
);
