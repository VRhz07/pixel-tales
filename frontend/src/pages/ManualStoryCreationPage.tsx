import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStoryStore } from '../stores/storyStore';
import { useCreationStore } from '../stores/creationStore';
import SaveStoryModal from '../components/story/SaveStoryModal';
import { VoiceFilteredInput } from '../components/common/VoiceFilteredInput';
import { VoiceFilteredTextarea } from '../components/common/VoiceFilteredTextarea';
import { collaborationService } from '../services/collaborationService';
import { getCollaborationSession } from '../services/collaborationApi';
import { CollaborationInviteModal } from '../components/collaboration/CollaborationInviteModal';
import { ActiveSessionInviteModal } from '../components/collaboration/ActiveSessionInviteModal';
import CollaborationLobby from '../components/collaboration/CollaborationLobby';
import { VotingModal } from '../components/collaboration/VotingModal';
import { ParticipantsPanel } from '../components/collaboration/ParticipantsPanel';
import { RealtimePreviewCanvas, RealtimePreviewCanvasRef } from '../components/canvas/RealtimePreviewCanvas';
import { RealtimeCanvasIndicator } from '../components/collaboration/RealtimeCanvasIndicator';
import PageDeletionModal from '../components/collaboration/PageDeletionModal';
import ReconnectingModal from '../components/collaboration/ReconnectingModal';
import { useToastContext } from '../contexts/ToastContext';
import { usePresenceTracking } from '../hooks/usePresenceTracking';
import { TypingIndicator, CursorIndicator, TextCaretIndicator, TouchIndicator, PRESENCE_STYLES } from '../components/collaboration/PresenceSystem';
import './ManualStoryCreationPage.css';
import {
  ChevronLeftIcon,
  ArchiveBoxArrowDownIcon,
  PhotoIcon,
  PencilIcon,
  BookOpenIcon,
  PlusIcon,
  ChevronLeftIcon as ChevronPrevIcon,
  ChevronRightIcon as ChevronNextIcon,
  DocumentIcon,
  SparklesIcon,
  UserGroupIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Remove local interface as we'll use the store types

const ManualStoryCreationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get storyId, returnToPageIndex, and collaboration info from navigation state
  const { 
    storyId, 
    returnToPageIndex, 
    sessionId: collabSessionId, 
    isCollaborative,
    isHost: isHostFromNav,
    bypassLobby
  } = (location.state as { 
    storyId?: string; 
    returnToPageIndex?: number; 
    sessionId?: string; 
    isCollaborative?: boolean;
    isHost?: boolean;
    bypassLobby?: boolean;
  }) || {};
  
  
  // Store hooks
  const {
    currentStory,
    setCurrentStory,
    createStory,
    updateStory,
    addPage,
    addPageWithId,
    insertPageAt,
    insertPageAtWithId,
    updatePage,
    deletePage,
    currentPageIndex,
    setCurrentPageIndex,
    getCanvasData,
    markAsDraft,
    markAsSaved,
    syncStoryToBackend
  } = useStoryStore();
  
  const { addSkillPoints, updateAchievementProgress } = useCreationStore();
  const { showInfoToast } = useToastContext();
  
  // Local state
  const [storyTitle, setStoryTitle] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [wasVoteInitiator, setWasVoteInitiator] = useState(false);
  const hasCreatedStory = useRef(false); // Track if we've already created a story in this session
  const originalIsDraft = useRef<boolean | undefined>(undefined); // Track original draft status
  
  // Collaboration state
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showLobby, setShowLobby] = useState(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Real-time canvas activity tracking
  const [canvasActivity, setCanvasActivity] = useState<Map<string, { timestamp: number, user: string }>>(new Map());
  
  // Page deletion modal state
  const [showPageDeletionModal, setShowPageDeletionModal] = useState(false);
  const [pageViewers, setPageViewers] = useState<Record<number, Array<{user_id: number, username: string, display_name: string, cursor_color: string}>>>({});
  
  // Canvas refs for live preview rendering
  const canvasPreviewRef = useRef<RealtimePreviewCanvasRef>(null);
  const coverPreviewRef = useRef<RealtimePreviewCanvasRef>(null);
  const pagePreviewRefs = useRef<Map<string, RealtimePreviewCanvasRef>>(new Map());

  // Function to register preview refs from RealtimeCanvasIndicator components
  const registerPreviewRef = (pageId: string, ref: RealtimePreviewCanvasRef) => {
    pagePreviewRefs.current.set(pageId, ref);
    
    // If this is the current page or cover, also set the main refs
    if (pageId === 'cover') {
      (coverPreviewRef as any).current = ref;
    } else if (currentStory && pageId === currentStory.pages[currentPageIndex]?.id) {
      (canvasPreviewRef as any).current = ref;
    }
  };

  // Function to render drawing data to preview canvas using new RealtimePreviewCanvas
  const renderDrawingToPreview = (pageId: string, drawingData: any) => {
    if (!drawingData) return;

    try {
      // Get the appropriate preview canvas ref
      let previewRef: RealtimePreviewCanvasRef | null = null;
      
      if (pageId === 'cover') {
        previewRef = coverPreviewRef.current;
      } else if (pageId === currentStory?.pages[currentPageIndex]?.id) {
        previewRef = canvasPreviewRef.current;
      } else {
        // For other pages, get from the map
        previewRef = pagePreviewRefs.current.get(pageId) || null;
      }
      
      if (previewRef) {
        previewRef.renderDrawing(drawingData);
      }
    } catch (error) {
      console.error('Error rendering drawing to preview:', error);
    }
  };

  // Function to clear preview canvas
  const clearPreviewCanvas = (pageId: string) => {
    try {
      let previewRef: RealtimePreviewCanvasRef | null = null;
      
      if (pageId === 'cover') {
        previewRef = coverPreviewRef.current;
      } else if (pageId === currentStory?.pages[currentPageIndex]?.id) {
        previewRef = canvasPreviewRef.current;
      } else {
        previewRef = pagePreviewRefs.current.get(pageId) || null;
      }
      
      if (previewRef) {
        console.log('🧽 Clearing preview canvas for page:', pageId);
        previewRef.clearPreview();
      }
    } catch (error) {
      console.error('Error clearing preview canvas:', error);
    }
  };

  // Function to update preview canvas with base canvas data
  const updatePreviewCanvasBackground = (pageId: string, canvasDataUrl?: string) => {
    try {
      let previewRef: RealtimePreviewCanvasRef | null = null;
      
      if (pageId === 'cover') {
        previewRef = coverPreviewRef.current;
      } else if (pageId === currentStory?.pages[currentPageIndex]?.id) {
        previewRef = canvasPreviewRef.current;
      } else {
        previewRef = pagePreviewRefs.current.get(pageId) || null;
      }
      
      if (previewRef) {
        previewRef.updateCanvas(canvasDataUrl);
      }
    } catch (error) {
      console.error('Error updating preview canvas background:', error);
    }
  };

  // Debug logging helper: only logs during collaboration
  const collabLog = (...args: any[]) => {
    if (isCollaborating) {
      try { console.log(...args); } catch {}
    }
  };

  // Suppress console logs in solo mode to keep UI clean
  useEffect(() => {
    const originalLog = console.log;
    if (!isCollaborating) {
      // No-op logger while in solo mode
      (console as any).log = () => {};
    } else {
      (console as any).log = originalLog;
    }
    return () => {
      (console as any).log = originalLog;
    };
  }, [isCollaborating]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Map<number, any>>(new Map());
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  
  // CRITICAL FIX: Set up reconnection handler with useRef to avoid stale closures
  const reconnectHandlerRef = useRef<((reconnecting: boolean, attempt: number) => void) | null>(null);
  const reconnectSuccessHandlerRef = useRef<(() => void) | null>(null);
  
  // Create the handler function that uses the latest state
  reconnectHandlerRef.current = (reconnecting: boolean, attempt: number) => {
    setIsReconnecting(reconnecting);
    setReconnectAttempt(attempt);
  };
  
  // Create handler for successful reconnection
  reconnectSuccessHandlerRef.current = () => {
    console.log('✅ Story Page: Reconnection successful, story draft syncs automatically from backend');
  };
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [votingData, setVotingData] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [showSavingOverlay, setShowSavingOverlay] = useState(false);
  const voteInitiatorRef = useRef<number | null>(null);
  const textEditTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTextSentRef = useRef<{ pageIndex: number, text: string } | null>(null);
  const isReceivingRemoteTextRef = useRef(false);
  
  // Toast deduplication to prevent multiple identical toasts
  const lastToastRef = useRef<{ message: string, timestamp: number } | null>(null);
  const showDedupedToast = (message: string) => {
    const now = Date.now();
    // Prevent same message within 2 seconds
    if (lastToastRef.current && 
        lastToastRef.current.message === message && 
        now - lastToastRef.current.timestamp < 2000) {
      return;
    }
    lastToastRef.current = { message, timestamp: now };
    showInfoToast(message);
  };

  // Presence tracking for collaborative features
  const presence = usePresenceTracking({
    sessionId: currentSessionId,
    participants,
    currentUserId,
    isCollaborating,
    collaborationService
  });

  // Refs for tracking presence on inputs
  const titleInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // Handle browser navigation attempts when in collaboration mode
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isCollaborating) {
        // Prevent the navigation
        event.preventDefault();
        window.history.pushState(null, '', window.location.href);
        // Show confirmation modal
        setShowLeaveConfirmModal(true);
      }
    };

    if (isCollaborating) {
      // Push current state to prevent back navigation
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isCollaborating]);

  // Handle browser's beforeunload event (page refresh, tab close, etc.)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isCollaborating) {
        // Show browser's default confirmation dialog
        event.preventDefault();
        event.returnValue = 'You are currently in a collaboration session. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isCollaborating]);

  // Set up reconnection handlers on mount
  useEffect(() => {
    console.log('🔧 Story Page: Setting up reconnection handlers');
    
    collaborationService.onReconnectStateChange = (reconnecting: boolean, attempt: number) => {
      reconnectHandlerRef.current?.(reconnecting, attempt);
    };
    
    collaborationService.onReconnectSuccess = () => {
      reconnectSuccessHandlerRef.current?.();
    };
    
    return () => {
      console.log('🧹 Story Page: Cleaning up reconnection handlers');
      if (collaborationService.onReconnectStateChange) {
        collaborationService.onReconnectStateChange = undefined;
      }
      if (collaborationService.onReconnectSuccess) {
        collaborationService.onReconnectSuccess = undefined;
      }
    };
  }, []);
  
  // Auto-save title to store when it changes (debounced)
  useEffect(() => {
    if (currentStory && storyTitle && storyTitle !== currentStory.title) {
      const timeoutId = setTimeout(() => {
        updateStory(currentStory.id, { title: storyTitle });
      }, 500); // Save 500ms after user stops typing
      
      return () => clearTimeout(timeoutId);
    }
  }, [storyTitle, currentStory, updateStory]);

  // Auto-join collaboration if coming from collab mode or returning from canvas
  useEffect(() => {
    // FIRST: Check if explicitly requesting solo mode
    if (isCollaborative === false) {
      console.log('🎯 Solo mode explicitly requested - clearing any stored collaboration state');
      // Clear session from sessionStorage
      try {
        sessionStorage.removeItem('collab_session_id');
        sessionStorage.removeItem('collab_session_timestamp');
        sessionStorage.removeItem('collab_join_code');
      } catch (e) {
        console.error('Failed to clear session storage:', e);
      }
      // Disconnect if connected
      if (collaborationService.isConnected()) {
        collaborationService.disconnect();
      }
      setCurrentSessionId(null);
      setIsHost(false);
      setShowLobby(false);
      setIsCollaborating(false);
      setJoinCode(null);
      return;
    }
    
    // Try to restore session from storage on page load/refresh
    const storedSessionId = collaborationService.getStoredSessionId();
    
    if (storedSessionId && !collabSessionId && !isCollaborating) {
      console.log('♻️ Detected page refresh - restoring collaboration session:', storedSessionId);
      setCurrentSessionId(storedSessionId);
      setIsCollaborating(true);
      setShowLobby(false); // CRITICAL: Bypass lobby on reconnection - user was already in the session
      
      // Try to restore join code from storage first (immediate)
      const storedJoinCode = sessionStorage.getItem('collab_join_code');
      if (storedJoinCode) {
        setJoinCode(storedJoinCode);
        console.log('✅ Restored join code from storage:', storedJoinCode);
      }
      
      // Fetch session info to determine if user is host and get join code (as backup)
      getCollaborationSession(storedSessionId)
        .then((sessionData) => {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            setIsHost(sessionData.host_id === user.id);
          }
          // Set join code if available and persist it
          if (sessionData.join_code) {
            setJoinCode(sessionData.join_code);
            sessionStorage.setItem('collab_join_code', sessionData.join_code);
          }
        })
        .catch((error) => {
          console.error('❌ Failed to fetch session info:', error);
        });
      
      return;
    }
    
    // If we have a session ID and are not yet collaborating, set up the session
    if (collabSessionId && !isCollaborating) {
      console.log('🔄 Setting up collaboration session:', collabSessionId, 'isCollaborative:', isCollaborative, 'bypassLobby:', bypassLobby);
      
      // If explicitly set to solo mode (isCollaborative: false), skip collaboration setup
      if (isCollaborative === false) {
        console.log('🚫 Solo mode explicitly requested - skipping collaboration setup');
        setCurrentSessionId(null);
        setIsHost(false);
        setShowLobby(false);
        return;
      }
      
      // Check if returning from canvas (will have returnToPageIndex in state)
      const returningFromCanvas = isCollaborative && (location.state as any)?.returnToPageIndex !== undefined;
      
      // If coming from canvas, restore the collaboration state immediately
      if (returningFromCanvas) {
        console.log('↩️ Returning from canvas - restoring collaboration state');
        setCurrentSessionId(collabSessionId);
        setIsHost(isHostFromNav || false);
        setIsCollaborating(true);
        setShowLobby(false); // Make sure lobby doesn't show
        
        // Restore join code from storage when returning from canvas
        const storedJoinCode = sessionStorage.getItem('collab_join_code');
        console.log('🔑 Checking for join code in storage when returning from canvas:', storedJoinCode);
        if (storedJoinCode) {
          setJoinCode(storedJoinCode);
          console.log('✅ Restored join code when returning from canvas:', storedJoinCode);
        } else {
          console.log('⚠️ No join code found in storage, fetching from server...');
          // Fetch from server as fallback
          getCollaborationSession(collabSessionId)
            .then((sessionData) => {
              if (sessionData.join_code) {
                setJoinCode(sessionData.join_code);
                sessionStorage.setItem('collab_join_code', sessionData.join_code);
                console.log('✅ Fetched and stored join code:', sessionData.join_code);
              }
            })
            .catch((error) => {
              console.error('❌ Failed to fetch session for join code:', error);
            });
        }
        
        // Ensure story exists (it should already exist when returning from canvas)
        if (!currentStory && !hasCreatedStory.current) {
          console.log('⚠️ No story found when returning from canvas, creating one...');
          const newStory = createStory('Collaborative Story');
          setStoryTitle(newStory.title);
          setCurrentStory(newStory);
          hasCreatedStory.current = true;
        }
      } else {
        // First time starting collaboration (or accepting invitation)
        if (isHostFromNav) {
          console.log('🎯 User is HOST - starting collaboration immediately');
          handleHostSessionStart(collabSessionId);
        } else {
          console.log('👥 User is PARTICIPANT - joining session');
          console.log('🔍 Calling handleSessionJoined with sessionId:', collabSessionId);
          handleSessionJoined(collabSessionId);
        }
      }
    }
  }, [isCollaborative, collabSessionId]);

  // Get current user ID
  useEffect(() => {
    // Try both 'user_data' and 'user' keys
    let userStr = localStorage.getItem('user_data');
    if (!userStr) {
      userStr = localStorage.getItem('user');
    }
    console.log('👤 Getting current user from localStorage:', userStr);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
        setCurrentUsername(user.username || user.name || user.email || '');
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    } else {
      console.warn('⚠️ No user found in localStorage');
    }
  }, []);

  // Periodic participant sync to keep counts consistent
  useEffect(() => {
    if (!isCollaborating || !currentSessionId) return;
    
    const syncParticipants = () => {
      collaborationService.getPresence(currentSessionId)
        .then(data => {
          console.log('🔄 Periodic participant sync:', data.participants?.length);
          setParticipants(data.participants || []);
        })
        .catch(err => console.error('❌ Periodic sync failed:', err));
    };
    
    // Sync every 10 seconds to keep participants in sync
    const syncInterval = setInterval(syncParticipants, 10000);
    
    return () => clearInterval(syncInterval);
  }, [isCollaborating, currentSessionId]);

  // WebSocket connection and event handlers for collaboration (stabilized)
  useEffect(() => {

    // Connect if either collaborating OR in lobby (to receive session_started)
    if ((!isCollaborating && !showLobby) || !currentSessionId) {
      console.log('⏸️ Skipping WebSocket connection - not ready');
      return;
    }

    console.log('🔌 Connecting to collaboration session:', currentSessionId);

    collaborationService
      .connect(currentSessionId)
      .then(() => {
        console.log('✅ Connected to collaboration session');

        const handleInit = (message: any) => {
          if (message.type !== 'init') return;

          if (message.current_user_id) {
            setCurrentUserId(message.current_user_id);
          }
          
          // Load participants from init message or fetch them
          if (message.participants && Array.isArray(message.participants)) {
            console.log('👥 Setting participants from init message:', message.participants.length);
            setParticipants(message.participants);
          } else {
            console.log('📡 Fetching participants via getPresence()');
            // Fetch participants separately if not in init message
            setTimeout(() => {
              if (currentSessionId) {
                collaborationService.getPresence(currentSessionId)
                  .then(data => {
                    console.log('✅ Presence data received:', data);
                    setParticipants(data.participants || []);
                  })
                  .catch(err => console.error('❌ Failed to get presence:', err));
              }
            }, 500);
          }

          const draft = message.story_draft || {};
          const canvasData = message.canvas_data || {};
          
          if (draft.title) {
            // Update local title state
            setStoryTitle(draft.title);
            // Also update the store story title so UI stays consistent
            if (currentStory) {
              updateStory(currentStory.id, { title: draft.title });
            } else {
              // If no story exists yet locally, create one with the server title
              const newStory = createStory(draft.title);
              setStoryTitle(newStory.title);
              setCurrentStory(newStory);
            }
          }

          const serverPages: any[] = Array.isArray(draft.pages) ? draft.pages : [];
          if (currentStory) {
            const localLen = currentStory.pages.length;
            const serverLen = serverPages.length;

            // Add missing local pages to match server length
            if (serverLen > localLen) {
              for (let i = localLen; i < serverLen; i++) {
                const serverPage = serverPages[i];
                if (serverPage && serverPage.id) {
                  // Use server-provided page ID for consistency across collaborators
                  addPageWithId(currentStory.id, serverPage.id, serverPage.text || '');
                  console.log(`✅ Created page ${i} with server ID:`, serverPage.id);
                } else {
                  // Fallback to normal page creation
                  addPage(currentStory.id);
                  console.log(`⚠️ Created page ${i} with generated ID (server didn't provide ID)`);
                }
              }
            } else if (serverLen < localLen) {
              console.warn('⚠️ Local has more pages than server; skipping deletion. Consider reconciling later.', { localLen, serverLen });
            }

            // Apply text for each page from server draft
            const applyLen = Math.min(useStoryStore.getState().getStory(currentStory.id)?.pages.length || 0, serverLen);
            for (let i = 0; i < applyLen; i++) {
              const serverText = serverPages[i]?.text;
              if (typeof serverText === 'string') {
                const latestStory = useStoryStore.getState().getStory(currentStory.id);
                if (latestStory && latestStory.pages[i]) {
                  const pageId = latestStory.pages[i].id;
                  updatePage(currentStory.id, pageId, { text: serverText });
                }
              }
            }
          }
          
          // Load canvas data for all pages and cover
          console.log('📦 Loading canvas data from server:', canvasData);
          if (currentStory && canvasData) {
            // Load cover image canvas
            if (canvasData.cover_image) {
              console.log('🖼️ Loading cover image canvas data');
              updatePreviewCanvasBackground('cover', canvasData.cover_image);
            }
            
            // Load page canvases
            if (canvasData.pages) {
              Object.entries(canvasData.pages).forEach(([pageId, canvasDataUrl]: [string, any]) => {
                console.log('📄 Loading canvas for page:', pageId);
                updatePreviewCanvasBackground(pageId, canvasDataUrl);
              });
            }
          }
        };

        const handleTitleEdit = (message: any) => {
          if (message.type !== 'title_edit') return;
          console.log('🖊️ Title update received:', message.title);
          setStoryTitle(message.title);
          if (currentStory) {
            updateStory(currentStory.id, { title: message.title });
          }
        };
        
        const handleReconnectionFailed = (message: any) => {
          if (message.type !== 'reconnection_failed') return;
          console.error('❌ Reconnection failed - showing notification');
          setNotificationMessage('Lost connection to collaboration session. Please refresh the page to reconnect.');
          setShowSuccessNotification(true);
        };

        const handleUserJoined = (message: any) => {
          if (message.type !== 'user_joined') return;
          console.log('👋 User joined:', message.username);
          
          // Show toast notification with deduplication
          showDedupedToast(`${message.username} joined the session`);
          
          // Immediately refresh participant list
          setTimeout(() => {
            collaborationService.getPresence(currentSessionId!)
              .then(data => {
                console.log('🔄 Refreshed participants after join:', data.participants?.length);
                setParticipants(data.participants || []);
              })
              .catch(() => {});
          }, 500);
        };

        const handleUserLeft = (message: any) => {
          if (message.type !== 'user_left') return;
          console.log('👋 User left:', message.username);
          
          // Show toast notification with deduplication
          showDedupedToast(`${message.username} left the session`);
          
          // Immediately refresh participant list
          setTimeout(() => {
            collaborationService.getPresence(currentSessionId!)
              .then(data => {
                console.log('🔄 Refreshed participants after leave:', data.participants?.length);
                setParticipants(data.participants || []);
              })
              .catch(() => {});
          }, 500);
        };

        const handlePresenceUpdate = (message: any) => {
          if (message.type !== 'presence_update') return;
          // Merge presence info into participants state
          setParticipants(prev => {
            const existed = prev.find(p => p.id === message.user_id);
            if (existed) {
              return prev.map(p => p.id === message.user_id ? {
                ...p,
                current_tool: message.current_tool || p.current_tool,
                activity: message.activity ?? p.activity,
              } : p);
            }
            // If not found, add a minimal participant entry
            return prev.concat([{
              id: message.user_id,
              username: message.username,
              display_name: message.username,
              role: 'participant',
              cursor_color: '#999999',
              is_active: true,
              current_tool: message.current_tool,
              activity: message.activity,
            } as any]);
          });

          if (message.activity === 'typing_title') {
            console.log(`✍️ ${message.username} is editing the title...`);
          } else if (message.activity === 'typing_text') {
            console.log(`✍️ ${message.username} is typing page text...`);
          }
        };

        const handlePageChangeEvent = (message: any) => {
          // SECURITY FIX: Only handle actual page_change messages
          if (message.type !== 'page_change') return;
          
          console.log(`📄 ${message.username} moved to page ${message.page_number}`);
          
          // Update who is on what page (only for page_change messages)
          setParticipants(prev => prev.map(p => 
            p.username === message.username 
              ? { ...p, current_page: message.page_number } 
              : p
          ));
          
          // Request fresh page viewers data when someone changes pages (for the modal)
          if (showPageDeletionModal && currentSessionId) {
            collaborationService.requestPageViewers();
          }
          
          // CRITICAL: Do NOT change currentPageIndex here!
          // Users should stay on their own page and only see remote updates
          // Page navigation only happens through explicit user action
        };

        const handlePageAdded = (message: any) => {
          if (message.type !== 'page_added') return;
          
          console.log('➕ Page added by', message.username, 'data:', message.page_data);
          
          // Get the latest story state from the store
          const latestStory = useStoryStore.getState().currentStory;
          if (!latestStory) {
            console.error('❌ No current story found when handling page_added');
            return;
          }
          
          const currentPageCount = latestStory.pages.length;
          const expectedIndex = message.page_data?.page_index;
          
          console.log('📊 Page addition check:', {
            currentPageCount,
            expectedIndex,
            messageData: message.page_data,
            addedBy: message.username,
            currentUser: currentUsername
          });
          
          // Check if we already have this page (prevent duplicate additions)
          if (typeof expectedIndex === 'number') {
            if (expectedIndex < currentPageCount) {
              console.log('⚠️ Page at index', expectedIndex, 'already exists, skipping addition');
              // Clear the adding page flag even if skipping
              (window as any).addingPage = false;
              return;
            }
            
            // If there's a gap, fill it with empty pages first
            if (expectedIndex > currentPageCount) {
              console.log('⚠️ Gap detected between', currentPageCount, 'and', expectedIndex, '- filling with empty pages');
              for (let i = currentPageCount; i < expectedIndex; i++) {
                insertPageAt(latestStory.id, i);
                console.log('➕ Filled gap with empty page at index', i);
              }
            }
            
            // Add page at the expected index with server-provided ID
            const serverPageId = message.page_data?.id;
            if (serverPageId) {
              insertPageAtWithId(latestStory.id, expectedIndex, serverPageId, message.page_data?.text || '');
              console.log('✅ Page inserted at index', expectedIndex, 'with server ID:', serverPageId);
            } else {
              insertPageAt(latestStory.id, expectedIndex);
              console.log('✅ Page inserted at index', expectedIndex, 'with generated ID');
            }
            
            // Only navigate to the new page if this user added it
            if (message.user_id === currentUserId) {
              setCurrentPageIndex(expectedIndex);
            }
          } else {
            // Fallback: add at end
            const serverPageId = message.page_data?.id;
            if (serverPageId) {
              addPageWithId(latestStory.id, serverPageId, message.page_data?.text || '');
              console.log('✅ Page added at end with server ID:', serverPageId);
            } else {
              addPage(latestStory.id);
              console.log('✅ Page added at end with generated ID');
            }
            
            // Only navigate to the new page if this user added it
            if (message.user_id === currentUserId) {
              setCurrentPageIndex(currentPageCount); // Use current count as new index
            }
          }
          
          // Clear the adding page flag
          (window as any).addingPage = false;
          
          // Force a re-render by updating the story reference
          const refreshedStory = useStoryStore.getState().getStory(latestStory.id);
          if (refreshedStory) {
            setCurrentStory(refreshedStory);
          }
        };

        const handlePageDeleted = (message: any) => {
          if (message.type !== 'page_deleted') return;
          console.log('🗑️ Page deleted by', message.username, 'page_index:', message.page_index, 'page_id:', message.page_id);
          
          // Get the latest story state from the store
          const latestStory = useStoryStore.getState().currentStory;
          if (!latestStory) {
            console.error('❌ No current story found when handling page_deleted');
            return;
          }
          
          let idx = -1;
          if (typeof message.page_index === 'number') {
            idx = message.page_index;
          } else if (message.page_id) {
            idx = latestStory.pages.findIndex(p => p.id === message.page_id);
          }
          
          if (idx >= 0 && idx < latestStory.pages.length) {
            console.log('🗑️ Deleting page at index', idx, 'with ID:', latestStory.pages[idx].id);
            deletePage(latestStory.id, latestStory.pages[idx].id);
            
            // Update current page index after deletion
            const newPageCount = latestStory.pages.length - 1; // After deletion
            if (currentPageIndex === idx) {
              // If we're on the deleted page, move to previous page or stay at 0
              setCurrentPageIndex(Math.max(0, idx - 1));
            } else if (currentPageIndex > idx) {
              // If we're on a page after the deleted one, shift index down
              setCurrentPageIndex(currentPageIndex - 1);
            }
            // If currentPageIndex < idx, no change needed
            
            console.log('📊 Page deletion complete:', {
              deletedIndex: idx,
              oldPageIndex: currentPageIndex,
              newPageCount,
              newPageIndex: currentPageIndex === idx ? Math.max(0, idx - 1) : currentPageIndex > idx ? currentPageIndex - 1 : currentPageIndex
            });
            
            // Force a re-render by updating the story reference
            setTimeout(() => {
              const refreshedStory = useStoryStore.getState().getStory(latestStory.id);
              if (refreshedStory) {
                setCurrentStory(refreshedStory);
              }
            }, 50);
          } else {
            console.warn('⚠️ Could not find page to delete at index', idx);
          }
        };

        const handleTextUpdate = (message: any) => {
          if (message.type !== 'text_edit') return;
          console.log('📨 Text update message received:', message);
          if (message.user_id === currentUserId) {
            console.log('🔇 Ignoring own echo');
            return;
          }

          // Set flag to prevent sending our own updates while applying remote changes
          isReceivingRemoteTextRef.current = true;

          // Prefer authoritative server index for mapping; id is local-only and differs per client
          const pageId = message.page_id;
          let idx = -1;
          if (currentStory) {
            if (typeof message.page_index === 'number') {
              idx = message.page_index;
            } else if (pageId !== undefined && pageId !== null) {
              // Compare as strings to handle mixed id types (string vs number)
              const pidStr = String(pageId);
              idx = currentStory.pages.findIndex(p => String(p.id) === pidStr);
            }
            // If the referenced page doesn't exist yet (out-of-order event), create pages up to that index
            if (idx >= 0) {
              let latest = useStoryStore.getState().getStory(currentStory.id);
              while (latest && latest.pages.length <= idx) {
                // Insert at the end until we reach the desired length
                insertPageAt(currentStory.id, latest.pages.length);
                latest = useStoryStore.getState().getStory(currentStory.id);
              }
            }
            const latestStory = useStoryStore.getState().getStory(currentStory.id);
            if (latestStory && idx >= 0 && idx < latestStory.pages.length) {
              console.log('✍️ Applying remote text to page', idx, '(incoming id:', pageId, ')');
              updatePage(latestStory.id, latestStory.pages[idx].id, {
                text: message.text,
              });
              
              // BUG FIX: DO NOT call setCurrentStory here!
              // The updatePage function already updates the Zustand store, which will trigger
              // React re-renders automatically. Calling setCurrentStory causes extra renders
              // that interfere with currentPageIndex and cause users to be pulled to the wrong page.
              // The setTimeout+setCurrentStory was unnecessary and causing the page pull bug.
            } else {
              console.warn('⚠️ Could not map incoming text_edit to a local page', message);
            }
          }

          // Clear the flag after a short delay
          setTimeout(() => {
            isReceivingRemoteTextRef.current = false;
          }, 100);
        };

        const handleSessionStarted = (message: any) => {
          if (message.type !== 'session_started' && message.type !== 'collaboration_session_started') return;
          console.log('🎉 Session started message received from WebSocket:', message);
          
          // IMMEDIATELY close lobby and start collaborating
          console.log('✅ Closing lobby and starting collaboration NOW');
          setShowLobby(false);
          setIsCollaborating(true);
          
          // Also dispatch browser event for any other listeners
          window.dispatchEvent(new CustomEvent('collaboration-session-started', { 
            detail: { session_id: currentSessionId } 
          }));
        };

        // Voting handlers
        const handleVoteInitiated = async (message: any) => {
          // Fetch fresh participant list before showing voting modal
          if (currentSessionId) {
            try {
              const presenceData = await collaborationService.getPresence(currentSessionId);
              setParticipants(presenceData.participants || []);
            } catch (error) {
              console.error('Failed to fetch participants for voting:', error);
            }
          }
          
          const voteData = {
            vote_id: message.vote_id,
            initiated_by: message.initiated_by,
            initiated_by_username: message.initiated_by_username,
            total_participants: message.total_participants,
            question: message.question || 'Save and end the collaboration session?'
          };
          
          setVotingData(voteData);
          voteInitiatorRef.current = message.initiated_by;
          setShowVotingModal(true);
          
          // Auto-vote "agree" if this user initiated the vote
          if (message.initiated_by == currentUserId) {
            console.log('🚀 Vote initiator: Auto-voting YES and preventing saving overlay');
            // Ensure the saving overlay never shows for the vote initiator
            setShowSavingOverlay(false);
            // Vote immediately with the vote_id from the message
            setTimeout(() => {
              if (message.vote_id) {
                collaborationService.voteToSave(message.vote_id, true)
                  .then(() => console.log('✅ Vote initiator auto-voted YES'))
                  .catch(err => console.error('❌ Failed to auto-vote:', err));
              } else {
                console.error('❌ No vote_id in message for auto-vote');
              }
            }, 500);
          }
        };

        const handleVoteUpdate = (message: any) => {
          
          // Update the voting data with new votes
          setVotingData((prev: any) => {
            if (!prev || prev.vote_id !== message.vote_id) return prev;
            
            return {
              ...prev,
              voting_data: message.voting_data || {},
              current_votes: message.current_votes || 0,
              yes_count: message.yes_count || 0,
              no_count: message.no_count || 0
            };
          });
        };

        const handleVoteResult = (message: any) => {
          const voteInitiatorId = voteInitiatorRef.current;
          const isCurrentUserInitiator = voteInitiatorId && voteInitiatorId == currentUserId;
          
          console.log('🗳️ Vote result received:', {
            approved: message.approved,
            voteInitiatorId,
            currentUserId,
            isCurrentUserInitiator,
            initiatorName: votingData?.initiated_by_username
          });
          
          setShowVotingModal(false);
          
          if (message.approved) {
            if (isCurrentUserInitiator) {
              // Vote initiator: Show save modal, hide saving overlay
              console.log('✅ Vote initiator: Opening save modal, setting wasVoteInitiator=true');
              setWasVoteInitiator(true);
              console.log('✅ After setWasVoteInitiator(true)');
              // CRITICAL: Ensure overlay is NEVER shown for vote initiator
              setShowSavingOverlay(false);
              setShowVotingModal(false);
              setShowSuccessNotification(false); // Don't show the notification overlay
              setTimeout(() => {
                setShowSaveModal(true);  // Show save modal
                showInfoToast('Vote passed! Please complete the save process.');
              }, 100);
            } else {
              // Other participants: Show saving overlay, hide save modal
              const initiatorName = votingData?.initiated_by_username || 'Host';
              console.log('⏳ Other participant: Showing saving overlay');
              setWasVoteInitiator(false);
              setShowSaveModal(false);      // Hide save modal first
              setShowVotingModal(false);
              setTimeout(() => {
                setShowSavingOverlay(true);   // Then show overlay
                showInfoToast(`Vote passed! ${initiatorName} is completing the save process...`);
                
                // Safety timeout for participants - auto-dismiss and navigate after 15 seconds
                const participantTimeout = setTimeout(() => {
                  console.warn('⚠️ Participant safety timeout - auto-navigating');
                  setShowSavingOverlay(false);
                  setShowSaveModal(false);
                  collaborationService.disconnect();
                  setIsCollaborating(false);
                  setCurrentSessionId(null);
                  navigate('/library', { state: { activeTab: 'private' } });
                }, 15000);
                
                // Store timeout so session_ended can clear it
                (window as any).participantTimeoutId = participantTimeout;
              }, 100);
            }
          } else {
            showInfoToast('Vote did not pass. Collaboration continues.');
            setShowSavingOverlay(false);
            setShowSaveModal(false);
            setShowVotingModal(false);
          }
          
          // Don't clear voteInitiatorRef yet - we need it in handleStoryFinalized
          // It will be cleared in handleSessionEnded
          setVotingData(null);
        };

        const handleStorySavedSuccess = (message: any) => {
          if (currentUsername !== message.saved_by_username) {
            setShowSavingOverlay(false);
            setNotificationMessage(`Story saved by ${message.saved_by_username}!`);
            setShowSuccessNotification(true);
            showInfoToast(`🎉 ${message.saved_by_username} saved the story successfully!`);
          }
        };

        const handleSaveCancelled = (message: any) => {
          if (message.type !== 'save_cancelled') return;
          console.log('🚫 Save process cancelled by vote initiator');
          // Hide the saving overlay for other participants
          setShowSavingOverlay(false);
          const cancellerName = message.cancelled_by_username || 'Host';
          showInfoToast(`${cancellerName} cancelled the save process. Collaboration continues.`);
        };

        const handleStoryFinalized = (message: any) => {
          console.log('✅ Story finalized message received:', message);
          
          // Check if current user is the vote initiator
          const voteInitiatorId = voteInitiatorRef.current;
          const isCurrentUserInitiator = voteInitiatorId && voteInitiatorId == currentUserId;
          
          // Only show saving overlay for NON-initiators
          if (!isCurrentUserInitiator) {
            // Show success notification for participants
            setNotificationMessage('Story saved successfully to everyone\'s library!');
            setShowSuccessNotification(true);
            showInfoToast('🎉 Story saved successfully!');
          } else {
            console.log('🚀 Vote initiator: Skipping story_finalized overlay (will show save modal)');
          }
        };

        const handleSessionEnded = (message: any) => {
          console.log('🎬 Session ended message received:', message);
          
          // Clear all safety timeouts
          if ((window as any).sessionEndTimeoutId) {
            clearTimeout((window as any).sessionEndTimeoutId);
            (window as any).sessionEndTimeoutId = null;
          }
          if ((window as any).participantTimeoutId) {
            clearTimeout((window as any).participantTimeoutId);
            (window as any).participantTimeoutId = null;
          }
          
          // Clear vote initiator ref now that session is ending
          const wasInitiator = voteInitiatorRef.current === currentUserId;
          voteInitiatorRef.current = null;
          
          console.log('🔄 Cleaning up collaboration state...');
          setShowSavingOverlay(false);
          setShowSaveModal(false); // Also close save modal if it's open
          setShowSuccessNotification(false);
          collaborationService.disconnect();
          setIsCollaborating(false);
          setCurrentSessionId(null);
          
          // Only show toast if not the vote initiator (they already completed save)
          if (!wasInitiator) {
            showInfoToast(`🎉 Collaboration session ended.`);
          }
          
          // Navigate to library immediately for vote initiator, after delay for others
          const navDelay = wasInitiator ? 500 : 2000;
          console.log(`🚀 Navigating to library in ${navDelay}ms...`);
          setTimeout(() => {
            console.log('📍 Executing navigation to library');
            navigate('/library', { state: { activeTab: 'private' } });
          }, navDelay);
        };

        const handlePageViewersResponse = (message: any) => {
          if (message.type !== 'page_viewers_response') return;
          setPageViewers(message.page_viewers || {});
        };

        // CROSS-PAGE COLLABORATION: Handle canvas drawing events from other users
        const handleCanvasDrawing = (message: any) => {
          if (message.type !== 'draw' && message.type !== 'drawing_update') {
            return;
          }
          
          
          // Update canvas data in the store so it's available when user switches to canvas
          if (currentStory && message.page_id) {
            const messagePageId = message.page_id;
            const messagePageIndex = message.page_index;
            const isCoverImageDrawing = message.is_cover_image || messagePageId === 'cover_image';
            
            // Find the correct local page ID using page_index as fallback
            let localPageId = messagePageId;
            if (!isCoverImageDrawing && messagePageIndex !== undefined) {
              // If the page doesn't exist yet at this index, create it
              if (!currentStory.pages[messagePageIndex]) {
                console.log('⚠️ Page at index', messagePageIndex, 'does not exist. Creating pages...');
                const storyStore = useStoryStore.getState();
                let latestStory = storyStore.getStory(currentStory.id);
                
                // Create pages up to the needed index
                while (latestStory && latestStory.pages.length <= messagePageIndex) {
                  console.log('➕ Creating page', latestStory.pages.length);
                  addPage(currentStory.id);
                  latestStory = storyStore.getStory(currentStory.id);
                }
                
                // BUG FIX: DO NOT call setCurrentStory here!
                // The store already updated via addPage/insertPageAt, which will trigger
                // React re-renders automatically. Calling setCurrentStory causes extra renders
                // that interfere with currentPageIndex and cause page pull bugs.
                // This was part of the drawing page pull bug.
              }
              
              // Now map to local page ID
              const refreshedStory = useStoryStore.getState().getStory(currentStory.id);
              if (refreshedStory && refreshedStory.pages[messagePageIndex]) {
                localPageId = refreshedStory.pages[messagePageIndex].id;
              } else {
                console.warn('⚠️ Could not find page at index', messagePageIndex, 'even after creation');
              }
            }
            
            // Drawing operation details processed
            
            // Get existing canvas data from the store using LOCAL page ID
            const storyStore = useStoryStore.getState();
            const existingData = storyStore.getCanvasData(currentStory.id, localPageId);
            
            // Handle both object (with operations) and string (base64 image) format
            let canvasDataUrl = null;
            let existingOperations = [];
            
            if (typeof existingData === 'object' && existingData !== null) {
              canvasDataUrl = existingData.canvasDataUrl;
              existingOperations = existingData.operations || [];
            } else if (typeof existingData === 'string') {
              canvasDataUrl = existingData;
            }
            
            // Append the new drawing operation
            const updatedOperations = [
              ...existingOperations,
              {
                type: message.data.type,
                data: message.data,
                timestamp: Date.now(),
                user: message.username
              }
            ].slice(-100); // Keep last 100 operations to prevent memory bloat
            
            // Create updated canvas data object
            const updatedCanvasData = {
              canvasDataUrl: canvasDataUrl,
              operations: updatedOperations,
              lastUpdate: Date.now()
            };
            
            // Save updated canvas data (handle cover image separately)
            if (isCoverImageDrawing) {
              // For cover image, we need a different storage approach
              // Create a temporary storage key for cover operations
              const COVER_OPERATIONS_KEY = '__cover_operations__';
              storyStore.saveCanvasData(currentStory.id, COVER_OPERATIONS_KEY, updatedCanvasData);
              console.log('💾 Saved COVER IMAGE canvas data with', updatedOperations.length, 'operations');
            } else {
              // For regular pages, save to page canvas data
              storyStore.saveCanvasData(currentStory.id, localPageId, updatedCanvasData);
              console.log('💾 Saved PAGE canvas data with', updatedOperations.length, 'operations');
            }
            
            console.log('💾 Canvas data structure:', {
              storyId: currentStory.id,
              localPageId,
              messagePageId,
              isCoverImage: isCoverImageDrawing,
              hasCanvasUrl: !!updatedCanvasData.canvasDataUrl,
              operationsCount: updatedCanvasData.operations.length,
              lastUpdate: updatedCanvasData.lastUpdate
            });
            
            // Verify it was saved correctly by reading it back
            const verifyKey = isCoverImageDrawing ? '__cover_operations__' : localPageId;
            const verifyData = storyStore.getCanvasData(currentStory.id, verifyKey);
            console.log('✅ Verification - data retrieved after save:', {
              hasData: !!verifyData,
              dataType: typeof verifyData,
              isObject: typeof verifyData === 'object',
              hasOperations: verifyData && typeof verifyData === 'object' ? !!verifyData.operations : false,
              operationsCount: verifyData && typeof verifyData === 'object' ? verifyData.operations?.length : 0
            });
            
            // REAL-TIME VISUAL UPDATE: Mark this page as having new drawing activity
            setCanvasActivity(prev => {
              const newMap = new Map(prev);
              newMap.set(localPageId, {
                timestamp: Date.now(),
                user: message.username || 'Collaborator'
              });
              return newMap;
            });
            
            // LIVE PREVIEW: Render the drawing to the preview canvas immediately
            // Only render to preview if this drawing belongs to the correct canvas type
            if (isCoverImageDrawing) {
              renderDrawingToPreview('cover', message.data);
            } else if (currentStory.pages.some(p => p.id === localPageId)) {
              renderDrawingToPreview(localPageId, message.data);
            } else {
              console.log('⚠️ Unknown page ID for drawing:', localPageId, '(messagePageId:', messagePageId, ')');
            }
            
            // BUG FIX: DO NOT call setCurrentStory here!
            // The saveCanvasData function already updates the Zustand store, which will trigger
            // React re-renders automatically. Calling setCurrentStory causes extra renders
            // that interfere with currentPageIndex and cause users to be pulled to the wrong page.
            // This was the root cause of the drawing page pull bug.
            
            console.log('🖌️ Remote drawing activity detected - LIVE PREVIEW updated!');
          } else {
            console.log('⚠️ Missing currentStory or page_id:', { hasCurrentStory: !!currentStory, pageId: message.page_id });
          }
        };

        // CROSS-PAGE COLLABORATION: Handle canvas clear events
        const handleCanvasClear = (message: any) => {
          if (message.type !== 'clear' && message.type !== 'canvas_cleared') return;
          console.log('🧹 Canvas cleared by collaborator:', message.username || 'Unknown', 'for page:', message.page_id);
          
          // Clear canvas data in the store
          if (currentStory && message.page_id) {
            const pageId = message.page_id;
            const isCoverImageClear = message.is_cover_image || pageId === 'cover_image';
            
            console.log('🔍 Clear operation details:', {
              pageId,
              isCoverImageClear,
              messagePageIndex: message.page_index
            });
            
            const storyStore = useStoryStore.getState();
            // Clear both canvas data and operations
            storyStore.saveCanvasData(currentStory.id, message.page_id, null as any);
            
            // Also clear canvasOperations explicitly
            const story = storyStore.getStory(currentStory.id);
            const page = story?.pages.find(p => p.id === message.page_id);
            if (page) {
              storyStore.updatePage(currentStory.id, message.page_id, { 
                canvasData: undefined,
                canvasOperations: []
              });
            }
            
            // LIVE PREVIEW: Clear the preview canvas immediately
            if (isCoverImageClear) {
              console.log('🧽 Clearing COVER IMAGE preview canvas');
              clearPreviewCanvas('cover');
            } else if (currentStory.pages.some(p => p.id === pageId)) {
              console.log('🧽 Clearing PAGE preview canvas:', pageId);
              clearPreviewCanvas(pageId);
            } else {
              console.log('⚠️ Unknown page ID for clear:', pageId);
            }
            
            // Clear canvas activity indicator for the appropriate canvas
            setCanvasActivity(prev => {
              const newMap = new Map(prev);
              if (isCoverImageClear) {
                newMap.delete('cover');
              } else {
                newMap.delete(pageId);
              }
              return newMap;
            });
            
            console.log('🗑️ Canvas data cleared from store and live preview updated');
          }
        };

        // Debug: Listen to ALL messages and track setCurrentPageIndex calls
        const handleAllMessages = (message: any) => {
          console.log('🔔 WebSocket message received (all):', message.type, message);
          
          // CRITICAL DEBUG: Track if any message tries to change page
          if (message.page_number !== undefined || message.page_index !== undefined) {
            console.warn('⚠️ Message contains page info:', {
              type: message.type,
              page_number: message.page_number,
              page_index: message.page_index,
              username: message.username,
              currentPageIndex: currentPageIndex
            });
          }
        };
        collaborationService.on('all', handleAllMessages);
        
        collaborationService.on('init', handleInit);
        collaborationService.on('title_edit', handleTitleEdit);
        collaborationService.on('reconnection_failed', handleReconnectionFailed);
        collaborationService.on('text_edit', handleTextUpdate);
        collaborationService.on('user_joined', handleUserJoined);
        collaborationService.on('user_left', handleUserLeft);
        collaborationService.on('presence_update', handlePresenceUpdate);
        collaborationService.on('page_change', handlePageChangeEvent);
        collaborationService.on('page_added', handlePageAdded);
        collaborationService.on('page_deleted', handlePageDeleted);
        collaborationService.on('page_viewers_response', handlePageViewersResponse);
        collaborationService.on('session_started', handleSessionStarted);
        collaborationService.on('collaboration_session_started', handleSessionStarted);
        // Voting handlers
        collaborationService.on('vote_initiated', handleVoteInitiated);
        collaborationService.on('vote_update', handleVoteUpdate);
        collaborationService.on('vote_result', handleVoteResult);
        collaborationService.on('story_saved_success', handleStorySavedSuccess);
        collaborationService.on('save_cancelled', handleSaveCancelled);
        collaborationService.on('story_finalized', handleStoryFinalized);
        collaborationService.on('session_ended', handleSessionEnded);
        // Cross-page collaboration handlers
        collaborationService.on('draw', handleCanvasDrawing);
        collaborationService.on('drawing_update', handleCanvasDrawing);
        collaborationService.on('clear', handleCanvasClear);
        collaborationService.on('canvas_cleared', handleCanvasClear);

        // optional presence load (ignore errors) - only for active participants (not in lobby)
        if (isCollaborating && !showLobby) {
          setTimeout(() => {
            collaborationService.getPresence(currentSessionId).catch((err) => {
              console.log('⚠️ Could not load presence:', err.message);
            });
          }, 1500);
        }

        // cleanup for these handlers only
        return () => {
          collaborationService.off('all', handleAllMessages);
          collaborationService.off('init', handleInit);
          collaborationService.off('title_edit', handleTitleEdit);
          collaborationService.off('reconnection_failed', handleReconnectionFailed);
          collaborationService.off('text_edit', handleTextUpdate);
          collaborationService.off('user_joined', handleUserJoined);
          collaborationService.off('user_left', handleUserLeft);
          collaborationService.off('presence_update', handlePresenceUpdate);
          collaborationService.off('page_change', handlePageChangeEvent);
          collaborationService.off('page_added', handlePageAdded);
          collaborationService.off('page_deleted', handlePageDeleted);
          collaborationService.off('page_viewers_response', handlePageViewersResponse);
          collaborationService.off('session_started', handleSessionStarted);
          collaborationService.off('collaboration_session_started', handleSessionStarted);
          // Voting cleanup
          collaborationService.off('vote_initiated', handleVoteInitiated);
          collaborationService.off('vote_update', handleVoteUpdate);
          collaborationService.off('vote_result', handleVoteResult);
          collaborationService.off('story_saved_success', handleStorySavedSuccess);
          collaborationService.off('save_cancelled', handleSaveCancelled);
          collaborationService.off('story_finalized', handleStoryFinalized);
          collaborationService.off('session_ended', handleSessionEnded);
          // Cross-page collaboration cleanup
          collaborationService.off('draw', handleCanvasDrawing);
          collaborationService.off('drawing_update', handleCanvasDrawing);
          collaborationService.off('clear', handleCanvasClear);
          collaborationService.off('canvas_cleared', handleCanvasClear);
        };
      })
      .catch((error) => {
        console.error('❌ Failed to connect to collaboration:', error);
      });

    // Cleanup on unmount/exit
    // DON'T disconnect here - we want to keep the connection when navigating to canvas
    // The connection will be reused by CanvasDrawingPage
    return () => {
      // Only cleanup event listeners, not the WebSocket connection
      console.log('🔌 ManualStoryCreationPage unmounting (keeping WebSocket connection)');
    };
  }, [isCollaborating, showLobby, currentSessionId]);

  // Register current page preview ref when it changes
  useEffect(() => {
    if (currentStory && isCollaborating && canvasPreviewRef.current) {
      const page = currentStory.pages[currentPageIndex];
      if (page) {
        registerPreviewRef(page.id, canvasPreviewRef.current);
      }
    }
  }, [currentStory?.pages, currentPageIndex, isCollaborating, canvasPreviewRef.current]);

  // Initialize preview canvases with existing canvas data
  useEffect(() => {
    if (currentStory && isCollaborating) {
      // Update current page preview
      const currentPage = currentStory.pages[currentPageIndex];
      if (currentPage) {
        const canvasData = getCanvasData(currentStory.id, currentPage.id);
        if (canvasData) {
          const dataUrl = typeof canvasData === 'string' ? canvasData : canvasData.canvasDataUrl;
          updatePreviewCanvasBackground(currentPage.id, dataUrl);
        }
      }
      
      // Update cover image preview
      if (currentStory.coverImage) {
        updatePreviewCanvasBackground('cover', currentStory.coverImage);
      }
      
      // Update other pages' previews if they have canvas data
      currentStory.pages.forEach(page => {
        if (page.id !== currentPage?.id) {
          const pageCanvasData = getCanvasData(currentStory.id, page.id);
          if (pageCanvasData) {
            const dataUrl = typeof pageCanvasData === 'string' ? pageCanvasData : pageCanvasData.canvasDataUrl;
            updatePreviewCanvasBackground(page.id, dataUrl);
          }
        }
      });
    }
  }, [currentStory?.id, currentPageIndex, isCollaborating]);

  // Periodically capture canvas thumbnails (every 30 seconds)
  useEffect(() => {
    if (!isCollaborating || !currentStory) return;

    const captureInterval = setInterval(() => {
      console.log('📸 Capturing canvas thumbnails...');
      
      // Capture thumbnails for all pages with activity
      pagePreviewRefs.current.forEach((previewRef, pageId) => {
        if (previewRef && previewRef.getCanvasDataUrl) {
          const thumbnailUrl = previewRef.getCanvasDataUrl();
          if (thumbnailUrl) {
            console.log('💾 Saving thumbnail for page:', pageId);
            
            // Get existing data to preserve operations
            const existingData = getCanvasData(currentStory.id, pageId);
            let existingOperations = [];
            
            if (typeof existingData === 'object' && existingData !== null) {
              existingOperations = existingData.operations || [];
            }
            
            // Save thumbnail with operations preserved
            const updatedCanvasData = {
              canvasDataUrl: thumbnailUrl,
              operations: existingOperations,
              lastUpdate: Date.now()
            };
            
            const storyStore = useStoryStore.getState();
            storyStore.saveCanvasData(currentStory.id, pageId, updatedCanvasData);
          }
        }
      });
      
      // Capture cover image thumbnail
      if (coverPreviewRef.current && coverPreviewRef.current.getCanvasDataUrl) {
        const coverThumbnail = coverPreviewRef.current.getCanvasDataUrl();
        if (coverThumbnail) {
          console.log('💾 Saving cover image thumbnail');
          updateStory(currentStory.id, { coverImage: coverThumbnail });
        }
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(captureInterval);
  }, [isCollaborating, currentStory?.id]);

  // Listen for session start from host (for participants)
  useEffect(() => {
    if (!isHost && showLobby && currentSessionId) {
      const handleSessionStart = (event: any) => {
        if (event.detail.session_id === currentSessionId) {
          // Create story BEFORE setting isCollaborating to avoid white screen
          if (!currentStory && !hasCreatedStory.current) {
            console.log('Creating new story for participant collaboration');
            const newStory = createStory(storyTitle || 'Collaborative Story');
            setStoryTitle(newStory.title);
            setCurrentStory(newStory);
            hasCreatedStory.current = true;
          }
          
          // Now set collaboration state after story exists
          setShowLobby(false);
          setIsCollaborating(true);
        }
      };

      window.addEventListener('collaboration-session-started', handleSessionStart);
      
      // TEMPORARY WORKAROUND: For testing, allow participants to also start
      // In production, you might want to poll the session status
      console.log('⏰ Participant waiting in lobby for session:', currentSessionId);

      return () => {
        window.removeEventListener('collaboration-session-started', handleSessionStart);
      };
    }
  }, [isHost, showLobby, currentSessionId, currentStory, createStory]);

  // Listen for host exit (for participants)
  useEffect(() => {
    if (!isHost && (showLobby || isCollaborating) && currentSessionId) {
      const handleHostLeft = (event: any) => {
        if (event.detail.session_id === currentSessionId) {
          alert('The host has left the collaboration session.');
          handleSessionEnded();
          navigate('/home');
        }
      };

      window.addEventListener('collaboration-host-left', handleHostLeft);

      return () => {
        window.removeEventListener('collaboration-host-left', handleHostLeft);
      };
    }
  }, [isHost, showLobby, isCollaborating, currentSessionId]);

  // Send initial page location when joining collaboration
  useEffect(() => {
    if (isCollaborating && currentSessionId && collaborationService.isConnected()) {
      // Small delay to ensure connection is fully established
      const timer = setTimeout(() => {
        console.log('📍 Sending initial page location:', currentPageIndex);
        collaborationService.sendPageChange(currentPageIndex);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isCollaborating, currentSessionId, collaborationService.isConnected()]);

  // Helper function to load participants
  const loadParticipants = async () => {
    if (!currentSessionId) return;
    
    try {
      const response = await collaborationService.getPresence(currentSessionId);
      if (response.success) {
        setParticipants(response.participants);
      }
    } catch (error) {
      console.error('Failed to load participants:', error);
      // Don't throw - just log the error for now
      // This can happen if user isn't registered as participant yet
    }
  };

  // Handle text changes - sync to other users
  const handleTextChange = (pageIndex: number, newText: string) => {
    // Update locally first
    if (currentStory) {
      const targetPage = currentStory.pages[pageIndex];
      if (targetPage) {
        updatePage(currentStory.id, targetPage.id, { text: newText });
      }
    }

    // If collaborating, sync to other users (debounced)
    if (isCollaborating && currentSessionId) {
      if (textEditTimeoutRef.current) {
        clearTimeout(textEditTimeoutRef.current);
      }
      
      textEditTimeoutRef.current = setTimeout(() => {
        const targetPage = currentStory?.pages[pageIndex];
        const pid = targetPage ? targetPage.id : pageIndex;
        console.log('📤 Sending text update for page', pageIndex, 'id', pid);
        collaborationService.sendTextEdit(pid, newText, pageIndex);
      }, 500); // Debounce for 500ms
    }
  };

  // Handle page navigation - sync to other users
  const handlePageNavigationSync = (newPageIndex: number) => {
    console.log('🔄 handlePageNavigationSync called:', {
      from: currentPageIndex,
      to: newPageIndex,
      stack: new Error().stack?.split('\n')[2] // Show where it was called from
    });
    setCurrentPageIndex(newPageIndex);
    
    if (isCollaborating && currentSessionId) {
      collaborationService.sendPageChange(newPageIndex);
    }
  };

  // Handle kick user
  const handleCancelReconnect = () => {
    collaborationService.disconnect();
    setIsCollaborating(false);
    setIsReconnecting(false);
    setReconnectAttempt(0);
    setRemoteCursors(new Map());
  };

  const handleRetryReconnect = () => {
    console.log('User triggered manual retry');
    collaborationService.retryConnection();
  };

  const handleKickUser = async (userId: number) => {
    if (!isHost || !currentSessionId) return;
    
    try {
      await collaborationService.kickParticipant(currentSessionId, userId);
      console.log('✅ User kicked successfully');
    } catch (error) {
      console.error('❌ Failed to kick user:', error);
      alert('Failed to remove user');
    }
  };

  // Handle vote
  const handleVote = async (agree: boolean) => {
    if (!votingData?.vote_id) {
      console.error('No vote_id available');
      showInfoToast('Error casting vote. Please try again.');
      return;
    }
    
    if (isCollaborating && currentSessionId) {
      try {
        await collaborationService.voteToSave(votingData.vote_id, agree);
      } catch (error) {
        console.error('Failed to cast vote:', error);
        showInfoToast('Failed to cast vote. Please try again.');
      }
    }
  };

  // Handle initiate save (in collaborative mode, starts voting)
  const handleCollaborativeSave = () => {
    if (isCollaborating && currentSessionId) {
      collaborationService.initiateVote();
    } else {
      // Normal save flow
      setShowSaveModal(true);
    }
  };

  // Collaboration handlers
  const handleSessionCreated = (sessionId: string) => {
    console.log('Collaboration session created:', sessionId);
    
    // Always create a fresh story for new collaboration session
    console.log('Creating fresh story for new collaboration session');
    const story = createStory(storyTitle || 'Collaborative Story');
    setStoryTitle(story.title);
    setCurrentStory(story);
    hasCreatedStory.current = true;
    setCurrentPageIndex(0);
    console.log('Story created for host:', story.id);
    
    setCurrentSessionId(sessionId);
    setIsHost(true);
    // DON'T close the modal - let host invite multiple friends
    // setShowCollabModal(false);
    // Host starts collaborating immediately - NO LOBBY for host
    setShowLobby(false);
    setIsCollaborating(true);
    
    // Automatically start the session for participants
    const token = localStorage.getItem('access_token');
    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collaborate/${sessionId}/start/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).catch(err => console.error('Failed to broadcast session start:', err));
    
    console.log('✅ Host session created, modal stays open for more invites');
  };

  const handleHostSessionStart = async (sessionId: string) => {
    console.log('🎯 Host starting collaboration session:', sessionId);
    
    try {
      // Get session details
      const sessionData = await getCollaborationSession(sessionId);
      console.log('Session data:', sessionData);
      
      // Set story title from session data
      const titleFromSession = sessionData?.story_title || 'Collaborative Story';
      setStoryTitle(titleFromSession);
      
      // Set join code if available and persist it
      if (sessionData.join_code) {
        setJoinCode(sessionData.join_code);
        sessionStorage.setItem('collab_join_code', sessionData.join_code);
        console.log('🔑 Join code set:', sessionData.join_code);
      }
      
      // Always create a fresh story for new collaboration session BEFORE setting isCollaborating
      console.log('Creating fresh story for new collaboration session');
      const story = createStory(titleFromSession);
      setStoryTitle(story.title);
      setCurrentStory(story);
      hasCreatedStory.current = true;
      setCurrentPageIndex(0);
      console.log('Story created for host:', story.id);
      
      setCurrentSessionId(sessionId);
      setIsHost(true);
      
      // Host starts collaborating immediately - NO LOBBY for host
      setShowLobby(false);
      
      // Set isCollaborating AFTER story is created
      setIsCollaborating(true);
      
      // Broadcast session start to all participants waiting in lobby
      const token = localStorage.getItem('access_token');
      fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collaborate/${sessionId}/start/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).catch(err => console.error('Failed to broadcast session start:', err));
      
      console.log('✅ Host session started, now collaborating');
    } catch (err) {
      console.error('Failed to start host session:', err);
      alert('Failed to start collaboration session');
    }
  };

  const handleSessionJoined = async (sessionId: string) => {
    console.log('🚀 handleSessionJoined CALLED with sessionId:', sessionId);
    console.log('🔍 Current state:', { currentSessionId, showLobby, isCollaborating });
    
    // Prevent duplicate joins
    if (currentSessionId === sessionId && (showLobby || isCollaborating)) {
      console.log('⏭️ Already in this session, skipping duplicate join');
      return;
    }
    
    try {
      // Get session details
      const sessionData = await getCollaborationSession(sessionId);
      console.log('Session data:', sessionData);
      
      // Set story title from session data
      if (sessionData?.story_title) {
        setStoryTitle(sessionData.story_title);
      }
      
      // Set join code if available and persist it
      if (sessionData.join_code) {
        setJoinCode(sessionData.join_code);
        sessionStorage.setItem('collab_join_code', sessionData.join_code);
      }
      
      // Connect to WebSocket (only if not already connected)
      if (currentSessionId !== sessionId) {
        await collaborationService.connect(sessionId);
      }
      
      setCurrentSessionId(sessionId);
      setIsHost(false);
      
      // Check if session has already started and host is actively working
      // Session is considered "started" if:
      // 1. Lobby is closed (is_lobby_open === false) - means host clicked "Start Collaboration"
      // 2. Host has created story pages (actual content exists)
      // 3. There are multiple participants (means host already started and others joined)
      const lobbyIsClosed = sessionData.is_lobby_open === false;
      const hasContent = sessionData.story_draft && 
                        sessionData.story_draft.pages && 
                        sessionData.story_draft.pages.length > 0;
      const hasMultipleParticipants = sessionData.participant_count > 1;
      
      const sessionAlreadyStarted = lobbyIsClosed || hasContent || hasMultipleParticipants;
      
      console.log('🔍 Session start check:', {
        lobbyIsClosed,
        hasContent,
        hasMultipleParticipants,
        is_lobby_open: sessionData.is_lobby_open,
        participantCount: sessionData.participant_count,
        pagesCount: sessionData.story_draft?.pages?.length || 0,
        sessionAlreadyStarted
      });
      
      if (sessionAlreadyStarted) {
        console.log('✅ Session already started - bypassing lobby and joining directly');
        
        // Create story if needed
        if (!currentStory && !hasCreatedStory.current) {
          console.log('Creating new story for participant joining active session');
          const newStory = createStory(sessionData.story_title || 'Collaborative Story');
          setStoryTitle(newStory.title);
          setCurrentStory(newStory);
          hasCreatedStory.current = true;
        }
        
        // Go directly to collaboration page
        setShowLobby(false);
        setIsCollaborating(true);
      } else {
        console.log('⏳ Session not started yet - showing lobby');
        // Show lobby for participants - wait for host to start
        setShowLobby(true);
        // Don't set isCollaborating yet - wait until host starts
      }
    } catch (err) {
      console.error('Failed to join session:', err);
      alert('Failed to join collaboration session');
    }
  };

  const handleSessionEnded = () => {
    setIsCollaborating(false);
    setShowLobby(false);
    setCurrentSessionId(null);
    setIsHost(false);
    setParticipants([]);
    collaborationService.disconnect();
    
    // DON'T clear the story - keep it and continue in solo mode
    // The user should be able to continue working on their story
    
    // Just mark that we have unsaved changes since collaboration ended
    if (currentStory) {
      markAsDraft(currentStory.id);
    }
  };

  const handleStartCollaboration = () => {
    console.log('🚀 Host starting collaboration', { 
      hasCurrentStory: !!currentStory, 
      currentStoryId: currentStory?.id,
      isHost,
      showLobby,
      isCollaborating
    });
    
    // Ensure story exists before starting collaboration
    if (!currentStory) {
      console.log('Creating new story for host collaboration');
      const story = createStory(storyTitle || 'Collaborative Story');
      setStoryTitle(story.title);
      console.log('New story created:', story.id);
      // createStory() automatically sets currentStory in the store
    } else {
      console.log('Using existing story for collaboration:', currentStory.id);
    }
    
    // Update state to hide lobby and show collaboration UI
    console.log('🔧 Setting showLobby=false, isCollaborating=true, keeping isHost=', isHost);
    setShowLobby(false);
    setIsCollaborating(true);
    
    // Broadcast session start to all participants
    if (currentSessionId) {
      const token = localStorage.getItem('access_token');
      fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collaborate/${currentSessionId}/start/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).catch(err => console.error('Failed to broadcast session start:', err));
    }
    
    console.log('✅ handleStartCollaboration complete');
  };

  const handleExitLobby = async () => {
    console.log('Exiting lobby');
    
    // If host is exiting, notify backend to end session and kick all participants
    if (isHost && currentSessionId) {
      try {
        const token = localStorage.getItem('access_token');
        await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collaborate/${currentSessionId}/end/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        console.error('Failed to notify host exit:', err);
      }
    }
    
    // Reset collaboration state
    setShowLobby(false);
    setCurrentSessionId(null);
    setIsHost(false);
    setIsCollaborating(false);
    setParticipants([]);
    
    if (currentSessionId) {
      collaborationService.disconnect();
    }
    
    // DON'T clear the story when exiting lobby
    // Keep the story so user can continue in solo mode
    
    if (currentStory) {
      markAsDraft(currentStory.id);
    }
    
    // Navigate back to home page
    navigate('/home');
  };

  const handleInviteMoreFromLobby = () => {
    setShowCollabModal(true);
  };

  // Simple collaboration start (no lobby)
  const handleSimpleCollabStart = async (sessionId: string) => {
    console.log('🚀 Starting simple collaboration:', sessionId);
    console.log('📊 Current state:', { 
      hasStory: !!currentStory, 
      storyId: currentStory?.id 
    });
    
    // Ensure story exists FIRST
    let story = currentStory;
    if (!story) {
      console.log('📖 Creating new story for collaboration...');
      story = createStory('Collaborative Story');
      setStoryTitle(story.title);
      setCurrentStory(story);
      console.log('✅ Story created:', story.id);
    }
    
    // Set session ID and start collaborating
    setCurrentSessionId(sessionId);
    setIsCollaborating(true);
    setShowLobby(false);
    
    console.log('✅ Collaboration mode activated!');
    console.log('🔌 WebSocket will connect via useEffect...');
  };

  const handleCanvasEdit = () => {
    if (currentStory) {
      const currentPage = currentStory.pages[currentPageIndex];
      navigate('/canvas-drawing', {
        state: {
          storyId: currentStory.id,
          pageId: currentPage.id,
          pageIndex: currentPageIndex, // Save current page index
          // Pass collaboration info if active
          sessionId: isCollaborating ? currentSessionId : undefined,
          isCollaborating: isCollaborating,
          isHost: isHost
        }
      });
    }
  };

  const handleCoverImageEdit = () => {
    if (currentStory) {
      navigate('/canvas-drawing', {
        state: {
          storyId: currentStory.id,
          pageId: 'cover', // Special ID for cover image
          pageIndex: -1, // -1 indicates cover image
          isCoverImage: true,
          // Pass collaboration info if active
          sessionId: isCollaborating ? currentSessionId : undefined,
          isCollaborating: isCollaborating,
          isHost: isHost
        }
      });
    }
  };

  const currentPage = currentStory?.pages[currentPageIndex];
  const characterCount = currentPage?.text.length || 0;
  const hasCanvasData = currentStory && currentPage ? !!getCanvasData(currentStory.id, currentPage.id) : false;
  const hasCoverImage = currentStory ? !!currentStory.coverImage : false;

  const handleSaveClick = async () => {
    console.log('💾 Save button clicked - State:', { isCollaborating, currentSessionId, participants: participants.length });
    
    // In collaborative mode, initiate voting
    if (isCollaborating && currentSessionId) {
        try {
        const result = await collaborationService.initiateVote();
        voteInitiatorRef.current = currentUserId;
      } catch (error) {
        console.error('Failed to initiate vote:', error);
        showInfoToast('Failed to start voting. Please try again.');
      }
    } else {
      setShowSaveModal(true);
    }
  };

  const handleSaveStory = async (genres: string[], description: string, language: string = 'en') => {
    if (!currentStory) return;
    
    // Check if story has any content
    const hasContent = currentStory.pages.some(page => page.text && page.text.trim().length > 0);
    if (!hasContent) {
      alert('Please add some text to your story before saving.');
      return;
    }
    
    // Determine if this is a new story or an edit (if it was already saved before)
    const wasAlreadySaved = !currentStory.isDraft;
    
    // Update story title if changed
    if (storyTitle !== currentStory.title) {
      updateStory(currentStory.id, { title: storyTitle });
      // Update local currentStory to reflect the title change
      setCurrentStory({ ...currentStory, title: storyTitle });
    }
    
    // Update genres and description
    const genreString = genres.length > 0 ? genres.join(', ') : undefined;
    updateStory(currentStory.id, { 
      genre: genreString,
      description: description || undefined,
      tags: genres, // Store individual genres as tags too
      language: language // Store language
    });
    
    // If in collaboration mode, update the draft on the backend with genres and description
    if (isCollaborating && currentSessionId) {
      try {
        console.log('📝 Updating collaboration draft with genres and description');
        const currentDraft = await collaborationService.getDraft(currentSessionId);
        const updatedDraft = {
          ...currentDraft.story_draft,
          genres: genres, // Array of genre strings
          category: genres.length > 0 ? genres[0].toLowerCase().replace(/\s+/g, '_') : 'other',
          summary: description || ''
        };
        await collaborationService.updateDraft(currentSessionId, updatedDraft);
        console.log('✅ Collaboration draft updated with genres:', genres);
      } catch (error) {
        console.error('Failed to update collaboration draft:', error);
        // Continue anyway
      }
    }
    
    // Mark story as saved (not a draft anymore)
    markAsSaved(currentStory.id);
    setHasUnsavedChanges(false);
    
    // Immediately sync to backend to get backendId for publishing
    try {
      await syncStoryToBackend(currentStory.id);
    } catch (error) {
      console.error('Failed to sync story to backend:', error);
      // Continue anyway - story is saved locally
    }
    
    // Award skill points for writing
    addSkillPoints('writing', 5);
    
    // Update achievement progress
    updateAchievementProgress('first-story', 1);
    
    // Show success notification
    const message = wasAlreadySaved ? 'Changes saved successfully' : 'Story saved successfully';
    setNotificationMessage(message);
    setShowSuccessNotification(true);
    showInfoToast('Story saved successfully!');
    
    // Close the modal
    setShowSaveModal(false);
    
    console.log('🔍 Checking collaboration finalization conditions:', {
      isCollaborating,
      currentSessionId,
      wasVoteInitiator
    });
    
    // If in collaboration mode and this was a vote-initiated save, finalize the story
    if (isCollaborating && currentSessionId && wasVoteInitiator) {
      try {
        console.log('📤 Vote initiator saved with genres - finalizing collaborative story');
        console.log('🔌 WebSocket connected?', collaborationService.isConnected());
        console.log('🆔 Session ID:', currentSessionId);
        
        // Tell backend to finalize the story now that genres are set
        const sendResult = await collaborationService.sendMessage({
          type: 'finalize_collaborative_story'
        });
        console.log('✅ Finalize message sent to backend, result:', sendResult);
        
        // Wait for session_ended, but add safety timeout
        const sessionEndTimeout = setTimeout(() => {
          console.warn('⚠️ Session end timeout - forcing navigation');
          setShowSaveModal(false);
          setShowSavingOverlay(false);
          collaborationService.disconnect();
          setIsCollaborating(false);
          setCurrentSessionId(null);
          navigate('/library', { state: { activeTab: 'private' } });
        }, 10000); // 10 second safety timeout
        
        // Store timeout ID to clear it if session_ended arrives
        (window as any).sessionEndTimeoutId = sessionEndTimeout;
        
        return;
      } catch (error) {
        console.error('Failed to finalize collaborative story:', error);
        // On error, immediately navigate
        setShowSaveModal(false);
        setShowSavingOverlay(false);
        setTimeout(() => {
          navigate('/library', { state: { activeTab: 'private' } });
        }, 1000);
        return;
      }
    }
    
    // If in collaboration mode but NOT vote initiator, notify others
    if (isCollaborating && currentSessionId && !wasVoteInitiator) {
      // Send success message to other participants via WebSocket
      try {
        await collaborationService.sendMessage({
          type: 'story_saved_success',
          message: 'Story has been saved successfully!',
          saved_by_username: currentUsername || 'Host'
        });
        
        // Give time for success message to be received and displayed
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error sending success message:', error);
      }
      
      try {
        // Send explicit session_ended message before calling endSession
        console.log('📢 Vote initiator: Sending session_ended message to all participants');
        await collaborationService.sendMessage({
          type: 'session_ended',
          ended_by: currentUserId,
          ended_by_username: currentUsername || 'Host',
          reason: 'story_saved'
        });
        
        // Give time for the message to be received
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // End the session on the backend (this will notify all participants)
        await collaborationService.endSession(currentSessionId);
      } catch (error) {
        console.error('Failed to end collaboration session:', error);
      }
      
      // Disconnect from WebSocket
      collaborationService.disconnect();
      setIsCollaborating(false);
      setCurrentSessionId(null);
    }
    
    // Hide notification after 2 seconds and redirect
    setTimeout(() => {
      setShowSuccessNotification(false);
      // Redirect to My Library
      navigate('/library', { state: { activeTab: 'private' } });
    }, 2000);
  };

  // Helper function to check if story has been modified
  const isStoryModified = (story: any): boolean => {
    if (!story) return false;
    
    // Check if title was changed from default
    const hasCustomTitle = story.title && 
      story.title !== 'Untitled Story' && 
      story.title !== 'Collaborative Story' &&
      story.title.trim().length > 0;
    
    // Check if any page has text content
    const hasTextContent = story.pages && story.pages.some((page: any) => 
      page.text && page.text.trim().length > 0
    );
    
    // Check if any page has canvas data
    const hasCanvasData = story.pages && story.pages.some((page: any) => 
      page.canvasData && page.canvasData.length > 0
    );
    
    // Check if cover image has data
    const hasCoverImage = story.coverImage && story.coverImage.length > 0;
    
    return hasCustomTitle || hasTextContent || hasCanvasData || hasCoverImage;
  };

  const handleBack = () => {
    // If in collaboration mode, show confirmation dialog
    if (isCollaborating) {
      setShowLeaveConfirmModal(true);
      return;
    }
    
    // Check if story was modified before keeping it
    if (currentStory) {
      if (isStoryModified(currentStory)) {
        // Story has meaningful content, mark as draft if there are unsaved changes
        if (hasUnsavedChanges) {
          markAsDraft(currentStory.id);
        }
      } else {
        // Story is empty/unmodified - delete it
        const { deleteStory } = useStoryStore.getState();
        deleteStory(currentStory.id);
        console.log('🗑️ Deleted empty draft story:', currentStory.id);
      }
    }
    
    // Always go back to home page instead of using browser history
    // This prevents the loop between canvas and manual story creation
    navigate('/home');
  };
  
  const confirmLeaveCollaboration = () => {
    // Close the modal
    setShowLeaveConfirmModal(false);
    
    // Show toast notification (only from manual story page, not canvas)
    if (!location.pathname.includes('/canvas')) {
      showInfoToast('Left Collaboration', 'You have left the collaboration session');
    }
    
    // Check if story was modified before keeping it
    if (currentStory) {
      if (isStoryModified(currentStory)) {
        // Story has meaningful content, mark as draft if there are unsaved changes
        if (hasUnsavedChanges) {
          markAsDraft(currentStory.id);
        }
      } else {
        // Story is empty/unmodified - delete it
        const { deleteStory } = useStoryStore.getState();
        deleteStory(currentStory.id);
        console.log('🗑️ Deleted empty draft story:', currentStory.id);
      }
    }
    
    // Disconnect from collaboration
    if (collaborationService.isConnected()) {
      collaborationService.disconnect();
    }
    
    // Clear collaboration state
    setIsCollaborating(false);
    setCurrentSessionId(null);
    setIsHost(false);
    setJoinCode(null);
    
    // Navigate to home page
    navigate('/home');
  };

  const addNewPage = () => {
    if (!currentStory) return;
    
    console.log('🔵 Add Page button clicked:', {
      isCollaborating,
      currentSessionId,
      currentPageCount: currentStory.pages.length
    });
    
    // Before we add locally, if collaborating, ask server to add first to avoid double-add
    if (isCollaborating && currentSessionId) {
      const newIndex = currentStory.pages.length;
      console.log('📤 Sending add page request to server... Index:', newIndex);
      
      // Add a flag to prevent multiple rapid clicks
      if ((window as any).addingPage) {
        console.log('⚠️ Page addition already in progress, ignoring click');
        return;
      }
      
      (window as any).addingPage = true;
      
      collaborationService.addPage({ page_index: newIndex }, newIndex);
      console.log('⏳ Waiting for page_added event from server...');
      
      // Clear the flag after a delay
      setTimeout(() => {
        (window as any).addingPage = false;
      }, 2000);
      
      return; // Do not add locally; wait for 'page_added' event from server
    }

    const newPage = addPage(currentStory.id);
    setCurrentPageIndex(currentStory.pages.length - 1);
    setHasUnsavedChanges(true);
    
    // Mark as draft when content changes
    markAsDraft(currentStory.id);
  };

  const updateCurrentPageContent = (content: string) => {
    // Emit typing activity presence
    if (isCollaborating && currentSessionId) {
      collaborationService.updatePresence(null, 'text', 'typing_text');
    }
    if (!currentStory || !currentPage) return;
    
    updatePage(currentStory.id, currentPage.id, { text: content });
    setHasUnsavedChanges(true);
    
    // Mark as draft when content changes
    markAsDraft(currentStory.id);
    
    // If collaborating, sync text changes
    if (isCollaborating && currentSessionId) {
      console.log('📤 Syncing text change to collaborators...');
      handleTextChange(currentPageIndex, content);
    }
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      const newPageIndex = currentPageIndex - 1;
      // FIX: Use sync function to properly notify collaborators without pulling them
      handlePageNavigationSync(newPageIndex);
    }
  };

  const goToNextPage = () => {
    if (currentStory && currentPageIndex < currentStory.pages.length - 1) {
      const newPageIndex = currentPageIndex + 1;
      // FIX: Use sync function to properly notify collaborators without pulling them
      handlePageNavigationSync(newPageIndex);
    }
  };

  const selectPage = (index: number) => {
    handlePageNavigationSync(index);
  };
  
  const handleDeletePage = () => {
    if (!currentStory) return;

    // Hard delete guard: do not allow deleting a page if any participant is currently on it
    // In collaboration mode, always show the enhanced page deletion modal
    if (isCollaborating) {
      setShowPageDeletionModal(true);
      return;
    }
    
    const guardedPageIndex = currentPageIndex
    if (!currentStory || currentStory.pages.length <= 1) return;
    
    if (isCollaborating && currentSessionId) {
      // Ask server to delete and broadcast; local update occurs on page_deleted event
      collaborationService.deletePage(guardedPageIndex, currentPage!.id);
    } else {
      deletePage(currentStory.id, currentPage!.id);
      setHasUnsavedChanges(true);
      // Mark as draft when content changes
      markAsDraft(currentStory.id);
    }
  };

  // Handle page deletion from modal
  const handleModalDeletePage = (pageIndex: number) => {
    if (!currentStory || pageIndex < 0 || pageIndex >= currentStory.pages.length) return;
    
    const pageId = currentStory.pages[pageIndex]?.id;
    if (pageId) {
      // Send collaborative deletion request
      collaborationService.deletePage(pageIndex, pageId);
    }
  };

  // Handle requesting page viewers
  const handleRequestPageViewers = () => {
    if (isCollaborating && currentSessionId && collaborationService.isConnected()) {
      collaborationService.requestPageViewers();
    } else if (isCollaborating && !collaborationService.isConnected()) {
      console.warn('⚠️ Cannot request page viewers - WebSocket not connected');
    }
  };

  const handlePageViewersResponse = (message: any) => {
    if (message.type !== 'page_viewers_response') return;
    console.log('?? Page viewers updated:', message.page_viewers);
    setPageViewers(message.page_viewers || {});
  };

  // Initialize or load story - only runs when storyId changes or on mount
  useEffect(() => {
    if (storyId) {
      // Load existing story
      const story = useStoryStore.getState().getStory(storyId);
      if (story) {
        setCurrentStory(story);
        setStoryTitle(story.title);
        hasCreatedStory.current = true; // Mark that we have a story
        
        // Track the original draft status when story is first loaded
        if (originalIsDraft.current === undefined) {
          originalIsDraft.current = story.isDraft;
        }
        
        // Restore page index if returning from canvas
        if (returnToPageIndex !== undefined && returnToPageIndex >= 0 && returnToPageIndex < story.pages.length) {
          setCurrentPageIndex(returnToPageIndex);
        }
      }
    } else if (!hasCreatedStory.current) {
      // Only create new story if we haven't already created one in this session
      // This prevents React StrictMode from creating duplicate stories
      hasCreatedStory.current = true;

      // Prefer incoming title when arriving from an invite
      const incomingTitle = (location.state as any)?.storyTitle || 'Untitled Story';
      const newStory = createStory(incomingTitle);
      setStoryTitle(newStory.title);
      setCurrentStory(newStory);
      originalIsDraft.current = true; // New stories start as drafts

      // If arriving in collaborative mode, preserve session info and trigger join flow
      if (isCollaborative && collabSessionId) {
        // Trigger join flow (non-blocking) - handleSessionJoined will determine if lobby should be shown
        handleSessionJoined(collabSessionId).catch(() => {});
        // Preserve session data in state
        navigate('/create-story-manual', { 
          state: { 
            storyId: newStory.id,
            sessionId: collabSessionId,
            isCollaborative: true,
            storyTitle: incomingTitle
          }, 
          replace: true 
        });
      } else {
        // Update the URL to include the storyId so future navigations work correctly
        navigate('/create-story-manual', { state: { storyId: newStory.id }, replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, returnToPageIndex]); // Depend on both storyId and returnToPageIndex
  
  // Refresh story data when returning from canvas or other pages
  useEffect(() => {
    if (currentStory && location.pathname === '/create-story-manual') {
      const refreshedStory = useStoryStore.getState().getStory(currentStory.id);
      if (refreshedStory) {
        // Check if canvas data or other content has changed
        const hasChanges = refreshedStory.pages.some((page, index) => {
          const currentPage = currentStory.pages[index];
          return !currentPage || page.canvasData !== currentPage.canvasData || page.text !== currentPage.text;
        });
        
        // Only update if there are actual changes (don't update title if user is editing it)
        if (hasChanges || refreshedStory.pages.length !== currentStory.pages.length) {
          setCurrentStory(refreshedStory);
          // Only update title if it's different from what's in the store AND we're not currently editing
          if (refreshedStory.title !== storyTitle && !hasUnsavedChanges) {
            setStoryTitle(refreshedStory.title);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Only refresh when pathname changes, not when currentStory changes
  
  // Auto-save functionality - save as draft without opening modal
  useEffect(() => {
    const autoSave = () => {
      if (hasUnsavedChanges && currentStory) {
        // Auto-save just saves the content without opening the modal
        // It keeps the story as a draft
        if (storyTitle !== currentStory.title) {
          updateStory(currentStory.id, { title: storyTitle });
        }
        console.log('Auto-saved as draft');
      }
    };
    
    const interval = setInterval(autoSave, 30000); // Auto-save every 30 seconds
    return () => clearInterval(interval);
  }, [hasUnsavedChanges, currentStory, storyTitle, updateStory]);
  
  // Show lobby even without a story (for participants joining collaboration)
  // But only if not already collaborating (host starts collaborating immediately)
  // NEVER show lobby once collaboration has started
  console.log('🔍 Lobby render check:', { showLobby, currentSessionId, isCollaborating, willRenderLobby: showLobby && currentSessionId && !isCollaborating });
  
  if (showLobby && currentSessionId && !isCollaborating) {
    console.log('📋 RENDERING LOBBY:', { isHost, sessionId: currentSessionId, storyTitle });
    return (
      <div className="create-story-page">
        <CollaborationLobby
          sessionId={currentSessionId}
          storyTitle={storyTitle || 'Untitled Story'}
          isHost={isHost}
          onStart={handleStartCollaboration}
          onExit={handleExitLobby}
          onInviteMore={handleInviteMoreFromLobby}
        />
      </div>
    );
  }

  // Check the Zustand store directly instead of React state to avoid race conditions
  // This is crucial because createStory() updates the store synchronously,
  // but the React state (currentStory) updates asynchronously
  const storeStory = useStoryStore.getState().currentStory;
  
  // FIX: If we have a story in the store but not in the hook, sync it
  // This can happen when returning from canvas or on initial load
  if (storeStory && !currentStory) {
    console.log('📖 Syncing story from store to component state');
    setCurrentStory(storeStory);
  }
  
  // If collaborating but no story in the store yet, create one immediately
  // This handles the race condition where isCollaborating is set before currentStory
  if (!storeStory && isCollaborating && !hasCreatedStory.current) {
    console.log('⚠️ Race condition detected: isCollaborating is true but no story in store. Creating story now...');
    const newStory = createStory(storyTitle || 'Collaborative Story');
    setStoryTitle(newStory.title);
    setCurrentStory(newStory);
    hasCreatedStory.current = true;
    // Don't return here - let the component render normally
  }
  
  // If still no story after the above check, show a brief loading state
  // Check both React state and store to be safe
  if (!currentStory && !storeStory) {
    return (
      <div className="create-story-page">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading story...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentStory) {
    return (
      <div className="create-story-page">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading story...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-story-page">
      {/* Sticky Header */}
      <div className="page-header-container">
        <div className="page-header-left-section">
          <button onClick={handleBack} className="page-header-back-button">
            <ChevronLeftIcon className="page-header-back-icon" />
          </button>
          <div className="page-header-title-group">
            <h1 className="page-header-title">Create Your Story</h1>
            <p className="page-header-subtitle">Bring your imagination to life</p>
          </div>
        </div>
        <div className="collaboration-status-container">
          {/* Collaboration Status Indicator */}
          {isCollaborating && currentSessionId && (
            <div className="collaboration-badge-wrapper">
              <div className="collaboration-badge">
                <UserGroupIcon className="collaboration-badge-icon" />
                <span>Collaborating</span>
              </div>
              <div className="join-code-display">
                {joinCode ? (
                  <>
                    <span className="join-code-label">Join Code:</span>{' '}
                    <span className="join-code-value">{joinCode}</span>
                  </>
                ) : (
                  <>
                    <span className="join-code-label">Session:</span>{' '}
                    <span className="join-code-value">{currentSessionId.slice(0, 8)}</span>
                  </>
                )}
              </div>
            </div>
          )}
          {/* Participant count badge for collaboration mode */}
          {isCollaborating && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              marginRight: '8px'
            }}>
              <UserGroupIcon className="w-4 h-4" />
              <span>{participants.filter(p => p.is_active).length || 0}/5</span>
            </div>
          )}
          <button 
            onClick={handleSaveClick} 
            className={`page-header-save-button ${hasUnsavedChanges ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
          >
            <ArchiveBoxArrowDownIcon className="page-header-save-icon" />
            {hasUnsavedChanges ? 'Save*' : 'Saved'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="content-area-container">
        {/* Story Title Section */}
        <div className="story-title-section-container">
          <label className="story-title-section-label">
            Story Title
          </label>
          <div style={{ position: 'relative' }}>
            <VoiceFilteredInput
              {...(isCollaborating ? presence.trackTextInput('story-title', 'title') : {})}
              data-element-id="story-title"
              value={storyTitle}
              onChange={(value: string) => {
                setStoryTitle(value);
                setHasUnsavedChanges(true);
                // Send live title edit + presence typing
                if (isCollaborating && currentSessionId) {
                  collaborationService.sendTitleEdit(value);
                  collaborationService.updatePresence(null, 'text', 'typing_title');
                }
              }}
              placeholder="Enter your story title..."
              className="story-title-input"
            />
            
            {/* Show text caret indicators for other users typing in title */}
            {isCollaborating && presence.presenceUsers && presence.presenceUsers.map(user => (
              user.cursor && user.cursor.elementId === 'story-title' && typeof user.cursor.cursorPos !== 'undefined' ? (
                <TextCaretIndicator
                  key={user.id}
                  user={{
                    id: user.id,
                    name: user.name,
                    color: user.color || '#3B82F6'
                  }}
                  elementId={user.cursor.elementId}
                  cursorPos={user.cursor.cursorPos}
                  textValue={user.cursor.textValue || ''}
                />
              ) : null
            ))}
            
            {/* Show typing indicator for users typing in title */}
            {isCollaborating && presence.presenceUsers && presence.presenceUsers.map(user => (
              user.typing && user.typing.elementId === 'story-title' ? (
                <TypingIndicator
                  key={`title-typing-${user.id}`}
                  user={{
                    id: user.id,
                    name: user.name,
                    color: user.color || '#3B82F6'
                  }}
                  position={{ x: 10, y: -30 }}
                />
              ) : null
            ))}
          </div>
        </div>

        {/* Cover Image Section */}
        <div className="canvas-section-container">
          <div className="canvas-section-header">
            <div className="canvas-section-title">
              <PhotoIcon className="canvas-section-icon" />
              <span className="canvas-section-text">Cover Image</span>
            </div>
            <button 
              onClick={handleCoverImageEdit}
              className="canvas-section-edit-button"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </button>
          </div>
          <div className="canvas-section-canvas-area" onClick={handleCoverImageEdit}>
            {hasCoverImage ? (
              <div className="canvas-section-preview">
                <img 
                  src={currentStory.coverImage} 
                  alt="Cover image preview" 
                  className="w-full h-full object-cover rounded"
                />
                <div className="canvas-section-overlay">
                  <PencilIcon className="h-6 w-6 text-white" />
                  <span className="text-white text-sm">Edit Cover Image</span>
                </div>
              </div>
            ) : (
              <div className="canvas-section-empty-state">
                Click Edit to add cover image
              </div>
            )}
          </div>
        </div>

        {/* Page Drawing Area Section */}
        <div className="canvas-section-container">
          <div className="canvas-section-header">
            <div className="canvas-section-title">
              <PhotoIcon className="canvas-section-icon" />
              <span className="canvas-section-text">Drawing Area {currentPageIndex + 1}</span>
            </div>
            <button 
              onClick={handleCanvasEdit}
              className="canvas-section-edit-button"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </button>
          </div>
          <div className="canvas-section-canvas-area" onClick={handleCanvasEdit}>
            {hasCanvasData ? (
              <div className="canvas-section-preview">
                <img 
                  src={(() => {
                    const data = getCanvasData(currentStory.id, currentPage!.id);
                    return typeof data === 'string' ? data : data?.canvasDataUrl;
                  })()} 
                  alt="Canvas preview" 
                  className="w-full h-full object-cover rounded"
                />
                <div className="canvas-section-overlay">
                  <PencilIcon className="h-6 w-6 text-white" />
                  <span className="text-white text-sm">Edit Illustration</span>
                </div>
              </div>
            ) : (
              <div className="canvas-section-empty-state">
                Click Edit to add illustrations
              </div>
            )}
          </div>
        </div>


        {/* Page Editor Section */}
        <div className="page-editor-section-container">
          <div className="page-editor-section-header">
            <BookOpenIcon className="page-editor-section-icon" />
            <span className="page-editor-section-text">Page {currentPageIndex + 1} Text</span>
          </div>
          <div style={{ position: 'relative' }}>
            <VoiceFilteredTextarea
              {...(isCollaborating ? presence.trackTextInput(`page-text-${currentPageIndex}`, 'text', currentPageIndex) : {})}
              data-element-id={`page-text-${currentPageIndex}`}
              value={currentPage?.text || ''}
              onChange={(value: string) => updateCurrentPageContent(value)}
              placeholder="Write your story here... (or click mic to speak)"
              className="page-editor-section-textarea"
            />
            
            {/* Show text caret indicators for other users typing in text area */}
            {isCollaborating && presence.presenceUsers && presence.presenceUsers.map(user => (
              user.cursor && user.cursor.elementId === `page-text-${currentPageIndex}` && typeof user.cursor.cursorPos !== 'undefined' ? (
                <TextCaretIndicator
                  key={user.id}
                  user={{
                    id: user.id,
                    name: user.name,
                    color: user.color || '#3B82F6'
                  }}
                  elementId={user.cursor.elementId}
                  cursorPos={user.cursor.cursorPos}
                  textValue={user.cursor.textValue || ''}
                />
              ) : null
            ))}
            
            {/* Show typing indicator for users typing in page text */}
            {isCollaborating && presence.presenceUsers && presence.presenceUsers.map(user => (
              user.typing && user.typing.elementId === `page-text-${currentPageIndex}` ? (
                <TypingIndicator
                  key={`page-typing-${user.id}`}
                  user={{
                    id: user.id,
                    name: user.name,
                    color: user.color || '#3B82F6'
                  }}
                  position={{ x: 10, y: -30 }}
                />
              ) : null
            ))}
          </div>
          <div className="page-editor-section-character-count">
            {characterCount} characters
          </div>
        </div>

        {/* Compact Page Management */}
        <div className="page-management-compact-container">
          <div className="page-management-compact-controls">
            <button 
              onClick={goToPreviousPage}
              disabled={currentPageIndex === 0}
              className="page-management-compact-button"
            >
              <ChevronPrevIcon className="h-4 w-4" />
            </button>
            <span className="page-management-compact-info">
              Page {currentPageIndex + 1} of {currentStory.pages.length}
            </span>
            <button 
              onClick={goToNextPage}
              disabled={currentPageIndex === currentStory.pages.length - 1}
              className="page-management-compact-button"
            >
              <ChevronNextIcon className="h-4 w-4" />
            </button>
            <button onClick={addNewPage} className="page-management-compact-add-button">
              <PlusIcon className="h-4 w-4" />
              Add
            </button>
            {currentStory.pages.length > 1 && (
              <button onClick={handleDeletePage} className="page-management-compact-delete-button">
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>

          {/* Invite Friends Button - Only show when actively in collaboration mode */}
          {isCollaborating && (
            <div className="page-management-invite-container">
              <button 
                className="bottom-actions-characters-button"
                onClick={async () => {
                  console.log('📨 Invite button clicked - State:', {
                    isCollaborating,
                    currentSessionId,
                    joinCode,
                    showInviteModal
                  });
                  // Fetch latest participants before opening modal
                  if (currentSessionId) {
                    try {
                      const presenceData = await collaborationService.getPresence(currentSessionId);
                      console.log('👥 Fetched participants:', presenceData);
                      setParticipants(presenceData.participants || []);
                    } catch (error) {
                      console.error('❌ Failed to fetch participants:', error);
                    }
                  }
                  setShowInviteModal(true);
                }}
              >
                <UserGroupIcon className="bottom-actions-icon" />
                <span>Invite Friends</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Collaboration Invite Modal - Use different modals based on session state */}
      {console.log('🎯 Modal render check:', { isCollaborating, currentSessionId, showCollabModal })}
      {isCollaborating && currentSessionId ? (
        // Active session - use simplified invite modal
        <ActiveSessionInviteModal
          isOpen={showCollabModal}
          onClose={() => {
            console.log('Modal state:', { isCollaborating, currentSessionId, joinCode });
            setShowCollabModal(false);
          }}
          sessionId={currentSessionId}
          joinCode={joinCode || currentSessionId.slice(0, 8)}
          storyTitle={storyTitle || 'Untitled Story'}
          onlineUserIds={new Set(participants.filter(p => p.is_active).map(p => p.id))}
        />
      ) : (
        // Pre-session or lobby - use original modal
        <CollaborationInviteModal
          isOpen={showCollabModal}
          onClose={() => {
            setShowCollabModal(false);
          }}
          onSessionCreated={handleSessionCreated}
          storyTitle={storyTitle || 'Untitled Story'}
          existingSessionId={currentSessionId}
          existingJoinCode={joinCode}
          isSessionActive={false}
        />
      )}

      {/* Invite Friends Modal - Shown when clicking Invite Friends button during active collaboration */}
      {showInviteModal && isCollaborating && currentSessionId && (() => {
        const onlineIds = new Set(participants.filter(p => p.is_active).map(p => p.user_id || p.id));
        console.log('📊 Participants data for invite modal:', {
          participants,
          onlineIds: Array.from(onlineIds),
          participantDetails: participants.map(p => ({ 
            id: p.id, 
            user_id: p.user_id,
            username: p.username, 
            is_active: p.is_active,
            fullObject: p
          }))
        });
        return (
          <ActiveSessionInviteModal
            isOpen={showInviteModal}
            onClose={() => {
              console.log('📨 Closing invite friends modal');
              setShowInviteModal(false);
            }}
            sessionId={currentSessionId}
            joinCode={joinCode || currentSessionId.slice(0, 8)}
            storyTitle={storyTitle || 'Untitled Story'}
            onlineUserIds={onlineIds}
          />
        );
      })()}

      {/* Collaboration Lobby - Now rendered at the top level when showLobby is true */}

      {/* Save Story Modal */}
      <SaveStoryModal
        isOpen={showSaveModal}
        onClose={() => {
          // If the vote initiator cancels the save, notify other participants
          console.log('🚫 SaveStoryModal closed - wasVoteInitiator:', wasVoteInitiator, 'isCollaborating:', isCollaborating);
          if (wasVoteInitiator && isCollaborating) {
            console.log('🚫 Vote initiator cancelled save - notifying other participants');
            collaborationService.sendMessage({
              type: 'save_cancelled',
              cancelled_by: currentUserId,
              cancelled_by_username: currentUsername
            });
          }
          setShowSaveModal(false);
          setWasVoteInitiator(false); // Reset the flag
        }}
        onSave={handleSaveStory}
        currentGenres={currentStory?.tags || []}
        currentLanguage={currentStory?.language || 'en'}
        currentDescription={currentStory?.description || ''}
        storyTitle={storyTitle || 'Untitled Story'}
      />
      
      {/* Success Notification */}
      {showSuccessNotification && ReactDOM.createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999999, // Much higher than everything else including warnings/toasts
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '400px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              animation: 'slideInScale 0.3s ease-out'
            }}
          >
            <div 
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#10B981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '40px'
              }}
            >
              ✅
            </div>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              marginBottom: '12px',
              color: '#1F2937'
            }}>
              {wasVoteInitiator ? 'Story Saved Successfully!' : 'Story Saved Successfully!'}
            </h2>
            <p style={{ 
              fontSize: '16px', 
              color: '#6B7280',
              marginBottom: '0'
            }}>
              {isCollaborating 
                ? (wasVoteInitiator ? 'Thank you for creating this story!' : 'Thanks for collaborating!') 
                : 'Your story has been saved successfully!'}<br/>
              Redirecting you to the library...
            </p>
          </div>
        </div>,
        document.body
      )}

      {/* Participants Panel (Collaborative Mode) */}
      {isCollaborating && participants.length > 0 && (
        <div className="fixed right-4 top-20 z-40 w-80">
          <ParticipantsPanel
            participants={participants}
            isHost={isHost}
            onKick={handleKickUser}
            currentUserId={currentUserId}
            maxParticipants={5}
            isCollaborationMode={isCollaborating}
          />
        </div>
      )}

      {/* Voting Modal - Rendered via Portal */}
      {showVotingModal && votingData && ReactDOM.createPortal(
        <VotingModal
          isOpen={showVotingModal}
          onVote={handleVote}
          votingData={votingData}
          participants={participants}
          initiatedBy={votingData.initiated_by_username || 'Someone'}
          currentUserId={currentUserId}
        />,
        document.body
      )}

      {/* Leave Collaboration Confirmation Modal - Rendered via Portal */}
      {showLeaveConfirmModal && ReactDOM.createPortal(
        <div 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowLeaveConfirmModal(false)}
        >
          <div 
            style={{
              padding: '32px',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            className="bg-white dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }} className="text-gray-900 dark:text-white">
                Leave Collaboration?
              </h3>
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setShowLeaveConfirmModal(false)}
                aria-label="Close"
              >
                <XMarkIcon style={{ width: '24px', height: '24px' }} />
              </button>
            </div>
            <p style={{ marginBottom: '24px', lineHeight: '1.6', fontSize: '16px' }} className="text-gray-700 dark:text-gray-300">
              Are you sure you want to leave this collaboration session? Your work will be saved, but you will disconnect from the session.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '15px',
                  transition: 'all 0.2s'
                }}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white border-0"
                onClick={() => setShowLeaveConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '15px',
                  backgroundColor: '#9333ea',
                  color: 'white',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7e22ce'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9333ea'}
                onClick={confirmLeaveCollaboration}
              >
                Leave Session
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reconnecting Modal */}
      {/* Page Deletion Modal */}
      <PageDeletionModal
        isOpen={showPageDeletionModal}
        onClose={() => setShowPageDeletionModal(false)}
        onDeletePage={handleModalDeletePage}
        pages={currentStory?.pages || []}
        currentPageIndex={currentPageIndex}
        currentUserId={currentUserId}
        onRequestPageViewers={handleRequestPageViewers}
        pageViewers={pageViewers}
        isCollaborating={isCollaborating}
      />

      <ReconnectingModal
        isReconnecting={isReconnecting}
        reconnectAttempt={reconnectAttempt}
        maxAttempts={5}
        onCancel={handleCancelReconnect}
        onRetry={handleRetryReconnect}
      />

      {/* Saving Overlay - Show when non-initiator is waiting for initiator to save */}
      {showSavingOverlay && ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 999998,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}
        >
          <div
            style={{
              fontSize: '48px',
              marginBottom: '24px'
            }}
          >
            ⏳
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
            Saving Story...
          </h2>
          <p style={{ fontSize: '18px', opacity: 0.8 }}>
            Please wait while the host completes the save process
          </p>
        </div>,
        document.body
      )}


      {/* Global presence styles */}
      {isCollaborating && (
        <style>{PRESENCE_STYLES}</style>
      )}

    </div>
  );
};

export default ManualStoryCreationPage;
