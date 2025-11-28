import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, SparklesIcon, PencilIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreationStore } from '../../stores/creationStore';
import AICharacterGenerator from './AICharacterGenerator';
import ManualCharacterDesigner from './ManualCharacterDesigner';

interface CharacterCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CreationMethod = 'ai' | 'manual' | null;

const CharacterCreationModal = ({ isOpen, onClose }: CharacterCreationModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<CreationMethod>(null);
  const { resetCreationState } = useCreationStore();

  const handleClose = () => {
    setSelectedMethod(null);
    resetCreationState();
    onClose();
  };

  const creationMethods = [
    {
      id: 'ai' as const,
      title: 'AI Character Generator',
      description: 'Describe your character and let AI bring them to life',
      icon: SparklesIcon,
      gradient: 'from-purple-500 to-pink-500',
      features: ['Instant character generation', 'Personality profiles', 'Custom appearances', 'Backstory creation']
    },
    {
      id: 'manual' as const,
      title: 'Manual Designer',
      description: 'Draw and design your character from scratch',
      icon: PencilIcon,
      gradient: 'from-blue-500 to-cyan-500',
      features: ['Full creative control', 'Drawing tools', 'Template outlines', 'Custom details']
    }
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="flex justify-between items-center p-6 border-b">
                  <Dialog.Title className="text-2xl font-bold text-gray-900">
                    {selectedMethod ? 'Create Your Character' : 'Choose Creation Method'}
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {!selectedMethod ? (
                      <motion.div
                        key="method-selection"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                      >
                        {creationMethods.map((method) => {
                          const IconComponent = method.icon;
                          return (
                            <motion.button
                              key={method.id}
                              onClick={() => setSelectedMethod(method.id)}
                              className="group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105"
                              whileHover={{ y: -5 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className={`absolute inset-0 bg-gradient-to-br ${method.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                              <div className="relative">
                                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${method.gradient} text-white mb-6`}>
                                  <IconComponent className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                  {method.title}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                  {method.description}
                                </p>
                                <ul className="space-y-2">
                                  {method.features.map((feature, index) => (
                                    <li key={index} className="flex items-center text-sm text-gray-600">
                                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="creation-flow"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <div className="mb-4">
                          <button
                            onClick={() => setSelectedMethod(null)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            ← Back to method selection
                          </button>
                        </div>
                        
                        {selectedMethod === 'ai' && <AICharacterGenerator onClose={handleClose} />}
                        {selectedMethod === 'manual' && <ManualCharacterDesigner onClose={handleClose} />}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CharacterCreationModal;
