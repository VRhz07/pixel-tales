# Canvas Event Listener Cleanup Bug - CRITICAL FIX

## Problem

Multiple PaperDrawingEngine instances were processing events simultaneously, causing the tool to alternate between brush and the selected shape tool:

```
🔵 handleRawTouchStart - tool: brush      ← OLD engine still active!
🎨 handleMouseDown - currentTool: brush

🔵 handleRawTouchStart - tool: rectangle  ← NEW engine
🎨 handleMouseDown - currentTool: rectangle
```

This resulted in both shapes AND brush strokes being drawn at the same time.

## Root Cause

The `destroy()` method in PaperDrawingEngine was using `.bind(this)` when removing event listeners:

```typescript
// BROKEN CODE:
private setupEventHandlers() {
  this.canvas.addEventListener('mousedown', this.handleRawMouseDown.bind(this));
  this.canvas.addEventListener('touchstart', this.handleRawTouchStart.bind(this));
  // ...
}

destroy() {
  // ❌ This creates NEW function references, doesn't remove the originals!
  this.canvas.removeEventListener('mousedown', this.handleRawMouseDown.bind(this));
  this.canvas.removeEventListener('touchstart', this.handleRawTouchStart.bind(this));
  // ...
}
```

### Why This Fails

**`.bind(this)` creates a NEW function every time it's called!**

When you do:
```typescript
const func1 = this.method.bind(this);
const func2 = this.method.bind(this);
console.log(func1 === func2); // FALSE! Different functions!
```

So the code was:
1. Adding event listener with `func1 = this.handleRawMouseDown.bind(this)`
2. Trying to remove with `func2 = this.handleRawMouseDown.bind(this)` (different function!)
3. Original listener (`func1`) was NEVER removed!

### React Strict Mode Amplified the Problem

In development, React Strict Mode intentionally mounts components twice to detect bugs. This meant:
1. First mount: Create engine #1, add listeners
2. First unmount: Call destroy(), but listeners NOT removed (bug!)
3. Second mount: Create engine #2, add MORE listeners
4. Result: **TWO engines with TWO sets of listeners**, both processing events!

## Solution

Store the bound function references so they can be properly removed:

```typescript
// Store bound function references
private boundHandleRawMouseDown!: (e: MouseEvent) => void;
private boundHandleRawMouseMove!: (e: MouseEvent) => void;
private boundHandleRawMouseUp!: (e: MouseEvent) => void;
private boundHandleRawTouchStart!: (e: TouchEvent) => void;
private boundHandleRawTouchMove!: (e: TouchEvent) => void;
private boundHandleRawTouchEnd!: (e: TouchEvent) => void;

private setupEventHandlers() {
  // Create bound functions ONCE and store them
  this.boundHandleRawMouseDown = this.handleRawMouseDown.bind(this);
  this.boundHandleRawMouseMove = this.handleRawMouseMove.bind(this);
  this.boundHandleRawMouseUp = this.handleRawMouseUp.bind(this);
  this.boundHandleRawTouchStart = this.handleRawTouchStart.bind(this);
  this.boundHandleRawTouchMove = this.handleRawTouchMove.bind(this);
  this.boundHandleRawTouchEnd = this.handleRawTouchEnd.bind(this);
  
  // Add listeners using stored references
  this.canvas.addEventListener('mousedown', this.boundHandleRawMouseDown);
  this.canvas.addEventListener('mousemove', this.boundHandleRawMouseMove);
  this.canvas.addEventListener('mouseup', this.boundHandleRawMouseUp);
  this.canvas.addEventListener('touchstart', this.boundHandleRawTouchStart);
  this.canvas.addEventListener('touchmove', this.boundHandleRawTouchMove);
  this.canvas.addEventListener('touchend', this.boundHandleRawTouchEnd);
}

destroy() {
  // Remove listeners using the SAME stored references
  this.canvas.removeEventListener('mousedown', this.boundHandleRawMouseDown);
  this.canvas.removeEventListener('mousemove', this.boundHandleRawMouseMove);
  this.canvas.removeEventListener('mouseup', this.boundHandleRawMouseUp);
  this.canvas.removeEventListener('touchstart', this.boundHandleRawTouchStart);
  this.canvas.removeEventListener('touchmove', this.boundHandleRawTouchMove);
  this.canvas.removeEventListener('touchend', this.boundHandleRawTouchEnd);
  
  this.transformSystem.destroy();
  this.scope.project.clear();
}
```

## Why This Works

1. **Bound functions created once**: In `setupEventHandlers()`, we call `.bind(this)` once per method and store the result
2. **Same reference used**: Both `addEventListener` and `removeEventListener` use the SAME function reference
3. **Proper cleanup**: Listeners are actually removed when `destroy()` is called
4. **No duplicates**: Old engines are fully cleaned up, only one engine processes events

## Technical Details

### Function Identity in JavaScript

```javascript
// Every .bind() call creates a NEW function:
const obj = {
  method() { console.log(this); }
};

const bound1 = obj.method.bind(obj);
const bound2 = obj.method.bind(obj);

console.log(bound1 === bound2); // false!

// This is why removeEventListener fails:
element.addEventListener('click', obj.method.bind(obj));    // Adds func1
element.removeEventListener('click', obj.method.bind(obj)); // Tries to remove func2 (different!)
// Result: func1 is still attached!
```

### Correct Pattern

```javascript
// Store the bound function:
this.boundMethod = this.method.bind(this);

// Use the stored reference:
element.addEventListener('click', this.boundMethod);    // Adds boundMethod
element.removeEventListener('click', this.boundMethod); // Removes boundMethod ✓
```

### TypeScript Definite Assignment

The `!` operator tells TypeScript "I guarantee this will be assigned before use":

```typescript
private boundHandler!: (e: Event) => void;
// Means: "This is undefined now, but will be assigned in constructor/init"
```

This is safe because `setupEventHandlers()` is called in the constructor, so the properties are always assigned before any method tries to use them.

## Files Modified

- `/frontend/src/components/canvas/PaperDrawingEngine.ts`
  - Added 6 private properties to store bound function references
  - Modified `setupEventHandlers()` to store bound functions
  - Modified `destroy()` to use stored references
  - Added logging to track construction/destruction

## Results

✅ **Single engine**: Only one PaperDrawingEngine processes events
✅ **Proper cleanup**: Old engines are fully destroyed
✅ **Consistent tool**: No more alternating between brush and shape tools
✅ **Clean shapes**: Shapes draw correctly without brush strokes
✅ **React Strict Mode compatible**: Works correctly even with double mounting

## Lessons Learned

### Event Listener Cleanup

1. **Never use `.bind()` in removeEventListener**: It creates a new function that doesn't match the original
2. **Store bound references**: Create bound functions once and reuse them
3. **Test with React Strict Mode**: It helps catch cleanup bugs by mounting twice
4. **Add destroy logging**: Makes it easy to verify cleanup is happening

### Common Patterns

**❌ WRONG:**
```typescript
element.addEventListener('click', this.handler.bind(this));
element.removeEventListener('click', this.handler.bind(this)); // Doesn't work!
```

**✅ CORRECT:**
```typescript
this.boundHandler = this.handler.bind(this);
element.addEventListener('click', this.boundHandler);
element.removeEventListener('click', this.boundHandler); // Works!
```

**✅ ALSO CORRECT (Arrow function):**
```typescript
private handler = (e: Event) => { /* this is automatically bound */ };
element.addEventListener('click', this.handler);
element.removeEventListener('click', this.handler); // Works!
```

## Testing

To verify the fix:
1. Open canvas drawing page
2. Check console - should see only ONE "🏭 PaperDrawingEngine constructor called"
3. Select rectangle tool
4. Draw a rectangle
5. Should see only ONE "🔵 handleRawTouchStart" per touch
6. Should see only "rectangle" tool, never "brush"
7. Result: Clean rectangle with no brush strokes

## Prevention

To prevent similar bugs:
1. **Always store bound functions** when using class methods as event handlers
2. **Use arrow functions** for event handlers (automatically bound)
3. **Test cleanup** by checking if listeners are actually removed
4. **Enable React Strict Mode** in development to catch cleanup issues
5. **Add logging** to constructors and destroy methods

## Related Issues

This fix also resolves:
- Multiple engines processing the same events
- Memory leaks from uncleaned event listeners
- Performance issues from duplicate event processing
- Inconsistent behavior in React Strict Mode
- Tool state confusion between old and new engines
