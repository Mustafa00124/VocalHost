import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface TipCardsProps {
  tips: string[];
}

const TipCards: React.FC<TipCardsProps> = ({ tips }) => {
  const { theme } = useTheme();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Auto-rotate tips
  useEffect(() => {
    if (tips.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % tips.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [tips]);

  return (
    <div className={`w-full h-full p-4 rounded-lg border backdrop-blur-md ${
      theme === 'dark' 
        ? 'bg-gray-800/30 border-gray-600/50' 
        : 'bg-white/30 border-gray-200/50'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        Try These Phrases
      </h3>
      
      {/* Current Tip */}
      <motion.div
        key={currentTipIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex items-start space-x-3"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          theme === 'dark'
            ? 'bg-primary-500 text-white'
            : 'bg-primary-100 text-primary-600'
        }`}>
          💡
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Try saying:
          </p>
          <p className={`text-sm mt-1 ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
          }`}>
            "{tips[currentTipIndex]}"
          </p>
        </div>
      </motion.div>

      {/* Navigation Dots */}
      {tips.length > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {tips.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTipIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentTipIndex === index
                  ? theme === 'dark'
                    ? 'bg-primary-400'
                    : 'bg-primary-500'
                  : theme === 'dark'
                  ? 'bg-gray-600'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TipCards;
