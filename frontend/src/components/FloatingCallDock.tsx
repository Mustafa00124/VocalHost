import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface FloatingCallDockProps {
  className?: string;
}

const FloatingCallDock: React.FC<FloatingCallDockProps> = ({ className = '' }) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [, setIsCurrentlySpeaking] = useState(false);
  const [, setCurrentAiResponse] = useState('');
  const [, setCurrentUserMessage] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  
  // Use refs to avoid stale closure issues in WebSocket handler
  const speakingRef = useRef(false);
  const currentAiResponseRef = useRef('');
  const currentUserMessageRef = useRef('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioWorkletNode = useRef<AudioWorkletNode | null>(null);

  // Audio queue for real-time streaming
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = async () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const backendHost = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
      const wsUrl = `${protocol}//${backendHost}/ws/voice-test`;
      
      // Check if backend is running first
      if (window.location.hostname === 'localhost' && backendHost === 'localhost:5000') {
        try {
          const response = await fetch('http://localhost:5000');
          console.log('✅ Backend is running, status:', response.status);
        } catch (error) {
          console.error('❌ Backend is not running:', error);
          setError('Backend is not running. Please start it first.');
          return;
        }
      }
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        setError(null);
        
        // Send initial start message
        const startMessage = {
          event: 'start',
          start: {
            streamSid: 'test_stream_' + Date.now()
          }
        };
        ws.send(JSON.stringify(startMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('Connection error. Please check if backend is running on port 5000.');
        setIsConnected(false);
      };

    } catch (err) {
      console.error('❌ Error connecting to WebSocket:', err);
      setError('Failed to connect. Please check your connection.');
    }
  };

  const handleWebSocketMessage = (data: any) => {
    if (data.event === 'media' && data.media?.payload) {
      // Handle incoming audio from the AI
      if (!speakingRef.current) {
        speakingRef.current = true;
        setIsCurrentlySpeaking(true);
      }
      playAudioChunk(data.media.payload);
    } else if (data.event === 'ai_transcript') {
      // Handle AI text transcription
      const text = data.text || '';
      currentAiResponseRef.current += text;
      setCurrentAiResponse(currentAiResponseRef.current);
    } else if (data.event === 'user_transcript') {
      // Handle user text transcription
      const text = data.text || '';
      currentUserMessageRef.current += text;
      setCurrentUserMessage(currentUserMessageRef.current);
    } else if (data.event === 'ai_response_complete') {
      // AI response is complete
      const finalText = (data.text ?? currentAiResponseRef.current).trim();
      if (finalText) {
        currentAiResponseRef.current = '';
        setCurrentAiResponse('');
      }
      // Reset speaking state with a delay
      setTimeout(() => {
        speakingRef.current = false;
        setIsCurrentlySpeaking(false);
      }, 500);
    } else if (data.event === 'user_response_complete') {
      // User response is complete
      const finalText = (data.text ?? currentUserMessageRef.current).trim();
      if (finalText) {
        currentUserMessageRef.current = '';
        setCurrentUserMessage('');
      }
    }
  };

  const playAudioChunk = (audioData: string) => {
    try {
      audioQueueRef.current.push(audioData);
      
      if (!isPlayingRef.current) {
        playNextChunk();
      }
    } catch (err) {
      console.error('❌ Error in playAudioChunk:', err);
    }
  };

  const playNextChunk = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);

    const audioData = audioQueueRef.current.shift()!;

    try {
      // Convert base64 to array buffer
      const binaryString = atob(audioData);
      const arrayBuffer = new ArrayBuffer(binaryString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }

      // Initialize Web Audio API if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Process PCM16 audio data directly
      const sampleRate = 24000;
      const numberOfChannels = 1;
      const length = arrayBuffer.byteLength / 2;
      
      if (length === 0) {
        setTimeout(() => playNextChunk(), 10);
        return;
      }
      
      const audioBuffer = audioContextRef.current.createBuffer(numberOfChannels, length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Convert PCM16 to float32 samples
      const pcm16Data = new Int16Array(arrayBuffer);
      for (let i = 0; i < pcm16Data.length; i++) {
        channelData[i] = pcm16Data[i] / 32768.0;
      }
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setTimeout(() => playNextChunk(), 10);
      };
      
      source.start();

    } catch (error) {
      setTimeout(() => playNextChunk(), 10);
    }
  };

  const startPCM16Capture = async () => {
    try {
      console.log('🎤 Starting PCM16 capture...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 8000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 8000
        });
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const bufferSize = 4096;
      const processor = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);
      
      processor.onaudioprocess = (event) => {
        if (isSpeaking || isMuted) {
          return;
        }
        
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Check if there's actual speech
        const rms = Math.sqrt(inputData.reduce((sum, val) => sum + val * val, 0) / inputData.length);
        const threshold = 0.01;
        
        if (rms < threshold) {
          return;
        }
        
        // Convert Float32 to PCM16
        const pcm16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcm16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        
        sendPCM16Audio(pcm16Data);
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      audioWorkletNode.current = processor as any;
      
      setIsListening(true);
      setCallStartTime(new Date());
      setCallDuration(0);
      
      // Clear any previous responses
      currentAiResponseRef.current = '';
      currentUserMessageRef.current = '';
      setCurrentAiResponse('');
      setCurrentUserMessage('');
      setIsCurrentlySpeaking(false);
      speakingRef.current = false;
      
    } catch (err) {
      console.error('❌ Error starting PCM16 capture:', err);
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const startListening = async () => {
    try {
      setError(null);
      
      if (!isConnected) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 8000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          } 
        });
        
        streamRef.current = stream;
        await connectWebSocket();
        
        setTimeout(() => {
          if (isConnected) {
            // Connection established, ready to start
          }
        }, 1000);
        
        return;
      }

      await startPCM16Capture();

    } catch (err) {
      console.error('Error starting microphone:', err);
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const stopListening = () => {
    if (audioWorkletNode.current) {
      audioWorkletNode.current.disconnect();
      audioWorkletNode.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsListening(false);
    setCallStartTime(null);
    setCallDuration(0);
  };

  const sendPCM16Audio = (pcm16Data: Int16Array) => {
    try {
      const uint8Array = new Uint8Array(pcm16Data.buffer);
      const base64Audio = btoa(String.fromCharCode(...uint8Array));
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const message = {
          event: 'media',
          media: {
            payload: base64Audio
          }
        };
        
        wsRef.current.send(JSON.stringify(message));
      }
    } catch (err) {
      console.error('❌ Error sending PCM16 audio:', err);
      setError('Failed to send audio. Please try again.');
    }
  };

  const sendTextMessage = () => {
    if (!textInput.trim()) return;
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        event: 'text_input',
        text: textInput.trim()
      };
      
      wsRef.current.send(JSON.stringify(message));
      setTextInput('');
      
      // Clear any previous AI response
      currentAiResponseRef.current = '';
      currentUserMessageRef.current = '';
      setCurrentAiResponse('');
      setCurrentUserMessage('');
      setIsCurrentlySpeaking(false);
      speakingRef.current = false;
    } else {
      setError('Not connected to server. Please try again.');
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    
    // Auto-collapse after disconnect
    setTimeout(() => {
      setIsExpanded(false);
    }, 2000);
  };

  const handleTryDemo = () => {
    setIsExpanded(true);
    if (!isConnected) {
      connectWebSocket();
    }
  };

  // Auto-collapse after inactivity
  useEffect(() => {
    if (isExpanded && !isConnected && !isListening) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 10000); // Auto-collapse after 10 seconds of inactivity
      
      return () => clearTimeout(timer);
    }
  }, [isExpanded, isConnected, isListening]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening && callStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
        setCallDuration(duration);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening, callStartTime]);

  const handleConnect = () => {
    if (isConnected) {
      disconnect();
    } else {
      connectWebSocket();
    }
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleTextMode = () => {
    setIsTextMode(!isTextMode);
  };

  const handleCall = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      className={`fixed bottom-6 right-6 z-50 ${className}`}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1 }}
    >
      {/* Main Dock */}
      <motion.div
        layout
        className={`backdrop-blur-sm shadow-2xl border transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-gray-800/95 border-gray-700' 
            : 'bg-white/95 border-gray-200'
        } ${
          isExpanded ? 'rounded-3xl px-6 py-6' : 'rounded-full p-4'
        }`}
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            // Collapsed State
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
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse" />
              
              {/* Phone Icon */}
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
                <span className="text-2xl">📞</span>
              </div>
              
              {/* Label */}
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Try Demo Now
              </span>
            </motion.button>
          ) : (
            // Expanded State - Vertical Layout
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center space-y-4"
            >
              {/* Header Section */}
              <div className="flex flex-col items-center space-y-2">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
                  <span className="text-3xl">🤖</span>
                </div>
                
                {/* Assistant Name */}
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  VocalHost Assistant
                </h3>
                
                {/* Status Line */}
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {isConnected 
                      ? isListening 
                        ? `Connected • ${formatDuration(callDuration)}`
                        : 'Connected • Ready'
                      : 'Disconnected'
                    }
                  </span>
                </div>
              </div>

              {/* Speaking Indicators */}
              <div className="flex items-center space-x-6">
                {/* User Speaking Indicator */}
                <div className="flex flex-col items-center space-y-1">
                  <motion.div
                    animate={isListening ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      isListening 
                        ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                        : 'bg-gray-400'
                    }`}
                    style={{
                      boxShadow: isListening ? '0 0 20px rgba(34, 197, 94, 0.5)' : 'none'
                    }}
                  />
                  <span className={`text-xs font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    You
                  </span>
                </div>
                
                {/* AI Speaking Indicator */}
                <div className="flex flex-col items-center space-y-1">
                  <motion.div
                    animate={isSpeaking ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      isSpeaking 
                        ? 'bg-blue-500 shadow-lg shadow-blue-500/50' 
                        : 'bg-gray-400'
                    }`}
                    style={{
                      boxShadow: isSpeaking ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none'
                    }}
                  />
                  <span className={`text-xs font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    AI
                  </span>
                </div>
              </div>

              {/* Text Mode Input */}
              {isTextMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full flex items-center space-x-2"
                >
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                    placeholder="Type your message..."
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <button
                    onClick={sendTextMessage}
                    disabled={!textInput.trim() || !isConnected}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      textInput.trim() && isConnected
                        ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-sm">📤</span>
                  </button>
                </motion.div>
              )}

              {/* Control Buttons */}
              <div className="flex items-center space-x-3">
                {/* Connect/Disconnect Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConnect}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 ${
                    isConnected
                      ? 'bg-red-500 hover:bg-red-600 hover:shadow-red-500/50'
                      : 'bg-green-500 hover:bg-green-600 hover:shadow-green-500/50'
                  }`}
                  title={isConnected ? 'Disconnect' : 'Connect'}
                >
                  <span className="text-xl">🔌</span>
                </motion.button>

                {/* Mute/Unmute Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMute}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 ${
                    isMuted
                      ? 'bg-gray-500 hover:bg-gray-600 hover:shadow-gray-500/50'
                      : 'bg-blue-500 hover:bg-blue-600 hover:shadow-blue-500/50'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  <span className="text-xl">🎙️</span>
                </motion.button>

                {/* Text Mode Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTextMode}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 ${
                    isTextMode
                      ? 'bg-purple-500 hover:bg-purple-600 hover:shadow-purple-500/50'
                      : 'bg-gray-500 hover:bg-gray-600 hover:shadow-gray-500/50'
                  }`}
                  title={isTextMode ? 'Exit Text Mode' : 'Text Mode'}
                >
                  <span className="text-xl">💬</span>
                </motion.button>

                {/* Main Call Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCall}
                  disabled={!isConnected}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 ${
                    !isConnected
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isListening
                      ? 'bg-red-500 hover:bg-red-600 hover:shadow-red-500/50'
                      : 'bg-green-500 hover:bg-green-600 hover:shadow-green-500/50'
                  }`}
                  title={isListening ? 'End Call' : 'Start Call'}
                >
                  <span className="text-2xl">📞</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-24 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg"
          >
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FloatingCallDock;
