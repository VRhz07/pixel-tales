/**
 * Gradient Editor Component
 * Create and edit linear and radial gradients
 */

import React, { useState } from 'react';
import './GradientEditor.css';
import { MobileColorPicker } from './MobileColorPicker';
import { useSoundEffects } from '../../hooks/useSoundEffects';

export interface GradientStop {
  color: string;
  position: number; // 0-100
}

export interface GradientConfig {
  type: 'linear' | 'radial';
  angle: number; // 0-360 for linear
  stops: GradientStop[];
}

interface GradientEditorProps {
  gradient: GradientConfig;
  onChange: (gradient: GradientConfig) => void;
  onApply?: () => void;
}

export const GradientEditor: React.FC<GradientEditorProps> = ({
  gradient,
  onChange,
  onApply
}) => {
  const { playSound } = useSoundEffects();
  const [selectedStopIndex, setSelectedStopIndex] = useState<number>(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const generateGradientCSS = (config: GradientConfig): string => {
    const stopsCSS = config.stops
      .sort((a, b) => a.position - b.position)
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(', ');

    if (config.type === 'linear') {
      return `linear-gradient(${config.angle}deg, ${stopsCSS})`;
    } else {
      return `radial-gradient(circle, ${stopsCSS})`;
    }
  };

  const handleTypeChange = (type: 'linear' | 'radial') => {
    playSound('button-toggle');
    onChange({ ...gradient, type });
  };

  const handleAngleChange = (angle: number) => {
    onChange({ ...gradient, angle: Math.max(0, Math.min(360, angle)) });
  };

  const handleAddStop = () => {
    playSound('button-success');
    const newStop: GradientStop = {
      color: '#8B5CF6',
      position: 50
    };
    const newStops = [...gradient.stops, newStop].sort((a, b) => a.position - b.position);
    onChange({ ...gradient, stops: newStops });
    setSelectedStopIndex(newStops.indexOf(newStop));
  };

  const handleRemoveStop = (index: number) => {
    if (gradient.stops.length <= 2) {
      playSound('error');
      alert('Gradient must have at least 2 color stops');
      return;
    }
    playSound('button-cancel');
    const newStops = gradient.stops.filter((_, i) => i !== index);
    onChange({ ...gradient, stops: newStops });
    setSelectedStopIndex(Math.max(0, index - 1));
  };

  const handleStopColorChange = (index: number, color: string) => {
    playSound('color-pick');
    const newStops = [...gradient.stops];
    newStops[index] = { ...newStops[index], color };
    onChange({ ...gradient, stops: newStops });
  };

  const handleStopPositionChange = (index: number, position: number) => {
    const newStops = [...gradient.stops];
    newStops[index] = { ...newStops[index], position: Math.max(0, Math.min(100, position)) };
    onChange({ ...gradient, stops: newStops.sort((a, b) => a.position - b.position) });
  };

  const handlePresetGradient = (preset: GradientConfig) => {
    playSound('button-click');
    onChange(preset);
    setSelectedStopIndex(0);
  };

  // Preset gradients
  const presets: GradientConfig[] = [
    {
      type: 'linear',
      angle: 90,
      stops: [
        { color: '#667eea', position: 0 },
        { color: '#764ba2', position: 100 }
      ]
    },
    {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#f093fb', position: 0 },
        { color: '#f5576c', position: 100 }
      ]
    },
    {
      type: 'linear',
      angle: 45,
      stops: [
        { color: '#4facfe', position: 0 },
        { color: '#00f2fe', position: 100 }
      ]
    },
    {
      type: 'linear',
      angle: 90,
      stops: [
        { color: '#43e97b', position: 0 },
        { color: '#38f9d7', position: 100 }
      ]
    },
    {
      type: 'radial',
      angle: 0,
      stops: [
        { color: '#fa709a', position: 0 },
        { color: '#fee140', position: 100 }
      ]
    },
    {
      type: 'linear',
      angle: 180,
      stops: [
        { color: '#30cfd0', position: 0 },
        { color: '#330867', position: 100 }
      ]
    }
  ];

  return (
    <div className="gradient-editor">
      {/* Gradient Preview */}
      <div className="ge-preview-section">
        <div
          className="ge-preview"
          style={{ background: generateGradientCSS(gradient) }}
        >
          <div className="ge-preview-label">Preview</div>
        </div>
      </div>

      {/* Type Selector */}
      <div className="ge-type-selector">
        <button
          className={`ge-type-btn ${gradient.type === 'linear' ? 'active' : ''}`}
          onClick={() => handleTypeChange('linear')}
        >
          <div className="ge-type-icon-linear" />
          Linear
        </button>
        <button
          className={`ge-type-btn ${gradient.type === 'radial' ? 'active' : ''}`}
          onClick={() => handleTypeChange('radial')}
        >
          <div className="ge-type-icon-radial" />
          Radial
        </button>
      </div>

      {/* Angle Control (Linear only) */}
      {gradient.type === 'linear' && (
        <div className="ge-angle-control">
          <label className="ge-label">
            Angle: {gradient.angle}°
          </label>
          <div className="ge-angle-input-group">
            <input
              type="range"
              min="0"
              max="360"
              value={gradient.angle}
              onChange={(e) => handleAngleChange(parseInt(e.target.value))}
              className="ge-angle-slider"
            />
            <input
              type="number"
              min="0"
              max="360"
              value={gradient.angle}
              onChange={(e) => handleAngleChange(parseInt(e.target.value) || 0)}
              className="ge-angle-input"
            />
          </div>
        </div>
      )}

      {/* Gradient Bar with Stops */}
      <div className="ge-stops-section">
        <label className="ge-label">Color Stops</label>
        <div className="ge-gradient-bar-container">
          <div
            className="ge-gradient-bar"
            style={{ background: generateGradientCSS(gradient) }}
          >
            {gradient.stops.map((stop, index) => (
              <div
                key={index}
                className={`ge-stop-marker ${selectedStopIndex === index ? 'active' : ''}`}
                style={{ left: `${stop.position}%` }}
                onClick={() => setSelectedStopIndex(index)}
              >
                <div
                  className="ge-stop-color"
                  style={{ backgroundColor: stop.color }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Stop Controls */}
      {gradient.stops[selectedStopIndex] && (
        <div className="ge-stop-controls">
          <div className="ge-stop-control-row">
            <div className="ge-stop-color-picker">
              <label className="ge-label">Color</label>
              {isMobile ? (
                <button
                  onClick={() => setShowColorPicker(true)}
                  className="ge-mobile-color-button"
                  style={{ backgroundColor: gradient.stops[selectedStopIndex].color }}
                >
                  <span className="ge-color-hex">
                    {gradient.stops[selectedStopIndex].color.toUpperCase()}
                  </span>
                </button>
              ) : (
                <>
                  <input
                    type="color"
                    value={gradient.stops[selectedStopIndex].color}
                    onChange={(e) => handleStopColorChange(selectedStopIndex, e.target.value)}
                    className="ge-color-input"
                  />
                  <span className="ge-color-hex">
                    {gradient.stops[selectedStopIndex].color.toUpperCase()}
                  </span>
                </>
              )}
            </div>
            <div className="ge-stop-position">
              <label className="ge-label">Position</label>
              <input
                type="number"
                min="0"
                max="100"
                value={gradient.stops[selectedStopIndex].position}
                onChange={(e) => handleStopPositionChange(selectedStopIndex, parseInt(e.target.value) || 0)}
                className="ge-position-input"
              />
              <span className="ge-position-unit">%</span>
            </div>
          </div>
          <div className="ge-stop-actions">
            <button
              className="ge-action-btn ge-add-btn"
              onClick={handleAddStop}
            >
              + Add Stop
            </button>
            {gradient.stops.length > 2 && (
              <button
                className="ge-action-btn ge-remove-btn"
                onClick={() => handleRemoveStop(selectedStopIndex)}
              >
                Remove Stop
              </button>
            )}
          </div>
        </div>
      )}

      {/* Preset Gradients */}
      <div className="ge-presets-section">
        <label className="ge-label">Presets</label>
        <div className="ge-presets-grid">
          {presets.map((preset, index) => (
            <button
              key={index}
              className="ge-preset-btn"
              style={{ background: generateGradientCSS(preset) }}
              onClick={() => handlePresetGradient(preset)}
              title={`Preset ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Apply Button */}
      {onApply && (
        <button 
          className="ge-apply-btn" 
          onClick={() => {
            playSound('button-success');
            onApply();
          }}
        >
          Apply Gradient
        </button>
      )}

      {/* Mobile Color Picker Modal */}
      {isMobile && showColorPicker && (
        <MobileColorPicker
          color={gradient.stops[selectedStopIndex].color}
          onColorChange={(color) => handleStopColorChange(selectedStopIndex, color)}
          onClose={() => setShowColorPicker(false)}
          suggestions={[
            '#FF0000', '#FF6B00', '#FFD700', '#00FF00', 
            '#00FFFF', '#0000FF', '#8B00FF', '#FF00FF',
            '#FFFFFF', '#000000', '#808080', '#8B5CF6'
          ]}
        />
      )}
    </div>
  );
};

export default GradientEditor;
