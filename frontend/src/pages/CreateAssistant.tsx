import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { CreateAssistantProvider, useCreateAssistant } from '../contexts/CreateAssistantContext';
import ConfirmationModal from '../components/ConfirmationModal';
import SuccessModal from '../components/SuccessModal';
import { useNavigate } from 'react-router-dom';
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
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

// Step Components
const Step1Registration = () => {
  const { theme } = useTheme();
  const { assistantData, updateAssistantData } = useCreateAssistant();
  
  const labelClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-700';
  const inputClass = theme === 'dark' 
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' 
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500';

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Assistant Identity
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
                    <IconComponent className={`w-6 h-6 ${
                      assistantData.role === role.id ? 'text-primary-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`} />
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

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium ${labelClass} mb-3`}>
                Gender/Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {GENDER_OPTIONS.map((gender) => (
                  <div
                    key={gender.id}
                    className={`p-4 border rounded-lg cursor-pointer text-center transition-all duration-200 ${
                      assistantData.gender === gender.id
                        ? theme === 'dark' ? 'border-primary-500 bg-primary-500/10' : 'border-primary-400 bg-primary-50'
                        : theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => updateAssistantData('gender', gender.id)}
                  >
                    <div className="text-2xl mb-2">{gender.icon}</div>
                    <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {gender.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${labelClass} mb-3`}>
                Avatar Style *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {AVATAR_OPTIONS
                  .filter(avatar => avatar.gender === assistantData.gender)
                  .map((avatar) => (
                  <div
                    key={avatar.id}
                    className={`p-4 border rounded-lg cursor-pointer text-center transition-all duration-200 ${
                      assistantData.avatar === avatar.id
                        ? theme === 'dark' ? 'border-primary-500 bg-primary-500/10' : 'border-primary-400 bg-primary-50'
                        : theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => updateAssistantData('avatar', avatar.id)}
                  >
                    <div className="text-3xl mb-2">{avatar.emoji}</div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {avatar.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium ${labelClass} mb-2`}>
                Language
              </label>
              <select
                value={assistantData.language}
                onChange={(e) => updateAssistantData('language', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent border ${inputClass}`}
              >
                {LANGUAGE_OPTIONS.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${labelClass} mb-2`}>
                Locale
              </label>
              <select
                value={assistantData.locale}
                onChange={(e) => updateAssistantData('locale', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent border ${inputClass}`}
              >
                {LOCALE_OPTIONS.map(locale => (
                  <option key={locale.value} value={locale.value}>{locale.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Step2Features = () => {
  const { theme } = useTheme();
  const { selectedFeatures, handleFeatureToggle, canUseFeature, getCurrentRole } = useCreateAssistant();
  
  const currentRole = getCurrentRole();

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Feature Selection
        </h2>
        <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Choose the capabilities for your {currentRole?.name.toLowerCase()} assistant
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AVAILABLE_FEATURES.map((feature) => {
            const IconComponent = feature.icon;
            const isSelected = selectedFeatures.includes(feature.id);
            const canUse = canUseFeature(feature.id);
            const isDefault = currentRole?.defaultFeatures.includes(feature.id);
            
            return (
              <div
                key={feature.id}
                className={`p-4 border rounded-lg transition-all duration-200 ${
                  isSelected && canUse
                    ? theme === 'dark' ? 'border-primary-500 bg-primary-500/10' : 'border-primary-400 bg-primary-50'
                    : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                } ${
                  !canUse ? 'opacity-60' : 'cursor-pointer hover:border-gray-400'
                }`}
                onClick={() => canUse && handleFeatureToggle(feature.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected || isDefault}
                      disabled={isDefault || !canUse}
                      onChange={() => canUse && !isDefault && handleFeatureToggle(feature.id)}
                      className="h-4 w-4 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <IconComponent className={`w-5 h-5 ${
                      isSelected ? 'text-primary-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {feature.name}
                        </span>
                        {feature.requiredPlan === 'pro' && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-semibold">
                            PRO
                          </span>
                        )}
                        {isDefault && (
                          <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-semibold">
                            INCLUDED
                          </span>
                        )}
                        {!canUse && !isDefault && (
                          <LockClosedIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {feature.description}
                        {!canUse && !isDefault && (
                          <span className="block text-xs text-yellow-600 mt-1">
                            Requires {feature.requiredPlan.charAt(0).toUpperCase() + feature.requiredPlan.slice(1)} plan or higher
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
    </div>
  );
};

const Step3VoiceBehavior = () => {
  const { theme } = useTheme();
  const { 
    assistantData,
    voiceSettings, 
    updateVoiceSettings, 
    addCustomRule, 
    removeCustomRule, 
    updateCustomRule, 
    addKnowledgeSource, 
    removeKnowledgeSource, 
    updateKnowledgeSource, 
    processFileUpload,
    fileInputRef 
  } = useCreateAssistant();
  
  const labelClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-700';
  const inputClass = theme === 'dark' 
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' 
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      processFileUpload(filesArray);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Voice & Behavior Setup
        </h2>
        
        {/* Voice Selection */}
        <div className="mb-8">
          <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Voice Selection
          </h3>
          <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose a voice that matches your selected {assistantData.gender === 'nonbinary' ? 'non-binary' : assistantData.gender} assistant
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VOICE_OPTIONS
              .filter(voice => voice.gender === assistantData.gender)
              .map((voice) => (
              <div
                key={voice.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  voiceSettings.voice === voice.id
                    ? theme === 'dark' ? 'border-primary-500 bg-primary-500/10' : 'border-primary-400 bg-primary-50'
                    : theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => updateVoiceSettings('voice', voice.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {voice.name}
                    </h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {voice.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <SpeakerWaveIcon className="w-5 h-5 text-primary-500" />
                    {voice.type === 'premium' && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-semibold">
                        PREMIUM
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personality Selection */}
        <div className="mb-8">
          <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Personality & Tone
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PERSONALITY_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  voiceSettings.personality === preset.id
                    ? theme === 'dark' ? 'border-primary-500 bg-primary-500/10' : 'border-primary-400 bg-primary-50'
                    : theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => updateVoiceSettings('personality', preset.id)}
              >
                <h4 className={`font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {preset.name}
                </h4>
                <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {preset.description}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Warmth</span>
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{preset.warmth}/10</span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"
                      style={{ width: `${preset.warmth * 10}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Formality</span>
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{preset.formality}/10</span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500"
                      style={{ width: `${preset.formality * 10}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="mb-8">
          <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Custom Instructions
          </h3>
          <div>
            <label className={`block text-sm font-medium ${labelClass} mb-2`}>
              Additional Personality Instructions (Optional)
            </label>
            <textarea
              value={voiceSettings.customInstructions}
              onChange={(e) => updateVoiceSettings('customInstructions', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent border ${inputClass}`}
              rows={3}
              placeholder="e.g., Always mention our 24/7 support line, speak with enthusiasm about new products..."
            />
          </div>
        </div>

        {/* Response Rules */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Custom Response Rules
            </h3>
            <button
              type="button"
              onClick={addCustomRule}
              className="flex items-center space-x-2 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Rule</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {voiceSettings.customRules.map((rule) => (
              <div key={rule.id} className={`p-4 border rounded-lg ${theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Response Rule
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeCustomRule(rule.id)}
                    className="text-red-400 hover:text-red-500"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${labelClass} mb-2`}>
                      Trigger Phrase
                    </label>
                    <input
                      type="text"
                      value={rule.trigger}
                      onChange={(e) => updateCustomRule(rule.id, 'trigger', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent border ${inputClass}`}
                      placeholder="e.g., 'I want to cancel'"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${labelClass} mb-2`}>
                      Action Type
                    </label>
                    <select
                      value={rule.actionType}
                      onChange={(e) => updateCustomRule(rule.id, 'actionType', e.target.value as any)}
                      className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent border ${inputClass}`}
                    >
                      {RESPONSE_RULE_ACTIONS.map(action => (
                        <option key={action.id} value={action.id}>{action.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${labelClass} mb-2`}>
                      {rule.actionType === 'respond_with_knowledge' ? 'Knowledge Source' : 'Response'}
                    </label>
                    {rule.actionType === 'respond_with_knowledge' ? (
                      <select
                        value={rule.knowledgeSourceId || ''}
                        onChange={(e) => updateCustomRule(rule.id, 'knowledgeSourceId', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent border ${inputClass}`}
                      >
                        <option value="">Select knowledge source...</option>
                        {voiceSettings.knowledgeSources.map(source => (
                          <option key={source.id} value={source.id}>{source.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={rule.response || ''}
                        onChange={(e) => updateCustomRule(rule.id, 'response', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent border ${inputClass}`}
                        placeholder="Response text or instructions..."
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {voiceSettings.customRules.length === 0 && (
              <div className={`p-4 border-2 border-dashed rounded-lg text-center ${
                theme === 'dark' ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
              }`}>
                <p>No custom rules defined. Add rules to handle specific scenarios.</p>
              </div>
            )}
          </div>
        </div>

        {/* Knowledge Sources */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Knowledge Sources
            </h3>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => addKnowledgeSource('document')}
                className="flex items-center space-x-2 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <DocumentIcon className="w-4 h-4" />
                <span>Add Document</span>
              </button>
              <button
                type="button"
                onClick={() => addKnowledgeSource('url')}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <GlobeAltIcon className="w-4 h-4" />
                <span>Add URL</span>
              </button>
            </div>
          </div>
          
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            multiple
            className="hidden"
          />
          
          <div className="space-y-4">
            {voiceSettings.knowledgeSources.map((source) => (
              <div key={source.id} className={`p-4 border rounded-lg ${theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {source.type === 'document' ? (
                      <DocumentIcon className="w-5 h-5 text-primary-500" />
                    ) : (
                      <GlobeAltIcon className="w-5 h-5 text-blue-500" />
                    )}
                    <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {source.type === 'document' ? 'Document' : 'URL'}
                    </span>
                    {source.status !== 'pending' && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        source.status === 'ready' ? 'bg-green-100 text-green-800' :
                        source.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        source.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {source.status}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeKnowledgeSource(source.id)}
                    className="text-red-400 hover:text-red-500"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${labelClass} mb-2`}>
                      Name
                    </label>
                    <input
                      type="text"
                      value={source.name}
                      onChange={(e) => updateKnowledgeSource(source.id, 'name', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent border ${inputClass}`}
                      placeholder="e.g., Company Policies"
                    />
                  </div>
                  {source.type === 'url' && (
                    <div>
                      <label className={`block text-sm font-medium ${labelClass} mb-2`}>
                        URL
                      </label>
                      <input
                        type="url"
                        value={source.url || ''}
                        onChange={(e) => updateKnowledgeSource(source.id, 'url', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent border ${inputClass}`}
                        placeholder="https://example.com"
                      />
                    </div>
                  )}
                  {source.type === 'document' && source.file && (
                    <div>
                      <label className={`block text-sm font-medium ${labelClass} mb-2`}>
                        File
                      </label>
                      <div className={`px-3 py-2 rounded-lg border bg-gray-100 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>
                        {source.file.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {voiceSettings.knowledgeSources.length === 0 && (
              <div className={`p-4 border-2 border-dashed rounded-lg text-center ${
                theme === 'dark' ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
              }`}>
                <p>No knowledge sources added yet. Upload documents or add URLs to enhance your assistant's knowledge.</p>
              </div>
            )}
          </div>
        </div>

        {/* Routing Settings */}
        <div>
          <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Routing & Behavior Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="escalateOnLowConfidence"
                checked={voiceSettings.routingSettings.escalateOnLowConfidence}
                onChange={(e) => updateVoiceSettings('routingSettings', {
                  ...voiceSettings.routingSettings,
                  escalateOnLowConfidence: e.target.checked
                })}
                className="h-4 w-4 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
              />
              <label htmlFor="escalateOnLowConfidence" className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                Escalate to human when confidence is low
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="endIfOutOfScope"
                checked={voiceSettings.routingSettings.endIfOutOfScope}
                onChange={(e) => updateVoiceSettings('routingSettings', {
                  ...voiceSettings.routingSettings,
                  endIfOutOfScope: e.target.checked
                })}
                className="h-4 w-4 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
              />
              <label htmlFor="endIfOutOfScope" className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                End conversation politely if request is out of scope
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="alwaysLogIfAnalyticsEnabled"
                checked={voiceSettings.routingSettings.alwaysLogIfAnalyticsEnabled}
                onChange={(e) => updateVoiceSettings('routingSettings', {
                  ...voiceSettings.routingSettings,
                  alwaysLogIfAnalyticsEnabled: e.target.checked
                })}
                className="h-4 w-4 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
              />
              <label htmlFor="alwaysLogIfAnalyticsEnabled" className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                Always log interactions when analytics is enabled
              </label>
            </div>

            <div>
              <label className={`block text-sm font-medium ${labelClass} mb-2`}>
                Low Confidence Threshold: {voiceSettings.routingSettings.lowConfidenceThreshold}
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                value={voiceSettings.routingSettings.lowConfidenceThreshold}
                onChange={(e) => updateVoiceSettings('routingSettings', {
                  ...voiceSettings.routingSettings,
                  lowConfidenceThreshold: parseFloat(e.target.value)
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>More sensitive</span>
                <span>Less sensitive</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Preview Card Component
const PreviewCard = () => {
  const { theme } = useTheme();
  const { getPreviewData } = useCreateAssistant();
  
  const previewData = getPreviewData();
  const cardClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className={`${cardClass} border rounded-xl shadow-lg p-6 sticky top-8`}>
      <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Assistant Preview
      </h3>
      
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">{previewData.avatar?.emoji}</div>
        <h4 className={`text-xl font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {previewData.name}
        </h4>
        {previewData.role && (
          <div className="flex items-center justify-center space-x-2 mt-2">
            <previewData.role.icon className="w-4 h-4 text-primary-500" />
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {previewData.role.name}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h5 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Enabled Features ({previewData.features.length})
          </h5>
          <div className="flex flex-wrap gap-2">
            {previewData.features.map((feature) => {
              const IconComponent = feature?.icon;
              return (
                <div
                  key={feature?.id}
                  className="flex items-center space-x-1 px-2 py-1 bg-primary-500/10 text-primary-500 rounded-full text-xs"
                >
                  {IconComponent && <IconComponent className="w-3 h-3" />}
                  <span>{feature?.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {previewData.lockedFeatures.length > 0 && (
          <div>
            <h5 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Locked Features ({previewData.lockedFeatures.length})
            </h5>
            <div className="flex flex-wrap gap-2">
              {previewData.lockedFeatures.map((feature) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={feature.id}
                    className="flex items-center space-x-1 px-2 py-1 bg-gray-500/10 text-gray-500 rounded-full text-xs"
                  >
                    {IconComponent && <IconComponent className="w-3 h-3" />}
                    <span>{feature.name}</span>
                    <LockClosedIcon className="w-3 h-3" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {previewData.voice && (
          <div>
            <h5 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Voice
            </h5>
            <div className="flex items-center space-x-2">
              <SpeakerWaveIcon className="w-4 h-4 text-primary-500" />
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {previewData.voice.name}
              </span>
              {previewData.voice.type === 'premium' && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-semibold">
                  PREMIUM
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="text-center">
            <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {previewData.rulesCount}
            </div>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Custom Rules
            </div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {previewData.knowledgeSourcesCount}
            </div>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Knowledge Sources
            </div>
          </div>
        </div>

        {previewData.routingEnabled && (
          <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <div className="flex items-center space-x-2">
              <CheckIcon className="w-4 h-4 text-blue-500" />
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                Smart Routing Enabled
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Create Assistant Page Component
const CreateAssistantPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdAssistant, setCreatedAssistant] = useState<{
    id: number;
    twilioNumber: string;
    message: string;
  } | null>(null);

  // Get state and functions from context
  const { 
    assistantData, 
    selectedFeatures, 
    voiceSettings, 
    subscriptionStatus, 
    validateStep, 
    isLoading, 
    setIsLoading, 
    error, 
    setError 
  } = useCreateAssistant();

  // Stepper navigation
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    return validateStep(currentStep);
  };

  const handleNext = () => {
    if (canProceed()) {
      nextStep();
    }
  };

  const createAssistant = async () => {
    setIsLoading(true);
    setError(null);

    const formDataToSend = new FormData();
    formDataToSend.append('user_id', String(user?.id));
    formDataToSend.append('assistant_name', assistantData.name);
    formDataToSend.append('business_name', assistantData.businessName);
    formDataToSend.append('business_description', `Role: ${assistantData.role}. Language: ${assistantData.language}. Locale: ${assistantData.locale}`);
    formDataToSend.append('voice_type', voiceSettings.voice.includes('male') ? 'male' : 'female');
    formDataToSend.append('enabled_features', JSON.stringify(selectedFeatures));

    // Add voice and behavior settings
    formDataToSend.append('voice_settings', JSON.stringify(voiceSettings));

    // Add knowledge source files
    voiceSettings.knowledgeSources.forEach(source => {
      if (source.type === 'document' && source.file) {
        formDataToSend.append('files', source.file);
      }
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
    
    // Validate all steps
    if (!validateStep(1) || !validateStep(2)) {
      setError('Please complete all required fields before creating your assistant.');
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
  const errorClass = theme === 'dark' 
    ? 'bg-red-900/20 border-red-500 text-red-300' 
    : 'bg-red-50 border-red-200 text-red-700';

  // Check if user needs to upgrade
  const needsSubscription = !subscriptionStatus || subscriptionStatus.subscription_status !== 'active';
  const atAgentLimit = Boolean(subscriptionStatus && !subscriptionStatus.can_create_agent && subscriptionStatus.subscription_status === 'active');

  // Stepper steps
  const steps = [
    { id: 1, name: 'Assistant Registration', description: 'Basic setup and identity' },
    { id: 2, name: 'Feature Selection', description: 'Choose capabilities' },
    { id: 3, name: 'Voice & Behavior', description: 'Customize interaction style' }
  ];

  return (
    <div className={`min-h-screen ${bgClass} relative overflow-hidden`}>
      <LeftFloatingElements />
      <RightFloatingElements />
      
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-6 py-8 relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2">
            <div className={`${cardClass} border rounded-xl shadow-lg p-8`}>
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Create AI Assistant
                </h1>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  Build your customized AI assistant with advanced features
                </p>
              </div>

              {/* Stepper */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep >= step.id
                            ? 'bg-primary-500 text-white'
                            : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {currentStep > step.id ? <CheckIcon className="w-5 h-5" /> : step.id}
                        </div>
                        <div className="ml-3 hidden sm:block">
                          <p className={`text-sm font-medium ${
                            currentStep >= step.id
                              ? theme === 'dark' ? 'text-white' : 'text-gray-900'
                              : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {step.name}
                          </p>
                          <p className={`text-xs ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                          }`}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-16 h-0.5 mx-4 ${
                          currentStep > step.id
                            ? 'bg-primary-500'
                            : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className={`p-4 rounded-lg border mb-6 ${errorClass}`}>
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {/* Step Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStep === 1 && <Step1Registration />}
                  {currentStep === 2 && <Step2Features />}
                  {currentStep === 3 && <Step3VoiceBehavior />}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between pt-8 border-t border-gray-700">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    currentStep === 1
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  <ChevronLeftIcon className="w-4 h-4 inline mr-2" />
                  Previous
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      !canProceed()
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-primary-500 hover:bg-primary-600 text-white'
                    }`}
                  >
                    Next
                    <ChevronRightIcon className="w-4 h-4 inline ml-2" />
                  </button>
                ) : (
                  <motion.button
                    whileHover={{ scale: needsSubscription || atAgentLimit ? 1 : 1.05 }}
                    whileTap={{ scale: needsSubscription || atAgentLimit ? 1 : 0.95 }}
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading || needsSubscription || atAgentLimit || !canProceed()}
                    className="px-8 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      'Create Assistant'
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {/* Preview Card - Right Side */}
          <div className="lg:col-span-1">
            <PreviewCard />
          </div>
        </div>

        {/* Modals */}
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={createAssistant}
          title="Confirm Assistant Creation"
          message={`Create "${assistantData.name}" for ${assistantData.businessName}?`}
          confirmButtonText="Create Assistant"
          cancelButtonText="Edit Details"
        />

        <SuccessModal
          isOpen={isSuccessModalOpen}
          onClose={handleSuccessModalClose}
          title="Assistant Created Successfully!"
          message={`Your AI assistant "${assistantData.name}" has been successfully created for ${assistantData.businessName}.`}
          buttonText="Go to Dashboard"
        />
      </motion.div>
    </div>
  );
};

// Main wrapper component with provider
const CreateAssistant = () => {
  return (
    <CreateAssistantProvider>
      <CreateAssistantPage />
    </CreateAssistantProvider>
  );
};

export default CreateAssistant;