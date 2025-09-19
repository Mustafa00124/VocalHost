import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { AGENT_CONFIGS, getAgentConfig } from './agentConfig';
import AgentSelector from './AgentSelector';
import PhonePanel from './PhonePanel';
import LeftScreenPanel from './LeftScreenPanel';
import TipCards from './TipCards';
import { DemoStateProvider } from './state/demoStateProvider';
// WebSocket import removed - using HTTP API
import { useAgentSync } from './hooks/useAgentSync';

interface DemoWidgetProps {
  className?: string;
}

const DemoWidget: React.FC<DemoWidgetProps> = ({ className = '' }) => {
  console.log("🎯 DemoWidget rendering...");
  const { theme } = useTheme();
  console.log("🎯 DemoWidget theme:", theme);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState('restaurant');
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  
  console.log("🎯 DemoWidget state:", { isExpanded, currentAgentId, isConnected });

  console.log("🎯 Getting agent config for:", currentAgentId);
  const currentAgent = getAgentConfig(currentAgentId);
  console.log("🎯 Current agent:", currentAgent);
  
  const agentList = AGENT_CONFIGS.map(agent => ({
    id: agent.id,
    name: agent.name,
    emoji: agent.emoji
  }));
  console.log("🎯 Agent list:", agentList);

  const handleTryDemo = () => {
    setIsExpanded(true);
  };

  const handleAgentChange = (agentId: string) => {
    setCurrentAgentId(agentId);
    // Reset call state when switching agents
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setCallDuration(0);
    setCallStartTime(null);
    
    // Notify WebSocket of agent change
    // Agent type sync removed - using HTTP API
  };

  if (!currentAgent) {
    console.log("🚨 No current agent found for ID:", currentAgentId);
    return null;
  }

  console.log("🎯 Rendering DemoWidget with agent:", currentAgent.name);

  return (
    <DemoStateProvider>
      <DemoWidgetContent 
        className={className}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        currentAgentId={currentAgentId}
        isConnected={isConnected}
        isListening={isListening}
        isSpeaking={isSpeaking}
        callDuration={callDuration}
        callStartTime={callStartTime}
        setIsConnected={setIsConnected}
        setIsListening={setIsListening}
        setIsSpeaking={setIsSpeaking}
        setCallDuration={setCallDuration}
        setCallStartTime={setCallStartTime}
        handleAgentChange={handleAgentChange}
        handleTryDemo={handleTryDemo}
        currentAgent={currentAgent}
        agentList={agentList}
      />
    </DemoStateProvider>
  );
};

// Separate component that can use hooks inside the provider
const DemoWidgetContent: React.FC<{
  className: string;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  currentAgentId: string;
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  callDuration: number;
  callStartTime: Date | null;
  setIsConnected: (connected: boolean) => void;
  setIsListening: (listening: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setCallDuration: (duration: number) => void;
  setCallStartTime: (time: Date | null) => void;
  handleAgentChange: (agentId: string) => void;
  handleTryDemo: () => void;
  currentAgent: any;
  agentList: any[];
}> = ({
  className,
  isExpanded,
  setIsExpanded,
  currentAgentId,
  isConnected,
  isListening,
  isSpeaking,
  callDuration,
  callStartTime,
  setIsConnected,
  setIsListening,
  setIsSpeaking,
  setCallDuration,
  setCallStartTime,
  handleAgentChange,
  handleTryDemo,
  currentAgent,
  agentList
}) => {
  const { theme } = useTheme();
  
  // Now we can safely use the hook inside the provider
  console.log("🎯 Initializing agent sync...");
  useAgentSync();
  console.log("🎯 Agent sync initialized");

  // Simulate call behavior
  useEffect(() => {
    if (isListening) {
      // Simulate AI speaking after user starts
      const speakingTimeout = setTimeout(() => {
        // This would need to be passed as a prop or managed differently
        console.log("🎯 Simulating AI speaking...");
      }, 2000);

      return () => clearTimeout(speakingTimeout);
    }
  }, [isListening]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening && callStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
        console.log("🎯 Call duration:", duration);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening, callStartTime]);

  return (
    <motion.div 
      className={`fixed bottom-6 right-6 z-50 ${className}`}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1 }}
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          // Collapsed State - Try Demo Button
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleTryDemo}
            className="flex flex-col items-center space-y-2 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Glow Ring Animation */}
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse" />
            
            {/* Phone Icon */}
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-lg">
              <span className="text-2xl">📞</span>
            </div>
            
            {/* Label */}
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Interactive Demo
            </span>
          </motion.button>
        ) : (
          // Expanded State - Mini Dashboard
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative"
          >
            {/* Dashboard Container */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="w-full max-w-7xl max-h-[80vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl relative">
                {/* Background Image */}
                <div 
                  className="absolute inset-0 rounded-2xl bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${currentAgent.background})`,
                    filter: 'blur(1px) brightness(0.8)',
                    opacity: 0.9
                  }}
                />
                
                {/* Content Overlay */}
                <div className="relative z-10 flex-1 flex flex-col p-6">
                  {/* Top Bar - Agent Selector */}
                  <div className="mb-6">
                    <AgentSelector
                      currentAgentId={currentAgentId}
                      onAgentChange={handleAgentChange}
                      agents={agentList}
                    />
                  </div>

                  {/* Main Content Area */}
                  <div className="flex gap-6 items-start">
                    {/* Left Side - Computer Monitor */}
                    <div className="flex-1">
                      <LeftScreenPanel
                        screens={currentAgent.leftScreens}
                        agentName={currentAgent.name}
                      />
                    </div>

                    {/* Center - Phone Panel */}
                    <div>
                      <PhonePanel
                        agentName={currentAgent.phoneName}
                        agentAvatar={currentAgent.phoneAvatar}
                        agentType={currentAgentId}
                        isConnected={isConnected}
                        isListening={isListening}
                        isSpeaking={isSpeaking}
                        callDuration={callDuration}
                        onCallStart={() => {
                          console.log('📞 Call started');
                          setIsConnected(true);
                          setIsListening(true);
                          setCallStartTime(new Date());
                        }}
                        onCallEnd={() => {
                          console.log('📞 Call ended');
                          setIsConnected(false);
                          setIsListening(false);
                          setIsSpeaking(false);
                          setCallDuration(0);
                          setCallStartTime(null);
                        }}
                        onMuteToggle={(muted) => {
                          console.log('🔇 Mute toggled:', muted);
                        }}
                      />
                    </div>

                    {/* Right Side - Third Column */}
                    <div className="w-80 flex-shrink-0 flex flex-col gap-4">
                      {/* Agent Description Box */}
                      <div className={`p-4 rounded-lg border backdrop-blur-md ${
                        theme === 'dark' 
                          ? 'bg-gray-800/30 border-gray-600/50 text-black' 
                          : 'bg-white/30 border-gray-200/50 text-black'
                      }`}>
                        <h3 className="text-lg font-semibold mb-2">{currentAgent.name}</h3>
                        <p className="text-sm mb-2">{currentAgent.description}</p>
                        <p className="text-xs text-black">
                          This demo shows how our AI voice assistant integrates with your business systems. 
                          Watch the phone simulate real conversations while the computer monitor displays 
                          your actual business data being updated in real-time.
                        </p>
                      </div>

                      {/* Tips Box */}
                      <div className="h-48">
                        <TipCards tips={currentAgent.tips} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Floating Collapse Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setIsExpanded(false)}
              className={`fixed bottom-6 right-6 z-[100] px-4 py-2 rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-800/90 text-white border border-gray-600 hover:bg-gray-700/90'
                  : 'bg-white/90 text-gray-800 border border-gray-200 hover:bg-gray-50/90'
              }`}
              title="Collapse demo"
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Collapse</span>
                <span className="text-lg">📞</span>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DemoWidget;