/**
 * Real-time Canvas Activity Indicator
 * Shows live drawing activity and preview for collaboration mode
 */
import React, { useRef, useEffect } from 'react';
import { RealtimePreviewCanvas, RealtimePreviewCanvasRef } from '../canvas/RealtimePreviewCanvas';
import { PencilIcon, UserIcon, EyeIcon } from '@heroicons/react/24/outline';

interface Props {
  pageId: string;
  hasCanvasData?: boolean;
  isCurrentPage?: boolean;
  isCoverImage?: boolean;
  activity?: {
    timestamp: number;
    user: string;
  };
  onPreviewClick?: () => void;
  onRegisterPreviewRef?: (pageId: string, ref: RealtimePreviewCanvasRef) => void;
  className?: string;
}

export const RealtimeCanvasIndicator: React.FC<Props> = ({
  pageId,
  hasCanvasData = false,
  isCurrentPage = false,
  isCoverImage = false,
  activity,
  onPreviewClick,
  onRegisterPreviewRef,
  className = ''
}) => {
  const previewRef = useRef<RealtimePreviewCanvasRef>(null);

  // Register the preview ref when component mounts
  useEffect(() => {
    if (previewRef.current && onRegisterPreviewRef) {
      onRegisterPreviewRef(pageId, previewRef.current);
    }
  }, [pageId, onRegisterPreviewRef]);

  // Show activity indicator if there's recent activity
  const showActivity = activity && (Date.now() - activity.timestamp < 30000); // 30 seconds
  const isRecentActivity = activity && (Date.now() - activity.timestamp < 5000); // 5 seconds

  return (
    <div className={`relative ${className}`}>
      {/* Canvas Preview */}
      <div className="relative group">
        {/* Preview Canvas */}
        <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white">
          <RealtimePreviewCanvas
            ref={previewRef}
            width={120}
            height={120}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            style={{ display: 'block' }}
          />
          
          {/* Overlay for empty canvas */}
          {!hasCanvasData && !showActivity && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90">
              <div className="text-center">
                <PencilIcon className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">
                  {isCoverImage ? 'Cover' : 'Canvas'}
                </span>
              </div>
            </div>
          )}
          
          {/* Click overlay */}
          {onPreviewClick && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-10 transition-all cursor-pointer group"
              onClick={onPreviewClick}
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                <EyeIcon className="w-3 h-3" />
                Edit
              </div>
            </div>
          )}
        </div>
        
        {/* Current Page Indicator */}
        {isCurrentPage && (
          <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            Current
          </div>
        )}
        
        {/* Canvas Data Indicator */}
        {hasCanvasData && !showActivity && (
          <div className="absolute -bottom-1 -left-1 bg-green-500 text-white p-1 rounded-full">
            <PencilIcon className="w-3 h-3" />
          </div>
        )}
        
        {/* Live Activity Indicator */}
        {showActivity && (
          <div className={`absolute -top-1 -left-1 px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
            isRecentActivity 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-orange-500 text-white'
          }`}>
            <UserIcon className="w-3 h-3" />
            {activity.user}
          </div>
        )}
        
        {/* Pulse Animation for Recent Activity */}
        {isRecentActivity && (
          <div className="absolute inset-0 border-2 border-red-400 rounded-lg animate-ping opacity-75"></div>
        )}
      </div>
      
      {/* Activity Details */}
      {showActivity && (
        <div className="mt-1 text-xs text-gray-600 text-center">
          <span className="font-medium">{activity.user}</span>
          <span className="text-gray-500 ml-1">
            {isRecentActivity ? 'drawing now...' : 
             `${Math.round((Date.now() - activity.timestamp) / 1000)}s ago`}
          </span>
        </div>
      )}
    </div>
  );
};