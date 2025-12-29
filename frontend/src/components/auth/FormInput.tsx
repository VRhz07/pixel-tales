import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface FormInputProps {
  label: string;
  type: 'text' | 'email' | 'password';
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  required?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  type,
  placeholder,
  value,
  onChange,
  icon,
  required = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="auth-form-group">
      <label className="auth-form-label">
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>}
      </label>
      <div className="auth-input-container">
        {/* Input Icon */}
        <div className="auth-input-icon">
          {icon}
        </div>
        
        {/* Input Field */}
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          className="auth-input"
          style={{
            paddingRight: type === 'password' ? '2.75rem' : '1rem'
          }}
        />
        
        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="auth-password-toggle"
          >
            {showPassword ? (
              <EyeSlashIcon />
            ) : (
              <EyeIcon />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormInput;
