// Calendar Memory Manager
// Stores booking data for each agent type separately in localStorage

export interface Booking {
  id: string;
  time: string;
  date: string;
  customerName: string;
  customerEmail: string;
  service: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
}

export interface CalendarMemory {
  bookings: Booking[];
  lastUpdated: string;
}

class CalendarMemoryManager {
  private getStorageKey(agentType: string): string {
    return `demo_calendar_${agentType}`;
  }

  // Get all bookings for an agent
  getBookings(agentType: string): Booking[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(agentType));
      if (data) {
        const memory: CalendarMemory = JSON.parse(data);
        return memory.bookings.filter(booking => booking.status !== 'cancelled');
      }
      return [];
    } catch (error) {
      console.error('Error loading calendar memory:', error);
      return [];
    }
  }

  // Add a new booking
  addBooking(agentType: string, booking: Omit<Booking, 'id' | 'createdAt'>): Booking {
    const newBooking: Booking = {
      ...booking,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    const currentBookings = this.getBookings(agentType);
    const updatedBookings = [...currentBookings, newBooking];
    
    this.saveBookings(agentType, updatedBookings);
    return newBooking;
  }

  // Update a booking
  updateBooking(agentType: string, bookingId: string, updates: Partial<Booking>): boolean {
    const currentBookings = this.getBookings(agentType);
    const bookingIndex = currentBookings.findIndex(booking => booking.id === bookingId);
    
    if (bookingIndex === -1) return false;

    const updatedBookings = [...currentBookings];
    updatedBookings[bookingIndex] = { ...updatedBookings[bookingIndex], ...updates };
    
    this.saveBookings(agentType, updatedBookings);
    return true;
  }

  // Cancel a booking (soft delete)
  cancelBooking(agentType: string, bookingId: string): boolean {
    return this.updateBooking(agentType, bookingId, { status: 'cancelled' });
  }

  // Remove a booking completely
  removeBooking(agentType: string, bookingId: string): boolean {
    const currentBookings = this.getBookings(agentType);
    const updatedBookings = currentBookings.filter(booking => booking.id !== bookingId);
    
    this.saveBookings(agentType, updatedBookings);
    return true;
  }

  // Check if a slot is booked
  isSlotBooked(agentType: string, time: string, date: string): boolean {
    const bookings = this.getBookings(agentType);
    return bookings.some(booking => 
      booking.time === time && 
      booking.date === date && 
      booking.status !== 'cancelled'
    );
  }

  // Get booking for a specific slot
  getSlotBooking(agentType: string, time: string, date: string): Booking | null {
    const bookings = this.getBookings(agentType);
    return bookings.find(booking => 
      booking.time === time && 
      booking.date === date && 
      booking.status !== 'cancelled'
    ) || null;
  }

  // Save bookings to localStorage
  private saveBookings(agentType: string, bookings: Booking[]): void {
    try {
      const memory: CalendarMemory = {
        bookings,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.getStorageKey(agentType), JSON.stringify(memory));
    } catch (error) {
      console.error('Error saving calendar memory:', error);
    }
  }

  // Clear all data for an agent (for testing)
  clearAgentData(agentType: string): void {
    localStorage.removeItem(this.getStorageKey(agentType));
  }

  // Clear all calendar data
  clearAllData(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('demo_calendar_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const calendarMemory = new CalendarMemoryManager();
