import { useDemoState } from '../state/demoStateProvider';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private demoState: any = null;
  private messageCallbacks: ((message: any) => void)[] = [];

  constructor() {
    this.connect();
  }

  setDemoState(demoState: any) {
    this.demoState = demoState;
  }

  addMessageCallback(callback: (message: any) => void) {
    this.messageCallbacks.push(callback);
  }

  removeMessageCallback(callback: (message: any) => void) {
    this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
  }

  connect() {
    try {
      const url = 'ws://localhost:5000/demo/ws';
      console.log("🔌 Connecting to WebSocket at", url);
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log("✅ WebSocket connected");
        this.reconnectAttempts = 0;
        
        // Send initial connection message
        this.sendMessage({
          type: 'set_agent_type',
          agent_type: 'restaurant'
        });
        console.log('📤 Sent initial agent type message');
      };

      this.ws.onmessage = (event) => {
        console.log("📩 WS message:", event.data);
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.warn("⚠️ WS closed:", event.code, event.reason);
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("❌ WS error:", error);
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleMessage(message: any) {
    if (!this.demoState) return;

    switch (message.type) {
      case 'state_update':
        this.handleStateUpdate(message);
        break;
      case 'response':
        this.handleAgentResponse(message);
        break;
      case 'greeting':
        console.log('Agent greeting:', message.message);
        this.handleAgentGreeting(message);
        break;
      case 'error':
        console.error('WebSocket error:', message.message);
        // Notify callbacks about errors
        this.messageCallbacks.forEach(callback => {
          try {
            callback({
              type: 'error',
              message: message.message
            });
          } catch (error) {
            console.error('Error in error callback:', error);
          }
        });
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private handleStateUpdate(message: any) {
    const { action, agentType, payload, messageId } = message;
    console.log(`🔄 State update received: ${action} for ${agentType}`, payload);

    try {
      switch (action) {
        case 'addBooking':
          // payload should already contain the ID from backend
          this.demoState.addBooking(agentType, payload);
          break;
        case 'cancelBooking':
          this.demoState.cancelBooking(agentType, payload.id);
          break;
        case 'addCustomer':
          this.demoState.addCustomer(agentType, payload);
          break;
        case 'removeCustomer':
          this.demoState.removeCustomer(agentType, payload.id);
          break;
        case 'addToCart':
          this.demoState.addToCart(agentType, payload);
          break;
        case 'removeFromCart':
          this.demoState.removeFromCart(agentType, payload.id);
          break;
        case 'updateCartQuantity':
          this.demoState.updateCartQuantity(agentType, payload.id, payload.quantity);
          break;
        default:
          console.warn(`Unknown state update action: ${action}`);
          this.sendAck(messageId, action, 'failed');
          return;
      }

      // Send acknowledgment
      this.sendAck(messageId, action, 'success');
      console.log(`✅ State update applied: ${action} for ${agentType}`);
    } catch (error) {
      console.error(`❌ Error applying state update ${action}:`, error);
      this.sendAck(messageId, action, 'failed');
    }
  }

  private sendAck(messageId: string, action: string, status: 'success' | 'failed') {
    this.sendMessage({
      type: 'ack',
      messageId: messageId,
      action: action,
      status: status
    });
  }

  private handleAgentResponse(message: any) {
    console.log('🤖 Agent response:', message.message);
    
    // Notify all registered callbacks
    this.messageCallbacks.forEach(callback => {
      try {
        callback({
          type: 'agent_response',
          message: message.message,
          agentType: message.agent_type,
          sessionId: message.session_id
        });
      } catch (error) {
        console.error('Error in message callback:', error);
      }
    });
  }

  private handleCalendarUpdate(message: any) {
    const { action, agent_type, data } = message;
    const currentBookings = this.demoState.state.calendar[agent_type] || [];

    switch (action) {
      case 'add_booking':
        const newBooking = {
          id: data.id,
          time: data.time,
          date: data.date,
          customerName: data.customer_name,
          customerEmail: '',
          service: '',
          status: 'confirmed' as const
        };
        this.demoState.updateCalendar(agent_type, [...currentBookings, newBooking]);
        break;

      case 'cancel_booking':
        const updatedBookings = currentBookings.map((booking: any) =>
          booking.id === data.booking_id ? { ...booking, status: 'cancelled' } : booking
        );
        this.demoState.updateCalendar(agent_type, updatedBookings);
        break;

      default:
        console.log('Unknown calendar action:', action);
    }
  }

  private handleCRMUpdate(message: any) {
    const { action, agent_type, data } = message;
    const currentCustomers = this.demoState.state.crm[agent_type] || [];

    switch (action) {
      case 'add_customer':
        const newCustomer = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          lastVisit: data.last_visit || '',
          totalVisits: data.total_visits || 0,
          status: data.status || 'active',
          notes: data.notes || '',
          preferences: data.preferences || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.demoState.updateCRM(agent_type, [...currentCustomers, newCustomer]);
        break;

      case 'remove_customer':
        const filteredCustomers = currentCustomers.filter((customer: any) => 
          customer.id !== data.customer_id
        );
        this.demoState.updateCRM(agent_type, filteredCustomers);
        break;

      default:
        console.log('Unknown CRM action:', action);
    }
  }

  private handleShoppingUpdate(message: any) {
    const { action, agent_type, data } = message;
    const currentCart = this.demoState.state.shopping[agent_type] || [];

    switch (action) {
      case 'add_to_cart':
        const newItem = {
          id: data.id,
          product_id: data.product_id,
          name: data.name,
          price: data.price,
          quantity: data.quantity || 1,
          image: data.image,
          size: data.size || 'M',
          color: data.color || 'Default',
          addedAt: new Date().toISOString()
        };
        this.demoState.updateShopping(agent_type, [...currentCart, newItem]);
        break;

      case 'remove_from_cart':
        const filteredCart = currentCart.filter((item: any) => item.id !== data.item_id);
        this.demoState.updateShopping(agent_type, filteredCart);
        break;

      case 'update_quantity':
        const updatedCart = currentCart.map((item: any) =>
          item.id === data.item_id ? { ...item, quantity: data.quantity } : item
        );
        this.demoState.updateShopping(agent_type, updatedCart);
        break;

      default:
        console.log('Unknown shopping action:', action);
    }
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log("📤 Sending WS message:", message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  setAgentType(agentType: string) {
    this.sendMessage({
      type: 'set_agent_type',
      agent_type: agentType
    });
  }

  sendChatMessage(message: string, agentType: string, sessionId: string = 'default') {
    console.log('📤 Sending chat message:', { message, agentType, sessionId });
    this.sendMessage({
      type: 'chat',
      message: message,
      agent_type: agentType,
      session_id: sessionId
    });
  }

  private handleAudioOutput(message: any) {
    // Handle audio output from the backend
    // This would typically play the audio through the browser's audio API
    console.log('🎵 Playing audio output');
    // TODO: Implement audio playback
  }

  private handleAgentOutput(message: any) {
    // Handle text output from the agent
    console.log('🤖 Agent output:', message.output);
    // This could update the UI with the agent's response
  }

  private handleAgentGreeting(message: any) {
    // Handle agent greeting message
    console.log('👋 Agent greeting:', message.agent_name, message.message);
    // This could update the UI to show the greeting
    if (this.demoState && this.demoState.addMessage) {
      this.demoState.addMessage({
        id: `greeting_${Date.now()}`,
        text: message.message,
        sender: 'ai' as const,
        timestamp: new Date()
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export singleton instance
export const websocketClient = new WebSocketClient();
