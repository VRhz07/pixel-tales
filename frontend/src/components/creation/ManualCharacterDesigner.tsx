import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import DrawingCanvas from './DrawingCanvas';

interface ManualCharacterDesignerProps {
  onClose: () => void;
}

const ManualCharacterDesigner = ({ onClose }: ManualCharacterDesignerProps) => {
  const [characterName, setCharacterName] = useState('');
  const [characterTags, setCharacterTags] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);

  const characterTemplates = [
    {
      id: 'human-child',
      name: 'Human Child',
      preview: '👶',
      description: 'Basic human child outline'
    },
    {
      id: 'human-adult',
      name: 'Human Adult',
      preview: '👤',
      description: 'Adult human figure template'
    },
    {
      id: 'animal-cat',
      name: 'Cat',
      preview: '🐱',
      description: 'Cute cat character outline'
    },
    {
      id: 'animal-dog',
      name: 'Dog',
      preview: '🐶',
      description: 'Friendly dog character outline'
    },
    {
      id: 'fantasy-dragon',
      name: 'Dragon',
      preview: '🐉',
      description: 'Mythical dragon template'
    },
    {
      id: 'fantasy-unicorn',
      name: 'Unicorn',
      preview: '🦄',
      description: 'Magical unicorn outline'
    },
    {
      id: 'robot',
      name: 'Robot',
      preview: '🤖',
      description: 'Futuristic robot design'
    },
    {
      id: 'alien',
      name: 'Alien',
      preview: '👽',
      description: 'Extraterrestrial being'
    }
  ];

  const handleStartDrawing = () => {
    if (selectedTemplate) {
      setShowCanvas(true);
    }
  };

  const handleSaveCharacter = () => {
    console.log('Saving character:', {
      name: characterName,
      tags: characterTags.split(',').map(tag => tag.trim()),
      template: selectedTemplate
    });
    onClose();
  };

  if (showCanvas) {
    return <DrawingCanvas onClose={() => setShowCanvas(false)} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Design Your Character</h3>
        <p className="text-gray-600">Choose a template and customize it with your own drawings</p>
      </div>

      {/* Character Details */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Character Name
          </label>
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Enter character name..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={characterTags}
            onChange={(e) => setCharacterTags(e.target.value)}
            placeholder="e.g., brave, funny, magical"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Tags help organize and find your characters later
          </p>
        </div>
      </div>

      {/* Template Selection */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Choose a Template</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {characterTemplates.map((template) => (
            <motion.button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-3xl mb-2">{template.preview}</div>
              <h5 className="font-medium text-gray-800 text-sm mb-1">
                {template.name}
              </h5>
              <p className="text-xs text-gray-600">
                {template.description}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Template Preview */}
      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gray-50 rounded-xl p-6"
        >
          <h5 className="font-semibold text-gray-800 mb-3">Template Preview</h5>
          <div className="flex items-center space-x-4">
            <div className="text-6xl">
              {characterTemplates.find(t => t.id === selectedTemplate)?.preview}
            </div>
            <div>
              <h6 className="font-medium text-gray-800">
                {characterTemplates.find(t => t.id === selectedTemplate)?.name}
              </h6>
              <p className="text-sm text-gray-600 mb-3">
                {characterTemplates.find(t => t.id === selectedTemplate)?.description}
              </p>
              <button
                onClick={handleStartDrawing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Start Drawing
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Drawing Tools Info */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h5 className="font-semibold text-blue-800 mb-3">Drawing Tools Available</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-blue-700">Brush tools</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-blue-700">Color palette</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-blue-700">Shapes & lines</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-blue-700">Eraser tool</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <div className="text-sm text-gray-500">
          {selectedTemplate ? 'Template selected' : 'Select a template to continue'}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleSaveCharacter}
            disabled={!characterName.trim() || !selectedTemplate}
            className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BookmarkIcon className="h-4 w-4 mr-2" />
            Save Character
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ManualCharacterDesigner;
