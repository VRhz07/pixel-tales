# Canvas Purple Background Fix

## Problem
The purple gradient background in the canvas area didn't extend all the way to the bottom toolbar in mobile portrait mode. There was a visible white/gray gap between the canvas area and the bottom toolbar.

## Root Cause
The `.canvas-studio-canvas-area-mobile` was using `position: fixed` with a `bottom` value (e.g., `bottom: 225px`), which created a gap at the bottom where the background didn't render.

## Solution
Changed the layout approach:
- Set `bottom: 0` to make the canvas area extend to the full viewport height
- Changed from `bottom` positioning to `padding-bottom` for toolbar spacing
- Added the purple gradient background directly to `.canvas-studio-canvas-area-mobile`

### Before:
```css
.canvas-studio-canvas-area-mobile {
  position: fixed;
  top: 48px;
  bottom: 225px; /* Created a gap */
  /* No background - showed white/gray */
}
```

### After:
```css
.canvas-studio-canvas-area-mobile {
  position: fixed;
  top: 48px;
  bottom: 0; /* Extends to full height */
  padding-bottom: 225px; /* Space for toolbar */
  /* Purple gradient background */
  background: radial-gradient(
    ellipse at center, 
    var(--cs-bg-main) 0%, 
    var(--cs-bg-main) 20%,
    var(--cs-bg-dark) 60%,
    var(--cs-bg-darker) 100%
  );
}
```

## Changes Made
1. **Canvas area positioning:** Changed from `bottom: 225px` to `bottom: 0`
2. **Toolbar spacing:** Changed from `bottom` to `padding-bottom: 225px`
3. **Background gradient:** Added purple radial gradient to mobile canvas area
4. **Transition:** Updated from `transition: bottom` to `transition: padding-bottom`
5. **Settings expansion:** Updated `.has-settings` to use `padding-bottom: 285px`
6. **Capacitor safe area:** Updated to use `padding-bottom` instead of `bottom`

## Benefits
✅ **No more gap:** Purple background now extends to the bottom edge  
✅ **Consistent look:** Matches the desktop gradient background style  
✅ **Toolbar overlay:** Bottom toolbar properly overlays the canvas area  
✅ **Smooth transitions:** Settings panel expansion still works smoothly  
✅ **Safe area support:** Works correctly with device safe areas (notches, etc.)

## Files Modified
- `frontend/src/canvas-studio.css` - Updated mobile canvas area positioning and background

## Visual Result
The purple gradient background now fills the entire screen from the top bar to the bottom edge, with the toolbar overlaying at the bottom. No more white/gray gap visible.
