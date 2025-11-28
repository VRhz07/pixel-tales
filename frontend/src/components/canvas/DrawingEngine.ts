export interface Point {
  x: number;
  y: number;
}

export interface DrawingPath {
  id: string;
  tool: string;
  color: string;
  size: number;
  points: Point[];
  brushType?: string;
}

export interface DrawingState {
  paths: DrawingPath[];
  redoPaths: DrawingPath[];
}

export class DrawingEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isDrawing = false;
  private currentPath: DrawingPath | null = null;
  private drawingState: DrawingState = { paths: [], redoPaths: [] };
  private tool = 'brush';
  private color = '#000000';
  private size = 5;
  private brushType = 'round';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas context');
    }
    this.ctx = context;
    this.setupCanvas();
    this.bindEvents();
  }

  private setupCanvas() {
    // Set canvas size
    this.canvas.width = 800;
    this.canvas.height = 800;
    
    // Set default styles
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.imageSmoothingEnabled = true;
    
    // Clear with white background
    this.clearCanvas();
  }

  private bindEvents() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleStart.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleEnd.bind(this));
    this.canvas.addEventListener('mouseout', this.handleEnd.bind(this));

    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleEnd.bind(this));
    this.canvas.addEventListener('touchcancel', this.handleEnd.bind(this));
  }

  private getEventPoint(e: MouseEvent | TouchEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    if (e instanceof MouseEvent) {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    } else {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    }
  }

  private handleStart(e: MouseEvent) {
    e.preventDefault();
    this.startDrawing(this.getEventPoint(e));
  }

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.startDrawing(this.getEventPoint(e));
    }
  }

  private handleMove(e: MouseEvent) {
    e.preventDefault();
    if (this.isDrawing) {
      this.continueDrawing(this.getEventPoint(e));
    }
  }

  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1 && this.isDrawing) {
      this.continueDrawing(this.getEventPoint(e));
    }
  }

  private handleEnd(e: Event) {
    e.preventDefault();
    this.endDrawing();
  }

  private startDrawing(point: Point) {
    this.isDrawing = true;
    
    this.currentPath = {
      id: Date.now().toString(),
      tool: this.tool,
      color: this.color,
      size: this.size,
      brushType: this.brushType,
      points: [point]
    };

    // Clear redo stack when starting new drawing
    this.drawingState.redoPaths = [];

    if (this.tool === 'brush' || this.tool === 'eraser') {
      this.ctx.globalCompositeOperation = this.tool === 'eraser' ? 'destination-out' : 'source-over';
      this.setupBrush();
      this.ctx.beginPath();
      this.ctx.moveTo(point.x, point.y);
    }
  }

  private continueDrawing(point: Point) {
    if (!this.currentPath) return;

    this.currentPath.points.push(point);

    if (this.tool === 'brush' || this.tool === 'eraser') {
      this.ctx.lineTo(point.x, point.y);
      this.ctx.stroke();
    }
  }

  private endDrawing() {
    if (!this.isDrawing || !this.currentPath) return;

    this.isDrawing = false;

    // Handle different tools
    switch (this.tool) {
      case 'brush':
      case 'eraser':
        // Already drawn during movement
        break;
      case 'fill':
        this.floodFill(this.currentPath.points[0]);
        break;
      case 'square':
        this.drawRectangle();
        break;
      case 'circle':
        this.drawCircle();
        break;
      case 'line':
        this.drawLine();
        break;
      case 'triangle':
        this.drawTriangle();
        break;
      case 'star':
        this.drawStar();
        break;
      case 'heart':
        this.drawHeart();
        break;
      case 'arrow':
        this.drawArrow();
        break;
    }

    // Add path to history
    this.drawingState.paths.push(this.currentPath);
    this.currentPath = null;

    // Reset composite operation
    this.ctx.globalCompositeOperation = 'source-over';
  }

  private setupBrush() {
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.size;
    
    switch (this.brushType) {
      case 'soft':
        this.ctx.shadowColor = this.color;
        this.ctx.shadowBlur = this.size / 2;
        break;
      case 'round':
        this.ctx.lineCap = 'round';
        this.ctx.shadowBlur = 0;
        break;
      case 'pencil':
        this.ctx.lineCap = 'square';
        this.ctx.shadowBlur = 0;
        break;
      case 'marker':
        this.ctx.globalAlpha = 0.7;
        this.ctx.shadowBlur = 0;
        break;
      case 'airbrush':
        this.ctx.shadowColor = this.color;
        this.ctx.shadowBlur = this.size;
        break;
    }
  }

  private floodFill(point: Point) {
    // Simple flood fill implementation
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawRectangle() {
    if (!this.currentPath || this.currentPath.points.length < 2) return;
    
    const start = this.currentPath.points[0];
    const end = this.currentPath.points[this.currentPath.points.length - 1];
    
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.size;
    this.ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  }

  private drawCircle() {
    if (!this.currentPath || this.currentPath.points.length < 2) return;
    
    const start = this.currentPath.points[0];
    const end = this.currentPath.points[this.currentPath.points.length - 1];
    const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.size;
    this.ctx.beginPath();
    this.ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
    this.ctx.stroke();
  }

  private drawLine() {
    if (!this.currentPath || this.currentPath.points.length < 2) return;
    
    const start = this.currentPath.points[0];
    const end = this.currentPath.points[this.currentPath.points.length - 1];
    
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.size;
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
  }

  private drawTriangle() {
    if (!this.currentPath || this.currentPath.points.length < 2) return;
    
    const start = this.currentPath.points[0];
    const end = this.currentPath.points[this.currentPath.points.length - 1];
    const width = end.x - start.x;
    const height = end.y - start.y;
    
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.size;
    this.ctx.beginPath();
    this.ctx.moveTo(start.x + width / 2, start.y);
    this.ctx.lineTo(start.x, end.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private drawStar() {
    if (!this.currentPath || this.currentPath.points.length < 2) return;
    
    const start = this.currentPath.points[0];
    const end = this.currentPath.points[this.currentPath.points.length - 1];
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2;
    const radius = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
    
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.size;
    this.ctx.beginPath();
    
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5;
      const r = i % 2 === 0 ? radius : radius / 2;
      const x = centerX + r * Math.cos(angle - Math.PI / 2);
      const y = centerY + r * Math.sin(angle - Math.PI / 2);
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private drawHeart() {
    if (!this.currentPath || this.currentPath.points.length < 2) return;
    
    const start = this.currentPath.points[0];
    const end = this.currentPath.points[this.currentPath.points.length - 1];
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.size;
    this.ctx.beginPath();
    
    const x = start.x;
    const y = start.y;
    
    this.ctx.moveTo(x + width / 2, y + height / 4);
    this.ctx.bezierCurveTo(x, y, x, y + height / 2, x + width / 2, y + height);
    this.ctx.bezierCurveTo(x + width, y + height / 2, x + width, y, x + width / 2, y + height / 4);
    
    this.ctx.stroke();
  }

  private drawArrow() {
    if (!this.currentPath || this.currentPath.points.length < 2) return;
    
    const start = this.currentPath.points[0];
    const end = this.currentPath.points[this.currentPath.points.length - 1];
    
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const arrowLength = 20;
    const arrowAngle = Math.PI / 6;
    
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.size;
    this.ctx.beginPath();
    
    // Draw main line
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    
    // Draw arrowhead
    this.ctx.lineTo(
      end.x - arrowLength * Math.cos(angle - arrowAngle),
      end.y - arrowLength * Math.sin(angle - arrowAngle)
    );
    this.ctx.moveTo(end.x, end.y);
    this.ctx.lineTo(
      end.x - arrowLength * Math.cos(angle + arrowAngle),
      end.y - arrowLength * Math.sin(angle + arrowAngle)
    );
    
    this.ctx.stroke();
  }

  // Public methods
  setTool(tool: string) {
    this.tool = tool;
  }

  setColor(color: string) {
    this.color = color;
  }

  setSize(size: number) {
    this.size = Math.max(1, Math.min(50, size));
  }

  setBrushType(brushType: string) {
    this.brushType = brushType;
  }

  undo() {
    if (this.drawingState.paths.length > 0) {
      const lastPath = this.drawingState.paths.pop()!;
      this.drawingState.redoPaths.push(lastPath);
      this.redrawCanvas();
    }
  }

  redo() {
    if (this.drawingState.redoPaths.length > 0) {
      const redoPath = this.drawingState.redoPaths.pop()!;
      this.drawingState.paths.push(redoPath);
      this.redrawCanvas();
    }
  }

  clearCanvas() {
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawingState.paths = [];
    this.drawingState.redoPaths = [];
  }

  private redrawCanvas() {
    this.clearCanvas();
    
    // Redraw all paths
    this.drawingState.paths.forEach(path => {
      this.redrawPath(path);
    });
  }

  private redrawPath(path: DrawingPath) {
    if (path.points.length === 0) return;

    this.ctx.globalCompositeOperation = path.tool === 'eraser' ? 'destination-out' : 'source-over';
    this.ctx.strokeStyle = path.color;
    this.ctx.lineWidth = path.size;
    
    // Set brush properties
    switch (path.brushType) {
      case 'soft':
        this.ctx.shadowColor = path.color;
        this.ctx.shadowBlur = path.size / 2;
        break;
      case 'marker':
        this.ctx.globalAlpha = 0.7;
        break;
      default:
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    }

    if (path.tool === 'brush' || path.tool === 'eraser') {
      this.ctx.beginPath();
      this.ctx.moveTo(path.points[0].x, path.points[0].y);
      
      for (let i = 1; i < path.points.length; i++) {
        this.ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      
      this.ctx.stroke();
    }
    
    // Reset properties
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
  }

  getCanvasData(): string {
    return this.canvas.toDataURL('image/png');
  }

  loadCanvasData(dataUrl: string) {
    const img = new Image();
    img.onload = () => {
      this.clearCanvas();
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  }

  getDrawingState(): DrawingState {
    return { ...this.drawingState };
  }

  loadDrawingState(state: DrawingState) {
    this.drawingState = state;
    this.redrawCanvas();
  }
}
