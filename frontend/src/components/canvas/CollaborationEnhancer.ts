/**
 * Collaboration Enhancer for Text, Layer, and Transform Tools
 * Provides real-time synchronization for advanced canvas operations
 */

import { collaborationService } from '../../services/collaborationService';
import { PaperDrawingEngine } from './PaperDrawingEngine';

export interface TextEditData {
  textId: string;
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: 'normal' | 'italic';
  color: string;
  position: { x: number; y: number };
  alignment: 'left' | 'center' | 'right';
  pageId?: string;
  pageIndex?: number;
  isCoverImage?: boolean;
}

export interface LayerData {
  layerId: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  zIndex: number;
  pageId?: string;
  pageIndex?: number;
  isCoverImage?: boolean;
}

export interface TransformData {
  itemId: string;
  type: 'move' | 'resize' | 'rotate';
  matrix: number[]; // Paper.js transformation matrix
  bounds: { x: number; y: number; width: number; height: number };
  rotation: number;
  scale: { x: number; y: number };
  position: { x: number; y: number };
  pageId?: string;
  pageIndex?: number;
  isCoverImage?: boolean;
}

export class CollaborationEnhancer {
  private drawingEngine: PaperDrawingEngine | null = null;
  private pageId?: string;
  private pageIndex?: number;
  private isCoverImage?: boolean;
  private isCollaborating = false;
  private throttleTimers = new Map<string, number>();

  constructor(pageId?: string, pageIndex?: number, isCoverImage?: boolean) {
    this.pageId = pageId;
    this.pageIndex = pageIndex;
    this.isCoverImage = isCoverImage;
    this.setupEventHandlers();
  }

  /**
   * Initialize with drawing engine
   */
  initialize(drawingEngine: PaperDrawingEngine) {
    this.drawingEngine = drawingEngine;
  }

  /**
   * Set collaboration state
   */
  setCollaborating(isCollaborating: boolean) {
    this.isCollaborating = isCollaborating;
  }

  /**
   * Update page context
   */
  updateContext(pageId?: string, pageIndex?: number, isCoverImage?: boolean) {
    this.pageId = pageId;
    this.pageIndex = pageIndex;
    this.isCoverImage = isCoverImage;
  }

  /**
   * Send text edit to collaborators
   */
  sendTextEdit(textData: TextEditData) {
    if (!this.isCollaborating || !collaborationService.isConnected()) return;

    const enhancedData = {
      ...textData,
      pageId: this.isCoverImage ? 'cover_image' : (this.pageId || `page_${this.pageIndex}`),
      pageIndex: this.isCoverImage ? -1 : (this.pageIndex !== undefined ? this.pageIndex : 0),
      isCoverImage: this.isCoverImage || false
    };

    // Throttle text updates to prevent spam
    this.throttledSend('text_edit', () => {
      collaborationService.sendMessage({
        type: 'text_edit_advanced',
        data: enhancedData
      });
      console.log('📤 Sent text edit to collaborators:', enhancedData);
    }, 200);
  }

  /**
   * Send layer operation to collaborators
   */
  sendLayerOperation(operation: 'create' | 'update' | 'delete' | 'reorder', layerData: LayerData) {
    if (!this.isCollaborating || !collaborationService.isConnected()) return;

    const enhancedData = {
      ...layerData,
      pageId: this.isCoverImage ? 'cover_image' : (this.pageId || `page_${this.pageIndex}`),
      pageIndex: this.isCoverImage ? -1 : (this.pageIndex !== undefined ? this.pageIndex : 0),
      isCoverImage: this.isCoverImage || false
    };

    collaborationService.sendMessage({
      type: 'layer_operation',
      operation,
      data: enhancedData
    });
    console.log('📤 Sent layer operation to collaborators:', operation, enhancedData);
  }

  /**
   * Send transform operation to collaborators
   */
  sendTransform(transformData: TransformData) {
    if (!this.isCollaborating || !collaborationService.isConnected()) return;

    console.log('🔍 sendTransform received:', {
      transformData: JSON.parse(JSON.stringify(transformData)),
      hasMatrix: !!transformData.matrix,
      matrixLength: transformData.matrix?.length,
      hasBounds: !!transformData.bounds,
      hasPosition: !!transformData.position
    });

    const enhancedData = {
      ...transformData,
      page_id: this.isCoverImage ? 'cover_image' : (this.pageId || `page_${this.pageIndex}`),
      page_index: this.isCoverImage ? -1 : (this.pageIndex !== undefined ? this.pageIndex : 0),
      is_cover_image: this.isCoverImage || false
    };

    // Use different throttle delays based on transform type
    // Rotation needs faster updates for smooth visual feedback
    const throttleDelay = transformData.type === 'rotate' ? 100 : 50;

    // Throttle transform updates to prevent spam during dragging
    this.throttledSend(`transform_${transformData.itemId}`, () => {
      const payload = {
        type: 'transform',
        transformType: transformData.type,
        itemId: transformData.itemId,
        matrix: transformData.matrix,
        bounds: transformData.bounds,
        rotation: transformData.rotation,
        scale: transformData.scale,
        position: transformData.position,
        pathData: (transformData as any).pathData, // Include path data for rotation
        page_id: enhancedData.page_id,
        page_index: enhancedData.page_index,
        is_cover_image: enhancedData.is_cover_image
      };
      
      console.log('📤 Sending transform payload:', JSON.parse(JSON.stringify(payload)));
      
      // Send as a drawing operation so it goes through the same pipeline
      collaborationService.sendDrawing(payload);
    }, throttleDelay);
  }

  /**
   * Send delete operation to collaborators
   */
  sendDelete(itemId: string) {
    if (!this.isCollaborating || !collaborationService.isConnected()) return;

    const deleteData = {
      itemId,
      pageId: this.isCoverImage ? 'cover_image' : (this.pageId || `page_${this.pageIndex}`),
      pageIndex: this.isCoverImage ? -1 : (this.pageIndex !== undefined ? this.pageIndex : 0),
      isCoverImage: this.isCoverImage || false
    };

    collaborationService.sendMessage({
      type: 'delete_item',
      data: deleteData
    });
    console.log('📤 Sent delete to collaborators:', deleteData);
  }

  /**
   * Send tool selection update
   */
  sendToolSelection(tool: string, itemId?: string) {
    if (!this.isCollaborating || !collaborationService.isConnected()) return;

    collaborationService.updatePresence(
      null, // No cursor position update
      tool,
      itemId ? `editing_${itemId}` : undefined
    );
  }

  /**
   * Apply remote text edit
   */
  applyRemoteTextEdit(data: TextEditData) {
    if (!this.drawingEngine || !this.shouldApplyOperation(data)) return;

    try {
      // Find text item by ID (searches both local and remote)
      const scope = (this.drawingEngine as any).scope;
      
      // Search all layers for text with this ID
      let textItem: any = null;
      for (const layer of scope.project.layers) {
        for (const child of layer.children) {
          if (child.data?.id === data.textId || child.data?.textId === data.textId) {
            textItem = child;
            break;
          }
        }
        if (textItem) break;
      }

      if (!textItem && data.content) {
        // Create new text item
        textItem = new scope.PointText({
          point: new scope.Point(data.position.x, data.position.y),
          content: data.content,
          fontSize: data.fontSize,
          fontFamily: data.fontFamily,
          fontWeight: data.fontWeight,
          fontStyle: data.fontStyle,
          fillColor: data.color,
          data: { id: data.textId, textId: data.textId, isText: true, isRemote: true }
        });

        // Apply text alignment
        if (data.alignment === 'center') {
          textItem.position.x += textItem.bounds.width / 2;
        } else if (data.alignment === 'right') {
          textItem.position.x += textItem.bounds.width;
        }
      } else if (textItem) {
        // Update existing text item - don't duplicate
        textItem.content = data.content;
        textItem.fontSize = data.fontSize;
        textItem.fontFamily = data.fontFamily;
        textItem.fontWeight = data.fontWeight;
        textItem.fontStyle = data.fontStyle;
        textItem.fillColor = data.color;
        textItem.position = new scope.Point(data.position.x, data.position.y);
        // Mark as remote to prevent echo
        textItem.data.isRemote = true;
        // Clear remote flag after a delay
        setTimeout(() => {
          if (textItem && textItem.data) {
            delete textItem.data.isRemote;
          }
        }, 500);
      }

      scope.view.update();
      console.log('✅ Applied remote text edit:', data);
    } catch (error) {
      console.error('❌ Failed to apply remote text edit:', error);
    }
  }

  /**
   * Apply remote layer operation
   */
  applyRemoteLayerOperation(operation: string, data: LayerData) {
    if (!this.drawingEngine || !this.shouldApplyOperation(data)) return;

    try {
      const scope = (this.drawingEngine as any).scope;
      // Search for layer by layerId in data
      let layer = scope.project.layers.find((l: any) => 
        l.data?.layerId === data.layerId || l.data?.id === data.layerId
      );

      switch (operation) {
        case 'create':
          if (!layer) {
            layer = new scope.Layer({
              data: { id: data.layerId, layerId: data.layerId, name: data.name, isRemote: true }
            });
            layer.name = data.name;
            layer.visible = data.visible;
            layer.locked = data.locked;
            layer.opacity = data.opacity;
            if (data.zIndex !== undefined) {
              layer.insertAbove(scope.project.layers[data.zIndex] || scope.project.layers[0]);
            }
            console.log(`✅ Applied remote layer create:`, data);
          } else {
            console.log(`⚠️ Layer ${data.layerId} already exists, skipping create`);
          }
          break;

        case 'update':
          if (layer) {
            layer.data.name = data.name;
            layer.visible = data.visible;
            layer.locked = data.locked;
            layer.opacity = data.opacity;
            // Apply blend mode if supported
            if ((layer as any).blendMode && data.blendMode) {
              (layer as any).blendMode = data.blendMode;
            }
          }
          break;

        case 'delete':
          if (layer) {
            layer.remove();
          }
          break;

        case 'reorder':
          if (layer && data.zIndex !== undefined) {
            const targetLayer = scope.project.layers[data.zIndex];
            if (targetLayer) {
              layer.insertAbove(targetLayer);
            }
          }
          break;
      }

      scope.view.update();
      console.log(`✅ Applied remote layer ${operation}:`, data);
    } catch (error) {
      console.error(`❌ Failed to apply remote layer ${operation}:`, error);
    }
  }

  /**
   * Apply remote delete operation
   */
  applyRemoteDelete(data: any) {
    if (!this.drawingEngine || !this.shouldApplyOperation(data)) return;

    try {
      const scope = (this.drawingEngine as any).scope;
      
      // Search all layers for item with this ID
      let item = null;
      for (const layer of scope.project.layers) {
        for (const child of layer.children) {
          if (child.data?.id === data.itemId || child.id === parseInt(data.itemId)) {
            item = child;
            break;
          }
        }
        if (item) break;
      }

      if (item) {
        item.remove();
        scope.view.update();
        console.log('✅ Applied remote delete:', data.itemId);
      } else {
        console.log('⚠️ Item not found for delete:', data.itemId);
      }
    } catch (error) {
      console.error('❌ Failed to apply remote delete:', error);
    }
  }

  /**
   * Apply remote fill operation
   */
  applyRemoteFill(data: any) {
    console.log('🎨 CollaborationEnhancer.applyRemoteFill called with data:', {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : 'no data',
      targetType: data?.targetType,
      itemId: data?.itemId,
      fillColor: data?.fillColor,
      hasPoint: !!data?.point,
      hasBounds: !!data?.bounds
    });
    
    if (!this.drawingEngine) {
      console.error('❌ Drawing engine not initialized');
      return;
    }
    
    if (!this.shouldApplyOperation(data)) {
      console.log('⏭️ Skipping fill operation (page mismatch or other filter)');
      return;
    }

    try {
      const scope = (this.drawingEngine as any).scope;
      
      if (data.targetType === 'background') {
        // Fill the canvas background
        const backgroundLayer = scope.project.layers.find(
          (layer: any) => layer.data.isBackgroundLayer
        );
        
        if (backgroundLayer) {
          let backgroundRect = backgroundLayer.children.find(
            (child: any) => child.data.isBackground
          );
          
          if (backgroundRect) {
            // Deserialize the fill color
            const fillColor = this.deserializeColor(data.fillColor, scope, backgroundRect.bounds);
            backgroundRect.fillColor = fillColor;
          } else {
            // Create new background if it doesn't exist
            backgroundRect = new scope.Path.Rectangle({
              from: [0, 0],
              to: [scope.view.size.width, scope.view.size.height]
            });
            backgroundRect.fillColor = this.deserializeColor(data.fillColor, scope, backgroundRect.bounds);
            backgroundRect.data = { isBackground: true };
            backgroundLayer.addChild(backgroundRect);
            backgroundRect.sendToBack();
          }
        }
        
        scope.view.update();
        console.log('✅ Applied remote background fill:', data);
        return;
      }
      
      // Fill a specific shape or text
      let item = null;
      
      // Strategy 1: Try to find by item ID first
      if (data.itemId) {
        for (const layer of scope.project.layers) {
          for (const child of layer.children) {
            if (child.data?.id === data.itemId || child.data?.textId === data.itemId) {
              item = child;
              break;
            }
          }
          if (item) break;
        }
      }
      
      // Strategy 2: If not found by ID, use hit testing at the same point
      // This handles cases where items don't have IDs yet or IDs don't match
      if (!item && data.point) {
        const point = new scope.Point(data.point.x, data.point.y);
        const hitResults = scope.project.hitTestAll(point, {
          stroke: true,
          fill: true,
          tolerance: 8
        });
        
        if (hitResults && hitResults.length > 0) {
          // Find the first valid item (skip transform controls)
          for (const hitResult of hitResults) {
            let hitItem = hitResult.item;
            
            // Skip transform controls
            if (hitItem.data?.isTransformControl) {
              continue;
            }
            
            // If item is a group, find the actual path inside
            if (hitItem instanceof scope.Group) {
              const children = hitItem.children;
              for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                if (child instanceof scope.Path || child instanceof scope.CompoundPath) {
                  hitItem = child;
                  break;
                }
              }
            }
            
            // Check if this is a valid fillable item
            if (hitItem instanceof scope.Path || hitItem instanceof scope.CompoundPath || 
                hitItem instanceof scope.Shape || hitItem instanceof scope.PointText) {
              item = hitItem;
              console.log('✅ Found item via hit testing at point:', data.point);
              break;
            }
          }
        }
      }
      
      // Strategy 3: If still not found and we have bounds, try to find by bounds matching
      if (!item && data.bounds) {
        const targetBounds = data.bounds;
        const tolerance = 5; // Allow 5px tolerance for bounds matching
        
        for (const layer of scope.project.layers) {
          if (layer.data.isBackgroundLayer) continue; // Skip background layer
          
          for (const child of layer.children) {
            if (child.data?.isBackground || child.data?.isTransformControl || child.data?.isClickableArea) {
              continue;
            }
            
            const bounds = child.bounds;
            if (bounds && 
                Math.abs(bounds.x - targetBounds.x) < tolerance &&
                Math.abs(bounds.y - targetBounds.y) < tolerance &&
                Math.abs(bounds.width - targetBounds.width) < tolerance &&
                Math.abs(bounds.height - targetBounds.height) < tolerance) {
              item = child;
              console.log('✅ Found item via bounds matching:', targetBounds);
              break;
            }
          }
          if (item) break;
        }
      }

      if (item) {
        // Deserialize the fill color (handles both solid colors and gradients)
        const fillColor = this.deserializeColor(data.fillColor, scope, item.bounds);
        item.fillColor = fillColor;
        scope.view.update();
        console.log('✅ Applied remote fill:', data.targetType, data.itemId || 'found by hit-test');
      } else {
        console.warn('⚠️ Item not found for fill. Data:', {
          itemId: data.itemId,
          targetType: data.targetType,
          hasPoint: !!data.point,
          hasBounds: !!data.bounds
        });
      }
    } catch (error) {
      console.error('❌ Failed to apply remote fill:', error);
    }
  }

  /**
   * Deserialize color data (handles both solid colors and gradients)
   */
  private deserializeColor(colorData: any, scope: any, bounds: any): any {
    if (!colorData) return new scope.Color('#000000');
    
    // If it's a string, it's a simple color
    if (typeof colorData === 'string') {
      return new scope.Color(colorData);
    }
    
    // If it's a gradient
    if (colorData.type === 'gradient' && colorData.gradient) {
      const gradient = colorData.gradient;
      
      // Create Paper.js gradient stops
      const stops = gradient.stops?.map((stop: any) => {
        return [new scope.Color(stop.color), stop.offset || 0];
      }) || [[new scope.Color('#000000'), 0], [new scope.Color('#FFFFFF'), 1]];
      
      // Create gradient object
      const paperGradient = new scope.Gradient(stops, gradient.radial || false);
      
      // Set gradient origin and destination
      const origin = colorData.origin 
        ? new scope.Point(colorData.origin.x, colorData.origin.y)
        : bounds.topLeft;
      const destination = colorData.destination
        ? new scope.Point(colorData.destination.x, colorData.destination.y)
        : bounds.bottomRight;
      
      return new scope.Color(paperGradient, origin, destination);
    }
    
    // Fallback to black
    return new scope.Color('#000000');
  }

  /**
   * Apply remote transform operation
   */
  applyRemoteTransform(data: TransformData) {
    // Create a serializable copy for logging
    const logData = {
      type: data.type,
      transformType: (data as any).transformType,
      itemId: data.itemId,
      matrix: data.matrix,
      bounds: data.bounds,
      rotation: data.rotation,
      scale: data.scale,
      position: data.position
    };
    
    console.log('🔍 applyRemoteTransform received:', {
      data: JSON.parse(JSON.stringify(logData)),
      hasMatrix: !!data.matrix,
      matrixLength: data.matrix?.length,
      hasBounds: !!data.bounds,
      hasPosition: !!data.position,
      transformType: (data as any).transformType,
      type: data.type
    });
    
    if (!this.drawingEngine || !this.shouldApplyOperation(data)) return;

    try {
      const scope = (this.drawingEngine as any).scope;
      
      // Search all layers for item with this ID
      // Try multiple ID matching strategies since items may store IDs differently
      let item = null;
      const searchId = data.itemId;
      
      for (const layer of scope.project.layers) {
        // Skip background layer
        if (layer.data?.isBackgroundLayer) continue;
        
        for (const child of layer.children) {
          // Skip transform controls and helpers
          if (child.data?.isTransformControl || child.data?.isClickableArea || child.data?.isBackground) {
            continue;
          }
          
          // Strategy 1: Match by data.id (string)
          if (child.data?.id === searchId) {
            item = child;
            break;
          }
          
          // Strategy 2: Match by data.itemId (for remote items)
          if (child.data?.itemId === searchId) {
            item = child;
            break;
          }
          
          // Strategy 3: Match by numeric Paper.js id
          if (child.id && child.id.toString() === searchId) {
            item = child;
            break;
          }
          
          // Strategy 4: Parse numeric IDs and compare
          const numericId = parseInt(searchId);
          if (!isNaN(numericId) && child.id === numericId) {
            item = child;
            break;
          }
        }
        if (item) break;
      }

      if (item) {
        console.log('🔍 Item found for transform:', {
          itemId: data.itemId,
          itemClass: item.className,
          isGroup: item.className === 'Group',
          hasChildren: item.children ? item.children.length : 0,
          children: item.children ? item.children.map((c: any) => ({ 
            class: c.className, 
            isClickable: c.data?.isClickableArea 
          })) : []
        });

        // Check if currently being transformed locally to avoid conflicts
        // Skip this check to allow rapid transform updates
        // if (item.data?.isRemote) {
        //   console.log('⏭️ Skipping remote transform - item is currently being transformed remotely');
        //   return;
        // }

        // Mark as remote to avoid sending back
        if (!item.data) item.data = {};
        const wasRemote = item.data.isRemote;
        item.data.isRemote = true;

        // Apply transformation based on type
        // NOTE: The actual transform type is in 'transformType' field, not 'type' field
        const transformType = (data as any).transformType || data.type;
        console.log('🔍 Transform type:', transformType, 'from data.type:', data.type, 'data.transformType:', (data as any).transformType);
        
        if (transformType === 'move' || transformType === 'translate') {
          // For move, just update position
          if (data.position) {
            item.position = new scope.Point(data.position.x, data.position.y);
            console.log('📍 Applied position to item:', data.position);
          }
        } else if (transformType === 'rotate') {
          // For rotate, use the rotation angle and position
          if (data.rotation !== undefined && data.position) {
            // Calculate current rotation from matrix (more reliable than item.rotation)
            const currentRotationRadians = Math.atan2(item.matrix.b, item.matrix.a);
            const currentRotationDegrees = (currentRotationRadians * 180) / Math.PI;
            
            // Calculate the rotation delta we need to apply
            const rotationDelta = data.rotation - currentRotationDegrees;
            
            console.log('🔄 Applying rotation:', {
              receivedRotation: data.rotation,
              currentRotation: currentRotationDegrees,
              rotationDelta: rotationDelta,
              position: data.position
            });
            
            // If we have path data, replace the entire item with the rotated version
            if (data.pathData) {
              console.log('🔄 Applying rotation via complete path data replacement');
              
              try {
                // Import the path data to get the rotated shape
                const rotatedItem = scope.importJSON(data.pathData);
                
                if (rotatedItem) {
                  // Copy properties from old item to new
                  rotatedItem.data = item.data;
                  
                  // Replace the old item with the rotated one
                  item.replaceWith(rotatedItem);
                  
                  // Update the reference in the items map if it exists
                  if (this.items) {
                    this.items.set(data.itemId, rotatedItem);
                  }
                  
                  console.log('✅ Rotation applied via path data replacement');
                }
              } catch (error) {
                console.error('❌ Failed to apply rotation via path data:', error);
              }
            } else {
              console.log('⚠️ No pathData in rotation message, skipping');
            }
          }
        } else if (transformType === 'resize') {
          // If we have path data, replace the entire item with the resized version
          if (data.pathData) {
            console.log('📏 Applying resize via complete path data replacement');
            
            try {
              // Import the path data to get the resized shape
              const resizedItem = scope.importJSON(data.pathData);
              
              if (resizedItem) {
                // Copy properties from old item to new
                resizedItem.data = item.data;
                
                // Replace the old item with the resized one
                item.replaceWith(resizedItem);
                
                // Update the reference in the items map if it exists
                if (this.items) {
                  this.items.set(data.itemId, resizedItem);
                }
                
                console.log('✅ Resize applied via path data replacement');
              }
            } catch (error) {
              console.error('❌ Failed to apply resize via path data:', error);
            }
          } else {
            console.log('⚠️ No pathData in resize message, skipping');
          }
        } else {
          // Fallback: apply position and rotation
          if (data.position) {
            item.position = new scope.Point(data.position.x, data.position.y);
          }
          if (data.rotation !== undefined && data.rotation !== null) {
            item.rotation = data.rotation;
          }
        }

        // Clear remote flag immediately after applying - no delay needed
        // This allows rapid consecutive transforms to be applied
        setTimeout(() => {
          if (item && item.data) {
            delete item.data.isRemote;
          }
        }, 10);

        scope.view.update();
        console.log('✅ Applied remote transform:', data.type, data);
      } else {
        console.log('⚠️ Item not found for transform:', data.itemId);
        console.log('🔍 Available items:', scope.project.layers.map((layer: any) => 
          layer.children.filter((child: any) => 
            !child.data?.isTransformControl && 
            !child.data?.isClickableArea && 
            !child.data?.isBackground
          ).map((child: any) => ({
            id: child.id,
            dataId: child.data?.id,
            itemId: child.data?.itemId,
            type: child.className
          }))
        ).flat());
      }
    } catch (error) {
      console.error('❌ Failed to apply remote transform:', error);
    }
  }

  /**
   * Check if operation should be applied to current canvas
   */
  private shouldApplyOperation(data: any): boolean {
    const messageCoverImage = data.isCoverImage || data.pageId === 'cover_image' || data.page_id === 'cover_image' || data.is_cover_image;
    const currentCoverImage = this.isCoverImage || false;

    console.log('🔍 shouldApplyOperation check:', {
      message: {
        isCoverImage: data.isCoverImage,
        is_cover_image: data.is_cover_image,
        pageId: data.pageId,
        page_id: data.page_id,
        pageIndex: data.pageIndex,
        page_index: data.page_index,
        messageCoverImage
      },
      current: {
        pageId: this.pageId,
        pageIndex: this.pageIndex,
        isCoverImage: this.isCoverImage,
        currentCoverImage
      }
    });

    if (messageCoverImage && currentCoverImage) {
      console.log('✅ Match: Both are cover image');
      return true;
    } else if (!messageCoverImage && !currentCoverImage) {
      // Check page matching
      const messagePageId = data.pageId || data.page_id;
      const messagePageIndex = data.pageIndex !== undefined ? data.pageIndex : data.page_index;
      
      if (this.pageId && messagePageId === this.pageId) {
        console.log('✅ Match: Page ID match');
        return true;
      }
      if (this.pageIndex !== undefined && messagePageIndex === this.pageIndex) {
        console.log('✅ Match: Page index match');
        return true;
      }
      if (this.pageIndex !== undefined && messagePageId === `page_${this.pageIndex}`) {
        console.log('✅ Match: Page ID matches constructed page_${index}');
        return true;
      }
      
      console.log('❌ No match: Different pages');
    } else {
      console.log('❌ No match: One is cover, other is not');
    }

    return false;
  }

  /**
   * Throttled send to prevent spam
   */
  private throttledSend(key: string, fn: () => void, delay: number) {
    const existingTimer = this.throttleTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = window.setTimeout(() => {
      fn();
      this.throttleTimers.delete(key);
    }, delay);

    this.throttleTimers.set(key, timer);
  }

  /**
   * Setup collaboration event handlers
   * Note: Event handlers are set up in CanvasDrawingPage, not here
   * to avoid duplicate handling
   */
  private setupEventHandlers() {
    // Event handlers are registered in CanvasDrawingPage.tsx
    // This method is kept for future use if needed
  }

  /**
   * Get current user ID to avoid applying own operations
   */
  private getCurrentUserId(): number | null {
    // This would come from auth service or user store
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Cleanup
   */
  destroy() {
    // Clear all throttle timers
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.clear();

    // Note: Event handlers are removed by the collaborationService when connection closes
    // We don't need to manually remove them here since they were set up with inline functions
  }
}