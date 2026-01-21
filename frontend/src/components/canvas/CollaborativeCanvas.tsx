/**
 * Collaborative Canvas Component
 * Example integration of collaboration features with Paper.js canvas
 */
import React, { useEffect, useRef, useState } from 'react';
import paper from 'paper';
import CollaborationPanel from './CollaborationPanel';
import { collaborationService } from '../../services/collaborationService';
import ReconnectingModal from '../collaboration/ReconnectingModal';

interface RemoteCursor {
  user_id: number;
  username: string;
  color: string;
  x: number;
  y: number;
}

export const CollaborativeCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scopeRef = useRef<paper.PaperScope | null>(null);
  const [remoteCursors, setRemoteCursors] = useState<Map<number, RemoteCursor>>(new Map());
  // Store user colors separately to persist across cursor updates
  const userColorsRef = useRef<Map<number, string>>(new Map());
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const cursorUpdateThrottle = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Paper.js
    const scope = new paper.PaperScope();
    scope.setup(canvasRef.current);
    scopeRef.current = scope;

    // Set up drawing tool
    const tool = new scope.Tool();
    let path: paper.Path | null = null;

    tool.onMouseDown = (event: paper.ToolEvent) => {
      path = new scope.Path({
        segments: [event.point],
        strokeColor: new scope.Color('#000000'),
        strokeWidth: 2
      });
    };

    tool.onMouseDrag = (event: paper.ToolEvent) => {
      if (path) {
        path.add(event.point);
        
        // Send drawing data to collaborators
        if (isCollaborating && collaborationService.isConnected()) {
          collaborationService.sendDrawing({
            type: 'path',
            points: path.segments.map(s => ({ x: s.point.x, y: s.point.y })),
            color: '#000000',
            strokeWidth: 2
          });
        }
      }
    };

    tool.onMouseUp = () => {
      if (path) {
        path.simplify(10);
        path = null;
      }
    };

    // Track mouse movement for cursor sharing
    tool.onMouseMove = (event: paper.ToolEvent) => {
      if (isCollaborating && collaborationService.isConnected()) {
        const now = Date.now();
        if (now - cursorUpdateThrottle.current > 50) { // Throttle to 20 updates/sec
          // Send presence with cursor position and current tool
          collaborationService.updatePresence({ x: event.point.x, y: event.point.y }, 'pencil');
          cursorUpdateThrottle.current = now;
        }
      }
    };

    return () => {
      scope.project.clear();
      scope.view.remove();
    };
  }, [isCollaborating]);

  useEffect(() => {
    // Handle remote drawing
    const handleRemoteDraw = (message: any) => {
      if (!scopeRef.current || !message.data) return;

      const scope = scopeRef.current;
      const { points, color, strokeWidth } = message.data;

      if (points && points.length > 0) {
        const remotePath = new scope.Path({
          segments: points.map((p: any) => new scope.Point(p.x, p.y)),
          strokeColor: new scope.Color(color || '#FF0000'),
          strokeWidth: strokeWidth || 2
        });
        remotePath.simplify(10);
        scope.view.update();
      }
    };

    // Handle remote cursor movement
    const handleRemoteCursor = (message: any) => {
      if (message.user_id && message.cursor_position) {
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
            x: message.cursor_position.x,
            y: message.cursor_position.y
          });
          return updated;
        });
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

    // Handle canvas clear
    const handleClear = () => {
      if (scopeRef.current) {
        scopeRef.current.project.activeLayer.removeChildren();
        scopeRef.current.view.update();
      }
    };

    collaborationService.on('draw', handleRemoteDraw);
    collaborationService.on('presence_update', handleRemoteCursor);
    collaborationService.on('user_joined', handleUserJoined);
    collaborationService.on('user_left', handleUserLeft);
    collaborationService.on('clear', handleClear);

    return () => {
      collaborationService.off('draw', handleRemoteDraw);
      collaborationService.off('presence_update', handleRemoteCursor);
      collaborationService.off('user_joined', handleUserJoined);
      collaborationService.off('user_left', handleUserLeft);
      collaborationService.off('clear', handleClear);
    };
  }, []);

  const handleSessionCreated = (sessionId: string) => {
    console.log('Session created:', sessionId);
    setIsCollaborating(true);
    
    // Set up reconnection state handler
    collaborationService.onReconnectStateChange = (reconnecting: boolean, attempt: number) => {
      setIsReconnecting(reconnecting);
      setReconnectAttempt(attempt);
    };
  };

  const handleSessionJoined = (sessionId: string) => {
    console.log('Session joined:', sessionId);
    setIsCollaborating(true);
    
    // Set up reconnection state handler
    collaborationService.onReconnectStateChange = (reconnecting: boolean, attempt: number) => {
      setIsReconnecting(reconnecting);
      setReconnectAttempt(attempt);
    };
  };

  const handleSessionEnded = () => {
    console.log('Session ended');
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

  const handleClearCanvas = () => {
    if (scopeRef.current) {
      scopeRef.current.project.activeLayer.removeChildren();
      scopeRef.current.view.update();
      
      if (isCollaborating && collaborationService.isConnected()) {
        collaborationService.clearCanvas();
      }
    }
  };

  return (
    <div className="relative w-full h-screen bg-gray-100">
      {/* Reconnecting Modal */}
      <ReconnectingModal
        isReconnecting={isReconnecting}
        reconnectAttempt={reconnectAttempt}
        maxAttempts={5}
        onCancel={handleCancelReconnect}
        onRetry={handleRetryReconnect}
      />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full bg-white cursor-crosshair"
        style={{ touchAction: 'none' }}
      />

      {/* Remote Cursors */}
      {Array.from(remoteCursors.values()).map(cursor => (
        <div
          key={cursor.user_id}
          className="absolute pointer-events-none transition-all duration-75"
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            transform: 'translate(-50%, -50%)'
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

      {/* Collaboration Panel */}
      <CollaborationPanel
        onSessionCreated={handleSessionCreated}
        onSessionJoined={handleSessionJoined}
        onSessionEnded={handleSessionEnded}
      />

      {/* Toolbar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex gap-2">
        <button
          onClick={handleClearCanvas}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
        >
          Clear Canvas
        </button>
        {isCollaborating && (
          <div className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Live
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="font-semibold text-gray-800 mb-2">Collaborative Drawing</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Click the collaboration button to start or join</li>
          <li>• Draw with your mouse or touch</li>
          <li>• See others drawing in real-time</li>
          <li>• Share the session ID with friends</li>
        </ul>
      </div>
    </div>
  );
};
