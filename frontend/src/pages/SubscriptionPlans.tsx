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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className={theme === 'dark' ? 'text-gray-300 max-w-2xl mx-auto' : 'text-gray-600 max-w-2xl mx-auto'}>
            Find the perfect plan for your business needs. Upgrade, downgrade, or cancel anytime.
          </p>
          
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
              className="mt-4 px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Manage My Subscription'}
            </motion.button>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const planStatus = getCurrentPlanStatus(plan.id);
            const isDisabled = isPlanDisabled(plan.id);
            
            return (
              <motion.div
                key={plan.id}
                whileHover={{ scale: isDisabled ? 1 : 1.03 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`relative rounded-2xl ${bgClass} border p-6 shadow-lg flex flex-col h-full ${
                  isDisabled ? 'opacity-75' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <span className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                {planStatus === 'current' && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <span className="bg-primary-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${plan.color} text-white`}>
                    {plan.icon}
                  </div>
                  <h3 className={`text-xl font-bold ${textClass}`}>{plan.name}</h3>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-baseline">
                    <span className={`text-3xl font-extrabold ${textClass}`}>{plan.price}</span>
                    <span className={`ml-2 ${textMutedClass}`}>{plan.period}</span>
                  </div>
                  <p className={`mt-2 ${textMutedClass}`}>{plan.description}</p>
                </div>
                
                <div className="flex-grow">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5" />
                        <span className={`ml-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
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
                  className={`mt-auto w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 ${
                    isDisabled
                      ? `border ${borderClass} ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} cursor-not-allowed`
                      : plan.id === 'custom' 
                        ? `border ${borderClass} ${theme === 'dark' ? 'text-white' : 'text-gray-800'} ${hoverBgClass}` 
                        : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:opacity-90'
                  }`}
                >
                  {loading && selectedPlan === plan.id 
                    ? 'Loading...' 
                    : getPlanButtonText(plan.id)}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-16">
          <h2 className={`text-2xl font-bold mb-8 text-center ${textClass}`}>Feature Comparison</h2>
          
          <div className={`rounded-2xl ${bgClass} border p-8 shadow-lg overflow-x-auto`}>
            <table className="w-full">
              <thead>
                <tr className={`border-b ${borderClass}`}>
                  <th className={`text-left py-4 px-4 ${textClass}`}>Feature</th>
                  <th className={`text-center py-4 px-4 ${textClass}`}>Basic</th>
                  <th className={`text-center py-4 px-4 ${textClass}`}>Pro</th>
                  <th className={`text-center py-4 px-4 ${textClass}`}>Custom</th>
                </tr>
              </thead>
              <tbody>
                <tr className={`border-b ${borderClass}`}>
                  <td className={`py-4 px-4 ${textClass}`}>Voice Assistants</td>
                  <td className="text-center py-4 px-4">1</td>
                  <td className="text-center py-4 px-4">3</td>
                  <td className="text-center py-4 px-4">Unlimited</td>
                </tr>
                <tr className={`border-b ${borderClass}`}>
                  <td className={`py-4 px-4 ${textClass}`}>WhatsApp Integration</td>
                  <td className="text-center py-4 px-4">
                    <LockClosedIcon className={`w-5 h-5 mx-auto ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                  </td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="w-5 h-5 text-primary-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="w-5 h-5 text-primary-500 mx-auto" />
                  </td>
                </tr>
                <tr className={`border-b ${borderClass}`}>
                  <td className={`py-4 px-4 ${textClass}`}>CRM Integration</td>
                  <td className="text-center py-4 px-4">
                    <LockClosedIcon className={`w-5 h-5 mx-auto ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                  </td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="w-5 h-5 text-primary-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="w-5 h-5 text-primary-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className={`py-4 px-4 ${textClass}`}>Analytics</td>
                  <td className="text-center py-4 px-4">Today only</td>
                  <td className="text-center py-4 px-4">30 days</td>
                  <td className="text-center py-4 px-4">Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className={`mt-16 rounded-2xl ${bgClass} border p-8 shadow-lg`}>
          <h2 className={`text-2xl font-bold mb-6 ${textClass}`}>Frequently Asked Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className={`p-4 border ${borderClass} rounded-lg`}>
              <h3 className={`font-semibold mb-2 ${textClass}`}>Can I switch plans later?</h3>
              <p className={textMutedClass}>Yes, you can upgrade, downgrade, or cancel your subscription at any time from your account dashboard.</p>
            </div>
            
            <div className={`p-4 border ${borderClass} rounded-lg`}>
              <h3 className={`font-semibold mb-2 ${textClass}`}>How do I add more assistants?</h3>
              <p className={textMutedClass}>You can upgrade to a higher tier plan or contact our sales team for a custom solution tailored to your needs.</p>
            </div>
            
            <div className={`p-4 border ${borderClass} rounded-lg`}>
              <h3 className={`font-semibold mb-2 ${textClass}`}>What payment methods do you accept?</h3>
              <p className={textMutedClass}>We accept all major credit cards, PayPal, and bank transfers for annual plans.</p>
            </div>
            
            <div className={`p-4 border ${borderClass} rounded-lg`}>
              <h3 className={`font-semibold mb-2 ${textClass}`}>Is there a setup fee?</h3>
              <p className={textMutedClass}>No, there are no setup fees. You only pay the monthly subscription price for your selected plan.</p>
            </div>
          </div>
        </div>
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
  );
};

export default SubscriptionPlans;