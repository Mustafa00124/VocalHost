import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

interface AgentSelectorProps {
  currentAgentId: string;
  onAgentChange: (agentId: string) => void;
  agents: Array<{ id: string; name: string; emoji: string }>;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
  currentAgentId,
  onAgentChange,
  agents
}) => {
  const { theme } = useTheme();
  const currentIndex = agents.findIndex(agent => agent.id === currentAgentId);
  
  // All agents use consistent whitish glassmorphic style
  const colors = {
    bg: 'from-gray-100/30 to-gray-200/30',
    border: 'border-gray-300/50',
    text: 'text-gray-900'
  };
  
  const goToPrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : agents.length - 1;
    onAgentChange(agents[prevIndex].id);
  };
  
  const goToNext = () => {
    const nextIndex = currentIndex < agents.length - 1 ? currentIndex + 1 : 0;
    onAgentChange(agents[nextIndex].id);
  };

  return (
    <div className="flex items-center justify-center space-x-4">
      {/* Previous Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={goToPrevious}
        className={`p-2 rounded-full transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800'
        }`}
        title="Previous agent"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </motion.button>

      {/* Current Agent Display */}
      <motion.div
        key={currentAgentId}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        className={`flex items-center space-x-3 px-4 py-2 rounded-lg border backdrop-blur-md shadow-lg bg-gradient-to-r ${colors.bg} ${colors.border} ${colors.text}`}
      >
        <span className="text-2xl">{agents[currentIndex]?.emoji}</span>
        <div>
          <h3 className="font-semibold text-lg">{agents[currentIndex]?.name}</h3>
          <p className="text-sm">
            {currentIndex + 1} of {agents.length}
          </p>
        </div>
      </motion.div>

      {/* Next Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={goToNext}
        className={`p-2 rounded-full transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800'
        }`}
        title="Next agent"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

export default AgentSelector;
