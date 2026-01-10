import React, { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface UnlockedItem {
  type: 'avatar' | 'border';
  name: string;
  preview?: string;
  emoji?: string;
  gradient?: string;
}

interface LevelUpModalProps {
  show: boolean;
  onClose: () => void;
  newLevel: number;
  unlockedItems?: UnlockedItem[];
  totalXP?: number;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({
  show,
  onClose,
  newLevel,
  unlockedItems = [],
  totalXP = 0,
}) => {
  useEffect(() => {
    if (show) {
      // Trigger multiple confetti bursts
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [show]);

  return (
    <Transition appear show={show} as={Fragment}>
      <Dialog as="div" className="relative z-[70]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-75"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-75"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 dark:from-gray-800 dark:via-purple-900/30 dark:to-pink-900/30 p-8 text-left align-middle shadow-2xl transition-all">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors z-10"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                {/* Animated sparkles background */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-2xl"
                      initial={{
                        x: Math.random() * 100 + '%',
                        y: '100%',
                        opacity: 0,
                      }}
                      animate={{
                        y: '-20%',
                        opacity: [0, 1, 1, 0],
                      }}
                      transition={{
                        duration: 3,
                        delay: i * 0.3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      {i % 3 === 0 ? '⭐' : i % 3 === 1 ? '✨' : '🌟'}
                    </motion.div>
                  ))}
                </div>

                {/* Content */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="relative z-10"
                >
                  {/* Level up badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.2,
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                    }}
                    className="flex justify-center mb-4"
                  >
                    <div className="relative">
                      <div className="text-8xl">🎉</div>
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="absolute -top-2 -right-2 text-3xl"
                      >
                        👑
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Title */}
                  <Dialog.Title
                    as="h3"
                    className="text-center text-3xl font-black mb-2"
                  >
                    <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 bg-clip-text text-transparent">
                      LEVEL UP!
                    </span>
                  </Dialog.Title>

                  {/* New level display */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.4,
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                    }}
                    className="flex justify-center items-center gap-3 mb-6"
                  >
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full px-6 py-3 shadow-lg">
                      <span className="text-white font-black text-4xl">
                        Level {newLevel}
                      </span>
                    </div>
                  </motion.div>

                  {/* Encouraging message */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-center text-gray-700 dark:text-gray-300 text-lg font-semibold mb-6"
                  >
                    You're amazing! Keep creating! 🚀
                  </motion.p>

                  {/* Unlocked items */}
                  {unlockedItems.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-4 mb-6 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <SparklesIcon className="w-5 h-5 text-yellow-500" />
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg">
                          New Rewards Unlocked! 🎁
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {unlockedItems.slice(0, 4).map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              delay: 1 + index * 0.1,
                              type: 'spring',
                              stiffness: 200,
                            }}
                            className="bg-gradient-to-br from-white to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-3 text-center shadow-md"
                          >
                            <div className="text-3xl mb-1">
                              {item.emoji || (item.type === 'avatar' ? '🎭' : '🖼️')}
                            </div>
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 truncate">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-500 capitalize">
                              {item.type}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {unlockedItems.length > 4 && (
                        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-3 font-medium">
                          +{unlockedItems.length - 4} more items! 🎉
                        </p>
                      )}

                      <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Check your Profile → Rewards to use them!
                      </p>
                    </motion.div>
                  )}

                  {/* XP Progress info */}
                  {totalXP > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                      className="text-center mb-6"
                    >
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full px-4 py-2">
                        <span className="text-xl">⭐</span>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          {totalXP.toLocaleString()} Total XP
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Action button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                  >
                    <button
                      type="button"
                      className="w-full inline-flex justify-center items-center gap-2 rounded-2xl border-none bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 px-6 py-4 text-lg font-black text-white hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
                      onClick={onClose}
                    >
                      <span>Awesome!</span>
                      <span>🎉</span>
                    </button>
                  </motion.div>
                </motion.div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default LevelUpModal;
