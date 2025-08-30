import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ConfirmationModal from '../components/ConfirmationModal';
import SuccessModal from '../components/SuccessModal';
import { useNavigate, Link } from 'react-router-dom';
import { LeftFloatingElements, RightFloatingElements } from '../components/FloatingElements';

// Icons
import { DocumentIcon, TrashIcon, LockClosedIcon, StarIcon } from '@heroicons/react/24/outline';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

interface SubscriptionStatus {
  plan: string;
  subscription_status: string;
  max_agents: number;
  allowed_addons: string[];
  can_create_agent: boolean;
}

const CreateAssistant = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>(['voice', 'booking']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [createdAssistant, setCreatedAssistant] = useState<{
    id: number;
    twilioNumber: string;
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    businessDescription: '',
    voiceType: 'female',
  });

  // Fetch subscription status
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`${BASE_URL}/api/my-agents`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus({
            plan: data.user_info.plan,
            subscription_status: data.user_info.subscription_status,
            max_agents: data.user_info.max_agents,
            allowed_addons: data.user_info.allowed_addons,
            can_create_agent: data.user_info.can_create_agent
          });
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
      }
    };

    fetchSubscriptionStatus();
  }, [user]);

  const availableAddons = [
    { 
      id: 'voice', 
      name: 'Voice Calls', 
      description: 'Handle phone calls with AI voice', 
      included: true,
      requiredPlan: 'basic'
    },
    { 
      id: 'booking', 
      name: 'Booking System', 
      description: 'Automated appointment scheduling', 
      included: true,
      requiredPlan: 'basic'
    },
    { 
      id: 'chat', 
      name: 'WhatsApp Chat', 
      description: 'Respond to WhatsApp messages', 
      pro: true,
      requiredPlan: 'pro'
    },
    { 
      id: 'crm', 
      name: 'CRM Integration', 
      description: 'Customer relationship management', 
      pro: true,
      requiredPlan: 'pro'
    },
  ];

  const canUseAddon = (addon: any) => {
    if (!subscriptionStatus) return false;
    if (addon.included) return true;
    return subscriptionStatus.allowed_addons.includes(addon.id);
  };

  const handleAddonToggle = (addon: string) => {
    if (addon === 'voice' || addon === 'booking') return; // Always enabled
    
    const addonInfo = availableAddons.find(a => a.id === addon);
    if (!canUseAddon(addonInfo)) return; // Can't toggle restricted addons
    
    setSelectedAddons(prev => 
      prev.includes(addon) 
        ? prev.filter(a => a !== addon)
        : [...prev, addon]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const pdfFiles = filesArray.filter(file => file.type === 'application/pdf');
      
      if (pdfFiles.length !== filesArray.length) {
        setError('Only PDF files are allowed. Please select PDF files only.');
        return;
      }
      
      setSelectedFiles(prev => [...prev, ...pdfFiles]);
      setError(null);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const createAssistant = async () => {
    setIsLoading(true);
    setError(null);

    const formDataToSend = new FormData();
    formDataToSend.append('user_id', String(user?.id));
    formDataToSend.append('assistant_name', formData.name);
    formDataToSend.append('business_name', formData.businessName);
    formDataToSend.append('business_description', formData.businessDescription);
    formDataToSend.append('voice_type', formData.voiceType);
    formDataToSend.append('enabled_features', JSON.stringify(selectedAddons));

    selectedFiles.forEach(file => {
      formDataToSend.append('files', file);
    });

    try {
      const response = await fetch(`${BASE_URL}/api/register/assistant`, {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      setIsLoading(false);
      setCreatedAssistant({
        id: data.assistant_id,
        twilioNumber: data.twilio_number || '',
        message: data.message
      });
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      setIsLoading(false);
      setError(error.message || "Failed to create assistant. Please try again or contact support if the problem persists.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user can create agent
    if (subscriptionStatus && !subscriptionStatus.can_create_agent) {
      if (subscriptionStatus.subscription_status !== 'active') {
        setError('Active subscription required to create agents. Please subscribe to a plan first.');
        return;
      } else {
        setError(`Agent limit reached. Your ${subscriptionStatus.plan} plan allows ${subscriptionStatus.max_agents} agent(s). Please upgrade to create more.`);
        return;
      }
    }
    
    // Validate that knowledge base documents are uploaded
    if (selectedFiles.length === 0) {
      setError('Please upload at least one PDF document for your assistant\'s knowledge base.');
      return;
    }
    
    setError(null);
    setIsConfirmModalOpen(true);
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalOpen(false);
    navigate('/dashboard');
  };

  // Theme-based styles
  const bgClass = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const cardClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const labelClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-700';
  const inputClass = theme === 'dark' 
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' 
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500';
  const errorClass = theme === 'dark' 
    ? 'bg-red-900/20 border-red-500 text-red-300' 
    : 'bg-red-50 border-red-200 text-red-700';

  // Check if user needs to upgrade
  const needsSubscription = !subscriptionStatus || subscriptionStatus.subscription_status !== 'active';
  const atAgentLimit = Boolean(subscriptionStatus && !subscriptionStatus.can_create_agent && subscriptionStatus.subscription_status === 'active');

  return (
    <div className={`min-h-screen ${bgClass} relative overflow-hidden`}>
      <LeftFloatingElements />
      <RightFloatingElements />
      
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`max-w-6xl mx-auto px-6 py-8 relative z-10`}
      >
        <div className={`${cardClass} border rounded-xl shadow-lg p-8`}>
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Create AI Assistant
            </h1>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              Build your customized AI assistant with advanced features
            </p>
            
            {/* Subscription Status Banner */}
            {subscriptionStatus && (
              <div className={`mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
                subscriptionStatus.subscription_status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                <StarIcon className="w-4 h-4" />
                <span className="font-medium">
                  {subscriptionStatus.plan === 'none' ? 'No Subscription' : 
                   `${subscriptionStatus.plan.charAt(0).toUpperCase() + subscriptionStatus.plan.slice(1)} Plan`}
                  {subscriptionStatus.subscription_status === 'active' && 
                   ` (${subscriptionStatus.max_agents - (subscriptionStatus.max_agents - (subscriptionStatus.can_create_agent ? 1 : 0))} / ${subscriptionStatus.max_agents} agents)`
                  }
                </span>
              </div>
            )}
          </div>

          {/* Subscription Warning */}
          {(needsSubscription || atAgentLimit) && (
            <div className={`p-6 rounded-lg border mb-6 ${
              theme === 'dark' 
                ? 'bg-yellow-900/20 border-yellow-500 text-yellow-300' 
                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
            }`}>
              <div className="flex items-start space-x-3">
                <LockClosedIcon className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">
                    {needsSubscription ? 'Subscription Required' : 'Agent Limit Reached'}
                  </h3>
                  <p className="mb-4">
                    {needsSubscription 
                      ? 'You need an active subscription to create AI assistants. Choose a plan that fits your needs.'
                      : `You've reached your ${subscriptionStatus?.plan} plan limit of ${subscriptionStatus?.max_agents} agent(s). Upgrade to create more assistants.`
                    }
                  </p>
                  <Link
                    to="/plans"
                    className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    {needsSubscription ? 'View Plans' : 'Upgrade Plan'}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className={`p-4 rounded-lg border mb-6 ${errorClass}`}>
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Basic Info */}
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium ${labelClass} mb-2`}>
                    Assistant Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent border ${inputClass}`}
                    placeholder="e.g., Alex, Sarah, David"
                    required
                    disabled={needsSubscription || atAgentLimit}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${labelClass} mb-2`}>
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent border ${inputClass}`}
                    placeholder="e.g., Acme Dental Clinic, Tech Solutions Inc."
                    required
                    disabled={needsSubscription || atAgentLimit}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${labelClass} mb-2`}>
                    Business Description
                  </label>
                  <textarea
                    value={formData.businessDescription}
                    onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent border ${inputClass}`}
                    rows={4}
                    placeholder="Describe your business, services, and what your assistant should help customers with..."
                    required
                    disabled={needsSubscription || atAgentLimit}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${labelClass} mb-2`}>
                    Voice Type
                  </label>
                  <select
                    value={formData.voiceType}
                    onChange={(e) => setFormData({ ...formData, voiceType: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent border ${inputClass}`}
                    disabled={needsSubscription || atAgentLimit}
                  >
                    <option value="female">Female Voice</option>
                    <option value="male">Male Voice</option>
                  </select>
                </div>
              </div>

              {/* Right Column - Features & Knowledge Base */}
              <div className="space-y-6">
                {/* Features Selection */}
                <div>
                  <label className={`block text-sm font-medium ${labelClass} mb-3`}>
                    Features & Add-ons
                  </label>
                  <div className="space-y-3">
                    {availableAddons.map((addon) => {
                      const isAvailable = canUseAddon(addon);
                      const isSelected = selectedAddons.includes(addon.id);
                      
                      return (
                        <div 
                          key={addon.id}
                          className={`p-4 border rounded-lg transition-all duration-200 ${
                            isSelected && isAvailable
                              ? theme === 'dark' ? 'border-primary-500 bg-primary-500/10' : 'border-primary-400 bg-primary-50'
                              : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                          } ${
                            !isAvailable ? 'opacity-60' : 'cursor-pointer'
                          } ${
                            addon.included || !isAvailable ? '' : 'hover:border-gray-400'
                          }`}
                          onClick={() => isAvailable && !addon.included && handleAddonToggle(addon.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={isSelected || addon.included}
                                disabled={addon.included || !isAvailable}
                                onChange={() => handleAddonToggle(addon.id)}
                                className="h-4 w-4 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {addon.name}
                                  </span>
                                  {addon.pro && (
                                    <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-semibold">
                                      PRO
                                    </span>
                                  )}
                                  {addon.included && (
                                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-semibold">
                                      INCLUDED
                                    </span>
                                  )}
                                  {!isAvailable && !addon.included && (
                                    <LockClosedIcon className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {addon.description}
                                  {!isAvailable && !addon.included && (
                                    <span className="block text-xs text-yellow-600 mt-1">
                                      Requires {addon.requiredPlan.charAt(0).toUpperCase() + addon.requiredPlan.slice(1)} plan or higher
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Knowledge Base */}
                <div>
                  <label className={`block text-sm font-medium ${labelClass} mb-3`}>
                    Knowledge Base *
                  </label>
                  <div className={`border-2 border-dashed ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} rounded-lg p-6 ${
                    needsSubscription || atAgentLimit ? 'opacity-50' : ''
                  }`}>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf"
                      multiple
                      className="hidden"
                      disabled={needsSubscription || atAgentLimit}
                    />
                    
                    {selectedFiles.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className={`text-sm font-medium ${labelClass}`}>
                            Uploaded Documents ({selectedFiles.length})
                          </span>
                          <button
                            type="button"
                            onClick={triggerFileInput}
                            disabled={needsSubscription || atAgentLimit}
                            className={`text-sm px-3 py-1 rounded-md ${
                              theme === 'dark' 
                                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            } disabled:opacity-50`}
                          >
                            Add More
                          </button>
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className={`flex items-center justify-between p-3 rounded-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <div className="flex items-center space-x-3">
                                <DocumentIcon className="w-5 h-5 text-primary-400" />
                                <span className={`text-sm truncate max-w-[200px] ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                                  {file.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                disabled={needsSubscription || atAgentLimit}
                                className="text-red-400 hover:text-red-500 p-1 disabled:opacity-50"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <DocumentIcon className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                          Upload PDF documents about your business (required)
                        </p>
                        <button
                          type="button"
                          onClick={triggerFileInput}
                          disabled={needsSubscription || atAgentLimit}
                          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Choose Files
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <motion.button
                whileHover={{ scale: needsSubscription || atAgentLimit ? 1 : 1.05 }}
                whileTap={{ scale: needsSubscription || atAgentLimit ? 1 : 0.95 }}
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || needsSubscription || atAgentLimit}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-3"></div>
                    <span>Creating Assistant...</span>
                  </div>
                ) : (
                  "Create Assistant"
                )}
              </motion.button>
            </div>
          </form>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={createAssistant}
          title="Confirm Assistant Creation"
          message={`Create "${formData.name}" for ${formData.businessName}? ${selectedFiles.length} PDF file(s) will be uploaded to the knowledge base.`}
          confirmButtonText="Create Assistant"
          cancelButtonText="Edit Details"
        />

        {/* Success Modal */}
        <SuccessModal
          isOpen={isSuccessModalOpen}
          onClose={handleSuccessModalClose}
          title="Assistant Created Successfully!"
          message={`Your voice assistant "${formData.name}" has been successfully created for ${formData.businessName}.
          ${createdAssistant?.twilioNumber ? `Phone number: ${createdAssistant.twilioNumber}` : ''}
          ${selectedFiles.length > 0 ? `${selectedFiles.length} document(s) uploaded to knowledge base.` : ''}`}
          buttonText="Go to Dashboard"
        />
      </motion.div>
    </div>
  );
};

export default CreateAssistant;