import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MicrophoneIcon, 
  SpeakerWaveIcon, 
  StopIcon,
  ArrowLeftIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const VoiceTest: React.FC = () => {
  const { theme } = useTheme();
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState('Ready to start');
  const [error, setError] = useState<string | null>(null);
  const [conversationLog, setConversationLog] = useState<Array<{type: 'user' | 'ai', message: string, timestamp: Date}>>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

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

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Use backend port (5000) instead of frontend dev server port (5173)
      const backendHost = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
      const wsUrl = `${protocol}//${backendHost}/ws/voice-test`;
      console.log('🔌 Frontend: Connecting to WebSocket:', wsUrl);
      console.log('🔌 Frontend: Current location:', window.location.href);
      console.log('🔌 Frontend: Protocol:', protocol);
      console.log('🔌 Frontend: Backend host:', backendHost);
      
      // Check if backend is running
      if (window.location.hostname === 'localhost' && backendHost === 'localhost:5000') {
        console.log('🔍 Frontend: Checking if backend is running...');
        fetch('http://localhost:5000')
          .then(response => {
            console.log('✅ Frontend: Backend is running, status:', response.status);
          })
          .catch(error => {
            console.error('❌ Frontend: Backend is not running:', error);
            setError('Backend is not running. Please start it with: cd backend && python run.py');
            addToLog('ai', 'Error: Backend is not running. Please start it first.');
            return;
          });
      }
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      console.log('🔌 Frontend: WebSocket object created:', ws);

      ws.onopen = () => {
        console.log('✅ Frontend: WebSocket connected successfully');
        console.log('✅ Frontend: WebSocket readyState:', ws.readyState);
        setIsConnected(true);
        setStatus('Connected! Click microphone to start talking');
        setError(null);
        addToLog('ai', 'Connected to VocalHost voice assistant. How can I help you today?');
        
        // Send initial start message
        const startMessage = {
          event: 'start',
          start: {
            streamSid: 'test_stream_' + Date.now()
          }
        };
        console.log('📤 Frontend: Sending start message:', startMessage);
        ws.send(JSON.stringify(startMessage));
        console.log('📤 Frontend: Start message sent');
      };

      ws.onmessage = (event) => {
        try {
          console.log('📨 Frontend: Raw message received:', event.data);
          const data = JSON.parse(event.data);
          console.log('📦 Frontend: Parsed message:', data);
          handleWebSocketMessage(data);
        } catch (err) {
          console.error('❌ Frontend: Error parsing WebSocket message:', err);
          console.error('❌ Frontend: Raw data was:', event.data);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 Frontend: WebSocket disconnected');
        console.log('🔌 Frontend: Close event:', event);
        console.log('🔌 Frontend: Close code:', event.code);
        console.log('🔌 Frontend: Close reason:', event.reason);
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
        setStatus('Disconnected');
        addToLog('ai', 'Connection lost. Please reconnect to continue.');
      };

      ws.onerror = (error) => {
        console.error('❌ Frontend: WebSocket error:', error);
        console.error('❌ Frontend: WebSocket readyState:', ws.readyState);
        setError('Connection error. Please try again.');
        setIsConnected(false);
      };

    } catch (err) {
      console.error('❌ Frontend: Error connecting to WebSocket:', err);
      console.error('❌ Frontend: Error stack:', err.stack);
      setError('Failed to connect. Please check your connection.');
    }
  };

  const addToLog = (type: 'user' | 'ai', message: string) => {
    setConversationLog(prev => [...prev, { type, message, timestamp: new Date() }]);
  };

  const handleWebSocketMessage = (data: any) => {
    if (data.event === 'media' && data.media?.payload) {
      // Handle incoming audio from the AI
      playAudioChunk(data.media.payload);
    } else if (data.event === 'clear') {
      // Clear audio buffer
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }
    }
  };

  // Audio queue for real-time streaming
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);

  const playAudioChunk = (audioData: string) => {
    try {
      // Add to queue for real-time playback
      audioQueueRef.current.push(audioData);
      
      // Start playing if not already playing
      if (!isPlayingRef.current) {
        playNextChunk();
      }
      
    } catch (err) {
      // Silent error handling
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
    addToLog('ai', 'Speaking...');

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

      // Resume audio context if suspended (required for autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Process PCM16 audio data directly
      const sampleRate = 24000; // OpenAI Realtime API uses 24kHz for PCM16
      const numberOfChannels = 1; // Mono
      const length = arrayBuffer.byteLength / 2; // 16-bit = 2 bytes per sample
      
      if (length === 0) {
        setTimeout(() => playNextChunk(), 10);
        return;
      }
      
      const audioBuffer = audioContextRef.current.createBuffer(numberOfChannels, length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Convert PCM16 to float32 samples
      const pcm16Data = new Int16Array(arrayBuffer);
      for (let i = 0; i < pcm16Data.length; i++) {
        channelData[i] = pcm16Data[i] / 32768.0; // Convert to [-1, 1] range
      }
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setTimeout(() => playNextChunk(), 10);
      };
      
      source.start();

    } catch (error) {
      // Continue with next chunk if any error occurs
      setTimeout(() => playNextChunk(), 10);
    }
  };

  const startListening = async () => {
    try {
      setError(null);
      
      // First, get microphone permission and connect WebSocket
      if (!isConnected) {
        setStatus('Requesting microphone access...');
        addToLog('user', 'Requesting microphone access...');
        
        // Get microphone permission first
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 8000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          } 
        });
        
        // Store the stream for later use
        streamRef.current = stream;
        
        // Now connect to WebSocket
        setStatus('Connecting to voice agent...');
        addToLog('user', 'Connecting to voice agent...');
        connectWebSocket();
        
        // Wait a moment for connection to establish
        setTimeout(() => {
          if (isConnected) {
            setStatus('Connected! Click microphone to start talking');
            addToLog('ai', 'Connected! Ready to help you test VocalHost.');
          }
        }, 1000);
        
        return;
      }

      // If already connected, start recording
      if (!streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 8000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          } 
        });
        streamRef.current = stream;
      }
      
      const mediaRecorder = new MediaRecorder(streamRef.current, {
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
        sendAudioToServer(audioBlob);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsListening(true);
      setStatus('Listening... Speak now');
      addToLog('user', 'Started speaking...');

    } catch (err) {
      console.error('Error starting microphone:', err);
      setError('Microphone access denied. Please allow microphone access and try again.');
      addToLog('ai', 'Error: Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsListening(false);
    setStatus('Processing...');
    addToLog('user', 'Finished speaking');
  };

  const sendAudioToServer = async (audioBlob: Blob) => {
    try {
      console.log('Sending audio to server, size:', audioBlob.size);
      
      // Convert audio to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const message = {
          event: 'media',
          media: {
            payload: base64Audio
          }
        };
        
        console.log('Sending audio message:', message.event);
        wsRef.current.send(JSON.stringify(message));
        setStatus('Sending audio...');
      } else {
        console.error('WebSocket not connected');
        setError('Not connected to server. Please try again.');
      }
    } catch (err) {
      console.error('Error sending audio:', err);
      setError('Failed to send audio. Please try again.');
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
    setStatus('Disconnected');
    addToLog('ai', 'Disconnected from voice assistant');
  };

  const clearLog = () => {
    setConversationLog([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <div>
              <h1 className={`text-3xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Voice Agent Test
              </h1>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Test VocalHost's AI voice assistant capabilities
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Voice Controls */}
          <div className={`rounded-2xl shadow-xl p-8 ${
            theme === 'dark' 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Voice Controls
            </h2>

            {/* Status */}
            <div className="text-center mb-6">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                isConnected 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                {status}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm mb-6"
              >
                {error}
              </motion.div>
            )}

            {/* Main Control Button */}
            <div className="flex flex-col items-center space-y-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isListening ? stopListening : startListening}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isListening ? (
                  <StopIcon className="w-10 h-10" />
                ) : (
                  <MicrophoneIcon className="w-10 h-10" />
                )}
              </motion.button>

              {/* Speaking Indicator */}
              <AnimatePresence>
                {isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center space-x-2 text-blue-600 dark:text-blue-400"
                  >
                    <SpeakerWaveIcon className="w-6 h-6 animate-pulse" />
                    <span className="text-lg font-medium">AI is speaking...</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Instructions */}
              <div className={`text-center text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {!isConnected ? (
                  <p>Click the microphone to get started</p>
                ) : isListening ? (
                  <p>Speak now, then click stop when finished</p>
                ) : (
                  <p>Click the microphone to start talking to the AI</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-8">
              {isConnected && (
                <button
                  onClick={disconnect}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Disconnect
                </button>
              )}
              <button
                onClick={clearLog}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Clear Log
              </button>
            </div>
          </div>

          {/* Conversation Log */}
          <div className={`rounded-2xl shadow-xl p-8 ${
            theme === 'dark' 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Conversation Log
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <InformationCircleIcon className="w-4 h-4" />
                <span>Real-time conversation</span>
              </div>
            </div>

            <div className={`h-96 overflow-y-auto space-y-4 ${
              theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            } rounded-lg p-4`}>
              {conversationLog.length === 0 ? (
                <div className={`text-center py-8 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  <MicrophoneIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start a conversation to see the log here</p>
                </div>
              ) : (
                conversationLog.map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      entry.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      entry.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      <div className="text-sm font-medium mb-1">
                        {entry.type === 'user' ? 'You' : 'AI Assistant'}
                      </div>
                      <div className="text-sm">{entry.message}</div>
                      <div className={`text-xs mt-1 ${
                        entry.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {entry.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Features Info */}
        <div className={`mt-8 rounded-2xl shadow-xl p-8 ${
          theme === 'dark' 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            What you can test:
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <h4 className={`font-medium mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Business Information
              </h4>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Ask about VocalHost's services, pricing, features, and capabilities
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <h4 className={`font-medium mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Natural Conversation
              </h4>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Experience human-like conversations with our AI voice assistant
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <h4 className={`font-medium mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Voice Quality
              </h4>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Test the clarity, responsiveness, and naturalness of the voice
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <h4 className={`font-medium mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Real-time Processing
              </h4>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Experience low-latency speech-to-speech interactions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTest;
