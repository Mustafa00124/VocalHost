import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { PlusIcon, MicrophoneIcon,  ClockIcon, CalendarIcon, PhoneIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { LeftFloatingElements, RightFloatingElements } from '../components/FloatingElements';

// Flag for development mode - replace process.env reference
const isDevelopment = false; // Set to true for debugging

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';


// Assistant type definition
interface Assistant {
  id: number;
  name: string;
  business_name?: string;
  description?: string;
  start_time: string;
  end_time: string;
  booking_duration_minutes: number;
  available_days: Record<string, boolean>;
  twilio_number: string;
  voice_type: string;
  status?: string; // We'll add this client-side
}

// Define the update payload type
interface AssistantUpdatePayload {
  business_name?: string;
  receptionist_name?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  booking_duration_minutes?: number;
  available_days?: Record<string, boolean>;
  voice_type?: "male" | "female";
}

const Dashboard = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  // Check for a newly created assistant from navigation state
  useEffect(() => {
    if (location.state?.newAssistant) {
      console.log("New assistant from navigation:", location.state.newAssistant);
      
      const { newAssistant, assistantName, businessName } = location.state;
      
      // Add the new assistant to the list
      const newAssistantData: Assistant = {
        id: newAssistant.id,
        name: assistantName,
        business_name: businessName,
        description: '', // These would come from API in a real implementation
        start_time: '',
        end_time: '',
        booking_duration_minutes: 30,
        available_days: {},
        twilio_number: newAssistant.twilioNumber,
        voice_type: '',
        status: 'active'
      };
      
      setAssistants(prev => {
        // Check if this assistant is already in the list (by ID)
        const exists = prev.some(a => a.id === newAssistant.id);
        if (!exists) {
          console.log("Adding new assistant to state:", newAssistantData);
          return [newAssistantData, ...prev];
        }
        return prev;
      });
    }
  }, [location.state]);

  // Fetch assistants from the backend
  useEffect(() => {
    const fetchAssistants = async () => {
      if (!user?.id || hasAttemptedFetch) return;
      
      try {
        setLoading(true);
        setHasAttemptedFetch(true);
        const userId = user.id;
        
        console.log("Fetching assistants for user ID:", userId);
        
        const response = await fetch(`${BASE_URL}/api/assistants?user_id=${userId}`, {
          credentials: 'include' // Include credentials for authentication
        });
        
        console.log("API response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("API response data:", data);
        
        if (data.assistants && Array.isArray(data.assistants)) {
          const transformedAssistants = data.assistants.map((assistant: any) => ({
            ...assistant,
            status: assistant.status || 'active'
          }));
          
          setAssistants(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            const uniqueNewAssistants = transformedAssistants.filter((a: Assistant) => !existingIds.has(a.id));
            return [...prev, ...uniqueNewAssistants];
          });
        }
      } catch (err) {
        console.error('Failed to fetch assistants:', err);
        setError('Failed to load assistants. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssistants();
  }, [user, hasAttemptedFetch]);

  // Add a retry mechanism
  const handleRetryFetch = () => {
    setHasAttemptedFetch(false);
    setError('');
  };
  
  // Debug output
  console.log("Current assistants state:", assistants);

  return (
    <div className="max-w-6xl mx-auto p-4 relative">
      {/* Floating elements */}
      <LeftFloatingElements />
      <RightFloatingElements />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
            Your Assistants
          </h1>
          <Link
            to="/create"
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create New</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-t-2 border-primary-500 rounded-full animate-spin mr-3"></div>
            <span className="text-gray-400">Loading assistants...</span>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 text-red-400 p-4 rounded-lg text-center">
            {error}
            <button
              onClick={handleRetryFetch}
              className="ml-4 underline hover:text-red-300"
            >
              Retry
            </button>
          </div>
        ) : assistants.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 text-center">
            <p className="text-gray-300 mb-4">You don't have any assistants yet.</p>
            <Link
              to="/create"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Create Your First Assistant</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {assistants.map((assistant) => (
              <AssistantCard 
                key={assistant.id} 
                assistant={assistant} 
                onUpdate={() => setHasAttemptedFetch(false)}
              />
            ))}
          </div>
        )}
        
        {/* Debug section - only visible when isDevelopment is true */}
        {isDevelopment && (
          <div className="mt-8 p-4 bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden text-gray-400 text-xs">
            <details>
              <summary className="cursor-pointer mb-2">Debug Information</summary>
              <pre className="overflow-auto max-h-40">{JSON.stringify({assistants, user, location}, null, 2)}</pre>
            </details>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const AssistantCard = ({ 
  assistant, 
  onUpdate 
}: { 
  assistant: Assistant;
  onUpdate: () => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<AssistantUpdatePayload>({});
  const [updateError, setUpdateError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // When switching to edit mode, automatically expand the view
  useEffect(() => {
    if (isEditing) {
      setIsExpanded(true);
    }
  }, [isEditing]);

  const handleEdit = () => {
    setEditData({
      business_name: assistant.business_name,
      receptionist_name: assistant.name,
      description: assistant.description,
      start_time: assistant.start_time,
      end_time: assistant.end_time,
      booking_duration_minutes: assistant.booking_duration_minutes,
      available_days: assistant.available_days,
      voice_type: assistant.voice_type as "male" | "female"
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
    setUpdateError('');
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      setUpdateError('');

      // Log the update payload
      const updateData = {
        receptionist_name: editData.receptionist_name,
        business_name: editData.business_name,
        description: editData.description,
        start_time: editData.start_time,
        end_time: editData.end_time,
        booking_duration_minutes: editData.booking_duration_minutes,
        available_days: editData.available_days,
        voice_type: editData.voice_type
      };

      console.log('Updating assistant with data:', updateData);

      const response = await fetch(`${BASE_URL}/api/assistant/${assistant.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error;
        } catch (e) {
          errorMessage = `Failed to update assistant (Status: ${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Update successful:', result);
      
      // Update the local assistant state with the response data
      Object.assign(assistant, {
        name: result.assistant.name,
        business_name: result.assistant.business_name,
        description: result.assistant.description,
        start_time: result.assistant.start_time,
        end_time: result.assistant.end_time,
        booking_duration_minutes: result.assistant.booking_duration_minutes,
        available_days: result.assistant.available_days,
        voice_type: result.assistant.voice_type
      });
      
      // Reset edit mode
      setIsEditing(false);
      setEditData({});
      
      // Trigger a refetch of the assistants to ensure consistency
      onUpdate();
    } catch (error: any) {
      console.error('Update failed:', error);
      setUpdateError(error.message || 'An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  // Format the available days in a more readable format
  const formatAvailableDays = () => {
    if (!assistant.available_days) return null;
    
    const availableDays = Object.keys(assistant.available_days)
      .filter(day => assistant.available_days[day]);
    
    if (availableDays.length === 0) return null;
    
    // Sort days in week order
    const weekOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return availableDays
      .sort((a, b) => weekOrder.indexOf(a) - weekOrder.indexOf(b))
      .map(day => day.charAt(0).toUpperCase() + day.slice(1, 3))
      .join(', ');
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 sm:p-6 flex flex-col h-[450px] overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          {isEditing ? (
            <input
              type="text"
              value={editData.receptionist_name || ''}
              onChange={(e) => setEditData({ ...editData, receptionist_name: e.target.value })}
              className="w-full bg-gray-700/50 border border-gray-600 rounded px-2 py-1 text-white text-xl font-semibold"
            />
          ) : (
            <h3 className="text-xl font-semibold text-white">{assistant.name}</h3>
          )}
          {!isEditing && assistant.business_name && (
            <p className="text-gray-400 text-sm">
              {assistant.business_name}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
            >
              <PencilIcon className="w-5 h-5 text-gray-400" />
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="p-1.5 bg-green-900/30 hover:bg-green-800/50 rounded-full transition-colors"
              >
                <CheckIcon className="w-5 h-5 text-green-400" />
              </button>
              <button
                onClick={handleCancel}
                disabled={isUpdating}
                className="p-1.5 bg-red-900/30 hover:bg-red-800/50 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-red-400" />
              </button>
            </div>
          )}
          {assistant.status && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                assistant.status === 'active'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {assistant.status}
            </span>
          )}
        </div>
      </div>

      {updateError && (
        <div className="text-red-400 text-sm bg-red-500/20 p-2 rounded mb-4">
          {updateError}
        </div>
      )}

      {/* Key Info Section */}
      <div className="space-y-2 mb-4 flex-none">
        {assistant.twilio_number && (
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <PhoneIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{assistant.twilio_number}</span>
          </div>
        )}
        
        {assistant.voice_type && (
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <MicrophoneIcon className="w-4 h-4 flex-shrink-0" />
            {isEditing ? (
              <select
                value={editData.voice_type || assistant.voice_type}
                onChange={(e) => setEditData({ ...editData, voice_type: e.target.value as "male" | "female" })}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 appearance-none w-40"
              >
                <option value="male">Male voice</option>
                <option value="female">Female voice</option>
              </select>
            ) : (
              <span className="text-gray-300">{assistant.voice_type} voice</span>
            )}
          </div>
        )}
        
        {assistant.start_time && assistant.end_time && (
          <div className="flex flex-wrap items-center space-x-2 text-sm text-gray-400">
            <ClockIcon className="w-4 h-4 flex-shrink-0" />
            {isEditing ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <input
                    type="time"
                    value={editData.start_time || assistant.start_time}
                    onChange={(e) => setEditData({ ...editData, start_time: e.target.value })}
                    className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 w-32"
                  />
                </div>
                <span className="text-gray-400">-</span>
                <div className="relative">
                  <input
                    type="time"
                    value={editData.end_time || assistant.end_time}
                    onChange={(e) => setEditData({ ...editData, end_time: e.target.value })}
                    className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 w-32"
                  />
                </div>
              </div>
            ) : (
              <span className="text-gray-300">Hours: {assistant.start_time} - {assistant.end_time}</span>
            )}
          </div>
        )}
        
        {assistant.booking_duration_minutes && (
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <CalendarIcon className="w-4 h-4 flex-shrink-0" />
            {isEditing ? (
              <div className="relative">
                <input
                  type="number"
                  value={editData.booking_duration_minutes || assistant.booking_duration_minutes}
                  onChange={(e) => setEditData({ ...editData, booking_duration_minutes: parseInt(e.target.value) })}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 w-20"
                  min="1"
                  max="120"
                />
                <span className="ml-2 text-gray-300">minutes</span>
              </div>
            ) : (
              <span className="text-gray-300">Slot duration: {assistant.booking_duration_minutes} min</span>
            )}
          </div>
        )}

        {formatAvailableDays() && (
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <CalendarIcon className="w-4 h-4 flex-shrink-0" />
            <span>Available: {formatAvailableDays()}</span>
          </div>
        )}
      </div>
      
      {/* Description Section */}
      <div className="border-t border-gray-700 pt-3 flex-grow overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-2 flex-shrink-0">
          <h4 className="font-semibold text-white text-sm">Business Details</h4>
          {!isEditing && assistant.description && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-gray-400 hover:text-white transition-colors">
              {isExpanded ? 'Show Less' : 'Show More'}
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3 overflow-y-auto pr-1 assistant-card-description flex-grow">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Business Name</label>
              <input
                type="text"
                value={editData.business_name || ''}
                onChange={(e) => setEditData({ ...editData, business_name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter business name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Description</label>
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                rows={5}
                placeholder="Enter business description"
              />
            </div>
            {assistant.available_days && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Available Days</label>
                <div className="flex flex-wrap gap-2 bg-gray-800 p-3 rounded border border-gray-700">
                  {Object.entries(editData.available_days || assistant.available_days).map(([day, isAvailable]) => (
                    <label key={day} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={(e) => setEditData({
                          ...editData,
                          available_days: {
                            ...(editData.available_days || assistant.available_days),
                            [day]: e.target.checked
                          }
                        })}
                        className="rounded border-gray-600 text-primary-500 focus:ring-primary-500 h-4 w-4"
                      />
                      <span className="capitalize text-gray-300">{day.substring(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[300px]' : 'max-h-[80px]'} overflow-y-auto pr-1 assistant-card-description flex-grow`}>
            {assistant.description ? (
              <p className="text-sm text-gray-400 whitespace-pre-line">
                {assistant.description}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Dashboard; 