import paper from 'paper';
import { CanvaStyleTransform } from './CanvaStyleTransform';

export type DrawingTool = 'brush' | 'eraser' | 'fill' | 'select' | 'rectangle' | 'circle' | 'line' | 'triangle' | 'star' | 'heart' | 'arrow';
export type BrushType = 'soft' | 'round' | 'pencil' | 'marker' | 'airbrush';

export interface DrawingState {
  projectData: any;
}

export class CoverImageDrawingEngine {
  private canvas: HTMLCanvasElement;
  private scope: paper.PaperScope;
  private tool: paper.Tool;
  private currentTool: DrawingTool = 'brush';
  private currentColor = '#000000';
  private currentSize = 5;
  private unscaledSize = 5; // Store the original size before scaling
  private currentBrushType: BrushType = 'round';
  private currentOpacity = 1;
  private shapeFilled = false;
  private isDrawing = false;
  private currentPath: paper.Path | null = null;
  private shapeStartPoint: paper.Point | null = null;
  private currentClickableArea: paper.Path | null = null;
  private undoStack: any[] = [];
  private redoStack: any[] = [];
  private maxUndoSteps = 50;
  private zoomLevel = 1;
  private panOffset = { x: 0, y: 0 };
  private transformSystem: CanvaStyleTransform;
  private isDrawingBlocked = false;
  
  // Store bound function references for proper cleanup
  private boundHandleRawMouseDown!: (e: MouseEvent) => void;
  private boundHandleRawMouseMove!: (e: MouseEvent) => void;
  private boundHandleRawMouseUp!: (e: MouseEvent) => void;
  private boundHandleRawTouchStart!: (e: TouchEvent) => void;
  private boundHandleRawTouchMove!: (e: TouchEvent) => void;
  private boundHandleRawTouchEnd!: (e: TouchEvent) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scope = new paper.PaperScope();
    
    // ALWAYS use 500px to match CSS fixed size
    // This prevents resize events when CSS applies
    const displayWidth = 500;
    const displayHeight = 500;
    
    
    // Set canvas PIXEL dimensions to match VISUAL dimensions
    // This ensures 1:1 pixel ratio and accurate coordinate mapping
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    
    this.scope.setup(canvas);
    this.scope.view.viewSize = new this.scope.Size(displayWidth, displayHeight);
    
    // Initialize the professional transform system
    this.transformSystem = new CanvaStyleTransform(this.scope);
    
    this.tool = new this.scope.Tool();
    this.setupEventHandlers();
    this.createBackground();
    this.saveState();
  }

  private setupEventHandlers() {
    // Store bound functions so we can remove them later
    this.boundHandleRawMouseDown = this.handleRawMouseDown.bind(this);
    this.boundHandleRawMouseMove = this.handleRawMouseMove.bind(this);
    this.boundHandleRawMouseUp = this.handleRawMouseUp.bind(this);
    this.boundHandleRawTouchStart = this.handleRawTouchStart.bind(this);
    this.boundHandleRawTouchMove = this.handleRawTouchMove.bind(this);
    this.boundHandleRawTouchEnd = this.handleRawTouchEnd.bind(this);
    
    // Add event listeners using the stored bound functions
    this.canvas.addEventListener('mousedown', this.boundHandleRawMouseDown);
    this.canvas.addEventListener('mousemove', this.boundHandleRawMouseMove);
    this.canvas.addEventListener('mouseup', this.boundHandleRawMouseUp);
    this.canvas.addEventListener('touchstart', this.boundHandleRawTouchStart);
    this.canvas.addEventListener('touchmove', this.boundHandleRawTouchMove);
    this.canvas.addEventListener('touchend', this.boundHandleRawTouchEnd);
  }

  private handleMouseDown(event: paper.ToolEvent) {
    const point = event.point; // getCanvasPoint already handled coordinate conversion
    
    // Block drawing if temporarily disabled (e.g., after two-finger gesture)
    if (this.isDrawingBlocked) {
      return;
    }
    
    // If we're in select mode, use the transform system
    if (this.currentTool === 'select') {
      const handled = this.transformSystem.handleMouseDown(point);
      if (handled) {
        return;
      }
    }
    
    // If transform system is active, don't start drawing
    if (this.transformSystem.isActive()) {
      return;
    }
    
    this.isDrawing = true;
    
    switch (this.currentTool) {
      case 'brush':
        this.startBrushStroke(point);
        break;
      case 'eraser':
        this.startEraser(point);
        break;
      case 'line':
        this.startLine(point);
        break;
      case 'rectangle':
        this.startRectangle(point);
        break;
      case 'circle':
        this.startCircle(point);
        break;
      case 'triangle':
        this.startTriangle(point);
        break;
      case 'star':
        this.startStar(point);
        break;
      case 'heart':
        this.startHeart(point);
        break;
      case 'arrow':
        this.startArrow(point);
        break;
      case 'fill':
        this.floodFill(point);
        break;
    }
  }

  private handleMouseDrag(event: paper.ToolEvent) {
    const point = event.point; // getCanvasPoint already handled coordinate conversion
    
    // Handle transform operations
    if (this.currentTool === 'select') {
      this.transformSystem.handleMouseDrag(point);
      return;
    }
    
    if (!this.isDrawing) return;

    switch (this.currentTool) {
      case 'brush':
      case 'eraser':
        this.continueBrushStroke(point);
        break;
      case 'line':
      case 'rectangle':
      case 'circle':
      case 'triangle':
      case 'star':
      case 'heart':
      case 'arrow':
        this.updateShape(point);
        break;
    }
  }

  private handleMouseUp(event: paper.ToolEvent) {
    // Handle transform system mouse up
    if (this.currentTool === 'select') {
      this.transformSystem.handleMouseUp();
    }
    
    if (!this.isDrawing) return;
    
    this.isDrawing = false;
    
    if (this.currentPath) {
      // Create invisible clickable area for hollow shapes only (not for brush strokes or filled shapes)
      if (this.currentTool !== 'brush' && this.currentTool !== 'eraser' && !this.shapeFilled) {
        this.createClickableArea(this.currentPath);
      }
      
      this.currentPath = null;
      this.shapeStartPoint = null;
      this.currentClickableArea = null;
      this.saveState();
    }
  }

  private startBrushStroke(point: paper.Point) {
    this.currentPath = new this.scope.Path();
    this.currentPath.strokeColor = new this.scope.Color(this.currentColor);
    this.applyBrushStyle(this.currentPath);
    this.currentPath.add(point);
  }

  private applyBrushStyle(path: paper.Path) {
    switch (this.currentBrushType) {
      case 'soft':
        path.strokeWidth = this.currentSize;
        path.strokeCap = 'round';
        path.strokeJoin = 'round';
        path.opacity = this.currentOpacity * 0.7; // Softer opacity
        break;
      case 'round':
        path.strokeWidth = this.currentSize;
        path.strokeCap = 'round';
        path.strokeJoin = 'round';
        path.opacity = this.currentOpacity;
        break;
      case 'pencil':
        path.strokeWidth = Math.max(1, this.currentSize * 0.7); // Thinner
        path.strokeCap = 'round';
        path.strokeJoin = 'round';
        path.opacity = this.currentOpacity * 0.9;
        break;
      case 'marker':
        path.strokeWidth = this.currentSize * 1.5; // Thicker
        path.strokeCap = 'square';
        path.strokeJoin = 'miter';
        path.opacity = this.currentOpacity * 0.8;
        break;
      case 'airbrush':
        path.strokeWidth = this.currentSize * 2; // Much thicker
        path.strokeCap = 'round';
        path.strokeJoin = 'round';
        path.opacity = this.currentOpacity * 0.3; // Very transparent
        break;
      default:
        path.strokeWidth = this.currentSize;
        path.strokeCap = 'round';
        path.strokeJoin = 'round';
        path.opacity = this.currentOpacity;
    }
  }

  private continueBrushStroke(point: paper.Point) {
    if (this.currentPath) {
      // For airbrush, create multiple overlapping strokes for texture
      if (this.currentBrushType === 'airbrush') {
        this.createAirbrushEffect(point);
      } else {
        this.currentPath.add(point);
      }
    }
  }

  private createAirbrushEffect(point: paper.Point) {
    if (!this.currentPath) return;
    
    // Add main stroke
    this.currentPath.add(point);
    
    // Add some random offset strokes for airbrush texture
    const numDots = 3;
    const spread = this.currentSize * 0.5;
    
    for (let i = 0; i < numDots; i++) {
      const offsetX = (Math.random() - 0.5) * spread;
      const offsetY = (Math.random() - 0.5) * spread;
      const dotPoint = point.add([offsetX, offsetY]);
      
      const dot = new this.scope.Path.Circle({
        center: dotPoint,
        radius: Math.random() * (this.currentSize * 0.3) + 1,
        fillColor: new this.scope.Color(this.currentColor),
        opacity: this.currentOpacity * 0.1
      });
    }
  }

  private startEraser(point: paper.Point) {
    this.currentPath = new this.scope.Path();
    this.currentPath.strokeColor = new this.scope.Color('#FFFFFF');
    this.currentPath.strokeWidth = this.currentSize * 2;
    this.currentPath.strokeCap = 'round';
    this.currentPath.add(point);
  }

  private startLine(point: paper.Point) {
    this.shapeStartPoint = point.clone();
    // Don't create initial path - wait for first drag
    this.currentPath = null;
  }

  private updateArrow(start: paper.Point, end: paper.Point) {
    const length = start.getDistance(end);
    if (length < 5) {
      // Don't create arrow if drag distance is too small
      return;
    }
    
    // Remove old arrow if it exists
    if (this.currentPath) {
      this.currentPath.remove();
    }
    
    // Calculate arrowhead size - scale with brush size
    const baseHeadSize = Math.min(length * 0.25, 20);
    const headSize = Math.max(baseHeadSize, this.currentSize * 1.5); // Scale with brush size
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    
    // Calculate arrowhead points
    const arrowAngle = Math.PI / 6; // 30 degrees
    
    const leftPoint = new this.scope.Point(
      end.x - headSize * Math.cos(angle - arrowAngle),
      end.y - headSize * Math.sin(angle - arrowAngle)
    );
    
    const rightPoint = new this.scope.Point(
      end.x - headSize * Math.cos(angle + arrowAngle),
      end.y - headSize * Math.sin(angle + arrowAngle)
    );
    
    // Calculate shaft end point (where arrowhead starts)
    const shaftEnd = new this.scope.Point(
      end.x - (headSize * 0.7) * Math.cos(angle),
      end.y - (headSize * 0.7) * Math.sin(angle)
    );
    
    // Create arrow shaft (line) - ends before arrowhead
    const shaft = new this.scope.Path.Line({
      from: start,
      to: shaftEnd,
      strokeColor: this.currentColor,
      strokeWidth: this.currentSize,
      strokeCap: 'round'
    });
    
    // Create filled arrowhead triangle
    const arrowhead = new this.scope.Path();
    arrowhead.moveTo(leftPoint);
    arrowhead.lineTo(end);
    arrowhead.lineTo(rightPoint);
    arrowhead.closePath();
    arrowhead.fillColor = new this.scope.Color(this.currentColor);
    arrowhead.strokeColor = new this.scope.Color(this.currentColor);
    arrowhead.strokeWidth = Math.max(1, this.currentSize * 0.5); // Scale stroke with brush size
    
    // Group them together and update currentPath reference
    const group = new this.scope.Group([shaft, arrowhead]);
    this.currentPath = group as any;
  }

  private startRectangle(point: paper.Point) {
    this.shapeStartPoint = point.clone();
    // Don't create initial path - wait for first drag
    // This prevents the tiny initial rectangle from appearing as a curve
    this.currentPath = null;
  }

  private startCircle(point: paper.Point) {
    this.shapeStartPoint = point.clone();
    // Don't create initial path - wait for first drag
    this.currentPath = null;
  }

  private startTriangle(point: paper.Point) {
    this.shapeStartPoint = point.clone();
    // Don't create initial path - wait for first drag
    this.currentPath = null;
  }

  private startStar(point: paper.Point) {
    this.shapeStartPoint = point.clone();
    // Don't create initial path - wait for first drag
    this.currentPath = null;
  }

  private startHeart(point: paper.Point) {
    this.shapeStartPoint = point.clone();
    // Don't create initial path - wait for first drag
    this.currentPath = null;
  }

  private startArrow(point: paper.Point) {
    this.shapeStartPoint = point.clone();
    // Don't create initial path - wait for first drag
    this.currentPath = null;
  }

  private updateShape(point: paper.Point) {
    if (!this.shapeStartPoint) return;

    const startPoint = this.shapeStartPoint;
    const width = Math.abs(point.x - startPoint.x);
    const height = Math.abs(point.y - startPoint.y);
    const size = Math.max(width, height);
    const radius = size / 2;

    // Remove current shape if it exists, then recreate with new size
    if (this.currentPath) {
      this.currentPath.remove();
    }

    switch (this.currentTool) {
      case 'line':
        this.currentPath = new this.scope.Path.Line({
          from: startPoint,
          to: point,
          strokeColor: this.currentColor,
          strokeWidth: this.currentSize,
          strokeCap: 'round'
        });
        break;
      case 'rectangle':
        // Create rectangle manually using path segments
        this.currentPath = new this.scope.Path();
        this.currentPath.strokeColor = new this.scope.Color(this.currentColor);
        this.currentPath.strokeWidth = this.currentSize;
        
        // Add fill if enabled
        if (this.shapeFilled) {
          this.currentPath.fillColor = new this.scope.Color(this.currentColor);
        }
        
        // Create rectangle corners
        const topLeft = new this.scope.Point(Math.min(startPoint.x, point.x), Math.min(startPoint.y, point.y));
        const bottomRight = new this.scope.Point(Math.max(startPoint.x, point.x), Math.max(startPoint.y, point.y));
        const topRight = new this.scope.Point(bottomRight.x, topLeft.y);
        const bottomLeft = new this.scope.Point(topLeft.x, bottomRight.y);
        
        // Draw rectangle
        this.currentPath.moveTo(topLeft);
        this.currentPath.lineTo(topRight);
        this.currentPath.lineTo(bottomRight);
        this.currentPath.lineTo(bottomLeft);
        this.currentPath.closePath();
        break;
      case 'circle':
        this.currentPath = new this.scope.Path.Circle({
          center: startPoint,
          radius: Math.max(radius, 5),
          strokeColor: this.currentColor,
          strokeWidth: this.currentSize,
          fillColor: this.shapeFilled ? this.currentColor : null
        });
        break;
      case 'triangle':
        this.currentPath = new this.scope.Path.RegularPolygon({
          center: startPoint,
          sides: 3,
          radius: Math.max(radius, 5),
          strokeColor: this.currentColor,
          strokeWidth: this.currentSize,
          fillColor: this.shapeFilled ? this.currentColor : null
        });
        break;
      case 'star':
        this.currentPath = new this.scope.Path.Star({
          center: startPoint,
          points: 5,
          radius1: Math.max(radius * 0.6, 3),
          radius2: Math.max(radius, 5),
          strokeColor: this.currentColor,
          strokeWidth: this.currentSize,
          fillColor: this.shapeFilled ? this.currentColor : null
        });
        break;
      case 'heart':
        // Create a proper heart shape
        const heart = new this.scope.Path();
        heart.strokeColor = new this.scope.Color(this.currentColor);
        heart.strokeWidth = this.currentSize;
        
        // Add fill if enabled
        if (this.shapeFilled) {
          heart.fillColor = new this.scope.Color(this.currentColor);
        }
        
        const heartSize = Math.max(radius / 3, 8);
        const center = startPoint;
        
        // Heart shape using proper curves
        // Start at bottom point
        heart.moveTo(center.add([0, heartSize]));
        
        // Left curve (left lobe of heart)
        heart.curveTo(
          center.add([-heartSize * 1.5, 0]),
          center.add([-heartSize * 0.7, -heartSize * 0.7])
        );
        heart.curveTo(
          center.add([-heartSize * 0.3, -heartSize]),
          center.add([0, -heartSize * 0.3])
        );
        
        // Right curve (right lobe of heart)
        heart.curveTo(
          center.add([heartSize * 0.3, -heartSize]),
          center.add([heartSize * 0.7, -heartSize * 0.7])
        );
        heart.curveTo(
          center.add([heartSize * 1.5, 0]),
          center.add([0, heartSize])
        );
        
        heart.closePath();
        this.currentPath = heart;
        break;
      case 'arrow':
        this.updateArrow(startPoint, point);
        break;
    }
  }

  private floodFill(point: paper.Point) {
    // Simple flood fill - fill entire canvas
    const background = new this.scope.Path.Rectangle({
      from: [0, 0],
      to: [this.scope.view.size.width, this.scope.view.size.height]
    });
    background.fillColor = new this.scope.Color(this.currentColor);
    background.data = { isBackground: true };
    background.sendToBack();
    this.saveState();
  }

  private createBackground() {
    // Create white background
    const background = new this.scope.Path.Rectangle({
      from: [0, 0],
      to: [this.scope.view.size.width, this.scope.view.size.height]
    });
    background.fillColor = new this.scope.Color('#FFFFFF');
    background.data = { isBackground: true };
    background.sendToBack();
  }

  // Convert screen coordinates to canvas coordinates accounting for CSS transform
  private getCanvasPoint(clientX: number, clientY: number): paper.Point {
    const rect = this.canvas.getBoundingClientRect();
    
    // Get position relative to canvas element (in screen pixels)
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    
    // Convert from screen pixels to canvas pixels
    // The canvas is scaled by CSS, so we need to account for that
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    const canvasX = screenX * scaleX;
    const canvasY = screenY * scaleY;
    
    return new this.scope.Point(canvasX, canvasY);
  }
  
  // Raw mouse event handlers
  private handleRawMouseDown(e: MouseEvent) {
    if (e.button !== 0) return; // Only left click
    if (this.isDrawingBlocked) return; // Block if disabled
    const point = this.getCanvasPoint(e.clientX, e.clientY);
    this.handleMouseDown({ point } as any);
  }
  
  private handleRawMouseMove(e: MouseEvent) {
    if (e.buttons === 1) { // Left button is pressed
      const point = this.getCanvasPoint(e.clientX, e.clientY);
      this.handleMouseDrag({ point } as any);
    }
  }
  
  private handleRawMouseUp(e: MouseEvent) {
    const point = this.getCanvasPoint(e.clientX, e.clientY);
    this.handleMouseUp({ point } as any);
  }
  
  private handleRawTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      if (this.isDrawingBlocked) return; // Block if disabled
      e.preventDefault();
      const touch = e.touches[0];
      const point = this.getCanvasPoint(touch.clientX, touch.clientY);
      this.handleMouseDown({ point } as any);
    }
  }
  
  private handleRawTouchMove(e: TouchEvent) {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const point = this.getCanvasPoint(touch.clientX, touch.clientY);
      this.handleMouseDrag({ point } as any);
    }
  }
  
  private handleRawTouchEnd(e: TouchEvent) {
    e.preventDefault();
    const point = this.getCanvasPoint(0, 0); // Dummy point for touch end
    this.handleMouseUp({ point } as any);
  }
  
  // NOTE: transformPoint is no longer needed!
  // getCanvasPoint() already handles all coordinate conversion from screen to canvas,
  // accounting for CSS scaling. The CSS transform (zoom/pan) is purely visual and
  // doesn't affect Paper.js coordinate space since we handle events directly.
  private transformPoint(point: paper.Point): paper.Point {
    return point; // No transformation needed - getCanvasPoint already did it
  }

  private saveState() {
    this.undoStack.push(this.scope.project.exportJSON());
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  // Public API methods
  setTool(tool: DrawingTool) {
    this.currentTool = tool;
    
    // Clear selection when switching away from select tool
    if (tool !== 'select') {
      this.transformSystem.clearSelection();
    }
  }

  setColor(color: string) {
    this.currentColor = color;
  }

  setSize(size: number) {
    // Store the unscaled size
    this.unscaledSize = size;
    
    // Scale brush size based on canvas dimensions
    // The canvas is now ~800px, so we scale up the brush size
    const scaleFactor = this.canvas.width / 400; // Assuming 400 was the old size
    const scaledSize = size * scaleFactor;
    this.currentSize = Math.max(1, Math.min(100, scaledSize));
    console.log(`🖌️ CoverImage Brush size: ${size}px → ${this.currentSize.toFixed(1)}px (scale: ${scaleFactor.toFixed(2)}x)`);
  }

  setBrushType(brushType: BrushType) {
    this.currentBrushType = brushType;
  }

  setOpacity(opacity: number) {
    this.currentOpacity = Math.max(0, Math.min(1, opacity));
  }

  setShapeFilled(filled: boolean) {
    this.shapeFilled = filled;
  }

  getShapeFilled(): boolean {
    return this.shapeFilled;
  }

  setDrawingBlocked(blocked: boolean) {
    this.isDrawingBlocked = blocked;
    
    // If blocking, force-end any active drawing
    if (blocked && this.isDrawing) {
      this.forceEndDrawing();
    }
  }
  
  forceEndDrawing() {
    // Force end any active drawing operation
    if (this.isDrawing) {
      this.isDrawing = false;
      
      // Finalize current path if it exists
      if (this.currentPath) {
        this.saveState();
        this.currentPath = null;
      }
      
      // Clear shape start point
      this.shapeStartPoint = null;
      this.currentClickableArea = null;
    }
  }

  setZoomAndPan(zoomLevel: number, panOffset: { x: number; y: number }) {
    this.zoomLevel = zoomLevel;
    this.panOffset = panOffset;
    
    // Don't apply to Paper.js view - CSS transform handles visual zoom
    // Keep Paper.js view at 1:1 scale for accurate coordinate mapping
    // The CSS transform on the container provides the visual zoom effect
  }

  undo() {
    if (this.undoStack.length > 1) {
      const currentState = this.undoStack.pop()!;
      this.redoStack.push(currentState);
      const previousState = this.undoStack[this.undoStack.length - 1];
      this.scope.project.clear();
      this.scope.project.importJSON(previousState);
      this.transformSystem.clearSelection();
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const nextState = this.redoStack.pop()!;
      this.undoStack.push(nextState);
      this.scope.project.clear();
      this.scope.project.importJSON(nextState);
      this.transformSystem.clearSelection();
    }
  }

  clearCanvas() {
    this.scope.project.clear();
    this.createBackground();
    this.transformSystem.clearSelection();
    this.saveState();
  }

  getCanvasData(): string {
    return this.canvas.toDataURL('image/png');
  }

  loadCanvasData(dataUrl: string, onComplete?: () => void) {
    const img = new Image();
    img.onload = () => {
      // FORCE canvas to 500px before loading
      const targetWidth = 500;
      const targetHeight = 500;
      
      // Ensure canvas is at correct size before loading
      if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;
        this.scope.view.viewSize = new this.scope.Size(targetWidth, targetHeight);
        
        // Recalculate brush size with correct canvas dimensions
        this.setSize(this.unscaledSize);
      }
      
      this.clearCanvas();
      const raster = new this.scope.Raster(img);
      
      // Scale the loaded image to fit the current canvas size
      const currentSize = Math.min(targetWidth, targetHeight);
      const imageSize = Math.max(img.width, img.height);
      const scale = currentSize / imageSize;
      
      
      raster.scale(scale);
      raster.position = this.scope.view.center;
      
      // Ensure canvas size hasn't changed
      if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;
        this.scope.view.viewSize = new this.scope.Size(targetWidth, targetHeight);
      }
      
      this.saveState();
      
      // Call completion callback if provided
      if (onComplete) {
        onComplete();
      }
    };
    img.src = dataUrl;
  }

  getDrawingState(): DrawingState {
    return {
      projectData: this.scope.project.exportJSON()
    };
  }

  loadDrawingState(state: DrawingState) {
    this.scope.project.clear();
    this.scope.project.importJSON(state.projectData);
    this.transformSystem.clearSelection();
  }

  resizeCanvas(size?: number) {
    // Store old dimensions for scaling
    const oldWidth = this.canvas.width;
    const oldHeight = this.canvas.height;
    
    // ALWAYS use 500px to match CSS fixed size
    const displayWidth = 500;
    const displayHeight = 500;
    
    // Safety check: ignore invalid sizes
    if (displayWidth < 100 || displayHeight < 100) {
      return;
    }
    
    // Safety check: ignore if size hasn't really changed
    if (Math.abs(oldWidth - displayWidth) < 5 && Math.abs(oldHeight - displayHeight) < 5) {
      return;
    }
    
    
    // Calculate scale factor
    const scaleX = displayWidth / oldWidth;
    const scaleY = displayHeight / oldHeight;
    
    // Safety check: ignore unreasonable scale factors (likely an error)
    if (scaleX < 0.1 || scaleX > 10 || scaleY < 0.1 || scaleY > 10) {
      // Just update canvas size without scaling content
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      this.scope.view.viewSize = new this.scope.Size(displayWidth, displayHeight);
      this.setSize(this.unscaledSize);
      this.redraw();
      return;
    }
    
    // Update pixel dimensions to match visual size (1:1 ratio)
    this.canvas.width = displayWidth;
    this.canvas.height = displayHeight;
    this.scope.view.viewSize = new this.scope.Size(displayWidth, displayHeight);
    
    // DON'T scale content - let drawings maintain their absolute size
    // Scaling causes cumulative errors when rotating repeatedly
    
    // Recalculate brush size with new canvas dimensions
    this.setSize(this.unscaledSize);
    
    // Force redraw after resize to show existing content
    this.redraw();
  }

  redraw() {
    // Force Paper.js to redraw all content
    if (this.scope && this.scope.project) {
      this.scope.project.activeLayer.visible = true;
      this.scope.view.update();
    }
  }

  private createClickableArea(shape: paper.Path): void {
    if (!shape || !shape.bounds) return;
    
    let clickableArea: paper.Path;
    
    // Create appropriate clickable area based on shape type
    if (this.currentTool === 'circle') {
      // For circles, create a filled circle
      const center = shape.bounds.center;
      const radius = Math.max(shape.bounds.width, shape.bounds.height) / 2;
      clickableArea = new this.scope.Path.Circle({
        center: center,
        radius: radius,
        fillColor: new this.scope.Color(0, 0, 0, 0.01), // Nearly transparent
        strokeColor: null
      });
    } else if (this.currentTool === 'heart') {
      // For hearts, create a filled version of the same shape
      clickableArea = shape.clone();
      clickableArea.fillColor = new this.scope.Color(0, 0, 0, 0.01);
      clickableArea.strokeColor = null;
    } else {
      // For other shapes, use rectangular bounds
      clickableArea = new this.scope.Path.Rectangle({
        rectangle: shape.bounds,
        fillColor: new this.scope.Color(0, 0, 0, 0.01), // Nearly transparent
        strokeColor: null
      });
    }
    
    // Position it behind the actual shape
    clickableArea.sendToBack();
    shape.bringToFront();
    
    // Group them together so they move as one unit
    const group = new this.scope.Group([clickableArea, shape]);
    
    // Mark the clickable area so transform system knows it's part of the shape
    clickableArea.data.isClickableArea = true;
    group.data.isDrawnShape = true;
  }

  destroy() {
    // Remove event listeners using the stored bound functions
    this.canvas.removeEventListener('mousedown', this.boundHandleRawMouseDown);
    this.canvas.removeEventListener('mousemove', this.boundHandleRawMouseMove);
    this.canvas.removeEventListener('mouseup', this.boundHandleRawMouseUp);
    this.canvas.removeEventListener('touchstart', this.boundHandleRawTouchStart);
    this.canvas.removeEventListener('touchmove', this.boundHandleRawTouchMove);
    this.canvas.removeEventListener('touchend', this.boundHandleRawTouchEnd);
    
    this.transformSystem.destroy();
    this.scope.project.clear();
  }
}
