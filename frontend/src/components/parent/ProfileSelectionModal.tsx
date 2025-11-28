import React from 'react';
import { UserIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Child } from '../../services/parentDashboard.service';
import './ProfileSelectionModal.css';

interface ProfileSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: Child[];
  parentName: string;
  onSelectProfile: (childId: number | null) => void; // null = parent profile
  onAddChild: () => void;
}

const ProfileSelectionModal: React.FC<ProfileSelectionModalProps> = ({
  isOpen,
  onClose,
  children,
  parentName,
  onSelectProfile,
  onAddChild
}) => {
  if (!isOpen) return null;

  // Avatar colors for children
  const avatarColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  ];

  return (
    <div className="profile-selection-overlay" onClick={onClose}>
      <div className="profile-selection-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="profile-selection-close" onClick={onClose}>
          <XMarkIcon />
        </button>

        {/* Header */}
        <div className="profile-selection-header">
          <h1 className="profile-selection-title">Who's watching?</h1>
          <p className="profile-selection-subtitle">Select a profile to continue</p>
        </div>

        {/* Profile Grid */}
        <div className="profile-selection-grid">
          {/* Parent Profile */}
          <div 
            className="profile-card"
            onClick={() => onSelectProfile(null)}
          >
            <div 
              className="profile-avatar parent-profile"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}
            >
              <UserIcon />
            </div>
            <p className="profile-name">{parentName}</p>
            <span className="profile-badge">Parent</span>
          </div>

          {/* Child Profiles */}
          {children.map((child, index) => (
            <div 
              key={child.id}
              className="profile-card"
              onClick={() => onSelectProfile(child.id)}
            >
              <div 
                className="profile-avatar"
                style={{ background: avatarColors[index % avatarColors.length] }}
              >
                {child.name.charAt(0).toUpperCase()}
              </div>
              <p className="profile-name">{child.name}</p>
              {child.age && (
                <span className="profile-age">Age {child.age}</span>
              )}
            </div>
          ))}

          {/* Add Child Card */}
          <div 
            className="profile-card add-profile-card"
            onClick={onAddChild}
          >
            <div className="profile-avatar add-avatar">
              <PlusIcon />
            </div>
            <p className="profile-name">Add Child</p>
          </div>
        </div>

        {/* Footer */}
        <div className="profile-selection-footer">
          <p>Manage profiles and monitor your children's progress</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSelectionModal;
