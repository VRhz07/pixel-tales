import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface Character {
  id: string;
  name: string;
  imageUrl: string;
  tags: string[];
  category: string;
}

interface CharacterLibraryProps {
  onClose: () => void;
  onSelectCharacter: (character: Character) => void;
}

const CharacterLibrary = ({ onClose, onSelectCharacter }: CharacterLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock character data
  const characters: Character[] = [
    {
      id: '1',
      name: 'Brave Knight',
      imageUrl: '🛡️',
      tags: ['brave', 'hero', 'medieval'],
      category: 'heroes'
    },
    {
      id: '2',
      name: 'Friendly Dragon',
      imageUrl: '🐉',
      tags: ['friendly', 'magical', 'fantasy'],
      category: 'creatures'
    },
    {
      id: '3',
      name: 'Wise Wizard',
      imageUrl: '🧙‍♂️',
      tags: ['wise', 'magical', 'mentor'],
      category: 'heroes'
    },
    {
      id: '4',
      name: 'Curious Cat',
      imageUrl: '🐱',
      tags: ['curious', 'playful', 'animal'],
      category: 'animals'
    },
    {
      id: '5',
      name: 'Space Explorer',
      imageUrl: '👨‍🚀',
      tags: ['brave', 'explorer', 'space'],
      category: 'heroes'
    },
    {
      id: '6',
      name: 'Magical Unicorn',
      imageUrl: '🦄',
      tags: ['magical', 'pure', 'fantasy'],
      category: 'creatures'
    },
    {
      id: '7',
      name: 'Pirate Captain',
      imageUrl: '🏴‍☠️',
      tags: ['adventurous', 'sea', 'treasure'],
      category: 'heroes'
    },
    {
      id: '8',
      name: 'Forest Fairy',
      imageUrl: '🧚‍♀️',
      tags: ['magical', 'nature', 'helpful'],
      category: 'creatures'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Characters', count: characters.length },
    { id: 'heroes', name: 'Heroes', count: characters.filter(c => c.category === 'heroes').length },
    { id: 'creatures', name: 'Creatures', count: characters.filter(c => c.category === 'creatures').length },
    { id: 'animals', name: 'Animals', count: characters.filter(c => c.category === 'animals').length }
  ];

  const filteredCharacters = characters.filter(character => {
    const matchesSearch = character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         character.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || character.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    Character Library
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6">
                  {/* Search Bar */}
                  <div className="relative mb-6">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search characters..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Category Filters */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category.name} ({category.count})
                      </button>
                    ))}
                  </div>

                  {/* Character Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
                    {filteredCharacters.map((character, index) => (
                      <motion.button
                        key={character.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onSelectCharacter(character)}
                        className="group p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200"
                      >
                        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                          {character.imageUrl}
                        </div>
                        <h3 className="text-sm font-medium text-gray-800 mb-1">
                          {character.name}
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {character.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </motion.button>
                    ))}

                    {/* Create New Character Button */}
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: filteredCharacters.length * 0.05 }}
                      className="group p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center justify-center"
                    >
                      <PlusIcon className="h-8 w-8 text-gray-400 group-hover:text-blue-500 mb-2" />
                      <span className="text-sm text-gray-600 group-hover:text-blue-600">
                        Create New
                      </span>
                    </motion.button>
                  </div>

                  {filteredCharacters.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🔍</div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        No characters found
                      </h3>
                      <p className="text-gray-600">
                        Try adjusting your search or create a new character
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {filteredCharacters.length} characters available
                    </p>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CharacterLibrary;
