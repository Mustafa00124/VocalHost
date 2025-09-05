import { 
  PhoneIcon, 
  ChatBubbleLeftRightIcon, 
  EnvelopeIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';

import type { AssistantRole, Feature, PersonalityPreset } from '../contexts/CreateAssistantContext';

// Define interfaces here since they're used by constants
export interface VoiceOption {
  id: string;
  name: string;
  type: 'basic' | 'premium';
  gender: 'female' | 'male' | 'nonbinary' | 'robot';
  description: string;
  preview?: string;
}

export const ASSISTANT_ROLES: AssistantRole[] = [
  {
    id: 'receptionist',
    name: 'Receptionist',
    description: 'Handle calls, bookings, and basic inquiries',
    defaultFeatures: ['voice', 'booking'],
    icon: PhoneIcon
  },
  {
    id: 'support',
    name: 'Support Agent',
    description: 'Provide customer support and technical help',
    defaultFeatures: ['voice', 'chat', 'email'],
    icon: ChatBubbleLeftRightIcon
  },
  {
    id: 'sales',
    name: 'Sales Rep',
    description: 'Generate leads and close deals',
    defaultFeatures: ['voice', 'chat', 'crm'],
    icon: UserGroupIcon
  },
  {
    id: 'advanced_crm',
    name: 'Advanced CRM',
    description: 'Full customer relationship management',
    defaultFeatures: ['voice', 'chat', 'email', 'crm', 'analytics'],
    icon: ChartBarIcon
  }
];

export const AVAILABLE_FEATURES: Feature[] = [
  {
    id: 'voice',
    name: 'Voice Calls',
    description: 'Handle phone calls with AI voice',
    icon: PhoneIcon,
    requiredPlan: 'basic',
    category: 'communication'
  },
  {
    id: 'chat',
    name: 'WhatsApp Messages',
    description: 'Respond to WhatsApp messages',
    icon: ChatBubbleLeftRightIcon,
    requiredPlan: 'pro',
    category: 'communication'
  },
  {
    id: 'email',
    name: 'Email Replies',
    description: 'Automated email responses',
    icon: EnvelopeIcon,
    requiredPlan: 'pro',
    category: 'communication'
  },
  {
    id: 'booking',
    name: 'Appointment Booking',
    description: 'Automated scheduling system',
    icon: CalendarIcon,
    requiredPlan: 'basic',
    category: 'productivity'
  },
  {
    id: 'crm',
    name: 'CRM Integration',
    description: 'Customer relationship management',
    icon: UserGroupIcon,
    requiredPlan: 'pro',
    category: 'productivity'
  },
  {
    id: 'analytics',
    name: 'Analytics & Reports',
    description: 'Performance tracking and insights',
    icon: ChartBarIcon,
    requiredPlan: 'pro',
    category: 'analytics'
  }
];

export const VOICE_OPTIONS: VoiceOption[] = [
  // Female voices
  { id: 'female_basic_1', name: 'Sarah', type: 'basic', gender: 'female', description: 'Warm and professional' },
  { id: 'female_basic_2', name: 'Jessica', type: 'basic', gender: 'female', description: 'Friendly and approachable' },
  { id: 'female_premium_1', name: 'Emma', type: 'premium', gender: 'female', description: 'Natural and expressive' },
  { id: 'female_premium_2', name: 'Sophia', type: 'premium', gender: 'female', description: 'Elegant and sophisticated' },
  
  // Male voices
  { id: 'male_basic_1', name: 'David', type: 'basic', gender: 'male', description: 'Clear and confident' },
  { id: 'male_basic_2', name: 'Michael', type: 'basic', gender: 'male', description: 'Professional and reliable' },
  { id: 'male_premium_1', name: 'James', type: 'premium', gender: 'male', description: 'Authoritative and friendly' },
  { id: 'male_premium_2', name: 'Alexander', type: 'premium', gender: 'male', description: 'Smooth and charismatic' },
  
  // Non-binary voices
  { id: 'nonbinary_basic_1', name: 'Alex', type: 'basic', gender: 'nonbinary', description: 'Neutral and welcoming' },
  { id: 'nonbinary_basic_2', name: 'Jordan', type: 'basic', gender: 'nonbinary', description: 'Balanced and clear' },
  { id: 'nonbinary_premium_1', name: 'Riley', type: 'premium', gender: 'nonbinary', description: 'Inclusive and professional' },
  { id: 'nonbinary_premium_2', name: 'Casey', type: 'premium', gender: 'nonbinary', description: 'Modern and versatile' },
  
  // Robot voices
  { id: 'robot_basic_1', name: 'ARIA', type: 'basic', gender: 'robot', description: 'Digital assistant voice' },
  { id: 'robot_basic_2', name: 'NEXUS', type: 'basic', gender: 'robot', description: 'AI companion voice' },
  { id: 'robot_premium_1', name: 'ZENITH', type: 'premium', gender: 'robot', description: 'Advanced AI voice' },
  { id: 'robot_premium_2', name: 'QUANTUM', type: 'premium', gender: 'robot', description: 'Futuristic AI voice' }
];

export const PERSONALITY_PRESETS: PersonalityPreset[] = [
  { id: 'friendly', name: 'Friendly', description: 'Warm and approachable', tone: 'friendly', warmth: 8, formality: 3 },
  { id: 'formal', name: 'Formal', description: 'Professional and structured', tone: 'formal', warmth: 4, formality: 9 },
  { id: 'neutral', name: 'Neutral', description: 'Balanced and consistent', tone: 'neutral', warmth: 6, formality: 6 },
  { id: 'enthusiastic', name: 'Enthusiastic', description: 'Energetic and engaging', tone: 'enthusiastic', warmth: 9, formality: 2 },
  { id: 'professional', name: 'Professional', description: 'Competent and reliable', tone: 'professional', warmth: 5, formality: 8 }
];

export interface AvatarOption {
  id: string;
  name: string;
  emoji: string;
  gender: 'female' | 'male' | 'nonbinary' | 'robot';
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  // Female avatars
  { id: 'female1', name: 'Professional Woman', emoji: '👩‍💼', gender: 'female' },
  { id: 'female2', name: 'Business Executive', emoji: '👩‍💻', gender: 'female' },
  { id: 'female3', name: 'Customer Service', emoji: '👩‍🏢', gender: 'female' },
  { id: 'female4', name: 'Healthcare Professional', emoji: '👩‍⚕️', gender: 'female' },
  
  // Male avatars
  { id: 'male1', name: 'Professional Man', emoji: '👨‍💼', gender: 'male' },
  { id: 'male2', name: 'Tech Specialist', emoji: '👨‍💻', gender: 'male' },
  { id: 'male3', name: 'Business Consultant', emoji: '👨‍🏢', gender: 'male' },
  { id: 'male4', name: 'Support Agent', emoji: '👨‍🔧', gender: 'male' },
  
  // Non-binary avatars
  { id: 'nonbinary1', name: 'Inclusive Professional', emoji: '🧑‍💼', gender: 'nonbinary' },
  { id: 'nonbinary2', name: 'Tech Expert', emoji: '🧑‍💻', gender: 'nonbinary' },
  { id: 'nonbinary3', name: 'Business Leader', emoji: '🧑‍🏢', gender: 'nonbinary' },
  { id: 'nonbinary4', name: 'Service Professional', emoji: '🧑‍🔧', gender: 'nonbinary' },
  
  // Robot avatars
  { id: 'robot1', name: 'Friendly AI', emoji: '🤖', gender: 'robot' },
  { id: 'robot2', name: 'Smart Assistant', emoji: '🦾', gender: 'robot' },
  { id: 'robot3', name: 'Digital Helper', emoji: '💻', gender: 'robot' },
  { id: 'robot4', name: 'Virtual Agent', emoji: '🔧', gender: 'robot' }
];

export const GENDER_OPTIONS = [
  { id: 'female', name: 'Female', icon: '♀️' },
  { id: 'male', name: 'Male', icon: '♂️' },
  { id: 'nonbinary', name: 'Non-binary', icon: '⚧️' },
  { id: 'robot', name: 'Robot/AI', icon: '🤖' }
];

export const RESPONSE_RULE_ACTIONS = [
  { 
    id: 'respond_with_knowledge', 
    name: 'Respond with Knowledge', 
    description: 'Use knowledge base to answer',
    requiresKnowledgeSource: true 
  },
  { 
    id: 'escalate_to_human', 
    name: 'Escalate to Human', 
    description: 'Transfer to human operator',
    requiresKnowledgeSource: false 
  },
  { 
    id: 'end_conversation', 
    name: 'End Conversation', 
    description: 'Politely end the interaction',
    requiresKnowledgeSource: false 
  },
  { 
    id: 'log_to_analytics', 
    name: 'Log to Analytics', 
    description: 'Record interaction for analysis',
    requiresKnowledgeSource: false 
  }
];

export const LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' }
];

export const LOCALE_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'EU', label: 'Europe' }
];