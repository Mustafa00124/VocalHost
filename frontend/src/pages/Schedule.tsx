import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { LeftFloatingElements, RightFloatingElements } from '../components/FloatingElements';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Types for appointments and time slots
interface Appointment {
  id: string;
  customerName: string;
  details?: string;
  date: string; // ISO date string
  time: string; // Format: "HH:MM"
  duration?: number; // minutes
  created_at: string;
}

interface TimeSlot {
  id: string;
  date: string; // ISO date string
  time: string; // Format: "HH:MM"
  isBooked: boolean;
}

interface BackendSlot {
  time: string;
  is_booked: boolean;
}

interface BackendBooking {
  id: number;
  date: string;
  time: string;
  customer_name: string;
  details: string | null;
  created_at: string;
}

interface BookingResponse {
  bookings: BackendBooking[];
  slots: Record<string, BackendSlot[]>;
  business_hours: string;
  slot_duration: number;
}

interface AssistantInfo {
  id: number;
  name: string;
  business_name: string;
  start_time: string;
  end_time: string;
  booking_duration_minutes: number;
  available_days: Record<string, boolean>;
  description: string;
  twilio_number: string | null;
  voice_type: string;
}

const Schedule = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedView, setSelectedView] = useState<'day' | 'week' | 'month'>('day');
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [assistantId, setAssistantId] = useState<number | null>(null);

  //
  // ─── 1) FETCH ASSISTANT FOR CURRENT USER ─────────────────────────────────────
  //
  useEffect(() => {
    if (!user) return;

    setError(null);
    console.log('Fetching the user’s assistants…');

    fetch(`${BASE_URL}/api/assistants?user_id=${user.id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error loading assistants (${res.status})`);
        }
        return res.json();
      })
      .then((json: { assistants: AssistantInfo[] }) => {
        if (
          json.assistants &&
          Array.isArray(json.assistants) &&
          json.assistants.length > 0
        ) {
          // Pick the first assistant’s ID (you can modify this to let the user choose if you have multiple)
          setAssistantId(json.assistants[0].id);
        } else {
          console.warn('No assistants found for this user');
          setError('You have no assistants set up yet.');
        }
      })
      .catch((err) => {
        console.error('Error fetching assistants:', err);
        setError('Unable to load assistants.');
      });
  }, [user]);

  //
  // ─── 2) ONCE ASSISTANT ID IS KNOWN, FETCH BOOKINGS + SLOTS ───────────────────
  //
  // This effect depends on selectedDate, selectedView, and assistantId.
  useEffect(() => {
    if (!assistantId) {
      return; // Do not fetch if assistantId is still null
    }

    setLoading(true);
    setError(null);

    const { startDate, endDate } = getStartAndEndDates();
    const apiUrl = `${BASE_URL}/api/bookings/${assistantId}?start_date=${startDate}&end_date=${endDate}`;

    fetch(apiUrl)
      .then((response) => {
        console.log('Response status:', response.status);
        if (!response.ok) {
          throw new Error(`Failed to fetch booking data: ${response.status}`);
        }
        return response.json();
      })
      .then((data: BookingResponse) => {
        console.log('Received data:', data);

        // 1) Set slot duration
        setSlotDuration(data.slot_duration);

        // 2) Map raw bookings → Appointment[]
        const formattedAppointments: Appointment[] = data.bookings.map((booking) => ({
          id: booking.id.toString(),
          customerName: booking.customer_name,
          details: booking.details || undefined,
          date: booking.date,
          time: booking.time,
          duration: data.slot_duration,
          created_at: booking.created_at
        }));
        setAppointments(formattedAppointments);

        // 3) Build a quick lookup of “YYYY-MM-DD-HH:MM → true” for booked slots
        const bookedTimesMap: Record<string, boolean> = {};
        formattedAppointments.forEach((appointment) => {
          const key = `${appointment.date}-${appointment.time}`;
          bookedTimesMap[key] = true;
        });

        // 4) Transform data.slots into TimeSlot[]
        const formattedSlots: TimeSlot[] = [];
        Object.entries(data.slots).forEach(([date, slots]) => {
          slots.forEach((slot) => {
            const slotKey = `${date}-${slot.time}`;
            const isSlotBooked = slot.is_booked || bookedTimesMap[slotKey] === true;
            formattedSlots.push({
              id: slotKey,
              date,
              time: slot.time,
              isBooked: isSlotBooked
            });
          });
        });
        setTimeSlots(formattedSlots);

        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching bookings:', err);
        setError('Unable to load bookings.');
        setLoading(false);
      });
  }, [selectedDate, selectedView, assistantId]);

  //
  // ─── HELPERS ─────────────────────────────────────────────────────────────────
  //

  // 1) Get array of date strings (YYYY-MM-DD) depending on selectedView
  const getDateRange = (): string[] => {
    const today = new Date(selectedDate);

    if (selectedView === 'day') {
      return [today.toISOString().split('T')[0]];
    }

    const dates: string[] = [];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    if (selectedView === 'week') {
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
    } else if (selectedView === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }
    }

    return dates;
  };

  // 2) Compute the startDate/endDate query‐strings based on selectedView
  const getStartAndEndDates = (): { startDate: string; endDate: string } => {
    if (selectedView === 'day') {
      return {
        startDate: selectedDate,
        endDate: selectedDate
      };
    } else if (selectedView === 'week') {
      const today = new Date(selectedDate);
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return {
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: endOfWeek.toISOString().split('T')[0]
      };
    } else {
      // month view
      const today = new Date(selectedDate);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      return {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0]
      };
    }
  };

  // 3) Format “2025-06-05” → “Friday, June 5, 2025”
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // 4) Format “14:00” → “2:00 PM”
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hourNum = parseInt(hours, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // 5) Return an Appointment object if it exists for this slot
  const getAppointmentForSlot = (slot: TimeSlot) => {
    return appointments.find(
      (appointment) => appointment.date === slot.date && appointment.time === slot.time
    );
  };

  // 6) Is a given date strictly before today (midnight)?
  const isDateInPast = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(dateString);
    return compareDate < today;
  };

  // 7) Is this specific “YYYY-MM-DD” + “HH:MM” strictly before “now”?
  const isTimeSlotInPast = (dateString: string, timeString: string) => {
    const now = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);

    const slotDateTime = new Date(dateString);
    slotDateTime.setHours(hours, minutes, 0, 0);

    return slotDateTime < now;
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  // Determine tailwind‐based classes based on theme
  const headerClass = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const cardClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const activeButtonClass = theme === 'dark' ? 'bg-primary-600 text-white' : 'bg-primary-500 text-white';
  const inactiveButtonClass = theme === 'dark'
    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    : 'bg-gray-200 text-gray-600 hover:bg-gray-300';
  const slotClass = theme === 'dark' ? 'bg-emerald-800 hover:bg-emerald-700 text-white' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800';
  const bookedSlotClass = theme === 'dark' ? 'bg-red-900 text-white border-red-700' : 'bg-red-100 text-red-800 border-red-200';
  const freeSlotClass = theme === 'dark' ? 'border-emerald-700' : 'border-emerald-300';
  const pastDayClass = theme === 'dark' ? 'bg-gray-800 text-gray-400 border-gray-700 opacity-60' : 'bg-gray-100 text-gray-500 border-gray-300 opacity-60';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      {/* Floating elements (left + right) */}
      <LeftFloatingElements />
      <RightFloatingElements />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* ─── HEADER ─────────────────────────────────────────────────── */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
            Schedule
          </h1>
          <p className={headerClass}>
            View and manage your appointments and available time slots
          </p>
        </div>

        {/* ─── CONTROLS: Date picker & View toggle ───────────────────── */}
        <div className={`p-4 rounded-lg border ${cardClass} shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center`}>
          {/* Date Picker */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            <CalendarDaysIcon className="w-5 h-5 text-primary-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`
                w-full sm:w-auto px-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500
                ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'}
              `}
            />
          </div>

          {/* View Selector (Day / Week / Month) */}
          <div className="flex w-full sm:w-auto justify-center gap-2">
            {['day', 'week', 'month'].map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view as 'day' | 'week' | 'month')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedView === view ? activeButtonClass : inactiveButtonClass
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ─── ERROR MESSAGE ───────────────────────────────────────────── */}
        {error && (
          <div className="p-4 rounded-lg bg-red-100 border border-red-300 text-red-800">
            <div className="flex items-center gap-2">
              <ExclamationCircleIcon className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* ─── MAIN CONTENT: Time Slots + Appointments ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── TIME SLOTS COLUMN ─────────────────────────────────── */}
          <div className={`lg:col-span-2 p-4 sm:p-6 rounded-lg border ${cardClass} shadow-sm h-[500px] flex flex-col`}>
            <h2 className={`text-xl font-semibold mb-4 ${headerClass}`}>
              <ClockIcon className="w-5 h-5 inline-block mr-2" />
              Time Slots
            </h2>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-10 h-10 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className={`space-y-6 flex-1 overflow-y-auto pr-2 ${
                theme === 'dark' ? 'dark-scrollbar' : 'light-scrollbar'
              }`}>
                {getDateRange().map((date) => {
                  const slotsForDay = timeSlots.filter((slot) => slot.date === date);

                  if (slotsForDay.length === 0) {
                    return (
                      <div key={date} className="space-y-2">
                        <h3 className={`text-lg font-medium ${headerClass}`}>{formatDate(date)}</h3>
                        <div className={`py-8 text-center ${headerClass}`}>
                          No available time slots for this day
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={date} className="space-y-2">
                      <h3 className={`text-lg font-medium ${headerClass}`}>{formatDate(date)}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                        {slotsForDay.map((slot) => {
                          const appointment = getAppointmentForSlot(slot);
                          const isPastDate = isDateInPast(slot.date);
                          const isPastTimeSlot = isTimeSlotInPast(slot.date, slot.time);
                          const isSlotBooked = slot.isBooked || appointment !== undefined;

                          return (
                            <div
                              key={slot.id}
                              className={`p-2 sm:p-3 rounded-lg border ${
                                isPastDate || isPastTimeSlot
                                  ? pastDayClass
                                  : isSlotBooked
                                    ? bookedSlotClass
                                    : `${slotClass} ${freeSlotClass} border-transparent`
                              } hover:shadow-sm`}
                            >
                              <div className="font-medium text-sm sm:text-base">
                                {formatTime(slot.time)}
                              </div>

                              {/* If it’s not past and isBooked & has an appointment, show name/details */}
                              {!(isPastDate || isPastTimeSlot) && isSlotBooked && appointment && (
                                <div className="mt-1">
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                                    <div className="text-xs font-medium truncate">
                                      {appointment.customerName}
                                    </div>
                                  </div>
                                  {appointment.details && (
                                    <div className="text-xs truncate mt-0.5 opacity-80">
                                      {appointment.details}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* If it’s not past and isBooked but no appointment object, just show “Booked” */}
                              {!(isPastDate || isPastTimeSlot) && isSlotBooked && !appointment && (
                                <div className="mt-1">
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                                    <div className="text-xs font-medium">Booked</div>
                                  </div>
                                </div>
                              )}

                              {/* If it’s not past and not booked, show “Available” */}
                              {!(isPastDate || isPastTimeSlot) && !isSlotBooked && (
                                <div className="mt-1">
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></div>
                                    <div className="text-xs font-medium">Available</div>
                                  </div>
                                </div>
                              )}

                              {/* If in the past, gray out with “Past” */}
                              {(isPastDate || isPastTimeSlot) && (
                                <div className="mt-1">
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-gray-500 mr-1"></div>
                                    <div className="text-xs opacity-75">Past</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── APPOINTMENTS COLUMN ────────────────────────────────────── */}
          <div className={`p-6 rounded-lg border ${cardClass} shadow-sm h-[500px] flex flex-col`}>
            <h2 className={`text-xl font-semibold mb-4 ${headerClass}`}>
              <UserIcon className="w-5 h-5 inline-block mr-2" />
              Appointments
            </h2>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-10 h-10 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
              </div>
            ) : appointments.filter((appt) => getDateRange().includes(appt.date)).length > 0 ? (
              <div className={`space-y-4 flex-1 overflow-y-auto pr-2 ${
                theme === 'dark' ? 'dark-scrollbar' : 'light-scrollbar'
              }`}>
                {appointments
                  .filter((appt) => getDateRange().includes(appt.date))
                  .sort((a, b) => {
                    const dateComparison = a.date.localeCompare(b.date);
                    if (dateComparison !== 0) return dateComparison;
                    return a.time.localeCompare(b.time);
                  })
                  .map((appointment) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`p-4 rounded-lg border ${
                        theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold">{appointment.customerName}</div>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1">
                          <CalendarDaysIcon className="w-4 h-4" />
                          <span>{formatDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>
                            {formatTime(appointment.time)} ({appointment.duration} min)
                          </span>
                        </div>
                        {appointment.details && (
                          <div className="mt-2 text-xs p-2 rounded bg-gray-100 dark:bg-gray-800">
                            {appointment.details}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </div>
            ) : (
              <div className={`text-center py-12 flex-1 flex flex-col justify-center ${headerClass}`}>
                <CalendarDaysIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No appointments for the selected period</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Schedule;
