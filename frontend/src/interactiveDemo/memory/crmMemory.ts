// CRM Memory Manager
// Stores customer data for each agent type separately in localStorage

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

export interface CrmMemory {
  customers: Customer[];
  lastUpdated: string;
}

class CrmMemoryManager {
  private getStorageKey(agentType: string): string {
    return `demo_crm_${agentType}`;
  }

  // Get all customers for an agent
  getCustomers(agentType: string): Customer[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(agentType));
      if (data) {
        const memory: CrmMemory = JSON.parse(data);
        return memory.customers;
      }
      return this.getDefaultCustomers(agentType);
    } catch (error) {
      console.error('Error loading CRM memory:', error);
      return this.getDefaultCustomers(agentType);
    }
  }

  // Get default sample customers
  private getDefaultCustomers(agentType: string): Customer[] {
    const baseCustomers = [
      {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1 (555) 123-4567',
        lastVisit: '2024-01-15',
        totalVisits: 5,
        status: 'active' as const,
        notes: 'Prefers morning appointments',
        preferences: ['Morning'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '+1 (555) 987-6543',
        lastVisit: '2024-01-10',
        totalVisits: 12,
        status: 'vip' as const,
        notes: 'Regular customer, always books the same service',
        preferences: ['Same Service', 'Premium'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z'
      },
      {
        id: '3',
        name: 'Mike Davis',
        email: 'mike.davis@email.com',
        phone: '+1 (555) 456-7890',
        lastVisit: '2023-12-20',
        totalVisits: 3,
        status: 'inactive' as const,
        notes: 'Last visit was for emergency service',
        preferences: ['Emergency Only'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2023-12-20T00:00:00Z'
      }
    ];

    // Customize based on agent type
    if (agentType === 'restaurant') {
      baseCustomers[0].notes = 'Prefers table by window, vegetarian options';
      baseCustomers[0].preferences = ['Window Table', 'Vegetarian'];
      baseCustomers[1].notes = 'Regular customer, always books same table';
      baseCustomers[1].preferences = ['Same Table', 'VIP Service'];
    } else if (agentType === 'salon') {
      baseCustomers[0].notes = 'Prefers morning appointments, same stylist';
      baseCustomers[0].preferences = ['Morning', 'Same Stylist'];
      baseCustomers[1].notes = 'Regular customer, always books same stylist';
      baseCustomers[1].preferences = ['Same Stylist', 'Premium Service'];
    } else if (agentType === 'dentist') {
      baseCustomers[0].notes = 'Prefers morning appointments, no pain medication';
      baseCustomers[0].preferences = ['Morning', 'No Pain Meds'];
      baseCustomers[1].notes = 'Regular patient, always books same dentist';
      baseCustomers[1].preferences = ['Same Dentist', 'VIP Care'];
    }

    this.saveCustomers(agentType, baseCustomers);
    return baseCustomers;
  }

  // Add a new customer
  addCustomer(agentType: string, customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer {
    const newCustomer: Customer = {
      ...customer,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const currentCustomers = this.getCustomers(agentType);
    const updatedCustomers = [...currentCustomers, newCustomer];
    
    this.saveCustomers(agentType, updatedCustomers);
    return newCustomer;
  }

  // Update a customer
  updateCustomer(agentType: string, customerId: string, updates: Partial<Customer>): boolean {
    const currentCustomers = this.getCustomers(agentType);
    const customerIndex = currentCustomers.findIndex(customer => customer.id === customerId);
    
    if (customerIndex === -1) return false;

    const updatedCustomers = [...currentCustomers];
    updatedCustomers[customerIndex] = { 
      ...updatedCustomers[customerIndex], 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveCustomers(agentType, updatedCustomers);
    return true;
  }

  // Remove a customer
  removeCustomer(agentType: string, customerId: string): boolean {
    const currentCustomers = this.getCustomers(agentType);
    const updatedCustomers = currentCustomers.filter(customer => customer.id !== customerId);
    
    this.saveCustomers(agentType, updatedCustomers);
    return true;
  }

  // Search customers
  searchCustomers(agentType: string, searchTerm: string): Customer[] {
    const customers = this.getCustomers(agentType);
    const term = searchTerm.toLowerCase();
    
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term) ||
      customer.phone.includes(term)
    );
  }

  // Save customers to localStorage
  private saveCustomers(agentType: string, customers: Customer[]): void {
    try {
      const memory: CrmMemory = {
        customers,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.getStorageKey(agentType), JSON.stringify(memory));
    } catch (error) {
      console.error('Error saving CRM memory:', error);
    }
  }

  // Clear all data for an agent
  clearAgentData(agentType: string): void {
    localStorage.removeItem(this.getStorageKey(agentType));
  }

  // Clear all CRM data
  clearAllData(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('demo_crm_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const crmMemory = new CrmMemoryManager();
