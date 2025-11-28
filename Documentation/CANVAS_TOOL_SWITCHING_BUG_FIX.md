# Canvas Tool Switching Bug - CRITICAL FIX

## Problem Discovered

When using shape tools (rectangle, circle, etc.) on mobile, the tool would **alternate between brush and the selected shape tool** during drag operations, causing both a shape AND brush strokes to be drawn simultaneously.

### Console Evidence
```
🖱️ handleMouseDrag - currentTool: brush      ← WRONG!
✏️ Continuing brush stroke
🖱️ handleMouseDrag - currentTool: rectangle  ← Correct
📐 Updating shape
🖱️ handleMouseDrag - currentTool: brush      ← WRONG AGAIN!
✏️ Continuing brush stroke
🖱️ handleMouseDrag - currentTool: rectangle  ← Correct
```

The tool was switching back and forth on every drag event!

## Root Cause

The useEffect that sets up canvas event listeners had `[isPanning, lastPanPoint]` as dependencies:

```typescript
useEffect(() => {
  const canvas = canvasRef.current;
  if (canvas) {
    // ... setup event listeners
    
    return () => {
      // ... cleanup event listeners
      if (drawingEngineRef.current) {
        drawingEngineRef.current.destroy(); // ← DESTROYING ENGINE!
      }
    };
  }
}, [isPanning, lastPanPoint]); // ← PROBLEM: Re-runs on every pan state change!
```

### What Was Happening:

1. User starts dragging to create a rectangle
2. Touch moves slightly → `lastPanPoint` changes
3. useEffect re-runs due to dependency change
4. **Cleanup function destroys the drawing engine**
5. **New drawing engine is created with default tool (brush)**
6. Next drag event → tool is now brush!
7. Touch moves again → `lastPanPoint` changes
8. Cycle repeats, alternating between tools

The drawing engine was being **destroyed and recreated multiple times per second** during drag operations!

## Solution

### 1. Remove Dependencies from useEffect

Changed from:
```typescript
}, [isPanning, lastPanPoint]); // ← Causes re-initialization
```

To:
```typescript
}, []); // ← Only run once on mount
```

### 2. Convert State to Refs

To avoid stale closures while preventing re-renders:

```typescript
// OLD - State caused re-renders and useEffect re-runs:
const [isPanning, setIsPanning] = useState(false);
const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

// NEW - Refs for internal logic, state only for UI:
const isPanningRef = useRef(false); // For event handler logic
const [isPanning, setIsPanning] = useState(false); // For UI indicator only
const lastPanPointRef = useRef({ x: 0, y: 0 }); // For event handler logic
```

### 3. Update All References

Updated all event handlers to use refs:

```typescript
// Before:
if (isPanning && (e.buttons === 4 || e.ctrlKey)) {
  const deltaX = e.clientX - lastPanPoint.x;
  setLastPanPoint({ x: e.clientX, y: e.clientY });
}

// After:
if (isPanningRef.current && (e.buttons === 4 || e.ctrlKey)) {
  const deltaX = e.clientX - lastPanPointRef.current.x;
  lastPanPointRef.current = { x: e.clientX, y: e.clientY };
}
```

## Why This Works

### Event Handler Closures
With empty dependencies `[]`, the useEffect runs only once on mount. The event handlers are created once and have access to:
- **Refs**: Always get current value (no stale closure)
- **setState functions**: Stable references that never change
- **Other state**: Accessed through closure (fine for read-only access)

### Refs vs State
- **Refs**: Mutable, don't cause re-renders, perfect for internal logic
- **State**: Immutable, cause re-renders, necessary for UI updates

We use **both**:
- `isPanningRef.current` for event handler logic (no re-renders)
- `setIsPanning(true/false)` for UI indicator visibility (causes re-render only when needed)

## Technical Details

### Why Dependencies Were Problematic

React's useEffect cleanup runs when:
1. Component unmounts
2. **Dependencies change** ← This was the problem!

Every pan movement changed `lastPanPoint`, triggering:
1. Cleanup function (destroys engine)
2. Effect function (creates new engine)

This happened **multiple times per second** during drag operations!

### Why Refs Solve It

Refs are:
- **Mutable**: Can be updated without triggering re-renders
- **Stable**: Same reference across renders
- **Immediate**: Changes are visible immediately (no batching)

Perfect for:
- Event handler state
- Animation frame IDs
- DOM references
- Any value that needs to persist but shouldn't trigger re-renders

## Files Modified

- `/frontend/src/pages/CanvasDrawingPage.tsx`
  - Changed useEffect dependencies from `[isPanning, lastPanPoint]` to `[]`
  - Added `isPanningRef` and `lastPanPointRef` refs
  - Kept `isPanning` state for UI indicator
  - Updated all event handlers to use refs
  - Added debug logging to `handleToolSelect`

## Results

✅ **Tool stays consistent** - No more alternating between brush and shape tools
✅ **Engine persists** - Drawing engine is created once and reused
✅ **Performance improved** - No unnecessary engine destruction/recreation
✅ **Clean shapes** - Shapes draw correctly without brush strokes
✅ **Smooth panning** - Pan operations don't interfere with drawing

## Lessons Learned

### useEffect Dependencies
- Be careful with dependencies that change frequently
- Consider if the effect really needs to re-run on those changes
- Use refs for values that don't need to trigger re-renders

### State vs Refs
- **State**: For values that affect rendering
- **Refs**: For values that don't affect rendering but need to persist

### Event Handlers in useEffect
- Event handlers can access refs without dependencies
- setState functions are stable and don't need to be in dependencies
- Empty dependency array `[]` is often correct for event listener setup

## Testing

To verify the fix:
1. Open canvas drawing page
2. Select rectangle tool
3. Drag to create a rectangle
4. Check console logs - should only show "rectangle" tool, never "brush"
5. Result should be a clean rectangle with no brush strokes

Before fix:
```
🖱️ handleMouseDrag - currentTool: brush      ❌
🖱️ handleMouseDrag - currentTool: rectangle  ✅
🖱️ handleMouseDrag - currentTool: brush      ❌
```

After fix:
```
🖱️ handleMouseDrag - currentTool: rectangle  ✅
🖱️ handleMouseDrag - currentTool: rectangle  ✅
🖱️ handleMouseDrag - currentTool: rectangle  ✅
```

## Related Issues

This fix also resolves:
- Drawing engine being destroyed during pan operations
- Performance issues from constant engine recreation
- Memory leaks from incomplete cleanup cycles
- Inconsistent tool behavior across different gestures

## Prevention

To prevent similar issues:
1. **Audit useEffect dependencies** - Are they all necessary?
2. **Consider refs** - Does this value need to trigger re-renders?
3. **Test with console logs** - Verify effects run when expected
4. **Watch for cleanup** - Ensure cleanup doesn't happen too often
5. **Profile performance** - Check for unnecessary re-renders
