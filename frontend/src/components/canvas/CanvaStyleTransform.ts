import paper from 'paper';
import { SmartGuides } from './SmartGuides';

interface TransformHandle {
  type: 'corner' | 'edge' | 'rotate';
  position: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'r' | 'b' | 'l' | 'rotate';
  path: paper.Path;
}

export class CanvaStyleTransform {
  private scope: paper.PaperScope;
  private selectedItem: paper.Item | null = null;
  private handles: TransformHandle[] = [];
  private boundingBox: paper.Path | null = null;
  private rotationLine: paper.Path | null = null;
  private smartGuides: SmartGuides;
  
  // Transform state
  private isTransforming = false;
  private transformType: 'move' | 'resize' | 'rotate' | null = null;
  
  // Collaboration callbacks
  private onTransformStart: ((itemId: string) => void) | null = null;
  private onTransform: ((itemId: string, data: any) => void) | null = null;
  private onTransformEnd: ((itemId: string) => void) | null = null;
  private onDelete: ((itemId: string) => void) | null = null;
  private startPoint: paper.Point | null = null;
  private startBounds: paper.Rectangle | null = null;
  private startAngle: number = 0;
  private startRotation: number = 0;
  private accumulatedRotation: number = 0;
  private currentHandle: TransformHandle | null = null;
  
  // Visual styling - optimized for touch
  private readonly HANDLE_SIZE = 16; // Larger for touch devices
  private readonly HANDLE_OFFSET = 10; // More space for touch
  private readonly ROTATION_DISTANCE = 50; // Further away for easier access
  private readonly PRIMARY_COLOR = '#4F46E5'; // Indigo
  private readonly HANDLE_FILL = '#FFFFFF';
  private readonly HANDLE_STROKE = '#4F46E5';
  private readonly BOX_COLOR = '#4F46E5';
  
  // Callbacks
  private onDragStart: (() => void) | null = null;
  private onDragEnd: (() => void) | null = null;
  private onDragMove: ((point: { x: number; y: number }) => void) | null = null;
  private onDeleteRequest: (() => void) | null = null;

  constructor(scope: paper.PaperScope, canvasWidth: number = 500, canvasHeight: number = 500) {
    this.scope = scope;
    this.smartGuides = new SmartGuides(scope, canvasWidth, canvasHeight);
  }
  
  setDragCallbacks(
    onStart: () => void,
    onEnd: () => void,
    onMove: (point: { x: number; y: number }) => void,
    onDelete: () => void
  ) {
    this.onDragStart = onStart;
    this.onDragEnd = onEnd;
    this.onDragMove = onMove;
    this.onDeleteRequest = onDelete;
  }

  /**
   * Select an item and show transform controls
   */
  selectItem(item: paper.Item): void {
    // Don't select transform controls themselves
    if (this.isTransformControl(item)) {
      return;
    }

    // Don't select background elements
    if (this.isBackgroundElement(item)) {
      return;
    }

    this.clearSelection();
    this.selectedItem = item;
    this.createTransformControls();
    
    // Show dimensions for the selected item
    const otherItems = this.getOtherItems(item);
    this.smartGuides.showDimensions(item.bounds, otherItems);
    
    this.scope.view.update();
  }

  /**
   * Clear current selection
   */
  clearSelection(): void {
    this.removeTransformControls();
    this.smartGuides.clearGuides();
    this.selectedItem = null;
    this.scope.view.update();
  }

  /**
   * Handle mouse down event
   */
  handleMouseDown(point: paper.Point): boolean {
    // Check if clicking on selected item first (prioritize moving over handle selection)
    if (this.selectedItem) {
      const hitResult = this.selectedItem.hitTest(point, {
        fill: true,
        stroke: true,
        tolerance: 20 // Much larger for touch
      });

      if (hitResult) {
        // Check if we're close to the center of the object (prefer moving)
        const bounds = this.selectedItem.bounds;
        const center = bounds.center;
        const distanceFromCenter = point.getDistance(center);
        const maxDimension = Math.max(bounds.width, bounds.height);
        
        // If we're in the inner 60% of the object, prioritize moving
        if (distanceFromCenter < maxDimension * 0.3) {
          this.startMove(point);
          return true;
        }
        
        // Otherwise, check for handles first, then fall back to moving
        const handle = this.getHandleAtPoint(point);
        if (handle) {
          this.startTransform(handle, point);
          return true;
        }
        
        // If no handle found, start moving
        this.startMove(point);
        return true;
      }
    }

    // Check if clicking on a handle (for newly selected items)
    const handle = this.getHandleAtPoint(point);
    if (handle) {
      this.startTransform(handle, point);
      return true;
    }

    // Try to select a new item
    const hitResult = this.scope.project.hitTest(point, {
      fill: true,
      stroke: true,
      tolerance: 20 // Much larger for touch
    });

    if (hitResult && hitResult.item && !this.isTransformControl(hitResult.item) && !this.isBackgroundElement(hitResult.item)) {
      const selectableItem = this.getSelectableItem(hitResult.item);
      if (selectableItem) {
        this.selectItem(selectableItem);
        return true;
      }
    }

    // Clicked on empty space - deselect
    this.clearSelection();
    return false;
  }

  /**
   * Handle mouse drag event
   */
  handleMouseDrag(point: paper.Point): void {
    if (!this.isTransforming || !this.selectedItem || !this.startPoint) {
      return;
    }

    switch (this.transformType) {
      case 'move':
        this.performMove(point);
        break;
      case 'resize':
        this.performResize(point);
        break;
      case 'rotate':
        this.performRotate(point);
        break;
    }

    this.updateTransformControls();
    this.scope.view.update();
  }

  /**
   * Handle mouse up event
   */
  handleMouseUp(): void {
    const wasMoving = this.isTransforming && this.transformType === 'move';
    const wasTransforming = this.isTransforming;
    
    // Notify collaboration that transform ended
    if (wasTransforming && this.onTransformEnd && this.selectedItem) {
      // Get existing ID - use data.id, data.itemId, or Paper.js numeric id as fallback
      let itemId = this.selectedItem.data?.id || this.selectedItem.data?.itemId;
      if (!itemId) {
        itemId = String(this.selectedItem.id);
      }
      this.onTransformEnd(itemId);
    }
    
    this.isTransforming = false;
    this.transformType = null;
    this.startPoint = null;
    this.startBounds = null;
    this.currentHandle = null;
    
    // Clear smart guides when done moving
    this.smartGuides.clearGuides();
    
    // Notify drag end
    if (wasMoving && this.onDragEnd) {
      this.onDragEnd();
    }
  }
  
  deleteSelectedItem(): void {
    if (this.selectedItem) {
      // Get existing ID - use data.id, data.itemId, or Paper.js numeric id as fallback
      const itemId = this.selectedItem.data?.id || this.selectedItem.data?.itemId || String(this.selectedItem.id);
      
      // Notify collaboration about deletion
      if (this.onDelete && !this.selectedItem.data?.isRemote) {
        this.onDelete(itemId);
        console.log('📤 Delete event sent:', itemId);
      }
      
      this.selectedItem.remove();
      this.clearSelection();
    }
  }

  // ========== Private Methods ==========

  private createTransformControls(): void {
    if (!this.selectedItem) return;

    const bounds = this.selectedItem.bounds;

    // Create bounding box - more visible for touch
    this.boundingBox = new this.scope.Path.Rectangle({
      rectangle: bounds,
      strokeColor: this.BOX_COLOR,
      strokeWidth: 2,
      dashArray: [6, 4]
    });

    // Create corner handles (for proportional scaling) - positioned outside bounds
    this.createHandle('tl', bounds.topLeft.add(new this.scope.Point(-this.HANDLE_OFFSET, -this.HANDLE_OFFSET)), 'corner');
    this.createHandle('tr', bounds.topRight.add(new this.scope.Point(this.HANDLE_OFFSET, -this.HANDLE_OFFSET)), 'corner');
    this.createHandle('bl', bounds.bottomLeft.add(new this.scope.Point(-this.HANDLE_OFFSET, this.HANDLE_OFFSET)), 'corner');
    this.createHandle('br', bounds.bottomRight.add(new this.scope.Point(this.HANDLE_OFFSET, this.HANDLE_OFFSET)), 'corner');

    // Create edge handles (for directional scaling) - positioned outside bounds
    this.createHandle('t', bounds.topCenter.add(new this.scope.Point(0, -this.HANDLE_OFFSET)), 'edge');
    this.createHandle('r', bounds.rightCenter.add(new this.scope.Point(this.HANDLE_OFFSET, 0)), 'edge');
    this.createHandle('b', bounds.bottomCenter.add(new this.scope.Point(0, this.HANDLE_OFFSET)), 'edge');
    this.createHandle('l', bounds.leftCenter.add(new this.scope.Point(-this.HANDLE_OFFSET, 0)), 'edge');

    // Create rotation handle
    const rotatePos = bounds.topCenter.add(new this.scope.Point(0, -this.ROTATION_DISTANCE));
    
    // Line connecting to rotation handle
    this.rotationLine = new this.scope.Path.Line({
      from: bounds.topCenter,
      to: rotatePos,
      strokeColor: this.BOX_COLOR,
      strokeWidth: 1.5
    });

    this.createHandle('rotate', rotatePos, 'rotate');
  }

  private createHandle(
    position: TransformHandle['position'],
    point: paper.Point,
    type: TransformHandle['type']
  ): void {
    const isRotate = type === 'rotate';
    const size = isRotate ? this.HANDLE_SIZE + 2 : this.HANDLE_SIZE; // Rotation handle slightly larger

    const handle = new this.scope.Path.Circle({
      center: point,
      radius: size / 2,
      fillColor: this.HANDLE_FILL,
      strokeColor: isRotate ? '#EF4444' : this.HANDLE_STROKE,
      strokeWidth: 2.5 // Thicker stroke for better visibility
    });

    // Add rotation icon indicator (small circle inside)
    if (isRotate) {
      const innerCircle = new this.scope.Path.Circle({
        center: point,
        radius: 2,
        fillColor: '#EF4444'
      });
      innerCircle.data.isTransformControl = true;
    }

    handle.data.isTransformControl = true;
    
    this.handles.push({ type, position, path: handle });
  }

  private removeTransformControls(): void {
    if (this.boundingBox) {
      this.boundingBox.remove();
      this.boundingBox = null;
    }

    if (this.rotationLine) {
      this.rotationLine.remove();
      this.rotationLine = null;
    }

    // Remove all handles and their associated elements
    this.handles.forEach(handle => {
      handle.path.remove();
    });
    this.handles = [];

    // Clean up any orphaned transform control elements
    const allItems = this.scope.project.getItems({
      data: (item: any) => item.isTransformControl === true
    });
    allItems.forEach(item => item.remove());
  }

  private updateTransformControls(): void {
    if (!this.selectedItem) return;

    // Remove existing controls and recreate them
    // This ensures clean state and prevents orphaned elements
    this.removeTransformControls();
    this.createTransformControls();
  }

  private getHandleAtPoint(point: paper.Point): TransformHandle | null {
    for (const handle of this.handles) {
      const hitResult = handle.path.hitTest(point, {
        fill: true,
        tolerance: 25 // Much larger tolerance for touch devices
      });
      if (hitResult) {
        return handle;
      }
    }
    return null;
  }

  private isTransformControl(item: paper.Item): boolean {
    // Check if item or any parent is a transform control
    let current: paper.Item | null = item;
    while (current) {
      if (current.data && current.data.isTransformControl) {
        return true;
      }
      current = current.parent instanceof this.scope.Item ? current.parent : null;
    }
    return false;
  }

  private isBackgroundElement(item: paper.Item): boolean {
    // Check if item is marked as a background element
    return item.data && item.data.isBackground === true;
  }
  
  private getOtherItems(currentItem: paper.Item): paper.Item[] {
    const items: paper.Item[] = [];
    
    for (const layer of this.scope.project.layers) {
      for (const child of layer.children) {
        // Skip the current item
        if (child === currentItem) continue;
        
        // Skip transform controls
        if (child.data?.isTransformControl) continue;
        
        // Skip guide lines and dimensions
        if (child.data?.isGuide || child.data?.isDimension) continue;
        
        // Skip background elements
        if (child.data?.isBackground) continue;
        
        // Skip locked or invisible items
        if (child.locked || !child.visible) continue;
        
        items.push(child);
      }
    }
    
    return items;
  }

  private isClickableArea(item: paper.Item): boolean {
    // Check if item is a clickable area helper
    return item.data && item.data.isClickableArea === true;
  }

  private getSelectableItem(item: paper.Item): paper.Item | null {
    // If it's a clickable area, return its parent group
    if (this.isClickableArea(item) && item.parent) {
      return item.parent;
    }
    
    // If it's part of a drawn shape group, return the group
    if (item.parent && item.parent.data && item.parent.data.isDrawnShape) {
      return item.parent;
    }
    
    // If it's already a drawn shape group, return it
    if (item.data && item.data.isDrawnShape) {
      return item;
    }
    
    // Otherwise return the item itself
    return item;
  }

  // ========== Transform Operations ==========

  private startMove(point: paper.Point): void {
    this.isTransforming = true;
    this.transformType = 'move';
    
    // Notify collaboration that transform started
    if (this.onTransformStart && this.selectedItem) {
      // Get existing ID - use data.id, data.itemId, or Paper.js numeric id as fallback
      let itemId = this.selectedItem.data?.id || this.selectedItem.data?.itemId;
      if (!itemId) {
        // Fallback to Paper.js numeric ID if no custom ID exists
        itemId = String(this.selectedItem.id);
        console.warn('⚠️ No custom itemId found, using Paper.js ID:', itemId);
      }
      this.onTransformStart(itemId);
    }
    this.startPoint = point.clone();
    
    // Notify drag start
    if (this.onDragStart) {
      this.onDragStart();
    }
  }

  private performMove(point: paper.Point): void {
    if (!this.selectedItem || !this.startPoint) return;

    const delta = point.subtract(this.startPoint);
    this.selectedItem.translate(delta);
    this.startPoint = point.clone();
    
    // Calculate and show guide lines (visual only, no snapping)
    const snapResult = this.smartGuides.calculateSnap(
      this.selectedItem.bounds,
      this.selectedItem
    );
    
    // Show guide lines as visual indicators only
    this.smartGuides.showGuides(snapResult.guides);
    
    // Update dimensions while moving
    const otherItems = this.getOtherItems(this.selectedItem);
    this.smartGuides.showDimensions(this.selectedItem.bounds, otherItems);
    
    // Notify drag move with current position
    if (this.onDragMove) {
      this.onDragMove({ x: point.x, y: point.y });
    }
    
    // Send real-time transform update to collaborators
    if (this.onTransform && this.selectedItem && !this.selectedItem.data?.isRemote) {
      // Get existing ID - use data.id, data.itemId, or Paper.js numeric id as fallback
      let itemId = this.selectedItem.data?.id || this.selectedItem.data?.itemId;
      if (!itemId) {
        // Fallback to Paper.js numeric ID
        itemId = String(this.selectedItem.id);
        console.warn('⚠️ Transform with no custom itemId, using Paper.js ID:', itemId);
      }
      
      const transformData = {
        itemId,
        type: 'move',
        matrix: [
          this.selectedItem.matrix.a,
          this.selectedItem.matrix.b, 
          this.selectedItem.matrix.c,
          this.selectedItem.matrix.d,
          this.selectedItem.matrix.tx,
          this.selectedItem.matrix.ty
        ],
        bounds: {
          x: this.selectedItem.bounds.x,
          y: this.selectedItem.bounds.y,
          width: this.selectedItem.bounds.width,
          height: this.selectedItem.bounds.height
        },
        rotation: this.selectedItem.rotation || 0,
        scale: { x: 1, y: 1 },
        position: {
          x: this.selectedItem.position.x,
          y: this.selectedItem.position.y
        }
      };
      console.log('📤 Sending move transform:', { itemId, transformData });
      this.onTransform(itemId, transformData);
    }
  }

  private startTransform(handle: TransformHandle, point: paper.Point): void {
    if (!this.selectedItem) return;

    this.isTransforming = true;
    this.currentHandle = handle;
    this.startPoint = point.clone();
    this.startBounds = this.selectedItem.bounds.clone();

    if (handle.type === 'rotate') {
      this.transformType = 'rotate';
      const center = this.selectedItem.bounds.center;
      const vector = point.subtract(center);
      this.startAngle = Math.atan2(vector.y, vector.x);
      this.startRotation = this.selectedItem.rotation || 0;
      this.accumulatedRotation = 0; // Reset accumulated rotation
      console.log('🎯 Starting rotation:', { startRotation: this.startRotation });
    } else {
      this.transformType = 'resize';
    }
  }

  private performResize(point: paper.Point): void {
    if (!this.selectedItem || !this.startBounds || !this.currentHandle || !this.startPoint) {
      return;
    }

    const handle = this.currentHandle;
    const startBounds = this.startBounds;
    
    // Calculate the delta from the start point
    const delta = point.subtract(this.startPoint);
    
    // Calculate new dimensions based on handle position
    let newWidth = startBounds.width;
    let newHeight = startBounds.height;
    
    switch (handle.position) {
      case 'tl':
        newWidth = startBounds.width - delta.x;
        newHeight = startBounds.height - delta.y;
        break;
      case 'tr':
        newWidth = startBounds.width + delta.x;
        newHeight = startBounds.height - delta.y;
        break;
      case 'bl':
        newWidth = startBounds.width - delta.x;
        newHeight = startBounds.height + delta.y;
        break;
      case 'br':
        newWidth = startBounds.width + delta.x;
        newHeight = startBounds.height + delta.y;
        break;
      case 't':
        newHeight = startBounds.height - delta.y;
        break;
      case 'b':
        newHeight = startBounds.height + delta.y;
        break;
      case 'l':
        newWidth = startBounds.width - delta.x;
        break;
      case 'r':
        newWidth = startBounds.width + delta.x;
        break;
    }

    // Enforce minimum size
    const minSize = 10;
    newWidth = Math.max(minSize, Math.abs(newWidth));
    newHeight = Math.max(minSize, Math.abs(newHeight));

    // For corner handles, maintain aspect ratio
    if (handle.type === 'corner') {
      const aspectRatio = startBounds.width / startBounds.height;
      if (newWidth / aspectRatio < newHeight) {
        newHeight = newWidth / aspectRatio;
      } else {
        newWidth = newHeight * aspectRatio;
      }
    }

    // Calculate scale factors
    const scaleX = newWidth / startBounds.width;
    const scaleY = newHeight / startBounds.height;

    // Reset item to original bounds and apply new scale
    const currentBounds = this.selectedItem.bounds;
    const resetScaleX = startBounds.width / currentBounds.width;
    const resetScaleY = startBounds.height / currentBounds.height;
    
    // Reset to original size first
    this.selectedItem.scale(resetScaleX, resetScaleY, currentBounds.center);
    this.selectedItem.position = startBounds.center;
    
    // Apply new scale
    this.selectedItem.scale(scaleX, scaleY, startBounds.center);
    
    // Update dimensions while resizing
    const otherItems = this.getOtherItems(this.selectedItem);
    this.smartGuides.showDimensions(this.selectedItem.bounds, otherItems);
    
    // Send real-time transform update to collaborators
    if (this.onTransform && this.selectedItem && !this.selectedItem.data?.isRemote) {
      // Get existing ID - use data.id, data.itemId, or Paper.js numeric id as fallback
      let itemId = this.selectedItem.data?.id || this.selectedItem.data?.itemId;
      if (!itemId) {
        // Fallback to Paper.js numeric ID
        itemId = String(this.selectedItem.id);
        console.warn('⚠️ Transform with no custom itemId, using Paper.js ID:', itemId);
      }
      
      // Get the internal segments/path data for accurate reconstruction
      const pathData = this.selectedItem.exportJSON();
      
      const transformData = {
        itemId,
        type: 'resize',
        matrix: [
          this.selectedItem.matrix.a,
          this.selectedItem.matrix.b,
          this.selectedItem.matrix.c,
          this.selectedItem.matrix.d,
          this.selectedItem.matrix.tx,
          this.selectedItem.matrix.ty
        ],
        bounds: {
          x: this.selectedItem.bounds.x,
          y: this.selectedItem.bounds.y,
          width: this.selectedItem.bounds.width,
          height: this.selectedItem.bounds.height
        },
        rotation: this.selectedItem.rotation || 0,
        scale: { x: scaleX, y: scaleY },
        position: {
          x: this.selectedItem.position.x,
          y: this.selectedItem.position.y
        },
        pathData: pathData // Send the complete path data
      };
      console.log('📤 Sending resize transform:', {
        itemId,
        transformData: JSON.parse(JSON.stringify(transformData))
      });
      this.onTransform(itemId, transformData);
    }
  }

  private performRotate(point: paper.Point): void {
    if (!this.selectedItem || !this.startBounds) return;

    const center = this.startBounds.center;
    const vector = point.subtract(center);
    const currentAngle = Math.atan2(vector.y, vector.x);
    
    // Calculate the incremental rotation angle delta
    const angleDelta = currentAngle - this.startAngle;
    const degrees = (angleDelta * 180) / Math.PI;
    
    // Track total accumulated rotation
    this.accumulatedRotation += degrees;

    console.log('🔄 Rotating:', {
      incrementalDegrees: degrees,
      accumulatedRotation: this.accumulatedRotation,
      totalRotation: this.startRotation + this.accumulatedRotation
    });

    // Apply rotation using Paper.js rotate method
    const itemCenter = this.selectedItem.bounds.center;
    this.selectedItem.rotate(degrees, itemCenter);
    
    // Update start angle for next frame to make rotation incremental
    this.startAngle = currentAngle;
    
    console.log('🔄 After rotate:', {
      itemRotation: this.selectedItem.rotation,
      itemClass: this.selectedItem.className,
      isGroup: this.selectedItem.className === 'Group',
      appliedDegrees: degrees,
      matrix: [this.selectedItem.matrix.a, this.selectedItem.matrix.b, this.selectedItem.matrix.c, this.selectedItem.matrix.d, this.selectedItem.matrix.tx, this.selectedItem.matrix.ty],
      matrixIsIdentity: this.selectedItem.matrix.a === 1 && this.selectedItem.matrix.b === 0,
      extractedRotation: (Math.atan2(this.selectedItem.matrix.b, this.selectedItem.matrix.a) * 180) / Math.PI
    });
    
    // Send real-time transform update to collaborators
    if (this.onTransform && this.selectedItem && !this.selectedItem.data?.isRemote) {
      // Get existing ID - use data.id, data.itemId, or Paper.js numeric id as fallback
      let itemId = this.selectedItem.data?.id || this.selectedItem.data?.itemId;
      if (!itemId) {
        // Fallback to Paper.js numeric ID
        itemId = String(this.selectedItem.id);
        console.warn('⚠️ Transform with no custom itemId, using Paper.js ID:', itemId);
      }
      
      const matrix = [
        this.selectedItem.matrix.a,
        this.selectedItem.matrix.b,
        this.selectedItem.matrix.c,
        this.selectedItem.matrix.d,
        this.selectedItem.matrix.tx,
        this.selectedItem.matrix.ty
      ];
      
      // Calculate rotation from the transformation matrix
      // This is more reliable than item.rotation property
      // atan2(b, a) gives us the rotation angle in radians
      let rotationRadians = Math.atan2(this.selectedItem.matrix.b, this.selectedItem.matrix.a);
      let rotationDegrees = (rotationRadians * 180) / Math.PI;
      
      // Special handling for Groups: if the group's matrix is identity,
      // check the first child's matrix instead
      if (this.selectedItem.className === 'Group' && 
          Math.abs(this.selectedItem.matrix.a - 1) < 0.001 && 
          Math.abs(this.selectedItem.matrix.b) < 0.001) {
        console.log('⚠️ Group has identity matrix, checking first child...');
        const group = this.selectedItem as any;
        if (group.children && group.children.length > 0) {
          const firstChild = group.children[0];
          rotationRadians = Math.atan2(firstChild.matrix.b, firstChild.matrix.a);
          rotationDegrees = (rotationRadians * 180) / Math.PI;
          console.log('✅ Using child matrix for rotation:', rotationDegrees);
        }
      }
      
      // If matrix rotation is still 0, fall back to accumulated rotation
      if (Math.abs(rotationDegrees) < 0.001) {
        rotationDegrees = this.startRotation + this.accumulatedRotation;
        console.log('⚠️ Matrix rotation is 0, using accumulated rotation:', rotationDegrees);
      }
      
      // Use the calculated rotation from matrix
      const actualRotation = rotationDegrees;
      
      // Get the internal segments/path data for accurate reconstruction
      const pathData = this.selectedItem.exportJSON();
      
      const transformData = {
        itemId,
        type: 'rotate',
        matrix: matrix,
        bounds: {
          x: this.selectedItem.bounds.x,
          y: this.selectedItem.bounds.y,
          width: this.selectedItem.bounds.width,
          height: this.selectedItem.bounds.height
        },
        rotation: actualRotation, // Send the accumulated rotation value
        scale: { x: 1, y: 1 },
        position: {
          x: this.selectedItem.position.x,
          y: this.selectedItem.position.y
        },
        pathData: pathData // Send the complete path data
      };
      console.log('📤 Sending rotate transform:', {
        itemId,
        matrix: matrix,
        rotation: actualRotation,
        calculatedFromMatrix: rotationDegrees,
        accumulatedRotation: this.accumulatedRotation,
        startRotation: this.startRotation,
        paperJsRotation: this.selectedItem.rotation,
        matrixValues: { a: matrix[0], b: matrix[1], c: matrix[2], d: matrix[3] },
        isIdentityMatrix: matrix[0] === 1 && matrix[1] === 0 && matrix[2] === 0 && matrix[3] === 1,
        transformData: JSON.parse(JSON.stringify(transformData))
      });
      this.onTransform(itemId, transformData);
    }
  }

  /**
   * Get the currently selected item
   */
  getSelectedItem(): paper.Item | null {
    return this.selectedItem;
  }

  /**
   * Check if currently transforming
   */
  isActive(): boolean {
    return this.isTransforming;
  }

  /**
   * Set collaboration callbacks for real-time sync
   */
  setCollaborationCallbacks(
    onTransformStart: (itemId: string) => void,
    onTransform: (itemId: string, data: any) => void,
    onTransformEnd: (itemId: string) => void,
    onDelete?: (itemId: string) => void
  ) {
    this.onTransformStart = onTransformStart;
    this.onTransform = onTransform;
    this.onTransformEnd = onTransformEnd;
    this.onDelete = onDelete || null;
    console.log('🔧 Transform system collaboration callbacks set up');
  }

  /**
   * Destroy and clean up
   */
  destroy(): void {
    this.clearSelection();
  }
}
