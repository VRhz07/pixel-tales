import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  TemplateTheme, 
  PrintOptimization, 
  PDF_TEMPLATES, 
  PRINT_OPTIMIZATIONS,
  parseColor,
  addTemplateDecorations,
  addCropMarks
} from './pdfTemplates';

interface Story {
  id: string;
  title: string;
  author?: string;
  category?: string;
  genres?: string[];
  language?: string;
  pages: Array<{
    text: string;
    canvasData?: string;
    backgroundImage?: string;
  }>;
  coverImage?: string;
  createdAt: Date;
  lastModified?: Date;
}

export interface ExportOptions {
  template?: TemplateTheme;
  printOptimization?: PrintOptimization;
}

/**
 * PDF Export Service
 * Exports stories to PDF with proper formatting and layout
 */
class PDFExportService {
  private readonly PAGE_WIDTH = 210; // A4 width in mm
  private readonly PAGE_HEIGHT = 297; // A4 height in mm
  private margin = 20;
  private contentWidth = this.PAGE_WIDTH - (2 * this.margin);
  
  private template: TemplateTheme = 'classic';
  private printOptimization: PrintOptimization = 'screen';
  
  /**
   * Export a single story to PDF
   */
  async exportStoryToPDF(story: Story, options: ExportOptions = {}): Promise<void> {
    this.template = options.template || 'classic';
    this.printOptimization = options.printOptimization || 'screen';
    
    // Update margins based on print optimization
    const printConfig = PRINT_OPTIMIZATIONS[this.printOptimization];
    this.margin = printConfig.margins.left;
    this.contentWidth = this.PAGE_WIDTH - printConfig.margins.left - printConfig.margins.right;
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Page 1: Full-page cover image (book cover)
      await this.addFullPageCover(pdf, story);
      
      // Page 2: Title page with title, author, and metadata
      pdf.addPage();
      this.addTitlePage(pdf, story);
      
      // Add story pages
      for (let i = 0; i < story.pages.length; i++) {
        pdf.addPage();
        await this.addStoryPage(pdf, story.pages[i], i + 1, story.pages.length);
      }

      // Save the PDF
      const fileName = `${this.sanitizeFileName(story.title)}.pdf`;
      pdf.save(fileName);
      
      console.log('✅ PDF exported successfully:', fileName);
    } catch (error) {
      console.error('❌ Error exporting PDF:', error);
      throw error;
    }
  }

  /**
   * Export multiple stories to a single PDF
   */
  async exportMultipleStoriesToPDF(stories: Story[], fileName: string = 'stories-collection.pdf', options: ExportOptions = {}): Promise<void> {
    this.template = options.template || 'classic';
    this.printOptimization = options.printOptimization || 'screen';
    
    // Update margins based on print optimization
    const printConfig = PRINT_OPTIMIZATIONS[this.printOptimization];
    this.margin = printConfig.margins.left;
    this.contentWidth = this.PAGE_WIDTH - printConfig.margins.left - printConfig.margins.right;
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let isFirstPage = true;

      // Add table of contents
      this.addTableOfContents(pdf, stories);
      isFirstPage = false;

      // Add each story
      for (let storyIndex = 0; storyIndex < stories.length; storyIndex++) {
        const story = stories[storyIndex];
        
        // Add story separator page
        if (!isFirstPage) {
          pdf.addPage();
        }
        this.addStorySeparator(pdf, story, storyIndex + 1, stories.length);

        // Add cover page
        pdf.addPage();
        await this.addCoverPage(pdf, story);
        
        // Add story pages
        for (let i = 0; i < story.pages.length; i++) {
          pdf.addPage();
          await this.addStoryPage(pdf, story.pages[i], i + 1, story.pages.length);
        }

        // Add metadata
        pdf.addPage();
        this.addMetadataPage(pdf, story);
      }

      // Save the PDF
      pdf.save(this.sanitizeFileName(fileName));
      
      console.log('✅ Multiple stories exported successfully:', fileName);
    } catch (error) {
      console.error('❌ Error exporting multiple stories:', error);
      throw error;
    }
  }

  /**
   * Add full-page cover image (Page 1 - Book Cover)
   */
  private async addFullPageCover(pdf: jsPDF, story: Story): Promise<void> {
    const printConfig = PRINT_OPTIMIZATIONS[this.printOptimization];
    
    // Add crop marks for professional printing
    if (printConfig.cropMarks) {
      addCropMarks(pdf, this.PAGE_WIDTH, this.PAGE_HEIGHT);
    }

    // Add cover image (reduced size to show full image without cropping)
    if (story.coverImage) {
      try {
        const imgData = await this.loadImage(story.coverImage);
        
        // Get actual image dimensions to maintain aspect ratio
        const imgDimensions = await this.getImageDimensions(imgData);
        const actualAspectRatio = imgDimensions.width / imgDimensions.height;
        
        // Use 85% of page dimensions to ensure nothing is cropped
        const maxCoverWidth = this.PAGE_WIDTH * 0.85; // 178.5mm
        const maxCoverHeight = this.PAGE_HEIGHT * 0.85; // 252.45mm
        
        let imgWidth = maxCoverWidth;
        let imgHeight = imgWidth / actualAspectRatio;
        
        // If height exceeds max, scale down based on height
        if (imgHeight > maxCoverHeight) {
          imgHeight = maxCoverHeight;
          imgWidth = imgHeight * actualAspectRatio;
        }
        
        // Center the image on the page
        const imgX = (this.PAGE_WIDTH - imgWidth) / 2;
        const imgY = (this.PAGE_HEIGHT - imgHeight) / 2;
        
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight);
      } catch (error) {
        console.warn('Could not load cover image:', error);
        // If no cover image, show title and author centered
        this.addTextOnlyCover(pdf, story);
      }
    } else {
      // No cover image - show text-only cover
      this.addTextOnlyCover(pdf, story);
    }
  }

  /**
   * Add text-only cover when no image is available
   */
  private addTextOnlyCover(pdf: jsPDF, story: Story): void {
    const templateConfig = PDF_TEMPLATES[this.template];
    const centerX = this.PAGE_WIDTH / 2;
    const centerY = this.PAGE_HEIGHT / 2;
    
    // Add template decorations
    addTemplateDecorations(pdf, this.template, this.PAGE_WIDTH, this.PAGE_HEIGHT, 'cover');
    
    // Add title
    const [tr, tg, tb] = parseColor(templateConfig.colors.primary);
    pdf.setTextColor(tr, tg, tb);
    pdf.setFontSize(templateConfig.fonts.title.size + 8); // Larger for cover-only page
    pdf.setFont(templateConfig.fonts.title.family, templateConfig.fonts.title.style);
    const titleLines = pdf.splitTextToSize(story.title, this.contentWidth);
    const titleStartY = centerY - (titleLines.length * 15) / 2;
    titleLines.forEach((line: string, index: number) => {
      pdf.text(line, centerX, titleStartY + (index * 15), { align: 'center' });
    });
    
    // Add author
    if (story.author) {
      const [ar, ag, ab] = parseColor(templateConfig.colors.secondary);
      pdf.setTextColor(ar, ag, ab);
      pdf.setFontSize(templateConfig.fonts.author.size + 4);
      pdf.setFont(templateConfig.fonts.author.family, templateConfig.fonts.author.style);
      pdf.text(`by ${story.author}`, centerX, titleStartY + (titleLines.length * 15) + 20, { align: 'center' });
    }
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
  }

  /**
   * Add title page (Page 2 - Title, Author, and Metadata)
   */
  private addTitlePage(pdf: jsPDF, story: Story): void {
    const templateConfig = PDF_TEMPLATES[this.template];
    const centerX = this.PAGE_WIDTH / 2;
    let currentY = 80;
    
    // Add template decorations
    addTemplateDecorations(pdf, this.template, this.PAGE_WIDTH, this.PAGE_HEIGHT, 'cover');
    
    // Add title
    const [tr, tg, tb] = parseColor(templateConfig.colors.primary);
    pdf.setTextColor(tr, tg, tb);
    pdf.setFontSize(templateConfig.fonts.title.size + 4); // Large title
    pdf.setFont(templateConfig.fonts.title.family, templateConfig.fonts.title.style);
    const titleLines = pdf.splitTextToSize(story.title, this.contentWidth - 20);
    titleLines.forEach((line: string, index: number) => {
      pdf.text(line, centerX, currentY + (index * 14), { align: 'center' });
    });
    currentY += (titleLines.length * 14) + 25;
    
    // Add author
    if (story.author) {
      const [ar, ag, ab] = parseColor(templateConfig.colors.secondary);
      pdf.setTextColor(ar, ag, ab);
      pdf.setFontSize(templateConfig.fonts.author.size + 2);
      pdf.setFont(templateConfig.fonts.author.family, templateConfig.fonts.author.style);
      pdf.text(`by ${story.author}`, centerX, currentY, { align: 'center' });
      currentY += 30;
    }
    
    // Add decorative line
    if (templateConfig.decoration.useBorders) {
      const [dr, dg, db] = parseColor(templateConfig.colors.accent);
      pdf.setDrawColor(dr, dg, db);
      pdf.setLineWidth(0.5);
      const lineWidth = 60;
      pdf.line(centerX - lineWidth/2, currentY, centerX + lineWidth/2, currentY);
      currentY += 25;
    }
    
    // Add metadata
    const [mr, mg, mb] = parseColor(templateConfig.colors.text);
    pdf.setTextColor(mr, mg, mb);
    pdf.setFontSize(templateConfig.fonts.metadata.size + 2);
    pdf.setFont(templateConfig.fonts.metadata.family, templateConfig.fonts.metadata.style);
    
    if (story.category) {
      pdf.text(`Category: ${story.category}`, centerX, currentY, { align: 'center' });
      currentY += 10;
    }
    
    if (story.genres && story.genres.length > 0) {
      pdf.text(`Genres: ${story.genres.join(', ')}`, centerX, currentY, { align: 'center' });
      currentY += 10;
    }
    
    if (story.language) {
      pdf.text(`Language: ${story.language}`, centerX, currentY, { align: 'center' });
    }
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
  }

  /**
   * Add cover page with title, author, and cover image (Legacy - kept for multi-story exports)
   */
  private async addCoverPage(pdf: jsPDF, story: Story): Promise<void> {
    const templateConfig = PDF_TEMPLATES[this.template];
    const printConfig = PRINT_OPTIMIZATIONS[this.printOptimization];
    const centerX = this.PAGE_WIDTH / 2;
    let currentY = 60;

    // Add template decorations
    addTemplateDecorations(pdf, this.template, this.PAGE_WIDTH, this.PAGE_HEIGHT, 'cover');
    
    // Add crop marks for professional printing
    if (printConfig.cropMarks) {
      addCropMarks(pdf, this.PAGE_WIDTH, this.PAGE_HEIGHT);
    }

    // Add cover image if available
    if (story.coverImage) {
      try {
        const imgData = await this.loadImage(story.coverImage);
        
        // Get actual image dimensions to maintain aspect ratio
        const imgDimensions = await this.getImageDimensions(imgData);
        const actualAspectRatio = imgDimensions.width / imgDimensions.height;
        
        // Set max dimensions for cover image
        const maxCoverWidth = 140;
        const maxCoverHeight = 140;
        
        let imgWidth = maxCoverWidth;
        let imgHeight = imgWidth / actualAspectRatio;
        
        // If height exceeds max, scale down based on height
        if (imgHeight > maxCoverHeight) {
          imgHeight = maxCoverHeight;
          imgWidth = imgHeight * actualAspectRatio;
        }
        
        const imgX = (this.PAGE_WIDTH - imgWidth) / 2;
        
        pdf.addImage(imgData, 'PNG', imgX, 30, imgWidth, imgHeight);
        currentY = 30 + imgHeight + 20; // Position title below image with spacing
      } catch (error) {
        console.warn('Could not load cover image:', error);
      }
    }

    // Add title with template styling
    const [tr, tg, tb] = parseColor(templateConfig.colors.primary);
    pdf.setTextColor(tr, tg, tb);
    pdf.setFontSize(templateConfig.fonts.title.size);
    pdf.setFont(templateConfig.fonts.title.family, templateConfig.fonts.title.style);
    const titleLines = pdf.splitTextToSize(story.title, this.contentWidth - 40);
    titleLines.forEach((line: string, index: number) => {
      pdf.text(line, centerX, currentY + (index * 12), { align: 'center' });
    });
    currentY += (titleLines.length * 12) + templateConfig.spacing.titleMargin;

    // Add author with template styling
    if (story.author) {
      const [ar, ag, ab] = parseColor(templateConfig.colors.secondary);
      pdf.setTextColor(ar, ag, ab);
      pdf.setFontSize(templateConfig.fonts.author.size);
      pdf.setFont(templateConfig.fonts.author.family, templateConfig.fonts.author.style);
      pdf.text(`by ${story.author}`, centerX, currentY, { align: 'center' });
      currentY += 15;
    }

    // Add category and genres
    const [mr, mg, mb] = parseColor(templateConfig.colors.text);
    pdf.setTextColor(mr, mg, mb);
    if (story.category) {
      pdf.setFontSize(templateConfig.fonts.metadata.size);
      pdf.setFont(templateConfig.fonts.metadata.family, templateConfig.fonts.metadata.style);
      pdf.text(`Category: ${story.category}`, centerX, currentY, { align: 'center' });
      currentY += 8;
    }

    if (story.genres && story.genres.length > 0) {
      pdf.setFontSize(templateConfig.fonts.metadata.size);
      pdf.setFont(templateConfig.fonts.metadata.family, templateConfig.fonts.metadata.style);
      pdf.text(`Genres: ${story.genres.join(', ')}`, centerX, currentY, { align: 'center' });
    }

    // Add decorative line at bottom
    if (templateConfig.decoration.useBorders) {
      const [dr, dg, db] = parseColor(templateConfig.colors.accent);
      const lineY = this.PAGE_HEIGHT - 30;
      pdf.setDrawColor(dr, dg, db);
      pdf.setLineWidth(0.5);
      pdf.line(this.margin, lineY, this.PAGE_WIDTH - this.margin, lineY);
    }
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
  }

  /**
   * Add a story page with text and canvas image
   */
  private async addStoryPage(pdf: jsPDF, page: any, pageNumber: number, totalPages: number): Promise<void> {
    const templateConfig = PDF_TEMPLATES[this.template];
    const printConfig = PRINT_OPTIMIZATIONS[this.printOptimization];
    
    // Add decorations for content pages
    addTemplateDecorations(pdf, this.template, this.PAGE_WIDTH, this.PAGE_HEIGHT, 'content');
    
    // Add crop marks for professional printing
    if (printConfig.cropMarks) {
      addCropMarks(pdf, this.PAGE_WIDTH, this.PAGE_HEIGHT);
    }
    
    // Add canvas image if available
    let imageHeight = 0;
    if (page.canvasData) {
      try {
        const imgData = await this.loadImage(page.canvasData);
        
        // Get actual image dimensions to maintain aspect ratio
        const imgDimensions = await this.getImageDimensions(imgData);
        const actualAspectRatio = imgDimensions.width / imgDimensions.height;
        
        // Calculate optimal size maintaining aspect ratio
        const maxImageWidth = this.contentWidth;
        const maxImageHeight = (this.PAGE_HEIGHT - printConfig.margins.top - printConfig.margins.bottom) * 0.65; // Use 65% of available height (increased from 50%)
        
        let imgWidth = maxImageWidth;
        let imgHeight = imgWidth / actualAspectRatio;
        
        // If height exceeds max, scale down based on height
        if (imgHeight > maxImageHeight) {
          imgHeight = maxImageHeight;
          imgWidth = imgHeight * actualAspectRatio;
        }
        
        // Center horizontally if width is less than content width
        const imgX = this.margin + (maxImageWidth - imgWidth) / 2;
        
        pdf.addImage(imgData, 'PNG', imgX, printConfig.margins.top, imgWidth, imgHeight);
        imageHeight = imgHeight;
      } catch (error) {
        console.warn('Could not load canvas image:', error);
      }
    }

    // Add text content with template styling
    if (page.text) {
      const textY = page.canvasData ? printConfig.margins.top + imageHeight + 20 : printConfig.margins.top + 20; // Increased gap from 10mm to 20mm
      const maxTextHeight = this.PAGE_HEIGHT - textY - printConfig.margins.bottom - 15; // Leave space for page number
      
      const [tr, tg, tb] = parseColor(templateConfig.colors.text);
      pdf.setTextColor(tr, tg, tb);
      
      // Use 30pt font for maximum readability
      const fontSize = 30;
      pdf.setFontSize(fontSize);
      pdf.setFont(templateConfig.fonts.body.family, templateConfig.fonts.body.style);
      
      const lines = pdf.splitTextToSize(page.text, this.contentWidth);
      
      // Line height for 30pt font - using 1.4x for comfortable reading
      const lineHeight = fontSize * 0.5; // ~15mm for 30pt font
      
      // Check if text fits on page
      const totalTextHeight = lines.length * lineHeight;
      if (totalTextHeight > maxTextHeight) {
        // Text is too long, truncate with ellipsis
        const maxLines = Math.floor(maxTextHeight / lineHeight);
        const truncatedLines = lines.slice(0, maxLines);
        if (truncatedLines.length < lines.length) {
          truncatedLines[truncatedLines.length - 1] += '...';
        }
        
        truncatedLines.forEach((line: string, index: number) => {
          pdf.text(line, this.margin, textY + (index * lineHeight));
        });
      } else {
        lines.forEach((line: string, index: number) => {
          pdf.text(line, this.margin, textY + (index * lineHeight));
        });
      }
    }

    // Add page number at bottom with template styling
    const [mr, mg, mb] = parseColor(templateConfig.colors.secondary);
    pdf.setTextColor(mr, mg, mb);
    pdf.setFontSize(templateConfig.fonts.metadata.size);
    pdf.setFont(templateConfig.fonts.metadata.family, templateConfig.fonts.metadata.style);
    pdf.text(
      `Page ${pageNumber} of ${totalPages}`,
      this.PAGE_WIDTH / 2,
      this.PAGE_HEIGHT - 10,
      { align: 'center' }
    );
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
  }

  /**
   * Add metadata page with story information
   */
  private addMetadataPage(pdf: jsPDF, story: Story): void {
    let currentY = this.margin + 10;

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Story Information', this.margin, currentY);
    currentY += 15;

    // Draw separator line
    pdf.setLineWidth(0.3);
    pdf.line(this.margin, currentY, this.PAGE_WIDTH - this.margin, currentY);
    currentY += 10;

    // Metadata
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');

    const metadata = [
      { label: 'Title', value: story.title },
      { label: 'Author', value: story.author || 'Unknown' },
      { label: 'Category', value: story.category || 'N/A' },
      { label: 'Genres', value: story.genres?.join(', ') || 'N/A' },
      { label: 'Language', value: story.language || 'N/A' },
      { label: 'Pages', value: story.pages.length.toString() },
      { label: 'Created', value: story.createdAt ? new Date(story.createdAt).toLocaleDateString() : 'N/A' },
      { label: 'Last Modified', value: story.lastModified ? new Date(story.lastModified).toLocaleDateString() : 'N/A' },
    ];

    metadata.forEach(item => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${item.label}:`, this.margin, currentY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(item.value, this.margin + 40, currentY);
      currentY += 8;
    });

    // Add watermark
    currentY = this.PAGE_HEIGHT - 30;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      'Generated by Pixel Tales - Story Creator',
      this.PAGE_WIDTH / 2,
      currentY,
      { align: 'center' }
    );
    pdf.setTextColor(0, 0, 0); // Reset color
  }

  /**
   * Add table of contents for multiple stories
   */
  private addTableOfContents(pdf: jsPDF, stories: Story[]): void {
    let currentY = this.margin + 10;

    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Table of Contents', this.margin, currentY);
    currentY += 15;

    pdf.setLineWidth(0.3);
    pdf.line(this.margin, currentY, this.PAGE_WIDTH - this.margin, currentY);
    currentY += 10;

    pdf.setFontSize(12);
    stories.forEach((story, index) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}.`, this.margin, currentY);
      
      pdf.setFont('helvetica', 'normal');
      const title = story.title.length > 50 ? story.title.substring(0, 47) + '...' : story.title;
      pdf.text(title, this.margin + 10, currentY);
      
      pdf.setFont('helvetica', 'italic');
      if (story.author) {
        pdf.text(`by ${story.author}`, this.margin + 15, currentY + 5);
      }
      
      currentY += 12;

      // Add new page if running out of space
      if (currentY > this.PAGE_HEIGHT - this.margin - 20) {
        pdf.addPage();
        currentY = this.margin + 10;
      }
    });
  }

  /**
   * Add story separator page
   */
  private addStorySeparator(pdf: jsPDF, story: Story, storyNumber: number, totalStories: number): void {
    const centerX = this.PAGE_WIDTH / 2;
    const centerY = this.PAGE_HEIGHT / 2;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Story ${storyNumber} of ${totalStories}`, centerX, centerY - 10, { align: 'center' });

    pdf.setFontSize(20);
    const titleLines = pdf.splitTextToSize(story.title, this.contentWidth - 40);
    titleLines.forEach((line: string, index: number) => {
      pdf.text(line, centerX, centerY + 5 + (index * 10), { align: 'center' });
    });
  }

  /**
   * Load and process image
   */
  private async loadImage(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!dataUrl || dataUrl === '') {
        reject(new Error('Empty image data'));
        return;
      }

      // If it's already a data URL, return it
      if (dataUrl.startsWith('data:')) {
        resolve(dataUrl);
        return;
      }

      // If it's a URL, load it
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            reject(new Error('Could not get canvas context'));
          }
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = dataUrl;
    });
  }

  /**
   * Get image dimensions from data URL
   */
  private async getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for dimensions'));
      };

      img.src = dataUrl;
    });
  }

  /**
   * Sanitize file name
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  }
}

export const pdfExportService = new PDFExportService();
export default pdfExportService;
