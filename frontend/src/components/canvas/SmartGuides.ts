import paper from 'paper';

interface Guide {
  type: 'center-horizontal' | 'center-vertical' | 'edge-left' | 'edge-right' | 'edge-top' | 'edge-bottom' | 'spacing-horizontal' | 'spacing-vertical';
  position: number; // x for vertical guides, y for horizontal guides
  targetBounds?: paper.Rectangle; // The bounds of the element we're aligning to
  spacing?: number; // For spacing guides
}

interface SnapResult {
  point: paper.Point;
  snapped: boolean;
  guides: Guide[];
}

export class SmartGuides {
  private scope: paper.PaperScope;
  private guideLines: paper.Path[] = [];
  private dimensionLabels: paper.PointText[] = [];
  private dimensionLines: paper.Path[] = [];
  private readonly SNAP_THRESHOLD = 25; // pixels - optimized for actual touch devices
  private readonly GUIDE_COLOR = '#FF0000'; // Red color for guides
  private readonly DIMENSION_COLOR = '#4F46E5'; // Indigo for dimensions
  private readonly CANVAS_BOUNDS: paper.Rectangle;
  
  // Visual styling - more prominent for better visibility
  private readonly SOLID_LINE_WIDTH = 2;
  private readonly DASHED_LINE_WIDTH = 2;
  private readonly DASH_ARRAY = [6, 4];
  private readonly DIMENSION_LINE_WIDTH = 1.5;
  private readonly DIMENSION_FONT_SIZE = 11;

  constructor(scope: paper.PaperScope, canvasWidth: number = 500, canvasHeight: number = 500) {
    this.scope = scope;
    this.CANVAS_BOUNDS = new paper.Rectangle(0, 0, canvasWidth, canvasHeight);
  }

  /**
   * Calculate snap position and guides for a moving item
   */
  calculateSnap(
    movingBounds: paper.Rectangle,
    movingItem: paper.Item
  ): SnapResult {
    const guides: Guide[] = [];
    let snappedX = movingBounds.center.x;
    let snappedY = movingBounds.center.y;
    let snappedToX = false;
    let snappedToY = false;

    // Get all other items on canvas (excluding the moving item and transform controls)
    const otherItems = this.getOtherItems(movingItem);

    // 1. Check canvas center alignment
    const canvasCenter = this.CANVAS_BOUNDS.center;
    
    // Horizontal center - prioritize center alignment with larger threshold
    const centerThreshold = this.SNAP_THRESHOLD * 2; // Much more responsive for center (50px)
    if (Math.abs(movingBounds.center.x - canvasCenter.x) < centerThreshold) {
      snappedX = canvasCenter.x;
      snappedToX = true;
      guides.push({
        type: 'center-vertical',
        position: canvasCenter.x
      });
    }
    
    // Vertical center
    if (Math.abs(movingBounds.center.y - canvasCenter.y) < centerThreshold) {
      snappedY = canvasCenter.y;
      snappedToY = true;
      guides.push({
        type: 'center-horizontal',
        position: canvasCenter.y
      });
    }

    // 2. Check alignment with other items
    // Collect all possible alignments first, then pick the best ones
    const horizontalAlignments: Array<{ distance: number; type: Guide['type']; pos: number; offset: number; bounds: paper.Rectangle }> = [];
    const verticalAlignments: Array<{ distance: number; type: Guide['type']; pos: number; offset: number; bounds: paper.Rectangle }> = [];
    
    for (const item of otherItems) {
      const itemBounds = item.bounds;
      
      // Collect horizontal alignments (vertical guides)
      if (!snappedToX) {
        horizontalAlignments.push(
          { distance: Math.abs(movingBounds.left - itemBounds.left), type: 'edge-left', pos: itemBounds.left, offset: movingBounds.width / 2, bounds: itemBounds },
          { distance: Math.abs(movingBounds.right - itemBounds.right), type: 'edge-right', pos: itemBounds.right, offset: -movingBounds.width / 2, bounds: itemBounds },
          { distance: Math.abs(movingBounds.center.x - itemBounds.center.x), type: 'center-vertical', pos: itemBounds.center.x, offset: 0, bounds: itemBounds },
          { distance: Math.abs(movingBounds.left - itemBounds.right), type: 'edge-right', pos: itemBounds.right, offset: movingBounds.width / 2, bounds: itemBounds },
          { distance: Math.abs(movingBounds.right - itemBounds.left), type: 'edge-left', pos: itemBounds.left, offset: -movingBounds.width / 2, bounds: itemBounds }
        );
      }

      // Collect vertical alignments (horizontal guides)
      if (!snappedToY) {
        verticalAlignments.push(
          { distance: Math.abs(movingBounds.top - itemBounds.top), type: 'edge-top', pos: itemBounds.top, offset: movingBounds.height / 2, bounds: itemBounds },
          { distance: Math.abs(movingBounds.bottom - itemBounds.bottom), type: 'edge-bottom', pos: itemBounds.bottom, offset: -movingBounds.height / 2, bounds: itemBounds },
          { distance: Math.abs(movingBounds.center.y - itemBounds.center.y), type: 'center-horizontal', pos: itemBounds.center.y, offset: 0, bounds: itemBounds },
          { distance: Math.abs(movingBounds.top - itemBounds.bottom), type: 'edge-bottom', pos: itemBounds.bottom, offset: movingBounds.height / 2, bounds: itemBounds },
          { distance: Math.abs(movingBounds.bottom - itemBounds.top), type: 'edge-top', pos: itemBounds.top, offset: -movingBounds.height / 2, bounds: itemBounds }
        );
      }
    }
    
    // Find best horizontal alignment
    if (!snappedToX && horizontalAlignments.length > 0) {
      const closest = horizontalAlignments
        .filter(a => a.distance < this.SNAP_THRESHOLD)
        .sort((a, b) => a.distance - b.distance)[0];
      
      if (closest) {
        snappedX = closest.pos + closest.offset;
        snappedToX = true;
        guides.push({
          type: closest.type,
          position: closest.pos,
          targetBounds: closest.bounds
        });
      }
    }
    
    // Find best vertical alignment
    if (!snappedToY && verticalAlignments.length > 0) {
      const closest = verticalAlignments
        .filter(a => a.distance < this.SNAP_THRESHOLD)
        .sort((a, b) => a.distance - b.distance)[0];
      
      if (closest) {
        snappedY = closest.pos + closest.offset;
        snappedToY = true;
        guides.push({
          type: closest.type,
          position: closest.pos,
          targetBounds: closest.bounds
        });
      }
    }

    // 3. Check equal spacing distribution
    const spacingGuides = this.checkEqualSpacing(movingBounds, otherItems);
    guides.push(...spacingGuides);

    // 4. Check canvas edge alignment
    const edgeGuides = this.checkCanvasEdges(movingBounds);
    guides.push(...edgeGuides);

    return {
      point: new paper.Point(snappedX, snappedY),
      snapped: snappedToX || snappedToY,
      guides
    };
  }

  /**
   * Check for equal spacing between elements
   */
  private checkEqualSpacing(
    movingBounds: paper.Rectangle,
    otherItems: paper.Item[]
  ): Guide[] {
    const guides: Guide[] = [];
    
    if (otherItems.length < 2) return guides;

    // Sort items by position for horizontal and vertical spacing checks
    const sortedByX = [...otherItems].sort((a, b) => a.bounds.center.x - b.bounds.center.x);
    const sortedByY = [...otherItems].sort((a, b) => a.bounds.center.y - b.bounds.center.y);

    // Check horizontal spacing
    for (let i = 0; i < sortedByX.length - 1; i++) {
      const item1 = sortedByX[i];
      const item2 = sortedByX[i + 1];
      const spacing1 = item2.bounds.left - item1.bounds.right;
      
      // Check if moving item creates equal spacing
      const spacingBefore = movingBounds.left - item1.bounds.right;
      const spacingAfter = item2.bounds.left - movingBounds.right;
      
      if (Math.abs(spacingBefore - spacing1) < this.SNAP_THRESHOLD && 
          Math.abs(spacingAfter - spacing1) < this.SNAP_THRESHOLD) {
        guides.push({
          type: 'spacing-horizontal',
          position: movingBounds.center.x,
          spacing: spacing1,
          targetBounds: item1.bounds
        });
      }
    }

    // Check vertical spacing
    for (let i = 0; i < sortedByY.length - 1; i++) {
      const item1 = sortedByY[i];
      const item2 = sortedByY[i + 1];
      const spacing1 = item2.bounds.top - item1.bounds.bottom;
      
      // Check if moving item creates equal spacing
      const spacingBefore = movingBounds.top - item1.bounds.bottom;
      const spacingAfter = item2.bounds.top - movingBounds.bottom;
      
      if (Math.abs(spacingBefore - spacing1) < this.SNAP_THRESHOLD && 
          Math.abs(spacingAfter - spacing1) < this.SNAP_THRESHOLD) {
        guides.push({
          type: 'spacing-vertical',
          position: movingBounds.center.y,
          spacing: spacing1,
          targetBounds: item1.bounds
        });
      }
    }

    return guides;
  }

  /**
   * Check alignment with canvas edges
   */
  private checkCanvasEdges(movingBounds: paper.Rectangle): Guide[] {
    const guides: Guide[] = [];
    const margin = 20; // Safe area margin

    // Left edge
    if (Math.abs(movingBounds.left - margin) < this.SNAP_THRESHOLD) {
      guides.push({
        type: 'edge-left',
        position: margin
      });
    }

    // Right edge
    if (Math.abs(movingBounds.right - (this.CANVAS_BOUNDS.width - margin)) < this.SNAP_THRESHOLD) {
      guides.push({
        type: 'edge-right',
        position: this.CANVAS_BOUNDS.width - margin
      });
    }

    // Top edge
    if (Math.abs(movingBounds.top - margin) < this.SNAP_THRESHOLD) {
      guides.push({
        type: 'edge-top',
        position: margin
      });
    }

    // Bottom edge
    if (Math.abs(movingBounds.bottom - (this.CANVAS_BOUNDS.height - margin)) < this.SNAP_THRESHOLD) {
      guides.push({
        type: 'edge-bottom',
        position: this.CANVAS_BOUNDS.height - margin
      });
    }

    return guides;
  }

  /**
   * Render guide lines on canvas
   */
  showGuides(guides: Guide[]): void {
    this.clearGuides();

    for (const guide of guides) {
      let line: paper.Path;

      switch (guide.type) {
        case 'center-horizontal':
          // Horizontal line across canvas
          line = new paper.Path.Line(
            new paper.Point(0, guide.position),
            new paper.Point(this.CANVAS_BOUNDS.width, guide.position)
          );
          line.strokeColor = new paper.Color(this.GUIDE_COLOR);
          line.strokeWidth = this.SOLID_LINE_WIDTH;
          line.opacity = 0.9; // Slightly transparent for better visibility
          break;

        case 'center-vertical':
          // Vertical line across canvas
          line = new paper.Path.Line(
            new paper.Point(guide.position, 0),
            new paper.Point(guide.position, this.CANVAS_BOUNDS.height)
          );
          line.strokeColor = new paper.Color(this.GUIDE_COLOR);
          line.strokeWidth = this.SOLID_LINE_WIDTH;
          line.opacity = 0.9; // Slightly transparent for better visibility
          break;

        case 'edge-left':
        case 'edge-right':
          // Vertical dashed line
          const startY = guide.targetBounds ? 
            Math.min(guide.targetBounds.top, guide.targetBounds.bottom) - 20 : 0;
          const endY = guide.targetBounds ? 
            Math.max(guide.targetBounds.top, guide.targetBounds.bottom) + 20 : this.CANVAS_BOUNDS.height;
          
          line = new paper.Path.Line(
            new paper.Point(guide.position, startY),
            new paper.Point(guide.position, endY)
          );
          line.strokeColor = new paper.Color(this.GUIDE_COLOR);
          line.strokeWidth = this.DASHED_LINE_WIDTH;
          line.dashArray = this.DASH_ARRAY;
          break;

        case 'edge-top':
        case 'edge-bottom':
          // Horizontal dashed line
          const startX = guide.targetBounds ? 
            Math.min(guide.targetBounds.left, guide.targetBounds.right) - 20 : 0;
          const endX = guide.targetBounds ? 
            Math.max(guide.targetBounds.left, guide.targetBounds.right) + 20 : this.CANVAS_BOUNDS.width;
          
          line = new paper.Path.Line(
            new paper.Point(startX, guide.position),
            new paper.Point(endX, guide.position)
          );
          line.strokeColor = new paper.Color(this.GUIDE_COLOR);
          line.strokeWidth = this.DASHED_LINE_WIDTH;
          line.dashArray = this.DASH_ARRAY;
          break;

        case 'spacing-horizontal':
        case 'spacing-vertical':
          // Dashed lines showing equal spacing
          if (guide.targetBounds) {
            if (guide.type === 'spacing-horizontal') {
              // Draw vertical dashed lines to show spacing
              const y1 = Math.min(guide.targetBounds.top, guide.targetBounds.bottom);
              const y2 = Math.max(guide.targetBounds.top, guide.targetBounds.bottom);
              
              line = new paper.Path.Line(
                new paper.Point(guide.position, y1),
                new paper.Point(guide.position, y2)
              );
            } else {
              // Draw horizontal dashed lines to show spacing
              const x1 = Math.min(guide.targetBounds.left, guide.targetBounds.right);
              const x2 = Math.max(guide.targetBounds.left, guide.targetBounds.right);
              
              line = new paper.Path.Line(
                new paper.Point(x1, guide.position),
                new paper.Point(x2, guide.position)
              );
            }
            line.strokeColor = new paper.Color(this.GUIDE_COLOR);
            line.strokeWidth = this.DASHED_LINE_WIDTH;
            line.dashArray = this.DASH_ARRAY;
          } else {
            continue;
          }
          break;

        default:
          continue;
      }

      // Mark as guide line and add to tracking
      line.data.isGuide = true;
      line.locked = true; // Prevent interaction
      this.guideLines.push(line);
    }

    this.scope.view.update();
  }

  /**
   * Clear all guide lines and dimensions
   */
  clearGuides(): void {
    for (const line of this.guideLines) {
      line.remove();
    }
    this.guideLines = [];
    
    for (const label of this.dimensionLabels) {
      label.remove();
    }
    this.dimensionLabels = [];
    
    for (const line of this.dimensionLines) {
      line.remove();
    }
    this.dimensionLines = [];
    
    this.scope.view.update();
  }

  /**
   * Get all items except the moving item and transform controls
   */
  private getOtherItems(movingItem: paper.Item): paper.Item[] {
    const items: paper.Item[] = [];
    
    for (const layer of this.scope.project.layers) {
      for (const child of layer.children) {
        // Skip the moving item
        if (child === movingItem) continue;
        
        // Skip transform controls
        if (child.data?.isTransformControl) continue;
        
        // Skip guide lines
        if (child.data?.isGuide) continue;
        
        // Skip background elements
        if (child.data?.isBackground) continue;
        
        // Skip locked or invisible items
        if (child.locked || !child.visible) continue;
        
        items.push(child);
      }
    }
    
    return items;
  }

  /**
   * Check if an item is a guide line
   */
  isGuide(item: paper.Item): boolean {
    return item.data?.isGuide === true;
  }

  /**
   * Show dimensions for the selected item
   */
  showDimensions(bounds: paper.Rectangle, otherItems?: paper.Item[]): void {
    // Clear existing dimensions
    for (const label of this.dimensionLabels) {
      label.remove();
    }
    this.dimensionLabels = [];
    
    for (const line of this.dimensionLines) {
      line.remove();
    }
    this.dimensionLines = [];
    
    const width = Math.round(bounds.width);
    const height = Math.round(bounds.height);
    const offset = 15; // Distance from object
    
    // Width dimension (top)
    this.createDimensionLine(
      new paper.Point(bounds.left, bounds.top - offset),
      new paper.Point(bounds.right, bounds.top - offset),
      `${width}px`,
      'horizontal'
    );
    
    // Height dimension (right)
    this.createDimensionLine(
      new paper.Point(bounds.right + offset, bounds.top),
      new paper.Point(bounds.right + offset, bounds.bottom),
      `${height}px`,
      'vertical'
    );
    
    // Check for size matching with other items
    if (otherItems && otherItems.length > 0) {
      for (const item of otherItems) {
        const itemBounds = item.bounds;
        const itemWidth = Math.round(itemBounds.width);
        const itemHeight = Math.round(itemBounds.height);
        
        // Show matching width indicator
        if (Math.abs(width - itemWidth) < 2) {
          this.createSizeMatchIndicator(
            bounds,
            itemBounds,
            'width',
            `${width}px`
          );
        }
        
        // Show matching height indicator
        if (Math.abs(height - itemHeight) < 2) {
          this.createSizeMatchIndicator(
            bounds,
            itemBounds,
            'height',
            `${height}px`
          );
        }
      }
    }
    
    this.scope.view.update();
  }
  
  /**
   * Create a dimension line with label
   */
  private createDimensionLine(
    start: paper.Point,
    end: paper.Point,
    label: string,
    orientation: 'horizontal' | 'vertical'
  ): void {
    // Main dimension line
    const line = new paper.Path.Line(start, end);
    line.strokeColor = new paper.Color(this.DIMENSION_COLOR);
    line.strokeWidth = this.DIMENSION_LINE_WIDTH;
    line.data.isDimension = true;
    line.locked = true;
    this.dimensionLines.push(line);
    
    // End caps
    const capSize = 4;
    if (orientation === 'horizontal') {
      // Left cap
      const leftCap = new paper.Path.Line(
        new paper.Point(start.x, start.y - capSize),
        new paper.Point(start.x, start.y + capSize)
      );
      leftCap.strokeColor = new paper.Color(this.DIMENSION_COLOR);
      leftCap.strokeWidth = this.DIMENSION_LINE_WIDTH;
      leftCap.data.isDimension = true;
      leftCap.locked = true;
      this.dimensionLines.push(leftCap);
      
      // Right cap
      const rightCap = new paper.Path.Line(
        new paper.Point(end.x, end.y - capSize),
        new paper.Point(end.x, end.y + capSize)
      );
      rightCap.strokeColor = new paper.Color(this.DIMENSION_COLOR);
      rightCap.strokeWidth = this.DIMENSION_LINE_WIDTH;
      rightCap.data.isDimension = true;
      rightCap.locked = true;
      this.dimensionLines.push(rightCap);
    } else {
      // Top cap
      const topCap = new paper.Path.Line(
        new paper.Point(start.x - capSize, start.y),
        new paper.Point(start.x + capSize, start.y)
      );
      topCap.strokeColor = new paper.Color(this.DIMENSION_COLOR);
      topCap.strokeWidth = this.DIMENSION_LINE_WIDTH;
      topCap.data.isDimension = true;
      topCap.locked = true;
      this.dimensionLines.push(topCap);
      
      // Bottom cap
      const bottomCap = new paper.Path.Line(
        new paper.Point(end.x - capSize, end.y),
        new paper.Point(end.x + capSize, end.y)
      );
      bottomCap.strokeColor = new paper.Color(this.DIMENSION_COLOR);
      bottomCap.strokeWidth = this.DIMENSION_LINE_WIDTH;
      bottomCap.data.isDimension = true;
      bottomCap.locked = true;
      this.dimensionLines.push(bottomCap);
    }
    
    // Label
    const midPoint = start.add(end).divide(2);
    const text = new paper.PointText(midPoint);
    text.content = label;
    text.fontSize = this.DIMENSION_FONT_SIZE;
    text.fillColor = new paper.Color(this.DIMENSION_COLOR);
    text.fontWeight = '600';
    text.justification = 'center';
    
    // Position label slightly offset
    if (orientation === 'horizontal') {
      text.position = new paper.Point(midPoint.x, midPoint.y - 5);
    } else {
      text.position = new paper.Point(midPoint.x + 15, midPoint.y);
    }
    
    text.data.isDimension = true;
    text.locked = true;
    this.dimensionLabels.push(text);
  }
  
  /**
   * Create size match indicator between two objects
   */
  private createSizeMatchIndicator(
    bounds1: paper.Rectangle,
    bounds2: paper.Rectangle,
    dimension: 'width' | 'height',
    label: string
  ): void {
    const offset = 25;
    
    if (dimension === 'width') {
      // Draw connecting line between the two width indicators
      const y = Math.min(bounds1.top, bounds2.top) - offset;
      const line = new paper.Path.Line(
        new paper.Point(bounds1.center.x, y),
        new paper.Point(bounds2.center.x, y)
      );
      line.strokeColor = new paper.Color('#10B981'); // Green for match
      line.strokeWidth = 2;
      line.dashArray = [4, 4];
      line.data.isDimension = true;
      line.locked = true;
      this.dimensionLines.push(line);
      
      // Add "=" symbol
      const midPoint = new paper.Point(
        (bounds1.center.x + bounds2.center.x) / 2,
        y
      );
      const text = new paper.PointText(midPoint);
      text.content = '=';
      text.fontSize = 14;
      text.fillColor = new paper.Color('#10B981');
      text.fontWeight = 'bold';
      text.justification = 'center';
      text.position = new paper.Point(midPoint.x, midPoint.y - 5);
      text.data.isDimension = true;
      text.locked = true;
      this.dimensionLabels.push(text);
    } else {
      // Draw connecting line between the two height indicators
      const x = Math.max(bounds1.right, bounds2.right) + offset;
      const line = new paper.Path.Line(
        new paper.Point(x, bounds1.center.y),
        new paper.Point(x, bounds2.center.y)
      );
      line.strokeColor = new paper.Color('#10B981'); // Green for match
      line.strokeWidth = 2;
      line.dashArray = [4, 4];
      line.data.isDimension = true;
      line.locked = true;
      this.dimensionLines.push(line);
      
      // Add "=" symbol
      const midPoint = new paper.Point(
        x,
        (bounds1.center.y + bounds2.center.y) / 2
      );
      const text = new paper.PointText(midPoint);
      text.content = '=';
      text.fontSize = 14;
      text.fillColor = new paper.Color('#10B981');
      text.fontWeight = 'bold';
      text.justification = 'center';
      text.position = new paper.Point(midPoint.x + 15, midPoint.y);
      text.data.isDimension = true;
      text.locked = true;
      this.dimensionLabels.push(text);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.clearGuides();
  }
}
