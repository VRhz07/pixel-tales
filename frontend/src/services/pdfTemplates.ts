import jsPDF from 'jspdf';

/**
 * PDF Templates Service
 * Provides different layout templates and themes for PDF exports
 */

export type TemplateTheme = 'classic' | 'modern' | 'minimalist' | 'elegant' | 'children';
export type PrintOptimization = 'screen' | 'print' | 'professional';

interface TemplateConfig {
  name: string;
  description: string;
  fonts: {
    title: { family: string; size: number; style: string };
    author: { family: string; size: number; style: string };
    body: { family: string; size: number; style: string };
    metadata: { family: string; size: number; style: string };
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    accent: string;
  };
  spacing: {
    titleMargin: number;
    paragraphSpacing: number;
    sectionSpacing: number;
  };
  decoration: {
    useBorders: boolean;
    useDecorations: boolean;
    useBackgroundPatterns: boolean;
  };
}

export const PDF_TEMPLATES: Record<TemplateTheme, TemplateConfig> = {
  classic: {
    name: 'Classic',
    description: 'Traditional book layout with serif fonts',
    fonts: {
      title: { family: 'times', size: 28, style: 'bold' },
      author: { family: 'times', size: 16, style: 'italic' },
      body: { family: 'times', size: 12, style: 'normal' },
      metadata: { family: 'times', size: 10, style: 'normal' },
    },
    colors: {
      primary: '#2C3E50',
      secondary: '#7F8C8D',
      text: '#000000',
      accent: '#8B4513',
    },
    spacing: {
      titleMargin: 20,
      paragraphSpacing: 7,
      sectionSpacing: 15,
    },
    decoration: {
      useBorders: true,
      useDecorations: true,
      useBackgroundPatterns: false,
    },
  },
  modern: {
    name: 'Modern',
    description: 'Clean, contemporary design with sans-serif fonts',
    fonts: {
      title: { family: 'helvetica', size: 32, style: 'bold' },
      author: { family: 'helvetica', size: 18, style: 'normal' },
      body: { family: 'helvetica', size: 11, style: 'normal' },
      metadata: { family: 'helvetica', size: 9, style: 'normal' },
    },
    colors: {
      primary: '#6366F1',
      secondary: '#A5B4FC',
      text: '#1F2937',
      accent: '#EC4899',
    },
    spacing: {
      titleMargin: 25,
      paragraphSpacing: 6,
      sectionSpacing: 20,
    },
    decoration: {
      useBorders: false,
      useDecorations: true,
      useBackgroundPatterns: false,
    },
  },
  minimalist: {
    name: 'Minimalist',
    description: 'Simple, clean design with maximum readability',
    fonts: {
      title: { family: 'helvetica', size: 24, style: 'bold' },
      author: { family: 'helvetica', size: 14, style: 'normal' },
      body: { family: 'helvetica', size: 12, style: 'normal' },
      metadata: { family: 'helvetica', size: 10, style: 'normal' },
    },
    colors: {
      primary: '#000000',
      secondary: '#666666',
      text: '#333333',
      accent: '#000000',
    },
    spacing: {
      titleMargin: 15,
      paragraphSpacing: 7,
      sectionSpacing: 12,
    },
    decoration: {
      useBorders: false,
      useDecorations: false,
      useBackgroundPatterns: false,
    },
  },
  elegant: {
    name: 'Elegant',
    description: 'Sophisticated design with refined typography',
    fonts: {
      title: { family: 'times', size: 30, style: 'bold' },
      author: { family: 'times', size: 16, style: 'italic' },
      body: { family: 'times', size: 11, style: 'normal' },
      metadata: { family: 'times', size: 9, style: 'italic' },
    },
    colors: {
      primary: '#1A1A1A',
      secondary: '#8B7355',
      text: '#2C2C2C',
      accent: '#B8860B',
    },
    spacing: {
      titleMargin: 22,
      paragraphSpacing: 8,
      sectionSpacing: 18,
    },
    decoration: {
      useBorders: true,
      useDecorations: true,
      useBackgroundPatterns: false,
    },
  },
  children: {
    name: 'Children',
    description: 'Fun, colorful design perfect for kids stories',
    fonts: {
      title: { family: 'helvetica', size: 32, style: 'bold' },
      author: { family: 'helvetica', size: 18, style: 'bold' },
      body: { family: 'helvetica', size: 13, style: 'normal' },
      metadata: { family: 'helvetica', size: 10, style: 'normal' },
    },
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      text: '#2C3E50',
      accent: '#FFD93D',
    },
    spacing: {
      titleMargin: 20,
      paragraphSpacing: 9,
      sectionSpacing: 15,
    },
    decoration: {
      useBorders: true,
      useDecorations: true,
      useBackgroundPatterns: true,
    },
  },
};

export const PRINT_OPTIMIZATIONS: Record<PrintOptimization, {
  name: string;
  description: string;
  margins: { top: number; right: number; bottom: number; left: number };
  bleed: boolean;
  colorMode: 'rgb' | 'cmyk';
  imageQuality: number;
  cropMarks: boolean;
}> = {
  screen: {
    name: 'Screen Viewing',
    description: 'Optimized for reading on screens',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    bleed: false,
    colorMode: 'rgb',
    imageQuality: 0.85,
    cropMarks: false,
  },
  print: {
    name: 'Home Printing',
    description: 'Optimized for standard home/office printers',
    margins: { top: 25, right: 20, bottom: 25, left: 20 },
    bleed: false,
    colorMode: 'rgb',
    imageQuality: 0.92,
    cropMarks: false,
  },
  professional: {
    name: 'Professional Print',
    description: 'Print-ready with bleed and crop marks',
    margins: { top: 30, right: 25, bottom: 30, left: 30 },
    bleed: true,
    colorMode: 'cmyk',
    imageQuality: 1.0,
    cropMarks: true,
  },
};

/**
 * Apply template styling to PDF
 */
export function applyTemplate(pdf: jsPDF, template: TemplateTheme): void {
  const config = PDF_TEMPLATES[template];
  
  // Store template config in PDF metadata
  (pdf as any).templateConfig = config;
}

/**
 * Apply print optimization settings
 */
export function applyPrintOptimization(pdf: jsPDF, optimization: PrintOptimization): void {
  const config = PRINT_OPTIMIZATIONS[optimization];
  
  // Store optimization config in PDF metadata
  (pdf as any).printConfig = config;
}

/**
 * Get color as RGB array
 */
export function parseColor(color: string): [number, number, number] {
  // Remove # if present
  const hex = color.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return [r, g, b];
}

/**
 * Add decorative elements based on template
 */
export function addTemplateDecorations(
  pdf: jsPDF,
  template: TemplateTheme,
  pageWidth: number,
  pageHeight: number,
  pageType: 'cover' | 'content' | 'metadata'
): void {
  const config = PDF_TEMPLATES[template];
  
  if (!config.decoration.useDecorations) return;
  
  const [r, g, b] = parseColor(config.colors.accent);
  pdf.setDrawColor(r, g, b);
  pdf.setLineWidth(0.5);
  
  switch (template) {
    case 'classic':
      // Classic corner decorations
      if (pageType === 'cover') {
        // Top corners
        pdf.line(10, 10, 30, 10);
        pdf.line(10, 10, 10, 30);
        pdf.line(pageWidth - 30, 10, pageWidth - 10, 10);
        pdf.line(pageWidth - 10, 10, pageWidth - 10, 30);
        
        // Bottom corners
        pdf.line(10, pageHeight - 30, 10, pageHeight - 10);
        pdf.line(10, pageHeight - 10, 30, pageHeight - 10);
        pdf.line(pageWidth - 10, pageHeight - 30, pageWidth - 10, pageHeight - 10);
        pdf.line(pageWidth - 30, pageHeight - 10, pageWidth - 10, pageHeight - 10);
      }
      break;
      
    case 'modern':
      // Modern gradient-style lines
      if (pageType === 'cover') {
        for (let i = 0; i < 5; i++) {
          const opacity = 1 - (i * 0.15);
          pdf.setLineWidth(2 - (i * 0.3));
          pdf.line(20 + (i * 2), pageHeight - 40, pageWidth - 20 - (i * 2), pageHeight - 40);
        }
      }
      break;
      
    case 'elegant':
      // Elegant border frame
      if (pageType === 'cover') {
        pdf.setLineWidth(0.3);
        pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);
        pdf.setLineWidth(0.5);
        pdf.rect(17, 17, pageWidth - 34, pageHeight - 34);
      }
      break;
      
    case 'children':
      // Fun stars and shapes
      if (pageType === 'cover') {
        // Add colorful circles
        const colors = [
          config.colors.primary,
          config.colors.secondary,
          config.colors.accent,
        ];
        
        for (let i = 0; i < 8; i++) {
          const [cr, cg, cb] = parseColor(colors[i % colors.length]);
          pdf.setFillColor(cr, cg, cb);
          const x = 15 + Math.random() * (pageWidth - 30);
          const y = 15 + Math.random() * 40;
          pdf.circle(x, y, 2, 'F');
        }
      }
      break;
  }
}

/**
 * Add crop marks for professional printing
 */
export function addCropMarks(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.1);
  
  const markLength = 5;
  const markOffset = 5;
  
  // Top left
  pdf.line(0, markOffset, markLength, markOffset);
  pdf.line(markOffset, 0, markOffset, markLength);
  
  // Top right
  pdf.line(pageWidth - markLength, markOffset, pageWidth, markOffset);
  pdf.line(pageWidth - markOffset, 0, pageWidth - markOffset, markLength);
  
  // Bottom left
  pdf.line(0, pageHeight - markOffset, markLength, pageHeight - markOffset);
  pdf.line(markOffset, pageHeight - markLength, markOffset, pageHeight);
  
  // Bottom right
  pdf.line(pageWidth - markLength, pageHeight - markOffset, pageWidth, pageHeight - markOffset);
  pdf.line(pageWidth - markOffset, pageHeight - markLength, pageWidth - markOffset, pageHeight);
}

export default {
  PDF_TEMPLATES,
  PRINT_OPTIMIZATIONS,
  applyTemplate,
  applyPrintOptimization,
  parseColor,
  addTemplateDecorations,
  addCropMarks,
};
