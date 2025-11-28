import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface TemplateCreationProps {
  onClose: () => void;
}

interface Template {
  id: string;
  title: string;
  description: string;
  preview: string;
  category: string;
  fields: TemplateField[];
}

interface TemplateField {
  id: string;
  type: 'text' | 'select' | 'drag-drop';
  label: string;
  placeholder?: string;
  options?: string[];
  required: boolean;
}

const TemplateCreation = ({ onClose }: TemplateCreationProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateData, setTemplateData] = useState<Record<string, any>>({});

  const categories = [
    {
      id: 'fairy-tale',
      name: 'Fairy Tale Remix',
      description: 'Put your own spin on classic fairy tales',
      icon: '🏰',
      templates: [
        {
          id: 'cinderella-remix',
          title: 'Modern Cinderella',
          description: 'Cinderella in the modern world',
          preview: '👠',
          category: 'fairy-tale',
          fields: [
            { id: 'protagonist', type: 'text', label: 'Main Character Name', placeholder: 'e.g., Ella', required: true },
            { id: 'setting', type: 'select', label: 'Setting', options: ['Modern City', 'Space Station', 'Underwater Kingdom', 'Digital World'], required: true },
            { id: 'magic-item', type: 'text', label: 'Magic Item', placeholder: 'e.g., Smart Phone, Hover Shoes', required: true },
            { id: 'obstacle', type: 'text', label: 'Main Challenge', placeholder: 'What prevents the happy ending?', required: true }
          ]
        },
        {
          id: 'three-bears',
          title: 'Goldilocks Adventure',
          description: 'A new take on the three bears story',
          preview: '🐻',
          category: 'fairy-tale',
          fields: [
            { id: 'visitor', type: 'text', label: 'Visitor Name', placeholder: 'e.g., Goldilocks', required: true },
            { id: 'house-owners', type: 'select', label: 'House Owners', options: ['Three Bears', 'Three Robots', 'Three Aliens', 'Three Dragons'], required: true },
            { id: 'discovery', type: 'text', label: 'What They Discover', placeholder: 'e.g., porridge, chairs, beds', required: true }
          ]
        }
      ]
    },
    {
      id: 'mad-libs',
      name: 'Mad Libs Adventure',
      description: 'Fill in the blanks to create silly stories',
      icon: '🎭',
      templates: [
        {
          id: 'space-adventure',
          title: 'Space Adventure',
          description: 'A wild journey through space',
          preview: '🚀',
          category: 'mad-libs',
          fields: [
            { id: 'adjective1', type: 'text', label: 'Adjective', placeholder: 'e.g., sparkly', required: true },
            { id: 'noun1', type: 'text', label: 'Noun', placeholder: 'e.g., banana', required: true },
            { id: 'verb1', type: 'text', label: 'Verb', placeholder: 'e.g., dancing', required: true },
            { id: 'color', type: 'text', label: 'Color', placeholder: 'e.g., purple', required: true },
            { id: 'animal', type: 'text', label: 'Animal', placeholder: 'e.g., elephant', required: true }
          ]
        },
        {
          id: 'school-day',
          title: 'Crazy School Day',
          description: 'The most unusual day at school',
          preview: '🏫',
          category: 'mad-libs',
          fields: [
            { id: 'teacher-name', type: 'text', label: 'Teacher Name', placeholder: 'e.g., Mrs. Giggles', required: true },
            { id: 'silly-subject', type: 'text', label: 'Silly Subject', placeholder: 'e.g., Underwater Basket Weaving', required: true },
            { id: 'weird-food', type: 'text', label: 'Weird Food', placeholder: 'e.g., chocolate broccoli', required: true },
            { id: 'superpower', type: 'text', label: 'Superpower', placeholder: 'e.g., flying', required: true }
          ]
        }
      ]
    },
    {
      id: 'photo-story',
      name: 'Photo Story',
      description: 'Create stories around your photos',
      icon: '📸',
      templates: [
        {
          id: 'family-adventure',
          title: 'Family Adventure',
          description: 'Turn family photos into an adventure story',
          preview: '👨‍👩‍👧‍👦',
          category: 'photo-story',
          fields: [
            { id: 'photo-upload', type: 'drag-drop', label: 'Upload Photo', required: true },
            { id: 'adventure-type', type: 'select', label: 'Adventure Type', options: ['Treasure Hunt', 'Time Travel', 'Magic Quest', 'Space Mission'], required: true },
            { id: 'special-power', type: 'text', label: 'Family Special Power', placeholder: 'e.g., can talk to animals', required: true }
          ]
        }
      ]
    },
    {
      id: 'choose-adventure',
      name: 'Choose Your Adventure',
      description: 'Interactive stories with multiple paths',
      icon: '🛤️',
      templates: [
        {
          id: 'mystery-mansion',
          title: 'Mystery Mansion',
          description: 'Explore a spooky mansion with multiple endings',
          preview: '🏚️',
          category: 'choose-adventure',
          fields: [
            { id: 'detective-name', type: 'text', label: 'Detective Name', placeholder: 'e.g., Detective Curious', required: true },
            { id: 'mystery-object', type: 'text', label: 'Mysterious Object', placeholder: 'e.g., glowing key', required: true },
            { id: 'first-choice', type: 'select', label: 'First Choice Location', options: ['Basement', 'Attic', 'Library', 'Kitchen'], required: true }
          ]
        }
      ]
    }
  ];

  const handleFieldChange = (fieldId: string, value: any) => {
    setTemplateData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const generateStory = () => {
    console.log('Generating story with data:', templateData);
    // Here you would generate the story based on the template and data
    onClose();
  };

  const renderField = (field: TemplateField) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            value={templateData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required={field.required}
          />
        );
      
      case 'select':
        return (
          <select
            value={templateData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required={field.required}
          >
            <option value="">Choose an option...</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      case 'drag-drop':
        return (
          <div className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-green-500 transition-colors">
            <div className="text-4xl mb-2">📸</div>
            <p className="text-gray-600">Drag and drop a photo here</p>
            <p className="text-sm text-gray-500 mt-1">or click to browse</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!selectedCategory ? (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Choose a Template Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="p-6 border border-gray-200 rounded-xl text-left hover:border-green-500 hover:shadow-md transition-all duration-200"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-3xl mb-3">{category.icon}</div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    {category.name}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {category.description}
                  </p>
                  <div className="text-xs text-green-600 mt-2">
                    {category.templates.length} templates available
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : !selectedTemplate ? (
          <motion.div
            key="templates"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center mb-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-green-600 hover:text-green-800 text-sm font-medium mr-4"
              >
                <ChevronLeftIcon className="h-4 w-4 inline mr-1" />
                Back to categories
              </button>
              <h3 className="text-xl font-semibold text-gray-800">
                {categories.find(c => c.id === selectedCategory)?.name} Templates
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories
                .find(c => c.id === selectedCategory)
                ?.templates.map((template) => (
                  <motion.button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className="p-4 border border-gray-200 rounded-xl text-left hover:border-green-500 hover:shadow-md transition-all duration-200"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-2xl mb-3">{template.preview}</div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      {template.title}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {template.description}
                    </p>
                  </motion.button>
                ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="template-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center mb-6">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-green-600 hover:text-green-800 text-sm font-medium mr-4"
              >
                <ChevronLeftIcon className="h-4 w-4 inline mr-1" />
                Back to templates
              </button>
              <div className="flex items-center">
                <div className="text-2xl mr-3">{selectedTemplate.preview}</div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {selectedTemplate.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {selectedTemplate.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {selectedTemplate.fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-6 border-t mt-8">
              <button
                onClick={generateStory}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Create Story
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TemplateCreation;
