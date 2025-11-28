import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStoryStore } from '../stores/storyStore';
import { CoverImageDrawingEngine } from '../components/canvas/CoverImageDrawingEngine';
import { collaborationService } from '../services/collaborationService';
import ReconnectingModal from '../components/collaboration/ReconnectingModal';
import { VotingModal } from '../components/collaboration/VotingModal';
import '../canvas-studio.css';
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
  ArrowsPointingOutIcon,
  ArrowDownTrayIcon,
  Squares2X2Icon,
  SwatchIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

type Tool = 'select' | 'brush' | 'eraser' | 'shapes' | 'text' | 'move';
type ShapeType = 'rectangle' | 'circle' | 'line' | 'triangle' | 'star' | 'heart' | 'arrow';
type BrushType = 'soft' | 'round' | 'pencil' | 'marker' | 'airbrush';
type Orientation = 'portrait' | 'landscape';

interface Character {
  id: string;
  name: string;
  addedDate: string;
  imageUrl: string;
}

const CoverImageCanvasPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingEngineRef = useRef<CoverImageDrawingEngine | null>(null);
  
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
  
  // Collaboration states
  const [isCollaborating, setIsCollaborating] = useState(isCollabFromNav || false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(collabSessionId || null);
  const [remoteCursors, setRemoteCursors] = useState<Map<number, { user_id: number; username: string; color: string; x: number; y: number }>>(new Map());
  // Store user colors separately to persist across cursor updates
  const userColorsRef = useRef<Map<number, string>>(new Map());
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

  // Get current user ID and toast context
  const { showInfoToast } = useToastContext();
  
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
  
  // CRITICAL FIX: Set up reconnection handler with useRef to avoid stale closures
  const reconnectHandlerRef = useRef<((reconnecting: boolean, attempt: number) => void) | null>(null);
  const reconnectSuccessHandlerRef = useRef<(() => void) | null>(null);
  
  // Create the handler function that uses the latest state
  reconnectHandlerRef.current = (reconnecting: boolean, attempt: number) => {
    console.log('🔄 Cover Image: Reconnection state changed:', { reconnecting, attempt });
    setIsReconnecting(reconnecting);
    setReconnectAttempt(attempt);
  };
  
  // Create handler for successful reconnection
  reconnectSuccessHandlerRef.current = () => {
    console.log('✅ Cover Image: Reconnection successful, requesting canvas sync');
    // Request canvas sync for cover image
    collaborationService.requestCanvasSync('cover_image', undefined, true);
  };
  
  // Request canvas sync on initial load if in collaboration mode
  const hasRequestedInitialSync = useRef(false);
  useEffect(() => {
    if (isCollaborating && collaborationService.isConnected() && drawingEngineRef.current && !hasRequestedInitialSync.current) {
      hasRequestedInitialSync.current = true;
      console.log('🔄 Cover Image: Initial load in collaboration mode - requesting canvas sync from backend');
      
      // Request canvas sync for cover image
      collaborationService.requestCanvasSync('cover_image', undefined, true);
    }
  }, [isCollaborating, collaborationService.isConnected()]);
  const { getCanvasData, saveCanvasData, currentStory, markAsDraft, updateStory } = useStoryStore();
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [activeTool, setActiveTool] = useState<Tool>('brush');
  const [activePanel, setActivePanel] = useState<'layers' | 'colors' | 'settings'>('colors');
  const [showToolSubmenu, setShowToolSubmenu] = useState(false);
  const [submenuTool, setSubmenuTool] = useState<Tool | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showLayersModal, setShowLayersModal] = useState(false);
  const [activeBrush, setActiveBrush] = useState<BrushType>('round');
  const [activeShape, setActiveShape] = useState<ShapeType>('rectangle');
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');
  const [brushSize, setBrushSize] = useState(5);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBrushPicker, setShowBrushPicker] = useState(false);
  const [showBrushMenu, setShowBrushMenu] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>(['#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#8B5A2B']);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  // Reset zoom and pan when component mounts to avoid cumulative zoom issues
  useEffect(() => {
    setZoomLevel(1);
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
  // Mock character data
  const characters: Character[] = [
    { id: '1', name: 'Hero Character', addedDate: '1/15/2024', imageUrl: '/api/placeholder/200/200' },
    { id: '2', name: 'Villain Design', addedDate: '1/14/2024', imageUrl: '/api/placeholder/200/200' },
    { id: '3', name: 'Side Character', addedDate: '1/13/2024', imageUrl: '/api/placeholder/200/200' }
  ];

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
        
        // Resize canvas to fit the new layout
        if (drawingEngineRef.current && canvasRef.current) {
          requestAnimationFrame(() => {
            // Get the actual canvas container dimensions
            const container = canvasRef.current?.parentElement;
            if (container) {
              const containerWidth = container.clientWidth;
              const containerHeight = container.clientHeight;
              
              // Calculate square size that fits in the container with padding
              const padding = 32; // 2rem padding
              const availableWidth = containerWidth - padding;
              const availableHeight = containerHeight - padding;
              const newSize = Math.min(availableWidth, availableHeight, 800); // Max 800px
              
              if (newSize > 0) {
                // resizeCanvas now automatically redraws
                drawingEngineRef.current?.resizeCanvas(newSize);
              }
            }
          });
        }
      }, 150); // Debounce delay - works for both real devices and emulator
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
    if (drawingEngineRef.current && activeTool !== 'text' && activeTool !== 'move') {
      drawingEngineRef.current.setTool(activeTool as any);
    }
  }, [activeTool]);

  // Initialize canvas and drawing engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        // Initialize Paper.js drawing engine for cover image
        drawingEngineRef.current = new CoverImageDrawingEngine(canvas);
        
        // Set up collaboration callbacks for cover image canvas
        drawingEngineRef.current.setCollaborationCallbacks(
          // onDrawingComplete - send drawing to other users with cover image identification
          (data) => {
            console.log('🎨 Cover Image: Drawing completed, checking connection...', {
              isCollaborating,
              currentSessionId,
              isConnected: collaborationService.isConnected(),
              hasData: !!data
            });
            
            if (collaborationService.ws && collaborationService.ws.readyState === WebSocket.OPEN) {
              console.log('✅ Cover Image: WebSocket is OPEN, sending drawing to collaborators:', data);
              
              // CRITICAL: Identify this as cover image canvas specifically
              const enhancedData = {
                ...data,
                page_id: 'cover_image', // Fixed identifier for cover image
                page_index: -1, // Special index for cover image
                is_cover_image: true // Clear flag for cover image
              };
              
              collaborationService.sendDrawing(enhancedData);
            } else {
              console.warn('⚠️ Cover Image: WebSocket not OPEN');
            }
          },
          // onCursorMove - cursor position updates with cover image identification
          (x, y) => {
            if (collaborationService.isConnected()) {
              collaborationService.sendCursorPosition(
                x, 
                y,
                'cover_image', // Fixed identifier for cover image
                -1, // Special index for cover image
                true // Clear flag for cover image
              );
            }
          }
        );
        
        // Load existing canvas data if available
        if (storyId) {
          let existingData = null;
          
          if (isCoverImage) {
            // Load cover image if it exists
            existingData = currentStory?.coverImage;
          } else if (pageId) {
            // Load page canvas data
            existingData = getCanvasData(storyId, pageId);
          }
          
          if (existingData) {
            drawingEngineRef.current.loadCanvasData(existingData);
          }
        }
        
        // Set initial tool properties
        if (activeTool !== 'text' && activeTool !== 'move') {
          drawingEngineRef.current.setTool(activeTool as any);
        }
        drawingEngineRef.current.setColor(selectedColor);
        drawingEngineRef.current.setBrushType(activeBrush);
        drawingEngineRef.current.setSize(brushSize);
        drawingEngineRef.current.setOpacity(brushOpacity);
        
        // Set initial zoom and pan
        drawingEngineRef.current.setZoomAndPan(zoomLevel, panOffset);
        
        // Trigger initial resize after engine is ready
        requestAnimationFrame(() => {
          const container = canvasRef.current?.parentElement;
          if (container && drawingEngineRef.current) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const padding = 32;
            const availableWidth = containerWidth - padding;
            const availableHeight = containerHeight - padding;
            const newSize = Math.min(availableWidth, availableHeight, 800);
            
            if (newSize > 0) {
              drawingEngineRef.current.resizeCanvas(newSize);
            }
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
  }, []); // Empty deps - only run once on mount. Event handlers access state through closure.

  // CRITICAL FIX: Set up reconnection handler on mount (always active)
  useEffect(() => {
    console.log('🔧 Cover Image: Setting up reconnection state handler (always active)');
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
      console.log('🧹 Cover Image: Cleaning up reconnection handlers');
      if (collaborationService.onReconnectStateChange) {
        collaborationService.onReconnectStateChange = undefined;
      }
      if (collaborationService.onReconnectSuccess) {
        collaborationService.onReconnectSuccess = undefined;
      }
    };
  }, []);

  // Auto-save canvas state to backend during collaboration
  useEffect(() => {
    if (!isCollaborating || !drawingEngineRef.current) return;
    
    const autoSaveInterval = setInterval(() => {
      // Only save if WebSocket is connected
      if (drawingEngineRef.current && collaborationService.isConnected()) {
        const canvasState = drawingEngineRef.current.getDrawingState();
        // Send canvas state to backend for persistence
        collaborationService.sendCanvasState(
          canvasState,
          0, // target_user_id = 0 means save to backend only
          'cover_image',
          undefined,
          true
        );
        console.log('💾 Cover Image: Auto-saved canvas state to backend');
      } else {
        console.log('⚠️ Cover Image: Skipping auto-save - WebSocket not connected');
      }
    }, 10000); // Auto-save every 10 seconds
    
    return () => clearInterval(autoSaveInterval);
  }, [isCollaborating]);

  // Collaboration connection setup
  useEffect(() => {
    if (isCollaborating && currentSessionId) {
      console.log('🎨 Cover Image: Connecting to collaboration session:', currentSessionId);
      
      collaborationService.connect(currentSessionId)
        .then(() => {
          console.log('✅ Cover Image: Connected to collaboration session');
          setIsCollaborating(true);
        })
        .catch((error) => {
          console.error('❌ Cover Image: Failed to connect to collaboration:', error);
        });
    }
  }, [isCollaborating, currentSessionId]);

  // Collaboration event handlers
  useEffect(() => {
    // Handle remote drawing - only from cover image canvas
    const handleRemoteDraw = (message: any) => {
      if (!drawingEngineRef.current || !message.data) return;
      
      // DRAWING ISOLATION: Only handle drawings from cover image canvas
      const isCoverImageDrawing = message.is_cover_image || message.page_id === 'cover_image';
      
      if (isCoverImageDrawing) {
        console.log('🎨 Cover Image: Received remote drawing from cover canvas:', message.data);
        drawingEngineRef.current.applyRemoteDrawing(message.data);
      }
    };

    // Handle remote cursor movement with canvas filtering
    const handleRemoteCursor = (message: any) => {
      if (message.user_id && message.position) {
        // CURSOR ISOLATION: Only show cursors from cover image canvas
        const isCoverImageCursor = message.is_cover_image || message.page_id === 'cover_image';
        
        console.log('🖱️ Cover Image: Cursor update filtering:', {
          messagePageId: message.page_id,
          isCoverImageCursor,
          shouldShow: isCoverImageCursor
        });
        
        if (isCoverImageCursor) {
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
      }
    };

    // Handle canvas clear - only from cover image canvas
    const handleClear = (message: any) => {
      if (!drawingEngineRef.current) return;
      
      // CLEAR ISOLATION: Only handle clears from cover image canvas
      const isCoverImageClear = message.is_cover_image || message.page_id === 'cover_image';
      
      if (isCoverImageClear) {
        console.log('🧽 Cover Image: Received remote clear from cover canvas');
        drawingEngineRef.current.applyRemoteClear();
      }
    };

    collaborationService.on('draw', handleRemoteDraw);
    collaborationService.on('drawing_update', handleRemoteDraw);
    collaborationService.on('cursor', handleRemoteCursor);
    collaborationService.on('cursor_update', handleRemoteCursor);
    collaborationService.on('user_joined', handleUserJoined);
    collaborationService.on('user_left', handleUserLeft);
    collaborationService.on('clear', handleClear);
    collaborationService.on('canvas_cleared', handleClear);

    // Canvas sync handlers for reconnection
    collaborationService.on('request_canvas_state', (message: any) => {
      console.log('📥 Cover Image: Received request for canvas state from user:', message.requesting_user_id);
      // Send our current canvas state to the requesting user
      if (drawingEngineRef.current) {
        const canvasData = drawingEngineRef.current.getDrawingState();
        console.log('📤 Cover Image: Sending canvas state:', canvasData);
        collaborationService.sendCanvasState(
          canvasData,
          message.requesting_user_id,
          'cover_image',
          undefined,
          true
        );
      }
    });

    collaborationService.on('canvas_state', (message: any) => {
      console.log('📥 Cover Image: Received canvas state from user:', message.sender_user_id, message.canvas_data);
      // Apply the received canvas state
      if (drawingEngineRef.current && message.canvas_data) {
        console.log('🔄 Cover Image: Loading canvas state...');
        drawingEngineRef.current.loadDrawingState(message.canvas_data);
        console.log('✅ Cover Image: Canvas state restored successfully');
      }
    });

    // Voting event handlers
    collaborationService.on('vote_initiated', handleVoteInitiated);
    collaborationService.on('vote_update', handleVoteUpdate);
    collaborationService.on('vote_result', handleVoteResult);

    return () => {
      collaborationService.off('draw', handleRemoteDraw);
      collaborationService.off('drawing_update', handleRemoteDraw);
      collaborationService.off('cursor', handleRemoteCursor);
      collaborationService.off('cursor_update', handleRemoteCursor);
      collaborationService.off('user_joined', handleUserJoined);
      collaborationService.off('user_left', handleUserLeft);
      collaborationService.off('clear', handleClear);
      collaborationService.off('canvas_cleared', handleClear);
      collaborationService.off('request_canvas_state');
      collaborationService.off('canvas_state');
      collaborationService.off('vote_initiated', handleVoteInitiated);
      collaborationService.off('vote_update', handleVoteUpdate);
      collaborationService.off('vote_result', handleVoteResult);
    };
  }, []);

  const handleToolSelect = (tool: Tool) => {
    setActiveTool(tool);
    setShowBrushMenu(false);
    // Only pass supported tools to drawing engine
    if (drawingEngineRef.current && tool !== 'text' && tool !== 'move') {
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
    }
  };

  const handleRedo = () => {
    if (drawingEngineRef.current) {
      drawingEngineRef.current.redo();
    }
  };

  const handleClear = () => {
    if (drawingEngineRef.current) {
      drawingEngineRef.current.clearCanvas();
      
      // Broadcast clear to collaborators with cover image identification
      if (isCollaborating && collaborationService.isConnected()) {
        collaborationService.clearCanvas(
          'cover_image', // Fixed identifier for cover image
          -1, // Special index for cover image
          true // Clear flag for cover image
        );
        console.log('📤 Cover Image: Clear canvas broadcasted to collaborators');
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
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleDone = () => {
    // Save canvas data before leaving
    if (drawingEngineRef.current && storyId) {
      const canvasData = drawingEngineRef.current.getCanvasData();
      
      if (isCoverImage) {
        // Save as cover image
        updateStory(storyId, { coverImage: canvasData });
      } else if (pageId) {
        // Save as page canvas data
        saveCanvasData(storyId, pageId, canvasData);
      }
      
      // Mark story as draft since canvas was modified
      markAsDraft(storyId);
    }
    
    // Navigate back to story creation with page index
    if (storyId) {
      navigate('/create-story-manual', { state: { storyId, returnToPageIndex: pageIndex } });
    } else {
      navigate('/create-story-manual');
    }
  };

  const handleClose = () => {
    // Save canvas data before leaving
    if (drawingEngineRef.current && storyId) {
      const canvasData = drawingEngineRef.current.getCanvasData();
      
      if (isCoverImage) {
        // Save as cover image
        updateStory(storyId, { coverImage: canvasData });
      } else if (pageId) {
        // Save as page canvas data
        saveCanvasData(storyId, pageId, canvasData);
      }
      
      // Mark story as draft since canvas was modified
      markAsDraft(storyId);
    }
    
    // Navigate back to story creation with page index
    if (storyId) {
      navigate('/create-story-manual', { state: { storyId, returnToPageIndex: pageIndex } });
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

  // Shape selection handler
  const handleShapeSelect = (shape: ShapeType) => {
    setActiveShape(shape);
    setActiveTool('shapes');
    setShowToolSubmenu(false);
    if (drawingEngineRef.current) {
      drawingEngineRef.current.setTool(shape as any);
    }
  };

  // Tool selection with submenu support
  const handleToolClick = (tool: Tool) => {
    const toolsWithSubmenu: Tool[] = ['brush', 'eraser', 'shapes'];
    
    // Always set the tool as active
    setActiveTool(tool);
    
    if (toolsWithSubmenu.includes(tool)) {
      // Toggle submenu if clicking the same tool
      if (showToolSubmenu && submenuTool === tool) {
        setShowToolSubmenu(false);
      } else {
        // Show submenu but also activate the tool
        setSubmenuTool(tool);
        setShowToolSubmenu(true);
      }
      // Activate the tool immediately with current settings
      if (tool === 'shapes' && drawingEngineRef.current) {
        drawingEngineRef.current.setTool(activeShape as any);
      } else if (drawingEngineRef.current && tool !== 'text' && tool !== 'move') {
        drawingEngineRef.current.setTool(tool as any);
      }
    } else {
      setShowToolSubmenu(false);
      // Only pass supported tools to drawing engine
      if (drawingEngineRef.current && tool !== 'text' && tool !== 'move') {
        drawingEngineRef.current.setTool(tool as any);
      }
    }
  };

  const handleCancelReconnect = () => {
    collaborationService.disconnect();
    setIsCollaborating(false);
    setRemoteCursors(new Map());
    setIsReconnecting(false);
    setReconnectAttempt(0);
  };

  const handleRetryReconnect = () => {
    console.log('User triggered manual retry');
    collaborationService.retryConnection();
  };

  // Voting handlers
  const handleVote = async (agree: boolean) => {
    console.log('🗳️ Cover Image: User voted:', agree);
    try {
      if (!votingData?.vote_id) {
        console.error('❌ Cover Image: No vote ID available');
        showInfoToast('Cannot vote - no vote ID available');
        return;
      }

      if (collaborationService.isConnected()) {
        await collaborationService.voteToSave(votingData.vote_id, agree);
        console.log('✅ Cover Image: Vote sent successfully');
      } else {
        console.error('❌ Cover Image: Cannot vote - not connected');
        showInfoToast('Cannot vote - not connected to collaboration session');
      }
    } catch (error) {
      console.error('❌ Cover Image: Failed to send vote:', error);
      showInfoToast('Failed to send vote');
    }
  };

  const handleVoteInitiated = async (message: any) => {
    console.log('🗳️ Cover Image: Vote initiated:', message);
    
    // Fetch fresh participant list before showing voting modal
    if (currentSessionId) {
      try {
        const presenceData = await collaborationService.getPresence(currentSessionId);
        setParticipants(presenceData.participants || []);
      } catch (error) {
        console.error('Cover Image: Failed to fetch participants for voting:', error);
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
      console.log('🚀 Cover Image: Vote initiator auto-voting YES');
      setShowSavingOverlay(false);
      setTimeout(() => {
        handleVote(true);
      }, 500);
    }
  };

  const handleVoteUpdate = (message: any) => {
    console.log('🗳️ Cover Image: Vote update received:', message);
    
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
    
    console.log('🗳️ Cover Image: Vote result received:', {
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
        console.log('✅ Cover Image: Vote initiator - saving canvas and navigating back');
        showInfoToast('Vote passed! Saving canvas...');
        
        // Save canvas data
        if (drawingEngineRef.current && storyId) {
          const canvasData = drawingEngineRef.current.getCanvasData();
          updateStory(storyId, { coverImage: canvasData });
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
        }, 1000);
      } else {
        // Other participants: Show saving overlay
        const initiatorName = votingData?.initiated_by_username || 'Host';
        console.log('⏳ Cover Image: Other participant - showing saving overlay');
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

      {/* Remote Cursors - Cover Image Canvas Only */}
      {Array.from(remoteCursors.values()).map(cursor => (
        <div
          key={cursor.user_id}
          className="absolute pointer-events-none transition-all duration-75"
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 9998
          }}
        >
          <div
            className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
            style={{ backgroundColor: cursor.color }}
          />
          <div className="mt-1 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded whitespace-nowrap">
            {cursor.username}
          </div>
        </div>
      ))}

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
          {/* Zoom Controls */}
          <button 
            className="canvas-studio-topbar-btn"
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.1))}
            aria-label="Zoom out"
          >
            <MinusIcon className="canvas-studio-topbar-icon" />
          </button>
          <button className="canvas-studio-topbar-btn" onClick={handleResetZoom} aria-label="Fit to screen">
            <ArrowsPointingOutIcon className="canvas-studio-topbar-icon" />
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
          <button className="canvas-studio-topbar-btn" onClick={handleDone} aria-label="Save">
            <CheckIcon className="canvas-studio-topbar-icon" />
          </button>
          <button className="canvas-studio-topbar-btn" onClick={handleClose} aria-label="Download">
            <ArrowDownTrayIcon className="canvas-studio-topbar-icon" />
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

            {/* Brush Tool */}
            <button
              className={`canvas-studio-tool-btn ${activeTool === 'brush' ? 'canvas-studio-tool-btn-active' : ''}`}
              onClick={() => handleToolClick('brush')}
              aria-label="Brush"
            >
              <PaintBrushIcon className="canvas-studio-tool-icon" />
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

            {/* Shapes Tool */}
            <button
              className={`canvas-studio-tool-btn ${activeTool === 'shapes' ? 'canvas-studio-tool-btn-active' : ''}`}
              onClick={() => handleToolClick('shapes')}
              aria-label="Shapes"
            >
              <div className="canvas-square-icon" />
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

            {/* Move Tool */}
            <button
              className={`canvas-studio-tool-btn ${activeTool === 'move' ? 'canvas-studio-tool-btn-active' : ''}`}
              onClick={() => handleToolClick('move')}
              aria-label="Move"
            >
              <ArrowsPointingOutIcon className="canvas-studio-tool-icon" />
              <span className="canvas-studio-tool-label">Move</span>
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
          <div className={`canvas-studio-submenu ${isMobile ? 'canvas-studio-submenu-mobile' : ''}`}>
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
                  <PaintBrushIcon className="canvas-studio-submenu-icon" />
                  <span className="canvas-studio-submenu-label">{label}</span>
                  {activeBrush === type && <CheckIcon className="canvas-studio-submenu-check" />}
                </button>
              ))}
            </>
          )}
          {submenuTool === 'eraser' && (
            <>
              <button className="canvas-studio-submenu-item canvas-studio-submenu-item-active">
                <div className="canvas-eraser-icon" style={{ width: '1rem', height: '1rem' }} />
                <span className="canvas-studio-submenu-label">Soft Eraser</span>
                <CheckIcon className="canvas-studio-submenu-check" />
              </button>
              <button className="canvas-studio-submenu-item" onClick={() => { setActiveTool('eraser'); setShowToolSubmenu(false); }}>
                <div className="canvas-eraser-icon" style={{ width: '1rem', height: '1rem' }} />
                <span className="canvas-studio-submenu-label">Hard Eraser</span>
              </button>
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
                  {type === 'rectangle' && <div className="canvas-square-icon" style={{ width: '1rem', height: '1rem' }} />}
                  {type === 'circle' && <div className="canvas-circle-icon" style={{ width: '1rem', height: '1rem' }} />}
                  {type === 'line' && <div style={{ width: '1rem', height: '2px', background: 'currentColor' }} />}
                  {type === 'triangle' && <div style={{ width: 0, height: 0, borderLeft: '0.5rem solid transparent', borderRight: '0.5rem solid transparent', borderBottom: '0.866rem solid currentColor' }} />}
                  {type === 'star' && <span style={{ fontSize: '1rem' }}>★</span>}
                  {type === 'heart' && <span style={{ fontSize: '1rem' }}>♥</span>}
                  {type === 'arrow' && <span style={{ fontSize: '1rem' }}>→</span>}
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
      <div className={`canvas-studio-canvas-area ${isMobile ? 'canvas-studio-canvas-area-mobile' : ''}`}>
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
          </div>

          {/* Panel Content */}
          <div className="canvas-studio-panel-content">
            {activePanel === 'layers' && (
              <div className="canvas-studio-layers-list">
                <div className="canvas-studio-layer-item canvas-studio-layer-item-active">
                  <div className="canvas-studio-layer-thumbnail"></div>
                  <span className="canvas-studio-layer-name">Layer 1</span>
                </div>
                <div className="canvas-studio-layer-item">
                  <div className="canvas-studio-layer-thumbnail"></div>
                  <span className="canvas-studio-layer-name">Background</span>
                </div>
              </div>
            )}

            {activePanel === 'colors' && (
              <>
                {/* Custom Color Picker */}
                <div className="canvas-studio-color-section">
                  <h3 className="canvas-studio-color-section-title">Custom Color</h3>
                  <div className="canvas-studio-color-picker-container">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => handleColorSelect(e.target.value)}
                      className="canvas-studio-color-picker"
                    />
                    <span className="canvas-studio-color-hex">{selectedColor}</span>
                  </div>
                </div>

                {/* Recent Colors */}
                {recentColors.length > 0 && (
                  <div className="canvas-studio-color-section">
                    <h3 className="canvas-studio-color-section-title">Recent Colors</h3>
                    <div className="canvas-studio-colors-row">
                      {recentColors.map((color, index) => (
                        <button
                          key={`recent-${index}`}
                          className={`canvas-studio-color-swatch ${
                            color === selectedColor ? 'canvas-studio-color-swatch-active' : ''
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleColorSelect(color)}
                          aria-label={`Select recent color ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Predefined Colors */}
                <div className="canvas-studio-color-section">
                  <h3 className="canvas-studio-color-section-title">Colors</h3>
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
            <PaintBrushIcon className="canvas-studio-mobile-tool-icon" />
          </button>
          <button
            className={`canvas-studio-mobile-tool ${activeTool === 'eraser' ? 'canvas-studio-mobile-tool-active' : ''}`}
            onClick={() => handleToolClick('eraser')}
          >
            <div className="canvas-eraser-icon" />
          </button>
          <button
            className={`canvas-studio-mobile-tool ${activeTool === 'shapes' ? 'canvas-studio-mobile-tool-active' : ''}`}
            onClick={() => handleToolClick('shapes')}
          >
            <div className="canvas-square-icon" />
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
              style={{ backgroundColor: selectedColor }}
            />
          </button>
        </div>
      )}

      {/* Mobile Layers Modal */}
      {isMobile && showLayersModal && (
        <div className="canvas-studio-modal-overlay" onClick={() => setShowLayersModal(false)}>
          <div className="canvas-studio-modal" onClick={(e) => e.stopPropagation()}>
            <div className="canvas-studio-modal-header">
              <h3 className="canvas-studio-modal-title">Layers</h3>
              <button onClick={() => setShowLayersModal(false)}>
                <XMarkIcon className="canvas-studio-modal-close-icon" />
              </button>
            </div>
            <div className="canvas-studio-layers-list">
              <div className="canvas-studio-layer-item canvas-studio-layer-item-active">
                <div className="canvas-studio-layer-thumbnail"></div>
                <span className="canvas-studio-layer-name">Layer 1</span>
              </div>
              <div className="canvas-studio-layer-item">
                <div className="canvas-studio-layer-thumbnail"></div>
                <span className="canvas-studio-layer-name">Background</span>
              </div>
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
              {/* Custom Color Picker - Compact */}
              <div className="canvas-studio-color-section-compact">
                <h4 className="canvas-studio-color-section-title">Custom Color</h4>
                <div className="canvas-studio-color-picker-row">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => {
                      handleColorChange(e.target.value);
                    }}
                    className="canvas-studio-color-wheel-compact"
                  />
                  <span className="canvas-studio-color-hex-compact">{selectedColor.toUpperCase()}</span>
                  <button
                    className="canvas-studio-color-apply-btn-compact"
                    onClick={() => {
                      // Add to recent colors and close modal
                      if (!recentColors.includes(selectedColor)) {
                        const newRecentColors = [selectedColor, ...recentColors.slice(0, 4)];
                        setRecentColors(newRecentColors);
                      }
                      setShowColorPicker(false);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Recent Colors */}
              {recentColors.length > 0 && (
                <div className="canvas-studio-color-section">
                  <h4 className="canvas-studio-color-section-title">Recent Colors</h4>
                  <div className="canvas-studio-colors-row">
                    {recentColors.map((color, index) => (
                      <button
                        key={`recent-${index}`}
                        className={`canvas-studio-color-swatch ${
                          color === selectedColor ? 'canvas-studio-color-swatch-active' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          handleColorSelect(color);
                          setShowColorPicker(false);
                        }}
                        aria-label={`Select recent color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Predefined Colors */}
              <div className="canvas-studio-color-section">
                <h4 className="canvas-studio-color-section-title">Palette</h4>
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
                        setShowColorPicker(false);
                      }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default CoverImageCanvasPage;
