import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useDemoState } from '../state/demoStateProvider';

interface CalendarProps {
  agentType: string;
}

const Calendar: React.FC<CalendarProps> = ({ agentType }) => {
  const { theme } = useTheme();
  const { state, addBooking, cancelBooking } = useDemoState();
  const [currentWeek, setCurrentWeek] = useState(new Date(2025, 0, 6)); // Start with first week of January 2025
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    customerName: ''
  });

  // Get bookings from state instead of memory
  const bookings = state.calendar[agentType] || [];

  // Generate time slots (8 AM to 6 PM)
  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = 8 + i;
    return `${hour}:00 ${hour < 12 ? 'AM' : hour === 12 ? 'PM' : 'PM'}`;
  });

  // Generate week days (limited to January 2025)
  const getWeekDays = () => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday
    
    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      
      // Check if date is in January 2025
      const isInJanuary2025 = date.getFullYear() === 2025 && date.getMonth() === 0;
      
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        date: date.getDate(),
        fullDate: date.toISOString().split('T')[0],
        isInJanuary2025,
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      };
    });
  };

  // Check if a slot is booked
  const isSlotBooked = (time: string, date: string) => {
    return bookings.some(booking =>
      booking.time === time && booking.date === date && booking.status === 'confirmed'
    );
  };

  // Get booking for a slot
  const getSlotBooking = (time: string, date: string) => {
    return bookings.find(booking =>
      booking.time === time && booking.date === date && booking.status === 'confirmed'
    );
  };

  // Handle slot click
  const handleSlotClick = (time: string, date: string) => {
    const existingBooking = getSlotBooking(time, date);
    if (existingBooking) {
      // Show booking details
      setSelectedSlot(JSON.stringify({ time, date }));
    } else {
      // Show booking modal
      setSelectedSlot(JSON.stringify({ time, date }));
      setShowBookingModal(true);
    }
  };

  // Handle booking creation
  const handleCreateBooking = () => {
    if (!selectedSlot || !newBooking.customerName) return;

    const { time, date } = JSON.parse(selectedSlot);
    
    addBooking(agentType, {
      time,
      date,
      customerName: newBooking.customerName,
      customerEmail: '',
      service: 'General Consultation',
      status: 'confirmed'
    });
    
    // Reset all modal states
    setShowBookingModal(false);
    setSelectedSlot(null);
    setNewBooking({ customerName: '' });
  };

  // Handle booking cancellation
  const handleCancelBooking = (bookingId: string) => {
    cancelBooking(agentType, bookingId);
    setSelectedSlot(null);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedSlot(null);
    setNewBooking({ customerName: '' });
  };

  // Navigate weeks (limited to January 2025)
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    
    // Check if new week is still in January 2025
    const weekStart = new Date(newWeek);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Start from Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4); // End on Friday
    
    const isInJanuary2025 = weekStart.getFullYear() === 2025 && weekStart.getMonth() === 0;
    
    if (isInJanuary2025) {
      setCurrentWeek(newWeek);
    }
  };

  const weekDays = getWeekDays();

  return (
    <div className={`h-full flex flex-col ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Calendar Header */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {agentType === 'restaurant' ? 'Restaurant Bookings' : 
             agentType === 'salon' ? 'Salon Appointments' :
             agentType === 'dentist' ? 'Dental Appointments' : 'Appointments'}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateWeek('prev')}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              ←
            </button>
            <span className={`px-3 py-1 rounded-lg ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Week of {currentWeek.toLocaleDateString()} (January 2025)
            </span>
            <button
              onClick={() => navigateWeek('next')}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-6 gap-0 h-full">
          {/* Time column */}
          <div className={`p-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="space-y-1">
              {timeSlots.map((time) => (
                <div key={time} className={`h-12 flex items-center text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {time}
                </div>
              ))}
            </div>
          </div>

          {/* Day columns */}
          {weekDays.map((day) => (
            <div key={day.fullDate} className="flex flex-col">
              {/* Day header */}
              <div className={`p-2 text-center border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'} ${day.isWeekend ? 'opacity-60' : ''} ${!day.isInJanuary2025 ? 'opacity-30' : ''}`}>
                <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {day.day}
                </div>
                <div className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {day.date}
                </div>
              </div>

              {/* Time slots */}
              <div className="flex-1">
                 {timeSlots.map((time) => {
                   const isBooked = isSlotBooked(time, day.fullDate);
                   const booking = getSlotBooking(time, day.fullDate);
                  
                  return (
                    <motion.div
                      key={`${day.fullDate}-${time}`}
                      className={`h-12 border-b cursor-pointer transition-all duration-200 ${
                        !day.isInJanuary2025
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : isBooked
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : theme === 'dark'
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                          : 'bg-white hover:bg-gray-50 text-gray-500'
                      }`}
                      onClick={() => day.isInJanuary2025 && handleSlotClick(time, day.fullDate)}
                      whileHover={day.isInJanuary2025 ? { scale: 1.02 } : {}}
                      whileTap={day.isInJanuary2025 ? { scale: 0.98 } : {}}
                    >
                      <div className="p-2 h-full flex items-center justify-center">
                        {!day.isInJanuary2025 ? (
                          <span className="text-xs text-gray-400">Not Available</span>
                        ) : isBooked ? (
                          <div className="text-center">
                            <div className="text-xs font-semibold truncate text-white">
                              {booking?.customerName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs">Available</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Modal - Within Mac */}
      <AnimatePresence mode="wait">
        {showBookingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`p-4 rounded-lg shadow-xl max-w-sm w-full mx-4 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-base font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Book Appointment
              </h3>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Customer Name
                </label>
                <input
                  type="text"
                  value={newBooking.customerName}
                  onChange={(e) => setNewBooking({ customerName: e.target.value })}
                  className={`w-full px-3 py-2 rounded border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter customer name"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={handleCloseModal}
                  className={`px-3 py-1 rounded text-sm ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBooking}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Book
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Details Modal - Within Mac */}
      <AnimatePresence mode="wait">
        {selectedSlot && !showBookingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedSlot(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`p-4 rounded-lg shadow-xl max-w-sm w-full mx-4 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const { time, date } = JSON.parse(selectedSlot);
                const booking = getSlotBooking(time, date);
                
                if (!booking) return null;
                
                return (
                  <>
                    <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Booking Details
                    </h3>
                    
                    <div className="space-y-2">
                      <div>
                        <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Time: 
                        </span>
                        <span className={`ml-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {time}
                        </span>
                      </div>
                      <div>
                        <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Date: 
                        </span>
                        <span className={`ml-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {new Date(date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Customer: 
                        </span>
                        <span className={`ml-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {booking.customerName}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={() => setSelectedSlot(null)}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          theme === 'dark'
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                      >
                        Clear Slot
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Calendar;
