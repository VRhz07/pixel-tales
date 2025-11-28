import React from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../../stores/userStore';
import {
  UserIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  EyeIcon,
  CogIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  UserCircleIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

const SettingsTab = () => {
  const {
    profile,
    privacySettings,
    parentalControls,
    accessibilitySettings,
    appPreferences,
    professionalFeatures,
    activeSettingsSection,
    setActiveSettingsSection,
    updateProfile,
    updatePrivacySettings,
    updateParentalControls,
    updateAccessibilitySettings,
    updateAppPreferences,
    updateProfessionalFeatures
  } = useUserStore();

  const sections = [
    { id: 'account', name: 'Account Management', icon: UserIcon },
    { id: 'privacy', name: 'Privacy Settings', icon: ShieldCheckIcon },
    { id: 'parental', name: 'Parental Controls', icon: UserCircleIcon },
    { id: 'creative', name: 'Creative Tools', icon: PaintBrushIcon },
    { id: 'accessibility', name: 'Accessibility', icon: EyeIcon },
    { id: 'preferences', name: 'App Preferences', icon: CogIcon }
  ];

  const renderAccountManagement = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Profile Customization */}
      <div className="settings-card">
        <h3 className="settings-card-title">
          <UserIcon className="w-5 h-5" />
          Profile Customization
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => updateProfile({ name: e.target.value })}
              className="settings-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
            <div className="avatar-selector">
              {['🎭', '🦄', '🐉', '🧚‍♀️', '🤖', '🎨'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => updateProfile({ avatar: emoji })}
                  className={`avatar-option ${
                    profile.avatar === emoji ? 'selected' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => updateProfile({ bio: e.target.value })}
              rows={3}
              className="settings-textarea"
              placeholder="Tell others about yourself..."
            />
          </div>
        </div>
      </div>

      {/* Account Type */}
      <div className="settings-card">
        <h3 className="settings-card-title">Account Type</h3>
        
        <div className="account-type-grid">
          {[
            { type: 'child', label: 'Child Account', desc: 'Creative tools with safety features' },
            { type: 'parent', label: 'Parent/Guardian', desc: 'Monitor and manage child accounts' },
            { type: 'educator', label: 'Educator', desc: 'Classroom management tools' }
          ].map((accountType) => (
            <button
              key={accountType.type}
              onClick={() => updateProfile({ accountType: accountType.type as any })}
              className={`account-type-card ${
                profile.accountType === accountType.type ? 'selected' : ''
              }`}
            >
              <div className="font-medium text-gray-800">{accountType.label}</div>
              <div className="text-sm text-gray-600 mt-1">{accountType.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderPrivacySettings = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 fade-in"
    >
      <div className="settings-card">
        <h3 className="settings-card-title">Privacy Controls</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Visibility</label>
            <select
              value={privacySettings.contentVisibility}
              onChange={(e) => updatePrivacySettings({ contentVisibility: e.target.value as any })}
              className="settings-select"
            >
              <option value="private">Private (Only me)</option>
              <option value="friends">Friends only</option>
              <option value="public">Public</option>
            </select>
          </div>
          
          {[
            { key: 'allowMessages', label: 'Allow messages from others' },
            { key: 'allowComments', label: 'Allow comments on my stories' },
            { key: 'showProfile', label: 'Show my profile to others' },
            { key: 'shareProgress', label: 'Share reading progress' }
          ].map((setting) => (
            <div key={setting.key} className="notification-item">
              <span className="text-sm font-medium text-gray-700">{setting.label}</span>
              <button
                onClick={() => updatePrivacySettings({ 
                  [setting.key]: !privacySettings[setting.key as keyof typeof privacySettings] 
                })}
                className={`toggle-switch ${
                  privacySettings[setting.key as keyof typeof privacySettings] ? 'active' : ''
                }`}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderCreativeTools = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Drawing Tools Settings */}
      <div className="settings-card">
        <h3 className="settings-card-title">
          <PaintBrushIcon className="w-5 h-5" />
          Drawing Tools Features
        </h3>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-6">
            Enable advanced drawing tools that will appear in Story Creation and Character Creation modes.
          </p>
          
          {[
            { 
              key: 'gridTool', 
              label: 'Grid Tool', 
              desc: 'Show alignment grid for precise drawing'
            },
            { 
              key: 'layerManagement', 
              label: 'Layer Management', 
              desc: 'Create and manage multiple drawing layers'
            },
            { 
              key: 'advancedBrushes', 
              label: 'Advanced Brush Tools', 
              desc: 'Access to more brush types and sizes'
            },
            { 
              key: 'textureBrush', 
              label: 'Texture Brush', 
              desc: 'Brushes with texture patterns and effects'
            },
            { 
              key: 'imageUpload', 
              label: 'Upload Images', 
              desc: 'Import and use your own images in drawings'
            }
          ].map((tool) => (
            <div key={tool.key} className="accessibility-setting">
              <div className="accessibility-info">
                <div className="accessibility-title">{tool.label}</div>
                <div className="accessibility-description">{tool.desc}</div>
              </div>
              <button
                onClick={() => updateProfessionalFeatures({ 
                  features: {
                    ...professionalFeatures.features,
                    [tool.key]: !professionalFeatures.features[tool.key as keyof typeof professionalFeatures.features]
                  }
                })}
                className={`toggle-switch ${
                  professionalFeatures.features[tool.key as keyof typeof professionalFeatures.features] ? 'active' : ''
                }`}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="text-blue-500 text-lg">ℹ️</div>
              <div>
                <h4 className="text-sm font-semibold text-blue-800">How it works</h4>
                <p className="text-xs text-blue-700 mt-1">
                  When you enable these tools, they will automatically appear in the drawing interface when creating stories manually or designing characters. You can toggle them on/off anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderAccessibilitySettings = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="settings-card">
        <h3 className="settings-card-title">Accessibility Options</h3>
        
        <div className="space-y-4">
          {[
            { key: 'textToSpeech', label: 'Text-to-Speech for all stories', desc: 'Hear stories read aloud' },
            { key: 'dyslexiaFont', label: 'Dyslexia-friendly fonts', desc: 'Use OpenDyslexic font family' },
            { key: 'highContrast', label: 'High contrast mode', desc: 'Increase text and background contrast' },
            { key: 'voiceInput', label: 'Voice input for story creation', desc: 'Dictate your stories' }
          ].map((setting) => (
            <div key={setting.key} className="accessibility-setting">
              <div className="accessibility-info">
                <div className="accessibility-title">{setting.label}</div>
                <div className="accessibility-description">{setting.desc}</div>
              </div>
              <button
                onClick={() => updateAccessibilitySettings({ 
                  [setting.key]: !accessibilitySettings[setting.key as keyof typeof accessibilitySettings] 
                })}
                className={`toggle-switch ${
                  accessibilitySettings[setting.key as keyof typeof accessibilitySettings] ? 'active' : ''
                }`}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          ))}
          
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                <select
                  value={accessibilitySettings.fontSize}
                  onChange={(e) => updateAccessibilitySettings({ fontSize: e.target.value as any })}
                  className="settings-select"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reading Speed</label>
                <select
                  value={accessibilitySettings.readingSpeed}
                  onChange={(e) => updateAccessibilitySettings({ readingSpeed: e.target.value as any })}
                  className="settings-select"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderParentalControls = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="settings-card">
        <h3 className="settings-card-title">Safety & Controls</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-700">Safe Mode</div>
              <div className="text-xs text-gray-500 mt-1">Enhanced content filtering and monitoring</div>
            </div>
            <button
              onClick={() => updateParentalControls({ safeMode: !parentalControls.safeMode })}
              className={`toggle-switch ${parentalControls.safeMode ? 'active' : ''}`}
            >
              <span className="toggle-knob" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Filter Level</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'strict', label: 'Strict', color: 'green' },
                { value: 'moderate', label: 'Moderate', color: 'yellow' },
                { value: 'off', label: 'Off', color: 'red' }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => updateParentalControls({ contentFilter: filter.value as any })}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    parentalControls.contentFilter === filter.value
                      ? `border-${filter.color}-500 bg-${filter.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium">{filter.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Time Limit: {parentalControls.timeLimit} minutes
            </label>
            <input
              type="range"
              min="15"
              max="240"
              step="15"
              value={parentalControls.timeLimit}
              onChange={(e) => updateParentalControls({ timeLimit: parseInt(e.target.value) })}
              className="range-slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>15 min</span>
              <span>4 hours</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderAppPreferences = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="settings-card">
        <h3 className="settings-card-title">App Preferences</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={appPreferences.language}
              onChange={(e) => updateAppPreferences({ language: e.target.value as any })}
              className="settings-select"
            >
              <option value="en">English</option>
              <option value="tl">Tagalog</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select
              value={appPreferences.theme}
              onChange={(e) => updateAppPreferences({ theme: e.target.value as any })}
              className="settings-select"
            >
              <option value="colorful">Colorful (Default)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Notifications</h4>
          <div className="space-y-3">
            {[
              { key: 'newStories', label: 'New stories from followed creators' },
              { key: 'achievements', label: 'Achievement unlocked notifications' },
              { key: 'reminders', label: 'Daily reading reminders' },
              { key: 'updates', label: 'App updates and news' }
            ].map((notification) => (
              <div key={notification.key} className="notification-item">
                <span className="text-sm text-gray-700">{notification.label}</span>
                <button
                  onClick={() => updateAppPreferences({ 
                    notifications: {
                      ...appPreferences.notifications,
                      [notification.key]: !appPreferences.notifications[notification.key as keyof typeof appPreferences.notifications]
                    }
                  })}
                  className={`toggle-switch ${
                    appPreferences.notifications[notification.key as keyof typeof appPreferences.notifications] ? 'active' : ''
                  }`}
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Storage Limit: {appPreferences.storageLimit} MB
          </label>
          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={appPreferences.storageLimit}
            onChange={(e) => updateAppPreferences({ storageLimit: parseInt(e.target.value) })}
            className="range-slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>100 MB</span>
            <span>2 GB</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderSection = () => {
    switch (activeSettingsSection) {
      case 'account':
        return renderAccountManagement();
      case 'privacy':
        return renderPrivacySettings();
      case 'parental':
        return renderParentalControls();
      case 'creative':
        return renderCreativeTools();
      case 'accessibility':
        return renderAccessibilitySettings();
      case 'preferences':
        return renderAppPreferences();
      default:
        return renderAccountManagement();
    }
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Settings Navigation */}
      <div className="settings-navigation grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSettingsSection(section.id)}
              className={`settings-nav-item ${
                activeSettingsSection === section.id ? 'active' : ''
              }`}
            >
              <div className="settings-nav-icon">
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="settings-nav-title">{section.name}</div>
            </button>
          );
        })}
      </div>

      {/* Settings Content */}
      {renderSection()}
    </div>
  );
};

export default SettingsTab;
