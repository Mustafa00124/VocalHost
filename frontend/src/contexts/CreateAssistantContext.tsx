import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { ASSISTANT_ROLES, AVAILABLE_FEATURES, VOICE_OPTIONS, AVATAR_OPTIONS, AvatarOption, VoiceOption } from '../constants/assistantConstants';

// Types and Interfaces
export interface AssistantRole {
  id: string;
  name: string;
  description: string;
  defaultFeatures: string[];
  icon: React.ComponentType<any>;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  requiredPlan: 'basic' | 'pro';
  category: 'communication' | 'productivity' | 'analytics';
}


export interface PersonalityPreset {
  id: string;
  name: string;
  description: string;
  tone: 'friendly' | 'formal' | 'neutral' | 'enthusiastic' | 'professional';
  warmth: number;
  formality: number;
}

export interface ResponseRule {
  id: string;
  trigger: string;
  actionType: 'respond_with_knowledge' | 'escalate_to_human' | 'end_conversation' | 'log_to_analytics';
  response?: string;
  knowledgeSourceId?: string;
  priority: number;
}

export interface KnowledgeSource {
  id: string;
  type: 'document' | 'url';
  name: string;
  content?: string;
  url?: string;
  file?: File;
  status: 'pending' | 'uploaded' | 'processing' | 'ready' | 'error';
}

export interface AssistantData {
  name: string;
  businessName: string;
  role: string;
  gender: 'female' | 'male' | 'nonbinary' | 'robot';
  avatar: string;
  language: string;
  locale: string;
}

export interface VoiceSettings {
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

export interface SubscriptionStatus {
  plan: string;
  subscription_status: string;
  max_agents: number;
  allowed_addons: string[];
  can_create_agent: boolean;
}

export interface PreviewData {
  name: string;
  role: AssistantRole | null;
  avatar: { id: string; name: string; emoji: string } | null;
  voice: VoiceOption | null;
  features: Feature[];
  lockedFeatures: Feature[];
  rulesCount: number;
  knowledgeSourcesCount: number;
  routingEnabled: boolean;
}

// Context Interface
interface CreateAssistantContextType {
  // Step 1: Assistant Data
  assistantData: AssistantData;
  setAssistantData: (data: AssistantData) => void;
  updateAssistantData: (field: keyof AssistantData, value: string) => void;
  
  // Step 2: Feature Selection
  selectedFeatures: string[];
  setSelectedFeatures: (features: string[]) => void;
  handleFeatureToggle: (featureId: string) => void;
  
  // Step 3: Voice & Behavior
  voiceSettings: VoiceSettings;
  setVoiceSettings: (settings: VoiceSettings) => void;
  updateVoiceSettings: (field: keyof VoiceSettings, value: any) => void;
  
  // Custom Rules Management
  addCustomRule: () => void;
  removeCustomRule: (ruleId: string) => void;
  updateCustomRule: (ruleId: string, field: keyof ResponseRule, value: any) => void;
  
  // Knowledge Sources Management
  addKnowledgeSource: (type: 'document' | 'url') => void;
  removeKnowledgeSource: (sourceId: string) => void;
  updateKnowledgeSource: (sourceId: string, field: keyof KnowledgeSource, value: any) => void;
  processFileUpload: (files: File[]) => void;
  
  // Subscription & Validation
  subscriptionStatus: SubscriptionStatus | null;
  canUseFeature: (featureId: string) => boolean;
  
  // Helper Functions
  getCurrentRole: () => AssistantRole | null;
  getPreviewData: () => PreviewData;
  validateStep: (step: number) => boolean;
  resetForm: () => void;
  
  // File handling
  fileInputRef: React.RefObject<HTMLInputElement>;
  triggerFileInput: () => void;
  
  // Loading and Error states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const CreateAssistantContext = createContext<CreateAssistantContextType | undefined>(undefined);

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

// Initial state values
const initialAssistantData: AssistantData = {
  name: '',
  businessName: '',
  role: 'receptionist',
  gender: 'female',
  avatar: 'female1',
  language: 'en-US',
  locale: 'US'
};

const initialVoiceSettings: VoiceSettings = {
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
};

export const CreateAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // State
  const [assistantData, setAssistantData] = useState<AssistantData>(initialAssistantData);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['voice', 'booking']);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(initialVoiceSettings);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch subscription status on mount
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

  // Update selected features when role changes
  useEffect(() => {
    const currentRole = getCurrentRole();
    if (currentRole) {
      // Merge current selections with role defaults, ensuring role defaults are always included
      const mergedFeatures = Array.from(new Set([...currentRole.defaultFeatures, ...selectedFeatures]));
      setSelectedFeatures(mergedFeatures);
    }
  }, [assistantData.role]); // Only depend on role, not selectedFeatures to avoid infinite loop

  // Update avatar when gender changes
  useEffect(() => {
    const availableAvatars = AVATAR_OPTIONS.filter(avatar => avatar.gender === assistantData.gender);
    if (availableAvatars.length > 0) {
      // If current avatar doesn't match selected gender, switch to first avatar of selected gender
      const currentAvatar = AVATAR_OPTIONS.find(avatar => avatar.id === assistantData.avatar);
      if (!currentAvatar || currentAvatar.gender !== assistantData.gender) {
        setAssistantData(prev => ({ ...prev, avatar: availableAvatars[0].id }));
      }
    }
  }, [assistantData.gender]);

  // Update voice when gender changes
  useEffect(() => {
    const availableVoices = VOICE_OPTIONS.filter(voice => voice.gender === assistantData.gender);
    if (availableVoices.length > 0) {
      // If current voice doesn't match selected gender, switch to first basic voice of selected gender
      const currentVoice = VOICE_OPTIONS.find(voice => voice.id === voiceSettings.voice);
      if (!currentVoice || currentVoice.gender !== assistantData.gender) {
        const basicVoice = availableVoices.find(voice => voice.type === 'basic') || availableVoices[0];
        setVoiceSettings(prev => ({ ...prev, voice: basicVoice.id }));
      }
    }
  }, [assistantData.gender]);

  // Helper functions
  const updateAssistantData = (field: keyof AssistantData, value: string) => {
    setAssistantData(prev => ({ ...prev, [field]: value }));
  };

  const updateVoiceSettings = (field: keyof VoiceSettings, value: any) => {
    setVoiceSettings(prev => ({ ...prev, [field]: value }));
  };

  const getCurrentRole = (): AssistantRole | null => {
    return ASSISTANT_ROLES.find(role => role.id === assistantData.role) || null;
  };

  const canUseFeature = (featureId: string): boolean => {
    const feature = AVAILABLE_FEATURES.find(f => f.id === featureId);
    if (!feature) return false;
    
    if (feature.requiredPlan === 'basic') return true;
    if (feature.requiredPlan === 'pro') {
      return subscriptionStatus?.plan === 'pro' && subscriptionStatus?.subscription_status === 'active';
    }
    return false;
  };

  const handleFeatureToggle = (featureId: string) => {
    if (!canUseFeature(featureId)) return;
    
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  // Custom Rules Management
  const addCustomRule = () => {
    const newRule: ResponseRule = {
      id: Date.now().toString(),
      trigger: '',
      actionType: 'respond_with_knowledge',
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

  // Knowledge Sources Management
  const addKnowledgeSource = (type: 'document' | 'url') => {
    if (type === 'document') {
      triggerFileInput();
      return;
    }
    
    const newSource: KnowledgeSource = {
      id: Date.now().toString(),
      type,
      name: '',
      status: 'pending',
      ...(type === 'url' ? { url: '' } : {})
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

  const processFileUpload = (files: File[]) => {
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      setError('Only PDF files are allowed. Please select PDF files only.');
      return;
    }
    
    const newSources: KnowledgeSource[] = pdfFiles.map(file => ({
      id: Date.now().toString() + Math.random(),
      type: 'document',
      name: file.name,
      file: file,
      status: 'uploaded'
    }));
    
    setVoiceSettings(prev => ({
      ...prev,
      knowledgeSources: [...prev.knowledgeSources, ...newSources]
    }));
    setError(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getPreviewData = (): PreviewData => {
    const currentRole = getCurrentRole();
    const selectedAvatar = AVATAR_OPTIONS.find(avatar => avatar.id === assistantData.avatar);
    const selectedVoice = VOICE_OPTIONS.find(voice => voice.id === voiceSettings.voice);
    
    return {
      name: assistantData.name || 'Your Assistant',
      role: currentRole,
      avatar: selectedAvatar || null,
      voice: selectedVoice || null,
      features: selectedFeatures.map(featureId => 
        AVAILABLE_FEATURES.find(f => f.id === featureId)
      ).filter(Boolean) as Feature[],
      lockedFeatures: AVAILABLE_FEATURES.filter(f => 
        !selectedFeatures.includes(f.id) && !canUseFeature(f.id)
      ),
      rulesCount: voiceSettings.customRules.length,
      knowledgeSourcesCount: voiceSettings.knowledgeSources.length,
      routingEnabled: voiceSettings.routingSettings.escalateOnLowConfidence || 
                    voiceSettings.routingSettings.endIfOutOfScope ||
                    voiceSettings.routingSettings.alwaysLogIfAnalyticsEnabled
    };
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(assistantData.name.trim() && assistantData.businessName.trim());
      case 2:
        return selectedFeatures.length > 0;
      case 3:
        return true; // Voice settings are optional
      default:
        return false;
    }
  };

  const resetForm = () => {
    setAssistantData(initialAssistantData);
    setSelectedFeatures(['voice', 'booking']);
    setVoiceSettings(initialVoiceSettings);
    setError(null);
  };

  const contextValue: CreateAssistantContextType = {
    // Step 1: Assistant Data
    assistantData,
    setAssistantData,
    updateAssistantData,
    
    // Step 2: Feature Selection
    selectedFeatures,
    setSelectedFeatures,
    handleFeatureToggle,
    
    // Step 3: Voice & Behavior
    voiceSettings,
    setVoiceSettings,
    updateVoiceSettings,
    
    // Custom Rules Management
    addCustomRule,
    removeCustomRule,
    updateCustomRule,
    
    // Knowledge Sources Management
    addKnowledgeSource,
    removeKnowledgeSource,
    updateKnowledgeSource,
    processFileUpload,
    
    // Subscription & Validation
    subscriptionStatus,
    canUseFeature,
    
    // Helper Functions
    getCurrentRole,
    getPreviewData,
    validateStep,
    resetForm,
    
    // File handling
    fileInputRef,
    triggerFileInput,
    
    // Loading and Error states
    isLoading,
    setIsLoading,
    error,
    setError
  };

  return (
    <CreateAssistantContext.Provider value={contextValue}>
      {children}
    </CreateAssistantContext.Provider>
  );
};

export const useCreateAssistant = () => {
  const context = useContext(CreateAssistantContext);
  if (context === undefined) {
    throw new Error('useCreateAssistant must be used within a CreateAssistantProvider');
  }
  return context;
};

export default CreateAssistantContext;