import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, SparklesIcon, PencilIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreationStore } from '../../stores/creationStore';
import AIAssistedCreation from './AIAssistedCreation';
import ManualCreation from './ManualCreation';
import TemplateCreation from './TemplateCreation';

interface StoryCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CreationMethod = 'ai' | 'manual' | 'template' | null;

const StoryCreationModal = ({ isOpen, onClose }: StoryCreationModalProps) => {
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
      title: 'AI-Assisted Creation',
      description: 'Let AI help you create amazing stories from your ideas',
      icon: SparklesIcon,
      gradient: 'from-purple-500 to-pink-500',
      hoverGradient: 'from-purple-600 to-pink-600'
    },
    {
      id: 'manual' as const,
      title: 'Manual Creation',
      description: 'Create your story from scratch with full creative control',
      icon: PencilIcon,
      gradient: 'from-blue-500 to-cyan-500',
      hoverGradient: 'from-blue-600 to-cyan-600'
    },
    {
      id: 'template' as const,
      title: 'Template-Based Creation',
      description: 'Start with proven story templates and make them your own',
      icon: DocumentTextIcon,
      gradient: 'from-green-500 to-emerald-500',
      hoverGradient: 'from-green-600 to-emerald-600'
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
                    {selectedMethod ? 'Create Your Story' : 'Choose Creation Method'}
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
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                      >
                        {creationMethods.map((method) => {
                          const IconComponent = method.icon;
                          return (
                            <motion.button
                              key={method.id}
                              onClick={() => setSelectedMethod(method.id)}
                              className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105"
                              whileHover={{ y: -5 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className={`absolute inset-0 bg-gradient-to-br ${method.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                              <div className="relative">
                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${method.gradient} text-white mb-4`}>
                                  <IconComponent className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                  {method.title}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                  {method.description}
                                </p>
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
                        
                        {selectedMethod === 'ai' && <AIAssistedCreation onClose={handleClose} />}
                        {selectedMethod === 'manual' && <ManualCreation onClose={handleClose} />}
                        {selectedMethod === 'template' && <TemplateCreation onClose={handleClose} />}
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

export default StoryCreationModal;
