/**
 * Upgrade Prompt Component
 * Shows when users hit feature limits or try to access premium features
 */

import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, SparklesIcon, CheckIcon } from '@heroicons/react/24/outline';
import { featureAccessService } from '@/services/featureAccess.service';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  reason?: 'limit_reached' | 'premium_only' | 'anonymous';
}

export default function UpgradePrompt({ isOpen, onClose, feature, reason = 'premium_only' }: UpgradePromptProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAnonymous = user?.id === 'anonymous';
  const premiumFeatures = featureAccessService.getPremiumFeatures();

  const getTitle = () => {
    if (reason === 'anonymous') {
      return 'Sign Up to Continue';
    }
    if (reason === 'limit_reached') {
      return 'Limit Reached';
    }
    return 'Upgrade to Premium';
  };

  const getMessage = () => {
    if (reason === 'anonymous') {
      return 'Create a free account to start creating stories and characters!';
    }
    if (reason === 'limit_reached') {
      return `You've reached your free tier limit${feature ? ` for ${feature}` : ''}. Upgrade to Premium for unlimited access!`;
    }
    return `${feature || 'This feature'} is available in Premium. Unlock all features and create without limits!`;
  };

  const handlePrimaryAction = () => {
    if (isAnonymous) {
      navigate('/auth');
    } else {
      // Navigate to upgrade/pricing page (to be implemented)
      console.log('Navigate to upgrade page');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <SparklesIcon className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold">{getTitle()}</h2>
                </div>
                <p className="text-purple-100">{getMessage()}</p>
              </div>

              {/* Content */}
              <div className="p-6">
                {!isAnonymous && (
                  <>
                    <h3 className="font-semibold text-gray-900 mb-4">Premium Features Include:</h3>
                    <div className="space-y-3 mb-6">
                      {premiumFeatures.slice(0, 6).map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start gap-3"
                        >
                          <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mt-0.5">
                            <CheckIcon className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}

                {isAnonymous && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Free Account Benefits:</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckIcon className="w-4 h-4 text-purple-500" />
                        Create up to 3 stories
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckIcon className="w-4 h-4 text-purple-500" />
                        Design 2 custom characters
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckIcon className="w-4 h-4 text-purple-500" />
                        Use AI story generation
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckIcon className="w-4 h-4 text-purple-500" />
                        Access social features
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handlePrimaryAction}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium shadow-lg shadow-purple-500/30"
                  >
                    {isAnonymous ? 'Sign Up Free' : 'Upgrade Now'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
