# Eraser Icon Fix

## Problem
The eraser icon in the canvas toolbar was using a CSS class `.canvas-eraser-icon` but there were no styles defined for it, making it appear blank or invisible.

## Solution
Created a custom CSS-based eraser icon that looks like an actual eraser using pseudo-elements (::before and ::after).

## Icon Design
The eraser icon is designed to look like a traditional pink eraser:
- **Main body**: A tilted rectangle (rotated -45deg) with a gradient
- **Two-tone effect**: Top part is solid (the unused eraser), bottom part is lighter (the used/pink part)
- **Border**: Solid border to define the shape
- **Shadow/mark**: Small line at the bottom to represent eraser marks

## CSS Added

### Base Eraser Icon
```css
.canvas-eraser-icon {
  width: 1.2rem;
  height: 1.2rem;
  position: relative;
  flex-shrink: 0;
}

.canvas-eraser-icon::before {
  /* Main eraser body - rotated rectangle */
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  width: 0.9rem;
  height: 0.65rem;
  background: linear-gradient(to bottom, 
    currentColor 0%, 
    currentColor 60%, 
    rgba(139, 92, 246, 0.3) 60%,  /* Purple tint for used part */
    rgba(139, 92, 246, 0.3) 100%
  );
  border: 1.5px solid currentColor;
  border-radius: 1px 1px 2px 2px;
}

.canvas-eraser-icon::after {
  /* Eraser mark/shadow */
  content: '';
  position: absolute;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 0.5rem;
  height: 2px;
  background: currentColor;
  opacity: 0.4;
  border-radius: 1px;
}
```

### Active State
```css
.canvas-studio-mobile-tool-active .canvas-eraser-icon::before,
.canvas-studio-tool-btn-active .canvas-eraser-icon::before {
  background: linear-gradient(to bottom, 
    currentColor 0%, 
    currentColor 60%, 
    rgba(255, 255, 255, 0.3) 60%,  /* White tint when active */
    rgba(255, 255, 255, 0.3) 100%
  );
}
```

## Size Variations

### Desktop/Left Toolbar (1.25rem)
```css
.canvas-studio-tool-btn .canvas-eraser-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.canvas-studio-tool-btn .canvas-eraser-icon::before {
  width: 1rem;
  height: 0.75rem;
}

.canvas-studio-tool-btn .canvas-eraser-icon::after {
  width: 0.6rem;
}
```

### Mobile Toolbar (1.2rem)
```css
.canvas-eraser-icon {
  width: 1.2rem;
  height: 1.2rem;
}

.canvas-eraser-icon::before {
  width: 0.9rem;
  height: 0.65rem;
}

.canvas-eraser-icon::after {
  width: 0.5rem;
}
```

### Small Screens < 768px (1.1rem)
```css
.canvas-eraser-icon {
  width: 1.1rem;
  height: 1.1rem;
}

.canvas-eraser-icon::before {
  width: 0.8rem;
  height: 0.55rem;
}

.canvas-eraser-icon::after {
  width: 0.45rem;
}
```

## Bonus: Square Icon for Shapes
Also added a simple square icon for the shapes tool:

```css
.canvas-square-icon {
  width: 1.2rem;
  height: 1.2rem;
  border: 2px solid currentColor;
  border-radius: 2px;
  flex-shrink: 0;
}
```

## Visual Description
The eraser icon now looks like:
```
    ________
   /       /|
  /  60%  / |  <- Top part (darker/unused)
 /_______/  |
 |  40% |   |  <- Bottom part (lighter/used, purple-tinted)
 |______|___/
     ‾‾       <- Small mark line at bottom
```

When rotated -45 degrees, it resembles a traditional eraser being used on paper.

## Color Behavior
- **Inactive**: Uses `currentColor` (inherits from parent)
- **Active**: Uses `currentColor` with white-tinted bottom section for better contrast
- **Hover**: Inherits color changes from parent button hover states

## Files Modified
- `frontend/src/canvas-studio.css`

## Pages Using This Icon
- `frontend/src/pages/CanvasDrawingPage.tsx` (desktop and mobile toolbars)
- `frontend/src/pages/CoverImageCanvasPage.tsx` (mobile toolbar)

## Testing
✅ Icon displays properly at all sizes (1.25rem, 1.2rem, 1.1rem)
✅ Icon responds to active/inactive states
✅ Icon inherits color from parent button
✅ Icon is visible and recognizable as an eraser
