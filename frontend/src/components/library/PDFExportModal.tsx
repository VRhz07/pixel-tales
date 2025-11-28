import React, { useState } from 'react';
import { XMarkIcon, DocumentArrowDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import pdfExportService, { ExportOptions } from '../../services/pdfExportService';
import { TemplateTheme, PrintOptimization, PDF_TEMPLATES, PRINT_OPTIMIZATIONS } from '../../services/pdfTemplates';

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

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: Story[];
  exportType: 'works' | 'offline' | 'saved' | 'drafts';
}

const PDFExportModal: React.FC<PDFExportModalProps> = ({ 
  isOpen, 
  onClose, 
  stories,
  exportType 
}) => {
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMode, setExportMode] = useState<'individual' | 'combined'>('individual');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateTheme>('classic');
  const [selectedPrintOpt, setSelectedPrintOpt] = useState<PrintOptimization>('screen');

  if (!isOpen) return null;

  const handleToggleStory = (storyId: string) => {
    const newSelected = new Set(selectedStories);
    if (newSelected.has(storyId)) {
      newSelected.delete(storyId);
    } else {
      newSelected.add(storyId);
    }
    setSelectedStories(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStories.size === stories.length) {
      setSelectedStories(new Set());
    } else {
      setSelectedStories(new Set(stories.map(s => s.id)));
    }
  };

  const handleExport = async () => {
    if (selectedStories.size === 0) {
      alert('Please select at least one story to export');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const storiesToExport = stories.filter(s => selectedStories.has(s.id));
      
      // Prepare export options
      const options: ExportOptions = {
        template: selectedTemplate,
        printOptimization: selectedPrintOpt,
      };

      if (exportMode === 'individual') {
        // Export each story as a separate PDF
        for (let i = 0; i < storiesToExport.length; i++) {
          await pdfExportService.exportStoryToPDF(storiesToExport[i], options);
          setExportProgress(((i + 1) / storiesToExport.length) * 100);
        }
      } else {
        // Export all stories in a single PDF
        const fileName = exportType === 'works' 
          ? 'my-stories-collection.pdf' 
          : exportType === 'offline'
          ? 'offline-stories-collection.pdf'
          : exportType === 'saved'
          ? 'saved-stories-collection.pdf'
          : 'draft-stories-collection.pdf';
        await pdfExportService.exportMultipleStoriesToPDF(storiesToExport, fileName, options);
        setExportProgress(100);
      }

      // Success feedback
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setSelectedStories(new Set());
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF. Please try again.');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <DocumentArrowDownIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Export to PDF
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {exportType === 'works' ? 'Export your saved works' :
                 exportType === 'offline' ? 'Export offline saved stories' :
                 exportType === 'saved' ? 'Export saved stories from public library' :
                 'Export your draft stories'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isExporting}
          >
            <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Export Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Export Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportMode('individual')}
                disabled={isExporting}
                className={`p-4 rounded-lg border-2 transition-all ${
                  exportMode === 'individual'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  Individual PDFs
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  One PDF per story
                </div>
              </button>
              <button
                onClick={() => setExportMode('combined')}
                disabled={isExporting}
                className={`p-4 rounded-lg border-2 transition-all ${
                  exportMode === 'combined'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  Combined PDF
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  All stories in one file
                </div>
              </button>
            </div>
          </div>

          {/* Template Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              PDF Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as TemplateTheme)}
              disabled={isExporting}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none transition-all"
            >
              {Object.entries(PDF_TEMPLATES).map(([key, template]) => (
                <option key={key} value={key}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
          </div>

          {/* Print Optimization Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Print Optimization
            </label>
            <select
              value={selectedPrintOpt}
              onChange={(e) => setSelectedPrintOpt(e.target.value as PrintOptimization)}
              disabled={isExporting}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none transition-all"
            >
              {Object.entries(PRINT_OPTIMIZATIONS).map(([key, opt]) => (
                <option key={key} value={key}>
                  {opt.name} - {opt.description}
                </option>
              ))}
            </select>
          </div>

          {/* Story Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Stories ({selectedStories.size} of {stories.length})
              </label>
              <button
                onClick={handleSelectAll}
                disabled={isExporting}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                {selectedStories.size === stories.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {stories.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No stories available to export
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stories.map((story) => (
                  <label
                    key={story.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedStories.has(story.id)
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStories.has(story.id)}
                      onChange={() => handleToggleStory(story.id)}
                      disabled={isExporting}
                      className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {story.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {story.author && `by ${story.author} • `}
                        {story.pages.length} page{story.pages.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {selectedStories.has(story.id) && (
                      <CheckIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Exporting...
                </span>
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {Math.round(exportProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 transition-all duration-300 ease-out"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <div className="font-semibold mb-1">PDF Export Features:</div>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>5 professional templates (Classic, Modern, Minimalist, Elegant, Children)</li>
                  <li>3 print optimizations (Screen, Home Print, Professional Print)</li>
                  <li>Canvas illustrations embedded in the PDF</li>
                  <li>Table of contents for combined exports</li>
                  <li>Professional print-ready with crop marks (for professional mode)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedStories.size === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="w-5 h-5" />
                Export PDF{selectedStories.size > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFExportModal;
