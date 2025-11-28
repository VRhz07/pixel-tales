/**
 * Real-time Preview Canvas Component
 * Renders live drawing updates from collaborators without affecting the main canvas
 */
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface RealtimePreviewCanvasRef {
  renderDrawing: (drawingData: any) => void;
  clearPreview: () => void;
  updateCanvas: (canvasDataUrl?: string) => void;
  getCanvasDataUrl: () => string | null;
}

interface Props {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  zoomLevel?: number;
  panOffset?: { x: number; y: number };
}

export const RealtimePreviewCanvas = forwardRef<RealtimePreviewCanvasRef, Props>(({
  width = 500,
  height = 500,
  className = '',
  style = {},
  zoomLevel = 1,
  panOffset = { x: 0, y: 0 }
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundContextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize canvases
  useEffect(() => {
    const canvas = canvasRef.current;
    const backgroundCanvas = backgroundCanvasRef.current;
    
    if (canvas && backgroundCanvas) {
      // Set up main preview canvas
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        contextRef.current = ctx;
        ctx.imageSmoothingEnabled = true;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      // Set up background canvas for persistent drawings
      backgroundCanvas.width = width;
      backgroundCanvas.height = height;
      const bgCtx = backgroundCanvas.getContext('2d');
      if (bgCtx) {
        backgroundContextRef.current = bgCtx;
        bgCtx.imageSmoothingEnabled = true;
        bgCtx.lineCap = 'round';
        bgCtx.lineJoin = 'round';
      }
    }
  }, [width, height]);

  // Apply transformations based on zoom and pan
  const applyTransform = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    // Apply pan offset first
    ctx.translate(panOffset.x, panOffset.y);
    // Apply zoom from center
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-width / 2, -height / 2);
  };

  const restoreTransform = (ctx: CanvasRenderingContext2D) => {
    ctx.restore();
  };

  // Render a drawing operation
  const renderDrawing = (drawingData: any) => {
    const ctx = contextRef.current;
    const bgCtx = backgroundContextRef.current;
    if (!ctx || !drawingData) return;

    try {
      // Render to BOTH foreground and background canvases
      // Foreground for immediate visual feedback
      applyTransform(ctx);
      renderDrawingToContext(ctx, drawingData);
      restoreTransform(ctx);

      // Background for persistence
      if (bgCtx) {
        applyTransform(bgCtx);
        renderDrawingToContext(bgCtx, drawingData);
        restoreTransform(bgCtx);
      }
    } catch (error) {
      console.error('Error rendering drawing:', error);
      if (ctx) restoreTransform(ctx);
      if (bgCtx) restoreTransform(bgCtx);
    }
  };

  // Helper to render drawing to a specific context
  const renderDrawingToContext = (ctx: CanvasRenderingContext2D, drawingData: any) => {
    // Handle different drawing types
    switch (drawingData.type) {
      case 'path':
      case 'brush':
        renderBrushStroke(ctx, drawingData);
        break;
      case 'shape':
        renderShape(ctx, drawingData);
        break;
      case 'text':
        renderText(ctx, drawingData);
        break;
      case 'eraser':
        renderEraser(ctx, drawingData);
        break;
      default:
        console.log('Unknown drawing type:', drawingData.type);
    }
  };

  // Render brush stroke
  const renderBrushStroke = (ctx: CanvasRenderingContext2D, data: any) => {
    const { points, color, strokeWidth, brushType } = data;
    
    if (!points || points.length === 0) return;

    ctx.beginPath();
    ctx.strokeStyle = color || '#000000';
    ctx.lineWidth = strokeWidth || 2;
    
    // Apply brush-specific properties
    switch (brushType) {
      case 'soft':
        ctx.shadowColor = color || '#000000';
        ctx.shadowBlur = (strokeWidth || 2) / 2;
        break;
      case 'marker':
        ctx.globalAlpha = 0.7;
        break;
      case 'airbrush':
        ctx.shadowColor = color || '#000000';
        ctx.shadowBlur = strokeWidth || 2;
        break;
      default:
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    // Draw the path
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Reset properties
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  };

  // Render shape
  const renderShape = (ctx: CanvasRenderingContext2D, data: any) => {
    const { shapeType, bounds, color, strokeWidth, filled } = data;
    
    if (!bounds) return;

    ctx.strokeStyle = color || '#000000';
    ctx.lineWidth = strokeWidth || 2;
    
    if (filled) {
      ctx.fillStyle = color || '#000000';
    }

    switch (shapeType) {
      case 'rectangle':
        if (filled) {
          ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        } else {
          ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }
        break;
      case 'circle':
        ctx.beginPath();
        const radius = Math.min(bounds.width, bounds.height) / 2;
        ctx.arc(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, radius, 0, 2 * Math.PI);
        if (filled) {
          ctx.fill();
        } else {
          ctx.stroke();
        }
        break;
      case 'line':
        ctx.beginPath();
        ctx.moveTo(bounds.x, bounds.y);
        ctx.lineTo(bounds.x + bounds.width, bounds.y + bounds.height);
        ctx.stroke();
        break;
      // Add more shapes as needed
    }
  };

  // Render text
  const renderText = (ctx: CanvasRenderingContext2D, data: any) => {
    const { text, x, y, fontSize, fontFamily, color } = data;
    
    if (!text) return;

    ctx.fillStyle = color || '#000000';
    ctx.font = `${fontSize || 16}px ${fontFamily || 'Arial'}`;
    ctx.fillText(text, x || 0, y || 0);
  };

  // Render eraser
  const renderEraser = (ctx: CanvasRenderingContext2D, data: any) => {
    const { points, size } = data;
    
    if (!points || points.length === 0) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = size || 10;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    
    ctx.globalCompositeOperation = 'source-over';
  };

  // Clear the preview canvas
  const clearPreview = () => {
    const ctx = contextRef.current;
    const bgCtx = backgroundContextRef.current;
    
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
    }
    if (bgCtx) {
      bgCtx.clearRect(0, 0, width, height);
    }
  };

  // Update canvas with base image or canvas data
  const updateCanvas = (canvasDataUrl?: string) => {
    const bgCtx = backgroundContextRef.current;
    if (!bgCtx) return;

    if (canvasDataUrl) {
      const img = new Image();
      img.onload = () => {
        bgCtx.clearRect(0, 0, width, height);
        applyTransform(bgCtx);
        bgCtx.drawImage(img, 0, 0);
        restoreTransform(bgCtx);
      };
      img.src = canvasDataUrl;
    } else {
      bgCtx.clearRect(0, 0, width, height);
    }
  };

  // Get canvas data URL for thumbnail generation
  const getCanvasDataUrl = (): string | null => {
    const bgCanvas = backgroundCanvasRef.current;
    if (!bgCanvas) return null;
    
    try {
      return bgCanvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error getting canvas data URL:', error);
      return null;
    }
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    renderDrawing,
    clearPreview,
    updateCanvas,
    getCanvasDataUrl
  }));

  // Combine the canvases for display
  const combinedStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    ...style
  };

  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none'
    // Don't set width/height in style - let CSS handle it via className
  };

  return (
    <div className={`realtime-preview-canvas ${className}`} style={combinedStyle}>
      {/* Background canvas for persistent drawings */}
      <canvas
        ref={backgroundCanvasRef}
        className="preview-canvas-layer"
        style={{ ...canvasStyle, zIndex: 1 }}
        width={width}
        height={height}
      />
      {/* Foreground canvas for live updates */}
      <canvas
        ref={canvasRef}
        className="preview-canvas-layer"
        style={{ ...canvasStyle, zIndex: 2 }}
        width={width}
        height={height}
      />
    </div>
  );
});

RealtimePreviewCanvas.displayName = 'RealtimePreviewCanvas';