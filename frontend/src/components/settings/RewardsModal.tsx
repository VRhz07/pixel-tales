import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, LockClosedIcon, CheckIcon } from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface Border {
  id: string;
  name: string;
  style: 'solid' | 'gradient' | 'animated';
  color?: string;
  gradient?: string;
}

interface RewardItem {
  item: string | Border;
  unlockLevel: number;
  isUnlocked: boolean;
}

interface RewardsData {
  unlocked: {
    avatars: string[];
    borders: Border[];
  };
  next_unlock: {
    avatar_level: number | null;
    border_level: number | null;
    avatar_preview: string[];
    border_preview: Border[];
  };
  current_level: number;
  all_rewards?: {
    avatars: RewardItem[];
    borders: RewardItem[];
  };
}

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  currentBorder: string;
  onSave: (avatar: string, border: string) => Promise<void>;
}

export const RewardsModal: React.FC<RewardsModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  currentBorder,
  onSave,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [selectedBorder, setSelectedBorder] = useState(currentBorder);
  const [rewards, setRewards] = useState<RewardsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'avatars' | 'borders'>('avatars');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const theme = localStorage.getItem('theme');
      setIsDarkMode(theme === 'dark');
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Load rewards when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRewards();
      setSelectedAvatar(currentAvatar);
      setSelectedBorder(currentBorder);
    }
  }, [isOpen, currentAvatar, currentBorder]);

  const loadRewards = async () => {
    setIsLoading(true);
    setError('');
    try {
      // api.get() already returns response.data, not the full response
      const data = await api.get<{
        success: boolean;
        rewards: RewardsData;
        selected_border: string;
        error?: string;
      }>('/users/rewards/');
      
      console.log('Rewards API data:', data);
      console.log('data.rewards:', data.rewards);
      console.log('data.rewards.unlocked:', data.rewards?.unlocked);
      
      if (data) {
        if (data.success && data.rewards) {
          console.log('Setting rewards to:', data.rewards);
          setRewards(data.rewards);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError('Invalid response from server');
        }
      } else {
        setError('No data received from server');
      }
    } catch (err: any) {
      console.error('Error loading rewards:', err);
      
      if (err.error) {
        setError(err.error);
      } else if (err.message) {
        setError(`Failed to load rewards: ${err.message}`);
      } else {
        setError('Failed to load rewards. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      await onSave(selectedAvatar, selectedBorder);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const getBorderStyle = (border: Border) => {
    if (border.style === 'solid') {
      return {
        border: `3px solid ${border.color}`,
      };
    } else if (border.style === 'gradient' || border.style === 'animated') {
      return {
        background: border.gradient,
        padding: '3px',
      };
    }
    return {};
  };

  const getBorderPreviewStyle = (border: Border) => {
    if (border.style === 'solid') {
      return {
        border: `4px solid ${border.color}`,
      };
    } else if (border.style === 'gradient' || border.style === 'animated') {
      return {
        borderImage: border.gradient,
        borderWidth: '4px',
        borderStyle: 'solid',
        borderImageSlice: 1,
      };
    }
    return {};
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="account-modal-backdrop" 
      onClick={onClose}
      style={{
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
        zIndex: 1000,
      }}
    >
      <div 
        className="account-modal-container" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDarkMode 
            ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
            : 'white',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div 
          className="account-modal-header"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
              🎁 Your Rewards
            </h2>
            {rewards && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
                Level {rewards.current_level} • {rewards.unlocked.avatars.length} Avatars • {rewards.unlocked.borders.length} Borders
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: 'white',
            }}
          >
            <XMarkIcon style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        }}>
          <button
            onClick={() => setActiveTab('avatars')}
            style={{
              flex: 1,
              padding: '1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'avatars' ? '3px solid #667eea' : '3px solid transparent',
              color: activeTab === 'avatars' 
                ? '#667eea' 
                : isDarkMode ? '#9ca3af' : '#6b7280',
              fontWeight: activeTab === 'avatars' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Avatars
          </button>
          <button
            onClick={() => setActiveTab('borders')}
            style={{
              flex: 1,
              padding: '1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'borders' ? '3px solid #667eea' : '3px solid transparent',
              color: activeTab === 'borders' 
                ? '#667eea' 
                : isDarkMode ? '#9ca3af' : '#6b7280',
              fontWeight: activeTab === 'borders' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Borders
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
              Loading rewards...
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              color: '#ef4444',
              background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              borderRadius: '0.5rem',
            }}>
              {error}
            </div>
          ) : rewards ? (
            <>
              {/* Avatars Tab */}
              {activeTab === 'avatars' && (
                <div>
                  {/* Show all avatars grouped by unlock level */}
                  {rewards.all_rewards?.avatars ? (
                    <>
                      {/* Group avatars by unlock level */}
                      {Object.entries(
                        rewards.all_rewards.avatars.reduce((acc, item) => {
                          const level = item.unlockLevel;
                          if (!acc[level]) acc[level] = [];
                          acc[level].push(item);
                          return acc;
                        }, {} as Record<number, RewardItem[]>)
                      )
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([level, items]) => (
                        <div key={level} style={{ marginBottom: '2rem' }}>
                          {/* Level Header */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            background: Number(level) <= rewards.current_level
                              ? isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)'
                              : isDarkMode ? 'rgba(107, 114, 128, 0.1)' : 'rgba(107, 114, 128, 0.05)',
                            borderRadius: '0.5rem',
                            borderLeft: `4px solid ${Number(level) <= rewards.current_level ? '#10b981' : '#6b7280'}`,
                          }}>
                            {Number(level) <= rewards.current_level ? (
                              <CheckIcon style={{ width: '20px', height: '20px', color: '#10b981' }} />
                            ) : (
                              <LockClosedIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                            )}
                            <span style={{ 
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              color: Number(level) <= rewards.current_level 
                                ? '#10b981' 
                                : isDarkMode ? '#9ca3af' : '#6b7280',
                            }}>
                              Level {level}
                              {Number(level) === rewards.current_level && ' (Current)'}
                              {Number(level) > rewards.current_level && ` (${Number(level) - rewards.current_level} levels to go)`}
                            </span>
                          </div>

                          {/* Avatars Grid */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                            gap: '1rem',
                          }}>
                            {items.map((item, idx) => {
                              const avatar = item.item as string;
                              const isLocked = !item.isUnlocked;
                              return (
                                <button
                                  key={`${level}-${idx}`}
                                  onClick={() => !isLocked && setSelectedAvatar(avatar)}
                                  disabled={isLocked}
                                  style={{
                                    fontSize: '2.5rem',
                                    padding: '0.75rem',
                                    background: selectedAvatar === avatar 
                                      ? isDarkMode ? '#374151' : '#f3f4f6'
                                      : 'transparent',
                                    border: selectedAvatar === avatar 
                                      ? '3px solid #667eea' 
                                      : isLocked
                                        ? '2px dashed #9ca3af'
                                        : isDarkMode ? '2px solid #374151' : '2px solid #e5e7eb',
                                    borderRadius: '0.75rem',
                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    opacity: isLocked ? 0.7 : 1,
                                  }}
                                  onMouseEnter={(e) => {
                                    if (selectedAvatar !== avatar && !isLocked) {
                                      e.currentTarget.style.transform = 'scale(1.05)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }}
                                >
                                  <div style={{
                                    position: 'relative',
                                    display: 'inline-block',
                                  }}>
                                    {avatar}
                                    {isLocked && (
                                      <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        background: isDarkMode 
                                          ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.75))' 
                                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 240, 240, 0.9))',
                                        borderRadius: '50%',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                                        border: isDarkMode ? '2px solid #4b5563' : '2px solid #d1d5db',
                                      }}>
                                        <LockClosedIcon style={{ width: '20px', height: '20px', color: isDarkMode ? '#fbbf24' : '#f59e0b' }} />
                                      </div>
                                    )}
                                  </div>
                                  {selectedAvatar === avatar && !isLocked && (
                                    <div style={{
                                      position: 'absolute',
                                      top: '-8px',
                                      right: '-8px',
                                      background: '#667eea',
                                      borderRadius: '50%',
                                      width: '24px',
                                      height: '24px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      boxShadow: '0 2px 4px rgba(102, 126, 234, 0.4)',
                                    }}>
                                      <CheckIcon style={{ width: '16px', height: '16px', color: 'white' }} />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    // Fallback to old display if all_rewards not available
                    <div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                        gap: '1rem',
                        marginBottom: '2rem',
                      }}>
                        {rewards.unlocked.avatars.map((avatar) => (
                          <button
                            key={avatar}
                            onClick={() => setSelectedAvatar(avatar)}
                            style={{
                              fontSize: '2.5rem',
                              padding: '0.75rem',
                              background: selectedAvatar === avatar 
                                ? isDarkMode ? '#374151' : '#f3f4f6'
                                : 'transparent',
                              border: selectedAvatar === avatar 
                                ? '3px solid #667eea' 
                                : isDarkMode ? '2px solid #374151' : '2px solid #e5e7eb',
                              borderRadius: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              position: 'relative',
                            }}
                          >
                            {avatar}
                            {selectedAvatar === avatar && (
                              <div style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                background: '#667eea',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <CheckIcon style={{ width: '16px', height: '16px', color: 'white' }} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Borders Tab */}
              {activeTab === 'borders' && (
                <div>
                  {/* Show all borders grouped by unlock level */}
                  {rewards.all_rewards?.borders ? (
                    <>
                      {/* Group borders by unlock level */}
                      {Object.entries(
                        rewards.all_rewards.borders.reduce((acc, item) => {
                          const level = item.unlockLevel;
                          if (!acc[level]) acc[level] = [];
                          acc[level].push(item);
                          return acc;
                        }, {} as Record<number, RewardItem[]>)
                      )
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([level, items]) => (
                        <div key={level} style={{ marginBottom: '2rem' }}>
                          {/* Level Header */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            background: Number(level) <= rewards.current_level
                              ? isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)'
                              : isDarkMode ? 'rgba(107, 114, 128, 0.1)' : 'rgba(107, 114, 128, 0.05)',
                            borderRadius: '0.5rem',
                            borderLeft: `4px solid ${Number(level) <= rewards.current_level ? '#10b981' : '#6b7280'}`,
                          }}>
                            {Number(level) <= rewards.current_level ? (
                              <CheckIcon style={{ width: '20px', height: '20px', color: '#10b981' }} />
                            ) : (
                              <LockClosedIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                            )}
                            <span style={{ 
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              color: Number(level) <= rewards.current_level 
                                ? '#10b981' 
                                : isDarkMode ? '#9ca3af' : '#6b7280',
                            }}>
                              Level {level}
                              {Number(level) === rewards.current_level && ' (Current)'}
                              {Number(level) > rewards.current_level && ` (${Number(level) - rewards.current_level} levels to go)`}
                            </span>
                          </div>

                          {/* Borders Grid */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                            gap: '1rem',
                          }}>
                            {items.map((item, idx) => {
                              const border = item.item as Border;
                              const isLocked = !item.isUnlocked;
                              return (
                                <button
                                  key={`${level}-${idx}`}
                                  onClick={() => !isLocked && setSelectedBorder(border.id)}
                                  disabled={isLocked}
                                  style={{
                                    padding: '1rem',
                                    background: selectedBorder === border.id 
                                      ? isDarkMode ? '#374151' : '#f3f4f6'
                                      : isDarkMode ? '#1f2937' : 'white',
                                    border: selectedBorder === border.id 
                                      ? '3px solid #667eea' 
                                      : isLocked
                                        ? '2px dashed #9ca3af'
                                        : isDarkMode ? '2px solid #374151' : '2px solid #e5e7eb',
                                    borderRadius: '0.75rem',
                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    opacity: isLocked ? 0.7 : 1,
                                  }}
                                  onMouseEnter={(e) => {
                                    if (selectedBorder !== border.id && !isLocked) {
                                      e.currentTarget.style.transform = 'scale(1.05)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }}
                                >
                                  <div style={{
                                    position: 'relative',
                                    width: '60px',
                                    height: '60px',
                                    margin: '0 auto 0.5rem',
                                  }}>
                                    <div style={{
                                      width: '100%',
                                      height: '100%',
                                      borderRadius: '50%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '1.5rem',
                                      background: isDarkMode ? '#111827' : '#f9fafb',
                                      ...getBorderPreviewStyle(border),
                                    }}>
                                      {selectedAvatar}
                                    </div>
                                    {isLocked && (
                                      <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        background: isDarkMode 
                                          ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.75))' 
                                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 240, 240, 0.9))',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                                        border: isDarkMode ? '2px solid #4b5563' : '2px solid #d1d5db',
                                      }}>
                                        <LockClosedIcon style={{ width: '22px', height: '22px', color: isDarkMode ? '#fbbf24' : '#f59e0b' }} />
                                      </div>
                                    )}
                                  </div>
                                  <div style={{
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: isLocked 
                                      ? isDarkMode ? '#9ca3af' : '#6b7280'
                                      : isDarkMode ? '#e5e7eb' : '#1f2937',
                                  }}>
                                    {border.name}
                                  </div>
                                  {selectedBorder === border.id && !isLocked && (
                                    <div style={{
                                      position: 'absolute',
                                      top: '-8px',
                                      right: '-8px',
                                      background: '#667eea',
                                      borderRadius: '50%',
                                      width: '24px',
                                      height: '24px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      boxShadow: '0 2px 4px rgba(102, 126, 234, 0.4)',
                                    }}>
                                      <CheckIcon style={{ width: '16px', height: '16px', color: 'white' }} />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    // Fallback to old display if all_rewards not available
                    <div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: '1rem',
                        marginBottom: '2rem',
                      }}>
                        {rewards.unlocked.borders.map((border) => (
                          <button
                            key={border.id}
                            onClick={() => setSelectedBorder(border.id)}
                            style={{
                              padding: '1rem',
                              background: selectedBorder === border.id 
                                ? isDarkMode ? '#374151' : '#f3f4f6'
                                : isDarkMode ? '#1f2937' : 'white',
                              border: selectedBorder === border.id 
                                ? '3px solid #667eea' 
                                : isDarkMode ? '2px solid #374151' : '2px solid #e5e7eb',
                              borderRadius: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              position: 'relative',
                            }}
                          >
                            <div style={{
                              width: '60px',
                              height: '60px',
                              margin: '0 auto 0.5rem',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.5rem',
                              background: isDarkMode ? '#111827' : '#f9fafb',
                              ...getBorderPreviewStyle(border),
                            }}>
                              {selectedAvatar}
                            </div>
                            <div style={{
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: isDarkMode ? '#e5e7eb' : '#1f2937',
                            }}>
                              {border.name}
                            </div>
                            {selectedBorder === border.id && (
                              <div style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                background: '#667eea',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <CheckIcon style={{ width: '16px', height: '16px', color: 'white' }} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: isDarkMode ? '2px solid #374151' : '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              color: isDarkMode ? '#e5e7eb' : '#1f2937',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || (selectedAvatar === currentAvatar && selectedBorder === currentBorder)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              fontWeight: '600',
              cursor: isSaving || (selectedAvatar === currentAvatar && selectedBorder === currentBorder) 
                ? 'not-allowed' 
                : 'pointer',
              opacity: isSaving || (selectedAvatar === currentAvatar && selectedBorder === currentBorder) 
                ? 0.5 
                : 1,
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
