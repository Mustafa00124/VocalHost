import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useDemoState } from './state/demoStateProvider';

interface PhonePanelProps {
  agentName: string;
  agentAvatar: string;
  agentType: string;
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
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
  isListening,
  isSpeaking,
  onCallStart,
  onCallEnd,
  onMuteToggle
}) => {
  const { theme } = useTheme();
  const { addBooking, cancelBooking, getAvailableSlots, checkBooking } = useDemoState();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAiMessage, setCurrentAiMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice-related state
  const [isMuted, setIsMuted] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const isMutedRef = useRef<boolean>(false);
  
  // Voice agent WebSocket state
  const [isVoiceAgentConnected, setIsVoiceAgentConnected] = useState(false);
  const [isVoiceAgentActive, setIsVoiceAgentActive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sessionIdRef = useRef<string>('');
  
  // Realtime text input state (separate from existing chat)
  const [realtimeTextInput, setRealtimeTextInput] = useState('');
  
  // Audio buffering for AI responses
  const audioBufferRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  // Generate session ID
  useEffect(() => {
    sessionIdRef.current = 'session_' + Math.random().toString(36).substr(2, 9);
  }, []);

  // Initialize microphone access
  const initializeMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1
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


  // Voice Agent WebSocket Functions
  const connectVoiceAgent = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔌 Voice agent already connected');
      return;
    }

    console.log('🚀 Starting WebSocket connection to voice agent...');
    console.log('📡 WebSocket URL:', `ws://localhost:5000/ws/${sessionIdRef.current}`);
    console.log('🆔 Session ID:', sessionIdRef.current);
    console.log('🌐 Current location:', window.location.href);
    
    try {
      const ws = new WebSocket(`ws://localhost:5000/ws/${sessionIdRef.current}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Realtime WebSocket CONNECTED successfully');
        console.log('🔗 WebSocket readyState:', ws.readyState);
        console.log('🌐 WebSocket URL:', ws.url);
        console.log('📊 WebSocket protocol:', ws.protocol);
        setIsVoiceAgentConnected(true);
        
        // Start the voice call when connection is established
        console.log('✅ Voice agent WebSocket connected, starting call...');
        setIsVoiceAgentActive(true);
        initializeAudioContext();
      };

      ws.onmessage = (event) => {
        console.log('📨 WebSocket MESSAGE received from voice agent');
        console.log('📊 Message length:', event.data.length);
        console.log('📝 Raw message:', event.data);
        try {
          const data = JSON.parse(event.data);
          console.log('✅ Parsed JSON data:', data);
          handleRealtimeEvent(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
          console.error('❌ Raw message that failed to parse:', event.data);
        }
      };

      ws.onclose = (event: CloseEvent) => {
        console.log('🔌 WebSocket CONNECTION CLOSED');
        console.log('📊 Close code:', event.code);
        console.log('📝 Close reason:', event.reason);
        console.log('🔍 Was clean close:', event.wasClean);
        setIsVoiceAgentConnected(false);
        setIsVoiceAgentActive(false);
        
        // Don't auto-reconnect - let user manually start the call
        console.log('🔌 WebSocket closed - user can manually reconnect by pressing call button');
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket ERROR occurred');
        console.error('❌ Error details:', error);
        console.error('❌ WebSocket readyState:', ws.readyState);
        setIsVoiceAgentConnected(false);
        setIsVoiceAgentActive(false);
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setIsVoiceAgentConnected(false);
      setIsVoiceAgentActive(false);
    }
  };

  const disconnectVoiceAgent = () => {
    if (wsRef.current) {
      console.log('🎤 Disconnecting voice agent...');
      wsRef.current.close();
      wsRef.current = null;
      setIsVoiceAgentConnected(false);
      setIsVoiceAgentActive(false);
    }
  };

  const startVoiceCall = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('🎤 Connecting to voice agent WebSocket...');
      connectVoiceAgent();
    } else {
      console.log('📞 Starting voice call - microphone active, waiting for your voice...');
      setIsVoiceAgentActive(true);
      
      // Initialize audio context for real-time audio processing
      initializeAudioContext();
    }
  };

  const endVoiceCall = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('📞 Ending voice call - microphone disconnected');
      // Send end call message if needed
      wsRef.current.send(JSON.stringify({ type: 'end_call' }));
    }
    
    setIsVoiceAgentActive(false);
    
    // Cleanup audio buffer and playback state
    audioBufferRef.current = [];
    isPlayingRef.current = false;
    
    // Cleanup audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  // Send text message to RealtimeRunner (separate from existing chat)
  const sendRealtimeTextMessage = () => {
    if (!realtimeTextInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    console.log('📤 Sending text to RealtimeRunner:', realtimeTextInput);
    
    // Send text message to RealtimeRunner
    const textMessage = {
      type: 'message',
      role: 'user',
      content: [{"type": "input_text", "text": realtimeTextInput}]
    };
    
    wsRef.current.send(JSON.stringify(textMessage));
    setRealtimeTextInput(''); // Clear input after sending
  };

  const initializeAudioContext = async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
        latencyHint: 'interactive'
      });
      audioContextRef.current = audioContext;

      // Create media stream source (matching official example)
      if (streamRef.current) {
        const source = audioContext.createMediaStreamSource(streamRef.current);
        
        // Create script processor for real-time processing (matching official example)
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(audioContext.destination);
        
        console.log('✅ Script processor created and connected');
        
        // Handle audio data from script processor (matching official example)
        
        processor.onaudioprocess = (event) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isMutedRef.current) {
            const inputBuffer = event.inputBuffer.getChannelData(0);
            const int16Buffer = new Int16Array(inputBuffer.length);

            // Convert float32 to int16 (matching official example)
            for (let i = 0; i < inputBuffer.length; i++) {
              int16Buffer[i] = Math.max(-32768, Math.min(32767, inputBuffer[i] * 32768));
            }

            console.log('📤 Sending audio data to backend:', int16Buffer.length, 'samples');
            wsRef.current.send(JSON.stringify({
              type: 'audio',
              data: Array.from(int16Buffer)
            }));
          }
        };
        
        // Store processor reference (using any type since we switched from AudioWorklet to ScriptProcessor)
        (audioWorkletNodeRef as any).current = processor;
      }
    } catch (error) {
      console.error('❌ Error initializing audio context:', error);
    }
  };

  const handleRealtimeEvent = (event: any) => {
    console.log('🎧 REALTIME EVENT RECEIVED:', {
      type: event.type,
      timestamp: event.timestamp || Date.now(),
      sessionId: sessionIdRef.current
    });
    console.log('🎧 Full event data:', event);
    
    switch (event.type) {
      case 'pulse':
        console.log('💓 PULSE RECEIVED:', event.message);
        console.log('💓 Received type:', event.received_type);
        console.log('💓 Timestamp:', event.timestamp);
        // Play a short beep to indicate pulse received
        playPulseBeep();
        break;
        
      case 'connection_established':
        console.log('✅ CONNECTION ESTABLISHED:', event.message);
        console.log('✅ Session ID confirmed:', event.session_id);
        break;
        
      case 'audio':
        // AI audio response received
        console.log('🔊 ===== STEP 5: AI AUDIO RECEIVED FOR PLAYBACK =====');
        console.log('🔊 AI AUDIO RESPONSE RECEIVED:', {
          audioLength: event.audio?.length || 0,
          sampleRate: event.sample_rate || 'unknown',
          samples: event.samples || 'unknown',
          timestamp: event.timestamp
        });
        
        if (event.audio) {
          console.log('🔊 STEP 6: PLAYING AI SPEECH TO USER...');
          console.log('🔊 About to play AI spoken response through speakers');
          playAudioData(event.audio);
        } else {
          console.warn('⚠️ AI audio response received but no audio data');
        }
        break;
        
      case 'audio_ack':
        console.log('✅ AUDIO ACK RECEIVED:', {
          received: event.received,
          bufferSize: event.buffer_size,
          timestamp: event.timestamp
        });
        break;
        
      case 'interrupt_ack':
        console.log('✅ INTERRUPT ACK RECEIVED:', {
          timestamp: event.timestamp
        });
        break;
        
      case 'agent_start':
        console.log('🤖 AI Agent started:', event.agent_name);
        break;
        
      case 'agent_end':
        console.log('🤖 AI Agent ended:', event.agent_name);
        break;
        
      case 'tool_start':
        console.log('🔧 AI using tool:', event.tool_name);
        break;
        
      case 'tool_end':
        console.log('🔧 AI tool completed:', event.tool_name);
        console.log('🔧 Tool output:', event.output);
        handleToolResult(event.tool_name, event.output);
        break;
        
      case 'history_updated':
        console.log('📚 History updated');
        if (event.history) {
          updateMessagesFromHistory(event.history);
        }
        break;
        
      case 'history_added':
        console.log('📚 History item added');
        if (event.item) {
          addMessageFromHistoryItem(event.item);
        }
        break;
        
      case 'error':
        console.error('❌ AI REALTIME ERROR:', event.error);
        console.error('❌ Error timestamp:', event.timestamp);
        break;
        
      case 'message_ack':
        console.log('✅ MESSAGE ACK RECEIVED:', {
          receivedType: event.received_type,
          timestamp: event.timestamp
        });
        break;
        
      case 'transcription_complete':
        console.log('📝 ===== STEP 2.5: SPEECH TRANSCRIBED =====');
        console.log('📝 Your speech has been converted to text by OpenAI');
        break;
        
      case 'conversation_item_created':
        console.log('📚 ===== NEW MESSAGE ADDED =====');
        console.log('📚 New conversation item:', event.item);
        break;
        
      case 'audio_done':
        console.log('🔊 ===== AI AUDIO GENERATION COMPLETE =====');
        console.log('🔊 AI has finished generating speech');
        break;
        
      case 'response_done':
        console.log('✅ ===== AI RESPONSE COMPLETE =====');
        console.log('✅ AI has finished responding');
        break;
        
      default:
        console.log('❓ UNKNOWN EVENT TYPE:', event.type);
        console.log('❓ Unknown event data:', event);
    }
  };

  // Handle tool results
  const handleToolResult = (toolName: string, output: any) => {
    console.log('🔧 Processing tool result:', toolName, output);
    
    try {
      // Parse tool output to extract structured actions
      let parsedOutput;
      if (typeof output === 'string') {
        parsedOutput = JSON.parse(output);
      } else {
        parsedOutput = output;
      }
      
      console.log('🔧 Parsed tool output:', parsedOutput);
      
      // Extract actions from tool result (same as text agent)
      if (parsedOutput.actions && Array.isArray(parsedOutput.actions)) {
        console.log('🔄 VOICE AGENT - Processing structured actions from tool result:', parsedOutput.actions);
        parsedOutput.actions.forEach((action: any) => {
          processStructuredAction(action, agentType);
        });
      } else {
        console.log('⚠️ No structured actions found in tool result');
      }
      
    } catch (error) {
      console.error('❌ Error processing tool result:', error);
    }
  };

  // Update messages from history
  const updateMessagesFromHistory = (history: any[]) => {
    const newMessages: Message[] = [];
    
    for (const item of history) {
      if (item.type === 'message') {
        const role = item.role === 'user' ? 'user' : 'ai';
        let content = '';
        let imageUrl = '';
        
        if (Array.isArray(item.content)) {
          for (const part of item.content) {
            if (part.type === 'text' && part.text) {
              content += part.text;
            } else if (part.type === 'input_image' && part.image_url) {
              imageUrl = part.image_url;
            }
          }
        }
        
        if (content || imageUrl) {
          newMessages.push({
            id: item.item_id || Math.random().toString(36).substr(2, 9),
            text: content.trim(),
            sender: role,
            timestamp: new Date()
          });
        }
      }
    }
    
    setMessages(newMessages);
  };

  // Add message from history item
  const addMessageFromHistoryItem = (item: any) => {
    if (item.type === 'message') {
      const role = item.role === 'user' ? 'user' : 'ai';
      let content = '';
      let imageUrl = '';
      
      if (Array.isArray(item.content)) {
        for (const part of item.content) {
          if (part.type === 'text' && part.text) {
            content += part.text;
          } else if (part.type === 'input_image' && part.image_url) {
            imageUrl = part.image_url;
          }
        }
      }
      
      if (content || imageUrl) {
        setMessages(prev => [...prev, {
          id: item.item_id || Math.random().toString(36).substr(2, 9),
          text: content.trim(),
          sender: role,
          timestamp: new Date()
        }]);
      }
    }
  };

  const playPulseBeep = () => {
    console.log('🔊 Playing pulse beep...');
    try {
      if (!audioContextRef.current) {
        console.warn('⚠️ No audio context available for pulse beep');
        return;
      }
      
      // Create a short beep sound (440Hz for 0.1 seconds)
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime); // 440Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime); // Low volume
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.1);
      
      console.log('✅ Pulse beep played');
    } catch (error) {
      console.error('❌ Error playing pulse beep:', error);
    }
  };

  const playAudioData = (audioBase64: string) => {
    console.log('🔊 ===== STEP 6: BUFFERING AI AUDIO CHUNK =====');
    console.log('🔊 PLAY AUDIO DATA CALLED:', {
      audioContextExists: !!audioContextRef.current,
      audioDataLength: audioBase64?.length || 0,
      isCurrentlyPlaying: isPlayingRef.current,
      bufferLength: audioBufferRef.current.length
    });
    
    if (!audioContextRef.current) {
      console.error('❌ No audio context available for playback');
      return;
    }
    
    if (!audioBase64) {
      console.error('❌ No audio data provided for playback');
      return;
    }
    
    try {
      // Decode base64 to ArrayBuffer
      const binaryString = atob(audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert bytes to Int16Array (PCM16 format)
      const int16Array = new Int16Array(bytes.buffer);
      
      console.log('🔄 STEP 6a: Adding audio chunk to buffer:', {
        samples: int16Array.length,
        bufferLength: audioBufferRef.current.length
      });
      
      // Add to buffer instead of playing immediately
      audioBufferRef.current.push(int16Array);
      
      // If not currently playing, start playback
      if (!isPlayingRef.current) {
        playBufferedAudio();
      }
      
    } catch (error) {
      console.error('❌ Error buffering AI audio:', error);
    }
  };

  const playBufferedAudio = async () => {
    if (isPlayingRef.current || audioBufferRef.current.length === 0) {
      return;
    }
    
    isPlayingRef.current = true;
    console.log('🔊 ===== STEP 7: PLAYING BUFFERED AUDIO =====');
    console.log('🔊 Starting buffered audio playback:', {
      chunks: audioBufferRef.current.length,
      totalSamples: audioBufferRef.current.reduce((sum, chunk) => sum + chunk.length, 0)
    });
    
    try {
      // Combine all buffered chunks
      const totalSamples = audioBufferRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedAudio = new Int16Array(totalSamples);
      let offset = 0;
      
      for (const chunk of audioBufferRef.current) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Clear buffer
      audioBufferRef.current = [];
      
      // Create audio buffer
      const sampleRate = 24000;
      const audioBuffer = audioContextRef.current!.createBuffer(1, combinedAudio.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Convert PCM16 to Float32 for Web Audio API
      for (let i = 0; i < combinedAudio.length; i++) {
        channelData[i] = combinedAudio[i] / 32768.0;
      }
      
      console.log('🔄 STEP 7a: Playing combined audio buffer:', {
        samples: combinedAudio.length,
        duration: (combinedAudio.length / sampleRate).toFixed(2) + 's'
      });
      
      // Play the combined audio
      const source = audioContextRef.current!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current!.destination);
      
      source.onended = () => {
        console.log('✅ STEP 7b: Audio playback completed');
        isPlayingRef.current = false;
        // Check if there are more chunks to play
        if (audioBufferRef.current.length > 0) {
          setTimeout(() => playBufferedAudio(), 50); // Small delay to prevent overlap
        }
      };
      
      source.start();
      console.log('✅ STEP 7b: Combined audio playback started');
      
    } catch (error) {
      console.error('❌ Error playing buffered audio:', error);
      isPlayingRef.current = false;
    }
  };

  // Handle call start/end
  const handleCallToggle = async () => {
    if (!isCallActive) {
      // Start call
      console.log('📞 Starting call...');
      setIsCallActive(true);
      onCallStart?.();
      
      // Initialize microphone and start voice agent WebSocket connection
      await initializeMicrophone();
      startVoiceCall();
      console.log('📞 Voice session started with realtime agent');
    } else {
      // End call
      console.log('📞 Ending call...');
      setIsCallActive(false);
      onCallEnd?.();
      
      // Stop microphone and cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // End voice agent WebSocket connection
      endVoiceCall();
      console.log('📞 Voice session ended');
    }
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    isMutedRef.current = newMutedState; // Update ref for audio worklet
    onMuteToggle?.(newMutedState);
    console.log('🔇 Mute toggled:', newMutedState);
    console.log('🔇 isMutedRef.current:', isMutedRef.current);
  };

  // Parse booking confirmation from text response
  const parseBookingConfirmation = (responseText: string, agentType: string) => {
    // Look for booking confirmation patterns - updated to match actual agent responses
    const bookingPatterns = {
      restaurant: /Reservation confirmed for (.+?) on (.+?) at (.+?)\. Booking ID: (.+)/i,
      salon: /Appointment booked for (.+?) - (.+?) on (.+?) at (.+?)\. Appointment ID: (.+)/i,
      dentist: /Dental appointment scheduled for (.+?) - (.+?) on (.+?) at (.+?)\. Appointment ID: (.+)/i,
      ecommerce: /Added to cart: (\d+)x (.+?) at \$\d+\.\d+ each \(Total: \$\d+\.\d+\)\. Cart Item ID: (.+)/i,
      support: /Customer added to CRM: (.+?) \(ID: (.+?)\)\nEmail: (.+?)\nPhone: (.+)/i
    };

    const pattern = bookingPatterns[agentType as keyof typeof bookingPatterns];
    if (!pattern) return null;

    const match = responseText.match(pattern);
    if (!match) return null;

    // Extract booking details based on agent type
    if (agentType === 'restaurant') {
      const [, customerName, date, time, bookingId] = match;
      return {
        type: 'booking',
        data: {
          id: bookingId,
          customer_name: customerName,
          time: time,
          date: date,
          service: 'Restaurant Reservation',
          status: 'confirmed'
        }
      };
    } else if (agentType === 'salon') {
      const [, customerName, service, date, time, appointmentId] = match;
      return {
        type: 'booking',
        data: {
          id: appointmentId,
          customer_name: customerName,
          time: time,
          date: date,
          service: service,
          status: 'confirmed'
        }
      };
    } else if (agentType === 'dentist') {
      const [, customerName, procedure, date, time, appointmentId] = match;
      return {
        type: 'booking',
        data: {
          id: appointmentId,
          customer_name: customerName,
          time: time,
          date: date,
          service: procedure,
          status: 'confirmed'
        }
      };
    } else if (agentType === 'ecommerce') {
      const [, quantity, productName, cartItemId] = match;
      return {
        type: 'cart',
        data: {
          id: cartItemId,
          productName,
          quantity: parseInt(quantity),
          status: 'added'
        }
      };
    } else if (agentType === 'support') {
      const [, customerName, customerId, email, phone] = match;
      return {
        type: 'customer',
        data: {
          id: customerId,
          name: customerName,
          email,
          phone,
          status: 'added'
        }
      };
    }

    return null;
  };

  // Process structured actions from tools
  const processStructuredAction = (action: any, agentType: string) => {
    console.log('🔄 Processing structured action:', action);
    
    switch (action.type) {
      case 'add_booking':
        console.log('🔍 DEBUG - Raw action data:', action.data);
        
        // Convert time format - handle both 24-hour and 12-hour formats
        const convertTimeFormat = (time: string) => {
          console.log('🔍 DEBUG - Converting time:', time);
          
          // If already in 12-hour format (contains AM/PM), return as is
          if (time.includes('AM') || time.includes('PM')) {
            console.log('🔍 DEBUG - Already in 12-hour format:', time);
            return time;
          }
          
          // Convert from 24-hour format
          const [hours, minutes] = time.split(':');
          const hour24 = parseInt(hours);
          const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
          const ampm = hour24 >= 12 ? 'PM' : 'AM';
          const result = `${hour12}:${minutes} ${ampm}`;
          console.log('🔍 DEBUG - Converted from 24-hour to 12-hour:', result);
          return result;
        };
        
        const newBooking = {
          id: action.data.id, // Use backend-provided ID
          time: convertTimeFormat(action.data.time), // Convert to 12-hour format
          date: action.data.date,
          customerName: action.data.customer_name,
          customerEmail: '',
          service: action.data.service || '',
          status: 'confirmed' as const
        };
        
        console.log('🔍 DEBUG - Final booking object:', newBooking);
        addBooking(action.agent_type || agentType, newBooking);
        console.log('📅 Calendar updated with new booking:', newBooking);
        break;
        
      case 'cancel_booking':
        cancelBooking(action.agent_type || agentType, action.data.id);
        console.log('📅 Booking cancelled:', action.data);
        break;
        
      case 'check_availability':
        console.log('🔍 DEBUG - Checking availability for:', action.data);
        const { date } = action.data;
        const slots = getAvailableSlots(action.agent_type || agentType, date);
        
        console.log('🔍 DEBUG - Available slots:', slots);
        
        // Send tool result back to backend
        fetch('/api/availability-tool-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool_name: 'check_availability',
            output: slots,
            agent_type: action.agent_type || agentType,
            session_id: 'chat-session',
            date: date
          })
        }).then(response => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error('Failed to send tool result to backend');
          }
        }).then(data => {
          console.log('✅ Tool result sent to backend successfully');
          
          // Handle agent response from tool result
          if (data.type === 'agent_response') {
            console.log('🤖 PhonePanel: Processing tool result agent response:', data.message);
            const agentMessage: Message = {
              id: (Date.now() + 1).toString(),
              text: data.message,
              sender: 'ai',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, agentMessage]);

            // Process any new actions from the tool result response
            if (data.actions && Array.isArray(data.actions)) {
              console.log('🔄 FRONTEND - Processing tool result actions:', data.actions);
              data.actions.forEach((action: any) => {
                processStructuredAction(action, agentType);
              });
            }
          }
        }).catch(error => {
          console.error('❌ Error sending tool result:', error);
        });
        break;
        
      case 'check_booking':
        console.log('🔍 DEBUG - Checking booking for:', action.data);
        const { customer_name, date: bookingDate, time } = action.data;
        const bookingCheck = checkBooking(action.agent_type || agentType, customer_name, bookingDate, time);
        
        console.log('🔍 DEBUG - Booking check result:', bookingCheck);
        
        // If booking exists, cancel it immediately in frontend
        if (bookingCheck.exists && bookingCheck.booking) {
          console.log('✅ Booking found, cancelling in frontend:', bookingCheck.booking.id);
          cancelBooking(action.agent_type || agentType, bookingCheck.booking.id);
          
          // Send success result to backend
          const successResult = {
            success: true,
            message: `Booking cancelled successfully for ${customer_name} on ${bookingDate} at ${time}`,
            booking_id: bookingCheck.booking.id,
            cancelled: true
          };
          
          fetch('/api/availability-tool-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool_name: 'check_booking',
              output: successResult,
              agent_type: action.agent_type || agentType,
              session_id: 'chat-session',
              customer_name: customer_name,
              date: bookingDate,
              time: time
            })
          }).then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error('Failed to send tool result to backend');
            }
          }).then(data => {
            console.log('✅ Booking cancellation result sent to backend successfully');
            
            // Handle agent response from tool result
            if (data.type === 'agent_response') {
              console.log('🤖 PhonePanel: Processing booking cancellation agent response:', data.message);
              const agentMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.message,
                sender: 'ai',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, agentMessage]);

              // Process any new actions from the tool result response
              if (data.actions && Array.isArray(data.actions)) {
                console.log('🔄 FRONTEND - Processing tool result actions:', data.actions);
                data.actions.forEach((action: any) => {
                  processStructuredAction(action, agentType);
                });
              }
            }
          }).catch(error => {
            console.error('❌ Error sending booking cancellation result:', error);
          });
        } else {
          // Booking doesn't exist, send failure result to backend
          const failureResult = {
            success: false,
            message: `No booking found for ${customer_name} on ${bookingDate} at ${time}`,
            cancelled: false
          };
          
          fetch('/api/availability-tool-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool_name: 'check_booking',
              output: failureResult,
              agent_type: action.agent_type || agentType,
              session_id: 'chat-session',
              customer_name: customer_name,
              date: bookingDate,
              time: time
            })
          }).then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error('Failed to send tool result to backend');
            }
          }).then(data => {
            console.log('✅ Booking not found result sent to backend successfully');
            
            // Handle agent response from tool result
            if (data.type === 'agent_response') {
              console.log('🤖 PhonePanel: Processing booking not found agent response:', data.message);
              const agentMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.message,
                sender: 'ai',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, agentMessage]);

              // Process any new actions from the tool result response
              if (data.actions && Array.isArray(data.actions)) {
                console.log('🔄 FRONTEND - Processing tool result actions:', data.actions);
                data.actions.forEach((action: any) => {
                  processStructuredAction(action, agentType);
                });
              }
            }
          }).catch(error => {
            console.error('❌ Error sending booking not found result:', error);
          });
        }
        break;
        
      case 'add_customer':
        console.log('👤 Customer added to CRM:', action.data);
        // You can add CRM state management here if needed
        break;
        
      case 'add_to_cart':
        console.log('🛒 Cart item added:', action.data);
        // You can add cart state management here if needed
        break;
        
      default:
        console.log('❓ Unknown action type:', action.type);
    }
  };

  // Update demo state based on agent response (fallback for text parsing)
  const handleBookingConfirmation = (responseData: any, agentType: string) => {
    console.log('🔄 Processing state update (text parsing fallback):', responseData);
    
    if (responseData.type === 'booking') {
      const newBooking = {
        time: responseData.data.time,
        date: responseData.data.date,
        customerName: responseData.data.customer_name,
        customerEmail: '',
        service: responseData.data.service || '',
        status: 'confirmed' as const
      };

      addBooking(agentType, newBooking);
      console.log('📅 Calendar updated with new booking:', newBooking);
    } else if (responseData.type === 'cart') {
      // Handle cart updates
      console.log('🛒 Cart item added:', responseData.data);
      // You can add cart state management here if needed
    } else if (responseData.type === 'customer') {
      // Handle customer/CRM updates
      console.log('👤 Customer added to CRM:', responseData.data);
      // You can add CRM state management here if needed
    }
  };

  // Send message function using WebSocket
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    console.log('📤 PhonePanel: Sending message:', inputMessage, 'to agent:', agentType);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Send message via HTTP API
    try {
      console.log('📤 PhonePanel: Sending HTTP request to /api/chat');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          agentType,
          sessionId: 'chat-session',
        }),
      });

      console.log('📥 PhonePanel: Response status:', res.status);
      const data = await res.json();
      console.log('📥 PhonePanel: Response data:', data);

      if (data.type === 'agent_response') {
        console.log('🤖 PhonePanel: Processing agent response:', data.message);
        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.message,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, agentMessage]);

        // Process structured actions if available
        if (data.actions && Array.isArray(data.actions)) {
          console.log('🔄 FRONTEND - Processing structured actions:', data.actions);
          data.actions.forEach((action: any) => {
            processStructuredAction(action, agentType);
          });
        } else {
          // Fallback to text parsing for backward compatibility
          const bookingConfirmation = parseBookingConfirmation(data.message, agentType);
          if (bookingConfirmation) {
            console.log('📅 FRONTEND - Booking confirmation detected via text parsing:', bookingConfirmation);
            handleBookingConfirmation(bookingConfirmation, agentType);
          } else {
            console.log('ℹ️ FRONTEND - No booking confirmation detected in response');
          }
        }
      } else if (data.type === 'error') {
        console.error('❌ PhonePanel: Error response:', data.message);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `Error: ${data.message}`,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      console.error('❌ PhonePanel: Failed to send message:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: Failed to connect to server.`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Note: WebSocket message handling removed - now using HTTP API directly in sendMessage
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Cleanup WebSocket connection
      disconnectVoiceAgent();
      // Cleanup audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
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
                  isCallActive ? 'bg-red-500' : 
                  isListening ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {isCallActive ? 'Call Active • Listening for your voice' :
                   isListening ? 'In Call • Processing audio' : 
                   isVoiceAgentActive ? 'Voice Agent Active' :
                   isVoiceAgentConnected ? 'Voice Agent Connected' : 'Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area - Always present spacer, conditional content */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.length > 0 && (
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

        {/* Realtime Text Input (for testing) */}
        {isVoiceAgentConnected && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={realtimeTextInput}
                onChange={(e) => setRealtimeTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendRealtimeTextMessage()}
                placeholder="Type to test RealtimeRunner..."
                className={`flex-1 px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <button
                onClick={sendRealtimeTextMessage}
                disabled={!realtimeTextInput.trim()}
                className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                  realtimeTextInput.trim()
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Send
              </button>
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
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
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
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
            }`}
            animate={isCallActive ? { 
              scale: [1, 1.05, 1],
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
            {/* Always show phone icon, color changes based on state */}
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </motion.button>

          {/* Message Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowChat(!showChat)}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
              showChat
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
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
