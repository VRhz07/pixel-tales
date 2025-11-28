# Color Management Integration Example

## Quick Integration Guide

This guide shows how to integrate the new color management features into your existing `CanvasDrawingPage.tsx`.

## Step 1: Import the Components

Add these imports at the top of your `CanvasDrawingPage.tsx`:

```typescript
// Add to existing imports
import { AdvancedColorPicker } from '../components/canvas/AdvancedColorPicker';
import { GradientEditor, GradientConfig } from '../components/canvas/GradientEditor';
import { BlendingModes, BlendMode } from '../components/canvas/BlendingModes';
```

## Step 2: Add State Variables

Add these state variables to your component:

```typescript
// Add to existing state
const [showAdvancedColorPicker, setShowAdvancedColorPicker] = useState(false);
const [showGradientEditor, setShowGradientEditor] = useState(false);
const [currentGradient, setCurrentGradient] = useState<GradientConfig>({
  type: 'linear',
  angle: 90,
  stops: [
    { color: '#667eea', position: 0 },
    { color: '#764ba2', position: 100 }
  ]
});
const [layerBlendModes, setLayerBlendModes] = useState<Record<string, BlendMode>>({});
```

## Step 3: Replace Basic Color Picker

### Before (Basic Color Picker):
```typescript
{activePanel === 'colors' && (
  <>
    {/* Custom Color Picker */}
    <div className="canvas-studio-color-section">
      <h3 className="canvas-studio-color-section-title">Custom Color</h3>
      <div className="canvas-studio-color-picker-container">
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => handleColorSelect(e.target.value)}
          className="canvas-studio-color-picker"
        />
        <span className="canvas-studio-color-hex">{selectedColor}</span>
      </div>
    </div>
    {/* ... rest of color section */}
  </>
)}
```

### After (Advanced Color Picker):
```typescript
{activePanel === 'colors' && (
  <>
    {/* Advanced Color Picker */}
    <div className="canvas-studio-color-section">
      <h3 className="canvas-studio-color-section-title">Color Selection</h3>
      <AdvancedColorPicker
        color={selectedColor}
        onChange={(color, alpha) => {
          setSelectedColor(color);
          setBrushOpacity(alpha || 1);
          if (drawingEngineRef.current) {
            drawingEngineRef.current.setColor(color);
            drawingEngineRef.current.setOpacity(alpha || 1);
          }
          // Add to recent colors
          if (!recentColors.includes(color)) {
            setRecentColors([color, ...recentColors.slice(0, 9)]);
          }
        }}
        showAlpha={true}
        showFormats={true}
        recentColors={recentColors}
        onAddToRecent={(color) => {
          if (!recentColors.includes(color)) {
            setRecentColors([color, ...recentColors.slice(0, 9)]);
          }
        }}
      />
    </div>

    {/* Gradient Editor Section */}
    <div className="canvas-studio-color-section">
      <h3 className="canvas-studio-color-section-title">Gradients</h3>
      <button
        className="canvas-studio-section-toggle"
        onClick={() => setShowGradientEditor(!showGradientEditor)}
      >
        {showGradientEditor ? 'Hide' : 'Show'} Gradient Editor
      </button>
      {showGradientEditor && (
        <GradientEditor
          gradient={currentGradient}
          onChange={setCurrentGradient}
          onApply={() => {
            // Apply gradient to canvas
            // This would require implementing gradient support in your drawing engine
            console.log('Applying gradient:', currentGradient);
            alert('Gradient tool coming soon! For now, use it as a color reference.');
          }}
        />
      )}
    </div>

    {/* Keep existing predefined colors */}
    <div className="canvas-studio-color-section">
      <h3 className="canvas-studio-color-section-title">Quick Colors</h3>
      <div className="canvas-studio-colors-grid">
        {predefinedColors.map((color, index) => (
          <button
            key={`color-${index}`}
            className={`canvas-studio-color-swatch ${
              color === selectedColor ? 'canvas-studio-color-swatch-active' : ''
            }`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorSelect(color)}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
    </div>
  </>
)}
```

## Step 4: Add Blending Modes to Layers Panel

Add this to your layers panel:

```typescript
{activePanel === 'layers' && (
  <>
    {/* Existing layers list */}
    <div className="canvas-studio-layers-list">
      {/* ... existing layer items ... */}
    </div>

    {/* Blend Mode Section for Selected Layer */}
    {activeLayerId && (
      <div className="canvas-studio-color-section" style={{ marginTop: '1rem' }}>
        <h3 className="canvas-studio-color-section-title">Layer Blend Mode</h3>
        <BlendingModes
          currentMode={layerBlendModes[activeLayerId] || 'normal'}
          onChange={(mode) => {
            setLayerBlendModes({
              ...layerBlendModes,
              [activeLayerId]: mode
            });
            // Apply blend mode to layer
            if (drawingEngineRef.current) {
              // This would require implementing blend mode support in your drawing engine
              console.log(`Setting blend mode for layer ${activeLayerId}:`, mode);
            }
          }}
          showPreview={true}
        />
      </div>
    )}
  </>
)}
```

## Step 5: Add CSS Imports

Add these imports to your main CSS file or component:

```typescript
// In your component file or index.css
import '../components/canvas/AdvancedColorPicker.css';
import '../components/canvas/GradientEditor.css';
import '../components/canvas/BlendingModes.css';
```

## Step 6: Mobile Modal Integration

For mobile, add modals for advanced features:

```typescript
{/* Advanced Color Picker Modal - Mobile */}
{isMobile && showAdvancedColorPicker && (
  <div className="canvas-studio-modal-overlay" onClick={() => setShowAdvancedColorPicker(false)}>
    <div className="canvas-studio-modal canvas-studio-modal-large" onClick={(e) => e.stopPropagation()}>
      <div className="canvas-studio-modal-header">
        <h3 className="canvas-studio-modal-title">Advanced Colors</h3>
        <button onClick={() => setShowAdvancedColorPicker(false)}>
          <XMarkIcon className="canvas-studio-modal-close-icon" />
        </button>
      </div>
      <div className="canvas-studio-modal-content">
        <AdvancedColorPicker
          color={selectedColor}
          onChange={(color, alpha) => {
            setSelectedColor(color);
            setBrushOpacity(alpha || 1);
            if (drawingEngineRef.current) {
              drawingEngineRef.current.setColor(color);
              drawingEngineRef.current.setOpacity(alpha || 1);
            }
          }}
          showAlpha={true}
          showFormats={true}
          recentColors={recentColors}
          onAddToRecent={(color) => {
            if (!recentColors.includes(color)) {
              setRecentColors([color, ...recentColors.slice(0, 9)]);
            }
          }}
        />
      </div>
    </div>
  </div>
)}

{/* Gradient Editor Modal - Mobile */}
{isMobile && showGradientEditor && (
  <div className="canvas-studio-modal-overlay" onClick={() => setShowGradientEditor(false)}>
    <div className="canvas-studio-modal canvas-studio-modal-large" onClick={(e) => e.stopPropagation()}>
      <div className="canvas-studio-modal-header">
        <h3 className="canvas-studio-modal-title">Gradient Editor</h3>
        <button onClick={() => setShowGradientEditor(false)}>
          <XMarkIcon className="canvas-studio-modal-close-icon" />
        </button>
      </div>
      <div className="canvas-studio-modal-content">
        <GradientEditor
          gradient={currentGradient}
          onChange={setCurrentGradient}
          onApply={() => {
            console.log('Applying gradient:', currentGradient);
            setShowGradientEditor(false);
          }}
        />
      </div>
    </div>
  </div>
)}
```

## Step 7: Add Toolbar Buttons

Add buttons to access advanced features:

```typescript
{/* In desktop right panel or mobile toolbar */}
<button
  className="canvas-studio-tool-btn"
  onClick={() => setShowAdvancedColorPicker(true)}
  title="Advanced Color Picker"
>
  <div className="canvas-studio-color-circle-icon" />
  <span className="canvas-studio-tool-label">Advanced Colors</span>
</button>

<button
  className="canvas-studio-tool-btn"
  onClick={() => setShowGradientEditor(true)}
  title="Gradient Editor"
>
  <div style={{ 
    width: '20px', 
    height: '20px', 
    background: 'linear-gradient(90deg, #667eea, #764ba2)',
    borderRadius: '4px'
  }} />
  <span className="canvas-studio-tool-label">Gradients</span>
</button>
```

## Complete Example Function

Here's a complete handler function:

```typescript
const handleAdvancedColorChange = (color: string, alpha?: number) => {
  // Update color state
  setSelectedColor(color);
  
  // Update opacity if provided
  if (alpha !== undefined) {
    setBrushOpacity(alpha);
  }
  
  // Update drawing engine
  if (drawingEngineRef.current) {
    drawingEngineRef.current.setColor(color);
    if (alpha !== undefined) {
      drawingEngineRef.current.setOpacity(alpha);
    }
  }
  
  // Add to recent colors
  if (!recentColors.includes(color)) {
    const newRecentColors = [color, ...recentColors.slice(0, 9)];
    setRecentColors(newRecentColors);
    
    // Optionally save to localStorage
    localStorage.setItem('recentColors', JSON.stringify(newRecentColors));
  }
};
```

## Testing Checklist

After integration, test:

- [ ] Advanced color picker opens and closes
- [ ] Color format switching works (HEX/RGB/HSL/CMYK)
- [ ] Opacity slider updates brush opacity
- [ ] Recent colors are tracked
- [ ] Gradient editor creates gradients
- [ ] Gradient presets work
- [ ] Blend modes change layer appearance
- [ ] Mobile modals work properly
- [ ] All components are responsive

## Tips

1. **Start Small**: Integrate one component at a time
2. **Test Thoroughly**: Check desktop and mobile views
3. **Save State**: Consider saving user preferences to localStorage
4. **Performance**: Debounce color changes if needed
5. **Accessibility**: Ensure all inputs have proper labels

## Next Steps

1. Implement gradient fill tool in drawing engine
2. Add blend mode support to layer rendering
3. Create color palette save/load functionality
4. Add eyedropper tool for color sampling
5. Implement color harmony suggestions

---

**Ready to integrate?** Follow these steps and you'll have professional color management in your canvas!
