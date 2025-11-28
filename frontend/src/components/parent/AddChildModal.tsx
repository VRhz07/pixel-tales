import React, { useState } from 'react';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import './AddChildModal.css';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (childData: ChildFormData) => Promise<void>;
  userType: 'parent' | 'teacher';
}

interface ChildFormData {
  name: string;
  username: string;
  dateOfBirth?: string;
  className?: string;
}

const AddChildModal: React.FC<AddChildModalProps> = ({ isOpen, onClose, onAdd, userType }) => {
  const [formData, setFormData] = useState<ChildFormData>({
    name: '',
    username: '',
    dateOfBirth: '',
    className: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter a name');
      return;
    }

    if (!formData.username.trim()) {
      setError('Please enter a username');
      return;
    }

    // Username validation
    if (!/^[a-z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain lowercase letters, numbers, and underscores');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    // Date of birth validation - must be at least 5 years old
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const fiveYearsAgo = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
      
      if (birthDate > fiveYearsAgo) {
        setError('Child must be at least 5 years old');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      await onAdd(formData);
      
      // Reset form
      setFormData({
        name: '',
        username: '',
        dateOfBirth: '',
        className: ''
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create child profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      username: '',
      dateOfBirth: '',
      className: ''
    });
    setError('');
    onClose();
  };

  return (
    <div className="add-child-modal-overlay" onClick={handleClose}>
      <div className="add-child-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-child-modal-header">
          <h2 className="add-child-modal-title">
            Add {userType === 'parent' ? 'Child' : 'Student'} Profile
          </h2>
          <button className="add-child-modal-close" onClick={handleClose}>
            <XMarkIcon />
          </button>
        </div>

        <form className="add-child-modal-form" onSubmit={handleSubmit}>
          <p className="add-child-description">
            Create a new {userType === 'parent' ? 'child' : 'student'} profile that you can manage and monitor.
          </p>

          {/* Name Input */}
          <div className="add-child-form-group">
            <label className="add-child-label">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              className="add-child-input"
              placeholder="Enter full name..."
              value={formData.name}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
          </div>

          {/* Username Input */}
          <div className="add-child-form-group">
            <label className="add-child-label">
              Username *
            </label>
            <input
              type="text"
              name="username"
              className="add-child-input"
              placeholder="Enter username (lowercase, no spaces)..."
              value={formData.username}
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/\s/g, '');
                setFormData(prev => ({ ...prev, username: value }));
                setError('');
              }}
              disabled={loading}
              required
            />
            <p className="add-child-hint">
              Username must be at least 3 characters and can only contain lowercase letters, numbers, and underscores.
            </p>
          </div>

          {/* Date of Birth Input */}
          <div className="add-child-form-group">
            <label className="add-child-label">
              Date of Birth {userType === 'parent' ? '(Optional)' : ''}
            </label>
            <input
              type="date"
              name="dateOfBirth"
              className="add-child-input"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              disabled={loading}
              max={(() => {
                const date = new Date();
                date.setFullYear(date.getFullYear() - 5);
                return date.toISOString().split('T')[0];
              })()}
            />
            <p className="add-child-hint">
              Child must be at least 5 years old
            </p>
          </div>

          {/* Class Name Input (for teachers) */}
          {userType === 'teacher' && (
            <div className="add-child-form-group">
              <label className="add-child-label">
                Class Name (Optional)
              </label>
              <input
                type="text"
                name="className"
                className="add-child-input"
                placeholder="Enter class name..."
                value={formData.className}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
          )}

          {error && (
            <div className="add-child-error">
              {error}
            </div>
          )}

          <div className="add-child-modal-actions">
            <button
              type="button"
              className="add-child-btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="add-child-btn-primary"
              disabled={loading || !formData.name.trim() || !formData.username.trim()}
            >
              {loading ? 'Creating Profile...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChildModal;
