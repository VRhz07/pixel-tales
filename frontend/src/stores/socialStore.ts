import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  joinedDate: string;
  storiesCount: number;
  mutualFriends: number;
  isOnline: boolean;
  lastSeen?: string;
  bio?: string;
  collaborationInvite?: {
    id: string;
    session_id: string;
    story_title: string;
    created_at: string;
  };
}

export interface FriendRequest {
  id: string;
  from: Friend;
  timestamp: string;
  message?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  storiesCount: number;
  followersCount: number;
  joinedDate: string;
  bio?: string;
  mutualFriends: number;
  isFriend: boolean;
  requestSent: boolean;
}

interface SocialStore {
  friends: Friend[];
  friendRequests: FriendRequest[];
  searchResults: User[];
  searchQuery: string;
  selectedTab: 'friends' | 'find-friends' | 'requests';
  
  // Actions
  setSelectedTab: (tab: 'friends' | 'find-friends' | 'requests') => void;
  setSearchQuery: (query: string) => void;
  searchUsers: (query: string) => void;
  sendFriendRequest: (userId: string) => void;
  acceptFriendRequest: (requestId: string) => void;
  rejectFriendRequest: (requestId: string) => void;
  removeFriend: (friendId: string) => void;
  startChat: (friendId: string) => void;
  addCollaborationInviteToFriend: (friendId: number, inviteData: any) => void;
  removeCollaborationInviteFromFriend: (friendId: number) => void;
}

// Sample data with more diverse and thematic avatars
const sampleFriends: Friend[] = [
  {
    id: '1',
    name: 'Emma Johnson',
    avatar: '🧚‍♀️',
    status: 'online',
    joinedDate: '2024-01-15',
    storiesCount: 12,
    mutualFriends: 3,
    isOnline: true,
    bio: 'Love writing magical adventures! ✨'
  },
  {
    id: '2',
    name: 'Alex Smith',
    avatar: '🤖',
    status: 'away',
    joinedDate: '2024-02-20',
    storiesCount: 8,
    mutualFriends: 1,
    isOnline: false,
    lastSeen: '2 hours ago',
    bio: 'Sci-fi storyteller and space explorer! 🚀'
  },
  {
    id: '3',
    name: 'Sofia Martinez',
    avatar: '🎭',
    status: 'offline',
    joinedDate: '2024-03-10',
    storiesCount: 15,
    mutualFriends: 5,
    isOnline: false,
    lastSeen: '1 day ago',
    bio: 'Creating stories that make people smile 😊'
  },
  {
    id: '4',
    name: 'Ryan Chen',
    avatar: '🐉',
    status: 'online',
    joinedDate: '2024-01-28',
    storiesCount: 6,
    mutualFriends: 2,
    isOnline: true,
    bio: 'Adventure seeker and dragon tamer! 🐉'
  }
];

const sampleFriendRequests: FriendRequest[] = [
  {
    id: 'req1',
    from: {
      id: '5',
      name: 'Luna Park',
      avatar: '🦄',
      status: 'online',
      joinedDate: '2024-03-15',
      storiesCount: 4,
      mutualFriends: 2,
      isOnline: true,
      bio: 'Moonlight stories and starry adventures! ⭐'
    },
    timestamp: '2024-03-25T10:30:00Z',
    message: 'Hi! I love your fantasy stories. Would you like to be friends?'
  },
  {
    id: 'req2',
    from: {
      id: '6',
      name: 'Oliver Wilson',
      avatar: '🎨',
      status: 'offline',
      joinedDate: '2024-02-05',
      storiesCount: 9,
      mutualFriends: 1,
      isOnline: false,
      bio: 'Wise storyteller who loves mystery stories! 🔍'
    },
    timestamp: '2024-03-24T15:45:00Z'
  }
];

const sampleUsers: User[] = [
  {
    id: '7',
    name: 'Maya Thompson',
    avatar: '🧚‍♂️',
    storiesCount: 11,
    followersCount: 45,
    joinedDate: '2024-01-10',
    bio: 'Butterfly collector and nature story writer! 🌺',
    mutualFriends: 3,
    isFriend: false,
    requestSent: false
  },
  {
    id: '8',
    name: 'Jake Rivera',
    avatar: '🦸‍♂️',
    storiesCount: 7,
    followersCount: 23,
    joinedDate: '2024-02-18',
    bio: 'Lightning-fast storyteller! Superhero adventures!',
    mutualFriends: 1,
    isFriend: false,
    requestSent: false
  },
  {
    id: '9',
    name: 'Zara Ali',
    avatar: '👸',
    storiesCount: 13,
    followersCount: 67,
    joinedDate: '2024-01-22',
    bio: 'Shooting star stories and cosmic adventures! 🌌',
    mutualFriends: 4,
    isFriend: false,
    requestSent: false
  },
  {
    id: '10',
    name: 'Leo Garcia',
    avatar: '🧙‍♂️',
    storiesCount: 9,
    followersCount: 34,
    joinedDate: '2024-02-25',
    bio: 'Brave wizard with epic quest stories! ⚔️',
    mutualFriends: 2,
    isFriend: false,
    requestSent: false
  }
];

export const useSocialStore = create<SocialStore>()(
  persist(
    (set, get) => ({
      friends: sampleFriends,
      friendRequests: sampleFriendRequests,
      searchResults: sampleUsers,
      searchQuery: '',
      selectedTab: 'friends',

      setSelectedTab: (tab) => set({ selectedTab: tab }),

      setSearchQuery: (query) => {
        set({ searchQuery: query });
        // Auto-search as user types
        if (query.length > 0) {
          get().searchUsers(query);
        } else {
          set({ searchResults: sampleUsers });
        }
      },

      searchUsers: (query) => {
        const lowercaseQuery = query.toLowerCase();
        const filtered = sampleUsers.filter(
          user =>
            user.name.toLowerCase().includes(lowercaseQuery) ||
            user.bio?.toLowerCase().includes(lowercaseQuery)
        );
        set({ searchResults: filtered });
      },

      sendFriendRequest: (userId) => {
        const { searchResults } = get();
        const updatedResults = searchResults.map(user =>
          user.id === userId ? { ...user, requestSent: true } : user
        );
        set({ searchResults: updatedResults });
      },

      acceptFriendRequest: (requestId) => {
        const { friendRequests, friends } = get();
        const request = friendRequests.find(req => req.id === requestId);
        
        if (request) {
          // Add to friends list
          const newFriend: Friend = {
            ...request.from,
            status: request.from.isOnline ? 'online' : 'offline'
          };
          
          set({
            friends: [...friends, newFriend],
            friendRequests: friendRequests.filter(req => req.id !== requestId)
          });
        }
      },

      rejectFriendRequest: (requestId) => {
        const { friendRequests } = get();
        set({
          friendRequests: friendRequests.filter(req => req.id !== requestId)
        });
      },

      removeFriend: (friendId) => {
        const { friends } = get();
        set({
          friends: friends.filter(friend => friend.id !== friendId)
        });
      },

      startChat: (friendId) => {
        // This would typically open a chat interface
        console.log(`Starting chat with friend ${friendId}`);
        // For now, just show an alert
        alert('Chat feature coming soon! 💬');
      },

      addCollaborationInviteToFriend: (friendId, inviteData) => {
        const { friends } = get();
        const updatedFriends = friends.map(friend => {
          if (friend.id === String(friendId)) {
            return {
              ...friend,
              collaborationInvite: {
                id: inviteData.id,
                session_id: inviteData.session_id || inviteData.sessionId,
                story_title: inviteData.story_title || inviteData.storyTitle,
                created_at: inviteData.created_at || inviteData.createdAt
              }
            };
          }
          return friend;
        });
        set({ friends: updatedFriends });
      },

      removeCollaborationInviteFromFriend: (friendId) => {
        const { friends } = get();
        const updatedFriends = friends.map(friend => {
          if (friend.id === String(friendId)) {
            const { collaborationInvite, ...rest } = friend;
            return rest;
          }
          return friend;
        });
        set({ friends: updatedFriends });
      }
    }),
    {
      name: 'social-store'
    }
  )
);
