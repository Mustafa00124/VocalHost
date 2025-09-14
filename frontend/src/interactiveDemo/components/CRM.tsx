import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useDemoState, type Customer } from '../state/demoStateProvider';

interface CRMProps {
  agentType: string;
}

const CRM: React.FC<CRMProps> = ({ agentType }) => {
  const { theme } = useTheme();
  const { state, addCustomer, removeCustomer } = useDemoState();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    preferences: [] as string[]
  });

  // Get customers from state instead of memory
  const customers = state.crm[agentType] || [];

  // No need to load from memory - using state directly

  // Handle adding new customer
  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.email) return;

    addCustomer(agentType, {
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      lastVisit: new Date().toISOString().split('T')[0],
      totalVisits: 0,
      status: 'active',
      notes: newCustomer.notes,
      preferences: newCustomer.preferences
    });
    
    // Reset form and close modal
    setNewCustomer({ name: '', email: '', phone: '', notes: '', preferences: [] });
    setShowAddCustomerModal(false);
  };

  // Handle removing customer
  const handleRemoveCustomer = (customerId: string) => {
    removeCustomer(agentType, customerId);
    
    // Clear selection if removed customer was selected
    if (selectedCustomer?.id === customerId) {
      setSelectedCustomer(null);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`h-full flex ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Customer List */}
      <div className={`w-2/5 border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex flex-col`}>
        {/* Header */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Customers
            </h2>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${
                theme === 'dark'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              +
            </button>
          </div>
        </div>

        {/* Customer List - Vertical scroll only */}
        <div className="overflow-y-auto flex-1">
          {customers.map((customer) => (
            <motion.div
              key={customer.id}
              className={`p-3 border-b cursor-pointer transition-colors relative group ${
                selectedCustomer?.id === customer.id
                  ? theme === 'dark'
                    ? 'bg-blue-600'
                    : 'bg-blue-50'
                  : theme === 'dark'
                  ? 'hover:bg-gray-700 border-gray-700'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
              onClick={() => setSelectedCustomer(customer)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {customer.name}
                  </h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    ID: {customer.id}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCustomer(customer.id);
                  }}
                  className={`opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center text-sm transition-opacity ${
                    theme === 'dark'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  −
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Customer Details - Horizontal and Vertical Scroll */}
      <div className="flex-1 overflow-auto p-6">
        {selectedCustomer ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 min-w-max"
          >
            {/* Customer Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {selectedCustomer.name}
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Customer since {new Date(selectedCustomer.lastVisit).getFullYear()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCustomer.status)}`}>
                {selectedCustomer.status.toUpperCase()}
              </span>
            </div>

            {/* Three Categories Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Contact Information */}
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Contact
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email
                    </label>
                    <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {selectedCustomer.email}
                    </p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Phone
                    </label>
                    <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {selectedCustomer.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Stats
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Total Visits
                    </label>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {selectedCustomer.totalVisits}
                    </p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Last Visit
                    </label>
                    <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {new Date(selectedCustomer.lastVisit).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status & Plan */}
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Status & Plan
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Status
                    </label>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedCustomer.status)}`}>
                      {selectedCustomer.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Plan
                    </label>
                    <p className={`text-sm font-medium ${
                      selectedCustomer.status === 'vip' 
                        ? 'text-purple-600' 
                        : selectedCustomer.status === 'active'
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }`}>
                      {selectedCustomer.status === 'vip' ? 'Pro' : selectedCustomer.status === 'active' ? 'Standard' : 'Basic'}
                    </p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Notes
                    </label>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedCustomer.notes || 'No notes available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className={`text-6xl mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
                👥
              </div>
              <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Select a customer to view details
              </h3>
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal - Within Mac */}
      <AnimatePresence>
        {showAddCustomerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowAddCustomerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`p-4 rounded-lg shadow-xl max-w-xs w-full mx-2 max-h-96 overflow-y-auto ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-base font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Add Customer
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className={`w-full px-2 py-1 text-sm rounded border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter name"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className={`w-full px-2 py-1 text-sm rounded border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter email"
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className={`w-full px-2 py-1 text-sm rounded border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter phone"
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Notes
                  </label>
                  <textarea
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                    className={`w-full px-2 py-1 text-sm rounded border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter notes"
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowAddCustomerModal(false)}
                  className={`px-3 py-1 text-sm rounded ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomer}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CRM;
