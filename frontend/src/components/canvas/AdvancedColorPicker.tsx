/**
 * Advanced Color Picker Component
 * Supports RGB, CMYK, HSL, and HEX color formats
 * Includes color history and palette management
 */

import React, { useState, useEffect } from 'react';
import './AdvancedColorPicker.css';
import { useSoundEffects } from '../../hooks/useSoundEffects';

export interface ColorValue {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  cmyk: { c: number; m: number; y: number; k: number };
  alpha: number;
}

interface AdvancedColorPickerProps {
  color: string;
  onChange: (color: string, alpha?: number) => void;
  showAlpha?: boolean;
  showFormats?: boolean;
  recentColors?: string[];
  onAddToRecent?: (color: string) => void;
  // Brush settings (optional - only shown in landscape widescreen)
  brushSize?: number;
  onBrushSizeChange?: (size: number) => void;
  showBrushSettings?: boolean;
}

const AdvancedColorPicker: React.FC<AdvancedColorPickerProps> = ({
  color,
  onChange,
  showAlpha = true,
  showFormats = true,
  recentColors = [],
  onAddToRecent,
  brushSize = 5,
  onBrushSizeChange,
  showBrushSettings = false
}) => {
  const { playSound } = useSoundEffects();
  const [colorFormat, setColorFormat] = useState<'hex' | 'rgb' | 'hsl' | 'cmyk'>('hex');
  const [colorValue, setColorValue] = useState<ColorValue>(hexToColorValue(color));
  const [inputValue, setInputValue] = useState(color);

  useEffect(() => {
    const newColorValue = hexToColorValue(color);
    setColorValue(newColorValue);
    setInputValue(formatColorForDisplay(newColorValue, colorFormat));
  }, [color, colorFormat]);

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

  function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    
    const k = 1 - Math.max(rNorm, gNorm, bNorm);
    const c = k === 1 ? 0 : (1 - rNorm - k) / (1 - k);
    const m = k === 1 ? 0 : (1 - gNorm - k) / (1 - k);
    const y = k === 1 ? 0 : (1 - bNorm - k) / (1 - k);

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  }

  function cmykToRgb(c: number, m: number, y: number, k: number): { r: number; g: number; b: number } {
    c /= 100;
    m /= 100;
    y /= 100;
    k /= 100;

    const r = 255 * (1 - c) * (1 - k);
    const g = 255 * (1 - m) * (1 - k);
    const b = 255 * (1 - y) * (1 - k);

    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
  }

  function hexToColorValue(hex: string): ColorValue {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
    return { hex, rgb, hsl, cmyk, alpha: 1 };
  }

  function formatColorForDisplay(value: ColorValue, format: string): string {
    switch (format) {
      case 'hex':
        return value.hex.toUpperCase();
      case 'rgb':
        return `${value.rgb.r}, ${value.rgb.g}, ${value.rgb.b}`;
      case 'hsl':
        return `${value.hsl.h}°, ${value.hsl.s}%, ${value.hsl.l}%`;
      case 'cmyk':
        return `${value.cmyk.c}%, ${value.cmyk.m}%, ${value.cmyk.y}%, ${value.cmyk.k}%`;
      default:
        return value.hex;
    }
  }

  const handleColorChange = (newHex: string) => {
    playSound('color-pick');
    const newColorValue = hexToColorValue(newHex);
    setColorValue(newColorValue);
    setInputValue(formatColorForDisplay(newColorValue, colorFormat));
    onChange(newHex, newColorValue.alpha);
    if (onAddToRecent) {
      onAddToRecent(newHex);
    }
  };

  const handleRgbChange = (component: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...colorValue.rgb, [component]: Math.max(0, Math.min(255, value)) };
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    handleColorChange(newHex);
  };

  const handleHslChange = (component: 'h' | 's' | 'l', value: number) => {
    const newHsl = { ...colorValue.hsl, [component]: value };
    if (component === 'h') newHsl.h = Math.max(0, Math.min(360, value));
    if (component === 's' || component === 'l') newHsl[component] = Math.max(0, Math.min(100, value));
    
    const rgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
    handleColorChange(newHex);
  };

  const handleCmykChange = (component: 'c' | 'm' | 'y' | 'k', value: number) => {
    const newCmyk = { ...colorValue.cmyk, [component]: Math.max(0, Math.min(100, value)) };
    const rgb = cmykToRgb(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
    const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
    handleColorChange(newHex);
  };

  const handleAlphaChange = (alpha: number) => {
    const newAlpha = Math.max(0, Math.min(1, alpha));
    setColorValue({ ...colorValue, alpha: newAlpha });
    onChange(colorValue.hex, newAlpha);
  };

  return (
    <div className="advanced-color-picker">
      {/* Color Preview and Wheel */}
      <div className="acp-preview-section">
        <div className="acp-color-wheel-container">
          <input
            type="color"
            value={colorValue.hex}
            onChange={(e) => handleColorChange(e.target.value)}
            className="acp-color-wheel"
          />
        </div>
        <div className="acp-color-preview" style={{ backgroundColor: colorValue.hex, opacity: colorValue.alpha }}>
          <div className="acp-preview-label">{colorValue.hex.toUpperCase()}</div>
        </div>
      </div>

      {/* Format Tabs */}
      {showFormats && (
        <div className="acp-format-tabs">
          <button
            className={`acp-format-tab ${colorFormat === 'hex' ? 'active' : ''}`}
            onClick={() => {
              playSound('button-toggle');
              setColorFormat('hex');
            }}
          >
            HEX
          </button>
          <button
            className={`acp-format-tab ${colorFormat === 'rgb' ? 'active' : ''}`}
            onClick={() => {
              playSound('button-toggle');
              setColorFormat('rgb');
            }}
          >
            RGB
          </button>
          <button
            className={`acp-format-tab ${colorFormat === 'hsl' ? 'active' : ''}`}
            onClick={() => {
              playSound('button-toggle');
              setColorFormat('hsl');
            }}
          >
            HSL
          </button>
          <button
            className={`acp-format-tab ${colorFormat === 'cmyk' ? 'active' : ''}`}
            onClick={() => {
              playSound('button-toggle');
              setColorFormat('cmyk');
            }}
          >
            CMYK
          </button>
        </div>
      )}

      {/* Color Input Fields */}
      <div className="acp-inputs">
        {colorFormat === 'hex' && (
          <div className="acp-input-group">
            <label className="acp-input-label">HEX</label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                  handleColorChange(e.target.value);
                }
              }}
              className="acp-input"
              placeholder="#000000"
            />
          </div>
        )}

        {colorFormat === 'rgb' && (
          <>
            <div className="acp-input-group">
              <label className="acp-input-label">R</label>
              <input
                type="number"
                min="0"
                max="255"
                value={colorValue.rgb.r}
                onChange={(e) => handleRgbChange('r', parseInt(e.target.value) || 0)}
                className="acp-input"
              />
            </div>
            <div className="acp-input-group">
              <label className="acp-input-label">G</label>
              <input
                type="number"
                min="0"
                max="255"
                value={colorValue.rgb.g}
                onChange={(e) => handleRgbChange('g', parseInt(e.target.value) || 0)}
                className="acp-input"
              />
            </div>
            <div className="acp-input-group">
              <label className="acp-input-label">B</label>
              <input
                type="number"
                min="0"
                max="255"
                value={colorValue.rgb.b}
                onChange={(e) => handleRgbChange('b', parseInt(e.target.value) || 0)}
                className="acp-input"
              />
            </div>
          </>
        )}

        {colorFormat === 'hsl' && (
          <>
            <div className="acp-input-group">
              <label className="acp-input-label">H</label>
              <input
                type="number"
                min="0"
                max="360"
                value={colorValue.hsl.h}
                onChange={(e) => handleHslChange('h', parseInt(e.target.value) || 0)}
                className="acp-input"
              />
            </div>
            <div className="acp-input-group">
              <label className="acp-input-label">S</label>
              <input
                type="number"
                min="0"
                max="100"
                value={colorValue.hsl.s}
                onChange={(e) => handleHslChange('s', parseInt(e.target.value) || 0)}
                className="acp-input"
              />
            </div>
            <div className="acp-input-group">
              <label className="acp-input-label">L</label>
              <input
                type="number"
                min="0"
                max="100"
                value={colorValue.hsl.l}
                onChange={(e) => handleHslChange('l', parseInt(e.target.value) || 0)}
                className="acp-input"
              />
            </div>
          </>
        )}

        {colorFormat === 'cmyk' && (
          <>
            <div className="acp-input-group">
              <label className="acp-input-label">C</label>
              <input
                type="number"
                min="0"
                max="100"
                value={colorValue.cmyk.c}
                onChange={(e) => handleCmykChange('c', parseInt(e.target.value) || 0)}
                className="acp-input"
              />
            </div>
            <div className="acp-input-group">
              <label className="acp-input-label">M</label>
              <input
                type="number"
                min="0"
                max="100"
                value={colorValue.cmyk.m}
                onChange={(e) => handleCmykChange('m', parseInt(e.target.value) || 0)}
                className="acp-input"
              />
            </div>
            <div className="acp-input-group">
              <label className="acp-input-label">Y</label>
              <input
                type="number"
                min="0"
                max="100"
                value={colorValue.cmyk.y}
                onChange={(e) => handleCmykChange('y', parseInt(e.target.value) || 0)}
                className="acp-input"
              />
            </div>
            <div className="acp-input-group">
              <label className="acp-input-label">K</label>
              <input
                type="number"
                min="0"
                max="100"
                value={colorValue.cmyk.k}
                onChange={(e) => handleCmykChange('k', parseInt(e.target.value) || 0)}
                className="acp-input"
              />
            </div>
          </>
        )}
      </div>

      {/* Alpha/Opacity Slider */}
      {showAlpha && (
        <div className="acp-alpha-section">
          <label className="acp-alpha-label">
            Opacity: {Math.round(colorValue.alpha * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={colorValue.alpha * 100}
            onChange={(e) => handleAlphaChange(parseInt(e.target.value) / 100)}
            className="acp-alpha-slider"
          />
        </div>
      )}

      {/* Brush Size Slider (Landscape Widescreen) */}
      {showBrushSettings && onBrushSizeChange && (
        <div className="acp-brush-section">
          <label className="acp-brush-label">
            Brush Size: {brushSize}px
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
            className="acp-brush-slider"
          />
        </div>
      )}

      {/* Recent Colors */}
      {recentColors.length > 0 && (
        <div className="acp-recent-colors">
          <label className="acp-section-label">Recent Colors</label>
          <div className="acp-color-swatches">
            {recentColors.map((recentColor, index) => (
              <button
                key={index}
                className={`acp-color-swatch ${recentColor === colorValue.hex ? 'active' : ''}`}
                style={{ backgroundColor: recentColor }}
                onClick={() => handleColorChange(recentColor)}
                title={recentColor}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(AdvancedColorPicker);
