import paper from 'paper';
import { CanvaStyleTransform } from './CanvaStyleTransform';

export type DrawingTool = 'brush' | 'eraser' | 'fill' | 'select' | 'rectangle' | 'circle' | 'line' | 'triangle' | 'star' | 'heart' | 'arrow' | 'text';
export type BrushType = 'soft' | 'round' | 'pencil' | 'marker' | 'airbrush';

export interface GradientStop {
  color: string;
  position: number;
}

export interface GradientConfig {
  type: 'linear' | 'radial';
  angle: number;
  stops: GradientStop[];
}

export interface TextOptions {
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface DrawingState {
  projectData: any;
}

export interface LayerInfo {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  thumbnail: string;
  isBackground: boolean;
}

export class PaperDrawingEngine {
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
  private useGradient = false;
  private currentGradient: GradientConfig | null = null;
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
  private textClickPoint: paper.Point | null = null;
  private onTextInputRequest: ((point: { x: number; y: number }) => void) | null = null;
  private currentFontSize = 24;
  private currentFontFamily = 'Arial';
  private currentFontWeight = 'normal';
  private onDragStart: (() => void) | null = null;
  private onDragEnd: (() => void) | null = null;
  private onDragMove: ((point: { x: number; y: number }) => void) | null = null;
  private onLayersChanged: (() => void) | null = null;
  private layerIdCounter = 0;
  private layersChangedTimeout: number | null = null;
  
  // Collaboration callbacks
  private onDrawingComplete: ((data: any) => void) | null = null;
  private onCursorMove: ((x: number, y: number) => void) | null = null;
  
  // New collaboration enhancer callbacks
  private onTransformStart: ((itemId: string) => void) | null = null;
  private onTransform: ((itemId: string, data: any) => void) | null = null;
  private onTransformEnd: ((itemId: string) => void) | null = null;
  private onTextEdit: ((data: any) => void) | null = null;
  private onLayerOperation: ((operation: string, data: any) => void) | null = null;
  
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
    
    // CRITICAL: Set canvas dimensions BEFORE Paper.js setup
    // This ensures Paper.js doesn't apply device pixel ratio scaling
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    
    // Setup Paper.js with the canvas
    this.scope.setup(canvas);
    
    // Force Paper.js to use 1:1 pixel ratio by setting view size to match canvas pixel dimensions
    // This prevents scaling artifacts when rendering semi-transparent layers
    this.scope.view.viewSize = new this.scope.Size(displayWidth, displayHeight);
    
    // Override Paper.js's internal pixel ratio to prevent automatic scaling
    // Paper.js uses devicePixelRatio for high-DPI displays, but this causes rendering issues
    Object.defineProperty(this.scope.view, '_pixelRatio', {
      value: 1,
      writable: false,
      configurable: true
    });
    
    // Initialize with background layer
    this.initializeLayers();
    
    // Initialize the professional transform system with canvas dimensions
    this.transformSystem = new CanvaStyleTransform(this.scope, displayWidth, displayHeight);
    
    // Set up transform system callbacks for trash zone
    this.transformSystem.setDragCallbacks(
      () => {
        if (this.onDragStart) this.onDragStart();
      },
      () => {
        if (this.onDragEnd) this.onDragEnd();
      },
      (point) => {
        if (this.onDragMove) this.onDragMove(point);
      },
      () => {
        this.transformSystem.deleteSelectedItem();
        this.saveState();
      }
    );
    
    this.tool = new this.scope.Tool();
    // DON'T set up Paper.js's built-in event handlers - they don't account for CSS zoom
    // We use our own raw event handlers instead (setupEventHandlers below)
    // this.tool.onMouseDown = (event: paper.ToolEvent) => this.handleMouseDown(event);
    // this.tool.onMouseDrag = (event: paper.ToolEvent) => this.handleMouseDrag(event);
    // this.tool.onMouseUp = (event: paper.ToolEvent) => this.handleMouseUp(event);
    this.setupEventHandlers();
    // Background is already created in initializeLayers() - no need to create again
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
    
    // Add global event listeners for collaboration cursor tracking
    // This allows tracking cursor movements even when outside canvas during drawing
    document.addEventListener('mousemove', this.handleGlobalMouseMove);
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
      case 'text':
        this.startText(point);
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
      // Store path data for collaboration before any modifications
      const pathForCollaboration = this.currentPath;
      const toolForCollaboration = this.currentTool;
      
      // If eraser tool, perform actual erasing operation
      if (this.currentTool === 'eraser' && this.currentPath.data.isEraser) {
        this.performErase(this.currentPath);
        this.currentPath.remove(); // Remove the eraser path itself
      } else {
        // Apply gradient to brush stroke if needed
        if (this.currentPath.data.needsGradient && this.useGradient && this.currentGradient) {
          this.applyGradientToBrushStroke(this.currentPath);
        }
        
        // Apply gradient to shape stroke if needed
        if (this.currentPath.data.needsGradientStroke && this.useGradient && this.currentGradient) {
          this.currentPath.strokeColor = this.getFillColor(this.currentPath.bounds);
        }
        
        // Apply gradient to group children (for arrows)
        if (this.currentPath instanceof this.scope.Group && this.useGradient && this.currentGradient) {
          this.currentPath.children.forEach((child: any) => {
            if (child.data.needsGradientStroke) {
              if (child.strokeColor) {
                child.strokeColor = this.getFillColor(child.bounds);
              }
              if (child.fillColor) {
                child.fillColor = this.getFillColor(child.bounds);
              }
            }
          });
        }
        
        // Assign a unique ID to the drawn item for transform collaboration
        // Store in BOTH id and itemId fields for maximum compatibility
        if (!this.currentPath.data.id) {
          const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          this.currentPath.data.id = itemId;
          this.currentPath.data.itemId = itemId;
        }
        
        // Create invisible clickable area for hollow shapes only (not for brush strokes or filled shapes)
        if (this.currentTool !== 'brush' && this.currentTool !== 'eraser' && !this.shapeFilled) {
          this.createClickableArea(this.currentPath);
        }
        
        // Notify collaboration about completed drawing (ALL TOOLS NOW SUPPORTED)
        if (this.onDrawingComplete) {
          this.notifyDrawingComplete(pathForCollaboration, toolForCollaboration);
        }
      }
      
      this.currentPath = null;
      this.shapeStartPoint = null;
      this.currentClickableArea = null;
      this.saveState();
    }
  }
  
  private notifyDrawingComplete(path: paper.Path, tool: DrawingTool) {
    if (!this.onDrawingComplete || !path) return;
    
    // For shapes and complex objects, send full JSON representation
    // This allows remote clients to recreate the exact object
    try {
      const pathData: any = {
        type: tool,
        tool: tool
      };

      // CRITICAL: Include the item ID so remote clients can track this item for transforms
      if (path.data && path.data.id) {
        pathData.itemId = path.data.id;
      }

      // For heart and arrow shapes, export complete path data for accurate reconstruction
      if (tool === 'heart' || tool === 'arrow') {
        pathData.pathData = path.exportJSON({ asString: false });
        console.log('📦 Exported complete pathData for', tool);
      }
      
      // For paths with segments (brush, eraser, lines, simple shapes)
      if (path.segments && path.segments.length > 0) {
        pathData.points = path.segments.map((seg: any) => ({
          x: seg.point.x,
          y: seg.point.y
        }));
      }

      // For groups (arrows, complex shapes) - keep for backward compatibility
      if (path instanceof this.scope.Group) {
        pathData.isGroup = true;
        pathData.groupData = path.exportJSON({ asString: false });
      }

      // Visual properties
      if (path.strokeColor) {
        pathData.strokeColor = path.strokeColor.toCSS(true);
      }
      if (path.fillColor) {
        pathData.fillColor = this.serializeColor(path.fillColor);
      }
      pathData.strokeWidth = path.strokeWidth || this.currentSize;
      pathData.opacity = path.opacity || 1;
      pathData.filled = this.shapeFilled;

      // Shape-specific data
      if (tool === 'rectangle' || tool === 'circle' || tool === 'triangle' || 
          tool === 'star' || tool === 'heart' || tool === 'arrow' || tool === 'line') {
        pathData.shapeData = {
          bounds: {
            x: path.bounds.x,
            y: path.bounds.y,
            width: path.bounds.width,
            height: path.bounds.height
          },
          filled: this.shapeFilled
        };
      }

      console.log('📤 Sending drawing operation:', tool, pathData);
      this.onDrawingComplete(pathData);
    } catch (error) {
      console.error('❌ Failed to serialize drawing:', error);
    }
  }

  private serializeColor(color: any): any {
    if (!color) return null;
    
    // Check if it's a gradient
    if (color.gradient) {
      return {
        type: 'gradient',
        gradient: color.gradient,
        origin: color.origin ? { x: color.origin.x, y: color.origin.y } : null,
        destination: color.destination ? { x: color.destination.x, y: color.destination.y } : null
      };
    }
    
    // Regular color
    return color.toCSS ? color.toCSS(true) : color;
  }

  private startBrushStroke(point: paper.Point) {
    this.currentPath = new this.scope.Path();
    
    // For gradients, we'll need to convert to filled path later
    // For now, set stroke color (will be converted if gradient is active)
    if (this.useGradient && this.currentGradient) {
      // Store that this path needs gradient treatment
      this.currentPath.data.needsGradient = true;
      this.currentPath.strokeColor = new this.scope.Color(this.currentGradient.stops[0].color);
    } else {
      this.currentPath.strokeColor = new this.scope.Color(this.currentColor);
    }
    
    this.applyBrushStyle(this.currentPath);
    this.currentPath.add(point);
    
    // Explicitly add to active layer to ensure proper layer isolation
    this.scope.project.activeLayer.addChild(this.currentPath);
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
    // Create an eraser path that will be used to subtract from existing paths
    this.currentPath = new this.scope.Path();
    this.currentPath.strokeColor = new this.scope.Color('#FFFFFF'); // White for visibility
    this.currentPath.strokeWidth = this.currentSize * 2;
    this.currentPath.strokeCap = 'round';
    this.currentPath.strokeJoin = 'round';
    this.currentPath.opacity = 0.5;
    this.currentPath.data.isEraser = true;
    this.currentPath.add(point);
    
    // Explicitly add to active layer
    this.scope.project.activeLayer.addChild(this.currentPath);
  }

  private performErase(eraserPath: paper.Path) {
    const eraserWidth = this.currentSize * 2;
    
    // Get all items in the project
    const itemsToCheck = this.scope.project.activeLayer.children.slice();
    
    for (let i = itemsToCheck.length - 1; i >= 0; i--) {
      const item = itemsToCheck[i];
      
      // Skip background, eraser paths, and clickable areas
      if (item.data.isBackground || item.data.isEraser || item.data.isClickableArea) {
        continue;
      }
      
      // Check if item is a path or group
      if (item instanceof this.scope.Path) {
        this.eraseFromPath(item, eraserPath, eraserWidth);
      } else if (item instanceof this.scope.Group) {
        // For groups, check each child
        const children = item.children.slice();
        for (let j = children.length - 1; j >= 0; j--) {
          const child = children[j];
          if (child instanceof this.scope.Path && !child.data.isClickableArea) {
            this.eraseFromPath(child, eraserPath, eraserWidth);
          }
        }
        
        // Remove group if all children are gone
        if (item.children.length === 0) {
          item.remove();
        }
      }
    }
  }

  private eraseFromPath(path: paper.Path, eraserPath: paper.Path, eraserWidth: number) {
    // Check if any part of the path is within eraser distance
    const segmentsToRemove: number[] = [];
    
    // Check each segment of the path
    for (let i = 0; i < path.segments.length; i++) {
      const segment = path.segments[i];
      const point = segment.point;
      
      // Use Paper.js getNearestPoint to find closest point on eraser path
      const nearestPoint = eraserPath.getNearestPoint(point);
      const distance = point.getDistance(nearestPoint);
      
      // If segment is within eraser width, mark for removal
      if (distance < eraserWidth / 2) {
        segmentsToRemove.push(i);
      }
    }
    
    // If most segments should be removed, remove entire path
    if (segmentsToRemove.length > path.segments.length * 0.7) {
      path.remove();
      return;
    }
    
    // If no segments to remove, skip
    if (segmentsToRemove.length === 0) {
      return;
    }
    
    // Split path at erased segments
    // Group consecutive segments to remove
    const groups: number[][] = [];
    let currentGroup: number[] = [];
    
    for (let i = 0; i < segmentsToRemove.length; i++) {
      const idx = segmentsToRemove[i];
      
      if (currentGroup.length === 0 || idx === currentGroup[currentGroup.length - 1] + 1) {
        currentGroup.push(idx);
      } else {
        groups.push(currentGroup);
        currentGroup = [idx];
      }
    }
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    // Create new paths from the remaining segments
    const newPaths: paper.Path[] = [];
    let lastEnd = -1;
    
    for (const group of groups) {
      const start = group[0];
      const end = group[group.length - 1];
      
      // Create path from segments between last erased group and this one
      if (start > lastEnd + 1) {
        const newPath = new this.scope.Path();
        newPath.strokeColor = path.strokeColor;
        newPath.strokeWidth = path.strokeWidth;
        newPath.fillColor = path.fillColor;
        newPath.opacity = path.opacity;
        newPath.strokeCap = path.strokeCap;
        newPath.strokeJoin = path.strokeJoin;
        
        for (let i = lastEnd + 1; i < start; i++) {
          newPath.add(path.segments[i].point);
        }
        
        if (newPath.segments.length > 1) {
          newPaths.push(newPath);
        } else {
          newPath.remove();
        }
      }
      
      lastEnd = end;
    }
    
    // Add remaining segments after last erased group
    if (lastEnd < path.segments.length - 1) {
      const newPath = new this.scope.Path();
      newPath.strokeColor = path.strokeColor;
      newPath.strokeWidth = path.strokeWidth;
      newPath.fillColor = path.fillColor;
      newPath.opacity = path.opacity;
      newPath.strokeCap = path.strokeCap;
      newPath.strokeJoin = path.strokeJoin;
      
      for (let i = lastEnd + 1; i < path.segments.length; i++) {
        newPath.add(path.segments[i].point);
      }
      
      if (newPath.segments.length > 1) {
        newPaths.push(newPath);
      } else {
        newPath.remove();
      }
    }
    
    // Remove original path and keep new paths
    if (newPaths.length > 0) {
      path.remove();
    }
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
    const shaftColor = this.useGradient && this.currentGradient ? this.currentGradient.stops[0].color : this.currentColor;
    const shaft = new this.scope.Path.Line({
      from: start,
      to: shaftEnd,
      strokeColor: shaftColor,
      strokeWidth: this.currentSize,
      strokeCap: 'round'
    });
    
    if (this.useGradient && this.currentGradient) {
      shaft.data.needsGradientStroke = true;
    }
    
    // Create filled arrowhead triangle
    const arrowhead = new this.scope.Path();
    arrowhead.moveTo(leftPoint);
    arrowhead.lineTo(end);
    arrowhead.lineTo(rightPoint);
    arrowhead.closePath();
    arrowhead.fillColor = new this.scope.Color(shaftColor);
    arrowhead.strokeColor = new this.scope.Color(shaftColor);
    arrowhead.strokeWidth = Math.max(1, this.currentSize * 0.5); // Scale stroke with brush size
    
    if (this.useGradient && this.currentGradient) {
      arrowhead.data.needsGradientStroke = true;
    }
    
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

  private startText(point: paper.Point) {
    // Store the click point and request text input from the UI
    this.textClickPoint = point.clone();
    this.isDrawing = false; // Don't treat this as a drawing operation
    
    // Trigger callback to show text input modal
    if (this.onTextInputRequest) {
      this.onTextInputRequest({ x: point.x, y: point.y });
    }
  }

  addText(textOptions: TextOptions, position?: { x: number; y: number }) {
    const point = position 
      ? new this.scope.Point(position.x, position.y)
      : this.textClickPoint || this.scope.view.center;
    
    // Create text item
    const text = new this.scope.PointText(point);
    text.content = textOptions.text;
    text.fillColor = new this.scope.Color(this.currentColor);
    text.fontSize = textOptions.fontSize;
    text.fontFamily = textOptions.fontFamily;
    text.fontWeight = textOptions.fontWeight;
    
    // Adjust position based on text alignment
    switch (textOptions.textAlign) {
      case 'center':
        text.position = new this.scope.Point(point.x - text.bounds.width / 2, point.y);
        break;
      case 'right':
        text.position = new this.scope.Point(point.x - text.bounds.width, point.y);
        break;
      case 'left':
      default:
        // Already positioned at point
        break;
    }
    
    // Generate unique ID for text
    const textId = `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Mark as text for transform system and store ID
    // Store in BOTH id and itemId fields for maximum compatibility
    text.data.isText = true;
    text.data.id = textId;
    text.data.textId = textId;
    text.data.itemId = textId;
    
    // NEW: Notify collaboration about text creation
    if (this.onTextEdit) {
      const textData = {
        textId: textId,
        content: textOptions.text,
        fontSize: textOptions.fontSize,
        fontFamily: textOptions.fontFamily,
        fontWeight: textOptions.fontWeight,
        fontStyle: 'normal',
        color: this.currentColor,
        position: { x: text.position.x, y: text.position.y },
        alignment: textOptions.textAlign
      };
      this.onTextEdit(textData);
      console.log('📤 Text collaboration event sent:', textData);
    }
    
    // Save state
    this.saveState();
    
    // Clear text click point
    this.textClickPoint = null;
    
    return text;
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
          strokeColor: this.useGradient && this.currentGradient ? new this.scope.Color(this.currentGradient.stops[0].color) : this.currentColor,
          strokeWidth: this.currentSize,
          strokeCap: 'round'
        });
        if (this.useGradient && this.currentGradient) {
          this.currentPath.data.needsGradientStroke = true;
        }
        break;
      case 'rectangle':
        // Create rectangle manually using path segments
        this.currentPath = new this.scope.Path();
        
        // Apply gradient or solid color to stroke
        if (this.useGradient && this.currentGradient && !this.shapeFilled) {
          this.currentPath.data.needsGradientStroke = true;
          this.currentPath.strokeColor = new this.scope.Color(this.currentGradient.stops[0].color);
        } else {
          this.currentPath.strokeColor = new this.scope.Color(this.currentColor);
        }
        
        this.currentPath.strokeWidth = this.currentSize;
        
        // Add fill if enabled
        if (this.shapeFilled) {
          this.currentPath.fillColor = this.getFillColor(this.currentPath.bounds);
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
          strokeColor: this.useGradient && this.currentGradient && !this.shapeFilled ? new this.scope.Color(this.currentGradient.stops[0].color) : this.currentColor,
          strokeWidth: this.currentSize
        });
        if (this.useGradient && this.currentGradient && !this.shapeFilled) {
          this.currentPath.data.needsGradientStroke = true;
        }
        if (this.shapeFilled) {
          this.currentPath.fillColor = this.getFillColor(this.currentPath.bounds);
        }
        break;
      case 'triangle':
        this.currentPath = new this.scope.Path.RegularPolygon({
          center: startPoint,
          sides: 3,
          radius: Math.max(radius, 5),
          strokeColor: this.useGradient && this.currentGradient && !this.shapeFilled ? new this.scope.Color(this.currentGradient.stops[0].color) : this.currentColor,
          strokeWidth: this.currentSize
        });
        if (this.useGradient && this.currentGradient && !this.shapeFilled) {
          this.currentPath.data.needsGradientStroke = true;
        }
        if (this.shapeFilled) {
          this.currentPath.fillColor = this.getFillColor(this.currentPath.bounds);
        }
        break;
      case 'star':
        this.currentPath = new this.scope.Path.Star({
          center: startPoint,
          points: 5,
          radius1: Math.max(radius * 0.6, 3),
          radius2: Math.max(radius, 5),
          strokeColor: this.useGradient && this.currentGradient && !this.shapeFilled ? new this.scope.Color(this.currentGradient.stops[0].color) : this.currentColor,
          strokeWidth: this.currentSize
        });
        if (this.useGradient && this.currentGradient && !this.shapeFilled) {
          this.currentPath.data.needsGradientStroke = true;
        }
        if (this.shapeFilled) {
          this.currentPath.fillColor = this.getFillColor(this.currentPath.bounds);
        }
        break;
      case 'heart':
        // Create a proper heart shape
        const heart = new this.scope.Path();
        heart.strokeColor = new this.scope.Color(this.useGradient && this.currentGradient && !this.shapeFilled ? this.currentGradient.stops[0].color : this.currentColor);
        heart.strokeWidth = this.currentSize;
        
        if (this.useGradient && this.currentGradient && !this.shapeFilled) {
          heart.data.needsGradientStroke = true;
        }
        
        // Add fill if enabled
        if (this.shapeFilled) {
          heart.fillColor = this.getFillColor(heart.bounds);
        }
        
        const heartSize = Math.max(radius / 3, 8);
        const center = startPoint;
        
        // Create a more accurate heart shape with smooth curves
        // Start at the bottom point (tip of heart)
        heart.moveTo(center.add([0, heartSize * 0.9]));
        
        // Left side of heart - smooth curve from bottom to left lobe
        heart.cubicCurveTo(
          center.add([-heartSize * 0.3, heartSize * 0.7]),   // Control point 1 - gentle curve from tip
          center.add([-heartSize * 0.8, heartSize * 0.2]),   // Control point 2 - guide to side
          center.add([-heartSize * 0.95, -heartSize * 0.2])  // End point (left lobe middle)
        );
        // Left lobe top curve - smoother dip at center
        heart.cubicCurveTo(
          center.add([-heartSize * 0.95, -heartSize * 0.75]), // Control point 1 - round the top
          center.add([-heartSize * 0.4, -heartSize * 0.85]),  // Control point 2 - gentler approach to center
          center.add([0, -heartSize * 0.3])                    // End point (top center dip - less deep)
        );
        
        // Right side of heart - smooth curve from top to right lobe
        heart.cubicCurveTo(
          center.add([heartSize * 0.4, -heartSize * 0.85]),   // Control point 1 - gentler from center
          center.add([heartSize * 0.95, -heartSize * 0.75]),  // Control point 2 - round the top
          center.add([heartSize * 0.95, -heartSize * 0.2])    // End point (right lobe middle)
        );
        // Right lobe to bottom curve
        heart.cubicCurveTo(
          center.add([heartSize * 0.8, heartSize * 0.2]),     // Control point 1 - guide to bottom
          center.add([heartSize * 0.3, heartSize * 0.7]),     // Control point 2 - gentle curve to tip
          center.add([0, heartSize * 0.9])                     // End point (back to bottom)
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
    console.log('🎨 Fill tool activated at point:', { x: point.x, y: point.y });
    
    // Only hit test on strokes and already-filled areas - not empty space
    const hitResults = this.scope.project.hitTestAll(point, {
      stroke: true,
      fill: true,
      tolerance: 8
    });

    console.log('🔍 Hit test results:', hitResults?.length || 0, 'items found');

    let filledItem: any = null;
    let fillData: any = null;

    if (hitResults && hitResults.length > 0) {
      // Find the first valid shape to fill
      for (const hitResult of hitResults) {
        let item = hitResult.item;
        
        console.log('🔍 Checking hit item:', {
          type: item.constructor.name,
          isTransformControl: item.data?.isTransformControl,
          hasId: !!item.data?.id
        });
        
        // Skip transform controls (but allow background)
        if (item.data?.isTransformControl) {
          console.log('⏭️ Skipping transform control');
          continue;
        }

        // If item is a group, find the actual path inside
        if (item instanceof this.scope.Group) {
          console.log('📦 Item is a group, finding path inside');
          const children = item.children;
          for (let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            if (child instanceof this.scope.Path || child instanceof this.scope.CompoundPath) {
              item = child;
              console.log('✅ Found path inside group');
              break;
            }
          }
        }

        // Fill the item if it's a valid shape
        if (item instanceof this.scope.Path || item instanceof this.scope.CompoundPath || 
            item instanceof this.scope.Shape) {
          const fillColor = this.getFillColor(item.bounds);
          item.fillColor = fillColor;
          filledItem = item;
          
          console.log('🎨 Filling shape with color:', fillColor);
          
          // Generate or use existing item ID
          // Store in BOTH id and itemId fields for maximum compatibility
          const itemId = item.data?.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          if (!item.data.id) {
            item.data.id = itemId;
            item.data.itemId = itemId;
          }
          
          // Prepare fill data for collaboration
          fillData = {
            type: 'fill',
            tool: 'fill',
            targetType: 'shape',
            itemId: itemId,
            fillColor: this.serializeColor(fillColor),
            bounds: {
              x: item.bounds.x,
              y: item.bounds.y,
              width: item.bounds.width,
              height: item.bounds.height
            },
            point: { x: point.x, y: point.y }
          };
          
          console.log('📦 Prepared fill data for shape:', fillData);
          
          this.saveState();
          break;
        } else if (item instanceof this.scope.PointText) {
          const fillColor = this.getFillColor(item.bounds);
          item.fillColor = fillColor;
          filledItem = item;
          
          console.log('🎨 Filling text with color:', fillColor);
          
          // Generate or use existing item ID
          // Store in BOTH id and itemId fields for maximum compatibility
          const itemId = item.data?.id || item.data?.textId || `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          if (!item.data.id) {
            item.data.id = itemId;
            item.data.itemId = itemId;
          }
          
          // Prepare fill data for collaboration
          fillData = {
            type: 'fill',
            tool: 'fill',
            targetType: 'text',
            itemId: itemId,
            fillColor: this.serializeColor(fillColor),
            bounds: {
              x: item.bounds.x,
              y: item.bounds.y,
              width: item.bounds.width,
              height: item.bounds.height
            },
            point: { x: point.x, y: point.y }
          };
          
          console.log('📦 Prepared fill data for text:', fillData);
          
          this.saveState();
          break;
        }
      }
    }
    
    // If nothing was hit, fill the canvas background
    if (!filledItem) {
      console.log('🎨 No item hit, filling canvas background');
      const bgColor = this.getFillColor(this.scope.view.bounds);
      this.fillCanvasBackground();
      
      // Prepare background fill data for collaboration
      fillData = {
        type: 'fill',
        tool: 'fill',
        targetType: 'background',
        fillColor: this.serializeColor(bgColor),
        point: { x: point.x, y: point.y }
      };
      
      console.log('📦 Prepared fill data for background:', fillData);
    }
    
    // Notify collaboration about fill operation - ALWAYS send if callback exists
    if (this.onDrawingComplete) {
      if (fillData) {
        console.log('📤 Sending fill operation to collaboration:', fillData);
        this.onDrawingComplete(fillData);
      } else {
        console.error('❌ Fill operation completed but fillData is null!');
      }
    } else {
      console.warn('⚠️ onDrawingComplete callback not set, fill operation not synced');
    }
  }

  private createBackground() {
    // Safety check: only create background on the background layer
    const activeLayer = this.scope.project.activeLayer;
    if (!activeLayer.data.isBackgroundLayer) {
      console.warn('createBackground called on non-background layer, skipping');
      return;
    }
    
    // Create white background
    const background = new this.scope.Path.Rectangle({
      from: [0, 0],
      to: [this.scope.view.size.width, this.scope.view.size.height]
    });
    background.fillColor = new this.scope.Color('#FFFFFF');
    background.data = { isBackground: true };
    background.sendToBack();
  }

  private fillCanvasBackground() {
    // Find the background layer
    const backgroundLayer = this.scope.project.layers.find(
      layer => layer.data.isBackgroundLayer
    );
    
    if (!backgroundLayer) {
      console.warn('No background layer found');
      return;
    }
    
    // Find existing background rectangle
    let backgroundRect = backgroundLayer.children.find(
      child => child.data.isBackground
    ) as paper.Path;
    
    if (backgroundRect) {
      // Update existing background color
      backgroundRect.fillColor = this.getFillColor(backgroundRect.bounds);
    } else {
      // Create new background if it doesn't exist
      backgroundRect = new this.scope.Path.Rectangle({
        from: [0, 0],
        to: [this.scope.view.size.width, this.scope.view.size.height]
      });
      backgroundRect.fillColor = this.getFillColor(backgroundRect.bounds);
      backgroundRect.data = { isBackground: true };
      backgroundLayer.addChild(backgroundRect);
      backgroundRect.sendToBack();
    }
    
    this.saveState();
  }

  // Convert screen coordinates to canvas coordinates
  // This accounts for BOTH the canvas element's position AND the wrapper's CSS transform
  private getCanvasPoint(clientX: number, clientY: number): paper.Point {
    // getBoundingClientRect() already accounts for ALL CSS transforms
    // It gives us the actual screen position after translate() and scale()
    const rect = this.canvas.getBoundingClientRect();
    
    // Get click position relative to canvas top-left (in screen space, after transforms)
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    
    // Convert from screen pixels to canvas pixels
    // rect.width/height are the VISUAL size after CSS transform
    // canvas.width/height are the actual pixel dimensions
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
    const point = this.getCanvasPoint(e.clientX, e.clientY);
    
    // Always notify collaboration about cursor movement during active sessions
    // This ensures other users can see cursor position even when outside canvas
    if (this.onCursorMove) {
      this.onCursorMove(point.x, point.y);
    }
    
    if (e.buttons === 1) { // Left button is pressed
      this.handleMouseDrag({ point } as any);
    }
  }

  // Add global mouse move handler for collaboration cursor tracking
  private handleGlobalMouseMove = (e: MouseEvent) => {
    // Only track global movements during active drawing sessions
    if (this.isDrawing && this.onCursorMove) {
      const point = this.getCanvasPoint(e.clientX, e.clientY);
      this.onCursorMove(point.x, point.y);
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
      
      // Track touch position for collaboration (mobile support)
      if (this.onCursorMove) {
        this.onCursorMove(point.x, point.y);
      }
      
      this.handleMouseDrag({ point } as any);
    }
  }
  
  private handleRawTouchEnd(e: TouchEvent) {
    e.preventDefault();
    const point = this.getCanvasPoint(0, 0); // Dummy point for touch end
    this.handleMouseUp({ point } as any);
  }
  
  // No longer needed - coordinate transformation is now handled in getCanvasPoint()
  private transformPoint(point: paper.Point): paper.Point {
    return point;
  }

  private saveState() {
    // Save current active layer
    const currentActiveLayer = this.scope.project.activeLayer;
    
    this.undoStack.push(this.scope.project.exportJSON());
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    
    // Restore active layer (in case it changed during export)
    if (currentActiveLayer && currentActiveLayer.isInserted()) {
      currentActiveLayer.activate();
    }
    
    // Notify layers changed to update thumbnails (throttled)
    this.notifyLayersChangedThrottled();
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
    this.useGradient = false; // Disable gradient when setting solid color
  }

  setGradient(gradient: GradientConfig | null) {
    this.currentGradient = gradient;
    this.useGradient = gradient !== null;
  }

  setUseGradient(use: boolean) {
    this.useGradient = use && this.currentGradient !== null;
  }

  private createPaperGradient(bounds: paper.Rectangle): paper.Color | paper.Gradient {
    if (!this.useGradient || !this.currentGradient) {
      return new paper.Color(this.currentColor);
    }

    const gradient = this.currentGradient;
    const stops = gradient.stops.map(stop => [new paper.Color(stop.color), stop.position / 100]);

    if (gradient.type === 'linear') {
      // Calculate gradient direction based on angle
      const angleRad = (gradient.angle * Math.PI) / 180;
      const center = bounds.center;
      const radius = Math.max(bounds.width, bounds.height) / 2;
      
      const startPoint = new paper.Point(
        center.x - Math.cos(angleRad) * radius,
        center.y - Math.sin(angleRad) * radius
      );
      const endPoint = new paper.Point(
        center.x + Math.cos(angleRad) * radius,
        center.y + Math.sin(angleRad) * radius
      );

      return {
        gradient: {
          stops: stops
        },
        origin: startPoint,
        destination: endPoint
      } as any;
    } else {
      // Radial gradient
      return {
        gradient: {
          stops: stops,
          radial: true
        },
        origin: bounds.center,
        destination: bounds.rightCenter
      } as any;
    }
  }

  private getFillColor(bounds?: paper.Rectangle): any {
    if (this.useGradient && this.currentGradient && bounds) {
      return this.createPaperGradient(bounds);
    }
    return new this.scope.Color(this.currentColor);
  }

  private applyGradientToBrushStroke(path: paper.Path) {
    if (!this.currentGradient) return;

    // Paper.js supports gradients on stroke colors!
    // Just apply the gradient directly
    try {
      path.strokeColor = this.getFillColor(path.bounds);
    } catch (e) {
      console.warn('Failed to apply gradient to brush stroke:', e);
    }
  }

  setSize(size: number) {
    // Store the unscaled size
    this.unscaledSize = size;
    
    // Scale brush size based on canvas dimensions
    // The canvas is now ~800px, so we scale up the brush size
    const scaleFactor = this.canvas.width / 400; // Assuming 400 was the old size
    const scaledSize = size * scaleFactor;
    this.currentSize = Math.max(1, Math.min(100, scaledSize));
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

  // Text tool methods
  setTextInputCallback(callback: (point: { x: number; y: number }) => void) {
    this.onTextInputRequest = callback;
  }
  
  // Drag callbacks for trash zone
  setDragCallbacks(
    onStart: () => void,
    onEnd: () => void,
    onMove: (point: { x: number; y: number }) => void
  ) {
    this.onDragStart = onStart;
    this.onDragEnd = onEnd;
    this.onDragMove = onMove;
  }

  setFontSize(size: number) {
    this.currentFontSize = size;
  }

  setFontFamily(family: string) {
    this.currentFontFamily = family;
  }

  setFontWeight(weight: string) {
    this.currentFontWeight = weight;
  }

  getFontSize(): number {
    return this.currentFontSize;
  }

  getFontFamily(): string {
    return this.currentFontFamily;
  }

  getFontWeight(): string {
    return this.currentFontWeight;
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
      // Save current active layer ID
      const activeLayerId = this.scope.project.activeLayer?.data.layerId;
      
      const currentState = this.undoStack.pop()!;
      this.redoStack.push(currentState);
      const previousState = this.undoStack[this.undoStack.length - 1];
      this.scope.project.clear();
      this.scope.project.importJSON(previousState);
      
      // Restore active layer if it still exists
      if (activeLayerId) {
        const layerIndex = this.findLayerIndex(activeLayerId);
        if (layerIndex !== -1) {
          this.scope.project.layers[layerIndex].activate();
        }
      }
      
      this.transformSystem.clearSelection();
      this.notifyLayersChanged();
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      // Save current active layer ID
      const activeLayerId = this.scope.project.activeLayer?.data.layerId;
      
      const nextState = this.redoStack.pop()!;
      this.undoStack.push(nextState);
      this.scope.project.clear();
      this.scope.project.importJSON(nextState);
      
      // Restore active layer if it still exists
      if (activeLayerId) {
        const layerIndex = this.findLayerIndex(activeLayerId);
        if (layerIndex !== -1) {
          this.scope.project.layers[layerIndex].activate();
        }
      }
      
      this.transformSystem.clearSelection();
      this.notifyLayersChanged();
    }
  }

  clearCanvas() {
    // Clear all layers
    this.scope.project.clear();
    
    // Reinitialize the layer system (background + Layer 1)
    this.initializeLayers();
    
    this.transformSystem.clearSelection();
    
    // Notify UI about layer changes
    this.notifyLayersChanged();
    this.saveState();
  }

  /**
   * Apply a remote drawing path from collaboration
   */
  /**
   * Apply a remote drawing operation from another user
   * Supports all tool types: brush, shapes, text, etc.
   */
  applyRemoteDrawing(data: any) {
    if (!data) return;

    console.log('📥 Applying remote drawing:', data.type, data);
    console.log('🔍 DEBUG: itemId in received data?', data.itemId);

    try {
      switch (data.type || data.tool) {
        case 'brush':
        case 'eraser':
          this.applyRemoteBrushStroke(data);
          break;
        case 'rectangle':
          this.applyRemoteRectangle(data);
          break;
        case 'circle':
          this.applyRemoteCircle(data);
          break;
        case 'line':
          this.applyRemoteLine(data);
          break;
        case 'triangle':
          this.applyRemoteTriangle(data);
          break;
        case 'star':
          this.applyRemoteStar(data);
          break;
        case 'heart':
          this.applyRemoteHeart(data);
          break;
        case 'arrow':
          this.applyRemoteArrow(data);
          break;
        case 'text':
          this.applyRemoteText(data);
          break;
        case 'fill':
          this.applyRemoteFill(data);
          break;
        case 'path':
          // Legacy support for simple path drawing
          if (data.points) {
            this.applyRemotePath(data.points, data.color || data.strokeColor || '#000000', data.strokeWidth || 5);
          }
          break;
        case 'transform':
          // Handle transform operations through the new collaboration enhancer
          // This is now handled by the CollaborationEnhancer, not the legacy drawing system
          console.log('Transform operation received via legacy drawing system - should be handled by CollaborationEnhancer');
          break;
        case 'text_advanced':
          // Handle advanced text operations through the new collaboration enhancer
          console.log('Advanced text operation received via legacy drawing system - should be handled by CollaborationEnhancer');
          break;
        case 'layer_operation':
          // Handle layer operations through the new collaboration enhancer
          console.log('Layer operation received via legacy drawing system - should be handled by CollaborationEnhancer');
          break;
        default:
          console.warn('Unknown remote drawing type:', data.type);
      }

      this.scope.view.update();
    } catch (error) {
      console.error('❌ Failed to apply remote drawing:', error);
    }
  }

  private applyRemoteBrushStroke(data: any) {
    if (!data.points || data.points.length === 0) return;

    const path = new this.scope.Path({
      segments: data.points.map((p: any) => new this.scope.Point(p.x, p.y)),
      strokeColor: new this.scope.Color(data.strokeColor || data.color || '#000000'),
      strokeWidth: data.strokeWidth || 5,
      strokeCap: 'round',
      strokeJoin: 'round',
      opacity: data.opacity || 1
    });

    // Preserve item ID for transform operations
    // Store in BOTH id and itemId fields for maximum compatibility
    if (data.itemId) {
      path.data = { id: data.itemId, itemId: data.itemId };
    }

    path.simplify(10);
    this.scope.project.activeLayer.addChild(path);
  }

  private applyRemoteRectangle(data: any) {
    if (!data.shapeData?.bounds) return;

    const { x, y, width, height } = data.shapeData.bounds;
    const rect = new this.scope.Path.Rectangle(
      new this.scope.Rectangle(x, y, width, height)
    );

    this.applyRemoteShapeStyle(rect, data);
    this.scope.project.activeLayer.addChild(rect);
  }

  private applyRemoteCircle(data: any) {
    if (!data.shapeData?.bounds) return;

    const { x, y, width, height } = data.shapeData.bounds;
    const center = new this.scope.Point(x + width / 2, y + height / 2);
    const radius = new this.scope.Size(width / 2, height / 2);
    
    const ellipse = new this.scope.Path.Ellipse({
      center: center,
      radius: radius
    });

    this.applyRemoteShapeStyle(ellipse, data);
    this.scope.project.activeLayer.addChild(ellipse);
  }

  private applyRemoteLine(data: any) {
    if (!data.points || data.points.length < 2) return;

    const from = new this.scope.Point(data.points[0].x, data.points[0].y);
    const to = new this.scope.Point(data.points[data.points.length - 1].x, data.points[data.points.length - 1].y);
    
    const line = new this.scope.Path.Line(from, to);
    line.strokeColor = new this.scope.Color(data.strokeColor || '#000000');
    line.strokeWidth = data.strokeWidth || 5;
    line.opacity = data.opacity || 1;

    // Preserve item ID for transform operations
    // Store in BOTH id and itemId fields for maximum compatibility
    if (data.itemId) {
      line.data = { id: data.itemId, itemId: data.itemId };
    }

    this.scope.project.activeLayer.addChild(line);
  }

  private applyRemoteTriangle(data: any) {
    if (!data.shapeData?.bounds) return;

    const { x, y, width, height } = data.shapeData.bounds;
    const triangle = new this.scope.Path([
      new this.scope.Point(x + width / 2, y),
      new this.scope.Point(x + width, y + height),
      new this.scope.Point(x, y + height)
    ]);
    triangle.closed = true;

    this.applyRemoteShapeStyle(triangle, data);
    this.scope.project.activeLayer.addChild(triangle);
  }

  private applyRemoteStar(data: any) {
    if (!data.shapeData?.bounds) return;

    const { x, y, width, height } = data.shapeData.bounds;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const outerRadius = Math.min(width, height) / 2;
    const innerRadius = outerRadius * 0.5;
    const points = 5;

    const starPath = new this.scope.Path();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      starPath.add(new this.scope.Point(
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      ));
    }
    starPath.closed = true;

    this.applyRemoteShapeStyle(starPath, data);
    this.scope.project.activeLayer.addChild(starPath);
  }

  private applyRemoteHeart(data: any) {
    // If pathData is available, use it for accurate reconstruction
    if (data.pathData) {
      console.log('💖 Using pathData for heart shape');
      const heart = this.scope.importJSON(data.pathData);
      
      if (heart) {
        // Preserve item ID
        if (data.itemId) {
          heart.data = { id: data.itemId, itemId: data.itemId };
        }
        
        this.scope.project.activeLayer.addChild(heart);
        console.log('✅ Heart shape imported from pathData');
        return;
      }
    }
    
    // Fallback to bounds-based reconstruction
    if (!data.shapeData?.bounds) return;

    const { x, y, width, height } = data.shapeData.bounds;
    const heart = new this.scope.Path();
    const centerX = x + width / 2;
    const topY = y + height * 0.3;

    heart.moveTo(new this.scope.Point(centerX, y + height));
    heart.cubicCurveTo(
      new this.scope.Point(x, topY),
      new this.scope.Point(x, y),
      new this.scope.Point(centerX - width * 0.25, y)
    );
    heart.cubicCurveTo(
      new this.scope.Point(centerX, y - height * 0.1),
      new this.scope.Point(centerX, y - height * 0.1),
      new this.scope.Point(centerX + width * 0.25, y)
    );
    heart.cubicCurveTo(
      new this.scope.Point(x + width, y),
      new this.scope.Point(x + width, topY),
      new this.scope.Point(centerX, y + height)
    );
    heart.closed = true;

    this.applyRemoteShapeStyle(heart, data);
    this.scope.project.activeLayer.addChild(heart);
  }

  private applyRemoteArrow(data: any) {
    // If pathData is available, use it for accurate reconstruction
    if (data.pathData) {
      console.log('➡️ Using pathData for arrow shape');
      const arrow = this.scope.importJSON(data.pathData);
      
      if (arrow) {
        // Preserve item ID
        if (data.itemId) {
          arrow.data = { id: data.itemId, itemId: data.itemId };
        }
        
        this.scope.project.activeLayer.addChild(arrow);
        console.log('✅ Arrow shape imported from pathData');
        return;
      }
    }
    
    // Fallback to points-based reconstruction
    if (!data.points || data.points.length < 2) return;

    const from = new this.scope.Point(data.points[0].x, data.points[0].y);
    const to = new this.scope.Point(data.points[data.points.length - 1].x, data.points[data.points.length - 1].y);
    
    const group = new this.scope.Group();
    
    // Arrow line
    const line = new this.scope.Path.Line(from, to);
    line.strokeColor = new this.scope.Color(data.strokeColor || '#000000');
    line.strokeWidth = data.strokeWidth || 5;
    group.addChild(line);
    
    // Arrow head
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const headLength = (data.strokeWidth || 5) * 3;
    const headAngle = Math.PI / 6;
    
    const arrowHead = new this.scope.Path([
      to,
      new this.scope.Point(
        to.x - headLength * Math.cos(angle - headAngle),
        to.y - headLength * Math.sin(angle - headAngle)
      ),
      new this.scope.Point(
        to.x - headLength * Math.cos(angle + headAngle),
        to.y - headLength * Math.sin(angle + headAngle)
      )
    ]);
    arrowHead.closed = true;
    arrowHead.fillColor = new this.scope.Color(data.strokeColor || '#000000');
    group.addChild(arrowHead);
    
    // Preserve item ID
    if (data.itemId) {
      group.data = { id: data.itemId, itemId: data.itemId };
    }
    
    group.opacity = data.opacity || 1;
    this.scope.project.activeLayer.addChild(group);
  }

  private applyRemoteText(data: any) {
    if (!data.text || !data.position) return;

    const text = new this.scope.PointText({
      point: new this.scope.Point(data.position.x, data.position.y),
      content: data.text,
      fontSize: data.fontSize || 24,
      fontFamily: data.fontFamily || 'Arial',
      fontWeight: data.fontWeight || 'normal',
      fillColor: new this.scope.Color(data.fillColor || data.color || '#000000'),
      justification: data.textAlign || 'left'
    });

    this.scope.project.activeLayer.addChild(text);
  }

  private applyRemoteFill(data: any) {
    // Fill tool is typically applied locally, not synced
    console.log('Fill tool received from remote, skipping');
  }

  private applyRemoteShapeStyle(shape: paper.Path, data: any) {
    if (data.filled || data.shapeData?.filled) {
      if (data.fillColor) {
        shape.fillColor = this.deserializeColor(data.fillColor);
      } else {
        shape.fillColor = new this.scope.Color(data.strokeColor || '#000000');
      }
    } else {
      shape.strokeColor = new this.scope.Color(data.strokeColor || '#000000');
      shape.strokeWidth = data.strokeWidth || 5;
    }
    shape.opacity = data.opacity || 1;
    
    // CRITICAL: Preserve the item ID from the sender for transform operations
    // Store in BOTH id and itemId fields for maximum compatibility
    if (data.itemId) {
      if (!shape.data) shape.data = {};
      shape.data.id = data.itemId;
      shape.data.itemId = data.itemId; // Also store as itemId for CollaborationEnhancer
      console.log('✅ Assigned itemId to remote shape:', data.itemId);
    } else {
      console.warn('⚠️ No itemId in remote drawing data!', data);
    }
  }

  private deserializeColor(colorData: any): paper.Color {
    if (typeof colorData === 'string') {
      return new this.scope.Color(colorData);
    }
    if (colorData.gradient) {
      // Reconstruct gradient
      const gradient = new this.scope.Gradient();
      gradient.stops = colorData.gradient.stops.map((stop: any) => 
        new this.scope.GradientStop(new this.scope.Color(stop.color), stop.offset)
      );
      return new this.scope.Color(gradient, colorData.origin, colorData.destination);
    }
    return new this.scope.Color(colorData);
  }

  /**
   * Legacy method for backward compatibility
   */
  applyRemotePath(points: Array<{x: number, y: number}>, color: string, strokeWidth: number) {
    if (!points || points.length === 0) return;

    const path = new this.scope.Path({
      segments: points.map(p => new this.scope.Point(p.x, p.y)),
      strokeColor: new this.scope.Color(color),
      strokeWidth: strokeWidth,
      strokeCap: 'round',
      strokeJoin: 'round'
    });

    path.simplify(10);

    if (this.scope.project.activeLayer) {
      this.scope.project.activeLayer.addChild(path);
    }

    this.scope.view.update();
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
    
    // CRITICAL: Copy the item ID from the shape to the group for transform collaboration
    // This ensures that when the group is selected, transforms use the correct ID
    if (shape.data && shape.data.id) {
      if (!group.data) group.data = {};
      group.data.id = shape.data.id;
      group.data.itemId = shape.data.itemId || shape.data.id;
      console.log('✅ Copied itemId to group:', group.data.id);
    }
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

  // ============================================
  // LAYER MANAGEMENT SYSTEM
  // ============================================

  private initializeLayers() {
    // Clear any existing layers first
    const existingLayers = this.scope.project.layers.slice();
    
    // If we already have layers with IDs, don't reinitialize
    if (existingLayers.length > 0 && existingLayers[0].data.layerId) {
      return;
    }
    
    // Remove default layer if it exists
    if (existingLayers.length > 0) {
      existingLayers.forEach(layer => layer.remove());
    }
    
    // Create background layer
    const bgLayer = new this.scope.Layer();
    bgLayer.name = 'Background';
    bgLayer.data.layerId = this.generateLayerId();
    bgLayer.data.isBackgroundLayer = true;
    
    // Create default drawing layer
    const drawingLayer = new this.scope.Layer();
    drawingLayer.name = 'Layer 1';
    drawingLayer.data.layerId = this.generateLayerId();
    drawingLayer.activate();
    
    // Now create background on the background layer
    bgLayer.activate();
    this.createBackground();
    
    // Switch back to drawing layer
    drawingLayer.activate();
  }

  private generateLayerId(): string {
    return `layer_${this.layerIdCounter++}_${Date.now()}`;
  }

  setLayersChangedCallback(callback: () => void) {
    this.onLayersChanged = callback;
  }

  private notifyLayersChanged() {
    if (this.onLayersChanged) {
      this.onLayersChanged();
    }
  }
  
  /**
   * Set collaboration callbacks for real-time drawing sync
   */
  setCollaborationCallbacks(
    onDrawingComplete: (data: any) => void,
    onCursorMove: (x: number, y: number) => void
  ) {
    this.onDrawingComplete = onDrawingComplete;
    this.onCursorMove = onCursorMove;
    
    // Hook into transform system to broadcast transformations
    this.setupTransformCollaboration();
  }

  /**
   * Set advanced collaboration callbacks for text and layer operations
   */
  setAdvancedCollaborationCallbacks(
    onTextEdit: (data: any) => void,
    onLayerOperation: (operation: string, data: any) => void
  ) {
    this.onTextEdit = onTextEdit;
    this.onLayerOperation = onLayerOperation;
    console.log('✅ Advanced collaboration callbacks set:', {
      hasTextEdit: !!onTextEdit,
      hasLayerOperation: !!onLayerOperation
    });
  }
  
  /**
   * Setup collaboration hooks for transform operations
   */
  private setupTransformCollaboration() {
    const originalOnDragEnd = this.onDragEnd;
    this.onDragEnd = () => {
      if (originalOnDragEnd) originalOnDragEnd();
      
      // Broadcast transform when drag ends
      const selectedItem = this.transformSystem.getSelectedItem();
      if (selectedItem && this.onDrawingComplete) {
        this.broadcastTransform(selectedItem, 'translate');
      }
    };
  }
  
  /**
   * Broadcast a transform operation to collaborators
   */
  private broadcastTransform(item: paper.Item, transformType: 'translate' | 'scale' | 'rotate') {
    if (!this.onDrawingComplete) return;
    
    const transformData = {
      type: 'transform',
      transformType,
      itemId: item.id,
      position: { x: item.position.x, y: item.position.y },
      bounds: {
        x: item.bounds.x,
        y: item.bounds.y,
        width: item.bounds.width,
        height: item.bounds.height
      },
      rotation: item.rotation || 0,
      scaling: item.scaling ? { x: item.scaling.x, y: item.scaling.y } : { x: 1, y: 1 }
    };
    
    console.log('📤 Broadcasting transform:', transformData);
    this.onDrawingComplete(transformData);
  }
  
  /**
   * Apply a remote transform operation
   */
  applyRemoteTransform(data: any) {
    if (!data) return;
    
    console.log('📥 Applying remote transform:', data);
    
    // Find the item by approximate position (since IDs won't match across clients)
    // This is a simplified approach - in production you'd want better item tracking
    const targetPoint = new this.scope.Point(data.position.x, data.position.y);
    const items = this.scope.project.activeLayer.children;
    
    // Find closest item to the transformed position
    let closestItem: paper.Item | null = null;
    let closestDistance = Infinity;
    
    for (const item of items) {
      const distance = item.position.getDistance(targetPoint);
      if (distance < closestDistance && distance < 50) { // Threshold of 50 pixels
        closestDistance = distance;
        closestItem = item;
      }
    }
    
    if (closestItem) {
      closestItem.position = targetPoint;
      if (data.rotation !== undefined) {
        closestItem.rotation = data.rotation;
      }
      this.scope.view.update();
    }
  }
  
  /**
   * Apply remote canvas clear
   */
  applyRemoteClear() {
    console.log('📥 Applying remote clear');
    this.clearCanvas();
  }
  
  /**
   * Apply remote undo operation
   */
  applyRemoteUndo() {
    console.log('📥 Applying remote undo');
    this.undo();
  }
  
  /**
   * Apply remote redo operation
   */
  applyRemoteRedo() {
    console.log('📥 Applying remote redo');
    this.redo();
  }
  
  private notifyLayersChangedThrottled() {
    // Throttle thumbnail updates to prevent performance issues during drawing
    if (this.layersChangedTimeout) {
      clearTimeout(this.layersChangedTimeout);
    }
    
    this.layersChangedTimeout = window.setTimeout(() => {
      this.notifyLayersChanged();
      this.layersChangedTimeout = null;
    }, 300); // Update thumbnails 300ms after drawing stops
  }

  // Get all layers with their info
  getLayers(): LayerInfo[] {
    const layers: LayerInfo[] = [];
    
    try {
      for (let i = this.scope.project.layers.length - 1; i >= 0; i--) {
        const layer = this.scope.project.layers[i];
        const thumbnail = this.generateLayerThumbnail(layer);
        
        layers.push({
          id: layer.data.layerId || this.generateLayerId(),
          name: layer.name || `Layer ${i + 1}`,
          visible: layer.visible,
          opacity: layer.opacity,
          locked: layer.locked || false,
          thumbnail: thumbnail,
          isBackground: layer.data.isBackgroundLayer || false
        });
      }
    } catch (error) {
      console.error('Error in getLayers:', error);
    }
    
    return layers;
  }

  // Get active layer info
  getActiveLayer(): LayerInfo | null {
    const activeLayer = this.scope.project.activeLayer;
    if (!activeLayer) return null;
    
    return {
      id: activeLayer.data.layerId || this.generateLayerId(),
      name: activeLayer.name || 'Layer',
      visible: activeLayer.visible,
      opacity: activeLayer.opacity,
      locked: activeLayer.locked || false,
      thumbnail: this.generateLayerThumbnail(activeLayer),
      isBackground: activeLayer.data.isBackgroundLayer || false
    };
  }

  // Create new layer
  createLayer(name?: string): string {
    try {
      // Save current active layer to restore it
      const previousActiveLayerId = this.scope.project.activeLayer?.data.layerId;
      
      const newLayer = new this.scope.Layer();
      const layerId = this.generateLayerId();
      newLayer.data.layerId = layerId;
      newLayer.data.id = layerId; // Also store as 'id' for consistency
      
      // Count non-background layers for naming (including the one we're creating)
      const nonBgLayers = this.scope.project.layers.filter(
        l => !l.data.isBackgroundLayer
      ).length;
      
      // Since we're creating a new layer, it's already counted in nonBgLayers
      // So the name should be nonBgLayers (not +1)
      newLayer.name = name || `Layer ${nonBgLayers}`;
      newLayer.activate();
      
      // Notify collaboration about layer creation
      if (this.onLayerOperation) {
        const layerData = {
          layerId,
          name: newLayer.name,
          visible: newLayer.visible,
          opacity: newLayer.opacity,
          locked: newLayer.locked || false,
          blendMode: 'normal',
          zIndex: this.scope.project.layers.length - 1
        };
        this.onLayerOperation('create', layerData);
        console.log('📤 Layer creation event sent:', layerId);
      }
      
      this.notifyLayersChanged();
      this.saveState();
      return layerId;
    } catch (error) {
      console.error('Failed to create layer:', error);
      throw error;
    }
  }

  // Delete layer
  deleteLayer(layerId: string): boolean {
    // Don't allow deleting the last layer
    if (this.scope.project.layers.length <= 1) {
      return false;
    }
    
    const layerIndex = this.findLayerIndex(layerId);
    if (layerIndex === -1) return false;
    
    const layer = this.scope.project.layers[layerIndex];
    
    // Don't allow deleting background layer
    if (layer.data.isBackgroundLayer) {
      return false;
    }
    
    // If deleting active layer, activate another one
    if (layer === this.scope.project.activeLayer) {
      const newActiveIndex = layerIndex > 0 ? layerIndex - 1 : layerIndex + 1;
      if (newActiveIndex < this.scope.project.layers.length) {
        this.scope.project.layers[newActiveIndex].activate();
      }
    }
    
    // Notify collaboration about layer deletion
    if (this.onLayerOperation) {
      this.onLayerOperation('delete', {
        layerId
      });
      console.log('📤 Layer deletion event sent:', layerId);
    }
    
    layer.remove();
    this.notifyLayersChanged();
    this.saveState();
    return true;
  }

  // Set active layer
  setActiveLayer(layerId: string): boolean {
    const layerIndex = this.findLayerIndex(layerId);
    if (layerIndex === -1) return false;
    
    const layer = this.scope.project.layers[layerIndex];
    
    // Don't allow activating locked layers
    if (layer.locked) {
      return false;
    }
    
    layer.activate();
    this.transformSystem.clearSelection();
    
    // Don't call notifyLayersChanged here - the UI already knows about this change
    // and calling it causes excessive updates and layer switching
    return true;
  }

  // Toggle layer visibility
  toggleLayerVisibility(layerId: string): boolean {
    const layerIndex = this.findLayerIndex(layerId);
    if (layerIndex === -1) return false;
    
    const layer = this.scope.project.layers[layerIndex];
    layer.visible = !layer.visible;
    
    // Force view update to redraw canvas with new visibility
    this.scope.view.update();
    
    this.notifyLayersChanged();
    return true;
  }

  // Set layer opacity
  setLayerOpacity(layerId: string, opacity: number): boolean {
    const layerIndex = this.findLayerIndex(layerId);
    if (layerIndex === -1) return false;
    
    const layer = this.scope.project.layers[layerIndex];
    layer.opacity = Math.max(0, Math.min(1, opacity));
    
    // Force view update to redraw canvas with new opacity
    this.scope.view.update();
    
    // Notify collaboration about opacity change
    if (this.onLayerOperation) {
      this.onLayerOperation('update', {
        layerId,
        opacity: layer.opacity
      });
      console.log('📤 Layer opacity change sent:', layerId, layer.opacity);
    }
    
    this.notifyLayersChanged();
    return true;
  }

  // Toggle layer lock
  toggleLayerLock(layerId: string): boolean {
    const layerIndex = this.findLayerIndex(layerId);
    if (layerIndex === -1) return false;
    
    const layer = this.scope.project.layers[layerIndex];
    layer.locked = !layer.locked;
    
    // If locking the active layer, switch to another unlocked layer
    if (layer.locked && layer === this.scope.project.activeLayer) {
      for (let i = 0; i < this.scope.project.layers.length; i++) {
        if (!this.scope.project.layers[i].locked) {
          this.scope.project.layers[i].activate();
          break;
        }
      }
    }
    
    // Notify collaboration about lock state change
    if (this.onLayerOperation) {
      this.onLayerOperation('update', {
        layerId,
        locked: layer.locked
      });
      console.log('📤 Layer lock change sent:', layerId, layer.locked);
    }
    
    this.notifyLayersChanged();
    return true;
  }

  // Rename layer
  renameLayer(layerId: string, newName: string): boolean {
    const layerIndex = this.findLayerIndex(layerId);
    if (layerIndex === -1) return false;
    
    const layer = this.scope.project.layers[layerIndex];
    layer.name = newName;
    
    // Notify collaboration about layer rename
    if (this.onLayerOperation) {
      this.onLayerOperation('update', {
        layerId,
        name: newName
      });
      console.log('📤 Layer rename sent:', layerId, newName);
    }
    
    this.notifyLayersChanged();
    return true;
  }

  // Duplicate layer
  duplicateLayer(layerId: string): string | null {
    const layerIndex = this.findLayerIndex(layerId);
    if (layerIndex === -1) return null;
    
    const layer = this.scope.project.layers[layerIndex];
    const newLayer = layer.clone();
    const newLayerId = this.generateLayerId();
    newLayer.data.layerId = newLayerId;
    newLayer.name = `${layer.name} Copy`;
    newLayer.data.isBackgroundLayer = false; // Copies are never background
    
    // Insert after the original layer
    newLayer.insertAbove(layer);
    newLayer.activate();
    
    this.notifyLayersChanged();
    this.saveState();
    return newLayerId;
  }

  // Merge layer down
  mergeLayerDown(layerId: string): boolean {
    const layerIndex = this.findLayerIndex(layerId);
    if (layerIndex === -1 || layerIndex === 0) return false;
    
    const upperLayer = this.scope.project.layers[layerIndex];
    const lowerLayer = this.scope.project.layers[layerIndex - 1];
    
    // Don't merge into background layer
    if (lowerLayer.data.isBackgroundLayer) {
      return false;
    }
    
    // Move all items from upper layer to lower layer
    const items = upperLayer.children.slice();
    for (const item of items) {
      item.remove();
      lowerLayer.addChild(item);
    }
    
    // Remove the upper layer
    upperLayer.remove();
    lowerLayer.activate();
    
    this.notifyLayersChanged();
    this.saveState();
    return true;
  }

  // Reorder layers
  moveLayer(layerId: string, newIndex: number): boolean {
    const currentIndex = this.findLayerIndex(layerId);
    if (currentIndex === -1) return false;
    
    const layer = this.scope.project.layers[currentIndex];
    
    // Don't allow moving background layer
    if (layer.data.isBackgroundLayer) {
      return false;
    }
    
    // Clamp newIndex
    newIndex = Math.max(0, Math.min(newIndex, this.scope.project.layers.length - 1));
    
    if (newIndex === currentIndex) return true;
    
    // Remove and reinsert
    layer.remove();
    
    if (newIndex === 0) {
      layer.insertBelow(this.scope.project.layers[0]);
    } else if (newIndex >= this.scope.project.layers.length) {
      layer.insertAbove(this.scope.project.layers[this.scope.project.layers.length - 1]);
    } else if (newIndex > currentIndex) {
      layer.insertAbove(this.scope.project.layers[newIndex - 1]);
    } else {
      layer.insertBelow(this.scope.project.layers[newIndex]);
    }
    
    // Force view update to redraw all layers in new order
    this.scope.view.update();
    
    this.notifyLayersChanged();
    this.saveState();
    return true;
  }

  // Clear layer (delete all items)
  clearLayer(layerId: string): boolean {
    const layerIndex = this.findLayerIndex(layerId);
    if (layerIndex === -1) return false;
    
    const layer = this.scope.project.layers[layerIndex];
    
    // Don't clear background layer
    if (layer.data.isBackgroundLayer) {
      return false;
    }
    
    layer.removeChildren();
    
    this.notifyLayersChanged();
    this.saveState();
    return true;
  }

  // Helper: Find layer index by ID
  private findLayerIndex(layerId: string): number {
    for (let i = 0; i < this.scope.project.layers.length; i++) {
      if (this.scope.project.layers[i].data.layerId === layerId) {
        return i;
      }
    }
    return -1;
  }

  // Generate thumbnail for layer (simplified and safe)
  private generateLayerThumbnail(layer: paper.Layer): string {
    try {
      // For background layer, include background items in thumbnail
      // For other layers, check if layer has any drawable content (not just background)
      const isBackgroundLayer = layer.data.isBackgroundLayer;
      const hasContent = layer.children.some(child => 
        !child.data.isClickableArea && (isBackgroundLayer || !child.data.isBackground)
      );
      
      if (!hasContent) {
        return ''; // Empty layer - return empty string, not error
      }
      
      // Get layer bounds - for background layer, use full canvas size
      let bounds = layer.bounds;
      if (isBackgroundLayer) {
        // Use full canvas bounds for background layer
        bounds = new this.scope.Rectangle(0, 0, this.scope.view.size.width, this.scope.view.size.height);
      }
      
      if (!bounds || bounds.width === 0 || bounds.height === 0) {
        return ''; // No content bounds
      }
      
      // Create thumbnail canvas
      const thumbSize = 60;
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = thumbSize;
      thumbCanvas.height = thumbSize;
      const ctx = thumbCanvas.getContext('2d');
      
      if (!ctx) return '';
      
      // White background (will be overridden by actual background color for background layer)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, thumbSize, thumbSize);
      
      // Save all layers visibility state
      const layerVisibilityStates = this.scope.project.layers.map(l => ({
        layer: l,
        wasVisible: l.visible
      }));
      
      // Hide all layers except the one we're generating thumbnail for
      this.scope.project.layers.forEach(l => {
        l.visible = (l === layer);
      });
      
      // Force view update to render only this layer
      this.scope.view.update();
      
      // Calculate scale and position
      const scale = Math.min(
        (thumbSize * 0.8) / bounds.width,
        (thumbSize * 0.8) / bounds.height
      );
      
      const scaledWidth = bounds.width * scale;
      const scaledHeight = bounds.height * scale;
      const offsetX = (thumbSize - scaledWidth) / 2;
      const offsetY = (thumbSize - scaledHeight) / 2;
      
      // Draw from main canvas (now showing only this layer)
      ctx.drawImage(
        this.canvas,
        bounds.x, bounds.y, bounds.width, bounds.height,
        offsetX, offsetY, scaledWidth, scaledHeight
      );
      
      // Restore all layers visibility
      layerVisibilityStates.forEach(({ layer: l, wasVisible }) => {
        l.visible = wasVisible;
      });
      
      // Update view to restore original visibility
      this.scope.view.update();
      
      return thumbCanvas.toDataURL();
    } catch (error) {
      // Silently fail - don't break layer operations
      console.warn('Thumbnail generation failed, continuing without thumbnail:', error);
      return '';
    }
  }
}
