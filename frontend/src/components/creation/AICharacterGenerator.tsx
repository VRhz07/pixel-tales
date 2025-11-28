import { useState } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useCreationStore } from '../../stores/creationStore';

interface AICharacterGeneratorProps {
  onClose: () => void;
}

const AICharacterGenerator = ({ onClose }: AICharacterGeneratorProps) => {
  const {
    characterName,
    characterDescription,
    characterPersonality,
    updateCharacterName,
    updateCharacterDescription,
    togglePersonalityTrait,
    isGenerating,
    setIsGenerating,
    addSkillPoints,
    updateAchievementProgress
  } = useCreationStore();

  const [generatedCharacter, setGeneratedCharacter] = useState<any>(null);

  const personalityTraits = [
    'Brave', 'Funny', 'Shy', 'Smart', 'Kind', 'Curious',
    'Adventurous', 'Creative', 'Loyal', 'Energetic', 'Wise', 'Playful',
    'Determined', 'Gentle', 'Mysterious', 'Cheerful', 'Protective', 'Imaginative'
  ];

  const appearancePrompts = [
    'Hair color and style',
    'Eye color',
    'Clothing style',
    'Special features (glasses, freckles, etc.)',
    'Height and build',
    'Accessories or props'
  ];

  const generateCharacter = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock generated character
    const mockCharacter = {
      id: Date.now().toString(),
      name: characterName || 'Generated Character',
      imageUrl: '🧙‍♂️', // This would be an actual generated image
      description: characterDescription,
      personality: characterPersonality,
      backstory: `${characterName} is a ${characterPersonality.join(', ')} character who loves adventure and helping others. They have a mysterious past that drives them to seek new experiences and make lasting friendships.`,
      abilities: ['Magic spells', 'Problem solving', 'Leadership'],
      weaknesses: ['Overconfident', 'Trusts too easily'],
      goals: ['Find their true purpose', 'Help others in need', 'Master their abilities']
    };
    
    setGeneratedCharacter(mockCharacter);
    
    // Add skill points and update achievements
    addSkillPoints('character', 15);
    updateAchievementProgress('character-creator', 1);
    
    setIsGenerating(false);
  };

  const regenerateCharacter = () => {
    setGeneratedCharacter(null);
    generateCharacter();
  };

  const saveCharacter = () => {
    console.log('Saving character:', generatedCharacter);
    // Here you would save the character to the library
    onClose();
  };

  if (isGenerating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
          <SparklesIcon className="h-8 w-8 text-white animate-spin" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Creating your character...</h3>
        <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </div>
        <p className="text-gray-600 mt-4">Bringing your character to life...</p>
      </motion.div>
    );
  }

  if (generatedCharacter) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Meet Your Character!</h3>
          <p className="text-gray-600">Here's what AI created based on your description</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="text-8xl mb-4">{generatedCharacter.imageUrl}</div>
            <h4 className="text-2xl font-bold text-gray-800 mb-2">
              {generatedCharacter.name}
            </h4>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {generatedCharacter.personality.map((trait: string) => (
                <span
                  key={trait}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold text-gray-800 mb-2">Backstory</h5>
              <p className="text-gray-600 text-sm leading-relaxed">
                {generatedCharacter.backstory}
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-gray-800 mb-2">Special Abilities</h5>
              <ul className="space-y-1">
                {generatedCharacter.abilities.map((ability: string, index: number) => (
                  <li key={index} className="text-gray-600 text-sm flex items-center">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2" />
                    {ability}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-gray-800 mb-2">Goals</h5>
              <ul className="space-y-1">
                {generatedCharacter.goals.map((goal: string, index: number) => (
                  <li key={index} className="text-gray-600 text-sm flex items-center">
                    <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-2" />
                    {goal}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-gray-800 mb-2">Challenges</h5>
              <ul className="space-y-1">
                {generatedCharacter.weaknesses.map((weakness: string, index: number) => (
                  <li key={index} className="text-gray-600 text-sm flex items-center">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2" />
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={regenerateCharacter}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Regenerate
          </button>
          <button
            onClick={saveCharacter}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
          >
            Save to Library
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Describe Your Character</h3>
        <p className="text-gray-600">Tell us about your character and we'll bring them to life!</p>
      </div>

      <div className="space-y-6">
        {/* Character Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Character Name
          </label>
          <input
            type="text"
            value={characterName}
            onChange={(e) => updateCharacterName(e.target.value)}
            placeholder="e.g., Luna the Explorer"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Appearance Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Appearance Description
          </label>
          <textarea
            value={characterDescription}
            onChange={(e) => updateCharacterDescription(e.target.value)}
            placeholder="Describe how your character looks..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-2">Helpful prompts:</p>
            <div className="flex flex-wrap gap-2">
              {appearancePrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    const currentText = characterDescription;
                    const newText = currentText ? `${currentText}, ${prompt.toLowerCase()}` : prompt.toLowerCase();
                    updateCharacterDescription(newText);
                  }}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                >
                  + {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Personality Traits */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Personality Traits
          </label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {personalityTraits.map((trait) => (
              <button
                key={trait}
                onClick={() => togglePersonalityTrait(trait)}
                className={`p-2 rounded-lg text-sm font-medium transition-all ${
                  characterPersonality.includes(trait)
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {trait}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Selected: {characterPersonality.length} traits
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={generateCharacter}
          disabled={!characterName.trim() || characterPersonality.length === 0}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SparklesIcon className="h-5 w-5 mr-2" />
          Generate Character
        </button>
      </div>
    </motion.div>
  );
};

export default AICharacterGenerator;
