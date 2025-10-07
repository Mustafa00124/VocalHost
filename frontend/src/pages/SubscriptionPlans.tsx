import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { CheckIcon, SparklesIcon, StarIcon, BuildingOfficeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '../components/ConfirmationModal';

interface SubscriptionStatus {
  plan: string;
  subscription_status: string;
  max_agents: number;
  allowed_addons: string[];
  can_create_agent: boolean;
}

const SubscriptionPlans = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  
  // Calendly URL for custom plan inquiries
  const CALENDLY_URL = "https://calendly.com/buggedbrilliance-support";
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
  
  // For background and text colors based on theme
  const bgClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const hoverBgClass = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-800';
  const textMutedClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const borderClass = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  
  // Fetch subscription status
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/my-agents`, {
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
  }, [user, API_BASE_URL]);

  // Plan data with dynamic status checking
  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: '$25',
      period: 'per month',
      description: 'Perfect for individuals or small businesses just getting started with voice assistants.',
      features: [
        '1 voice assistant',
        '📞 Voice calls & responses',
        '📚 Knowledge base integration',
        'Business hours support',
        'Today-only analytics',
        'Standard voice quality'
      ],
      icon: <StarIcon className="w-6 h-6" />,
      color: 'from-primary-400 to-primary-500',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$50',
      period: 'per month',
      description: 'Ideal for growing businesses that need multiple assistants with enhanced features.',
      features: [
        '3 voice assistants',
        '📞 Voice calls & responses',
        '📚 Knowledge base integration',
        '💬 Chat/WhatsApp integration',
        '📅 Booking & scheduling',
        '👥 CRM integration',
        '📊 Advanced analytics (30 days)',
        'Priority support',
        'Premium voice quality'
      ],
      icon: <SparklesIcon className="w-6 h-6" />,
      color: 'from-primary-500 to-secondary-500',
      popular: true
    },
    {
      id: 'custom',
      name: 'Custom',
      price: 'Custom',
      period: 'pricing',
      description: 'Tailored solutions for large businesses and enterprises with specific requirements.',
      features: [
        'Unlimited voice assistants',
        'Enterprise-grade voice quality',
        '24/7 dedicated support',
        'Full API access',
        'Unlimited appointments',
        'White-label options',
        'Custom integrations'
      ],
      icon: <BuildingOfficeIcon className="w-6 h-6" />,
      color: 'from-secondary-400 to-secondary-500',
      popular: false
    }
  ];

  const getCurrentPlanStatus = (planId: string) => {
    if (!subscriptionStatus) return 'available';
    
    if (subscriptionStatus.plan === planId && subscriptionStatus.subscription_status === 'active') {
      return 'current';
    } else if (subscriptionStatus.plan === 'none' || subscriptionStatus.subscription_status !== 'active') {
      return 'available';
    } else {
      // User has a different active plan
      const currentPlanIndex = plans.findIndex(p => p.id === subscriptionStatus.plan);
      const thisPlanIndex = plans.findIndex(p => p.id === planId);
      return thisPlanIndex > currentPlanIndex ? 'upgrade' : 'downgrade';
    }
  };

  const handlePlanSelect = (planId: string) => {
    const status = getCurrentPlanStatus(planId);
    if (status === 'current') return;
    
    setSelectedPlan(planId);
    if (planId === 'custom') {
      // For custom plan, open Calendly link
      window.open(CALENDLY_URL, '_blank');
    } else {
      // For Basic and Pro plans, show confirmation
      setShowConfirmModal(true);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      alert('Please sign in to subscribe to a plan.');
      return;
    }

    if (!selectedPlan || selectedPlan === 'custom') {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/stripe/create-checkout-session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: selectedPlan
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start subscription process. Please try again.');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user || !subscriptionStatus?.subscription_status) {
      alert('No subscription found. Please subscribe to a plan first.');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/stripe/create-customer-portal-session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe customer portal
        window.location.href = data.url;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to access customer portal');
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error);
      alert('Failed to access subscription management. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPlanButtonText = (planId: string) => {
    const status = getCurrentPlanStatus(planId);
    switch (status) {
      case 'current': return 'Current Plan';
      case 'upgrade': return 'Upgrade';
      case 'downgrade': return 'Downgrade';
      default: return planId === 'custom' ? 'Schedule Consultation' : 'Subscribe Now';
    }
  };

  const isPlanDisabled = (planId: string) => {
    return getCurrentPlanStatus(planId) === 'current';
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: theme === 'dark' ? 'var(--background-dark)' : 'var(--background-light)',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Enhanced background effects */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(ellipse at 30% 20%, rgba(10, 14, 39, 0.8) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(30, 27, 75, 0.6) 0%, transparent 50%)'
            : 'radial-gradient(ellipse at 30% 20%, rgba(248, 250, 252, 0.9) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(226, 232, 240, 0.8) 0%, transparent 50%)'
        }}
      ></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-12"
        >
        <div className="text-center space-y-4 mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
            }}
          >
            Choose Your Plan
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={`max-w-2xl mx-auto text-lg font-medium ${
              theme === 'dark' ? 'text-white/90' : 'text-gray-700'
            }`}
          >
            Find the perfect plan for your business needs. Upgrade, downgrade, or cancel anytime.
          </motion.p>
          
          {/* Current Subscription Status */}
          {subscriptionStatus && (
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
              subscriptionStatus.subscription_status === 'active' 
                ? theme === 'dark' 
                  ? 'bg-primary-900 text-primary-200 border border-primary-700' 
                  : 'bg-primary-50 text-primary-800 border border-primary-200'
                : theme === 'dark'
                  ? 'bg-yellow-900 text-yellow-200 border border-yellow-700'
                  : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            }`}>
              <span className="font-medium">
                Current Plan: {subscriptionStatus.plan === 'none' ? 'No Subscription' : subscriptionStatus.plan.charAt(0).toUpperCase() + subscriptionStatus.plan.slice(1)}
              </span>
              {subscriptionStatus.subscription_status === 'active' && (
                <CheckIcon className="w-4 h-4" />
              )}
            </div>
          )}
          
          {/* Subscription Management Button for existing users */}
          {subscriptionStatus && subscriptionStatus.subscription_status === 'active' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleManageSubscription}
              disabled={loading}
              className="mt-4 px-6 py-2 rounded-lg font-semibold disabled:opacity-50 text-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)'
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="loading-spinner"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                'Manage My Subscription'
              )}
            </motion.button>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const planStatus = getCurrentPlanStatus(plan.id);
            const isDisabled = isPlanDisabled(plan.id);
            
            return (
              <motion.div
                key={plan.id}
                whileHover={{ 
                  scale: isDisabled ? 1 : 1.02,
                  rotateY: isDisabled ? 0 : 3,
                  rotateX: isDisabled ? 0 : 3
                }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`relative rounded-2xl p-6 flex flex-col h-full transform-gpu ${
                  plan.popular ? 'popular' : ''
                } ${isDisabled ? 'opacity-75' : ''}`}
                style={{
                  background: plan.popular 
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 50%, rgba(240, 147, 251, 0.1) 100%)'
                    : theme === 'dark' 
                      ? 'rgba(31, 41, 55, 0.6)' 
                      : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: plan.popular 
                    ? '2px solid rgba(102, 126, 234, 0.5)' 
                    : theme === 'dark' 
                      ? '1px solid rgba(75, 85, 99, 0.3)' 
                      : '1px solid rgba(229, 231, 235, 0.5)',
                  boxShadow: plan.popular
                    ? '0 20px 40px rgba(102, 126, 234, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    : '0 10px 30px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  transformStyle: 'preserve-3d'
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <span 
                      className="text-white text-xs font-semibold px-4 py-1 rounded-full shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)'
                      }}
                    >
                      Most Popular
                    </span>
                  </div>
                )}
                
                {planStatus === 'current' && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <span 
                      className="text-white text-xs font-semibold px-4 py-1 rounded-full shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      Current Plan
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 mb-4">
                  <div 
                    className="p-3 rounded-xl inline-block shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      boxShadow: 'inset 2px 2px 5px #cbd5e0, inset -3px -3px 7px #ffffff, 0 4px 12px rgba(0,0,0,0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: '#667eea'
                    }}
                  >
                    {plan.icon}
                  </div>
                  <h3 className={`text-xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{plan.name}</h3>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-baseline">
                    <span className={`text-3xl font-extrabold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{plan.price}</span>
                    <span className={`ml-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>{plan.period}</span>
                  </div>
                  <p className={`mt-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>{plan.description}</p>
                </div>
                
                <div className="flex-grow">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5" />
                        <span className={`ml-3 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <motion.button
                  whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                  whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={loading || isDisabled}
                  className={`mt-auto w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 shadow-lg ${
                    isDisabled
                      ? 'cursor-not-allowed'
                      : planStatus === 'current' 
                        ? ''
                        : 'text-white'
                  }`}
                  style={{
                    background: isDisabled || planStatus === 'current'
                      ? theme === 'dark' 
                        ? 'rgba(75, 85, 99, 0.5)' 
                        : 'rgba(229, 231, 235, 0.8)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: isDisabled || planStatus === 'current'
                      ? theme === 'dark' ? '#9ca3af' : '#6b7280'
                      : '#ffffff',
                    boxShadow: isDisabled || planStatus === 'current'
                      ? 'none'
                      : '0 4px 16px rgba(102, 126, 234, 0.4)'
                  }}
                >
                  {loading && selectedPlan === plan.id ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="loading-spinner"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <span className="relative z-10">{getPlanButtonText(plan.id)}</span>
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </div>


        {/* Enhanced FAQ Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 rounded-2xl p-8"
          style={{
            background: theme === 'dark' 
              ? 'rgba(31, 41, 55, 0.6)' 
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            border: theme === 'dark' 
              ? '1px solid rgba(75, 85, 99, 0.3)' 
              : '1px solid rgba(229, 231, 235, 0.5)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-2xl font-bold mb-6 text-center"
            style={{ color: theme === 'dark' ? '#ffffff' : '#1f2937' }}
          >
            Frequently Asked Questions
          </motion.h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ 
                scale: 1.02,
                rotateY: 2,
                rotateX: 2
              }}
              whileTap={{ 
                scale: 0.98,
                rotateY: -1,
                rotateX: -1
              }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="p-4 rounded-lg transform-gpu cursor-pointer"
              style={{
                background: theme === 'dark' 
                  ? 'rgba(55, 65, 81, 0.5)' 
                  : 'rgba(249, 250, 251, 0.8)',
                backdropFilter: 'blur(10px)',
                border: theme === 'dark' 
                  ? '1px solid rgba(75, 85, 99, 0.3)' 
                  : '1px solid rgba(229, 231, 235, 0.5)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                transformStyle: 'preserve-3d'
              }}
            >
              <h3 className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Can I switch plans later?</h3>
              <p className={`${
                theme === 'dark' ? 'text-white/80' : 'text-gray-600'
              }`}>Yes, you can upgrade, downgrade, or cancel your subscription at any time from your account dashboard.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ 
                scale: 1.02,
                rotateY: 2,
                rotateX: 2
              }}
              whileTap={{ 
                scale: 0.98,
                rotateY: -1,
                rotateX: -1
              }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="p-4 rounded-lg transform-gpu cursor-pointer"
              style={{
                background: theme === 'dark' 
                  ? 'rgba(55, 65, 81, 0.5)' 
                  : 'rgba(249, 250, 251, 0.8)',
                backdropFilter: 'blur(10px)',
                border: theme === 'dark' 
                  ? '1px solid rgba(75, 85, 99, 0.3)' 
                  : '1px solid rgba(229, 231, 235, 0.5)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                transformStyle: 'preserve-3d'
              }}
            >
              <h3 className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>How do I add more assistants?</h3>
              <p className={`${
                theme === 'dark' ? 'text-white/80' : 'text-gray-600'
              }`}>You can upgrade to a higher tier plan or contact our sales team for a custom solution tailored to your needs.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ 
                scale: 1.02,
                rotateY: 2,
                rotateX: 2
              }}
              whileTap={{ 
                scale: 0.98,
                rotateY: -1,
                rotateX: -1
              }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="p-4 rounded-lg transform-gpu cursor-pointer"
              style={{
                background: theme === 'dark' 
                  ? 'rgba(55, 65, 81, 0.5)' 
                  : 'rgba(249, 250, 251, 0.8)',
                backdropFilter: 'blur(10px)',
                border: theme === 'dark' 
                  ? '1px solid rgba(75, 85, 99, 0.3)' 
                  : '1px solid rgba(229, 231, 235, 0.5)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                transformStyle: 'preserve-3d'
              }}
            >
              <h3 className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>What payment methods do you accept?</h3>
              <p className={`${
                theme === 'dark' ? 'text-white/80' : 'text-gray-600'
              }`}>We accept all major credit cards, PayPal, and bank transfers for annual plans.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ 
                scale: 1.02,
                rotateY: 2,
                rotateX: 2
              }}
              whileTap={{ 
                scale: 0.98,
                rotateY: -1,
                rotateX: -1
              }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="p-4 rounded-lg transform-gpu cursor-pointer"
              style={{
                background: theme === 'dark' 
                  ? 'rgba(55, 65, 81, 0.5)' 
                  : 'rgba(249, 250, 251, 0.8)',
                backdropFilter: 'blur(10px)',
                border: theme === 'dark' 
                  ? '1px solid rgba(75, 85, 99, 0.3)' 
                  : '1px solid rgba(229, 231, 235, 0.5)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                transformStyle: 'preserve-3d'
              }}
            >
              <h3 className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Is there a setup fee?</h3>
              <p className={`${
                theme === 'dark' ? 'text-white/80' : 'text-gray-600'
              }`}>No, there are no setup fees. You only pay the monthly subscription price for your selected plan.</p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSubscribe}
        title="Confirm Subscription"
        message={`You're about to subscribe to the ${selectedPlan === 'basic' ? 'Basic' : 'Pro'} plan. Your card will be charged ${selectedPlan === 'basic' ? '$25' : '$50'} monthly. You can cancel anytime.`}
        confirmButtonText="Confirm Subscription"
        cancelButtonText="Cancel"
      />
      </div>
    </div>
  );
};

export default SubscriptionPlans;