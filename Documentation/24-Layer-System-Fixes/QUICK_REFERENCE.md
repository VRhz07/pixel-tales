# Layer System - Quick Reference Guide

## 🎯 Quick Summary
Fixed 7 critical issues in the canvas layer system: thumbnail updates, layer isolation, visibility issues, duplicate backgrounds, clear canvas, UI layout, and desktop thumbnail display.

---

## 🔧 Key Fixes at a Glance

| Issue | Location | Fix |
|-------|----------|-----|
| Thumbnails not updating | `CanvasDrawingPage.tsx:789` | Always update cache, not just once |
| Layer content bleeding | `PaperDrawingEngine.ts:265,355` | Explicitly add items to active layer |
| Thumbnail shows all layers | `PaperDrawingEngine.ts:1693-1731` | Hide other layers during capture |
| Layers disappear after reorder | `PaperDrawingEngine.ts:1613,1483,1498` | Add `view.update()` calls |
| Layer 1 covers everything | `PaperDrawingEngine.ts:119,827-843` | Remove duplicate background |
| Clear canvas loses layers | `PaperDrawingEngine.ts:1095-1107` | Call `initializeLayers()` |
| Icons shift when toggled | `canvas-studio.css:1751-1771` | Fixed button dimensions (32x32px) |
| Desktop thumbnails empty | `CanvasDrawingPage.tsx:1307-1332` | Use actual thumbnails, not hardcoded empty |

---

## 📋 Common Tasks

### Add Explicit Layer Assignment to New Drawing Tools
```typescript
// After creating any path/shape:
this.scope.project.activeLayer.addChild(this.currentPath);
```

### Force View Update After Layer Changes
```typescript
// After any layer operation:
this.scope.view.update();
```

### Generate Isolated Layer Thumbnail
```typescript
// Hide all layers except target
this.scope.project.layers.forEach(l => l.visible = (l === layer));
this.scope.view.update();

// Capture thumbnail
ctx.drawImage(this.canvas, ...);

// Restore visibility
layerVisibilityStates.forEach(({layer: l, wasVisible}) => l.visible = wasVisible);
this.scope.view.update();
```

### Update Thumbnail Cache
```typescript
// Always update, don't check if exists:
if (layer.thumbnail) {
  thumbnailCacheRef.current.set(layer.id, layer.thumbnail);
}
```

---

## 🐛 Quick Debugging

### Thumbnails Not Showing?
1. Check console for "Thumbnail generation failed" warnings
2. Verify `layer.thumbnail` has data: `console.log(layer.thumbnail?.length)`
3. Check cache: `console.log(thumbnailCacheRef.current)`
4. Force update: `drawingEngineRef.current.notifyLayersChanged()`

### Layer Content Bleeding?
1. Check if items are on correct layer: `console.log(scope.project.activeLayer.children)`
2. Verify explicit `addChild()` calls in drawing methods
3. Check thumbnail isolation (should hide other layers)

### Layers Not Visible After Operation?
1. Add `this.scope.view.update()` after the operation
2. Check layer visibility: `console.log(layer.visible)`
3. Verify layer order: `scope.project.layers.forEach(l => console.log(l.name))`

---

## ⚡ Performance Tips

1. **Thumbnail throttling:** 300ms delay prevents excessive regeneration
2. **Thumbnail caching:** Use React ref, not state (avoids re-renders)
3. **View updates:** Only call `view.update()` when necessary
4. **Batch operations:** Group multiple layer changes together

---

## ✅ Testing Checklist (Quick)

- [ ] Draw on Layer 1 → thumbnail updates
- [ ] Switch layers → no content bleeding
- [ ] Reorder layers → all stay visible
- [ ] Toggle visibility → canvas updates
- [ ] Clear canvas → Background + Layer 1 restored
- [ ] Toggle icons → no layout shift
- [ ] Desktop mode → thumbnails show

---

## 📁 File Locations

**Core Logic:**
- `frontend/src/components/canvas/PaperDrawingEngine.ts` (1741 lines)

**UI Components:**
- `frontend/src/pages/CanvasDrawingPage.tsx` (2173 lines)

**Styling:**
- `frontend/src/canvas-studio.css` (2473 lines)

**Documentation:**
- `Documentation/24-Layer-System-Fixes/LAYER_SYSTEM_FIXES.md` (Full documentation)
- `Documentation/24-Layer-System-Fixes/QUICK_REFERENCE.md` (This file)

---

## 🚀 Quick Start for New Developers

1. **Read:** `LAYER_SYSTEM_FIXES.md` for full context
2. **Understand:** Layer isolation requires explicit `addChild()` calls
3. **Remember:** Always call `view.update()` after layer changes
4. **Test:** Use the testing checklist before committing

---

## 📞 Need Help?

- Full documentation: `LAYER_SYSTEM_FIXES.md`
- Debugging tips: See "Debugging Tips" section in full docs
- Architecture: See "Technical Architecture" section in full docs
