/**
 * Blending Modes Component
 * Provides blend mode selection for layers
 */

import React from 'react';
import './BlendingModes.css';
import { useSoundEffects } from '../../hooks/useSoundEffects';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

interface BlendingModesProps {
  currentMode: BlendMode;
  onChange: (mode: BlendMode) => void;
  showPreview?: boolean;
}

export const BlendingModes: React.FC<BlendingModesProps> = ({
  currentMode,
  onChange,
  showPreview = true
}) => {
  const { playSound } = useSoundEffects();
  const blendModes: { mode: BlendMode; label: string; category: string }[] = [
    // Normal
    { mode: 'normal', label: 'Normal', category: 'Normal' },
    
    // Darken
    { mode: 'darken', label: 'Darken', category: 'Darken' },
    { mode: 'multiply', label: 'Multiply', category: 'Darken' },
    { mode: 'color-burn', label: 'Color Burn', category: 'Darken' },
    
    // Lighten
    { mode: 'lighten', label: 'Lighten', category: 'Lighten' },
    { mode: 'screen', label: 'Screen', category: 'Lighten' },
    { mode: 'color-dodge', label: 'Color Dodge', category: 'Lighten' },
    
    // Contrast
    { mode: 'overlay', label: 'Overlay', category: 'Contrast' },
    { mode: 'soft-light', label: 'Soft Light', category: 'Contrast' },
    { mode: 'hard-light', label: 'Hard Light', category: 'Contrast' },
    
    // Comparative
    { mode: 'difference', label: 'Difference', category: 'Comparative' },
    { mode: 'exclusion', label: 'Exclusion', category: 'Comparative' },
    
    // Component
    { mode: 'hue', label: 'Hue', category: 'Component' },
    { mode: 'saturation', label: 'Saturation', category: 'Component' },
    { mode: 'color', label: 'Color', category: 'Component' },
    { mode: 'luminosity', label: 'Luminosity', category: 'Component' }
  ];

  const categories = ['Normal', 'Darken', 'Lighten', 'Contrast', 'Comparative', 'Component'];

  const getBlendModeDescription = (mode: BlendMode): string => {
    const descriptions: Record<BlendMode, string> = {
      'normal': 'Default blend mode with no blending',
      'multiply': 'Multiplies colors, resulting in darker image',
      'screen': 'Inverts, multiplies, and inverts again for lighter result',
      'overlay': 'Combines Multiply and Screen based on base color',
      'darken': 'Selects darker of blend and base colors',
      'lighten': 'Selects lighter of blend and base colors',
      'color-dodge': 'Brightens base color to reflect blend color',
      'color-burn': 'Darkens base color to reflect blend color',
      'hard-light': 'Combines Multiply or Screen based on blend color',
      'soft-light': 'Similar to Overlay but softer',
      'difference': 'Subtracts darker from lighter color',
      'exclusion': 'Similar to Difference but lower contrast',
      'hue': 'Uses hue of blend color with saturation and luminosity of base',
      'saturation': 'Uses saturation of blend color',
      'color': 'Uses hue and saturation of blend color',
      'luminosity': 'Uses luminosity of blend color'
    };
    return descriptions[mode];
  };

  return (
    <div className="blending-modes">
      {/* Current Mode Display */}
      <div className="bm-current-mode">
        <label className="bm-label">Blend Mode</label>
        <div className="bm-current-display">
          <span className="bm-current-name">{blendModes.find(m => m.mode === currentMode)?.label}</span>
          <span className="bm-current-desc">{getBlendModeDescription(currentMode)}</span>
        </div>
      </div>

      {/* Preview (if enabled) */}
      {showPreview && (
        <div className="bm-preview">
          <div className="bm-preview-base" />
          <div 
            className="bm-preview-blend" 
            style={{ mixBlendMode: currentMode }}
          />
        </div>
      )}

      {/* Blend Mode Grid by Category */}
      <div className="bm-categories">
        {categories.map(category => {
          const modesInCategory = blendModes.filter(m => m.category === category);
          return (
            <div key={category} className="bm-category">
              <div className="bm-category-title">{category}</div>
              <div className="bm-modes-grid">
                {modesInCategory.map(({ mode, label }) => (
                  <button
                    key={mode}
                    className={`bm-mode-btn ${currentMode === mode ? 'active' : ''}`}
                    onClick={() => {
                      playSound('button-toggle');
                      onChange(mode);
                    }}
                    title={getBlendModeDescription(mode)}
                  >
                    {showPreview && (
                      <div className="bm-mode-preview">
                        <div className="bm-mode-preview-base" />
                        <div 
                          className="bm-mode-preview-blend" 
                          style={{ mixBlendMode: mode }}
                        />
                      </div>
                    )}
                    <span className="bm-mode-label">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BlendingModes;
