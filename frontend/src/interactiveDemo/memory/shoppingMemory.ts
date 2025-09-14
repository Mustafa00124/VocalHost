// Shopping Memory Manager
// Stores shopping cart and order history for e-commerce agent

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
  addedAt: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  orderDate: string;
  estimatedDelivery?: string;
}

export interface ShoppingMemory {
  cart: CartItem[];
  orders: Order[];
  lastUpdated: string;
}

class ShoppingMemoryManager {
  private getStorageKey(agentType: string): string {
    return `demo_shopping_${agentType}`;
  }

  // Get cart items
  getCart(agentType: string): CartItem[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(agentType));
      if (data) {
        const memory: ShoppingMemory = JSON.parse(data);
        return memory.cart;
      }
      return [];
    } catch (error) {
      console.error('Error loading shopping memory:', error);
      return [];
    }
  }

  // Get order history
  getOrders(agentType: string): Order[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(agentType));
      if (data) {
        const memory: ShoppingMemory = JSON.parse(data);
        return memory.orders;
      }
      return [];
    } catch (error) {
      console.error('Error loading shopping memory:', error);
      return [];
    }
  }

  // Add item to cart
  addToCart(agentType: string, item: Omit<CartItem, 'id' | 'addedAt'>): CartItem {
    const newItem: CartItem = {
      ...item,
      id: Date.now().toString(),
      addedAt: new Date().toISOString()
    };

    const currentCart = this.getCart(agentType);
    const existingItemIndex = currentCart.findIndex(cartItem => 
      cartItem.productId === newItem.productId && 
      cartItem.size === newItem.size && 
      cartItem.color === newItem.color
    );

    let updatedCart: CartItem[];
    if (existingItemIndex !== -1) {
      // Update quantity if item already exists
      updatedCart = [...currentCart];
      updatedCart[existingItemIndex].quantity += newItem.quantity;
    } else {
      // Add new item
      updatedCart = [...currentCart, newItem];
    }

    this.saveCart(agentType, updatedCart);
    return newItem;
  }

  // Update cart item quantity
  updateCartItem(agentType: string, itemId: string, quantity: number): boolean {
    if (quantity <= 0) {
      return this.removeFromCart(agentType, itemId);
    }

    const currentCart = this.getCart(agentType);
    const itemIndex = currentCart.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) return false;

    const updatedCart = [...currentCart];
    updatedCart[itemIndex].quantity = quantity;
    
    this.saveCart(agentType, updatedCart);
    return true;
  }

  // Remove item from cart
  removeFromCart(agentType: string, itemId: string): boolean {
    const currentCart = this.getCart(agentType);
    const updatedCart = currentCart.filter(item => item.id !== itemId);
    
    this.saveCart(agentType, updatedCart);
    return true;
  }

  // Clear cart
  clearCart(agentType: string): void {
    this.saveCart(agentType, []);
  }

  // Get cart total
  getCartTotal(agentType: string): number {
    const cart = this.getCart(agentType);
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Get cart item count
  getCartItemCount(agentType: string): number {
    const cart = this.getCart(agentType);
    return cart.reduce((count, item) => count + item.quantity, 0);
  }

  // Create order
  createOrder(agentType: string, orderData: Omit<Order, 'id' | 'orderDate'>): Order {
    const newOrder: Order = {
      ...orderData,
      id: Date.now().toString(),
      orderDate: new Date().toISOString()
    };

    const currentOrders = this.getOrders(agentType);
    const updatedOrders = [...currentOrders, newOrder];
    
    this.saveOrders(agentType, updatedOrders);
    
    // Clear cart after order
    this.clearCart(agentType);
    
    return newOrder;
  }

  // Update order status
  updateOrderStatus(agentType: string, orderId: string, status: Order['status']): boolean {
    const currentOrders = this.getOrders(agentType);
    const orderIndex = currentOrders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) return false;

    const updatedOrders = [...currentOrders];
    updatedOrders[orderIndex].status = status;
    
    this.saveOrders(agentType, updatedOrders);
    return true;
  }

  // Save cart to localStorage
  private saveCart(agentType: string, cart: CartItem[]): void {
    try {
      const existingData = localStorage.getItem(this.getStorageKey(agentType));
      const memory: ShoppingMemory = existingData ? JSON.parse(existingData) : { cart: [], orders: [], lastUpdated: '' };
      
      memory.cart = cart;
      memory.lastUpdated = new Date().toISOString();
      
      localStorage.setItem(this.getStorageKey(agentType), JSON.stringify(memory));
    } catch (error) {
      console.error('Error saving shopping memory:', error);
    }
  }

  // Save orders to localStorage
  private saveOrders(agentType: string, orders: Order[]): void {
    try {
      const existingData = localStorage.getItem(this.getStorageKey(agentType));
      const memory: ShoppingMemory = existingData ? JSON.parse(existingData) : { cart: [], orders: [], lastUpdated: '' };
      
      memory.orders = orders;
      memory.lastUpdated = new Date().toISOString();
      
      localStorage.setItem(this.getStorageKey(agentType), JSON.stringify(memory));
    } catch (error) {
      console.error('Error saving shopping memory:', error);
    }
  }

  // Clear all data for an agent
  clearAgentData(agentType: string): void {
    localStorage.removeItem(this.getStorageKey(agentType));
  }

  // Clear all shopping data
  clearAllData(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('demo_shopping_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const shoppingMemory = new ShoppingMemoryManager();
