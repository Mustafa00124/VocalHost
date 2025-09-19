import React, { useState, useEffect, useRef } from 'react';
import { useDemoState } from '../state/demoStateProvider';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface ChatInterfaceProps {
  agentType: string;
  onBackToCall: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ agentType, onBackToCall }) => {
  const { addBooking, cancelBooking } = useDemoState();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() => `chat-${Date.now()}`);

  // Agent type display names
  const agentNames = {
    restaurant: 'Restaurant Assistant',
    salon: 'Salon Assistant',
    ecommerce: 'E-commerce Assistant',
    dentist: 'Dental Assistant',
    support: 'Customer Support Assistant',
  };

  const agentName = agentNames[agentType as keyof typeof agentNames] || 'Assistant';

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get greeting when mounted
  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        console.log('🎯 FRONTEND - Fetching greeting for agentType:', agentType);
        const res = await fetch(`/api/greeting?agentType=${agentType}`);
        console.log('📥 FRONTEND - Greeting response status:', res.status);
        
        const data = await res.json();
        console.log('📥 FRONTEND - Greeting response data:', data);
        
        if (data.type === 'greeting') {
          const greetingMessage: Message = {
            id: `greeting_${Date.now()}`,
            text: data.message,
            sender: 'agent',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, greetingMessage]);
          console.log('✅ FRONTEND - Greeting message added:', greetingMessage.text);
        }
      } catch (err) {
        console.error('❌ FRONTEND - Failed to fetch greeting:', err);
      }
    };

    fetchGreeting();
  }, [agentType]);

  // Parse booking confirmation from text response - updated to match actual agent responses
  const parseBookingConfirmation = (responseText: string, agentType: string) => {
    const bookingPatterns = {
      restaurant: /Reservation confirmed for (.+?) on (.+?) at (.+?)\. Booking ID: (.+)/i,
      salon: /Appointment booked for (.+?) - (.+?) on (.+?) at (.+?)\. Appointment ID: (.+)/i,
      dentist: /Dental appointment scheduled for (.+?) - (.+?) on (.+?) at (.+?)\. Appointment ID: (.+)/i,
      ecommerce: /Added to cart: (\d+)x (.+?) at \$\d+\.\d+ each \(Total: \$\d+\.\d+\)\. Cart Item ID: (.+)/i,
      support: /Customer added to CRM: (.+?) \(ID: (.+?)\)\nEmail: (.+?)\nPhone: (.+)/i,
    };

    const pattern = bookingPatterns[agentType as keyof typeof bookingPatterns];
    if (!pattern) return null;

    const match = responseText.match(pattern);
    if (!match) return null;

    if (agentType === 'restaurant') {
      const [, customerName, date, time, bookingId] = match;
      return {
        type: 'booking',
        data: {
          time,
          date,
          customerName,
          service: 'Restaurant Reservation',
          id: bookingId,
          status: 'confirmed'
        },
      };
    } else if (agentType === 'salon') {
      const [, customerName, service, date, time, appointmentId] = match;
      return {
        type: 'booking',
        data: {
          time,
          date,
          customerName,
          service,
          id: appointmentId,
          status: 'confirmed'
        },
      };
    } else if (agentType === 'dentist') {
      const [, customerName, procedure, date, time, appointmentId] = match;
      return {
        type: 'booking',
        data: {
          time,
          date,
          customerName,
          service: procedure,
          id: appointmentId,
          status: 'confirmed'
        },
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
        },
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
        },
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

  // Update calendar based on booking confirmation (fallback for text parsing)
  const handleBookingConfirmation = (bookingData: any, agentType: string) => {
    if (bookingData.type === 'booking') {
      addBooking(agentType, {
        time: bookingData.data.time,
        date: bookingData.data.date,
        customerName: bookingData.data.customerName,
        customerEmail: '',
        service: bookingData.data.service,
        status: 'confirmed' as const,
      });
      console.log('📅 Calendar updated with new booking:', bookingData.data);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    console.log('🚀 FRONTEND - Sending message:', {
      userMessage: userMessage.text,
      agentType,
      sessionId,
      timestamp: userMessage.timestamp.toISOString()
    });

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    const requestPayload = {
      message: inputMessage,
      agentType,
      sessionId,
    };

    console.log('📤 FRONTEND - Request payload:', requestPayload);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      console.log('📥 FRONTEND - Response status:', res.status);
      console.log('📥 FRONTEND - Response headers:', Object.fromEntries(res.headers.entries()));

      const data = await res.json();
      console.log('📥 FRONTEND - Response data:', data);

      if (data.type === 'agent_response') {
        const agentMessage: Message = {
          id: `agent_${Date.now()}`,
          text: data.message,
          sender: 'agent',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, agentMessage]);

        console.log('✅ FRONTEND - Agent message added:', {
          id: agentMessage.id,
          text: agentMessage.text.substring(0, 100) + '...',
          timestamp: agentMessage.timestamp.toISOString()
        });

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
        console.error('❌ FRONTEND - Error response:', data.message);
        const errorMessage: Message = {
          id: `error_${Date.now()}`,
          text: `Error: ${data.message}`,
          sender: 'agent',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (err) {
      console.error('❌ FRONTEND - Failed to send message:', err);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        text: `Error: Failed to connect to server.`,
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm border-b">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToCall}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{agentName}</h2>
              <p className="text-sm text-gray-500">Text Chat</p>
            </div>
          </div>
        </div>
        <button
          onClick={onBackToCall}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          <span>Call</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {message.sender === 'user' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800 shadow-sm'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="bg-white text-gray-800 shadow-sm px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
