import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface CollaborationInviteNotificationProps {
  inviterName: string;
  storyTitle: string;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
}

const CollaborationInviteNotification: React.FC<CollaborationInviteNotificationProps> = ({
  inviterName,
  storyTitle,
  onAccept,
  onDecline,
  onClose
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl">
              🎨
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">Collaboration Invite!</h3>
              <p className="text-purple-100 text-sm">You've been invited to create together</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {inviterName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-gray-600 text-sm">From</p>
                <p className="text-gray-900 font-semibold">{inviterName}</p>
              </div>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4">
              <p className="text-gray-600 text-sm mb-1">Story Title</p>
              <p className="text-gray-900 font-semibold text-lg">📚 {storyTitle}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 text-xl">💡</span>
              <p className="text-blue-900 text-sm">
                <strong>{inviterName}</strong> wants to collaborate with you! You can create the story together in real-time.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onAccept}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <CheckIcon className="w-5 h-5" />
              Accept & Join
            </button>
            <button
              onClick={onDecline}
              className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <XMarkIcon className="w-5 h-5" />
              Decline
            </button>
          </div>

          {/* Footer note */}
          <p className="text-gray-500 text-xs text-center mt-4">
            You can also find this invite in the Social tab
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default CollaborationInviteNotification;
