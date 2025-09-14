import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export interface Booking {
  id: string;
  time: string;
  date: string;
  customerName: string;
  customerEmail: string;
  service: string;
  status: 'confirmed' | 'cancelled';
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastVisit: string;
  totalVisits: number;
  status: 'active' | 'inactive' | 'vip';
  notes: string;
  preferences: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size: string;
  color: string;
  addedAt: string;
}

export interface DemoState {
  calendar: {
    [agentType: string]: Booking[];
  };
  crm: {
    [agentType: string]: Customer[];
  };
  shopping: {
    [agentType: string]: CartItem[];
  };
}

interface DemoStateContextType {
  state: DemoState;
  setState: React.Dispatch<React.SetStateAction<DemoState>>;
  updateCalendar: (agentType: string, bookings: Booking[]) => void;
  updateCRM: (agentType: string, customers: Customer[]) => void;
  updateShopping: (agentType: string, cart: CartItem[]) => void;
  addBooking: (agentType: string, booking: Omit<Booking, 'id'>) => void;
  cancelBooking: (agentType: string, bookingId: string) => void;
  addCustomer: (agentType: string, customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeCustomer: (agentType: string, customerId: string) => void;
  addToCart: (agentType: string, item: Omit<CartItem, 'id' | 'addedAt'>) => void;
  removeFromCart: (agentType: string, itemId: string) => void;
  updateCartQuantity: (agentType: string, itemId: string, quantity: number) => void;
}

const DemoStateContext = createContext<DemoStateContextType | undefined>(undefined);

const initialState: DemoState = {
  calendar: {
    restaurant: [],
    salon: [],
    dentist: [],
    support: [],
    ecommerce: []
  },
  crm: {
    restaurant: [],
    salon: [],
    dentist: [],
    support: [],
    ecommerce: []
  },
  shopping: {
    restaurant: [],
    salon: [],
    dentist: [],
    support: [],
    ecommerce: []
  }
};

export const DemoStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DemoState>(initialState);

  const updateCalendar = (agentType: string, bookings: Booking[]) => {
    setState(prev => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        [agentType]: bookings
      }
    }));
  };

  const updateCRM = (agentType: string, customers: Customer[]) => {
    setState(prev => ({
      ...prev,
      crm: {
        ...prev.crm,
        [agentType]: customers
      }
    }));
  };

  const updateShopping = (agentType: string, cart: CartItem[]) => {
    setState(prev => ({
      ...prev,
      shopping: {
        ...prev.shopping,
        [agentType]: cart
      }
    }));
  };

  const addBooking = (agentType: string, booking: Omit<Booking, 'id'>) => {
    const newBooking: Booking = {
      ...booking,
      id: `${booking.date}_${booking.time}_${booking.customerName}`
    };
    setState(prev => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        [agentType]: [...(prev.calendar[agentType] || []), newBooking]
      }
    }));
  };

  const cancelBooking = (agentType: string, bookingId: string) => {
    setState(prev => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        [agentType]: (prev.calendar[agentType] || []).map(booking =>
          booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
        )
      }
    }));
  };

  const addCustomer = (agentType: string, customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: `cust_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      crm: {
        ...prev.crm,
        [agentType]: [...(prev.crm[agentType] || []), newCustomer]
      }
    }));
  };

  const removeCustomer = (agentType: string, customerId: string) => {
    setState(prev => ({
      ...prev,
      crm: {
        ...prev.crm,
        [agentType]: (prev.crm[agentType] || []).filter(customer => customer.id !== customerId)
      }
    }));
  };

  const addToCart = (agentType: string, item: Omit<CartItem, 'id' | 'addedAt'>) => {
    const newItem: CartItem = {
      ...item,
      id: `item_${Date.now()}`,
      addedAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      shopping: {
        ...prev.shopping,
        [agentType]: [...(prev.shopping[agentType] || []), newItem]
      }
    }));
  };

  const removeFromCart = (agentType: string, itemId: string) => {
    setState(prev => ({
      ...prev,
      shopping: {
        ...prev.shopping,
        [agentType]: (prev.shopping[agentType] || []).filter(item => item.id !== itemId)
      }
    }));
  };

  const updateCartQuantity = (agentType: string, itemId: string, quantity: number) => {
    setState(prev => ({
      ...prev,
      shopping: {
        ...prev.shopping,
        [agentType]: (prev.shopping[agentType] || []).map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      }
    }));
  };

  const value: DemoStateContextType = {
    state,
    setState,
    updateCalendar,
    updateCRM,
    updateShopping,
    addBooking,
    cancelBooking,
    addCustomer,
    removeCustomer,
    addToCart,
    removeFromCart,
    updateCartQuantity
  };

  return (
    <DemoStateContext.Provider value={value}>
      {children}
    </DemoStateContext.Provider>
  );
};

export const useDemoState = (): DemoStateContextType => {
  const context = useContext(DemoStateContext);
  if (context === undefined) {
    throw new Error('useDemoState must be used within a DemoStateProvider');
  }
  return context;
};
