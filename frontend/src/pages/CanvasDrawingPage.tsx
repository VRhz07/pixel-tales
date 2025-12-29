import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStoryStore } from '../stores/storyStore';
import { useToastContext } from '../contexts/ToastContext';
import { PaperDrawingEngine, LayerInfo } from '../components/canvas/PaperDrawingEngine';
import { AdvancedColorPicker } from '../components/canvas/AdvancedColorPicker';
import { GradientEditor, GradientConfig } from '../components/canvas/GradientEditor';
import { BlendingModes, BlendMode } from '../components/canvas/BlendingModes';
import { GradientAppliedModal } from '../components/canvas/GradientAppliedModal';
import { CollaborationPanel } from '../components/canvas/CollaborationPanel';
import { collaborationService } from '../services/collaborationService';
import { CollaborationEnhancer } from '../components/canvas/CollaborationEnhancer';
import ReconnectingModal from '../components/collaboration/ReconnectingModal';
import { VotingModal } from '../components/collaboration/VotingModal';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import '../canvas-studio.css';
import '../components/canvas/AdvancedColorPicker.css';
import '../components/canvas/GradientEditor.css';
import '../components/canvas/BlendingModes.css';
import '../components/canvas/GradientAppliedModal.css';
import {
  PaintBrushIcon,
  Square3Stack3DIcon,
  EyeDropperIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  TrashIcon,
  CheckIcon,
  UserGroupIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  PlusIcon,
  MinusIcon,
  ArrowPathIcon,
  CursorArrowRaysIcon,
  ArrowDownTrayIcon,
  Squares2X2Icon,
  SwatchIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  LockOpenIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

type Tool = 'select' | 'brush' | 'eraser' | 'fill' | 'shapes' | 'text';
type ShapeType = 'rectangle' | 'circle' | 'line' | 'triangle' | 'star' | 'heart' | 'arrow';
type BrushType = 'soft' | 'round' | 'pencil' | 'marker' | 'airbrush';
type Orientation = 'portrait' | 'landscape';

interface Character {
  id: string;
  name: string;
  addedDate: string;
  imageUrl: string;
}

const CanvasDrawingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingEngineRef = useRef<PaperDrawingEngine | null>(null);
  const collaborationEnhancerRef = useRef<CollaborationEnhancer | null>(null);
  
  // Get story and page info from navigation state
  const { 
    storyId, 
    pageId, 
    pageIndex, 
    isCoverImage,
    sessionId: collabSessionId,
    isCollaborating: isCollabFromNav,
    isHost: isHostFromNav
  } = (location.state as { 
    storyId?: string; 
    pageId?: string; 
    pageIndex?: number; 
    isCoverImage?: boolean;
    sessionId?: string;
    isCollaborating?: boolean;
    isHost?: boolean;
  }) || {};
  const { getCanvasData, saveCanvasData, currentStory, markAsDraft, updateStory } = useStoryStore();
  const { showInfoToast } = useToastContext();
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [activeTool, setActiveTool] = useState<Tool>('brush');
  const [activePanel, setActivePanel] = useState<'layers' | 'colors' | 'settings'>('colors');
  const [showToolSubmenu, setShowToolSubmenu] = useState(false);
  const [submenuTool, setSubmenuTool] = useState<Tool | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [showLayersModal, setShowLayersModal] = useState(false);
  const [activeBrush, setActiveBrush] = useState<BrushType>('round');
  const [activeShape, setActiveShape] = useState<ShapeType>('rectangle');
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [showBrushPicker, setShowBrushPicker] = useState(false);
  const [showBrushMenu, setShowBrushMenu] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>(['#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#8B5A2B']);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  // Collaboration states
  const [isCollaborating, setIsCollaborating] = useState(isCollabFromNav || false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(collabSessionId || null);
  const [isHost, setIsHost] = useState(isHostFromNav || false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  
  // Voting modal states
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [votingData, setVotingData] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [participants, setParticipants] = useState<any[]>([]);
  const voteInitiatorRef = useRef<number | null>(null);
  const [showSavingOverlay, setShowSavingOverlay] = useState(false);
  
  // CRITICAL FIX: Set up reconnection handler with useRef to avoid stale closures
  const reconnectHandlerRef = useRef<((reconnecting: boolean, attempt: number) => void) | null>(null);
  const reconnectSuccessHandlerRef = useRef<(() => void) | null>(null);
  
  // Create the handler function that uses the latest state
  reconnectHandlerRef.current = (reconnecting: boolean, attempt: number) => {
    console.log('🔄 Reconnection state changed:', { reconnecting, attempt });
    setIsReconnecting(reconnecting);
    setReconnectAttempt(attempt);
  };
  
  // Create handler for successful reconnection
  reconnectSuccessHandlerRef.current = () => {
    console.log('✅ Reconnection successful, requesting canvas sync');
    
    // Request canvas sync with current page info
    collaborationService.requestCanvasSync(
      pageId?.toString() || undefined,
      pageIndex,
      isCoverImage
    );
  };
  
  // Request canvas sync on initial load if in collaboration mode
  const hasRequestedInitialSync = useRef(false);
  
  // Get current user ID
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
  
  // Handle status bar visibility and orientation changes
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    
    const handleOrientationChange = async () => {
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      const isSmallHeight = window.innerHeight <= 600;
      
      try {
        if (isLandscape && isSmallHeight) {
          // Hide status bar in landscape mode for immersive drawing
          await StatusBar.hide();
          console.log('📱 Status bar hidden (landscape mode)');
        } else {
          // Show status bar in portrait mode
          await StatusBar.show();
          console.log('📱 Status bar shown (portrait mode)');
        }
      } catch (error) {
        console.error('Failed to toggle status bar:', error);
      }
    };
    
    // Initial check
    handleOrientationChange();
    
    // Listen for orientation changes
    const mediaQuery = window.matchMedia('(orientation: landscape)');
    mediaQuery.addEventListener('change', handleOrientationChange);
    
    // Also listen for resize events (more reliable on some devices)
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      
      // Restore status bar when leaving canvas
      if (Capacitor.isNativePlatform()) {
        StatusBar.show().catch(console.error);
      }
    };
  }, []);
  
  useEffect(() => {
    if (isCollaborating && collaborationService.isConnected() && drawingEngineRef.current && !hasRequestedInitialSync.current) {
      hasRequestedInitialSync.current = true;
      console.log('🔄 Initial load in collaboration mode - requesting canvas sync from backend');
      
      // Request canvas sync with current page info
      collaborationService.requestCanvasSync(
        pageId?.toString() || undefined,
        pageIndex,
        isCoverImage
      );
    }
  }, [isCollaborating, collaborationService.isConnected(), pageId, pageIndex, isCoverImage]);
  
  // Auto-save canvas state to localStorage (solo mode) or backend (collaboration mode)
  useEffect(() => {
    if (!drawingEngineRef.current) return;
    
    const autoSaveInterval = setInterval(() => {
      if (!drawingEngineRef.current || !storyId) return;
      
      if (isCollaborating) {
        // Collaboration mode: save to backend via WebSocket
        if (collaborationService.isConnected()) {
          const canvasState = drawingEngineRef.current.getDrawingState();
          collaborationService.sendCanvasState(
            canvasState,
            0, // target_user_id = 0 means save to backend only
            pageId?.toString() || undefined,
            pageIndex,
            isCoverImage
          );
          console.log('💾 Auto-saved canvas state to backend');
        } else {
          console.log('⚠️ Skipping auto-save - WebSocket not connected');
        }
      } else {
        // Solo mode: save to localStorage with full drawing state
        const canvasData = drawingEngineRef.current.getCanvasData();
        const drawingState = drawingEngineRef.current.getDrawingState();
        
        if (isCoverImage) {
          // Save cover image snapshot
          updateStory(storyId, { coverImage: canvasData });
          
          // Also save full state for restoration
          const COVER_OPERATIONS_KEY = '__cover_operations__';
          const canvasStateData = {
            canvasDataUrl: canvasData,
            operations: [],
            drawingState: drawingState, // Include full Paper.js state
            lastUpdate: Date.now()
          };
          saveCanvasData(storyId, COVER_OPERATIONS_KEY, canvasStateData);
          console.log('💾 Auto-saved cover image to localStorage (solo mode)');
        } else if (pageId) {
          // Save page canvas with full state
          const canvasStateData = {
            canvasDataUrl: canvasData,
            operations: [],
            drawingState: drawingState, // Include full Paper.js state
            lastUpdate: Date.now()
          };
          saveCanvasData(storyId, pageId, canvasStateData);
          console.log('💾 Auto-saved page canvas to localStorage (solo mode)');
        }
      }
    }, 5000); // Auto-save every 5 seconds for better persistence
    
    return () => clearInterval(autoSaveInterval);
  }, [isCollaborating, pageId, pageIndex, isCoverImage, storyId]);
  
  // Debug: Log collaboration state on mount
  useEffect(() => {
    console.log('🎨 CanvasDrawingPage mounted with collaboration state:', {
      collabSessionId,
      isCollabFromNav,
      isHostFromNav,
      isCollaborating,
      currentSessionId,
      wsConnected: collaborationService.isConnected()
    });
    
    // Set up reconnection state handler on mount using ref
    console.log('🔧 Setting up reconnection state handler (always active)');
    collaborationService.onReconnectStateChange = (reconnecting: boolean, attempt: number) => {
      // Call through ref to avoid stale closure
      reconnectHandlerRef.current?.(reconnecting, attempt);
    };
    
    // Set up reconnection success handler
    collaborationService.onReconnectSuccess = () => {
      // Call through ref to avoid stale closure
      reconnectSuccessHandlerRef.current?.();
    };

    return () => {
      // Clean up the reconnection handlers
      console.log('🧹 Cleaning up reconnection handlers');
      if (collaborationService.onReconnectStateChange) {
        collaborationService.onReconnectStateChange = undefined;
      }
      if (collaborationService.onReconnectSuccess) {
        collaborationService.onReconnectSuccess = undefined;
      }
    };
  }, []);
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState<Map<number, { user_id: number; username: string; color: string; x: number; y: number }>>(new Map());
  const cursorUpdateThrottle = useRef<number>(0);
  // Store user colors separately to persist across cursor updates
  const userColorsRef = useRef<Map<number, string>>(new Map());
  
  // Advanced color management states
  const [showAdvancedColorPicker, setShowAdvancedColorPicker] = useState(false);
  const [showGradientEditor, setShowGradientEditor] = useState(false);
  const [gradientActive, setGradientActive] = useState(false);
  const [showGradientModal, setShowGradientModal] = useState(false);
  const [currentGradient, setCurrentGradient] = useState<GradientConfig>({
    type: 'linear',
    angle: 90,
    stops: [
      { color: '#667eea', position: 0 },
      { color: '#764ba2', position: 100 }
    ]
  });
  const [layerBlendModes, setLayerBlendModes] = useState<Record<string, BlendMode>>({});
  
  // Set initial zoom based on device type
  // Mobile phone (< 768px): 75% zoom
  // Tablet (768px - 1023px): 100% zoom
  // Desktop (>= 1024px): 100% zoom
  useEffect(() => {
    const width = window.innerWidth;
    let initialZoom = 1; // Default for desktop and tablet
    
    if (width < 768) {
      initialZoom = 0.75; // Mobile phone only
    }
    
    setZoomLevel(initialZoom);
    setPanOffset({ x: 0, y: 0 });
  }, []);
  const isPanningRef = useRef(false); // Use ref instead of state to avoid re-renders
  const [isPanning, setIsPanning] = useState(false); // Keep state for UI indicator only
  const lastPanPointRef = useRef({ x: 0, y: 0 }); // Use ref instead of state
  const lastPinchDistanceRef = useRef<number | null>(null); // Use ref for immediate access
  const lastPinchCenterRef = useRef({ x: 0, y: 0 }); // Use ref for immediate access
  const [shapeFilled, setShapeFilled] = useState(false);
  const [blockDrawing, setBlockDrawing] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Waiting for touch...');
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showTrashZone, setShowTrashZone] = useState(false);
  const [isOverTrashZone, setIsOverTrashZone] = useState(false);
  const trashZoneRef = useRef<HTMLDivElement>(null);
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingLayerName, setEditingLayerName] = useState('');
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const opacityTimeoutRef = useRef<number | null>(null);
  const thumbnailCacheRef = useRef<Map<string, string>>(new Map());
  // Mock character data
  const characters: Character[] = [
    { id: '1', name: 'Hero Character', addedDate: '1/15/2024', imageUrl: '/api/placeholder/200/200' },
    { id: '2', name: 'Villain Design', addedDate: '1/14/2024', imageUrl: '/api/placeholder/200/200' },
    { id: '3', name: 'Side Character', addedDate: '1/13/2024', imageUrl: '/api/placeholder/200/200' }
  ];

  // Canvas-specific keyboard handling: Ensure tools remain accessible
  useEffect(() => {
    const handleCanvasKeyboard = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardHeight = windowHeight - viewportHeight;
        setKeyboardHeight(keyboardHeight > 0 ? keyboardHeight : 0);
        
        // For canvas page, adjust layout when keyboard is open
        const canvasStudio = document.querySelector('.canvas-studio') as HTMLElement;
        const mobileToolbar = document.querySelector('.canvas-studio-mobile-toolbar') as HTMLElement;
        
        if (canvasStudio && keyboardHeight > 0) {
          // Keyboard is open - adjust canvas to fit above keyboard
          canvasStudio.style.height = `${viewportHeight}px`;
          
          // Move toolbar above keyboard
          if (mobileToolbar) {
            mobileToolbar.style.bottom = `${keyboardHeight + 10}px`;
          }
        } else if (canvasStudio) {
          // Keyboard is closed - reset to normal
          canvasStudio.style.height = '100vh';
          
          // Reset toolbar to normal position
          if (mobileToolbar) {
            mobileToolbar.style.bottom = '';
          }
        }
      }
    };

    // Initial check
    handleCanvasKeyboard();

    // Listen for viewport changes (keyboard show/hide)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleCanvasKeyboard);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleCanvasKeyboard);
      }
      // Reset canvas and toolbar on cleanup
      const canvasStudio = document.querySelector('.canvas-studio') as HTMLElement;
      const mobileToolbar = document.querySelector('.canvas-studio-mobile-toolbar') as HTMLElement;
      
      if (canvasStudio) {
        canvasStudio.style.height = '100vh';
      }
      if (mobileToolbar) {
        mobileToolbar.style.bottom = '';
      }
    };
  }, [isMobile]); // Always monitor for canvas keyboard changes

  // Handle orientation and resize changes
  useEffect(() => {
    let resizeTimeout: number;
    
    const handleResize = () => {
      // Clear previous timeout to debounce rapid resize events
      clearTimeout(resizeTimeout);
      
      resizeTimeout = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        setOrientation(width > height ? 'landscape' : 'portrait');
        
        // Verify canvas size (will skip if already correct)
        if (drawingEngineRef.current) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              drawingEngineRef.current?.resizeCanvas();
            });
          });
        }
      }, 300); // Longer debounce for browser inspect device emulation
    };

    // Listen to resize events (works in emulator and real devices)
    window.addEventListener('resize', handleResize);
    // Also listen to orientationchange for real devices
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Update Paper.js engine when zoom or pan changes
  useEffect(() => {
    if (drawingEngineRef.current) {
      drawingEngineRef.current.setZoomAndPan(zoomLevel, panOffset);
    }
  }, [zoomLevel, panOffset]);

  // Update Paper.js engine when brush size changes
  useEffect(() => {
    if (drawingEngineRef.current) {
      drawingEngineRef.current.setSize(brushSize);
    }
  }, [brushSize]);

  // Update Paper.js engine when brush opacity changes
  useEffect(() => {
    if (drawingEngineRef.current) {
      drawingEngineRef.current.setOpacity(brushOpacity);
    }
  }, [brushOpacity]);

  // Update Paper.js engine when shape fill changes
  useEffect(() => {
    if (drawingEngineRef.current) {
      drawingEngineRef.current.setShapeFilled(shapeFilled);
    }
  }, [shapeFilled]);

  // Update Paper.js engine when drawing block state changes
  useEffect(() => {
    if (drawingEngineRef.current) {
      drawingEngineRef.current.setDrawingBlocked(blockDrawing);
    }
  }, [blockDrawing]);

  // Update Paper.js engine when active tool changes
  useEffect(() => {
    if (drawingEngineRef.current) {
      drawingEngineRef.current.setTool(activeTool as any);
    }
  }, [activeTool]);

  // Initialize canvas and drawing engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        // If engine already exists, clear it for new page
        if (drawingEngineRef.current) {
          drawingEngineRef.current.destroy();
          drawingEngineRef.current = null;
        }
        
        // Initialize Paper.js drawing engine
        drawingEngineRef.current = new PaperDrawingEngine(canvas);
        
        // Initialize collaboration enhancer
        collaborationEnhancerRef.current = new CollaborationEnhancer(pageId, pageIndex, isCoverImage);
        collaborationEnhancerRef.current.initialize(drawingEngineRef.current);
        collaborationEnhancerRef.current.setCollaborating(isCollaborating);
        
        // Set up text input callback
        drawingEngineRef.current.setTextInputCallback((point) => {
          setTextPosition(point);
          setShowTextModal(true);
        });
        
        // Set up layers changed callback
        drawingEngineRef.current.setLayersChangedCallback(() => {
          updateLayersList();
        });
        
        // Set up drag callbacks for trash zone
        let wasOverTrash = false;
        drawingEngineRef.current.setDragCallbacks(
          () => {
            setShowTrashZone(true);
            wasOverTrash = false;
          },
          () => {
            // Check if item was dropped over trash zone
            if (wasOverTrash) {
              // Small delay to ensure transform system has finished
              setTimeout(() => {
                if (drawingEngineRef.current) {
                  (drawingEngineRef.current as any).transformSystem.deleteSelectedItem();
                  (drawingEngineRef.current as any).saveState();
                }
              }, 10);
            }
            setShowTrashZone(false);
            setIsOverTrashZone(false);
            wasOverTrash = false;
          },
          (point) => {
            // Convert canvas point to screen coordinates
            if (trashZoneRef.current && canvasRef.current) {
              const canvasRect = canvasRef.current.getBoundingClientRect();
              const trashRect = trashZoneRef.current.getBoundingClientRect();
              
              // The point is in canvas pixel coordinates (0-500)
              // canvasRect gives us the actual screen position and size after CSS transforms
              // Calculate the ratio between canvas pixels and screen pixels
              const scaleX = canvasRect.width / canvasRef.current.width;
              const scaleY = canvasRect.height / canvasRef.current.height;
              
              // Convert canvas coordinates to screen coordinates
              const screenX = canvasRect.left + (point.x * scaleX);
              const screenY = canvasRect.top + (point.y * scaleY);
              
              // Check if point is within trash zone with some padding for easier targeting
              const padding = 30;
              const isOver = screenX >= (trashRect.left - padding) && 
                            screenX <= (trashRect.right + padding) &&
                            screenY >= (trashRect.top - padding) && 
                            screenY <= (trashRect.bottom + padding);
              
              wasOverTrash = isOver;
              setIsOverTrashZone(isOver);
            }
          }
        );
        
        // Set up collaboration callbacks
        drawingEngineRef.current.setCollaborationCallbacks(
          // onDrawingComplete - send drawing to other users
          (data) => {
            console.log('🎨 Drawing completed, checking connection...', {
              isCollaborating,
              currentSessionId,
              isConnected: collaborationService.isConnected(),
              wsReadyState: collaborationService.ws?.readyState,
              hasData: !!data
            });
            
            // Check WebSocket state directly
            if (collaborationService.ws && collaborationService.ws.readyState === WebSocket.OPEN) {
              console.log('✅ WebSocket is OPEN, sending drawing to collaborators:', data);
              
              // Validate page identification before sending
              if (!isCoverImage && !pageId) {
                console.error('❌ Cannot send drawing: pageId is undefined for non-cover page');
                console.error('Canvas state:', { pageId, pageIndex, isCoverImage, storyId });
                return;
              }
              
              // Enhance drawing data with page information for cross-page sync
              const enhancedData = {
                ...data,
                page_id: isCoverImage ? 'cover_image' : (pageId || `page_${pageIndex}`),
                page_index: isCoverImage ? -1 : (pageIndex !== undefined ? pageIndex : 0),
                is_cover_image: isCoverImage || false
              };
              
              console.log('🔍 Sending enhanced drawing data:', {
                originalData: data,
                enhancedData,
                pageId,
                pageIndex,
                isCoverImage,
                'pageId is undefined': pageId === undefined,
                'pageIndex is undefined': pageIndex === undefined,
                'final page_id': enhancedData.page_id,
                'final page_index': enhancedData.page_index
              });
              
              collaborationService.sendDrawing(enhancedData);
            } else {
              console.warn('⚠️ WebSocket not OPEN. State:', {
                exists: !!collaborationService.ws,
                readyState: collaborationService.ws?.readyState,
                readyStateName: collaborationService.ws?.readyState !== undefined 
                  ? ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][collaborationService.ws.readyState]
                  : 'N/A'
              });
            }
          },
          // onCursorMove - throttled cursor position updates with canvas identification
          (x, y) => {
            const now = Date.now();
            if (now - cursorUpdateThrottle.current > 50 && collaborationService.isConnected()) {
              cursorUpdateThrottle.current = now;
              collaborationService.sendCursorPosition(
                x, 
                y,
                isCoverImage ? 'cover_image' : (pageId || `page_${pageIndex}`),
                isCoverImage ? -1 : (pageIndex !== undefined ? pageIndex : 0),
                isCoverImage || false
              );
            }
          }
        );
        
        // Set up transform callbacks for real-time object transformation sync
        if ((drawingEngineRef.current as any).setTransformCallbacks) {
          (drawingEngineRef.current as any).setTransformCallbacks(
            // onTransformStart - notify other users that object is being transformed
            (itemId: string) => {
              if (collaborationEnhancerRef.current && isCollaborating) {
                collaborationEnhancerRef.current.sendToolSelection('transform', itemId);
                console.log('📤 Transform started for item:', itemId);
              }
            },
            // onTransform - send real-time transform updates
            (itemId: string, transformData: any) => {
              if (collaborationEnhancerRef.current && isCollaborating && transformData) {
                const transformPayload = {
                  itemId,
                  type: transformData.type || 'move',
                  matrix: transformData.matrix,
                  bounds: transformData.bounds,
                  rotation: transformData.rotation || 0,
                  scale: transformData.scale || { x: 1, y: 1 },
                  position: transformData.position
                };
                collaborationEnhancerRef.current.sendTransform(transformPayload);
                console.log('📤 Transform update sent for item:', itemId, transformPayload);
              }
            },
            // onTransformEnd - notify transform operation completed
            (itemId: string) => {
              if (collaborationEnhancerRef.current && isCollaborating) {
                collaborationEnhancerRef.current.sendToolSelection('select');
                console.log('📤 Transform ended for item:', itemId);
              }
            }
          );
        }

        // Set up advanced collaboration callbacks for text and layer operations
        if ((drawingEngineRef.current as any).setAdvancedCollaborationCallbacks) {
          (drawingEngineRef.current as any).setAdvancedCollaborationCallbacks(
            // onTextEdit - send text creation/editing to collaborators
            (textData: any) => {
              if (collaborationEnhancerRef.current && isCollaborating) {
                collaborationEnhancerRef.current.sendTextEdit(textData);
                console.log('📤 Text edit sent to collaborators:', textData);
              }
            },
            // onLayerOperation - send layer operations to collaborators
            (operation: string, layerData: any) => {
              if (collaborationEnhancerRef.current && isCollaborating) {
                collaborationEnhancerRef.current.sendLayerOperation(operation as any, layerData);
                console.log('📤 Layer operation sent to collaborators:', operation, layerData);
              }
            }
          );
        }

        // Connect transform system to collaboration callbacks
        if (drawingEngineRef.current.transformSystem && (drawingEngineRef.current.transformSystem as any).setCollaborationCallbacks) {
          (drawingEngineRef.current.transformSystem as any).setCollaborationCallbacks(
            // onTransformStart
            (itemId: string) => {
              if (collaborationEnhancerRef.current && isCollaborating) {
                collaborationEnhancerRef.current.sendToolSelection('transform', itemId);
                console.log('📤 Transform system started for item:', itemId);
              }
            },
            // onTransform
            (itemId: string, transformData: any) => {
              if (collaborationEnhancerRef.current && isCollaborating && transformData) {
                collaborationEnhancerRef.current.sendTransform(transformData);
                console.log('📤 Transform system update sent for item:', itemId, transformData);
              }
            },
            // onTransformEnd
            (itemId: string) => {
              if (collaborationEnhancerRef.current && isCollaborating) {
                collaborationEnhancerRef.current.sendToolSelection('select');
                console.log('📤 Transform system ended for item:', itemId);
              }
            },
            // onDelete
            (itemId: string) => {
              if (collaborationEnhancerRef.current && isCollaborating) {
                collaborationEnhancerRef.current.sendDelete(itemId);
                console.log('📤 Delete sent for item:', itemId);
              }
            }
          );
        }
        
        // Load existing canvas data if available
        if (storyId) {
          let existingData = null;
          
          if (isCoverImage) {
            // Load cover image - check both regular cover image and operations
            const coverImageUrl = currentStory?.coverImage;
            const COVER_OPERATIONS_KEY = '__cover_operations__';
            const coverOperations = getCanvasData(storyId, COVER_OPERATIONS_KEY);
            
            // If we have operations, use that structure; otherwise use just the URL
            if (coverOperations && typeof coverOperations === 'object' && coverOperations.operations) {
              existingData = coverOperations;
              console.log('📂 Retrieved COVER IMAGE with operations:', {
                operationsCount: coverOperations.operations.length,
                hasCanvasUrl: !!coverOperations.canvasDataUrl
              });
            } else if (coverImageUrl) {
              existingData = coverImageUrl;
              console.log('📂 Retrieved COVER IMAGE URL (no operations)');
            }
          } else if (pageId) {
            // Load page canvas data
            existingData = getCanvasData(storyId, pageId);
          }
          
          if (existingData) {
            // Check if existingData contains drawingState (solo mode with full state)
            if (typeof existingData === 'object' && existingData.drawingState) {
              console.log('🎨 Loading canvas with full drawing state (solo mode)');
              console.log('   - Has drawing state:', !!existingData.drawingState);
              console.log('   - Canvas snapshot:', existingData.canvasDataUrl ? 'Yes' : 'No');
              
              // Load the full Paper.js drawing state
              try {
                drawingEngineRef.current.loadDrawingState(existingData.drawingState);
                console.log('✅ Full drawing state loaded successfully');
                
                // Recalculate brush size after canvas data is loaded
                if (drawingEngineRef.current) {
                  drawingEngineRef.current.setSize(brushSize);
                }
              } catch (error) {
                console.error('❌ Failed to load drawing state:', error);
                // Fallback to loading snapshot if state loading fails
                if (existingData.canvasDataUrl) {
                  console.log('⚠️ Falling back to canvas snapshot...');
                  drawingEngineRef.current.loadCanvasData(existingData.canvasDataUrl, () => {
                    if (drawingEngineRef.current) {
                      drawingEngineRef.current.setSize(brushSize);
                    }
                  });
                }
              }
            } else if (typeof existingData === 'object' && existingData.operations) {
              // Check if existingData contains operations (collaboration mode)
              console.log('🎨 Loading canvas with collaboration data');
              console.log('   - Canvas snapshot:', existingData.canvasDataUrl ? 'Yes' : 'No');
              console.log('   - Operations:', existingData.operations?.length || 0);
              
              // Step 1: Load the base canvas snapshot FIRST if available
              if (existingData.canvasDataUrl) {
                console.log('📸 Loading base canvas snapshot...');
                drawingEngineRef.current.loadCanvasData(existingData.canvasDataUrl, () => {
                  if (drawingEngineRef.current) {
                    drawingEngineRef.current.setSize(brushSize);
                  }
                  console.log('✅ Base canvas snapshot loaded');
                  
                  // Step 2: Then replay drawing operations on top of the snapshot
                  if (existingData.operations && existingData.operations.length > 0) {
                    console.log('🔄 Replaying', existingData.operations.length, 'drawing operations on top of snapshot...');
                    
                    // Wait a bit for the snapshot to fully render
                    setTimeout(() => {
                      if (drawingEngineRef.current) {
                        console.log('🎬 Starting operation replay...');
                        existingData.operations.forEach((op: any, index: number) => {
                          setTimeout(() => {
                            if (drawingEngineRef.current && op.data) {
                              try {
                                // Apply the drawing operation
                                (drawingEngineRef.current as any).applyRemoteDrawing(op.data);
                                console.log('✅ Applied operation', index + 1, 'of', existingData.operations.length);
                              } catch (error) {
                                console.error('❌ Failed to apply operation:', error, op);
                              }
                            }
                          }, index * 50); // 50ms delay between operations for smooth rendering
                        });
                      }
                    }, 200); // Wait 200ms for snapshot to render
                  }
                });
              } else {
                // No snapshot, just replay operations
                console.log('🔄 No snapshot found, replaying', existingData.operations.length, 'operations from scratch...');
                
                setTimeout(() => {
                  if (drawingEngineRef.current && existingData.operations) {
                    console.log('🎬 Starting operation replay...');
                    existingData.operations.forEach((op: any, index: number) => {
                      setTimeout(() => {
                        if (drawingEngineRef.current && op.data) {
                          try {
                            (drawingEngineRef.current as any).applyRemoteDrawing(op.data);
                            console.log('✅ Applied operation', index + 1, 'of', existingData.operations.length);
                          } catch (error) {
                            console.error('❌ Failed to apply operation:', error, op);
                          }
                        }
                      }, index * 50);
                    });
                  }
                }, 100); // Wait 100ms for canvas to be fully ready
              }
            } else {
              // Just a regular canvas snapshot (string format)
              console.log('📸 Loading regular canvas snapshot');
              drawingEngineRef.current.loadCanvasData(existingData, () => {
                // Recalculate brush size after canvas data is loaded
                if (drawingEngineRef.current) {
                  drawingEngineRef.current.setSize(brushSize);
                }
              });
            }
          }
        }
        
        // Set initial tool properties
        if (activeTool !== 'text') {
          drawingEngineRef.current.setTool(activeTool as any);
        }
        drawingEngineRef.current.setColor(selectedColor);
        drawingEngineRef.current.setBrushType(activeBrush);
        drawingEngineRef.current.setSize(brushSize);
        drawingEngineRef.current.setOpacity(brushOpacity);
        
        // Set initial zoom and pan
        drawingEngineRef.current.setZoomAndPan(zoomLevel, panOffset);
        
        // Load initial layers
        updateLayersList();
        
        // Verify canvas size matches CSS (will skip if already 500x500)
        requestAnimationFrame(() => {
          if (drawingEngineRef.current) {
            drawingEngineRef.current.resizeCanvas();
          }
        });
      } catch (error) {
        console.error('Failed to initialize Paper.js drawing engine:', error);
      }
      
      // Add zoom and pan event listeners
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoomLevel(prev => Math.min(Math.max(prev * delta, 0.1), 5));
      };
      
      const handleTouchStart = (e: TouchEvent) => {
        setDebugInfo(`TouchStart: ${e.touches.length} fingers`);
        
        // CRITICAL: Block drawing IMMEDIATELY when second finger touches
        if (e.touches.length >= 2) {
          setDebugInfo('Two fingers - Pan mode ON');
          // Block drawing BEFORE anything else
          setBlockDrawing(true);
          
          // Two fingers - start pan/zoom mode
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation(); // CRITICAL: Stop drawing engine from receiving this event
          
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          
          // Calculate initial pinch distance
          const distance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) + 
            Math.pow(touch2.clientY - touch1.clientY, 2)
          );
          lastPinchDistanceRef.current = distance;
          
          // Calculate pinch center point
          const centerX = (touch1.clientX + touch2.clientX) / 2;
          const centerY = (touch1.clientY + touch2.clientY) / 2;
          lastPinchCenterRef.current = { x: centerX, y: centerY };
          
          isPanningRef.current = true;
          setIsPanning(true); // For UI indicator;
        } else if (e.touches.length === 1 && isPanningRef.current) {
          // One finger while exiting pan mode - block it!
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
        // Single touch - let the drawing engine handle it
      };
      
      const handleTouchMove = (e: TouchEvent) => {
        // Block any touch move if we're exiting pan mode
        if (isPanningRef.current && e.touches.length === 1) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return;
        }
        
        if (e.touches.length === 2) {
          // Two fingers - handle pan and zoom
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation(); // CRITICAL: Stop drawing engine from receiving this event
          
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          
          // Calculate current pinch distance
          const currentDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) + 
            Math.pow(touch2.clientY - touch1.clientY, 2)
          );
          
          // Calculate current pinch center
          const currentCenterX = (touch1.clientX + touch2.clientX) / 2;
          const currentCenterY = (touch1.clientY + touch2.clientY) / 2;
          
          // Only process if we have previous values
          if (lastPinchDistanceRef.current !== null) {
            // Calculate distance change for zoom
            const distanceChange = Math.abs(currentDistance - lastPinchDistanceRef.current);
            
            // Calculate center movement for pan
            const deltaX = currentCenterX - lastPinchCenterRef.current.x;
            const deltaY = currentCenterY - lastPinchCenterRef.current.y;
            const panDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Determine if this is primarily a zoom or pan gesture
            // Make them mutually exclusive - zoom takes priority
            const isZoomGesture = distanceChange > 0.5; // Ultra sensitive for mobile
            const isPanGesture = !isZoomGesture && panDistance > 0.1; // Ultra sensitive for mobile
            
            setDebugInfo(`Dist:${distanceChange.toFixed(1)} Pan:${panDistance.toFixed(1)} Z:${isZoomGesture} P:${isPanGesture}`);
            
            if (isZoomGesture) {
              // Handle zoom with SMOOTH damping
              const rawScale = currentDistance / lastPinchDistanceRef.current;
              
              // Apply damping for smooth zoom
              const dampingFactor = 0.6; // Higher = more responsive zoom
              const dampedScale = 1 + (rawScale - 1) * dampingFactor;
              
              setDebugInfo(`ZOOM: ${dampedScale.toFixed(3)}x`);
              
              // Use functional update to ensure we're using the latest zoom value
              setZoomLevel(prev => {
                const calculatedZoom = Math.min(Math.max(prev * dampedScale, 0.1), 5);
                return calculatedZoom;
              });
              
              // Note: Removed zoom-toward-pinch-point to prevent canvas drift
              // Just zoom at center for stability
            } else if (isPanGesture) {
              setDebugInfo(`PAN: ${deltaX.toFixed(0)},${deltaY.toFixed(0)}`);
              // Only pan if NOT zooming and fingers moved significantly
              // Multiply by 1.5 for more responsive panning
              setPanOffset(prev => ({
                x: prev.x + deltaX * 1.5,
                y: prev.y + deltaY * 1.5
              }));
            }
          }
          
          // Update for next frame
          lastPinchDistanceRef.current = currentDistance;
          lastPinchCenterRef.current = { x: currentCenterX, y: currentCenterY };
        }
        // Single touch - let the drawing engine handle it
      };
      
      const handleTouchEnd = (e: TouchEvent) => {
        // If we were in pan mode, prevent any touch events from reaching drawing engine
        if (isPanningRef.current) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          // Keep drawing blocked for longer to prevent accidental strokes
          setBlockDrawing(true);
          setTimeout(() => setBlockDrawing(false), 600); // Increased to 600ms
          
          // Don't reset pan state immediately - wait for all fingers to lift
          if (e.touches.length === 0) {
            lastPinchDistanceRef.current = null;
            isPanningRef.current = false;
            setIsPanning(false);
          }
        } else if (e.touches.length < 2) {
          // Normal touch end when not panning
          lastPinchDistanceRef.current = null;
          setIsPanning(false);
        }
      };
      
      // Mouse pan support - only for middle mouse button or Ctrl+click
      const handleMouseDown = (e: MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+click
          e.preventDefault();
          e.stopPropagation();
          isPanningRef.current = true;
          setIsPanning(true); // For UI indicator
          lastPanPointRef.current = { x: e.clientX, y: e.clientY };
        }
        // Don't handle left mouse button without Ctrl - let drawing engine handle it
      };
      
      const handleMouseMove = (e: MouseEvent) => {
        if (isPanningRef.current && (e.buttons === 4 || e.ctrlKey)) { // Middle mouse or Ctrl held
          e.preventDefault();
          e.stopPropagation();
          const deltaX = e.clientX - lastPanPointRef.current.x;
          const deltaY = e.clientY - lastPanPointRef.current.y;
          
          setPanOffset(prev => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY
          }));
          
          lastPanPointRef.current = { x: e.clientX, y: e.clientY };
        }
      };
      
      const handleMouseUp = (e: MouseEvent) => {
        if (e.button === 1 || !e.ctrlKey) { // Middle mouse released or Ctrl released
          isPanningRef.current = false;
          setIsPanning(false); // For UI indicator
        }
      };
      
      // Add event listeners with capture phase to intercept before drawing engine
      canvas.addEventListener('wheel', handleWheel, { passive: false, capture: true });
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
      canvas.addEventListener('touchend', handleTouchEnd, { capture: true });
      canvas.addEventListener('mousedown', handleMouseDown, { capture: true });
      canvas.addEventListener('mousemove', handleMouseMove, { capture: true });
      canvas.addEventListener('mouseup', handleMouseUp, { capture: true });
      
      return () => {
        canvas.removeEventListener('wheel', handleWheel, { capture: true } as any);
        canvas.removeEventListener('touchstart', handleTouchStart, { capture: true } as any);
        canvas.removeEventListener('touchmove', handleTouchMove, { capture: true } as any);
        canvas.removeEventListener('touchend', handleTouchEnd, { capture: true } as any);
        canvas.removeEventListener('mousedown', handleMouseDown, { capture: true } as any);
        canvas.removeEventListener('mousemove', handleMouseMove, { capture: true } as any);
        canvas.removeEventListener('mouseup', handleMouseUp, { capture: true } as any);
        
        // Cleanup Paper.js engine
        if (drawingEngineRef.current) {
          drawingEngineRef.current.destroy();
        }
      };
    }
  }, [pageId, storyId, isCoverImage]); // Reload canvas when page changes

  const handleToolSelect = (tool: Tool) => {
    setActiveTool(tool);
    setShowBrushMenu(false);
    // Only pass supported tools to drawing engine
    if (drawingEngineRef.current && tool !== 'text') {
      drawingEngineRef.current.setTool(tool as any);
    }
  };

  const handleBrushSelect = (brushType: BrushType) => {
    setActiveBrush(brushType);
    setShowBrushMenu(false);
    if (drawingEngineRef.current) {
      drawingEngineRef.current.setBrushType(brushType);
    }
  };

  const handleUndo = () => {
    if (drawingEngineRef.current) {
      drawingEngineRef.current.undo();
      
      // Broadcast undo to collaborators
      if (isCollaborating && collaborationService.isConnected()) {
        // Note: Undo/redo sync can be complex and may cause conflicts
        // For now, we just notify - full implementation would need operation IDs
        console.log('🔄 Undo performed (not synced in collaboration mode)');
      }
    }
  };

  const handleRedo = () => {
    if (drawingEngineRef.current) {
      drawingEngineRef.current.redo();
      
      // Broadcast redo to collaborators
      if (isCollaborating && collaborationService.isConnected()) {
        console.log('🔄 Redo performed (not synced in collaboration mode)');
      }
    }
  };

  const handleClear = () => {
    if (drawingEngineRef.current) {
      drawingEngineRef.current.clearCanvas();
      
      // Broadcast clear to collaborators with page information
      if (isCollaborating && collaborationService.isConnected()) {
        // Send enhanced clear data for cross-page sync
        collaborationService.clearCanvas(
          isCoverImage ? 'cover_image' : (pageId || `page_${pageIndex}`),
          isCoverImage ? -1 : (pageIndex !== undefined ? pageIndex : 0),
          isCoverImage || false
        );
        console.log('📤 Clear canvas broadcasted to collaborators');
      }
    }
  };
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 5));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev * 0.8, 0.1));
  };
  
  const handleResetZoom = () => {
    const width = window.innerWidth;
    let defaultZoom = 1; // Default for desktop and tablet
    
    if (width < 768) {
      defaultZoom = 0.75; // Mobile phone only
    }
    
    setZoomLevel(defaultZoom);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleDone = () => {
    // Save canvas data before leaving
    if (drawingEngineRef.current && storyId) {
      const canvasData = drawingEngineRef.current.getCanvasData();
      const drawingState = drawingEngineRef.current.getDrawingState();
      
      if (isCoverImage) {
        // Save as cover image
        updateStory(storyId, { coverImage: canvasData });
        
        // Always save with full state for both collaboration and solo mode
        const COVER_OPERATIONS_KEY = '__cover_operations__';
        const existingData = getCanvasData(storyId, COVER_OPERATIONS_KEY);
        let existingOperations = [];
        
        if (typeof existingData === 'object' && existingData !== null) {
          existingOperations = existingData.operations || [];
        }
        
        // Save with operations preserved and full drawing state
        const updatedCanvasData = {
          canvasDataUrl: canvasData, // Final snapshot
          operations: existingOperations,
          drawingState: drawingState, // Full Paper.js state for restoration
          lastUpdate: Date.now()
        };
        
        saveCanvasData(storyId, COVER_OPERATIONS_KEY, updatedCanvasData);
        console.log('💾 Saved COVER IMAGE with', existingOperations.length, 'operations and full state');
      } else if (pageId) {
        // Always save with full state for both collaboration and solo mode
        const existingData = getCanvasData(storyId, pageId);
        let existingOperations = [];
        
        if (typeof existingData === 'object' && existingData !== null) {
          existingOperations = existingData.operations || [];
        }
        
        // Save with operations preserved and full drawing state
        const updatedCanvasData = {
          canvasDataUrl: canvasData, // Final snapshot
          operations: existingOperations,
          drawingState: drawingState, // Full Paper.js state for restoration
          lastUpdate: Date.now()
        };
        
        saveCanvasData(storyId, pageId, updatedCanvasData);
        console.log('💾 Saved canvas with', existingOperations.length, 'operations and full state');
      }
      
      // Mark story as draft since canvas was modified
      markAsDraft(storyId);
    }
    
    // Navigate back to story creation with page index and collaboration info
    if (storyId) {
      navigate('/create-story-manual', { 
        state: { 
          storyId, 
          returnToPageIndex: pageIndex,
          // Pass back collaboration info
          sessionId: isCollaborating ? currentSessionId : undefined,
          isCollaborative: isCollaborating,
          isHost: isHost
        } 
      });
    } else {
      navigate('/create-story-manual');
    }
  };

  const handleClose = () => {
    // Save canvas data before leaving
    if (drawingEngineRef.current && storyId) {
      const canvasData = drawingEngineRef.current.getCanvasData();
      const drawingState = drawingEngineRef.current.getDrawingState();
      
      if (isCoverImage) {
        // Save as cover image
        updateStory(storyId, { coverImage: canvasData });
        
        // Always save with full state for both collaboration and solo mode
        const COVER_OPERATIONS_KEY = '__cover_operations__';
        const existingData = getCanvasData(storyId, COVER_OPERATIONS_KEY);
        let existingOperations = [];
        
        if (typeof existingData === 'object' && existingData !== null) {
          existingOperations = existingData.operations || [];
        }
        
        // Save with operations preserved and full drawing state
        const updatedCanvasData = {
          canvasDataUrl: canvasData, // Final snapshot
          operations: existingOperations,
          drawingState: drawingState, // Full Paper.js state for restoration
          lastUpdate: Date.now()
        };
        
        saveCanvasData(storyId, COVER_OPERATIONS_KEY, updatedCanvasData);
        console.log('💾 Saved COVER IMAGE with', existingOperations.length, 'operations and full state');
      } else if (pageId) {
        // Always save with full state for both collaboration and solo mode
        const existingData = getCanvasData(storyId, pageId);
        let existingOperations = [];
        
        if (typeof existingData === 'object' && existingData !== null) {
          existingOperations = existingData.operations || [];
        }
        
        // Save with operations preserved and full drawing state
        const updatedCanvasData = {
          canvasDataUrl: canvasData, // Final snapshot
          operations: existingOperations,
          drawingState: drawingState, // Full Paper.js state for restoration
          lastUpdate: Date.now()
        };
        
        saveCanvasData(storyId, pageId, updatedCanvasData);
        console.log('💾 Saved canvas with', existingOperations.length, 'operations and full state');
      }
      
      // Mark story as draft since canvas was modified
      markAsDraft(storyId);
    }
    
    // Navigate back to story creation with page index and collaboration info
    if (storyId) {
      navigate('/create-story-manual', { 
        state: { 
          storyId, 
          returnToPageIndex: pageIndex,
          // Pass back collaboration info
          sessionId: isCollaborating ? currentSessionId : undefined,
          isCollaborative: isCollaborating,
          isHost: isHost
        } 
      });
    } else {
      navigate('/create-story-manual');
    }
  };

  const handleImportCharacter = (character: Character) => {
    // TODO: Import character to canvas
    console.log('Importing character:', character.name);
    setShowCharacterModal(false);
  };

  const handleDeleteCharacter = (characterId: string) => {
    // TODO: Delete character from library
    console.log('Deleting character:', characterId);
  };

  const brushTypes: { type: BrushType; label: string }[] = [
    { type: 'soft', label: 'Soft' },
    { type: 'round', label: 'Round' },
    { type: 'pencil', label: 'Pencil' },
    { type: 'marker', label: 'Marker' },
    { type: 'airbrush', label: 'Airbrush' }
  ];

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setGradientActive(false); // Disable gradient when selecting solid color
    // Add to recent colors if not already there
    if (!recentColors.includes(color)) {
      const newRecentColors = [color, ...recentColors.slice(0, 5)];
      setRecentColors(newRecentColors);
    }
    setShowColorPicker(false);
    
    if (drawingEngineRef.current) {
      drawingEngineRef.current.setColor(color);
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    if (drawingEngineRef.current) {
      drawingEngineRef.current.setColor(color);
    }
    // Don't close modal, don't add to recent colors yet
  };

  const predefinedColors = [
    '#000000', '#FFFFFF', '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
    '#F43F5E', '#6B7280', '#9CA3AF', '#D1D5DB'
  ];

  const shapeTypes: { type: ShapeType; label: string }[] = [
    { type: 'rectangle', label: 'Rectangle' },
    { type: 'circle', label: 'Circle' },
    { type: 'line', label: 'Line' },
    { type: 'triangle', label: 'Triangle' },
    { type: 'star', label: 'Star' },
    { type: 'heart', label: 'Heart' },
    { type: 'arrow', label: 'Arrow' }
  ];

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showToolSubmenu && !target.closest('.canvas-studio-submenu') && !target.closest('.canvas-studio-tool-btn')) {
        setShowToolSubmenu(false);
      }
    };

    if (showToolSubmenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showToolSubmenu]);

  // Maintain WebSocket connection in collaboration mode
  useEffect(() => {
    const wsState = collaborationService.ws?.readyState;
    console.log('🔍 Checking WebSocket connection:', {
      isCollaborating,
      currentSessionId,
      serviceSessionId: collaborationService.sessionId,
      isConnected: collaborationService.isConnected(),
      wsExists: !!collaborationService.ws,
      wsReadyState: wsState,
      wsStateName: wsState !== undefined ? ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][wsState] : 'N/A'
    });

    // If WebSocket is already OPEN and connected to the same session, don't reconnect
    if (collaborationService.isConnected() && collaborationService.sessionId === currentSessionId) {
      console.log('✅ Canvas: WebSocket already connected to this session, reusing connection');
      return;
    }
    
    // If connected to a different session, we need to reconnect
    if (collaborationService.isConnected() && collaborationService.sessionId !== currentSessionId) {
      console.log('⚠️ Connected to different session, disconnecting first');
      collaborationService.disconnect();
    }
    
    // Sync session ID if service has one but we don't
    if (collaborationService.sessionId && !currentSessionId && collaborationService.isConnected()) {
      console.log('🔧 Syncing session ID from service');
      setCurrentSessionId(collaborationService.sessionId);
      setIsCollaborating(true);
      return;
    }

    // Only connect if we have session info and not already connected
    if (isCollaborating && currentSessionId) {
      console.log('🎨 Canvas: Connecting to collaboration session:', currentSessionId, 'length:', currentSessionId?.length);
      collaborationService.connect(currentSessionId)
        .then(() => {
          console.log('✅ Canvas: Connected to collaboration session');
          console.log('WebSocket state after connect:', {
            readyState: collaborationService.ws?.readyState,
            isConnected: collaborationService.isConnected()
          });
          setIsCollaborating(true);
        })
        .catch((error) => {
          console.error('❌ Canvas: Failed to connect to collaboration:', error);
          console.error('Error details:', {
            message: error.message,
            stack: error.stack
          });
        });
    }
  }, [isCollaborating, currentSessionId]);

  // Update collaboration enhancer when collaboration state changes
  useEffect(() => {
    if (collaborationEnhancerRef.current) {
      collaborationEnhancerRef.current.setCollaborating(isCollaborating);
      collaborationEnhancerRef.current.updateContext(pageId, pageIndex, isCoverImage);
      console.log('🔄 Updated collaboration enhancer state:', { isCollaborating, pageId, pageIndex, isCoverImage });
    }
  }, [isCollaborating, pageId, pageIndex, isCoverImage]);

  // Collaboration event handlers
  useEffect(() => {
    // Handle remote drawing - supports all tools with page isolation
    const handleRemoteDraw = (message: any) => {
      console.log('📥 Received remote draw message:', {
        hasData: !!message.data,
        tool: message.data?.tool,
        type: message.data?.type,
        messageKeys: Object.keys(message),
        dataKeys: message.data ? Object.keys(message.data) : 'no data'
      });
      
      // Handle fill tool separately via CollaborationEnhancer
      if (message.data && message.data.tool === 'fill') {
        console.log('🎨 Detected fill tool message, routing to CollaborationEnhancer:', message.data);
        if (collaborationEnhancerRef.current) {
          collaborationEnhancerRef.current.applyRemoteFill(message.data);
        } else {
          console.error('❌ CollaborationEnhancer not initialized!');
        }
        return;
      }
      
      // Handle transform operations via CollaborationEnhancer
      if (message.data && message.data.type === 'transform') {
        console.log('🔄 Detected transform message, routing to CollaborationEnhancer:', message.data);
        if (collaborationEnhancerRef.current) {
          collaborationEnhancerRef.current.applyRemoteTransform(message.data);
        } else {
          console.error('❌ CollaborationEnhancer not initialized!');
        }
        return;
      }
      
      if (!drawingEngineRef.current || !message.data) return;
      
      // DRAWING ISOLATION: Only apply drawings from the exact same canvas
      const messageCoverImage = message.is_cover_image || message.page_id === 'cover_image';
      const currentCoverImage = isCoverImage || false;
      
      let shouldApplyDrawing = false;
      
      if (messageCoverImage && currentCoverImage) {
        // Both are cover image - apply drawing
        shouldApplyDrawing = true;
      } else if (!messageCoverImage && !currentCoverImage) {
        // Both are page canvases - only apply if EXACT same page
        // First priority: exact page ID match
        if (pageId && message.page_id === pageId) {
          shouldApplyDrawing = true;
        }
        // Second priority: both have same pageIndex (fallback for sync issues)
        else if (pageIndex !== undefined && message.page_index === pageIndex) {
          shouldApplyDrawing = true;
          console.log('🔄 Drawing applied based on pageIndex match (pageId mismatch during sync)');
        }
        // Third priority: handle generated page IDs from previous implementation
        else if (pageIndex !== undefined && message.page_id === `page_${pageIndex}`) {
          shouldApplyDrawing = true;
          console.log('🔄 Drawing applied based on generated pageId pattern match');
        }
      }
      // If one is cover and one is page, shouldApplyDrawing stays false
      
      console.log('🎨 Drawing operation filtering:', {
        messagePageId: message.page_id,
        messageCoverImage,
        currentPageId: pageId,
        currentCoverImage,
        shouldApply: shouldApplyDrawing
      });
      
      if (shouldApplyDrawing) {
        console.log('✅ Applying remote drawing from same canvas:', message.data);
        drawingEngineRef.current.applyRemoteDrawing(message.data);
      } else {
        console.log('❌ Ignoring drawing from different canvas');
      }
    };

    // Handle remote cursor movement with canvas filtering
    const handleRemoteCursor = (message: any) => {
      if (message.user_id && message.position) {
        // CURSOR ISOLATION: Only show cursors from the same canvas type
        const messageCoverImage = message.is_cover_image || message.page_id === 'cover_image';
        const currentCoverImage = isCoverImage || false;
        
        // For page canvas: only show cursors from the exact same page
        // For cover canvas: only show cursors from cover canvas
        let shouldShowCursor = false;
        
        if (messageCoverImage && currentCoverImage) {
          // Both are cover image - show cursor
          shouldShowCursor = true;
        } else if (!messageCoverImage && !currentCoverImage) {
          // Both are page canvases - only show if EXACT same page
          // First priority: exact page ID match
          if (pageId && message.page_id === pageId) {
            shouldShowCursor = true;
          }
          // Second priority: both have same pageIndex (fallback for sync issues)
          else if (pageIndex !== undefined && message.page_index === pageIndex) {
            shouldShowCursor = true;
          }
          // Third priority: handle generated page IDs from previous implementation
          else if (pageIndex !== undefined && message.page_id === `page_${pageIndex}`) {
            shouldShowCursor = true;
          }
        }
        // If one is cover and one is page, shouldShowCursor stays false
        
        console.log('🖱️ Cursor update filtering:', {
          messagePageId: message.page_id,
          messageCoverImage,
          currentPageId: pageId,
          currentCoverImage,
          shouldShow: shouldShowCursor
        });
        
        if (shouldShowCursor) {
          setRemoteCursors(prev => {
            const updated = new Map(prev);
            // Get color from: message > userColorsRef > existing map > default red
            const userColor = message.cursor_color || 
                            userColorsRef.current.get(message.user_id) || 
                            prev.get(message.user_id)?.color || 
                            '#FF0000';
            
            updated.set(message.user_id, {
              user_id: message.user_id,
              username: message.username || 'Unknown',
              color: userColor,
              x: message.position.x,
              y: message.position.y
            });
            return updated;
          });
        } else {
          // Remove cursor if it's from a different canvas
          setRemoteCursors(prev => {
            const updated = new Map(prev);
            updated.delete(message.user_id);
            return updated;
          });
        }
      }
    };

    // Handle user joined
    const handleUserJoined = (message: any) => {
      if (message.user_id && message.cursor_color) {
        // Store color in ref for persistence
        userColorsRef.current.set(message.user_id, message.cursor_color);
        console.log('🎨 Stored user color:', { user_id: message.user_id, color: message.cursor_color });
        
        setRemoteCursors(prev => {
          const updated = new Map(prev);
          const existing = updated.get(message.user_id);
          updated.set(message.user_id, {
            user_id: message.user_id,
            username: message.username || 'Unknown',
            color: message.cursor_color,
            x: existing?.x || 0,
            y: existing?.y || 0
          });
          return updated;
        });
        
        // Note: Toast notifications are handled by ManualStoryCreationPage to avoid duplicates
      }
    };

    // Handle user left
    const handleUserLeft = (message: any) => {
      if (message.user_id) {
        setRemoteCursors(prev => {
          const updated = new Map(prev);
          updated.delete(message.user_id);
          return updated;
        });
        
        // Note: Toast notifications are handled by ManualStoryCreationPage to avoid duplicates
      }
    };

    // Handle canvas clear with page isolation
    const handleClear = (message: any) => {
      if (!drawingEngineRef.current) return;
      
      // CLEAR ISOLATION: Only apply clears from the exact same canvas
      const messageCoverImage = message.is_cover_image || message.page_id === 'cover_image';
      const currentCoverImage = isCoverImage || false;
      
      let shouldApplyClear = false;
      
      if (messageCoverImage && currentCoverImage) {
        // Both are cover image - apply clear
        shouldApplyClear = true;
      } else if (!messageCoverImage && !currentCoverImage) {
        // Both are page canvases - only apply if EXACT same page
        // First priority: exact page ID match
        if (pageId && message.page_id === pageId) {
          shouldApplyClear = true;
        }
        // Second priority: both have same pageIndex (fallback for sync issues)
        else if (pageIndex !== undefined && message.page_index === pageIndex) {
          shouldApplyClear = true;
        }
        // Third priority: handle generated page IDs from previous implementation
        else if (pageIndex !== undefined && message.page_id === `page_${pageIndex}`) {
          shouldApplyClear = true;
        }
      }
      // If one is cover and one is page, shouldApplyClear stays false
      
      console.log('🧽 Clear operation filtering:', {
        messagePageId: message.page_id,
        messageCoverImage,
        currentPageId: pageId,
        currentCoverImage,
        shouldApply: shouldApplyClear
      });
      
      if (shouldApplyClear) {
        console.log('✅ Applying remote clear from same canvas');
        drawingEngineRef.current.applyRemoteClear();
      } else {
        console.log('❌ Ignoring clear from different canvas');
      }
    };

    // CROSS-PAGE COLLABORATION: Handle text/title changes from story creation page
    const handleRemoteTextEdit = (message: any) => {
      if (message.type !== 'text_edit') return;
      console.log('📝 Text edit received from story creation page:', message);
      // For now, just log - we could show a notification or update a preview
      console.log('✍️ Page text updated by collaborator');
    };

    const handleRemoteTitleEdit = (message: any) => {
      if (message.type !== 'title_edit') return;
      console.log('📰 Title edit received from story creation page:', message.title);
      // Show a brief notification that title was changed
      console.log('🏷️ Story title updated by collaborator to:', message.title);
    };

    const handleRemotePageAdd = (message: any) => {
      if (message.type !== 'page_added') return;
      console.log('➕ Page added from story creation page by:', message.username);
      // Could show a notification about new page
    };

    const handleRemotePageDelete = (message: any) => {
      if (message.type !== 'page_deleted') return;
      console.log('🗑️ Page deleted from story creation page by:', message.username);
      // Could show a notification about deleted page
    };

    // Handle remote transform operations
    const handleTransform = (message: any) => {
      if (!drawingEngineRef.current || !message.data) return;
      
      console.log('🎨 Canvas: Received remote transform:', message.data);
      drawingEngineRef.current.applyRemoteTransform(message.data);
    };

    // Handle remote delete operations
    const handleDelete = (message: any) => {
      if (!drawingEngineRef.current || !message.data) return;
      
      console.log('🎨 Canvas: Received remote delete:', message.data);
      // Delete operation could be implemented if needed
    };

    collaborationService.on('draw', handleRemoteDraw);
    collaborationService.on('drawing_update', handleRemoteDraw);
    collaborationService.on('cursor', handleRemoteCursor);
    collaborationService.on('cursor_update', handleRemoteCursor);
    collaborationService.on('user_joined', handleUserJoined);
    collaborationService.on('user_left', handleUserLeft);
    collaborationService.on('clear', handleClear);
    collaborationService.on('canvas_cleared', handleClear);
    collaborationService.on('transform', handleTransform);
    collaborationService.on('object_transformed', handleTransform);
    collaborationService.on('delete', handleDelete);
    collaborationService.on('object_deleted', handleDelete);
    // Cross-page collaboration handlers
    collaborationService.on('text_edit', handleRemoteTextEdit);
    collaborationService.on('title_edit', handleRemoteTitleEdit);
    collaborationService.on('page_added', handleRemotePageAdd);
    collaborationService.on('page_deleted', handleRemotePageDelete);
    
    // Advanced collaboration handlers for text, layers, and transforms
    collaborationService.on('text_edit_advanced', (message: any) => {
      if (collaborationEnhancerRef.current && message.user_id !== getCurrentUserId()) {
        console.log('📨 Received remote text edit:', message);
        collaborationEnhancerRef.current.applyRemoteTextEdit(message.data);
      }
    });
    
    collaborationService.on('layer_operation', (message: any) => {
      if (collaborationEnhancerRef.current && message.user_id !== getCurrentUserId()) {
        console.log('📨 Received remote layer operation:', message);
        collaborationEnhancerRef.current.applyRemoteLayerOperation(message.operation, message.data);
        // Update local layers list after remote operation
        setTimeout(() => updateLayersList(), 100);
      }
    });
    
    collaborationService.on('transform_operation', (message: any) => {
      if (collaborationEnhancerRef.current && message.user_id !== getCurrentUserId()) {
        console.log('📥 Received remote transform:', message);
        collaborationEnhancerRef.current.applyRemoteTransform(message.data);
      }
    });
    
    collaborationService.on('delete_item', (message: any) => {
      if (collaborationEnhancerRef.current && message.user_id !== getCurrentUserId()) {
        console.log('📥 Received remote delete:', message);
        collaborationEnhancerRef.current.applyRemoteDelete(message.data);
      }
    });

    // Canvas sync handlers for reconnection
    collaborationService.on('request_canvas_state', (message: any) => {
      console.log('📥 Received request for canvas state from user:', message.requesting_user_id);
      console.log('🔍 My DrawingEngine exists?', !!drawingEngineRef.current);
      
      // Send our current canvas state to the requesting user
      if (!drawingEngineRef.current) {
        console.error('❌ Cannot send canvas state - DrawingEngine not available!');
        return;
      }
      
      try {
        const canvasData = drawingEngineRef.current.getDrawingState();
        console.log('📤 Sending canvas state:', canvasData);
        console.log('📤 Canvas data has items?', canvasData && canvasData.projectData ? 'yes' : 'no');
        
        collaborationService.sendCanvasState(
          canvasData,
          message.requesting_user_id,
          pageId?.toString() || undefined,
          pageIndex,
          isCoverImage
        );
        console.log('✅ Canvas state sent successfully');
      } catch (error) {
        console.error('❌ Error getting/sending canvas state:', error);
      }
    });

    collaborationService.on('canvas_state', (message: any) => {
      console.log('📥 Received canvas state from user:', message.sender_user_id);
      console.log('📦 Canvas data received:', message.canvas_data);
      console.log('🔍 DrawingEngine exists?', !!drawingEngineRef.current);
      
      // Apply the received canvas state
      if (!drawingEngineRef.current) {
        console.error('❌ DrawingEngine not available!');
        return;
      }
      
      if (!message.canvas_data) {
        console.error('❌ No canvas data received!');
        return;
      }
      
      console.log('🔄 Loading canvas state...');
      try {
        drawingEngineRef.current.loadDrawingState(message.canvas_data);
        console.log('✅ Canvas state restored successfully');
      } catch (error) {
        console.error('❌ Error loading canvas state:', error);
      }
    });

    // Voting handlers
    const handleVoteInitiated = async (message: any) => {
      console.log('🗳️ Canvas: Vote initiated', message);
      
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
        console.log('🚀 Canvas: Vote initiator auto-voting YES');
        setTimeout(() => {
          handleVote(true);
        }, 500);
      }
    };

    const handleVoteUpdate = (message: any) => {
      console.log('🗳️ Canvas: Vote update', message);
      
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
      
      console.log('🗳️ Canvas: Vote result received:', {
        approved: message.approved,
        voteInitiatorId,
        currentUserId,
        isCurrentUserInitiator,
        initiatorName: votingData?.initiated_by_username
      });
      
      setShowVotingModal(false);
      
      if (message.approved) {
        if (isCurrentUserInitiator) {
          // Vote initiator: Save canvas and navigate back
          console.log('✅ Canvas: Vote initiator - saving canvas and navigating back');
          showInfoToast('Vote passed! Saving canvas...');
          
          if (storyId && drawingEngineRef.current) {
            const canvasData = drawingEngineRef.current.getCanvasData();
            
            if (isCoverImage) {
              updateStory(storyId, { coverImage: canvasData });
            } else if (pageId) {
              const canvasStateData = {
                canvasDataUrl: canvasData,
                operations: [],
                lastUpdate: Date.now()
              };
              saveCanvasData(storyId, pageId, canvasStateData);
            }
            
            markAsDraft(storyId);
          }
          
          // Navigate back to story creation
          setTimeout(() => {
            navigate('/create-story-manual', { 
              state: { 
                storyId, 
                returnToPageIndex: pageIndex,
                sessionId: currentSessionId,
                isCollaborative: true,
                isHost: true
              } 
            });
          }, 2000);
        } else {
          // Other participants: Show saving overlay
          const initiatorName = votingData?.initiated_by_username || 'Host';
          console.log('⏳ Canvas: Other participant - showing saving overlay');
          showInfoToast(`Vote passed! ${initiatorName} is saving the canvas...`);
          setShowSavingOverlay(true);
          
          // Wait for completion then navigate
          setTimeout(() => {
            setShowSavingOverlay(false);
            navigate('/create-story-manual', { 
              state: { 
                storyId, 
                returnToPageIndex: pageIndex,
                sessionId: currentSessionId,
                isCollaborative: true,
                isHost: false
              } 
            });
          }, 3000);
        }
      } else {
        showInfoToast('Vote did not pass. Continuing with canvas editing...');
        setShowSavingOverlay(false);
      }
      
      setVotingData(null);
      voteInitiatorRef.current = null;
    };

    // Set up voting event handlers
    if (isCollaborating) {
      collaborationService.on('vote_initiated', handleVoteInitiated);
      collaborationService.on('vote_update', handleVoteUpdate);
      collaborationService.on('vote_result', handleVoteResult);
    }

    return () => {
      if (isCollaborating) {
        collaborationService.off('vote_initiated', handleVoteInitiated);
        collaborationService.off('vote_update', handleVoteUpdate);
        collaborationService.off('vote_result', handleVoteResult);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCollaborating]);

  // Helper function to get current user ID
  const getCurrentUserId = (): number | null => {
    const userStr = localStorage.getItem('user_data') || localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id;
      } catch (e) {
        console.error('Failed to parse user:', e);
        return null;
      }
    }
    return null;
  };

  // Shape selection handler
  const handleShapeSelect = (shape: ShapeType) => {
    setActiveShape(shape);
    setActiveTool('shapes');
    setShowToolSubmenu(false);
    if (drawingEngineRef.current) {
      drawingEngineRef.current.setTool(shape as any);
    }
  };

  // Clear canvas handlers
  const handleClearCanvas = () => {
    setShowClearConfirmModal(true);
  };

  const handleConfirmClear = () => {
    if (drawingEngineRef.current) {
      drawingEngineRef.current.clearCanvas();
    }
    setShowClearConfirmModal(false);
  };

  const handleCancelClear = () => {
    setShowClearConfirmModal(false);
  };

  // Text tool handlers
  const handleAddText = () => {
    if (drawingEngineRef.current && textInput.trim()) {
      // Set the text color in the drawing engine
      drawingEngineRef.current.setColor(textColor);
      
      // Add text to canvas (the drawing engine will handle collaboration internally)
      drawingEngineRef.current.addText({
        text: textInput,
        fontSize,
        fontFamily,
        fontWeight,
        textAlign
      }, textPosition || undefined);
      
      // Reset and close
      setTextInput('');
      setShowTextModal(false);
      setTextPosition(null);
      setActiveTool('select'); // Switch back to select tool
    }
  };

  const handleCancelText = () => {
    setTextInput('');
    setShowTextModal(false);
    setTextPosition(null);
    setActiveTool('select'); // Switch back to select tool
  };

  // Collaboration handlers
  const handleSessionCreated = (sessionId: string) => {
    console.log('Collaboration session created:', sessionId);
    setIsCollaborating(true);
    // Note: reconnection handler is already set up in mount useEffect
  };

  const handleSessionJoined = (sessionId: string) => {
    console.log('Joined collaboration session:', sessionId);
    setIsCollaborating(true);
    // Note: reconnection handler is already set up in mount useEffect
  };

  const handleSessionEnded = () => {
    console.log('Collaboration session ended');
    setIsCollaborating(false);
    setRemoteCursors(new Map());
    setIsReconnecting(false);
    setReconnectAttempt(0);
  };

  const handleCancelReconnect = () => {
    collaborationService.disconnect();
    handleSessionEnded();
  };

  const handleRetryReconnect = () => {
    console.log('User triggered manual retry');
    collaborationService.retryConnection();
  };

  // Voting function
  const handleVote = async (agree: boolean) => {
    console.log('🗳️ Canvas: Sending vote:', agree);
    try {
      if (!votingData?.vote_id) {
        console.error('❌ Canvas: No vote ID available');
        showInfoToast('Cannot vote - no vote ID available');
        return;
      }

      if (collaborationService.isConnected()) {
        await collaborationService.voteToSave(votingData.vote_id, agree);
        console.log('✅ Canvas: Vote sent successfully');
      } else {
        console.error('❌ Canvas: Cannot vote - not connected');
        showInfoToast('Cannot vote - not connected to collaboration session');
      }
    } catch (error) {
      console.error('❌ Canvas: Failed to send vote:', error);
      showInfoToast('Failed to send vote');
    }
  };

  // Tool selection with submenu support
  // Layer management functions
  const updateLayersList = () => {
    if (drawingEngineRef.current) {
      const layersList = drawingEngineRef.current.getLayers();
      
      // Always update thumbnail cache with latest thumbnails
      layersList.forEach(layer => {
        if (layer.thumbnail) {
          thumbnailCacheRef.current.set(layer.id, layer.thumbnail);
        }
      });
      
      setLayers(layersList);
      
      const activeLayer = drawingEngineRef.current.getActiveLayer();
      setActiveLayerId(activeLayer?.id || null);
    }
  };
  
  // Debounced opacity change for smooth slider
  const handleLayerOpacityChangeDebounced = (layerId: string, opacity: number) => {
    // Update UI immediately for smooth slider
    setLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === layerId ? { ...layer, opacity } : layer
      )
    );
    
    // Debounce the actual engine update
    if (opacityTimeoutRef.current) {
      clearTimeout(opacityTimeoutRef.current);
    }
    
    opacityTimeoutRef.current = window.setTimeout(() => {
      if (drawingEngineRef.current) {
        drawingEngineRef.current.setLayerOpacity(layerId, opacity);
      }
    }, 50); // 50ms debounce for smooth dragging
  };

  const handleCreateLayer = () => {
    if (drawingEngineRef.current) {
      // Create layer (the drawing engine will handle collaboration internally)
      const newLayerId = drawingEngineRef.current.createLayer();
      updateLayersList();
    }
  };

  const handleDeleteLayer = (layerId: string) => {
    if (drawingEngineRef.current) {
      // Delete layer (the drawing engine will handle collaboration internally)
      const success = drawingEngineRef.current.deleteLayer(layerId);
      if (success) {
        updateLayersList();
      }
    }
  };

  const handleSelectLayer = (layerId: string) => {
    if (drawingEngineRef.current) {
      const success = drawingEngineRef.current.setActiveLayer(layerId);
      if (success) {
        updateLayersList();
      }
    }
  };

  const handleToggleLayerVisibility = (layerId: string) => {
    if (drawingEngineRef.current) {
      // Toggle visibility (the drawing engine will handle collaboration internally)
      drawingEngineRef.current.toggleLayerVisibility(layerId);
      updateLayersList();
    }
  };

  const handleToggleLayerLock = (layerId: string) => {
    if (drawingEngineRef.current) {
      // Toggle lock (the drawing engine will handle collaboration internally)
      drawingEngineRef.current.toggleLayerLock(layerId);
      updateLayersList();
    }
  };

  const handleLayerOpacityChange = (layerId: string, opacity: number) => {
    handleLayerOpacityChangeDebounced(layerId, opacity);
  };

  const handleDuplicateLayer = (layerId: string) => {
    if (drawingEngineRef.current) {
      const newLayerId = drawingEngineRef.current.duplicateLayer(layerId);
      if (newLayerId) {
        updateLayersList();
      }
    }
  };

  const handleMergeLayerDown = (layerId: string) => {
    if (drawingEngineRef.current) {
      const success = drawingEngineRef.current.mergeLayerDown(layerId);
      if (success) {
        updateLayersList();
      }
    }
  };

  const handleStartRenameLayer = (layerId: string, currentName: string) => {
    setEditingLayerId(layerId);
    setEditingLayerName(currentName);
  };

  const handleAddLayer = () => {
    if (drawingEngineRef.current) {
      const newLayerId = drawingEngineRef.current.createLayer();
      if (newLayerId) {
        updateLayersList();
      }
    }
  };

  const handleFinishRenameLayer = () => {
    if (editingLayerId && drawingEngineRef.current && editingLayerName.trim()) {
      drawingEngineRef.current.renameLayer(editingLayerId, editingLayerName.trim());
      updateLayersList();
    }
    setEditingLayerId(null);
    setEditingLayerName('');
  };

  const handleMoveLayerUp = (layerId: string) => {
    if (drawingEngineRef.current) {
      const currentIndex = layers.findIndex(l => l.id === layerId);
      if (currentIndex > 0) {
        // Layers are displayed in reverse order, so moving up means lower index
        drawingEngineRef.current.moveLayer(layerId, layers.length - currentIndex);
        updateLayersList();
      }
    }
  };

  const handleMoveLayerDown = (layerId: string) => {
    if (drawingEngineRef.current) {
      const currentIndex = layers.findIndex(l => l.id === layerId);
      if (currentIndex < layers.length - 1) {
        // Layers are displayed in reverse order, so moving down means higher index
        drawingEngineRef.current.moveLayer(layerId, layers.length - currentIndex - 2);
        updateLayersList();
      }
    }
  };
  
  // Drag and drop handlers for mobile-friendly reordering
  const handleLayerDragStart = (e: React.DragEvent | React.TouchEvent, layerId: string) => {
    setDraggingLayerId(layerId);
    
    // For touch events
    if ('touches' in e) {
      e.currentTarget.classList.add('dragging');
    }
  };
  
  const handleLayerDragOver = (e: React.DragEvent, layerId: string) => {
    e.preventDefault();
    if (draggingLayerId && draggingLayerId !== layerId) {
      setDragOverLayerId(layerId);
    }
  };
  
  const handleLayerDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    
    if (draggingLayerId && draggingLayerId !== targetLayerId && drawingEngineRef.current) {
      const dragIndex = layers.findIndex(l => l.id === draggingLayerId);
      const targetIndex = layers.findIndex(l => l.id === targetLayerId);
      
      if (dragIndex !== -1 && targetIndex !== -1) {
        // Convert display index to Paper.js layer index (reversed)
        const paperTargetIndex = layers.length - targetIndex - 1;
        drawingEngineRef.current.moveLayer(draggingLayerId, paperTargetIndex);
        updateLayersList();
      }
    }
    
    setDraggingLayerId(null);
    setDragOverLayerId(null);
  };
  
  const handleLayerDragEnd = () => {
    setDraggingLayerId(null);
    setDragOverLayerId(null);
  };

  // Helper function to render brush icon based on type
  const renderBrushIcon = (brushType: BrushType, className: string = 'canvas-studio-tool-icon') => {
    switch (brushType) {
      case 'soft':
        return <div className={`canvas-brush-soft-icon ${className}`} />;
      case 'round':
        return <PaintBrushIcon className={className} />;
      case 'pencil':
        return <PencilIcon className={className} />;
      case 'marker':
        return <div className={`canvas-brush-marker-icon ${className}`} />;
      case 'airbrush':
        return <div className={`canvas-brush-airbrush-icon ${className}`} />;
      default:
        return <PaintBrushIcon className={className} />;
    }
  };

  // Helper function to render shape icon based on type
  const renderShapeIcon = (shapeType: ShapeType, className: string = 'canvas-studio-tool-icon') => {
    switch (shapeType) {
      case 'rectangle':
        return <div className={`canvas-square-icon ${className}`} />;
      case 'circle':
        return <div className={`canvas-circle-icon ${className}`} />;
      case 'line':
        return <div className={`canvas-line-icon ${className}`} />;
      case 'triangle':
        return <div className={`canvas-triangle-icon ${className}`} />;
      case 'star':
        return <span className={`canvas-shape-emoji-icon ${className}`}>★</span>;
      case 'heart':
        return <span className={`canvas-shape-emoji-icon ${className}`}>♥</span>;
      case 'arrow':
        return <span className={`canvas-shape-emoji-icon ${className}`}>→</span>;
      default:
        return <div className={`canvas-square-icon ${className}`} />;
    }
  };

  const handleToolClick = (tool: Tool, event?: React.MouseEvent<HTMLButtonElement>) => {
    const toolsWithSubmenu: Tool[] = ['brush', 'shapes']; // Removed 'eraser' - no submenu needed
    
    // Always set the tool as active
    setActiveTool(tool);
    
    if (toolsWithSubmenu.includes(tool)) {
      // Toggle submenu if clicking the same tool
      if (showToolSubmenu && submenuTool === tool) {
        setShowToolSubmenu(false);
      } else {
        // Calculate submenu position based on button position
        if (event && !isMobile) {
          const buttonRect = event.currentTarget.getBoundingClientRect();
          setSubmenuPosition({
            top: buttonRect.top,
            left: buttonRect.right + 12 // 12px gap from button to prevent overlap
          });
        }
        
        // Show submenu but also activate the tool
        setSubmenuTool(tool);
        setShowToolSubmenu(true);
      }
      // Activate the tool immediately with current settings
      if (tool === 'shapes' && drawingEngineRef.current) {
        drawingEngineRef.current.setTool(activeShape as any);
      } else if (drawingEngineRef.current && tool !== 'text') {
        drawingEngineRef.current.setTool(tool as any);
      }
    } else {
      setShowToolSubmenu(false);
      // Only pass supported tools to drawing engine
      if (drawingEngineRef.current && tool !== 'text') {
        drawingEngineRef.current.setTool(tool as any);
      }
    }
  };

  return (
    <>
      {/* Reconnecting Modal */}
      <ReconnectingModal
        isReconnecting={isReconnecting}
        reconnectAttempt={reconnectAttempt}
        maxAttempts={5}
        onCancel={handleCancelReconnect}
        onRetry={handleRetryReconnect}
      />

      {/* Collaboration Panel removed - now controlled from ManualStoryCreationPage */}

      {/* Remote Cursors */}
      {Array.from(remoteCursors.values()).map(cursor => {
        // Convert canvas coordinates to screen coordinates
        // Canvas coords are always 0-500, but screen size varies based on device/zoom
        if (!canvasRef.current) return null;
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // Calculate scale from canvas pixels (500x500) to screen pixels
        const scaleX = rect.width / canvas.width;   // canvas.width = 500
        const scaleY = rect.height / canvas.height; // canvas.height = 500
        
        // Convert canvas coordinates to screen coordinates
        const screenX = rect.left + (cursor.x * scaleX);
        const screenY = rect.top + (cursor.y * scaleY);
        
        // Helper function to determine if color is light or dark for text contrast
        const getContrastColor = (hexColor: string) => {
          // Remove # if present
          const hex = hexColor.replace('#', '');
          // Convert to RGB
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          // Calculate luminance
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          // Return black for light colors, white for dark colors
          return luminance > 0.5 ? '#000000' : '#FFFFFF';
        };
        
        const textColor = getContrastColor(cursor.color);
        
        return (
          <div
            key={cursor.user_id}
            className="absolute pointer-events-none transition-all duration-75"
            style={{
              left: `${screenX}px`,
              top: `${screenY}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 9998
            }}
          >
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
              style={{ backgroundColor: cursor.color }}
            />
            <div 
              className="mt-1 px-2 py-1 text-xs rounded whitespace-nowrap shadow-lg"
              style={{ 
                backgroundColor: cursor.color,
                color: textColor
              }}
            >
              {cursor.username}
            </div>
          </div>
        );
      })}

      {/* Collaboration Status Indicator */}
      <div className={`canvas-studio ${isMobile ? 'canvas-studio-mobile' : 'canvas-studio-desktop'}`}>
      {/* Top Bar */}
      <div className="canvas-studio-topbar">
        <div className="canvas-studio-topbar-left">
          <button 
            className="canvas-studio-topbar-btn"
            onClick={handleUndo}
            aria-label="Undo"
          >
            <ArrowUturnLeftIcon className="canvas-studio-topbar-icon" />
          </button>
          <button 
            className="canvas-studio-topbar-btn"
            onClick={handleRedo}
            aria-label="Redo"
          >
            <ArrowUturnRightIcon className="canvas-studio-topbar-icon" />
          </button>
        </div>
        
        <div className="canvas-studio-topbar-center">
          <button 
            className="canvas-studio-topbar-btn"
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.1))}
            aria-label="Zoom out"
          >
            <MinusIcon className="canvas-studio-topbar-icon" />
          </button>
          <button className="canvas-studio-topbar-btn" onClick={handleResetZoom} aria-label="Reset zoom">
            <ArrowPathIcon className="canvas-studio-topbar-icon" />
          </button>
          <input
            type="text"
            className="canvas-studio-zoom-input"
            value={Math.round(zoomLevel * 100)}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value > 0 && value <= 500) {
                setZoomLevel(value / 100);
              }
            }}
            onBlur={(e) => {
              const value = parseInt(e.target.value);
              if (isNaN(value) || value <= 0) {
                setZoomLevel(1);
              }
            }}
            aria-label="Zoom percentage"
            style={{
              backgroundColor: '#404650',
              color: '#FFFFFF',
              borderColor: '#404650'
            }}
          />
          <span className="canvas-studio-zoom-percent">%</span>
          <button 
            className="canvas-studio-topbar-btn"
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 5))}
            aria-label="Zoom in"
          >
            <PlusIcon className="canvas-studio-topbar-icon" />
          </button>
        </div>
        
        <div className="canvas-studio-topbar-right">
          {/* Collaboration button removed - now in ManualStoryCreationPage */}
          <button className="canvas-studio-topbar-btn" onClick={handleDone} aria-label="Save">
            <CheckIcon className="canvas-studio-topbar-icon" />
          </button>
        </div>
      </div>

      {/* Desktop: Three-column layout */}
      {!isMobile && (
        <>
          {/* Left Toolbar */}
          <div className="canvas-studio-left-toolbar">
            {/* Select Tool */}
            <button
              className={`canvas-studio-tool-btn ${activeTool === 'select' ? 'canvas-studio-tool-btn-active' : ''}`}
              onClick={() => handleToolClick('select')}
              aria-label="Select"
            >
              <CursorArrowRaysIcon className="canvas-studio-tool-icon" />
              <span className="canvas-studio-tool-label">Select</span>
            </button>

            {/* Brush Tool - Dynamic Icon */}
            <button
              className={`canvas-studio-tool-btn ${activeTool === 'brush' ? 'canvas-studio-tool-btn-active' : ''}`}
              onClick={(e) => handleToolClick('brush', e)}
              aria-label="Brush"
            >
              {renderBrushIcon(activeBrush)}
              <span className="canvas-studio-tool-label">Brush</span>
              <div className="canvas-studio-tool-indicator" />
            </button>

            {/* Eraser Tool */}
            <button
              className={`canvas-studio-tool-btn ${activeTool === 'eraser' ? 'canvas-studio-tool-btn-active' : ''}`}
              onClick={() => handleToolClick('eraser')}
              aria-label="Eraser"
            >
              <div className="canvas-eraser-icon" />
              <span className="canvas-studio-tool-label">Eraser</span>
              <div className="canvas-studio-tool-indicator" />
            </button>

            {/* Fill Tool */}
            <button
              className={`canvas-studio-tool-btn ${activeTool === 'fill' ? 'canvas-studio-tool-btn-active' : ''}`}
              onClick={() => handleToolClick('fill')}
              aria-label="Fill"
            >
              <EyeDropperIcon className="canvas-studio-tool-icon" />
              <span className="canvas-studio-tool-label">Fill</span>
            </button>

            {/* Shapes Tool - Dynamic Icon */}
            <button
              className={`canvas-studio-tool-btn ${activeTool === 'shapes' ? 'canvas-studio-tool-btn-active' : ''}`}
              onClick={(e) => handleToolClick('shapes', e)}
              aria-label="Shapes"
            >
              {renderShapeIcon(activeShape)}
              <span className="canvas-studio-tool-label">Shapes</span>
              <div className="canvas-studio-tool-indicator" />
            </button>

            {/* Text Tool */}
            <button
              className={`canvas-studio-tool-btn ${activeTool === 'text' ? 'canvas-studio-tool-btn-active' : ''}`}
              onClick={() => handleToolClick('text')}
              aria-label="Text"
            >
              <span className="canvas-studio-tool-icon-text">T</span>
              <span className="canvas-studio-tool-label">Text</span>
            </button>

            {/* Divider */}
            <div style={{ height: '1px', background: '#E5E7EB', margin: '8px 0' }} />

            {/* Clear Canvas Button */}
            <button
              className="canvas-studio-tool-btn"
              onClick={handleClearCanvas}
              aria-label="Clear Canvas"
              style={{ color: '#EF4444' }}
            >
              <TrashIcon className="canvas-studio-tool-icon" />
              <span className="canvas-studio-tool-label">Clear</span>
            </button>
          </div>
        </>
      )}

      {/* Tool Submenu - Works for both Desktop and Mobile */}
      {showToolSubmenu && submenuTool && (
        <>
          {/* Backdrop for mobile */}
          {isMobile && (
            <div 
              className="canvas-studio-submenu-backdrop"
              onClick={() => setShowToolSubmenu(false)}
            />
          )}
          <div 
            className={`canvas-studio-submenu ${isMobile ? 'canvas-studio-submenu-mobile' : ''}`}
            style={!isMobile ? { top: `${submenuPosition.top}px`, left: `${submenuPosition.left}px` } : undefined}
          >
          {submenuTool === 'brush' && (
            <>
              {brushTypes.map(({ type, label }) => (
                <button
                  key={type}
                  className={`canvas-studio-submenu-item ${activeBrush === type ? 'canvas-studio-submenu-item-active' : ''}`}
                  onClick={() => {
                    handleBrushSelect(type);
                    setActiveTool('brush');
                    setShowToolSubmenu(false);
                  }}
                >
                  {renderBrushIcon(type, 'canvas-studio-submenu-icon')}
                  <span className="canvas-studio-submenu-label">{label}</span>
                  {activeBrush === type && <CheckIcon className="canvas-studio-submenu-check" />}
                </button>
              ))}
            </>
          )}
          {submenuTool === 'shapes' && (
            <>
              {shapeTypes.map(({ type, label }) => (
                <button
                  key={type}
                  className={`canvas-studio-submenu-item ${activeShape === type ? 'canvas-studio-submenu-item-active' : ''}`}
                  onClick={() => handleShapeSelect(type)}
                >
                  {renderShapeIcon(type, 'canvas-studio-submenu-icon')}
                  <span className="canvas-studio-submenu-label">{label}</span>
                  {activeShape === type && <CheckIcon className="canvas-studio-submenu-check" />}
                </button>
              ))}
            </>
          )}
          </div>
        </>
      )}

      {/* Canvas Area */}
      <div className={`canvas-studio-canvas-area ${isMobile ? 'canvas-studio-canvas-area-mobile' : ''} ${isMobile && (showBrushPicker || showColorPicker || showBrushMenu) ? 'has-settings' : ''}`}>
        <div 
          className="canvas-studio-canvas-wrapper"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none'
          }}
        >
          <canvas
            ref={canvasRef}
            className="canvas-studio-canvas"
            style={{
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
          />
        </div>
        
        {/* Floating Trash Zone */}
        {showTrashZone && (
          <div 
            ref={trashZoneRef}
            className={`canvas-studio-trash-zone ${isOverTrashZone ? 'canvas-studio-trash-zone-active' : ''}`}
          >
            <TrashIcon className="canvas-studio-trash-zone-icon" />
            <span className="canvas-studio-trash-zone-text">
              {isOverTrashZone ? 'Release to Delete' : 'Drag Here to Delete'}
            </span>
          </div>
        )}
      </div>

      {/* Right Panel - Desktop Only */}
      {!isMobile && (
        <div className="canvas-studio-right-panel">
          {/* Tab Bar */}
          <div className="canvas-studio-panel-tabs">
            <button
              className={`canvas-studio-panel-tab ${activePanel === 'layers' ? 'canvas-studio-panel-tab-active' : ''}`}
              onClick={() => setActivePanel('layers')}
            >
              <Square3Stack3DIcon className="canvas-studio-panel-tab-icon" />
              Layers
            </button>
            <button
              className={`canvas-studio-panel-tab ${activePanel === 'colors' ? 'canvas-studio-panel-tab-active' : ''}`}
              onClick={() => setActivePanel('colors')}
            >
              <div className="canvas-studio-color-circle-icon" />
              Colors
            </button>
            <button
              className={`canvas-studio-panel-tab ${activePanel === 'settings' ? 'canvas-studio-panel-tab-active' : ''}`}
              onClick={() => setActivePanel('settings')}
            >
              <Cog6ToothIcon className="canvas-studio-panel-tab-icon" />
              Settings
            </button>
          </div>

          {/* Panel Content */}
          <div className="canvas-studio-panel-content">
            {activePanel === 'layers' && (
              <>
                {/* Add Layer Button */}
                <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--cs-border)' }}>
                  <button
                    onClick={handleAddLayer}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'var(--cs-purple)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cs-purple-dark)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--cs-purple)'}
                  >
                    <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                    Add Layer
                  </button>
                </div>
                
                <div className="canvas-studio-layers-list">
                {layers && layers.length > 0 ? layers.map((layer, index) => {
                  // Use cached thumbnail if available
                  const thumbnail = thumbnailCacheRef.current.get(layer.id) || layer.thumbnail;
                  if (layer.thumbnail && !thumbnailCacheRef.current.has(layer.id)) {
                    thumbnailCacheRef.current.set(layer.id, layer.thumbnail);
                  }
                  
                  return (
                <div 
                  key={layer.id}
                  className={`canvas-studio-layer-item ${layer.id === activeLayerId ? 'canvas-studio-layer-item-active' : ''} ${layer.locked ? 'canvas-studio-layer-item-locked' : ''} ${draggingLayerId === layer.id ? 'canvas-studio-layer-item-dragging' : ''} ${dragOverLayerId === layer.id ? 'canvas-studio-layer-item-drag-over' : ''}`}
                  onClick={() => !layer.locked && handleSelectLayer(layer.id)}
                  draggable={!layer.isBackground && !layer.locked}
                  onDragStart={(e) => handleLayerDragStart(e, layer.id)}
                  onDragOver={(e) => handleLayerDragOver(e, layer.id)}
                  onDrop={(e) => handleLayerDrop(e, layer.id)}
                  onDragEnd={handleLayerDragEnd}
                >
                  {/* Thumbnail */}
                  <div className="canvas-studio-layer-thumbnail">
                    {thumbnail ? (
                      <img src={thumbnail} alt={layer.name} />
                    ) : (
                      <div className="canvas-studio-layer-thumbnail-empty" />
                    )}
                  </div>
                  
                  {/* Layer Info */}
                  <div className="canvas-studio-layer-info">
                    {editingLayerId === layer.id ? (
                      <input
                        type="text"
                        value={editingLayerName}
                        onChange={(e) => setEditingLayerName(e.target.value)}
                        onBlur={handleFinishRenameLayer}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFinishRenameLayer();
                          if (e.key === 'Escape') {
                            setEditingLayerId(null);
                            setEditingLayerName('');
                          }
                        }}
                        className="canvas-studio-layer-name-input"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span 
                        className="canvas-studio-layer-name"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          if (!layer.isBackground) {
                            handleStartRenameLayer(layer.id, layer.name);
                          }
                        }}
                      >
                        {layer.name}
                      </span>
                    )}
                    
                    {/* Opacity Slider */}
                    <div className="canvas-studio-layer-opacity" onClick={(e) => e.stopPropagation()}>
                      <span className="canvas-studio-layer-opacity-label">{Math.round(layer.opacity * 100)}%</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={layer.opacity * 100}
                        onChange={(e) => handleLayerOpacityChange(layer.id, parseInt(e.target.value) / 100)}
                        className="canvas-studio-layer-opacity-slider"
                      />
                    </div>
                    
                    {/* Layer Controls - Now inside layer-info, below opacity */}
                    <div className="canvas-studio-layer-controls" onClick={(e) => e.stopPropagation()}>
                    {/* Visibility Toggle */}
                    <button
                      className="canvas-studio-layer-control-btn"
                      onClick={() => handleToggleLayerVisibility(layer.id)}
                      aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
                    >
                      {layer.visible ? (
                        <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                      ) : (
                        <EyeSlashIcon style={{ width: '1rem', height: '1rem', opacity: 0.5 }} />
                      )}
                    </button>
                    
                    {/* Lock Toggle */}
                    <button
                      className="canvas-studio-layer-control-btn"
                      onClick={() => handleToggleLayerLock(layer.id)}
                      aria-label={layer.locked ? 'Unlock layer' : 'Lock layer'}
                    >
                      {layer.locked ? (
                        <LockClosedIcon style={{ width: '1rem', height: '1rem' }} />
                      ) : (
                        <LockOpenIcon style={{ width: '1rem', height: '1rem', opacity: 0.5 }} />
                      )}
                    </button>
                    
                    {/* More Options */}
                    {!layer.isBackground && (
                      <div className="canvas-studio-layer-more">
                        <button
                          className="canvas-studio-layer-control-btn"
                          onClick={() => {
                            // Show context menu
                          }}
                          aria-label="More options"
                        >
                          ⋮
                        </button>
                        
                        {/* Quick Actions */}
                        <div className="canvas-studio-layer-actions">
                          <button
                            onClick={() => handleDuplicateLayer(layer.id)}
                            title="Duplicate"
                          >
                            <DocumentDuplicateIcon style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button
                            onClick={() => handleStartRenameLayer(layer.id, layer.name)}
                            title="Rename"
                          >
                            <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          {index < layers.length - 1 && (
                            <button
                              onClick={() => handleMergeLayerDown(layer.id)}
                              title="Merge Down"
                              style={{ fontSize: '0.75rem', fontWeight: '600' }}
                            >
                              Merge
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteLayer(layer.id)}
                            title="Delete"
                            style={{ color: '#EF4444' }}
                          >
                            <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Drag Handle - More visible for mobile */}
                    {!layer.isBackground && !layer.locked && (
                      <div className="canvas-studio-layer-drag-handle" title="Drag to reorder">
                        <div className="canvas-studio-layer-drag-dots">
                          <div></div>
                          <div></div>
                          <div></div>
                          <div></div>
                          <div></div>
                          <div></div>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
                );
              }) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--cs-text-secondary)' }}>
                  No layers available
                </div>
              )}
              </div>
              </>
            )}

            {activePanel === 'colors' && (
              <>
                {/* Advanced Color Picker */}
                <div className="canvas-studio-color-section">
                  <h3 className="canvas-studio-color-section-title">Advanced Color Picker</h3>
                  <AdvancedColorPicker
                    color={selectedColor}
                    onChange={(color, alpha) => {
                      setSelectedColor(color);
                      setGradientActive(false); // Disable gradient when selecting solid color
                      if (alpha !== undefined) {
                        setBrushOpacity(alpha);
                      }
                      if (drawingEngineRef.current) {
                        drawingEngineRef.current.setColor(color);
                        if (alpha !== undefined) {
                          drawingEngineRef.current.setOpacity(alpha);
                        }
                      }
                      // Add to recent colors
                      if (!recentColors.includes(color)) {
                        setRecentColors([color, ...recentColors.slice(0, 9)]);
                      }
                    }}
                    showAlpha={true}
                    showFormats={true}
                    recentColors={recentColors}
                    onAddToRecent={(color) => {
                      if (!recentColors.includes(color)) {
                        setRecentColors([color, ...recentColors.slice(0, 9)]);
                      }
                    }}
                    showBrushSettings={!isMobile}
                    brushSize={brushSize}
                    onBrushSizeChange={setBrushSize}
                  />
                </div>

                {/* Gradient Editor */}
                <div className="canvas-studio-color-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 className="canvas-studio-color-section-title" style={{ marginBottom: 0 }}>Gradients</h3>
                    <button
                      onClick={() => setShowGradientEditor(!showGradientEditor)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: showGradientEditor ? 'var(--cs-purple, #8B5CF6)' : 'var(--cs-bg-darker, #F3F4F6)',
                        color: showGradientEditor ? 'white' : 'var(--cs-text-secondary, #6B7280)',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {showGradientEditor ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showGradientEditor && (
                    <GradientEditor
                      gradient={currentGradient}
                      onChange={setCurrentGradient}
                      onApply={() => {
                        // Apply gradient to drawing engine
                        if (drawingEngineRef.current) {
                          drawingEngineRef.current.setGradient(currentGradient);
                          drawingEngineRef.current.setUseGradient(true);
                          setGradientActive(true);
                        }
                        const gradientCSS = currentGradient.type === 'linear'
                          ? `linear-gradient(${currentGradient.angle}deg, ${currentGradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
                          : `radial-gradient(circle, ${currentGradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`;
                        console.log('Gradient CSS:', gradientCSS);
                        setShowGradientModal(true);
                      }}
                    />
                  )}
                </div>

                {/* Quick Colors (Predefined) */}
                <div className="canvas-studio-color-section">
                  <h3 className="canvas-studio-color-section-title">Quick Colors</h3>
                  <div className="canvas-studio-colors-grid">
                    {predefinedColors.map((color, index) => (
                      <button
                        key={`color-${index}`}
                        className={`canvas-studio-color-swatch ${
                          color === selectedColor ? 'canvas-studio-color-swatch-active' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorSelect(color)}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {activePanel === 'settings' && (
              <>
                {/* Shape Fill Toggle */}
                <div className="canvas-studio-color-section">
                  <h3 className="canvas-studio-color-section-title">Shape Settings</h3>
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#E5E7EB' }}>Fill Mode</span>
                      <button
                        onClick={() => setShapeFilled(!shapeFilled)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: shapeFilled ? 'var(--cs-purple, #8B5CF6)' : 'var(--cs-bg-darker, #F3F4F6)',
                          color: shapeFilled ? 'white' : 'var(--cs-text-secondary, #6B7280)',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {shapeFilled ? 'Filled' : 'Hollow'}
                      </button>
                    </div>
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: '#9CA3AF', 
                      margin: 0
                    }}>
                      {shapeFilled ? 'Shapes will be filled with color' : 'Shapes will be hollow with outline only'}
                    </p>
                  </div>
                </div>

                {/* Brush Settings */}
                <div className="canvas-studio-color-section">
                  <h3 className="canvas-studio-color-section-title">Brush Settings</h3>
                  
                  {/* Brush Size */}
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#E5E7EB' }}>Size</span>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{brushSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="canvas-studio-slider"
                    />
                  </div>

                  {/* Brush Opacity */}
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#E5E7EB' }}>Opacity</span>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{Math.round(brushOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={brushOpacity * 100}
                      onChange={(e) => setBrushOpacity(Number(e.target.value) / 100)}
                      className="canvas-studio-slider"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile Sliders - Above Toolbar in portrait, in right bar in landscape */}
      {isMobile && (activeTool === 'brush' || activeTool === 'eraser') && (
        <div className="canvas-studio-mobile-sliders">
          <div className="canvas-studio-sliders-header">
            <span className="canvas-studio-sliders-title">Brush Settings</span>
            <button
              className="canvas-studio-reset-btn"
              onClick={() => {
                setBrushSize(5);
                setBrushOpacity(1);
                if (drawingEngineRef.current) {
                  drawingEngineRef.current.setSize(5);
                  drawingEngineRef.current.setOpacity(1);
                }
              }}
              aria-label="Reset settings"
            >
              <ArrowPathIcon className="canvas-studio-reset-icon" />
            </button>
          </div>

          {/* Thickness Slider with Preview */}
          <div className="canvas-studio-slider-container">
            <label className="canvas-studio-slider-label">
              <span>Size</span>
              <div className="canvas-studio-slider-preview">
                <div 
                  className="canvas-studio-brush-preview"
                  style={{ 
                    width: `${Math.min(brushSize, 30)}px`,
                    height: `${Math.min(brushSize, 30)}px`,
                    backgroundColor: selectedColor,
                    opacity: brushOpacity
                  }}
                />
                <span className="canvas-studio-slider-value">{brushSize}px</span>
              </div>
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="canvas-studio-slider"
            />
          </div>

          {/* Opacity Slider */}
          <div className="canvas-studio-slider-container">
            <label className="canvas-studio-slider-label">
              <span>Opacity</span>
              <span className="canvas-studio-slider-value">{Math.round(brushOpacity * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={brushOpacity * 100}
              onChange={(e) => setBrushOpacity(Number(e.target.value) / 100)}
              className="canvas-studio-slider"
            />
          </div>
        </div>
      )}

      {/* Mobile Shape Settings */}
      {isMobile && activeTool === 'shapes' && (
        <div className="canvas-studio-mobile-sliders">
          <div className="canvas-studio-sliders-header">
            <span className="canvas-studio-sliders-title">Shape Settings</span>
          </div>

          {/* Shape Fill Toggle */}
          <div className="canvas-studio-slider-container">
            <label className="canvas-studio-slider-label">
              <span>Fill Mode</span>
              <button
                onClick={() => setShapeFilled(!shapeFilled)}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: shapeFilled ? 'var(--cs-purple, #8B5CF6)' : 'var(--cs-bg-darker, #F3F4F6)',
                  color: shapeFilled ? 'white' : 'var(--cs-text-secondary, #6B7280)',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {shapeFilled ? 'Filled' : 'Hollow'}
              </button>
            </label>
          </div>
        </div>
      )}

      {/* Mobile Bottom Toolbar in portrait, right vertical bar in landscape */}
      {isMobile && (
        <div className="canvas-studio-mobile-toolbar">
          <button
            className={`canvas-studio-mobile-tool ${activeTool === 'select' ? 'canvas-studio-mobile-tool-active' : ''}`}
            onClick={() => handleToolClick('select')}
          >
            <CursorArrowRaysIcon className="canvas-studio-mobile-tool-icon" />
          </button>
          <button
            className={`canvas-studio-mobile-tool ${activeTool === 'brush' ? 'canvas-studio-mobile-tool-active' : ''}`}
            onClick={() => handleToolClick('brush')}
          >
            {renderBrushIcon(activeBrush, 'canvas-studio-mobile-tool-icon')}
          </button>
          <button
            className={`canvas-studio-mobile-tool ${activeTool === 'eraser' ? 'canvas-studio-mobile-tool-active' : ''}`}
            onClick={() => handleToolClick('eraser')}
          >
            <div className="canvas-eraser-icon" />
          </button>
          <button
            className={`canvas-studio-mobile-tool ${activeTool === 'fill' ? 'canvas-studio-mobile-tool-active' : ''}`}
            onClick={() => handleToolClick('fill')}
          >
            <EyeDropperIcon className="canvas-studio-mobile-tool-icon" />
          </button>
          <button
            className={`canvas-studio-mobile-tool ${activeTool === 'shapes' ? 'canvas-studio-mobile-tool-active' : ''}`}
            onClick={() => handleToolClick('shapes')}
          >
            {renderShapeIcon(activeShape, 'canvas-studio-mobile-tool-icon')}
          </button>
          <button
            className={`canvas-studio-mobile-tool ${activeTool === 'text' ? 'canvas-studio-mobile-tool-active' : ''}`}
            onClick={() => handleToolClick('text')}
          >
            <span className="canvas-studio-tool-icon-text">T</span>
          </button>
          <button
            className="canvas-studio-mobile-tool"
            onClick={() => setShowLayersModal(true)}
          >
            <Square3Stack3DIcon className="canvas-studio-mobile-tool-icon" />
          </button>
          <button
            className="canvas-studio-mobile-tool"
            onClick={() => setShowColorPicker(true)}
          >
            <div 
              className="canvas-studio-color-indicator"
              style={{ 
                background: gradientActive && currentGradient
                  ? currentGradient.type === 'linear'
                    ? `linear-gradient(${currentGradient.angle}deg, ${currentGradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
                    : `radial-gradient(circle, ${currentGradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
                  : selectedColor
              }}
            />
          </button>
          <button
            className="canvas-studio-mobile-tool"
            onClick={handleClearCanvas}
            aria-label="Clear Canvas"
            style={{ color: '#EF4444' }}
          >
            <TrashIcon className="canvas-studio-mobile-tool-icon" />
          </button>
        </div>
      )}

      {/* Mobile Layers Modal */}
      {isMobile && showLayersModal && (
        <div className="canvas-studio-modal-overlay" onClick={() => setShowLayersModal(false)}>
          <div className="canvas-studio-modal canvas-studio-layers-modal" onClick={(e) => e.stopPropagation()}>
            <div className="canvas-studio-modal-header">
              <h3 className="canvas-studio-modal-title">Layers</h3>
              <button 
                className="canvas-studio-layer-add-btn"
                onClick={handleCreateLayer}
                aria-label="Add Layer"
              >
                <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
              <button onClick={() => setShowLayersModal(false)}>
                <XMarkIcon className="canvas-studio-modal-close-icon" />
              </button>
            </div>
            <div className="canvas-studio-layers-list">
              {layers.map((layer, index) => {
                // Use cached thumbnail if available
                const thumbnail = thumbnailCacheRef.current.get(layer.id) || layer.thumbnail;
                if (layer.thumbnail && !thumbnailCacheRef.current.has(layer.id)) {
                  thumbnailCacheRef.current.set(layer.id, layer.thumbnail);
                }
                
                return (
                <div 
                  key={layer.id}
                  className={`canvas-studio-layer-item ${layer.id === activeLayerId ? 'canvas-studio-layer-item-active' : ''} ${layer.locked ? 'canvas-studio-layer-item-locked' : ''} ${draggingLayerId === layer.id ? 'canvas-studio-layer-item-dragging' : ''} ${dragOverLayerId === layer.id ? 'canvas-studio-layer-item-drag-over' : ''}`}
                  onClick={() => !layer.locked && handleSelectLayer(layer.id)}
                  draggable={!layer.isBackground && !layer.locked}
                  onDragStart={(e) => handleLayerDragStart(e, layer.id)}
                  onDragOver={(e) => handleLayerDragOver(e, layer.id)}
                  onDrop={(e) => handleLayerDrop(e, layer.id)}
                  onDragEnd={handleLayerDragEnd}
                >
                  {/* Thumbnail */}
                  <div className="canvas-studio-layer-thumbnail">
                    {thumbnail ? (
                      <img src={thumbnail} alt={layer.name} />
                    ) : (
                      <div className="canvas-studio-layer-thumbnail-empty" />
                    )}
                  </div>
                  
                  {/* Layer Info */}
                  <div className="canvas-studio-layer-info">
                    {editingLayerId === layer.id ? (
                      <input
                        type="text"
                        value={editingLayerName}
                        onChange={(e) => setEditingLayerName(e.target.value)}
                        onBlur={handleFinishRenameLayer}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFinishRenameLayer();
                          if (e.key === 'Escape') {
                            setEditingLayerId(null);
                            setEditingLayerName('');
                          }
                        }}
                        className="canvas-studio-layer-name-input"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span 
                        className="canvas-studio-layer-name"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          if (!layer.isBackground) {
                            handleStartRenameLayer(layer.id, layer.name);
                          }
                        }}
                      >
                        {layer.name}
                      </span>
                    )}
                    
                    {/* Opacity Slider */}
                    <div className="canvas-studio-layer-opacity" onClick={(e) => e.stopPropagation()}>
                      <span className="canvas-studio-layer-opacity-label">{Math.round(layer.opacity * 100)}%</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={layer.opacity * 100}
                        onChange={(e) => handleLayerOpacityChange(layer.id, parseInt(e.target.value) / 100)}
                        className="canvas-studio-layer-opacity-slider"
                      />
                    </div>
                    
                    {/* Layer Controls - Now inside layer-info, below opacity */}
                    <div className="canvas-studio-layer-controls" onClick={(e) => e.stopPropagation()}>
                    {/* Visibility Toggle */}
                    <button
                      className="canvas-studio-layer-control-btn"
                      onClick={() => handleToggleLayerVisibility(layer.id)}
                      aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
                    >
                      {layer.visible ? (
                        <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                      ) : (
                        <EyeSlashIcon style={{ width: '1rem', height: '1rem', opacity: 0.5 }} />
                      )}
                    </button>
                    
                    {/* Lock Toggle */}
                    <button
                      className="canvas-studio-layer-control-btn"
                      onClick={() => handleToggleLayerLock(layer.id)}
                      aria-label={layer.locked ? 'Unlock layer' : 'Lock layer'}
                    >
                      {layer.locked ? (
                        <LockClosedIcon style={{ width: '1rem', height: '1rem' }} />
                      ) : (
                        <LockOpenIcon style={{ width: '1rem', height: '1rem', opacity: 0.5 }} />
                      )}
                    </button>
                    
                    {/* More Options */}
                    {!layer.isBackground && (
                      <div className="canvas-studio-layer-more">
                        <button
                          className="canvas-studio-layer-control-btn"
                          onClick={() => {
                            // Show context menu
                          }}
                          aria-label="More options"
                        >
                          ⋮
                        </button>
                        
                        {/* Quick Actions */}
                        <div className="canvas-studio-layer-actions">
                          <button
                            onClick={() => handleDuplicateLayer(layer.id)}
                            title="Duplicate"
                          >
                            <DocumentDuplicateIcon style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button
                            onClick={() => handleStartRenameLayer(layer.id, layer.name)}
                            title="Rename"
                          >
                            <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          {index < layers.length - 1 && (
                            <button
                              onClick={() => handleMergeLayerDown(layer.id)}
                              title="Merge Down"
                              style={{ fontSize: '0.75rem', fontWeight: '600' }}
                            >
                              Merge
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteLayer(layer.id)}
                            title="Delete"
                            style={{ color: '#EF4444' }}
                          >
                            <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Drag Handle - More visible for mobile */}
                    {!layer.isBackground && !layer.locked && (
                      <div className="canvas-studio-layer-drag-handle" title="Drag to reorder">
                        <div className="canvas-studio-layer-drag-dots">
                          <div></div>
                          <div></div>
                          <div></div>
                          <div></div>
                          <div></div>
                          <div></div>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Color Picker Modal */}
      {isMobile && showColorPicker && (
        <div className="canvas-studio-modal-overlay" onClick={() => setShowColorPicker(false)}>
          <div className="canvas-studio-modal canvas-studio-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="canvas-studio-modal-header">
              <h3 className="canvas-studio-modal-title">Colors</h3>
              <button onClick={() => setShowColorPicker(false)}>
                <XMarkIcon className="canvas-studio-modal-close-icon" />
              </button>
            </div>
            <div className="canvas-studio-modal-content">
              {/* Advanced Color Picker */}
              <div className="canvas-studio-color-section">
                <AdvancedColorPicker
                  color={selectedColor}
                  onChange={(color, alpha) => {
                    setSelectedColor(color);
                    setGradientActive(false); // Disable gradient when selecting solid color
                    if (alpha !== undefined) {
                      setBrushOpacity(alpha);
                    }
                    if (drawingEngineRef.current) {
                      drawingEngineRef.current.setColor(color);
                      if (alpha !== undefined) {
                        drawingEngineRef.current.setOpacity(alpha);
                      }
                    }
                    // Add to recent colors
                    if (!recentColors.includes(color)) {
                      setRecentColors([color, ...recentColors.slice(0, 9)]);
                    }
                  }}
                  showAlpha={true}
                  showFormats={true}
                  recentColors={recentColors}
                  onAddToRecent={(color) => {
                    if (!recentColors.includes(color)) {
                      setRecentColors([color, ...recentColors.slice(0, 9)]);
                    }
                  }}
                />
              </div>

              {/* Gradient Editor */}
              <div className="canvas-studio-color-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 className="canvas-studio-color-section-title" style={{ marginBottom: 0 }}>Gradients</h4>
                  <button
                    onClick={() => setShowGradientEditor(!showGradientEditor)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      background: showGradientEditor ? 'var(--cs-purple, #8B5CF6)' : 'var(--cs-bg-darker, #F3F4F6)',
                      color: showGradientEditor ? 'white' : 'var(--cs-text-secondary, #6B7280)',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {showGradientEditor ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showGradientEditor && (
                  <GradientEditor
                    gradient={currentGradient}
                    onChange={setCurrentGradient}
                    onApply={() => {
                      // Apply gradient to drawing engine
                      if (drawingEngineRef.current) {
                        drawingEngineRef.current.setGradient(currentGradient);
                        drawingEngineRef.current.setUseGradient(true);
                        setGradientActive(true);
                      }
                      const gradientCSS = currentGradient.type === 'linear'
                        ? `linear-gradient(${currentGradient.angle}deg, ${currentGradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
                        : `radial-gradient(circle, ${currentGradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`;
                      console.log('Gradient CSS:', gradientCSS);
                      setShowGradientEditor(false);
                      setShowColorPicker(false);
                      setShowGradientModal(true);
                    }}
                  />
                )}
              </div>

              {/* Quick Colors */}
              <div className="canvas-studio-color-section">
                <h4 className="canvas-studio-color-section-title">Quick Colors</h4>
                <div className="canvas-studio-colors-grid">
                  {predefinedColors.map((color, index) => (
                    <button
                      key={`color-${index}`}
                      className={`canvas-studio-color-swatch ${
                        color === selectedColor ? 'canvas-studio-color-swatch-active' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        handleColorSelect(color);
                      }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <div style={{ padding: '1rem 0' }}>
                <button
                  onClick={() => setShowColorPicker(false)}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: 'var(--cs-purple, #8B5CF6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Text Input Overlay - Instagram Stories Style */}
      {showTextModal && (
        <div className="canvas-text-overlay">
          {/* Dimmed background */}
          <div className="canvas-text-dim" onClick={handleCancelText} />
          
          {/* Top Toolbar */}
          <div className="canvas-text-top-toolbar">
            {/* Color Picker Button */}
            <button 
              className="canvas-text-toolbar-btn"
              onClick={() => setShowTextColorPicker(!showTextColorPicker)}
              title="Text Color"
            >
              <div className="canvas-text-color-circle" style={{ backgroundColor: textColor }} />
            </button>

            {/* Alignment Buttons */}
            <button
              onClick={() => setTextAlign('left')}
              className={`canvas-text-toolbar-btn ${textAlign === 'left' ? 'active' : ''}`}
              title="Align Left"
            >
              ☰
            </button>
            <button
              onClick={() => setTextAlign('center')}
              className={`canvas-text-toolbar-btn ${textAlign === 'center' ? 'active' : ''}`}
              title="Align Center"
            >
              ≡
            </button>
            <button
              onClick={() => setTextAlign('right')}
              className={`canvas-text-toolbar-btn ${textAlign === 'right' ? 'active' : ''}`}
              title="Align Right"
            >
              ☰
            </button>

            {/* Font Size Slider */}
            <div className="canvas-text-size-slider-wrapper">
              <input
                type="range"
                min="16"
                max="80"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="canvas-text-size-slider"
                title={`Font Size: ${fontSize}px`}
              />
            </div>

            {/* Done Button */}
            <button
              className="canvas-text-done-btn"
              onClick={handleAddText}
              disabled={!textInput.trim()}
            >
              Done
            </button>
          </div>

          {/* Color Picker Popup */}
          {showTextColorPicker && (
            <div className="canvas-text-color-picker">
              <div className="canvas-text-color-grid">
                {['#FFFFFF', '#000000', '#EF4444', '#F97316', '#F59E0B', '#EAB308',
                  '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
                  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'].map((color) => (
                  <button
                    key={color}
                    className={`canvas-text-color-option ${textColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setTextColor(color);
                      setShowTextColorPicker(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Dynamic style override */}
          <style>{`
            .canvas-text-input-field-active {
              font-family: ${fontFamily} !important;
              font-size: ${fontSize}px !important;
              font-weight: ${fontWeight} !important;
              font-style: ${fontStyle} !important;
              text-align: ${textAlign} !important;
              color: ${textColor} !important;
            }
          `}</style>

          {/* Text input positioned on canvas */}
          <div className="canvas-text-on-canvas">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Tap to type"
              className="canvas-text-input-field canvas-text-input-field-active"
              autoFocus
            />
          </div>

          {/* Font Style Buttons - Float above keyboard */}
          <div 
            className="canvas-text-font-styles"
            style={{
              // DISABLED: Manual keyboard positioning not needed with resize: none
              // bottom: keyboardHeight > 0 ? `${keyboardHeight + 20}px` : undefined
            }}
          >
            {/* Classic - Clean and readable */}
            <button
              onClick={() => {
                setFontFamily('Arial');
                setFontWeight('normal');
                setFontStyle('normal');
              }}
              className={`canvas-text-font-style ${fontFamily === 'Arial' ? 'active' : ''}`}
              style={{ fontFamily: 'Arial', fontWeight: 'normal' }}
            >
              Aa
            </button>
            {/* Bold - Strong impact */}
            <button
              onClick={() => {
                setFontFamily('Impact');
                setFontWeight('normal');
                setFontStyle('normal');
              }}
              className={`canvas-text-font-style ${fontFamily === 'Impact' ? 'active' : ''}`}
              style={{ fontFamily: 'Impact', fontWeight: 'normal' }}
            >
              Aa
            </button>
            {/* Handwritten - Fun and playful */}
            <button
              onClick={() => {
                setFontFamily('Comic Sans MS');
                setFontWeight('bold');
                setFontStyle('normal');
              }}
              className={`canvas-text-font-style ${fontFamily === 'Comic Sans MS' ? 'active' : ''}`}
              style={{ fontFamily: 'Comic Sans MS', fontWeight: 'bold' }}
            >
              Aa
            </button>
            {/* Elegant - Sophisticated serif */}
            <button
              onClick={() => {
                setFontFamily('Georgia');
                setFontWeight('normal');
                setFontStyle('italic');
              }}
              className={`canvas-text-font-style ${fontFamily === 'Georgia' ? 'active' : ''}`}
              style={{ fontFamily: 'Georgia', fontStyle: 'italic' }}
            >
              Aa
            </button>
            {/* Typewriter - Vintage feel */}
            <button
              onClick={() => {
                setFontFamily('Courier New');
                setFontWeight('bold');
                setFontStyle('normal');
              }}
              className={`canvas-text-font-style ${fontFamily === 'Courier New' ? 'active' : ''}`}
              style={{ fontFamily: 'Courier New', fontWeight: 'bold' }}
            >
              Aa
            </button>
            {/* Brush - Artistic and expressive */}
            <button
              onClick={() => {
                setFontFamily('Brush Script MT');
                setFontWeight('normal');
                setFontStyle('italic');
              }}
              className={`canvas-text-font-style ${fontFamily === 'Brush Script MT' ? 'active' : ''}`}
              style={{ fontFamily: 'Brush Script MT, cursive', fontStyle: 'italic' }}
            >
              Aa
            </button>
          </div>
        </div>
      )}

      {/* Clear Canvas Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="canvas-studio-modal-backdrop" onClick={handleCancelClear}>
          <div className="canvas-studio-modal canvas-studio-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="canvas-studio-modal-header">
              <h3 className="canvas-studio-modal-title">Clear Canvas?</h3>
              <button 
                className="canvas-studio-modal-close"
                onClick={handleCancelClear}
                aria-label="Close"
              >
                <XMarkIcon className="canvas-studio-modal-close-icon" />
              </button>
            </div>
            <div className="canvas-studio-modal-content">
              <p style={{ marginBottom: '1.5rem', color: '#6B7280' }}>
                This will permanently delete all your drawings on this canvas. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  className="canvas-studio-btn-secondary"
                  onClick={handleCancelClear}
                >
                  Cancel
                </button>
                <button
                  className="canvas-studio-btn-danger"
                  onClick={handleConfirmClear}
                >
                  Clear Canvas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gradient Applied Modal */}
      <GradientAppliedModal
        isOpen={showGradientModal}
        onClose={() => setShowGradientModal(false)}
        gradientPreview={
          currentGradient.type === 'linear'
            ? `linear-gradient(${currentGradient.angle}deg, ${currentGradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
            : `radial-gradient(circle, ${currentGradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
        }
      />

      {/* Voting Modal */}
      {showVotingModal && votingData && ReactDOM.createPortal(
        <VotingModal
          isOpen={showVotingModal}
          onVote={handleVote}
          votingData={votingData}
          participants={participants}
          initiatedBy={votingData.initiated_by_username}
          currentUserId={currentUserId}
        />,
        document.body
      )}

      {/* Saving Overlay */}
      {showSavingOverlay && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ zIndex: 999998 }}
        >
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Saving Canvas...</h3>
            <p className="text-gray-600">Please wait while the canvas is being saved.</p>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default CanvasDrawingPage;
