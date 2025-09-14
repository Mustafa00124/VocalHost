import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { websocketClient } from './websocket/websocketClient';
import ChatInterface from './components/ChatInterface';

interface PhonePanelProps {
  agentName: string;
  agentAvatar: string;
  agentType: string;
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  callDuration: number;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onMuteToggle?: (muted: boolean) => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const PhonePanel: React.FC<PhonePanelProps> = ({
  agentName,
  agentAvatar,
  agentType,
  isConnected,
  isListening,
  isSpeaking,
  callDuration,
  onCallStart,
  onCallEnd,
  onMuteToggle
}) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAiMessage, setCurrentAiMessage] = useState('');
  const [showMessages, setShowMessages] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice-related state
  const [isMuted, setIsMuted] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize microphone access
  const initializeMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      streamRef.current = stream;
      console.log('🎤 Microphone access granted');
      return stream;
    } catch (error) {
      console.error('🎤 Microphone access denied:', error);
      return null;
    }
  };

  // Start voice recording
  const startRecording = async () => {
    if (!streamRef.current) {
      const stream = await initializeMicrophone();
      if (!stream) return;
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current!, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        sendAudioToBackend(audioBlob);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('🎤 Error starting recording:', error);
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      console.log('🎤 Recording stopped');
    }
  };

  // Send audio to backend
  const sendAudioToBackend = (audioBlob: Blob) => {
    if (!isMuted) {
      // Convert blob to base64 and send via WebSocket
      const reader = new FileReader();
      reader.onload = () => {
        const base64Audio = (reader.result as string).split(',')[1];
        websocketClient.sendMessage({
          type: 'voice_input',
          audio_data: base64Audio,
          format: 'webm'
        });
        console.log('🎤 Audio sent to backend');
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  // Handle call start/end
  const handleCallToggle = async () => {
    if (!isCallActive) {
      // Start call
      console.log('📞 Starting call...');
      setIsCallActive(true);
      onCallStart?.();
      
      // Initialize microphone and start recording
      await initializeMicrophone();
      startRecording();
      
      // Send start voice session message
      websocketClient.sendMessage({
        type: 'start_voice_session',
        agent_type: 'restaurant' // This should come from props
      });
    } else {
      // End call
      console.log('📞 Ending call...');
      setIsCallActive(false);
      onCallEnd?.();
      
      // Stop recording and cleanup
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Send stop voice session message
      websocketClient.sendMessage({
        type: 'stop_voice_session'
      });
    }
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    onMuteToggle?.(newMutedState);
    console.log('🔇 Mute toggled:', newMutedState);
  };

  // Send message function
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/demo/text/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          agent_type: agentType,
          session_id: 'chat-session'
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, agentMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `Error: ${data.message}`,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Connection error: ${error}`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (isSpeaking) {
      // Simulate AI response
      const aiMessages = [
        "Hello! I'd be happy to help you with a reservation. What date and time are you looking for?",
        "Let me check our availability for you...",
        "I have several times available. Would 7:30 PM work for you?",
        "Great! I can reserve a table for 4 people at 7:30 PM. Can I get your name and phone number?",
        "Perfect! Your reservation is confirmed for 7:30 PM for 4 people. We'll see you then!"
      ];
      
      const randomMessage = aiMessages[Math.floor(Math.random() * aiMessages.length)];
      setCurrentAiMessage(randomMessage);
      
      // Clear after 4 seconds
      setTimeout(() => {
        setCurrentAiMessage('');
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: randomMessage,
          sender: 'ai',
          timestamp: new Date()
        }]);
      }, 4000);
    }
  }, [isSpeaking]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Remove the early return - we'll show the message popup within the phone

  return (
    <div className="w-[250px] h-[450px] mx-auto">
      {/* Phone Frame */}
      <div className={`relative rounded-3xl p-4 shadow-2xl border-2 border-black h-full flex flex-col ${
        theme === 'dark' 
          ? 'bg-gray-900' 
          : 'bg-white'
      }`}>
        {/* Phone Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white">
              <span className="text-lg">{agentAvatar}</span>
            </div>
            <div>
              <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {agentName}
              </h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  isListening ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {isListening ? `In Call • ${formatDuration(callDuration)}` : 'Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area - Always present spacer, conditional content */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {showMessages && (
            <React.Fragment>
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs px-3 py-2 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-700 text-gray-100'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>


              {currentAiMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className={`max-w-xs px-3 py-2 rounded-2xl ${
                    theme === 'dark' ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{currentAiMessage}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse" />
                      <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </React.Fragment>
          )}
        </div>

        {/* Message Popup Interface */}
        {showChat && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-3xl flex items-center justify-center z-10">
            <div className="bg-white rounded-2xl w-[220px] h-[380px] flex flex-col shadow-2xl">
              {/* Message Header */}
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-800">Messages</span>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[160px] px-3 py-2 rounded-lg text-xs ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type message..."
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Call Control Buttons */}
        <div className="flex items-center justify-center space-x-4 py-4 flex-shrink-0">
          {/* Mute Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleMuteToggle}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : theme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
            }`}
          >
            {isMuted ? (
              // Muted icon with slash
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                <path d="M3.707 3.707a1 1 0 000 1.414L8.586 10l-4.879 4.879a1 1 0 101.414 1.414L10 11.414l4.879 4.879a1 1 0 001.414-1.414L11.414 10l4.879-4.879a1 1 0 00-1.414-1.414L10 8.586 5.121 3.707a1 1 0 00-1.414 0z" />
              </svg>
            ) : (
              // Unmuted icon
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            )}
          </motion.button>

          {/* Central Call Circle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCallToggle}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
              isCallActive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            animate={isCallActive ? { 
              boxShadow: [
                '0 0 0 0 rgba(239, 68, 68, 0.7)',
                '0 0 0 10px rgba(239, 68, 68, 0)',
                '0 0 0 0 rgba(239, 68, 68, 0)'
              ]
            } : {}}
            transition={{ 
              duration: 1.5, 
              repeat: isCallActive ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            {isCallActive ? (
              // End call icon (X)
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              // Start call icon (phone)
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            )}
          </motion.button>

          {/* Message Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowChat(!showChat)}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
              showChat
                ? 'bg-blue-500 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default PhonePanel;
