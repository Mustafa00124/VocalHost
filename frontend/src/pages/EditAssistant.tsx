import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LeftFloatingElements, RightFloatingElements } from '../components/FloatingElements';
import { 
  ASSISTANT_ROLES, 
  AVAILABLE_FEATURES, 
  VOICE_OPTIONS, 
  PERSONALITY_PRESETS, 
  AVATAR_OPTIONS, 
  GENDER_OPTIONS,
  LANGUAGE_OPTIONS, 
  LOCALE_OPTIONS, 
  RESPONSE_RULE_ACTIONS 
} from '../constants/assistantConstants';

// Icons
import { 
  DocumentIcon, 
  LockClosedIcon, 
  CheckIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  PlusIcon,
  XMarkIcon,
  SpeakerWaveIcon,
  GlobeAltIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Types
interface AssistantData {
  name: string;
  businessName: string;
  role: string;
  gender: string;
  avatar: string;
  language: string;
  locale: string;
}

interface VoiceSettings {
  voice: string;
  personality: string;
  customInstructions: string;
  customRules: ResponseRule[];
  knowledgeSources: KnowledgeSource[];
  routingSettings: {
    escalateOnLowConfidence: boolean;
    endIfOutOfScope: boolean;
    alwaysLogIfAnalyticsEnabled: boolean;
    lowConfidenceThreshold: number;
  };
}

interface ResponseRule {
  id: string;
  condition: string;
  action: string;
  response: string;
  priority: number;
}

interface KnowledgeSource {
  id: string;
  type: 'document' | 'url';
  name: string;
  content?: string;
  url?: string;
  file?: File;
}

const EditAssistant = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Assistant data state
  const [assistantData, setAssistantData] = useState<AssistantData>({
    name: '',
    businessName: '',
    role: 'receptionist',
    gender: 'female',
    avatar: 'female1',
    language: 'en-US',
    locale: 'US'
  });
  
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voice: 'female_basic_1',
    personality: 'friendly',
    customInstructions: '',
    customRules: [],
    knowledgeSources: [],
    routingSettings: {
      escalateOnLowConfidence: false,
      endIfOutOfScope: false,
      alwaysLogIfAnalyticsEnabled: true,
      lowConfidenceThreshold: 0.7
    }
  });

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['voice', 'booking']);

  // Fetch assistant data
  useEffect(() => {
    const fetchAssistant = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        const response = await fetch(`${BASE_URL}/api/assistant/${id}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch assistant: ${response.status}`);
        }
        
        const data = await response.json();
        const assistant = data.assistant;
        
        // Populate assistant data
        setAssistantData({
          name: assistant.name || '',
          businessName: assistant.business_name || '',
          role: assistant.role || 'receptionist',
          gender: assistant.gender || 'female',
          avatar: assistant.avatar || 'female1',
          language: assistant.language || 'en-US',
          locale: assistant.locale || 'US'
        });
        
        // Populate voice settings if available
        if (assistant.voice_settings) {
          setVoiceSettings(prev => ({
            ...prev,
            ...assistant.voice_settings
          }));
        }
        
        // Set features if available
        if (assistant.features) {
          setSelectedFeatures(assistant.features);
        }
        
      } catch (err) {
        console.error('Failed to fetch assistant:', err);
        setError('Failed to load assistant data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssistant();
  }, [id, user]);

  const updateAssistantData = (field: keyof AssistantData, value: string) => {
    setAssistantData(prev => ({ ...prev, [field]: value }));
  };

  const updateVoiceSettings = (field: keyof VoiceSettings, value: any) => {
    setVoiceSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureToggle = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  const addCustomRule = () => {
    const newRule: ResponseRule = {
      id: Date.now().toString(),
      condition: '',
      action: 'respond',
      response: '',
      priority: voiceSettings.customRules.length + 1
    };
    setVoiceSettings(prev => ({
      ...prev,
      customRules: [...prev.customRules, newRule]
    }));
  };

  const removeCustomRule = (ruleId: string) => {
    setVoiceSettings(prev => ({
      ...prev,
      customRules: prev.customRules.filter(rule => rule.id !== ruleId)
    }));
  };

  const updateCustomRule = (ruleId: string, field: keyof ResponseRule, value: any) => {
    setVoiceSettings(prev => ({
      ...prev,
      customRules: prev.customRules.map(rule => 
        rule.id === ruleId ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const addKnowledgeSource = (type: 'document' | 'url') => {
    const newSource: KnowledgeSource = {
      id: Date.now().toString(),
      type,
      name: '',
      content: type === 'document' ? '' : undefined,
      url: type === 'url' ? '' : undefined
    };
    setVoiceSettings(prev => ({
      ...prev,
      knowledgeSources: [...prev.knowledgeSources, newSource]
    }));
  };

  const removeKnowledgeSource = (sourceId: string) => {
    setVoiceSettings(prev => ({
      ...prev,
      knowledgeSources: prev.knowledgeSources.filter(source => source.id !== sourceId)
    }));
  };

  const updateKnowledgeSource = (sourceId: string, field: keyof KnowledgeSource, value: any) => {
    setVoiceSettings(prev => ({
      ...prev,
      knowledgeSources: prev.knowledgeSources.map(source => 
        source.id === sourceId ? { ...source, [field]: value } : source
      )
    }));
  };

  const handleSave = async () => {
    if (!id) return;
    
    try {
      setSaving(true);
      setError('');
      
      const updateData = {
        name: assistantData.name,
        business_name: assistantData.businessName,
        role: assistantData.role,
        gender: assistantData.gender,
        avatar: assistantData.avatar,
        language: assistantData.language,
        locale: assistantData.locale,
        features: selectedFeatures,
        voice_settings: voiceSettings
      };
      
      const response = await fetch(`${BASE_URL}/api/assistant/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update assistant: ${response.status}`);
      }
      
      // Navigate back to manage assistants
      navigate('/manage-assistants');
      
    } catch (err) {
      console.error('Failed to save assistant:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { id: 1, title: 'Basic Info', description: 'Assistant identity and role' },
    { id: 2, title: 'Features', description: 'Select capabilities' },
    { id: 3, title: 'Voice & Behavior', description: 'Personality and voice settings' },
    { id: 4, title: 'Knowledge Base', description: 'Custom rules and knowledge sources' }
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-t-2 border-primary-500 rounded-full animate-spin mr-3"></div>
          <span className="text-gray-400">Loading assistant...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 relative">
      {/* Floating elements */}
      <LeftFloatingElements />
      <RightFloatingElements />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/manage-assistants')}
            className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Edit Assistant
            </h1>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Update your assistant's configuration
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 text-red-400 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                currentStep >= step.id
                  ? theme === 'dark' ? 'bg-primary-500/20 text-primary-400' : 'bg-primary-100 text-primary-600'
                  : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep > step.id
                    ? 'bg-primary-500 text-white'
                    : currentStep === step.id
                    ? theme === 'dark' ? 'bg-primary-500 text-white' : 'bg-primary-500 text-white'
                    : theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600'
                }`}>
                  {currentStep > step.id ? <CheckIcon className="w-4 h-4" /> : step.id}
                </div>
                <div className="hidden sm:block">
                  <div className="font-medium">{step.title}</div>
                  <div className="text-xs opacity-75">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <ChevronRightIcon className={`w-4 h-4 mx-2 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-8`}>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Step1BasicInfo 
                  assistantData={assistantData}
                  updateAssistantData={updateAssistantData}
                />
              </motion.div>
            )}
            
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Step2Features 
                  selectedFeatures={selectedFeatures}
                  handleFeatureToggle={handleFeatureToggle}
                />
              </motion.div>
            )}
            
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Step3VoiceSettings 
                  voiceSettings={voiceSettings}
                  updateVoiceSettings={updateVoiceSettings}
                />
              </motion.div>
            )}
            
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Step4KnowledgeBase 
                  voiceSettings={voiceSettings}
                  updateVoiceSettings={updateVoiceSettings}
                  addCustomRule={addCustomRule}
                  removeCustomRule={removeCustomRule}
                  updateCustomRule={updateCustomRule}
                  addKnowledgeSource={addKnowledgeSource}
                  removeKnowledgeSource={removeKnowledgeSource}
                  updateKnowledgeSource={updateKnowledgeSource}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
              currentStep === 1
                ? theme === 'dark' ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>Previous</span>
          </button>

          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/manage-assistants')}
              className={`px-6 py-3 rounded-lg transition-colors ${
                theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Cancel
            </button>
            
            {currentStep < steps.length ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(steps.length, prev + 1))}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <span>Next</span>
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                  saving
                    ? theme === 'dark' ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:opacity-90'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Step Components (simplified versions - you can expand these based on your needs)
const Step1BasicInfo = ({ assistantData, updateAssistantData }: {
  assistantData: AssistantData;
  updateAssistantData: (field: keyof AssistantData, value: string) => void;
}) => {
  const { theme } = useTheme();
  
  const labelClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-700';
  const inputClass = theme === 'dark' 
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' 
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500';

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Basic Information
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium ${labelClass} mb-2`}>
            Assistant Name *
          </label>
          <input
            type="text"
            value={assistantData.name}
            onChange={(e) => updateAssistantData('name', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent border ${inputClass}`}
            placeholder="e.g., Alex, Sarah, David"
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${labelClass} mb-2`}>
            Business Name *
          </label>
          <input
            type="text"
            value={assistantData.businessName}
            onChange={(e) => updateAssistantData('businessName', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent border ${inputClass}`}
            placeholder="e.g., Acme Dental Clinic, Tech Solutions Inc."
            required
          />
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium ${labelClass} mb-2`}>
          Role *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ASSISTANT_ROLES.map((role) => {
            const IconComponent = role.icon;
            return (
              <div
                key={role.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  assistantData.role === role.id
                    ? theme === 'dark' ? 'border-primary-500 bg-primary-500/10' : 'border-primary-400 bg-primary-50'
                    : theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => updateAssistantData('role', role.id)}
              >
                <div className="flex items-center space-x-3">
                  <IconComponent className={`w-6 h-6 ${assistantData.role === role.id ? 'text-primary-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div>
                    <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {role.name}
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {role.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Step2Features = ({ selectedFeatures, handleFeatureToggle }: {
  selectedFeatures: string[];
  handleFeatureToggle: (featureId: string) => void;
}) => {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Select Features
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AVAILABLE_FEATURES.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={feature.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                selectedFeatures.includes(feature.id)
                  ? theme === 'dark' ? 'border-primary-500 bg-primary-500/10' : 'border-primary-400 bg-primary-50'
                  : theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => handleFeatureToggle(feature.id)}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className={`w-6 h-6 ${selectedFeatures.includes(feature.id) ? 'text-primary-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <div>
                  <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {feature.name}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Step3VoiceSettings = ({ voiceSettings, updateVoiceSettings }: {
  voiceSettings: VoiceSettings;
  updateVoiceSettings: (field: keyof VoiceSettings, value: any) => void;
}) => {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Voice & Behavior Settings
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
            Voice Type
          </label>
          <select
            value={voiceSettings.voice}
            onChange={(e) => updateVoiceSettings('voice', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent border ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            {VOICE_OPTIONS.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
            Personality
          </label>
          <select
            value={voiceSettings.personality}
            onChange={(e) => updateVoiceSettings('personality', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent border ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            {PERSONALITY_PRESETS.map((personality) => (
              <option key={personality.id} value={personality.id}>
                {personality.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
          Custom Instructions
        </label>
        <textarea
          value={voiceSettings.customInstructions}
          onChange={(e) => updateVoiceSettings('customInstructions', e.target.value)}
          className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent border ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
          rows={4}
          placeholder="Add any specific instructions for your assistant..."
        />
      </div>
    </div>
  );
};

const Step4KnowledgeBase = ({ 
  voiceSettings, 
  updateVoiceSettings, 
  addCustomRule, 
  removeCustomRule, 
  updateCustomRule,
  addKnowledgeSource,
  removeKnowledgeSource,
  updateKnowledgeSource
}: {
  voiceSettings: VoiceSettings;
  updateVoiceSettings: (field: keyof VoiceSettings, value: any) => void;
  addCustomRule: () => void;
  removeCustomRule: (ruleId: string) => void;
  updateCustomRule: (ruleId: string, field: keyof ResponseRule, value: any) => void;
  addKnowledgeSource: (type: 'document' | 'url') => void;
  removeKnowledgeSource: (sourceId: string) => void;
  updateKnowledgeSource: (sourceId: string, field: keyof KnowledgeSource, value: any) => void;
}) => {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Knowledge Base & Rules
      </h2>
      
      {/* Custom Rules */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Custom Response Rules
          </h3>
          <button
            onClick={addCustomRule}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Rule</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {voiceSettings.customRules.map((rule) => (
            <div key={rule.id} className={`p-4 border rounded-lg ${theme === 'dark' ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between items-start mb-3">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Rule #{rule.priority}
                </span>
                <button
                  onClick={() => removeCustomRule(rule.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    Condition
                  </label>
                  <input
                    type="text"
                    value={rule.condition}
                    onChange={(e) => updateCustomRule(rule.id, 'condition', e.target.value)}
                    className={`w-full px-3 py-2 rounded border text-sm ${
                      theme === 'dark' 
                        ? 'bg-gray-600 border-gray-500 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="e.g., user asks about pricing"
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    Action
                  </label>
                  <select
                    value={rule.action}
                    onChange={(e) => updateCustomRule(rule.id, 'action', e.target.value)}
                    className={`w-full px-3 py-2 rounded border text-sm ${
                      theme === 'dark' 
                        ? 'bg-gray-600 border-gray-500 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {RESPONSE_RULE_ACTIONS.map((action) => (
                      <option key={action.id} value={action.id}>
                        {action.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    Response
                  </label>
                  <input
                    type="text"
                    value={rule.response}
                    onChange={(e) => updateCustomRule(rule.id, 'response', e.target.value)}
                    className={`w-full px-3 py-2 rounded border text-sm ${
                      theme === 'dark' 
                        ? 'bg-gray-600 border-gray-500 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="e.g., Our pricing starts at $99/month"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Knowledge Sources */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Knowledge Sources
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => addKnowledgeSource('document')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <DocumentIcon className="w-4 h-4" />
              <span>Add Document</span>
            </button>
            <button
              onClick={() => addKnowledgeSource('url')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <GlobeAltIcon className="w-4 h-4" />
              <span>Add URL</span>
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {voiceSettings.knowledgeSources.map((source) => (
            <div key={source.id} className={`p-4 border rounded-lg ${theme === 'dark' ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between items-start mb-3">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {source.type === 'document' ? 'Document' : 'URL'}
                </span>
                <button
                  onClick={() => removeKnowledgeSource(source.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={source.name}
                    onChange={(e) => updateKnowledgeSource(source.id, 'name', e.target.value)}
                    className={`w-full px-3 py-2 rounded border text-sm ${
                      theme === 'dark' 
                        ? 'bg-gray-600 border-gray-500 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="e.g., Company FAQ"
                  />
                </div>
                
                {source.type === 'url' ? (
                  <div>
                    <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                      URL
                    </label>
                    <input
                      type="url"
                      value={source.url || ''}
                      onChange={(e) => updateKnowledgeSource(source.id, 'url', e.target.value)}
                      className={`w-full px-3 py-2 rounded border text-sm ${
                        theme === 'dark' 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="https://example.com/faq"
                    />
                  </div>
                ) : (
                  <div>
                    <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                      Content
                    </label>
                    <textarea
                      value={source.content || ''}
                      onChange={(e) => updateKnowledgeSource(source.id, 'content', e.target.value)}
                      className={`w-full px-3 py-2 rounded border text-sm ${
                        theme === 'dark' 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      rows={3}
                      placeholder="Paste your document content here..."
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditAssistant;
