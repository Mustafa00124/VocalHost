import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { PencilIcon, EyeIcon, PlusIcon, MicrophoneIcon, ClockIcon, CalendarIcon, PhoneIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { LeftFloatingElements, RightFloatingElements } from '../components/FloatingElements';
import { useTheme } from '../contexts/ThemeContext';

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
  status?: string;
}

interface SubscriptionStatus {
  plan: string;
  subscription_status: string;
  max_agents: number;
  allowed_addons: string[];
  can_create_agent: boolean;
}

const ManageAssistants = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  // Fetch assistants from the backend
  useEffect(() => {
    const fetchAssistants = async () => {
      if (!user?.id || hasAttemptedFetch) return;
      
      try {
        setLoading(true);
        setHasAttemptedFetch(true);
        const userId = user.id;
        
        console.log("Fetching assistants for user ID:", userId);
        
        const response = await fetch(`${BASE_URL}/api/my-agents`, {
          credentials: 'include'
        });
        
        console.log("API response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("API response data:", data);
        
        if (data.agents && Array.isArray(data.agents)) {
          const transformedAssistants = data.agents.map((assistant: any) => ({
            ...assistant,
            status: assistant.status || 'active'
          }));
          
          setAssistants(transformedAssistants);
        }
        
        // Set subscription status from the same API call
        if (data.user_info) {
          setSubscriptionStatus({
            plan: data.user_info.plan || 'none',
            subscription_status: data.user_info.subscription_status || 'inactive',
            max_agents: data.user_info.max_agents || 0,
            allowed_addons: data.user_info.allowed_addons || [],
            can_create_agent: data.user_info.can_create_agent || false
          });
        } else {
          setSubscriptionStatus({
            plan: 'none',
            subscription_status: 'inactive',
            max_agents: 0,
            allowed_addons: [],
            can_create_agent: false
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

  const handleEditAssistant = (assistantId: number) => {
    navigate(`/manage-assistants/edit/${assistantId}`);
  };

  const handleViewAssistant = (assistantId: number) => {
    navigate(`/manage-assistants/view/${assistantId}`);
  };

  // Format the available days in a more readable format
  const formatAvailableDays = (availableDays: Record<string, boolean>) => {
    if (!availableDays) return null;
    
    const availableDaysList = Object.keys(availableDays)
      .filter(day => availableDays[day]);
    
    if (availableDaysList.length === 0) return null;
    
    // Sort days in week order
    const weekOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return availableDaysList
      .sort((a, b) => weekOrder.indexOf(a) - weekOrder.indexOf(b))
      .map(day => day.charAt(0).toUpperCase() + day.slice(1, 3))
      .join(', ');
  };

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
            Manage Assistants
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
          <div className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'} backdrop-blur-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-8 text-center`}>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>You don't have any assistants yet.</p>
            <Link
              to="/create"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Create Your First Assistant</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {assistants.map((assistant) => (
              <AssistantCard 
                key={assistant.id} 
                assistant={assistant}
                onEdit={() => handleEditAssistant(assistant.id)}
                onView={() => handleViewAssistant(assistant.id)}
                formatAvailableDays={formatAvailableDays}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

const AssistantCard = ({ 
  assistant, 
  onEdit,
  onView,
  formatAvailableDays
}: { 
  assistant: Assistant;
  onEdit: () => void;
  onView: () => void;
  formatAvailableDays: (days: Record<string, boolean>) => string | null;
}) => {
  const { theme } = useTheme();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-6 flex flex-col h-[500px] overflow-hidden`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {assistant.name}
          </h3>
          {assistant.business_name && (
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
              {assistant.business_name}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
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

      {/* Key Info Section */}
      <div className="space-y-3 mb-4 flex-none">
        {assistant.twilio_number && (
          <div className={`flex items-center space-x-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <PhoneIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{assistant.twilio_number}</span>
          </div>
        )}
        
        {assistant.voice_type && (
          <div className={`flex items-center space-x-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <MicrophoneIcon className="w-4 h-4 flex-shrink-0" />
            <span className="capitalize">{assistant.voice_type} voice</span>
          </div>
        )}
        
        {assistant.start_time && assistant.end_time && (
          <div className={`flex items-center space-x-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <ClockIcon className="w-4 h-4 flex-shrink-0" />
            <span>Hours: {assistant.start_time} - {assistant.end_time}</span>
          </div>
        )}
        
        {assistant.booking_duration_minutes && (
          <div className={`flex items-center space-x-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <CalendarIcon className="w-4 h-4 flex-shrink-0" />
            <span>Slot duration: {assistant.booking_duration_minutes} min</span>
          </div>
        )}

        {formatAvailableDays(assistant.available_days) && (
          <div className={`flex items-center space-x-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <CalendarIcon className="w-4 h-4 flex-shrink-0" />
            <span>Available: {formatAvailableDays(assistant.available_days)}</span>
          </div>
        )}
      </div>
      
      {/* Description Section */}
      <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} pt-4 flex-grow overflow-hidden flex flex-col`}>
        <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-sm mb-2`}>
          Business Details
        </h4>
        <div className={`overflow-y-auto pr-1 flex-grow ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {assistant.description ? (
            <p className="text-sm whitespace-pre-line">
              {assistant.description}
            </p>
          ) : (
            <p className="text-sm italic">No description provided</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} pt-4 mt-4 flex space-x-2`}>
        <button
          onClick={onView}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <EyeIcon className="w-4 h-4" />
          <span>View</span>
        </button>
        <button
          onClick={onEdit}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'bg-primary-600 hover:bg-primary-700 text-white'
              : 'bg-primary-500 hover:bg-primary-600 text-white'
          }`}
        >
          <PencilIcon className="w-4 h-4" />
          <span>Edit</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ManageAssistants;
