# React Hooks Order Fix - PhotoStoryModal

## Issue

**Error**: `React has detected a change in the order of Hooks called by PhotoStoryModal`

```
Uncaught Error: Rendered more hooks than during the previous render.
```

## Root Cause

The `useEffect` hook for OCR cleanup was placed **after** the early return statement:

```typescript
// ❌ WRONG - Hook after conditional return
const PhotoStoryModal = ({ isOpen, onClose }) => {
  // ... state and refs
  
  if (!isOpen) return null; // Early return
  
  // ❌ This hook is only called when isOpen is true
  useEffect(() => {
    return () => {
      ocrService.terminate();
    };
  }, []);
  
  // ... rest of component
};
```

## Why This Breaks

React's Rules of Hooks require:
1. **Hooks must be called in the same order on every render**
2. **Hooks cannot be called conditionally**
3. **Hooks must be called before any early returns**

When `isOpen` is false:
- Component returns `null` early
- `useEffect` is never called
- Hook count is different from when `isOpen` is true
- React detects hook order mismatch → Error

## Solution

Move the `useEffect` hook **before** the early return:

```typescript
// ✅ CORRECT - All hooks before conditional return
const PhotoStoryModal = ({ isOpen, onClose }) => {
  // ... state and refs
  
  // ✅ Hook called on every render, regardless of isOpen
  useEffect(() => {
    return () => {
      ocrService.terminate();
    };
  }, []);
  
  if (!isOpen) return null; // Early return is now safe
  
  // ... rest of component
};
```

## Fix Applied

**File**: `PhotoStoryModal.tsx`

**Changes**:
1. Moved `useEffect` hook before the `if (!isOpen) return null;` statement
2. Removed duplicate `useEffect` that was after the early return
3. Added comment to prevent future mistakes

**Result**: ✅ Hooks are now called in consistent order on every render

## Key Takeaways

### Rules of Hooks
1. ✅ Call hooks at the **top level** of your component
2. ✅ Call hooks **before any early returns**
3. ✅ Don't call hooks inside **conditions, loops, or nested functions**
4. ✅ Only call hooks from **React function components** or **custom hooks**

### Best Practice Pattern

```typescript
const MyComponent = ({ isOpen }) => {
  // 1. All hooks first (useState, useEffect, useRef, etc.)
  const [state, setState] = useState(initial);
  useEffect(() => { /* ... */ }, []);
  const ref = useRef(null);
  
  // 2. Then conditional returns
  if (!isOpen) return null;
  if (error) return <Error />;
  
  // 3. Then event handlers and other functions
  const handleClick = () => { /* ... */ };
  
  // 4. Finally, render JSX
  return <div>...</div>;
};
```

## Testing

After fix:
- ✅ Modal opens without errors
- ✅ OCR functionality works
- ✅ Mode toggle works
- ✅ No console warnings
- ✅ Cleanup happens correctly

## Related Resources

- [React Rules of Hooks](https://react.dev/link/rules-of-hooks)
- [React Hooks FAQ](https://react.dev/reference/react)
- [ESLint Plugin React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)

---

**Status**: ✅ Fixed  
**Date**: November 6, 2025  
**Impact**: Critical - Prevented modal from opening
