import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useCreationStore } from '../../stores/creationStore';
import { useEffect } from 'react';

const AchievementModal = () => {
  const { showAchievementModal, newAchievement, dismissAchievementModal } = useCreationStore();

  useEffect(() => {
    if (showAchievementModal && newAchievement) {
      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [showAchievementModal, newAchievement]);

  if (!newAchievement) return null;

  return (
    <Transition appear show={showAchievementModal} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={dismissAchievementModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Achievement Unlocked! 🎉
                  </Dialog.Title>
                  <button
                    onClick={dismissAchievementModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="mt-4 text-center"
                >
                  <div className="text-6xl mb-4">{newAchievement.icon}</div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">
                    {newAchievement.name}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    {newAchievement.description}
                  </p>
                  
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full mb-4"
                  />
                  
                  <p className="text-sm text-gray-500">
                    Keep creating to unlock more achievements!
                  </p>
                </motion.div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-pink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                    onClick={dismissAchievementModal}
                  >
                    Awesome!
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AchievementModal;
