import React from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';

interface ContinueWithoutAccountProps {
  onContinueWithoutAccount: () => void;
}

const ContinueWithoutAccount: React.FC<ContinueWithoutAccountProps> = ({ onContinueWithoutAccount }) => {
  return (
    <button
      type="button"
      onClick={onContinueWithoutAccount}
      className="auth-guest-button"
    >
      <EyeIcon />
      <span>Continue without account</span>
    </button>
  );
};

export default ContinueWithoutAccount;
