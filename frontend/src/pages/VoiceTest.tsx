import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
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
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');
  const [isCurrentlySpeaking, setIsCurrentlySpeaking] = useState(false);
  const [currentAiResponse, setCurrentAiResponse] = useState('');
  const [currentUserMessage, setCurrentUserMessage] = useState('');
  const [audioWorkletNode, setAudioWorkletNode] = useState<AudioWorkletNode | null>(null);
  
  // Use refs to avoid stale closure issues in WebSocket handler
  const speakingRef = useRef(false);
  const currentAiResponseRef = useRef('');
  const currentUserMessageRef = useRef('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
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

  const connectWebSocket = async () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Use backend port (5000) instead of frontend dev server port (5173)
      const backendHost = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
      const wsUrl = `${protocol}//${backendHost}/ws/voice-test`;
      console.log('🔌 Frontend: Connecting to WebSocket:', wsUrl);
      console.log('🔌 Frontend: Current location:', window.location.href);
      console.log('🔌 Frontend: Protocol:', protocol);
      console.log('🔌 Frontend: Backend host:', backendHost);
      
      // Check if backend is running first
      if (window.location.hostname === 'localhost' && backendHost === 'localhost:5000') {
        console.log('🔍 Frontend: Checking if backend is running...');
        try {
          const response = await fetch('http://localhost:5000');
          console.log('✅ Frontend: Backend is running, status:', response.status);
        } catch (error) {
          console.error('❌ Frontend: Backend is not running:', error);
          setError('Backend is not running. Please start it with: cd backend && python run.py');
          addToLog('ai', 'Error: Backend is not running. Please start it first.');
          return;
        }
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
        console.error('❌ Frontend: WebSocket URL attempted:', wsUrl);
        setError('Connection error. Please check if backend is running on port 5000.');
        setIsConnected(false);
      };

    } catch (err) {
      console.error('❌ Frontend: Error connecting to WebSocket:', err);
      console.error('❌ Frontend: Error stack:', (err as Error).stack);
      setError('Failed to connect. Please check your connection.');
    }
  };

  const addToLog = (type: 'user' | 'ai', message: string) => {
    setConversationLog(prev => [...prev, { type, message, timestamp: new Date() }]);
  };

  const handleWebSocketMessage = (data: any) => {
    console.log('📨 Frontend: Received WebSocket message:', data.event, 'isCurrentlySpeaking:', isCurrentlySpeaking);
    
    if (data.event === 'media' && data.media?.payload) {
      // Handle incoming audio from the AI
      console.log('🎵 Frontend: Processing audio chunk, speakingRef.current:', speakingRef.current);
      // Set speaking state but don't add to log - we'll only log the final response
      if (!speakingRef.current) {
        console.log('🗣️ Frontend: First audio chunk - setting speaking state');
        speakingRef.current = true;
        setIsCurrentlySpeaking(true);
      }
      playAudioChunk(data.media.payload);
    } else if (data.event === 'ai_transcript') {
      // Handle AI text transcription
      const text = data.text || '';
      console.log('📝 Frontend: AI transcript delta:', text);
      currentAiResponseRef.current += text;
      setCurrentAiResponse(currentAiResponseRef.current);
    } else if (data.event === 'user_transcript') {
      // Handle user text transcription
      const text = data.text || '';
      console.log('📝 Frontend: User transcript delta:', text);
      currentUserMessageRef.current += text;
      setCurrentUserMessage(currentUserMessageRef.current);
    } else if (data.event === 'ai_response_complete') {
      // AI response is complete, add to conversation log
      console.log('✅ Frontend: AI response complete, data:', data);
      const finalText = (data.text ?? currentAiResponseRef.current).trim();
      if (finalText) {
        addToLog('ai', finalText);
        currentAiResponseRef.current = '';
        setCurrentAiResponse('');
      }
      // Reset speaking state with a delay to prevent immediate re-triggering
      console.log('🔄 Frontend: Resetting speaking state after AI response');
      setTimeout(() => {
        speakingRef.current = false;
        setIsCurrentlySpeaking(false);
        console.log('🎤 Frontend: Microphone re-enabled after AI response');
      }, 500);
    } else if (data.event === 'user_response_complete') {
      // User response is complete, add to conversation log
      console.log('✅ Frontend: User response complete, data:', data);
      const finalText = (data.text ?? currentUserMessageRef.current).trim();
      if (finalText) {
        addToLog('user', finalText);
        currentUserMessageRef.current = '';
        setCurrentUserMessage('');
      }
    } else if (data.event === 'clear') {
      // Clear audio buffer
      console.log('🧹 Frontend: Clearing audio buffer');
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
      console.log('🎵 Frontend: playAudioChunk called, isPlayingRef.current:', isPlayingRef.current);
      // Add to queue for real-time playback
      audioQueueRef.current.push(audioData);
      
      // Start playing if not already playing
      if (!isPlayingRef.current) {
        console.log('🚀 Frontend: Starting audio playback from playAudioChunk');
        playNextChunk();
      } else {
        console.log('⏸️ Frontend: Audio already playing, adding to queue');
      }
      
    } catch (err) {
      console.error('❌ Frontend: Error in playAudioChunk:', err);
    }
  };

  const playNextChunk = async () => {
    console.log('🎧 Frontend: playNextChunk called, queue length:', audioQueueRef.current.length, 'isCurrentlySpeaking:', isCurrentlySpeaking);
    
    if (audioQueueRef.current.length === 0) {
      console.log('🔚 Frontend: Audio queue empty - stopping playback (keeping isCurrentlySpeaking state)');
      isPlayingRef.current = false;
      setIsSpeaking(false);
      // DON'T reset isCurrentlySpeaking here - only reset on ai_response_complete
      return;
    }

    console.log('▶️ Frontend: Starting audio playback');
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

  const startPCM16Capture = async () => {
    try {
      console.log('🎤 Frontend: Starting PCM16 capture...');
      
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 8000,  // OpenAI expects 8kHz
          channelCount: 1,    // Mono
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      console.log('✅ Frontend: Microphone stream obtained:', stream);
      streamRef.current = stream;
      
      // Create AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 8000
        });
      }
      
      console.log('🎵 Frontend: AudioContext created, sample rate:', audioContextRef.current.sampleRate);
      
      // Create audio source
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create ScriptProcessorNode for PCM16 capture
      const bufferSize = 4096; // 4096 samples = ~512ms at 8kHz
      const processor = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);
      
      console.log('🎛️ Frontend: ScriptProcessor created, buffer size:', bufferSize);
      
      processor.onaudioprocess = (event) => {
        // Don't capture audio if AI is speaking (prevent echo/feedback)
        if (isSpeaking) {
          if (Math.random() < 0.01) { // Very occasional logging
            console.log('🔇 Frontend: Skipping audio capture - AI is speaking');
          }
          return;
        }
        
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0); // Mono channel
        
        // Check if there's actual speech (not just silence)
        const rms = Math.sqrt(inputData.reduce((sum, val) => sum + val * val, 0) / inputData.length);
        const threshold = 0.01; // Adjust this threshold as needed
        
        if (rms < threshold) {
          // Too quiet, skip this chunk
          if (Math.random() < 0.01) {
            console.log('🔇 Frontend: Skipping quiet audio chunk, RMS:', rms.toFixed(4));
          }
          return;
        }
        
        // Convert Float32 to PCM16
        const pcm16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          // Convert from [-1, 1] to [-32768, 32767]
          pcm16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        
        // Only log every 10th chunk to avoid spam
        if (Math.random() < 0.1) {
          console.log('🎤 Frontend: Captured PCM16 chunk, samples:', pcm16Data.length, 'RMS:', rms.toFixed(4));
        }
        
        // Send PCM16 data immediately
        sendPCM16Audio(pcm16Data);
      };
      
      // Connect audio nodes
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
      // Store processor for cleanup
      setAudioWorkletNode(processor as any);
      
      setIsListening(true);
      setStatus('Listening... Speak now');
      
      // Clear any previous responses
      console.log('🎤 Frontend: Starting PCM16 recording, clearing states, isCurrentlySpeaking:', isCurrentlySpeaking);
      currentAiResponseRef.current = '';
      currentUserMessageRef.current = '';
      setCurrentAiResponse('');
      setCurrentUserMessage('');
      setIsCurrentlySpeaking(false);
      speakingRef.current = false;
      
    } catch (err) {
      console.error('❌ Frontend: Error starting PCM16 capture:', err);
      setError('Microphone access denied. Please allow microphone access and try again.');
      addToLog('ai', 'Error: Microphone access denied. Please allow microphone access and try again.');
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
        console.log('🎤 Frontend: Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 8000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          } 
        });
        console.log('✅ Frontend: Microphone permission granted, stream:', stream);
        
        // Store the stream for later use
        streamRef.current = stream;
        
        // Now connect to WebSocket
        setStatus('Connecting to voice agent...');
        addToLog('user', 'Connecting to voice agent...');
        await connectWebSocket();
        
        // Wait a moment for connection to establish
        setTimeout(() => {
          if (isConnected) {
            setStatus('Connected! Click microphone to start talking');
            addToLog('ai', 'Connected! Ready to help you test VocalHost.');
          }
        }, 1000);
        
        return;
      }

      // If already connected, start PCM16 capture
      await startPCM16Capture();

    } catch (err) {
      console.error('Error starting microphone:', err);
      setError('Microphone access denied. Please allow microphone access and try again.');
      addToLog('ai', 'Error: Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const stopListening = () => {
    console.log('🛑 Frontend: stopListening called');
    
    // Stop PCM16 capture
    if (audioWorkletNode) {
      console.log('🛑 Frontend: Disconnecting audio processor');
      audioWorkletNode.disconnect();
      setAudioWorkletNode(null);
    }
    
    
    // Stop microphone stream
    if (streamRef.current) {
      console.log('🛑 Frontend: Stopping microphone stream');
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsListening(false);
    setStatus('Processing...');
  };

  const sendPCM16Audio = (pcm16Data: Int16Array) => {
    try {
      // Only log occasionally to avoid spam
      if (Math.random() < 0.05) {
        console.log('🎤 Frontend: sendPCM16Audio called, PCM16 samples:', pcm16Data.length);
      }
      
      // Convert PCM16 to base64
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
        
        // Only log success occasionally
        if (Math.random() < 0.05) {
          console.log('✅ Frontend: PCM16 audio sent successfully');
        }
      } else {
        console.error('❌ Frontend: WebSocket not connected! State:', wsRef.current?.readyState);
        setError('Not connected to server. Please try again.');
      }
    } catch (err) {
      console.error('❌ Frontend: Error sending PCM16 audio:', err);
      setError('Failed to send audio. Please try again.');
    }
  };


  const sendTextMessage = () => {
    if (!textInput.trim()) return;
    
    console.log('📤 Frontend: sendTextMessage called, isCurrentlySpeaking:', isCurrentlySpeaking);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        event: 'text_input',
        text: textInput.trim()
      };
      
      console.log('📤 Frontend: Sending text message:', message);
      wsRef.current.send(JSON.stringify(message));
      addToLog('user', textInput.trim());
      setTextInput('');
      setStatus('Sending text...');
      
      // Clear any previous AI response
      console.log('🧹 Frontend: Clearing currentAiResponse and resetting isCurrentlySpeaking');
      currentAiResponseRef.current = '';
      currentUserMessageRef.current = '';
      setCurrentAiResponse('');
      setCurrentUserMessage('');
      setIsCurrentlySpeaking(false);
      speakingRef.current = false;
    } else {
      console.error('WebSocket not connected');
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
    setStatus('Disconnected');
    addToLog('ai', 'Disconnected from voice assistant');
  };

  const clearLog = () => {
    setConversationLog([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between">
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
              <h1 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Voice Agent Demo
              </h1>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Phone-call style conversation
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
      </div>

      {/* Main Conversation Area */}
      <div className="flex flex-col h-screen pt-20 pb-32">
        <div className="flex-1 max-w-4xl mx-auto w-full px-4">
          {/* Status Indicators */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-8">
              {/* User Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  isListening ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' : 'bg-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  You
                </span>
              </div>
              
              {/* AI Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  isSpeaking ? 'bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse' : 'bg-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  AI Assistant
                </span>
              </div>
            </div>
          </div>

          {/* Conversation Log */}
          <div className={`rounded-2xl shadow-xl p-6 h-full ${
            theme === 'dark' 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Conversation
              </h2>
              <button
                onClick={clearLog}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                Clear
              </button>
            </div>

            {/* Current User Message Preview */}
            {currentUserMessage && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                  You are speaking...
                </div>
                <div className="text-sm text-green-800 dark:text-green-200">
                  {currentUserMessage}
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            )}

            {/* Current AI Response Preview */}
            {currentAiResponse && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                  AI is responding...
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  {currentAiResponse}
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            )}

            <div className={`h-96 overflow-y-auto space-y-4 ${
              theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            } rounded-lg p-4`}>
              {conversationLog.length === 0 ? (
                <div className={`text-center py-12 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  <div className="text-6xl mb-4">📞</div>
                  <p className="text-lg font-medium mb-2">Ready to start your call</p>
                  <p className="text-sm">Use the controls below to begin</p>
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
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      entry.type === 'user'
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : theme === 'dark'
                        ? 'bg-gray-700 text-white rounded-bl-md'
                        : 'bg-gray-200 text-gray-800 rounded-bl-md'
                    }`}>
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
      </div>

      {/* Floating Control Dock */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className={`rounded-2xl shadow-2xl p-6 backdrop-blur-sm ${
          theme === 'dark' 
            ? 'bg-gray-800/90 border border-gray-700' 
            : 'bg-white/90 border border-gray-200'
        }`}>
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm mb-4"
            >
              {error}
            </motion.div>
          )}

          {/* Status Strip */}
          <div className="flex items-center justify-center mb-4">
            <div className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {status}
            </div>
          </div>

          {/* Control Buttons */}
          {inputMode === 'voice' ? (
            <div className="flex items-center justify-center space-x-4">
              {/* Text Mode Toggle */}
              <button
                onClick={() => setInputMode('text')}
                className={`p-3 rounded-full transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                title="Switch to text mode"
              >
                <span className="text-xl">💬</span>
              </button>

              {/* Main Call Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isListening ? stopListening : startListening}
                disabled={!isConnected}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 ${
                  !isConnected
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isListening
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
                title={isListening ? 'End call' : 'Start call'}
              >
                <span className="text-2xl">
                  {isListening ? '📞' : '📞'}
                </span>
              </motion.button>

              {/* Connect/Disconnect */}
              <button
                onClick={isConnected ? disconnect : connectWebSocket}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isConnected
                    ? theme === 'dark'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-red-500 text-white hover:bg-red-600'
                    : theme === 'dark'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
                title={isConnected ? 'Disconnect' : 'Connect'}
              >
                <span className="text-xl">
                  {isConnected ? '🔌' : '🔌'}
                </span>
              </button>
            </div>
          ) : (
            /* Text Mode UI */
            <div className="flex items-center space-x-3">
              {/* Voice Mode Toggle */}
              <button
                onClick={() => setInputMode('voice')}
                className={`p-3 rounded-full transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                title="Switch to voice mode"
              >
                <span className="text-xl">📞</span>
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                placeholder="Type your message..."
                className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />

              {/* Send Button */}
              <button
                onClick={sendTextMessage}
                disabled={!textInput.trim() || !isConnected}
                className={`p-3 rounded-full transition-all duration-200 ${
                  textInput.trim() && isConnected
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <span className="text-xl">📤</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceTest;
