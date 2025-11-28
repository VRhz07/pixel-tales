/**
 * Collaboration Invitation Notification - Pop-up for receiving collaboration invites
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { Users, X, Check } from 'lucide-react';

export interface CollaborationInvite {
  id: string;
  session_id: string;
  sessionId?: string;
  inviter_id: number;
  inviter_name: string;
  inviter_avatar?: string;
  story_title: string;
  storyTitle?: string;
  created_at: string;
  createdAt?: string;
  // Legacy support for old format
  fromUser?: {
    id: number;
    username: string;
    avatar?: string;
  };
}

interface CollaborationInvitationProps {
  invitation: CollaborationInvite;
  onAccept: (invitation: CollaborationInvite) => void;
  onDecline: (invitationId: string) => void;
}

export const CollaborationInvitation: React.FC<CollaborationInvitationProps> = ({
  invitation,
  onAccept,
  onDecline
}) => {
  return (
    <div className="bg-[#1F2329] rounded-lg shadow-2xl border-2 border-[#8B5CF6] overflow-hidden animate-slideIn max-w-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-white" />
          <h3 className="text-white font-semibold text-sm">
            Collaboration Invite
          </h3>
        </div>
        <button
          onClick={() => onDecline(invitation.id)}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
            {(invitation.inviter_name || invitation.fromUser?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">
              {invitation.inviter_name || invitation.fromUser?.username || 'Unknown User'}
            </p>
            <p className="text-[#8B9197] text-xs">
              wants to collaborate
            </p>
          </div>
        </div>

        {/* Story Title */}
        <div className="mb-4 p-3 bg-[#343A40] rounded-lg border border-[#404650]">
          <p className="text-xs text-[#8B9197] mb-1">Story:</p>
          <p className="text-white font-medium text-sm truncate">
            {invitation.story_title || invitation.storyTitle || 'Untitled Story'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onDecline(invitation.id)}
            className="flex-1 px-4 py-2.5 bg-[#404650] hover:bg-[#4A5160] text-white rounded-lg font-medium text-sm transition-all"
          >
            Decline
          </button>
          <button
            onClick={() => onAccept(invitation)}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Container for displaying collaboration invitations
 */
interface CollaborationInvitationsContainerProps {
  invitations: CollaborationInvite[];
  onAccept: (invitation: CollaborationInvite) => void;
  onDecline: (invitationId: string) => void;
}

export const CollaborationInvitationsContainer: React.FC<CollaborationInvitationsContainerProps> = ({
  invitations,
  onAccept,
  onDecline
}) => {
  console.log('🎨 CollaborationInvitationsContainer rendering with invitations:', invitations);
  
  if (invitations.length === 0) {
    console.log('🎨 No invitations to display');
    return null;
  }
  
  console.log('🎨 Displaying', invitations.length, 'invitation(s)');

  const content = (
    <div className="fixed top-4 right-4 space-y-3 max-w-sm" style={{ zIndex: 999999 }}>
      {invitations.map((invitation) => (
        <CollaborationInvitation
          key={invitation.id}
          invitation={invitation}
          onAccept={onAccept}
          onDecline={onDecline}
        />
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );

  // Use React Portal to render at document body level
  return ReactDOM.createPortal(content, document.body);
};

