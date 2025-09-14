import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import type { LeftScreen } from './agentConfig';
import Calendar from './components/Calendar';
import CRM from './components/CRM';
import Shopping from './components/Shopping';

interface LeftScreenPanelProps {
  screens: LeftScreen[];
  agentName: string;
}

const LeftScreenPanel: React.FC<LeftScreenPanelProps> = ({ screens, agentName }) => {
  const { theme } = useTheme();
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const currentScreen = screens[currentScreenIndex];


  const renderScreenContent = () => {
    // Extract agent type from agent name
    const getAgentType = (name: string) => {
      if (name.toLowerCase().includes('restaurant')) return 'restaurant';
      if (name.toLowerCase().includes('salon')) return 'salon';
      if (name.toLowerCase().includes('dentist') || name.toLowerCase().includes('dental')) return 'dentist';
      if (name.toLowerCase().includes('support')) return 'support';
      if (name.toLowerCase().includes('ecommerce') || name.toLowerCase().includes('shirt')) return 'ecommerce';
      return 'restaurant'; // default
    };

    switch (currentScreen.type) {
      case 'calendar':
        return <Calendar agentType={getAgentType(agentName)} />;
      case 'crm':
        return <CRM agentType={getAgentType(agentName)} />;
      case 'shopping':
        return <Shopping agentType={getAgentType(agentName)} />;
      case 'gallery':
        return <GalleryScreen data={currentScreen.data} />;
      case 'tickets':
        return <TicketsScreen data={currentScreen.data} />;
      default:
        return <div>Unknown screen type</div>;
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Monitor Frame */}
      <div className={`relative rounded-t-2xl overflow-hidden shadow-2xl border-2 border-black ${
        theme === 'dark' 
          ? 'bg-gray-800' 
          : 'bg-gray-100'
      }`}>
        {/* Monitor Header */}
        <div className={`px-4 py-3 border-b ${
          theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {agentName} - {currentScreen.title}
              </span>
            </div>
            
          </div>
        </div>

        {/* Screen Content */}
        <div className="p-4 h-80 overflow-y-auto">
          {/* Internal Navigation for Multi-Screen Agents */}
          {screens.length > 1 && (
            <div className="mb-4">
              <div className="flex space-x-2">
                {screens.map((screen, index) => (
                  <button
                    key={screen.id}
                    onClick={() => setCurrentScreenIndex(index)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      currentScreenIndex === index
                        ? theme === 'dark'
                          ? 'bg-primary-500 text-white'
                          : 'bg-primary-100 text-primary-700'
                        : theme === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {screen.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreenIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderScreenContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Monitor Stand */}
      <div className="flex justify-center">
        <div className={`w-32 h-8 rounded-b-2xl ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
        }`}></div>
      </div>
      
      {/* Monitor Base */}
      <div className="flex justify-center">
        <div className={`w-40 h-4 rounded-b-lg ${
          theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
        }`}></div>
      </div>
    </div>
  );
};



// Gallery Screen Component
const GalleryScreen: React.FC<{ data: any }> = ({ data }) => {
  const { theme } = useTheme();
  
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {data.featured}
        </h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {data.products?.map((product: any, index: number) => (
          <div key={index} className={`p-3 rounded-lg border ${
            theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
          }`}>
            <div className="w-full h-24 bg-gray-200 rounded mb-2 flex items-center justify-center">
              <span className="text-gray-500 text-sm">Product Image</span>
            </div>
            <div className="font-medium">{product.name}</div>
            <div className="text-sm text-gray-500">{product.price}</div>
            <div className={`text-xs ${
              product.inStock ? 'text-green-600' : 'text-red-600'
            }`}>
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </div>
          </div>
        ))}
      </div>
      
      {/* Cart Summary */}
      {data.cart && (
        <div className={`p-4 rounded-lg ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Cart ({data.cart.itemCount} items)
          </h4>
          <div className="space-y-1">
            {data.cart.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.product} x{item.quantity}</span>
                <span>{item.price}</span>
              </div>
            ))}
            <div className="border-t pt-1 font-semibold">
              Total: {data.cart.total}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Tickets Screen Component
const TicketsScreen: React.FC<{ data: any }> = ({ data }) => {
  const { theme } = useTheme();
  
  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Support Tickets
      </h3>
      
      <div className="space-y-3">
        {data.tickets?.map((ticket: any, index: number) => (
          <div key={index} className={`p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <div className="font-medium">{ticket.subject}</div>
              <span className={`px-2 py-1 rounded text-xs ${
                ticket.status === 'Open' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : ticket.status === 'In Progress'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {ticket.status}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {ticket.id} • Priority: {ticket.priority}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeftScreenPanel;
