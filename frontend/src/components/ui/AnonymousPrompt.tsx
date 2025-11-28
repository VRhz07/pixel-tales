/**
 * Anonymous User Prompt
 * Shows when anonymous users try to access features that require an account
 */

import { useNavigate } from 'react-router-dom';
import { SparklesIcon, EyeIcon } from '@heroicons/react/24/outline';

interface AnonymousPromptProps {
  feature?: string;
  message?: string;
}

export default function AnonymousPrompt({ 
  feature = 'this feature',
  message 
}: AnonymousPromptProps) {
  const navigate = useNavigate();

  const defaultMessage = `Sign up for a free account to access ${feature} and start creating your own stories!`;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 text-center border border-purple-100">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-white rounded-full shadow-lg">
            <SparklesIcon className="w-12 h-12 text-purple-500" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Sign Up to Continue
        </h2>

        {/* Message */}
        <p className="text-gray-700 mb-6 max-w-md mx-auto">
          {message || defaultMessage}
        </p>

        {/* Benefits */}
        <div className="bg-white rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
          <p className="text-sm font-semibold text-gray-900 mb-3">
            Free Account Benefits:
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-purple-500">✓</span>
              Create up to 3 stories
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-500">✓</span>
              Design 2 custom characters
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-500">✓</span>
              Use AI story generation
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-500">✓</span>
              Access social features
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-500">✓</span>
              Save your progress
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30"
          >
            Sign Up Free
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
        </div>

        {/* Current Status */}
        <div className="mt-6 pt-6 border-t border-purple-100">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <EyeIcon className="w-4 h-4" />
            <span>Currently browsing without an account</span>
          </div>
        </div>
      </div>
    </div>
  );
}
