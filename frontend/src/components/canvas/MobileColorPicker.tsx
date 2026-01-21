/**
 * Mobile-Optimized Color Picker Component
 * Custom HSV color picker with large touch-friendly sliders
 */

import React, { useState, useEffect } from 'react';
import './MobileColorPicker.css';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface MobileColorPickerProps {
  color: string;
  onColorChange: (color: string) => void;
  onClose: () => void;
  suggestions?: string[];
}

const MobileColorPicker: React.FC<MobileColorPickerProps> = ({
  color,
  onColorChange,
  onClose,
  suggestions = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']
}) => {
  const { playSound } = useSoundEffects();
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [value, setValue] = useState(100);
  const [currentColor, setCurrentColor] = useState(color);
  const [isInitialized, setIsInitialized] = useState(false);

  // Convert hex to HSV on mount and when color prop changes
  useEffect(() => {
    const hsv = hexToHsv(color);
    
    // Always extract the hue from the current color
    const extractedHue = hsv.h;
    
    // If the color is very dark (black or near-black), set better defaults
    // This prevents confusing all-black sliders when opening the picker
    if (hsv.v < 10 && hsv.s < 10) {
      // Color is essentially black, use better defaults
      setHue(extractedHue || 0); // Keep hue if it exists, otherwise red
      setSaturation(100); // Full saturation
      setValue(100); // Full brightness
    } else if (hsv.s < 10) {
      // Color is grayscale (low saturation), boost saturation for better visibility
      setHue(extractedHue || 0);
      setSaturation(100); // Full saturation so user can see the hue
      setValue(hsv.v);
    } else {
      // Use the actual color's HSV values
      setHue(hsv.h);
      setSaturation(hsv.s);
      setValue(hsv.v);
    }
    
    setIsInitialized(true);
  }, [color]);

  // Update color when HSV values change (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      const newColor = hsvToHex(hue, saturation, value);
      setCurrentColor(newColor);
    }
  }, [hue, saturation, value, isInitialized]);

  // Color conversion utilities
  function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  function hexToHsv(hex: string): { h: number; s: number; v: number } {
    const rgb = hexToRgb(hex);
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  }

  function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    const s = max === 0 ? 0 : (diff / max) * 100;
    const v = max * 100;

    if (diff !== 0) {
      switch (max) {
        case r:
          h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
          break;
        case g:
          h = ((b - r) / diff + 2) * 60;
          break;
        case b:
          h = ((r - g) / diff + 4) * 60;
          break;
      }
    }

    return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
  }

  function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
    h = h / 360;
    s = s / 100;
    v = v / 100;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    let r = 0, g = 0, b = 0;

    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  function hsvToHex(h: number, s: number, v: number): string {
    const rgb = hsvToRgb(h, s, v);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  const handleSet = () => {
    playSound('color-pick');
    onColorChange(currentColor);
    onClose();
  };

  const handleSuggestionClick = (suggestionColor: string) => {
    playSound('color-pick');
    const hsv = hexToHsv(suggestionColor);
    setHue(hsv.h);
    setSaturation(hsv.s);
    setValue(hsv.v);
  };

  return (
    <div className="mobile-color-picker-overlay" onClick={onClose}>
      <div className="mobile-color-picker" onClick={(e) => e.stopPropagation()}>
        <h3 className="mcp-title">Select color</h3>

        {/* Hue Slider */}
        <div className="mcp-slider-group">
          <label className="mcp-label">Hue</label>
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => setHue(parseInt(e.target.value))}
            className="mcp-slider mcp-hue-slider"
            style={{
              background: `linear-gradient(to right, 
                #ff0000 0%, 
                #ffff00 16.67%, 
                #00ff00 33.33%, 
                #00ffff 50%, 
                #0000ff 66.67%, 
                #ff00ff 83.33%, 
                #ff0000 100%)`
            }}
          />
        </div>

        {/* Saturation Slider */}
        <div className="mcp-slider-group">
          <label className="mcp-label">Saturation</label>
          <input
            type="range"
            min="0"
            max="100"
            value={saturation}
            onChange={(e) => setSaturation(parseInt(e.target.value))}
            className="mcp-slider mcp-saturation-slider"
            style={{
              background: `linear-gradient(to right, 
                ${hsvToHex(hue, 0, value)}, 
                ${hsvToHex(hue, 100, value)})`
            }}
          />
        </div>

        {/* Value Slider */}
        <div className="mcp-slider-group">
          <label className="mcp-label">Value</label>
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => setValue(parseInt(e.target.value))}
            className="mcp-slider mcp-value-slider"
            style={{
              background: `linear-gradient(to right, 
                #000000, 
                ${hsvToHex(hue, saturation, 100)})`
            }}
          />
        </div>

        {/* Color Preview and Suggestions */}
        <div className="mcp-bottom-section">
          <div className="mcp-suggestions-section">
            <label className="mcp-suggestions-label">Suggestions</label>
            <div className="mcp-suggestions-grid">
              {suggestions.map((suggestionColor, index) => (
                <button
                  key={index}
                  className="mcp-suggestion-swatch"
                  style={{ backgroundColor: suggestionColor }}
                  onClick={() => handleSuggestionClick(suggestionColor)}
                  aria-label={`Select color ${suggestionColor}`}
                />
              ))}
            </div>
          </div>

          <div className="mcp-chosen-section">
            <label className="mcp-chosen-label">Chosen color</label>
            <div
              className="mcp-chosen-preview"
              style={{ backgroundColor: currentColor }}
            />
            <div className="mcp-chosen-hex">{currentColor.toUpperCase()}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mcp-actions">
          <button 
            className="mcp-btn mcp-btn-cancel" 
            onClick={() => {
              playSound('button-cancel');
              onClose();
            }}
          >
            Cancel
          </button>
          <button className="mcp-btn mcp-btn-set" onClick={handleSet}>
            Set
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MobileColorPicker);
