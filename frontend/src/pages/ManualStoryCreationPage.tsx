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
import { storyApiService } from '../services/storyApiService';
import { apiConfigService } from '../services/apiConfig.service';
import { CollaborationInviteModal } from '../components/collaboration/CollaborationInviteModal';
import { ActiveSessionInviteModal } from '../components/collaboration/ActiveSessionInviteModal';
import CollaborationLobby from '../components/collaboration/CollaborationLobby';
import { VotingModal } from '../components/collaboration/VotingModal';

import { RealtimePreviewCanvas, RealtimePreviewCanvasRef } from '../components/canvas/RealtimePreviewCanvas';
import { RealtimeCanvasIndicator } from '../components/collaboration/RealtimeCanvasIndicator';
import PageDeletionModal from '../components/collaboration/PageDeletionModal';
import ReconnectingModal from '../components/collaboration/ReconnectingModal';
import { useToastContext } from '../contexts/ToastContext';
import { usePresenceTracking } from '../hooks/usePresenceTracking';
import { TypingIndicator, CursorIndicator, TextCaretIndicator, TouchIndicator, PRESENCE_STYLES } from '../components/collaboration/PresenceSystem';
import TextEnhancementModal from '../components/creation/TextEnhancementModal';
import { EnhancementType } from '../services/textEnhancementService';
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
  XMarkIcon,
  ChevronDownIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';

const ManualStoryCreationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

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

  const [storyTitle, setStoryTitle] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [wasVoteInitiator, setWasVoteInitiator] = useState(false);
  const hasCreatedStory = useRef(false);
  const originalIsDraft = useRef<boolean | undefined>(undefined);

  const [showEnhancementModal, setShowEnhancementModal] = useState(false);
  const [enhancementType, setEnhancementType] = useState<EnhancementType>('grammar');
  const [showEnhancementDropdown, setShowEnhancementDropdown] = useState(false);

  const [isCollaborating, setIsCollaborating] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showLobby, setShowLobby] = useState(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [canvasActivity, setCanvasActivity] = useState<Map<string, { timestamp: number, user: string }>>(new Map());

  const [showPageDeletionModal, setShowPageDeletionModal] = useState(false);
  const [pageViewers, setPageViewers] = useState<Record<number, Array<{ user_id: number, username: string, display_name: string, cursor_color: string }>>>({});

  const canvasPreviewRef = useRef<RealtimePreviewCanvasRef>(null);
  const coverPreviewRef = useRef<RealtimePreviewCanvasRef>(null);
  const pagePreviewRefs = useRef<Map<string, RealtimePreviewCanvasRef>>(new Map());

  const registerPreviewRef = (pageId: string, ref: RealtimePreviewCanvasRef) => {
    pagePreviewRefs.current.set(pageId, ref);
    if (pageId === 'cover') {
      (coverPreviewRef as any).current = ref;
    } else if (currentStory && pageId === currentStory.pages[currentPageIndex]?.id) {
      (canvasPreviewRef as any).current = ref;
    }
  };

  const renderDrawingToPreview = (pageId: string, drawingData: any) => {
    if (!drawingData) return;
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
        previewRef.renderDrawing(drawingData);
      }
    } catch (error) {
      console.error('Error rendering drawing to preview:', error);
    }
  };

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
        previewRef.clearPreview();
      }
    } catch (error) {
      console.error('Error clearing preview canvas:', error);
    }
  };

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

  const collabLog = (...args: any[]) => {
    if (isCollaborating) {
      try { console.log(...args); } catch { }
    }
  };

  useEffect(() => {
    const originalLog = console.log;
    if (!isCollaborating) {
      (console as any).log = () => { };
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

  const reconnectHandlerRef = useRef<((reconnecting: boolean, attempt: number) => void) | null>(null);
  const reconnectSuccessHandlerRef = useRef<(() => void) | null>(null);

  reconnectHandlerRef.current = (reconnecting: boolean, attempt: number) => {
    setIsReconnecting(reconnecting);
    setReconnectAttempt(attempt);
  };

  reconnectSuccessHandlerRef.current = () => {
    console.log('Story Page: Reconnection successful, story draft syncs automatically from backend');
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

  const lastToastRef = useRef<{ message: string, timestamp: number } | null>(null);
  const showDedupedToast = (message: string) => {
    const now = Date.now();
    if (lastToastRef.current &&
      lastToastRef.current.message === message &&
      now - lastToastRef.current.timestamp < 2000) {
      return;
    }
    lastToastRef.current = { message, timestamp: now };
    showInfoToast(message);
  };

  const presence = usePresenceTracking({
    sessionId: currentSessionId,
    participants,
    currentUserId,
    isCollaborating,
    collaborationService
  });

  const titleInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isCollaborating) {
        event.preventDefault();
        window.history.pushState(null, '', window.location.href);
        setShowLeaveConfirmModal(true);
      }
    };

    if (isCollaborating) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isCollaborating]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isCollaborating) {
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

  useEffect(() => {
    collaborationService.onReconnectStateChange = (reconnecting: boolean, attempt: number) => {
      reconnectHandlerRef.current?.(reconnecting, attempt);
    };

    collaborationService.onReconnectSuccess = () => {
      reconnectSuccessHandlerRef.current?.();
    };

    return () => {
      if (collaborationService.onReconnectStateChange) {
        collaborationService.onReconnectStateChange = undefined;
      }
      if (collaborationService.onReconnectSuccess) {
        collaborationService.onReconnectSuccess = undefined;
      }
    };
  }, []);

  useEffect(() => {
    if (currentStory && storyTitle && storyTitle !== currentStory.title) {
      const timeoutId = setTimeout(() => {
        updateStory(currentStory.id, { title: storyTitle });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [storyTitle, currentStory, updateStory]);

  useEffect(() => {
    const isExplicitlySolo = isCollaborative === false;
    const hasNoCollabIntent = isCollaborative === undefined && !collabSessionId;
    if (isExplicitlySolo || hasNoCollabIntent) {
      try {
        sessionStorage.removeItem('collab_session_id');
        sessionStorage.removeItem('collab_session_timestamp');
        sessionStorage.removeItem('collab_join_code');
      } catch (e) {
        console.error('Failed to clear session storage:', e);
      }
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

    const storedSessionId = collaborationService.getStoredSessionId();

    if (storedSessionId && !collabSessionId && !isCollaborating) {
      setCurrentSessionId(storedSessionId);
      setIsCollaborating(true);
      setShowLobby(false);

      const storedJoinCode = sessionStorage.getItem('collab_join_code');
      if (storedJoinCode) {
        setJoinCode(storedJoinCode);
      }

      getCollaborationSession(storedSessionId)
        .then((sessionData) => {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            setIsHost(sessionData.host_id === user.id);
          }
          if (sessionData.join_code) {
            setJoinCode(sessionData.join_code);
            sessionStorage.setItem('collab_join_code', sessionData.join_code);
          }
        })
        .catch((error) => {
          console.error('Failed to fetch session info:', error);
        });

      return;
    }

    if (collabSessionId && !isCollaborating) {
      if (isCollaborative === false) {
        setCurrentSessionId(null);
        setIsHost(false);
        setShowLobby(false);
        return;
      }

      const returningFromCanvas = isCollaborative && (location.state as any)?.returnToPageIndex !== undefined;

      if (returningFromCanvas) {
        setCurrentSessionId(collabSessionId);
        setIsHost(isHostFromNav || false);
        setIsCollaborating(true);
        setShowLobby(false);

        const storedJoinCode = sessionStorage.getItem('collab_join_code');
        if (storedJoinCode) {
          setJoinCode(storedJoinCode);
        } else {
          getCollaborationSession(collabSessionId)
            .then((sessionData) => {
              if (sessionData.join_code) {
                setJoinCode(sessionData.join_code);
                sessionStorage.setItem('collab_join_code', sessionData.join_code);
              }
            })
            .catch((error) => {
              console.error('Failed to fetch session for join code:', error);
            });
        }

        if (!currentStory && !hasCreatedStory.current) {
          const newStory = createStory('Collaborative Story');
          setStoryTitle(newStory.title);
          setCurrentStory(newStory);
          hasCreatedStory.current = true;
        }
      } else {
        if (isHostFromNav) {
          handleHostSessionStart(collabSessionId);
        } else {
          handleSessionJoined(collabSessionId);
        }
      }
    }
  }, [isCollaborative, collabSessionId]);

  useEffect(() => {
    let userStr = localStorage.getItem('user_data');
    if (!userStr) {
      userStr = localStorage.getItem('user');
    }
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
        setCurrentUsername(user.username || user.name || user.email || '');
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!isCollaborating || !currentSessionId) return;

    const syncParticipants = () => {
      collaborationService.getPresence(currentSessionId)
        .then(data => {
          setParticipants(data.participants || []);
        })
        .catch(err => console.error('Periodic sync failed:', err));
    };

    const syncInterval = setInterval(syncParticipants, 10000);
    return () => clearInterval(syncInterval);
  }, [isCollaborating, currentSessionId]);

  useEffect(() => {
    if (isCollaborating && currentSessionId && participants.length === 0) {
      collaborationService.getPresence(currentSessionId)
        .then(data => {
          setParticipants(data.participants || []);
        })
        .catch(err => console.error('Failed to force-fetch participants:', err));
    }
  }, [isCollaborating, currentSessionId]);

  useEffect(() => {
    if (showLobby && currentSessionId) {
      const lobbyTimeout = setTimeout(() => {
        setShowLobby(false);
        setIsCollaborating(true);
        showInfoToast('Starting collaboration...');
      }, 10000);

      return () => clearTimeout(lobbyTimeout);
    }
  }, [showLobby, currentSessionId]);


  useEffect(() => {
    if ((!isCollaborating && !showLobby) || !currentSessionId) {
      return;
    }

    const needsConnection = !collaborationService.isConnected() ||
      collaborationService.getSessionId() !== currentSessionId;

    const handleInit = (message: any) => {
      if (message.type !== 'init') return;
      if (message.current_user_id) {
        setCurrentUserId(message.current_user_id);
      }
      const draft = message.story_draft || {};
      if (!currentStory && !hasCreatedStory.current) {
        const newStory = createStory(draft.title || 'Collaborative Story');
        setStoryTitle(newStory.title);
        setCurrentStory(newStory);
        hasCreatedStory.current = true;
      }
      if (message.participants && Array.isArray(message.participants)) {
        setParticipants(message.participants);
      } else {
        setTimeout(() => {
          if (currentSessionId) {
            collaborationService.getPresence(currentSessionId)
              .then(data => {
                setParticipants(data.participants || []);
              })
              .catch(err => console.error('Failed to get presence:', err));
          }
        }, 500);
      }
      const canvasData = message.canvas_data || {};
      const serverPages: any[] = Array.isArray(draft.pages) ? draft.pages : [];
      const serverLen = serverPages.length;
      if (collaborationService.shouldApplyInitialDraft()) {
        if (draft.title) {
          setStoryTitle(draft.title);
          if (currentStory) {
            updateStory(currentStory.id, { title: draft.title });
          } else {
            const newStory = createStory(draft.title);
            setStoryTitle(newStory.title);
            setCurrentStory(newStory);
            hasCreatedStory.current = true;
          }
        }
        if (currentStory) {
          const localLen = currentStory.pages.length;
          if (serverLen > localLen) {
            for (let i = localLen; i < serverLen; i++) {
              const serverPage = serverPages[i];
              if (serverPage && serverPage.id) {
                addPageWithId(currentStory.id, serverPage.id, serverPage.text || '');
              } else {
                addPage(currentStory.id);
              }
            }
          } else if (serverLen < localLen) {
            console.warn('Local has more pages than server; skipping deletion.', { localLen, serverLen });
          }
        }
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
      } else {
        console.log('Skipping init draft overwrite — already synced this session, trusting live local state');
      }
      if (currentStory && canvasData) {
        if (canvasData.cover_image) {
          updatePreviewCanvasBackground('cover', canvasData.cover_image);
        }
        if (canvasData.pages) {
          Object.entries(canvasData.pages).forEach(([pageId, canvasDataUrl]: [string, any]) => {
            updatePreviewCanvasBackground(pageId, canvasDataUrl);
          });
        }
      }
    };

    const handleTitleEdit = (message: any) => {
      if (message.type !== 'title_edit') return;
      setStoryTitle(message.title);
    };

    const handleReconnectionFailed = (message: any) => {
      if (message.type !== 'reconnection_failed') return;
      setNotificationMessage('Lost connection to collaboration session. Please refresh the page to reconnect.');
      setShowSuccessNotification(true);
    };

    const handleUserJoined = (message: any) => {
      if (message.type !== 'user_joined') return;
      showDedupedToast(`${message.username} joined the session`);
      setTimeout(() => {
        collaborationService.getPresence(currentSessionId!)
          .then(data => {
            setParticipants(data.participants || []);
          })
          .catch(() => { });
      }, 500);
    };

    const handleUserLeft = (message: any) => {
      if (message.type !== 'user_left') return;
      showDedupedToast(`${message.username} left the session`);
      setTimeout(() => {
        collaborationService.getPresence(currentSessionId!)
          .then(data => {
            setParticipants(data.participants || []);
          })
          .catch(() => { });
      }, 500);
    };

    const handlePresenceUpdate = (message: any) => {
      if (message.type !== 'presence_update') return;
      setParticipants(prev => {
        const existed = prev.find(p => p.id === message.user_id);
        if (existed) {
          return prev.map(p => p.id === message.user_id ? {
            ...p,
            current_tool: message.current_tool || p.current_tool,
            activity: message.activity ?? p.activity,
          } : p);
        }
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
    };

    const handlePageChangeEvent = (message: any) => {
      if (message.type !== 'page_change') return;
      setParticipants(prev => prev.map(p =>
        p.username === message.username
          ? { ...p, current_page: message.page_number }
          : p
      ));
      if (showPageDeletionModal && currentSessionId) {
        collaborationService.requestPageViewers();
      }
    };

    const handlePageAdded = (message: any) => {
      if (message.type !== 'page_added') return;
      const latestStory = useStoryStore.getState().currentStory;
      if (!latestStory) {
        console.error('No current story found when handling page_added');
        return;
      }
      const currentPageCount = latestStory.pages.length;
      const expectedIndex = message.page_data?.page_index;
      if (typeof expectedIndex === 'number') {
        if (expectedIndex < currentPageCount) {
          (window as any).addingPage = false;
          return;
        }
        if (expectedIndex > currentPageCount) {
          for (let i = currentPageCount; i < expectedIndex; i++) {
            insertPageAt(latestStory.id, i);
          }
        }
        const serverPageId = message.page_data?.id;
        if (serverPageId) {
          insertPageAtWithId(latestStory.id, expectedIndex, serverPageId, message.page_data?.text || '');
        } else {
          insertPageAt(latestStory.id, expectedIndex);
        }
        if (message.user_id === currentUserId) {
          setCurrentPageIndex(expectedIndex);
        }
      } else {
        const serverPageId = message.page_data?.id;
        if (serverPageId) {
          addPageWithId(latestStory.id, serverPageId, message.page_data?.text || '');
        } else {
          addPage(latestStory.id);
        }
        if (message.user_id === currentUserId) {
          setCurrentPageIndex(currentPageCount);
        }
      }
      (window as any).addingPage = false;
      const refreshedStory = useStoryStore.getState().getStory(latestStory.id);
      if (refreshedStory) {
        setCurrentStory(refreshedStory);
      }
    };

    const handlePageDeleted = (message: any) => {
      if (message.type !== 'page_deleted') return;
      const latestStory = useStoryStore.getState().currentStory;
      if (!latestStory) {
        console.error('No current story found when handling page_deleted');
        return;
      }
      let idx = -1;
      if (typeof message.page_index === 'number') {
        idx = message.page_index;
      } else if (message.page_id) {
        idx = latestStory.pages.findIndex(p => p.id === message.page_id);
      }
      if (idx >= 0 && idx < latestStory.pages.length) {
        deletePage(latestStory.id, latestStory.pages[idx].id);
        const newPageCount = latestStory.pages.length - 1;
        if (currentPageIndex === idx) {
          setCurrentPageIndex(Math.max(0, idx - 1));
        } else if (currentPageIndex > idx) {
          setCurrentPageIndex(currentPageIndex - 1);
        }
        setTimeout(() => {
          const refreshedStory = useStoryStore.getState().getStory(latestStory.id);
          if (refreshedStory) {
            setCurrentStory(refreshedStory);
          }
        }, 50);
      }
    };

    const handleTextUpdate = (message: any) => {
      if (message.type !== 'text_edit') return;
      if (message.user_id === currentUserId) return;
      isReceivingRemoteTextRef.current = true;
    };

    const handleSessionStarted = (message: any) => {
      if (message.type !== 'session_started' && message.type !== 'collaboration_session_started') return;
      setShowLobby(false);
      setIsCollaborating(true);
      window.dispatchEvent(new CustomEvent('collaboration-session-started', {
        detail: { session_id: currentSessionId }
      }));
    };

    const handleVoteInitiated = async (message: any) => {
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
      if (message.initiated_by == currentUserId) {
        setShowSavingOverlay(false);
        setTimeout(() => {
          if (message.vote_id) {
            collaborationService.voteToSave(message.vote_id, true)
              .then(() => console.log('Vote initiator auto-voted YES'))
              .catch(err => console.error('Failed to auto-vote:', err));
          }
        }, 500);
      }
    };

    const handleVoteUpdate = (message: any) => {
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
      setShowVotingModal(false);
      if (message.approved) {
        if (isCurrentUserInitiator) {
          setWasVoteInitiator(true);
          setShowSavingOverlay(false);
          setShowVotingModal(false);
          setShowSuccessNotification(false);
          setTimeout(() => {
            setShowSaveModal(true);
            showInfoToast('Vote passed! Please complete the save process.');
          }, 100);
        } else {
          const initiatorName = votingData?.initiated_by_username || 'Host';
          setWasVoteInitiator(false);
          setShowSaveModal(false);
          setShowVotingModal(false);
          setTimeout(() => {
            setShowSavingOverlay(true);
            showInfoToast(`Vote passed! ${initiatorName} is completing the save process...`);
            const participantTimeout = setTimeout(() => {
              setShowSavingOverlay(false);
              setShowSaveModal(false);
              collaborationService.disconnect();
              setIsCollaborating(false);
              setCurrentSessionId(null);
              navigate('/library', { state: { activeTab: 'private' } });
            }, 15000);
            (window as any).participantTimeoutId = participantTimeout;
          }, 100);
        }
      } else {
        showInfoToast('Vote did not pass. Collaboration continues.');
        setShowSavingOverlay(false);
        setShowSaveModal(false);
        setShowVotingModal(false);
      }
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
      setShowSavingOverlay(false);
      const cancellerName = message.cancelled_by_username || 'Host';
      showInfoToast(`${cancellerName} cancelled the save process. Collaboration continues.`);
    };

    const handleStoryFinalized = (message: any) => {
      const voteInitiatorId = voteInitiatorRef.current;
      const isCurrentUserInitiator = voteInitiatorId && voteInitiatorId == currentUserId;
      if (!isCurrentUserInitiator) {
        setNotificationMessage("Story saved successfully to everyone's library!");
        setShowSuccessNotification(true);
        showInfoToast('🎉 Story saved successfully!');
      } else {
        if (message.story_id && currentStory) {
          updateStory(currentStory.id, { backendId: message.story_id });
        }
      }
    };

    const handleSessionEnded = async (message: any) => {
      if (message.story_id) {
        if (currentStory) {
          useStoryStore.getState().updateStory(currentStory.id, {
            backendId: message.story_id,
            isPublished: true,
            isDraft: false,
            creationType: 'collaborative'
          });
        }
        try {
          await useStoryStore.getState().loadStoriesFromBackend();
        } catch (err) {
          console.warn('Failed to fetch from backend on session end', err);
        }
      }
      if ((window as any).sessionEndTimeoutId) {
        clearTimeout((window as any).sessionEndTimeoutId);
        (window as any).sessionEndTimeoutId = null;
      }
      if ((window as any).participantTimeoutId) {
        clearTimeout((window as any).participantTimeoutId);
        (window as any).participantTimeoutId = null;
      }
      const wasInitiator = voteInitiatorRef.current === currentUserId;
      voteInitiatorRef.current = null;
      setShowSavingOverlay(false);
      setShowSaveModal(false);
      setShowSuccessNotification(false);
      collaborationService.disconnect();
      setIsCollaborating(false);
      setCurrentSessionId(null);
      if (!wasInitiator) {
        showInfoToast(`🎉 Collaboration session ended.`);
      }
      const navDelay = wasInitiator ? 500 : 2000;
      setTimeout(() => {
        navigate('/library', { state: { activeTab: 'private' } });
      }, navDelay);
    };

    const handlePageViewersResponse = (message: any) => {
      if (message.type !== 'page_viewers_response') return;
      setPageViewers(message.page_viewers || {});
    };

    const handleCanvasDrawing = (message: any) => {
      if (message.type !== 'draw' && message.type !== 'drawing_update') {
        return;
      }
      if (currentStory && message.page_id) {
        const messagePageId = message.page_id;
        const messagePageIndex = message.page_index;
        const isCoverImageDrawing = message.is_cover_image || messagePageId === 'cover_image';
        let localPageId = messagePageId;
        if (!isCoverImageDrawing && messagePageIndex !== undefined) {
          if (!currentStory.pages[messagePageIndex]) {
            const storyStore = useStoryStore.getState();
            let latestStory = storyStore.getStory(currentStory.id);
            while (latestStory && latestStory.pages.length <= messagePageIndex) {
              addPage(currentStory.id);
              latestStory = storyStore.getStory(currentStory.id);
            }
          }
          const refreshedStory = useStoryStore.getState().getStory(currentStory.id);
          if (refreshedStory && refreshedStory.pages[messagePageIndex]) {
            localPageId = refreshedStory.pages[messagePageIndex].id;
          }
        }
        const storyStore = useStoryStore.getState();
        const existingData = storyStore.getCanvasData(currentStory.id, localPageId);
        let canvasDataUrl = null;
        let existingOperations: any[] = [];
        if (typeof existingData === 'object' && existingData !== null) {
          canvasDataUrl = existingData.canvasDataUrl;
          existingOperations = existingData.operations || [];
        } else if (typeof existingData === 'string') {
          canvasDataUrl = existingData;
        }
        const updatedOperations = [
          ...existingOperations,
          {
            type: message.data.type,
            data: message.data,
            timestamp: Date.now(),
            user: message.username
          }
        ].slice(-100);
        const updatedCanvasData = {
          canvasDataUrl: canvasDataUrl,
          operations: updatedOperations,
          lastUpdate: Date.now()
        };
        if (isCoverImageDrawing) {
          const COVER_OPERATIONS_KEY = '__cover_operations__';
          storyStore.saveCanvasData(currentStory.id, COVER_OPERATIONS_KEY, updatedCanvasData);
        } else {
          storyStore.saveCanvasData(currentStory.id, localPageId, updatedCanvasData);
        }
        setCanvasActivity(prev => {
          const newMap = new Map(prev);
          newMap.set(localPageId, {
            timestamp: Date.now(),
            user: message.username || 'Collaborator'
          });
          return newMap;
        });
        if (isCoverImageDrawing) {
          renderDrawingToPreview('cover', message.data);
        } else if (currentStory.pages.some(p => p.id === localPageId)) {
          renderDrawingToPreview(localPageId, message.data);
        }
      }
    };

    const handleCanvasClear = (message: any) => {
      if (message.type !== 'clear' && message.type !== 'canvas_cleared') return;
      if (currentStory && message.page_id) {
        const pageId = message.page_id;
        const isCoverImageClear = message.is_cover_image || pageId === 'cover_image';
        const storyStore = useStoryStore.getState();
        storyStore.saveCanvasData(currentStory.id, message.page_id, null as any);
        const story = storyStore.getStory(currentStory.id);
        const page = story?.pages.find(p => p.id === message.page_id);
        if (page) {
          storyStore.updatePage(currentStory.id, message.page_id, {
            canvasData: undefined,
            canvasOperations: []
          });
        }
        if (isCoverImageClear) {
          clearPreviewCanvas('cover');
        } else if (currentStory.pages.some(p => p.id === pageId)) {
          clearPreviewCanvas(pageId);
        }
        setCanvasActivity(prev => {
          const newMap = new Map(prev);
          if (isCoverImageClear) {
            newMap.delete('cover');
          } else {
            newMap.delete(pageId);
          }
          return newMap;
        });
      }
    };

    const handleAllMessages = (message: any) => {
      if (message.page_number !== undefined || message.page_index !== undefined) {
        console.warn('Message contains page info:', {
          type: message.type,
          page_number: message.page_number,
          page_index: message.page_index,
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
    collaborationService.on('vote_initiated', handleVoteInitiated);
    collaborationService.on('vote_update', handleVoteUpdate);
    collaborationService.on('vote_result', handleVoteResult);
    collaborationService.on('story_saved_success', handleStorySavedSuccess);
    collaborationService.on('save_cancelled', handleSaveCancelled);
    collaborationService.on('story_finalized', handleStoryFinalized);
    collaborationService.on('session_ended', handleSessionEnded);
    collaborationService.on('draw', handleCanvasDrawing);
    collaborationService.on('drawing_update', handleCanvasDrawing);
    collaborationService.on('clear', handleCanvasClear);
    collaborationService.on('canvas_cleared', handleCanvasClear);

    if (needsConnection) {
      collaborationService
        .connect(currentSessionId)
        .then(() => {
          if (isCollaborating && !showLobby) {
            setTimeout(() => {
              collaborationService.getPresence(currentSessionId).catch((err) => {
                console.log('Could not load presence:', err.message);
              });
            }, 1500);
          }
        })
        .catch((error) => {
          console.error('Failed to connect to collaboration:', error);
        });
    }

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
      collaborationService.off('vote_initiated', handleVoteInitiated);
      collaborationService.off('vote_update', handleVoteUpdate);
      collaborationService.off('vote_result', handleVoteResult);
      collaborationService.off('story_saved_success', handleStorySavedSuccess);
      collaborationService.off('save_cancelled', handleSaveCancelled);
      collaborationService.off('story_finalized', handleStoryFinalized);
      collaborationService.off('session_ended', handleSessionEnded);
      collaborationService.off('draw', handleCanvasDrawing);
      collaborationService.off('drawing_update', handleCanvasDrawing);
      collaborationService.off('clear', handleCanvasClear);
      collaborationService.off('canvas_cleared', handleCanvasClear);
    };
  }, [isCollaborating, showLobby, currentSessionId]);

  useEffect(() => {
    if (currentStory && isCollaborating && canvasPreviewRef.current) {
      const page = currentStory.pages[currentPageIndex];
      if (page) {
        registerPreviewRef(page.id, canvasPreviewRef.current);
      }
    }
  }, [currentStory?.pages, currentPageIndex, isCollaborating, canvasPreviewRef.current]);

  useEffect(() => {
    if (currentStory && isCollaborating) {
      const currentPage = currentStory.pages[currentPageIndex];
      if (currentPage) {
        const canvasData = getCanvasData(currentStory.id, currentPage.id);
        if (canvasData) {
          const dataUrl = typeof canvasData === 'string' ? canvasData : canvasData.canvasDataUrl;
          updatePreviewCanvasBackground(currentPage.id, dataUrl);
        }
      }
      if (currentStory.coverImage) {
        updatePreviewCanvasBackground('cover', currentStory.coverImage);
      }
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

  useEffect(() => {
    if (!isCollaborating || !currentStory) return;

    const captureInterval = setInterval(() => {
      pagePreviewRefs.current.forEach((previewRef, pageId) => {
        if (previewRef && previewRef.getCanvasDataUrl) {
          const thumbnailUrl = previewRef.getCanvasDataUrl();
          if (thumbnailUrl) {
            const existingData = getCanvasData(currentStory.id, pageId);
            let existingOperations: any[] = [];
            if (typeof existingData === 'object' && existingData !== null) {
              existingOperations = existingData.operations || [];
            }
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
      if (coverPreviewRef.current && coverPreviewRef.current.getCanvasDataUrl) {
        const coverThumbnail = coverPreviewRef.current.getCanvasDataUrl();
        if (coverThumbnail) {
          updateStory(currentStory.id, { coverImage: coverThumbnail });
        }
      }
    }, 30000);

    return () => clearInterval(captureInterval);
  }, [isCollaborating, currentStory?.id]);

  useEffect(() => {
    if (!isHost && showLobby && currentSessionId) {
      const handleSessionStart = (event: any) => {
        if (event.detail.session_id === currentSessionId) {
          if (!currentStory && !hasCreatedStory.current) {
            const newStory = createStory(storyTitle || 'Collaborative Story');
            setStoryTitle(newStory.title);
            setCurrentStory(newStory);
            hasCreatedStory.current = true;
          }
          setShowLobby(false);
          setIsCollaborating(true);
        }
      };

      window.addEventListener('collaboration-session-started', handleSessionStart);

      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`${apiConfigService.getApiUrl()}/collaborate/${currentSessionId}/`);
          if (response.ok) {
            const data = await response.json();
            if (data.is_active) {
              handleSessionStart({ detail: { session_id: currentSessionId } });
              clearInterval(pollInterval);
            }
          }
        } catch (err) {
          console.error('Lobby poll failed:', err);
        }
      }, 2000);

      return () => {
        window.removeEventListener('collaboration-session-started', handleSessionStart);
        clearInterval(pollInterval);
      };
    }
  }, [isHost, showLobby, currentSessionId, currentStory, createStory]);

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

  useEffect(() => {
    if (isCollaborating && currentSessionId && collaborationService.isConnected()) {
      const timer = setTimeout(() => {
        collaborationService.sendPageChange(currentPageIndex);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isCollaborating, currentSessionId, collaborationService.isConnected()]);

  const loadParticipants = async () => {
    if (!currentSessionId) return;
    try {
      const response = await collaborationService.getPresence(currentSessionId);
      if (response.success) {
        setParticipants(response.participants);
      }
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  };

  const handleTextChange = (pageIndex: number, newText: string) => {
    if (currentStory) {
      const targetPage = currentStory.pages[pageIndex];
      if (targetPage) {
        updatePage(currentStory.id, targetPage.id, { text: newText });
      }
    }
    if (isCollaborating && currentSessionId) {
      if (textEditTimeoutRef.current) {
        clearTimeout(textEditTimeoutRef.current);
      }
      textEditTimeoutRef.current = setTimeout(() => {
        const targetPage = currentStory?.pages[pageIndex];
        const pid = targetPage ? targetPage.id : pageIndex;
        collaborationService.sendTextEdit(pid, newText, pageIndex);
      }, 500);
    }
  };

  const handlePageNavigationSync = (newPageIndex: number) => {
    setCurrentPageIndex(newPageIndex);
    if (isCollaborating && currentSessionId) {
      collaborationService.sendPageChange(newPageIndex);
    }
  };

  const handleCancelReconnect = () => {
    collaborationService.disconnect();
    setIsCollaborating(false);
    setIsReconnecting(false);
    setReconnectAttempt(0);
    setRemoteCursors(new Map());
  };

  const handleRetryReconnect = () => {
    collaborationService.retryConnection();
  };

  const handleKickUser = async (userId: number) => {
    if (!isHost || !currentSessionId) return;
    try {
      await collaborationService.kickParticipant(currentSessionId, userId);
    } catch (error) {
      console.error('Failed to kick user:', error);
      alert('Failed to remove user');
    }
  };

  const handleVote = async (agree: boolean) => {
    if (!votingData?.vote_id) {
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

  const handleCollaborativeSave = () => {
    if (isCollaborating && currentSessionId) {
      collaborationService.initiateVote();
    } else {
      setShowSaveModal(true);
    }
  };


  const handleSessionCreated = (sessionId: string) => {
    const story = createStory(storyTitle || 'Collaborative Story');
    setStoryTitle(story.title);
    setCurrentStory(story);
    hasCreatedStory.current = true;
    setCurrentPageIndex(0);
    setCurrentSessionId(sessionId);
    setIsHost(true);
    setShowLobby(false);
    setIsCollaborating(true);

    setTimeout(async () => {
      try {
        await useStoryStore.getState().syncStoryToBackend(story.id, sessionId);
      } catch (err) {
        console.warn('Failed to sync host story to backend:', err);
      }
    }, 0);

    const token = localStorage.getItem('access_token');
    fetch(`${apiConfigService.getApiUrl()}/collaborate/${sessionId}/start/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).catch(err => console.error('Failed to broadcast session start:', err));
  };

  const handleHostSessionStart = async (sessionId: string) => {
    try {
      const sessionData = await getCollaborationSession(sessionId);
      const titleFromSession = sessionData?.story_title || 'Collaborative Story';
      setStoryTitle(titleFromSession);

      if (sessionData.join_code) {
        setJoinCode(sessionData.join_code);
        sessionStorage.setItem('collab_join_code', sessionData.join_code);
      }

      const story = createStory(titleFromSession);
      setStoryTitle(story.title);
      setCurrentStory(story);
      hasCreatedStory.current = true;
      setCurrentPageIndex(0);
      setCurrentSessionId(sessionId);
      setIsHost(true);

      if (!collaborationService.isConnected() || collaborationService.getSessionId() !== sessionId) {
        await collaborationService.connect(sessionId);
      }

      setShowLobby(false);
      setIsCollaborating(true);
      await new Promise(resolve => setTimeout(resolve, 100));

      if (collaborationService.isConnected()) {
        collaborationService.sendMessage({
          type: 'session_started',
          session_id: sessionId
        });
      }
    } catch (err) {
      console.error('Failed to start host session:', err);
      alert(`Failed to start collaboration session: ${(err as any)?.message || err || 'Unknown error'}`);
    }
  };

  const handleSessionJoined = async (sessionId: string) => {
    if (currentSessionId === sessionId && (showLobby || isCollaborating)) {
      return;
    }

    try {
      const sessionData = await getCollaborationSession(sessionId);
      if (sessionData?.story_title) {
        setStoryTitle(sessionData.story_title);
      }
      if (sessionData.join_code) {
        setJoinCode(sessionData.join_code);
        sessionStorage.setItem('collab_join_code', sessionData.join_code);
      }

      setCurrentSessionId(sessionId);
      setIsHost(false);

      const lobbyIsClosed = sessionData.is_lobby_open === false;
      const hasContent = sessionData.story_draft &&
        sessionData.story_draft.pages &&
        sessionData.story_draft.pages.length > 0;
      const hasMultipleParticipants = sessionData.participant_count > 1;
      const sessionAlreadyStarted = lobbyIsClosed || hasContent || hasMultipleParticipants;

      if (!currentStory && !hasCreatedStory.current) {
        if (sessionData.story_id) {
          try {
            const serverStory = await storyApiService.getStory(sessionData.story_id.toString());
            const localStory = storyApiService.convertFromApiFormat(serverStory);
            useStoryStore.getState().addStory(localStory);
            setCurrentStory(localStory);
            setStoryTitle(localStory.title);
            collaborationService.setCurrentStoryId(localStory.id);
            hasCreatedStory.current = true;
          } catch (error) {
            const newStory = createStory(sessionData.story_title || 'Collaborative Story');
            setStoryTitle(newStory.title);
            setCurrentStory(newStory);
            hasCreatedStory.current = true;
            collaborationService.setCurrentStoryId(newStory.id);
          }
        } else {
          const newStory = createStory(sessionData.story_title || 'Collaborative Story');
          setStoryTitle(newStory.title);
          setCurrentStory(newStory);
          hasCreatedStory.current = true;
        }
      }

      if (sessionAlreadyStarted || bypassLobby) {
        setShowLobby(false);
        setIsCollaborating(true);
      } else {
        setShowLobby(true);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      if (!collaborationService.isConnected() || collaborationService.getSessionId() !== sessionId) {
        await collaborationService.connect(sessionId);
      }
    } catch (err) {
      console.error('Failed to join session:', err);
      alert(`Failed to join collaboration session: ${(err as any)?.message || err || 'Unknown error'}`);
    }
  };

  const handleSessionEnded = () => {
    setIsCollaborating(false);
    setShowLobby(false);
    setCurrentSessionId(null);
    setIsHost(false);
    setParticipants([]);
    collaborationService.disconnect();
    if (currentStory) {
      markAsDraft(currentStory.id);
    }
  };

  const handleStartCollaboration = async () => {
    if (!currentSessionId) {
      return;
    }

    if (!currentStory) {
      const story = createStory(storyTitle || 'Collaborative Story');
      setStoryTitle(story.title);
      setCurrentStory(story);
    }

    if (!collaborationService.isConnected() || collaborationService.getSessionId() !== currentSessionId) {
      try {
        await collaborationService.connect(currentSessionId);
      } catch (err) {
        console.error('Failed to connect WebSocket:', err);
      }
    }

    setShowLobby(false);
    setIsCollaborating(true);
    await new Promise(resolve => setTimeout(resolve, 100));

    const token = localStorage.getItem('access_token');
    try {
      const resp = await fetch(
        `${apiConfigService.getApiUrl()}/collaborate/${currentSessionId}/start/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (!resp.ok) {
        const err = await resp.text();
        console.warn('Backend start returned non-OK:', resp.status, err);
      }
    } catch (err) {
      console.error('Failed to call backend start API:', err);
    }

    if (collaborationService.isConnected()) {
      collaborationService.sendMessage({
        type: 'session_started',
        session_id: currentSessionId
      });
    }
  };

  const handleExitLobby = async () => {
    if (isHost && currentSessionId) {
      try {
        const token = localStorage.getItem('access_token');
        await fetch(`${apiConfigService.getApiUrl()}/collaborate/${currentSessionId}/end/`, {
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

    setShowLobby(false);
    setCurrentSessionId(null);
    setIsHost(false);
    setIsCollaborating(false);
    setParticipants([]);

    if (currentSessionId) {
      collaborationService.disconnect();
    }

    if (currentStory) {
      markAsDraft(currentStory.id);
    }

    navigate('/home');
  };

  const handleInviteMoreFromLobby = () => {
    setShowCollabModal(true);
  };

  const handleSimpleCollabStart = async (sessionId: string) => {
    let story = currentStory;
    if (!story) {
      story = createStory('Collaborative Story');
      setStoryTitle(story.title);
      setCurrentStory(story);
    }
    setCurrentSessionId(sessionId);
    setIsCollaborating(true);
    setShowLobby(false);
  };

  const handleCanvasEdit = () => {
    if (currentStory) {
      const currentPage = currentStory.pages[currentPageIndex];
      navigate('/canvas-drawing', {
        state: {
          storyId: currentStory.id,
          pageId: currentPage.id,
          pageIndex: currentPageIndex,
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
          pageId: 'cover',
          pageIndex: -1,
          isCoverImage: true,
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
    if (isCollaborating && currentSessionId) {
      try {
        await collaborationService.initiateVote();
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

    const hasContent = currentStory.pages.some(page => page.text && page.text.trim().length > 0);
    if (!hasContent) {
      alert('Please add some text to your story before saving.');
      return;
    }

    const wasAlreadySaved = !currentStory.isDraft;

    if (storyTitle !== currentStory.title) {
      updateStory(currentStory.id, { title: storyTitle });
      setCurrentStory({ ...currentStory, title: storyTitle });
    }

    const genreString = genres.length > 0 ? genres.join(', ') : undefined;
    updateStory(currentStory.id, {
      genre: genreString,
      description: description || undefined,
      tags: genres,
      language: language
    });

    if (isCollaborating && currentSessionId) {
      try {
        const currentDraft = await collaborationService.getDraft(currentSessionId);
        const updatedDraft = {
          ...currentDraft.story_draft,
          genres: genres,
          category: genres.length > 0 ? genres[0].toLowerCase().replace(/\s+/g, '_') : 'other',
          summary: description || '',
          language: language
        };
        await collaborationService.updateDraft(currentSessionId, updatedDraft);
      } catch (error) {
        console.error('Failed to update collaboration draft:', error);
      }
    }

    markAsSaved(currentStory.id);
    setHasUnsavedChanges(false);

    if (!(isCollaborating && currentSessionId && wasVoteInitiator)) {
      try {
        await syncStoryToBackend(currentStory.id);
      } catch (error) {
        console.error('Failed to sync story to backend:', error);
      }
    }

    addSkillPoints('writing', 5);
    updateAchievementProgress('first-story', 1);

    const message = wasAlreadySaved ? 'Changes saved successfully' : 'Story saved successfully';
    setNotificationMessage(message);
    setShowSuccessNotification(true);
    showInfoToast('Story saved successfully!');
    setShowSaveModal(false);

    if (isCollaborating && currentSessionId && wasVoteInitiator) {
      try {
        await collaborationService.sendMessage({
          type: 'finalize_collaborative_story'
        });

        const sessionEndTimeout = setTimeout(() => {
          setShowSaveModal(false);
          setShowSavingOverlay(false);
          collaborationService.disconnect();
          setIsCollaborating(false);
          setCurrentSessionId(null);
          navigate('/library', { state: { activeTab: 'private' } });
        }, 10000);

        (window as any).sessionEndTimeoutId = sessionEndTimeout;
        return;
      } catch (error) {
        console.error('Failed to finalize collaborative story:', error);
        setShowSaveModal(false);
        setShowSavingOverlay(false);
        setTimeout(() => {
          navigate('/library', { state: { activeTab: 'private' } });
        }, 1000);
        return;
      }
    }

    if (isCollaborating && currentSessionId && !wasVoteInitiator) {
      try {
        await collaborationService.sendMessage({
          type: 'story_saved_success',
          message: 'Story has been saved successfully!',
          saved_by_username: currentUsername || 'Host'
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error sending success message:', error);
      }

      try {
        await collaborationService.sendMessage({
          type: 'session_ended',
          ended_by: currentUserId,
          ended_by_username: currentUsername || 'Host',
          reason: 'story_saved'
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        await collaborationService.endSession(currentSessionId);
      } catch (error) {
        console.error('Failed to end collaboration session:', error);
      }

      collaborationService.disconnect();
      setIsCollaborating(false);
      setCurrentSessionId(null);
    }

    setTimeout(() => {
      setShowSuccessNotification(false);
      navigate('/library', { state: { activeTab: 'private' } });
    }, 2000);
  };

  const isStoryModified = (story: any): boolean => {
    if (!story) return false;
    const hasCustomTitle = story.title &&
      story.title !== 'Untitled Story' &&
      story.title !== 'Collaborative Story' &&
      story.title.trim().length > 0;
    const hasTextContent = story.pages && story.pages.some((page: any) =>
      page.text && page.text.trim().length > 0
    );
    const hasCanvasData = story.pages && story.pages.some((page: any) =>
      page.canvasData && page.canvasData.length > 0
    );
    const hasCoverImage = story.coverImage && story.coverImage.length > 0;
    return hasCustomTitle || hasTextContent || hasCanvasData || hasCoverImage;
  };

  const handleBack = () => {
    if (isCollaborating) {
      setShowLeaveConfirmModal(true);
      return;
    }

    if (currentStory) {
      if (isStoryModified(currentStory)) {
        if (hasUnsavedChanges) {
          markAsDraft(currentStory.id);
        }
      } else {
        const { deleteStory } = useStoryStore.getState();
        deleteStory(currentStory.id);
      }
    }

    navigate('/home');
  };

  const confirmLeaveCollaboration = () => {
    setShowLeaveConfirmModal(false);

    if (!location.pathname.includes('/canvas')) {
      showInfoToast('Left Collaboration', 'You have left the collaboration session');
    }

    if (currentStory) {
      if (isStoryModified(currentStory)) {
        if (hasUnsavedChanges) {
          markAsDraft(currentStory.id);
        }
      } else {
        const { deleteStory } = useStoryStore.getState();
        deleteStory(currentStory.id);
      }
    }

    if (collaborationService.isConnected()) {
      collaborationService.disconnect();
    }

    setIsCollaborating(false);
    setCurrentSessionId(null);
    setIsHost(false);
    setJoinCode(null);

    navigate('/home');
  };

  const addNewPage = () => {
    if (!currentStory) return;

    if (isCollaborating && currentSessionId) {
      const newIndex = currentStory.pages.length;
      if ((window as any).addingPage) {
        return;
      }
      (window as any).addingPage = true;
      collaborationService.addPage({ page_index: newIndex }, newIndex);
      setTimeout(() => {
        (window as any).addingPage = false;
      }, 2000);
      return;
    }

    const newPage = addPage(currentStory.id);
    setCurrentPageIndex(currentStory.pages.length - 1);
    setHasUnsavedChanges(true);
    markAsDraft(currentStory.id);
  };

  const contentUpdateTimeoutRef = useRef<number | null>(null);
  const lastContentRef = useRef<string>('');

  const updateCurrentPageContent = (content: string) => {
    if (!currentStory || !currentPage) return;
    updatePage(currentStory.id, currentPage.id, { text: content });

    if (contentUpdateTimeoutRef.current) {
      clearTimeout(contentUpdateTimeoutRef.current);
    }

    contentUpdateTimeoutRef.current = window.setTimeout(() => {
      if (content === lastContentRef.current) return;
      lastContentRef.current = content;

      setHasUnsavedChanges(true);
      markAsDraft(currentStory.id);

      if (isCollaborating && currentSessionId) {
        collaborationService.updatePresence(null, 'text', 'typing_text');
        handleTextChange(currentPageIndex, content);
      }
    }, 100);
  };

  const handleEnhanceText = (type: EnhancementType) => {
    if (!currentPage?.text || currentPage.text.trim().length < 10) {
      showInfoToast('Please write at least 10 characters before enhancing.');
      return;
    }
    setEnhancementType(type);
    setShowEnhancementModal(true);
    setShowEnhancementDropdown(false);
  };

  const handleApplyEnhancement = (enhancedText: string) => {
    if (currentStory && currentPage) {
      updateCurrentPageContent(enhancedText);
      showInfoToast('✨ Text enhanced successfully!');
    }
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      handlePageNavigationSync(currentPageIndex - 1);
    }
  };

  const goToNextPage = () => {
    if (currentStory && currentPageIndex < currentStory.pages.length - 1) {
      handlePageNavigationSync(currentPageIndex + 1);
    }
  };

  const selectPage = (index: number) => {
    handlePageNavigationSync(index);
  };

  const handleDeletePage = () => {
    if (!currentStory) return;
    if (isCollaborating) {
      setShowPageDeletionModal(true);
      return;
    }

    const guardedPageIndex = currentPageIndex;
    if (!currentStory || currentStory.pages.length <= 1) return;

    if (isCollaborating && currentSessionId) {
      collaborationService.deletePage(guardedPageIndex, currentPage!.id);
    } else {
      deletePage(currentStory.id, currentPage!.id);
      setHasUnsavedChanges(true);
      markAsDraft(currentStory.id);
    }
  };

  const handleModalDeletePage = (pageIndex: number) => {
    if (!currentStory || pageIndex < 0 || pageIndex >= currentStory.pages.length) return;
    const pageId = currentStory.pages[pageIndex]?.id;
    if (pageId) {
      collaborationService.deletePage(pageIndex, pageId);
    }
  };

  const handleRequestPageViewers = () => {
    if (isCollaborating && currentSessionId && collaborationService.isConnected()) {
      collaborationService.requestPageViewers();
    }
  };

  const handlePageViewersResponse = (message: any) => {
    if (message.type !== 'page_viewers_response') return;
    setPageViewers(message.page_viewers || {});
  };

  useEffect(() => {
    if (storyId) {
      const story = useStoryStore.getState().getStory(storyId);
      if (story) {
        setCurrentStory(story);
        setStoryTitle(story.title);
        hasCreatedStory.current = true;
        collaborationService.setCurrentStoryId(story.id);
        if (originalIsDraft.current === undefined) {
          originalIsDraft.current = story.isDraft;
        }
        if (returnToPageIndex !== undefined && returnToPageIndex >= 0 && returnToPageIndex < story.pages.length) {
          setCurrentPageIndex(returnToPageIndex);
        }
      }
    } else if (!hasCreatedStory.current) {
      hasCreatedStory.current = true;
      const incomingTitle = (location.state as any)?.storyTitle || 'Untitled Story';
      const newStory = createStory(incomingTitle);
      setStoryTitle(newStory.title);
      setCurrentStory(newStory);
      collaborationService.setCurrentStoryId(newStory.id);
      originalIsDraft.current = true;

      if (isCollaborative && collabSessionId) {
        handleSessionJoined(collabSessionId).catch(() => { });
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
        navigate('/create-story-manual', { state: { storyId: newStory.id }, replace: true });
      }
    }
  }, [storyId, returnToPageIndex]);

  useEffect(() => {
    if (currentStory && location.pathname === '/create-story-manual') {
      const refreshedStory = useStoryStore.getState().getStory(currentStory.id);
      if (refreshedStory) {
        const hasChanges = refreshedStory.pages.some((page, index) => {
          const currentPage = currentStory.pages[index];
          return !currentPage || page.canvasData !== currentPage.canvasData || page.text !== currentPage.text;
        });
        if (hasChanges || refreshedStory.pages.length !== currentStory.pages.length) {
          setCurrentStory(refreshedStory);
          if (refreshedStory.title !== storyTitle && !hasUnsavedChanges) {
            setStoryTitle(refreshedStory.title);
          }
        }
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    const autoSave = () => {
      if (hasUnsavedChanges && currentStory) {
        if (storyTitle !== currentStory.title) {
          updateStory(currentStory.id, { title: storyTitle });
        }
      }
    };
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [hasUnsavedChanges, currentStory, storyTitle, updateStory]);

  useEffect(() => {
    const storeStory = useStoryStore.getState().currentStory;
    if (storeStory && !currentStory) {
      setCurrentStory(storeStory);
      return;
    }
    if (isCollaborating && !currentStory && !storeStory && !hasCreatedStory.current && currentUserId) {
      try {
        const newStory = createStory(storyTitle || 'Collaborative Story');
        setStoryTitle(newStory.title);
        setCurrentStory(newStory);
        hasCreatedStory.current = true;
      } catch (error) {
        console.error('Failed to create story:', error);
      }
    }
  }, [currentStory, isCollaborating, currentUserId]);

  useEffect(() => {
    if (!currentStory && isCollaborating && !collabSessionId) {
      const storeState = useStoryStore.getState();
      const storyInStore = storeState.currentStory;
      if (storyInStore) {
        setCurrentStory(storyInStore);
      } else {
        const emergencyStory = createStory(storyTitle || 'Collaborative Story');
        setCurrentStory(emergencyStory);
        hasCreatedStory.current = true;
      }
    }
  }, [currentStory, isCollaborating, storyTitle, collabSessionId]);

  if (showLobby && currentSessionId && !isCollaborating) {
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

  if (!currentStory) {
    return (
      <div className="create-story-page">
        <div className="pt-loading-container">
          <div style={{ textAlign: 'center' }}>
            <div className="pt-loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p className="pt-loading-text">Loading story...</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="create-story-page">
      {/* Decorative blob */}
      <div className="blob-berry"></div>

      {/* Content Wrapper */}
      <div className="pt-content-wrapper">
        {/* ===== Page Header ===== */}
        <div className="pt-page-header">
          <div className="pt-page-header-left">
            <button onClick={handleBack} className="pt-back-button" aria-label="Go back">
              <ChevronLeftIcon />
            </button>
            <div className="pt-header-title-group">
              <h1 className="pt-header-title">Create Your Story</h1>
              <p className="pt-header-subtitle">Bring your imagination to life</p>
            </div>
          </div>
          <div className="pt-collab-container">
            {isCollaborating && currentSessionId && (
              <div className="pt-collab-badge-wrapper">
                <div className="pt-collab-badge">
                  <UserGroupIcon />
                  <span>Collaborating</span>
                </div>
                <div className="pt-join-code">
                  {joinCode ? (
                    <>
                      <span className="pt-join-code-label">Join Code:</span>{' '}
                      <span className="pt-join-code-value">{joinCode}</span>
                    </>
                  ) : (
                    <>
                      <span className="pt-join-code-label">Session:</span>{' '}
                      <span className="pt-join-code-value">{currentSessionId.slice(0, 8)}</span>
                    </>
                  )}
                </div>
              </div>
            )}
            {isCollaborating && (
              <div className="pt-participant-count">
                <UserGroupIcon />
                <span>{participants.filter(p => p.is_active).length || 0}/5</span>
              </div>
            )}
            <button
              onClick={handleSaveClick}
              className={`pt-save-button ${hasUnsavedChanges ? 'pt-unsaved' : ''}`}
            >
              <ArchiveBoxArrowDownIcon />
              {hasUnsavedChanges ? 'Save*' : 'Saved'}
            </button>
          </div>
        </div>

        {/* ===== Main Grid ===== */}
        <div className="pt-main-grid">
          {/* ===== Left Column ===== */}
          <div className="pt-left-column">
            {/* Story Title Card */}
            <div className="pt-section-card">
              <div className="pt-section-header">
                <div className="pt-section-header-left">
                  <div className="pt-icon-badge pt-icon-badge--sunshine">
                    <PencilIcon />
                  </div>
                  <h2 className="pt-section-title">Story Title</h2>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <VoiceFilteredInput
                  {...(isCollaborating ? presence.trackTextInput('story-title', 'title') : {})}
                  data-element-id="story-title"
                  value={storyTitle}
                  onChange={(value: string) => {
                    setStoryTitle(value);
                    setHasUnsavedChanges(true);
                    if (isCollaborating && currentSessionId) {
                      collaborationService.sendTitleEdit(value);
                      collaborationService.updatePresence(null, 'text', 'typing_title');
                    }
                  }}
                  placeholder="Enter your story title..."
                  className="pt-input"
                />
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

            {/* Cover Image Card */}
            <div className="pt-section-card">
              <div className="pt-section-header">
                <div className="pt-section-header-left">
                  <div className="pt-icon-badge pt-icon-badge--berry">
                    <PhotoIcon />
                  </div>
                  <h2 className="pt-section-title">Cover Image</h2>
                </div>
                <button
                  onClick={handleCoverImageEdit}
                  className="pt-edit-pill"
                >
                  <PencilIcon />
                  Edit
                </button>
              </div>
              <div className="pt-dropzone" onClick={handleCoverImageEdit}>
                {hasCoverImage ? (
                  <div className="pt-canvas-preview">
                    <img
                      src={currentStory.coverImage}
                      alt="Cover image preview"
                    />
                    <div className="pt-canvas-overlay">
                      <PencilIcon />
                      <span>Edit Cover Image</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-dropzone-inner">
                    <div className="pt-dropzone-icon-wrap">
                      <PhotoIcon />
                    </div>
                    <p className="pt-dropzone-label">Click to add cover image</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===== Right Column ===== */}
          <div className="pt-right-column">
            {/* Drawing Area Card */}
            <div className="pt-section-card">
              <div className="pt-section-header">
                <div className="pt-section-header-left">
                  <div className="pt-icon-badge pt-icon-badge--sky">
                    <PhotoIcon />
                  </div>
                  <h2 className="pt-section-title">Drawing Area {currentPageIndex + 1}</h2>
                </div>
                <button
                  onClick={handleCanvasEdit}
                  className="pt-edit-pill"
                >
                  <PencilIcon />
                  Edit
                </button>
              </div>
              <div className="pt-dropzone" onClick={handleCanvasEdit}>
                {hasCanvasData ? (
                  <div className="pt-canvas-preview">
                    <img
                      src={(() => {
                        const data = getCanvasData(currentStory.id, currentPage!.id);
                        return typeof data === 'string' ? data : data?.canvasDataUrl;
                      })()}
                      alt="Canvas preview"
                    />
                    <div className="pt-canvas-overlay">
                      <PencilIcon />
                      <span>Edit Illustration</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-dropzone-inner">
                    <div className="pt-dropzone-icon-wrap">
                      <PhotoIcon />
                    </div>
                    <p className="pt-dropzone-label">Click Edit to add illustrations</p>
                  </div>
                )}
              </div>
            </div>

            {/* Page Text Card */}
            <div className="pt-section-card">
              <div className="pt-section-header">
                <div className="pt-section-header-left">
                  <div className="pt-icon-badge pt-icon-badge--primary">
                    <BookOpenIcon />
                  </div>
                  <h2 className="pt-section-title">Page {currentPageIndex + 1} Text</h2>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <VoiceFilteredTextarea
                  {...(isCollaborating ? presence.trackTextInput(`page-text-${currentPageIndex}`, 'text', currentPageIndex) : {})}
                  data-element-id={`page-text-${currentPageIndex}`}
                  value={currentPage?.text || ''}
                  onChange={(value: string) => updateCurrentPageContent(value)}
                  placeholder="Write your story here... (or click mic to speak)"
                  className="pt-textarea"
                />
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
              <div className="pt-textarea-footer">
                <span className="pt-char-count">{characterCount} characters</span>
                <button className="pt-story-ideas-pill">
                  <SparklesIcon />
                  Story ideas
                </button>
              </div>

              {/* AI Enhancement */}
              {currentPage?.text && currentPage.text.trim().length >= 10 && (
                <div className="pt-ai-container">
                  <div className="pt-ai-dropdown-wrapper">
                    <button
                      onClick={() => setShowEnhancementDropdown(!showEnhancementDropdown)}
                      className="pt-ai-button"
                      title="AI Text Enhancement"
                    >
                      <SparklesIcon className="pt-ai-icon" />
                      <span>Enhance with AI</span>
                      <ChevronDownIcon className="pt-ai-chevron" />
                    </button>

                    {showEnhancementDropdown && (
                      <div className="pt-ai-dropdown">
                        <button
                          onClick={() => handleEnhanceText('grammar')}
                          className="pt-ai-dropdown-item"
                        >
                          <span className="pt-ai-dropdown-icon">✓</span>
                          <div className="pt-ai-dropdown-text">
                            <span className="pt-ai-dropdown-title">Fix Grammar</span>
                            <span className="pt-ai-dropdown-description">Correct spelling and grammar errors</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleEnhanceText('extend')}
                          className="pt-ai-dropdown-item"
                        >
                          <span className="pt-ai-dropdown-icon">↔</span>
                          <div className="pt-ai-dropdown-text">
                            <span className="pt-ai-dropdown-title">Extend Text</span>
                            <span className="pt-ai-dropdown-description">Add more details and descriptions</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleEnhanceText('simplify')}
                          className="pt-ai-dropdown-item"
                        >
                          <span className="pt-ai-dropdown-icon">◐</span>
                          <div className="pt-ai-dropdown-text">
                            <span className="pt-ai-dropdown-title">Simplify</span>
                            <span className="pt-ai-dropdown-description">Make it easier for kids to understand</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleEnhanceText('creative')}
                          className="pt-ai-dropdown-item"
                        >
                          <span className="pt-ai-dropdown-icon">✨</span>
                          <div className="pt-ai-dropdown-text">
                            <span className="pt-ai-dropdown-title">Make Creative</span>
                            <span className="pt-ai-dropdown-description">Add imagination and fun details</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ===== Pager Control ===== */}
            <div className="pt-pager">
              <button
                onClick={goToPreviousPage}
                disabled={currentPageIndex === 0}
                className="pt-pager-nav"
                aria-label="Previous page"
              >
                <ChevronPrevIcon />
              </button>
              <span className="pt-pager-label">
                Page {currentPageIndex + 1} of {currentStory?.pages?.length ?? 0}
              </span>
              <button
                onClick={goToNextPage}
                disabled={!currentStory?.pages?.length || currentPageIndex === currentStory.pages.length - 1}
                className="pt-pager-nav"
                aria-label="Next page"
              >
                <ChevronNextIcon />
              </button>
              <div className="pt-pager-actions">
                <button onClick={addNewPage} className="pt-pager-btn pt-pager-btn--primary">
                  <PlusIcon />
                  Add
                </button>
                {currentStory?.pages?.length > 1 && (
                  <button onClick={handleDeletePage} className="pt-pager-btn pt-pager-btn--danger">
                    <TrashIcon />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invite Friends - Only in collaboration */}
        {isCollaborating && (
          <div className="pt-invite-container">
            <button
              className="pt-invite-btn"
              onClick={async () => {
                if (currentSessionId) {
                  try {
                    const presenceData = await collaborationService.getPresence(currentSessionId);
                    setParticipants(presenceData.participants || []);
                  } catch (error) {
                    console.error('Failed to fetch participants:', error);
                  }
                }
                setShowInviteModal(true);
              }}
            >
              <UserGroupIcon />
              <span>Invite Friends</span>
            </button>
          </div>
        )}
      </div>

      {/* ===== Modals & Overlays ===== */}

      {/* Collaboration Invite Modal */}
      {isCollaborating && currentSessionId ? (
        <ActiveSessionInviteModal
          isOpen={showCollabModal}
          onClose={() => setShowCollabModal(false)}
          sessionId={currentSessionId}
          joinCode={joinCode || currentSessionId.slice(0, 8)}
          storyTitle={storyTitle || 'Untitled Story'}
          onlineUserIds={new Set(participants.filter(p => p.is_active).map(p => p.id))}
        />
      ) : (
        <CollaborationInviteModal
          isOpen={showCollabModal}
          onClose={() => setShowCollabModal(false)}
          onSessionCreated={handleSessionCreated}
          storyTitle={storyTitle || 'Untitled Story'}
          existingSessionId={currentSessionId}
          existingJoinCode={joinCode}
          isSessionActive={false}
        />
      )}

      {/* Invite Friends Modal */}
      {showInviteModal && isCollaborating && currentSessionId && (() => {
        const onlineIds = new Set(participants.filter(p => p.is_active).map(p => p.user_id || p.id));
        return (
          <ActiveSessionInviteModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            sessionId={currentSessionId}
            joinCode={joinCode || currentSessionId.slice(0, 8)}
            storyTitle={storyTitle || 'Untitled Story'}
            onlineUserIds={onlineIds}
          />
        );
      })()}

      {/* Save Story Modal */}
      <SaveStoryModal
        isOpen={showSaveModal}
        onClose={() => {
          if (wasVoteInitiator && isCollaborating) {
            collaborationService.sendMessage({
              type: 'save_cancelled',
              cancelled_by: currentUserId,
              cancelled_by_username: currentUsername
            });
          }
          setShowSaveModal(false);
          setWasVoteInitiator(false);
        }}
        onSave={handleSaveStory}
        currentGenres={currentStory?.tags || []}
        currentLanguage={currentStory?.language || 'en'}
        currentDescription={currentStory?.description || ''}
        storyTitle={storyTitle || 'Untitled Story'}
      />

      {/* Success Notification */}
      {showSuccessNotification && ReactDOM.createPortal(
        <div className="pt-modal-overlay">
          <div className="pt-modal-card">
            <div className="pt-modal-icon pt-modal-icon--success">
              ✅
            </div>
            <h2 className="pt-modal-title">
              Story Saved Successfully!
            </h2>
            <p className="pt-modal-text">
              {isCollaborating
                ? (wasVoteInitiator ? 'Thank you for creating this story!' : 'Thanks for collaborating!')
                : 'Your story has been saved successfully!'}<br />
              Redirecting you to the library...
            </p>
          </div>
        </div>,
        document.body
      )}

      {/* Voting Modal */}
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

      {/* Leave Confirmation Modal */}
      {showLeaveConfirmModal && ReactDOM.createPortal(
        <div
          className="pt-modal-overlay"
          onClick={() => setShowLeaveConfirmModal(false)}
        >
          <div
            className="pt-confirm-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-confirm-header">
              <h3 className="pt-confirm-title">Leave Collaboration?</h3>
              <button
                className="pt-confirm-close"
                onClick={() => setShowLeaveConfirmModal(false)}
                aria-label="Close"
              >
                <XMarkIcon />
              </button>
            </div>
            <p className="pt-confirm-text">
              Are you sure you want to leave this collaboration session? Your work will be saved, but you will disconnect from the session.
            </p>
            <div className="pt-confirm-actions">
              <button
                className="pt-btn pt-btn--secondary"
                onClick={() => setShowLeaveConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="pt-btn pt-btn--primary"
                onClick={confirmLeaveCollaboration}
              >
                Leave Session
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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

      {/* Reconnecting Modal */}
      <ReconnectingModal
        isReconnecting={isReconnecting}
        reconnectAttempt={reconnectAttempt}
        maxAttempts={5}
        onCancel={handleCancelReconnect}
        onRetry={handleRetryReconnect}
      />

      {/* Saving Overlay */}
      {showSavingOverlay && ReactDOM.createPortal(
        <div className="pt-saving-overlay">
          <div className="pt-saving-icon">⏳</div>
          <h2 className="pt-saving-title">Saving Story...</h2>
          <p className="pt-saving-text">
            Please wait while the host completes the save process
          </p>
        </div>,
        document.body
      )}

      {/* Global presence styles */}
      {isCollaborating && (
        <style>{PRESENCE_STYLES}</style>
      )}

      {/* AI Text Enhancement Modal */}
      <TextEnhancementModal
        isOpen={showEnhancementModal}
        onClose={() => setShowEnhancementModal(false)}
        originalText={currentPage?.text || ''}
        onApply={handleApplyEnhancement}
        enhancementType={enhancementType}
      />
    </div>
  );
};

export default ManualStoryCreationPage;