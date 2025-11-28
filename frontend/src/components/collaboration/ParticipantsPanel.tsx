import React from 'react';
import { XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { 
  PencilIcon, 
  PaintBrushIcon, 
  Square3Stack3DIcon,
  CursorArrowRaysIcon,
  StarIcon
} from '@heroicons/react/24/solid';

interface Participant {
  id: number;
  username: string;
  display_name: string;
  role: 'host' | 'participant';
  cursor_position?: { x: number; y: number };
  cursor_color: string;
  current_tool?: string;
  is_active: boolean;
  // Extended presence info
  activity?: string; // 'typing_title' | 'typing_text' | 'idle'
  current_page?: number; // zero-based index
}

interface ParticipantsPanelProps {
  participants: Participant[];
  isHost: boolean;
  onKick?: (userId: number) => void;
  currentUserId: number;
  maxParticipants?: number;
  isCollaborationMode?: boolean;
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  participants,
  isHost,
  onKick,
  currentUserId,
  maxParticipants = 5,
  isCollaborationMode = true
}) => {
  const getToolIcon = (tool?: string) => {
    switch (tool) {
      case 'pencil':
      case 'brush':
        return <PencilIcon className="w-4 h-4" />;
      case 'eraser':
        return <PaintBrushIcon className="w-4 h-4" />;
      case 'shapes':
        return <Square3Stack3DIcon className="w-4 h-4" />;
      case 'select':
        return <CursorArrowRaysIcon className="w-4 h-4" />;
      default:
        return <PencilIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="w-5 h-5" />
            <h3 className="font-bold text-lg">
              Participants
            </h3>
          </div>
          {isCollaborationMode && (
            <div className="flex items-center space-x-2">
              <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                <span className="font-bold text-sm">
                  {participants.filter(p => p.is_active).length}/{maxParticipants}
                </span>
              </div>
              {participants.filter(p => p.is_active).length >= maxParticipants && (
                <div className="bg-red-500 bg-opacity-80 px-2 py-1 rounded-full">
                  <span className="text-xs font-bold">FULL</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Participants List */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {participants
          .filter(p => p.is_active)
          .map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Left Side - Avatar and Info */}
              <div className="flex items-center space-x-3 flex-1">
                {/* Avatar with border color */}
                <div
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                  style={{
                    backgroundColor: participant.cursor_color,
                    border: `3px solid ${participant.cursor_color}`,
                    opacity: 0.9
                  }}
                >
                  {participant.display_name.charAt(0).toUpperCase()}
                  
                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-800 truncate">
                      {participant.display_name}
                    </span>
                    {participant.role === 'host' && (
                      <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                        <StarIcon className="w-3 h-3" />
                        <span className="text-xs font-bold">Host</span>
                      </div>
                    )}
                    {participant.id === currentUserId && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                        You
                      </span>
                    )}
                  </div>
                  
                  {/* Current Tool */}
                  <div className="flex items-center space-x-2 mt-1 text-gray-500">
                    {participant.current_tool && (
                      <>
                        {getToolIcon(participant.current_tool)}
                        <span className="text-xs capitalize">
                          {participant.current_tool}
                        </span>
                      </>
                    )}
                    {typeof participant.current_page === 'number' && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        Page {participant.current_page + 1}
                      </span>
                    )}
                    {participant.activity && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {participant.activity === 'typing_title' ? 'Typing title…' : participant.activity === 'typing_text' ? 'Typing…' : 'Idle'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side - Actions */}
              {isHost && participant.role !== 'host' && participant.id !== currentUserId && onKick && (
                <button
                  onClick={() => onKick(participant.id)}
                  className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove user"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}

        {/* Empty State */}
        {participants.filter(p => p.is_active).length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active participants</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {isHost ? (
            <>Click <XMarkIcon className="w-3 h-3 inline" /> to remove participants</>
          ) : (
            <>Collaborating in real-time</>
          )}
        </p>
      </div>
    </div>
  );
};
