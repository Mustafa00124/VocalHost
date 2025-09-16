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
  const { addBooking } = useDemoState();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Agent type display names
  const agentNames = {
    restaurant: 'Restaurant Assistant',
    salon: 'Salon Assistant', 
    ecommerce: 'E-commerce Assistant',
    dentist: 'Dental Assistant',
    support: 'Customer Support Assistant'
  };

  const agentName = agentNames[agentType as keyof typeof agentNames] || 'Assistant';

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send initial greeting when component mounts
  useEffect(() => {
    const greeting = `Hello! I'm your ${agentName}. How can I help you today?`;
    const greetingMessage: Message = {
      id: Date.now().toString(),
      text: greeting,
      sender: 'agent',
      timestamp: new Date()
    };
    setMessages([greetingMessage]);
  }, [agentName]);

  // Parse booking confirmation from text response
  const parseBookingConfirmation = (responseText: string, agentType: string) => {
    // Look for booking confirmation patterns
    const bookingPatterns = {
      restaurant: /Reservation confirmed for (.+?) - Party of (\d+) on (.+?) at (.+?)\./i,
      salon: /Appointment booked for (.+?) - (.+?) on (.+?) at (.+?)\./i,
      dentist: /Dental appointment scheduled for (.+?) - (.+?) on (.+?) at (.+?)\./i,
      ecommerce: /Order processed for (.+?):\s*Items: (.+?)\./i,
      support: /Support ticket created for (.+?):\s*Issue: (.+?)\s*Description: (.+?)\./i
    };

    const pattern = bookingPatterns[agentType as keyof typeof bookingPatterns];
    if (!pattern) return null;

    const match = responseText.match(pattern);
    if (!match) return null;

    // Extract booking details based on agent type
    if (agentType === 'restaurant') {
      const [, customerName, partySize, date, time] = match;
      return {
        type: 'booking',
        data: {
          time: time,
          date: date,
          customerName: customerName,
          service: 'Restaurant Reservation'
        }
      };
    } else if (agentType === 'salon') {
      const [, customerName, service, date, time] = match;
      return {
        type: 'booking',
        data: {
          time: time,
          date: date,
          customerName: customerName,
          service: service
        }
      };
    } else if (agentType === 'dentist') {
      const [, customerName, procedure, date, time] = match;
      return {
        type: 'booking',
        data: {
          time: time,
          date: date,
          customerName: customerName,
          service: procedure
        }
      };
    }

    return null;
  };

  // Update calendar based on booking confirmation
  const handleBookingConfirmation = (bookingData: any, agentType: string) => {
    if (bookingData.type === 'booking') {
      addBooking(agentType, {
        time: bookingData.data.time,
        date: bookingData.data.date,
        customerName: bookingData.data.customerName,
        customerEmail: '',
        service: bookingData.data.service,
        status: 'confirmed' as const
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
          sender: 'agent',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, agentMessage]);

        // Check if this is a booking confirmation and update calendar
        const bookingConfirmation = parseBookingConfirmation(data.response, agentType);
        if (bookingConfirmation) {
          handleBookingConfirmation(bookingConfirmation, agentType);
        }
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `Error: ${data.message}`,
          sender: 'agent',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Connection error: ${error}`,
        sender: 'agent',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
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
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
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
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="bg-white text-gray-800 shadow-sm px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
