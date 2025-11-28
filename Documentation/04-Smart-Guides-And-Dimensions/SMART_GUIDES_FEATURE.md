# Smart Alignment Guides Feature

## Overview
The Smart Guides system provides automatic alignment assistance when moving elements on the canvas, similar to professional design tools like Canva, Figma, and Adobe XD.

## Features Implemented

### ✨ Automatic Alignment (The "Smart" Part)

#### 1. **Center Lines** (Solid Red Lines)
When you drag an element towards the center of the canvas:
- **Horizontal center line**: Appears when element is vertically centered
- **Vertical center line**: Appears when element is horizontally centered
- **Both lines**: Show when element is perfectly centered in both directions
- **Visual**: Solid red lines across the entire canvas

#### 2. **Edge & Element Alignment** (Dashed Red Lines)
As you move an element close to other elements:
- **Edge-to-edge alignment**: Left, right, top, or bottom edges align
- **Center-to-center alignment**: Element centers align horizontally or vertically
- **Adjacent alignment**: Element edges snap to adjacent element edges
- **Visual**: Dashed red lines showing the alignment relationship

#### 3. **Equal Spacing Distribution** (Dashed Red Lines)
Automatically detects and suggests equal spacing:
- **Horizontal spacing**: When elements are evenly spaced left-to-right
- **Vertical spacing**: When elements are evenly spaced top-to-bottom
- **Visual**: Dashed red lines indicating equal gaps between elements

#### 4. **Canvas Boundary Alignment** (Dashed Red Lines)
Helps align with safe areas and margins:
- **20px margin**: Default safe area from canvas edges
- **Edge snapping**: Aligns to left, right, top, or bottom margins
- **Visual**: Dashed red lines at margin boundaries

## Technical Implementation

### Files Created/Modified

1. **`SmartGuides.ts`** (NEW)
   - Core alignment detection logic
   - Guide line rendering system
   - Snap threshold calculation (8px)
   - Canvas bounds management

2. **`CanvaStyleTransform.ts`** (MODIFIED)
   - Integrated SmartGuides into transform system
   - Automatic guide display during element movement
   - Guide cleanup on mouse up

3. **`PaperDrawingEngine.ts`** (MODIFIED)
   - Updated to pass canvas dimensions to transform system

### Key Parameters

```typescript
// Smart Guides (Touch Optimized)
SNAP_THRESHOLD = 25px       // Distance for snap activation (highly responsive)
CENTER_THRESHOLD = 50px     // 2x snap threshold for center alignment (very magnetic)
GUIDE_COLOR = '#FF0000'     // Red color for all guides
SOLID_LINE_WIDTH = 2px      // Center line thickness (more visible)
DASHED_LINE_WIDTH = 2px     // Edge alignment line thickness (more visible)
DASH_ARRAY = [6, 4]         // Dash pattern for non-center guides
CANVAS_MARGIN = 20px        // Safe area margin
GUIDE_OPACITY = 0.9         // Slightly transparent for better visibility

// Transform Controls (Touch Optimized)
HANDLE_SIZE = 16px          // Handle diameter (easy to grab)
HANDLE_STROKE = 2.5px       // Thick outline for visibility
HANDLE_TOLERANCE = 25px     // Large hit area for touch
ITEM_TOLERANCE = 20px       // Easy element selection
HANDLE_OFFSET = 10px        // Space from element edge
ROTATION_DISTANCE = 50px    // Rotation handle distance
```

## How It Works

### Alignment Detection Flow

1. **User starts dragging** an element in select mode
2. **SmartGuides.calculateSnap()** is called on every mouse move
3. **Detection checks** run in this order:
   - Canvas center alignment (highest priority)
   - Element-to-element alignment
   - Equal spacing distribution
   - Canvas edge/margin alignment
4. **Snap position** is calculated if within threshold
5. **Guide lines** are rendered to show alignment
6. **Element position** is adjusted to snap point
7. **Guides clear** when mouse is released

### Guide Types

| Type | Visual | When Shown |
|------|--------|------------|
| Center Horizontal | Solid red horizontal line | Element vertically centered |
| Center Vertical | Solid red vertical line | Element horizontally centered |
| Edge Alignment | Dashed red line | Edges align with other elements |
| Spacing | Dashed red line | Equal spacing detected |
| Canvas Margin | Dashed red line | Near canvas safe area |

## Usage

The feature works automatically when:
1. Select tool is active
2. User drags an element
3. Element gets close to alignment points (within 8px)

No additional configuration or activation needed!

## Visual Examples

### Center Alignment
```
┌─────────────────────────┐
│                         │
│          ┃              │  ← Vertical center line (solid red)
│      ┏━━━┻━━━┓          │
│      ┃ SHAPE ┃          │
│      ┗━━━━━━━┛          │
│                         │
└─────────────────────────┘
```

### Edge Alignment
```
┌─────────────────────────┐
│  ┏━━━━━━━┓  ┆           │
│  ┃ BOX 1 ┃  ┆           │  ← Dashed line shows
│  ┗━━━━━━━┛  ┆           │    left edge alignment
│              ┆           │
│  ┏━━━━━━━┓  ┆           │
│  ┃ BOX 2 ┃  ┆           │
│  ┗━━━━━━━┛  ┆           │
└─────────────────────────┘
```

### Equal Spacing
```
┌─────────────────────────┐
│  ┏━┓  ┆  ┏━┓  ┆  ┏━┓   │
│  ┗━┛  ┆  ┗━┛  ┆  ┗━┛   │  ← Dashed lines show
│       ┆       ┆         │    equal horizontal spacing
└─────────────────────────┘
```

## Performance Considerations

- Guides only calculate when actively dragging
- Efficient bounds checking with early exits
- Guide lines reuse Paper.js path objects
- Automatic cleanup prevents memory leaks
- Locked guide lines prevent accidental interaction

## Future Enhancements (Optional)

Potential improvements that could be added:
- [ ] Adjustable snap threshold in settings
- [ ] Toggle guides on/off
- [ ] Custom guide colors
- [ ] Angle snapping (0°, 45°, 90°, etc.)
- [ ] Distance measurements on guides
- [ ] Smart padding suggestions
- [ ] Multi-element alignment
- [ ] Alignment history/undo

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- Paper.js library
- ES6+ JavaScript features

## Testing Checklist

- [x] Center alignment works horizontally
- [x] Center alignment works vertically
- [x] Edge-to-edge alignment works
- [x] Center-to-center alignment works
- [x] Equal spacing detection works
- [x] Canvas margin alignment works
- [x] Guides clear on mouse up
- [x] Guides don't interfere with drawing
- [x] Performance is smooth during drag
- [x] Multiple elements on canvas handled correctly

## Notes

- Guides are visual only and don't affect saved data
- Transform controls (handles) are excluded from alignment
- Background elements are excluded from alignment
- Locked/invisible items are excluded from alignment
- Guide lines are marked as locked to prevent selection
