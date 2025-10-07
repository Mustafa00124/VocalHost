import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { CalendarIcon, BuildingOfficeIcon, ClockIcon, LightBulbIcon, ChatBubbleBottomCenterTextIcon, PhoneIcon, ArchiveBoxIcon, ArrowTrendingUpIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import FloatingCallDock from '../components/FloatingCallDock';
import ErrorBoundary from '../components/ErrorBoundary';

// Scroll helper function
const scrollToSection = (sectionId: string) => {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
};


const Home = () => {
  console.log("🏠 Home component rendering...");
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  console.log("🏠 Home theme:", theme, "user:", user, "loading:", loading);
  
  return (
    <div 
      className="w-full relative overflow-hidden min-h-screen"
      style={{
        background: theme === 'dark' ? 'var(--background-dark)' : 'var(--background-light)',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Enhanced gradient overlays with theme awareness */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(ellipse at 20% 30%, rgba(10, 14, 39, 0.8) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(30, 27, 75, 0.6) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(124, 58, 237, 0.3) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 20% 30%, rgba(248, 250, 252, 0.9) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(226, 232, 240, 0.8) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 70%)'
        }}
      ></div>
      
      {/* Animated gradient overlay - only in dark mode */}
      {theme === 'dark' && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background: 'conic-gradient(from 0deg at 50% 50%, rgba(6, 182, 212, 0.1) 0deg, rgba(168, 85, 247, 0.1) 120deg, rgba(236, 72, 153, 0.1) 240deg, rgba(6, 182, 212, 0.1) 360deg)',
            animation: 'rotate 20s linear infinite'
          }}
        ></div>
      )}
      
      {/* Enhanced Starry Universe Background - Dark mode only */}
      {theme === 'dark' && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Generate enhanced stars with different types - Reduced for performance */}
          {Array.from({ length: 300 }, (_, i) => {
            // Create a more even distribution using grid-like positioning with randomness
            const gridSize = Math.ceil(Math.sqrt(300));
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            
            // Base position on grid
            const baseTop = (row / (gridSize - 1)) * 100;
            const baseLeft = (col / (gridSize - 1)) * 100;
            
            // Add random offset for more natural distribution
            const randomOffset = 6; // Slightly larger offset for more organic feel
            const top = Math.max(0, Math.min(100, baseTop + (Math.random() - 0.5) * randomOffset));
            const left = Math.max(0, Math.min(100, baseLeft + (Math.random() - 0.5) * randomOffset));
            
            const delay = Math.random() * 20; // Extended delay range
            const duration = 10 + Math.random() * 15; // Slower, more varied duration
            const size = Math.random() > 0.9 ? 4 : Math.random() > 0.7 ? 3 : Math.random() > 0.4 ? 2 : 1;
            
            // Assign different star types for variety
            const starType = Math.random() > 0.8 ? 'pulse' : Math.random() > 0.6 ? 'twinkle' : '';
            
            return (
              <div
                key={`star-${i}`}
                className={`star ${starType}`}
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDelay: `-${delay}s`,
                  animationDuration: `${duration}s`
                }}
              />
            );
          })}
          
          {/* Floating Particles - Reduced for performance */}
          {Array.from({ length: 8 }, (_, i) => {
            const delay = Math.random() * 20;
            const duration = 15 + Math.random() * 10;
            const size = Math.random() * 8 + 4;
            const left = Math.random() * 100;
            
            return (
              <div
                key={`particle-${i}`}
                className="particle"
                style={{
                  left: `${left}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDelay: `-${delay}s`,
                  animationDuration: `${duration}s`
                }}
              />
            );
          })}
          
          {/* Enhanced Lightning Bolts - Reduced for performance */}
          {Array.from({ length: 3 }, (_, i) => {
            const top = Math.random() * 80 + 10; // 10% to 90%
            const left = Math.random() * 80 + 10; // 10% to 90%
            const delay = Math.random() * 5;
            const duration = 2 + Math.random() * 3; // 2-5 seconds
            
            return (
              <div
                key={`lightning-${i}`}
                className="absolute"
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  width: '3px',
                  height: `${60 + Math.random() * 40}px`, // 60-100px height
                  background: 'linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(102, 126, 234, 0.9) 30%, rgba(118, 75, 162, 0.8) 60%, rgba(240, 147, 251, 0.6) 90%, transparent 100%)',
                  boxShadow: `
                    0 0 4px rgba(255, 255, 255, 1),
                    0 0 8px rgba(102, 126, 234, 0.8),
                    0 0 12px rgba(118, 75, 162, 0.6),
                    0 0 16px rgba(240, 147, 251, 0.4)
                  `,
                  animation: `lightning-strike ${duration}s ease-in-out infinite`,
                  animationDelay: `${delay}s`,
                  transformOrigin: 'top center',
                  borderRadius: '1px'
                }}
              />
            );
          })}
          
          {/* Moving shooting stars with enhanced effects */}
          <div className="absolute w-2 h-1 opacity-80" style={{
            top: '15%', 
            left: '0%', 
            background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 1), rgba(102, 126, 234, 0.8), transparent)',
            boxShadow: '0 0 8px rgba(102, 126, 234, 0.6), 0 0 16px rgba(118, 75, 162, 0.4)',
            animation: 'shooting-star-1 8s linear infinite',
            animationDelay: '0s'
          }}></div>
          <div className="absolute w-2 h-1 opacity-70" style={{
            top: '35%', 
            left: '0%', 
            background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 1), rgba(118, 75, 162, 0.8), transparent)',
            boxShadow: '0 0 8px rgba(118, 75, 162, 0.6), 0 0 16px rgba(240, 147, 251, 0.4)',
            animation: 'shooting-star-2 12s linear infinite',
            animationDelay: '3s'
          }}></div>
          <div className="absolute w-2 h-1 opacity-60" style={{
            top: '55%', 
            left: '0%', 
            background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 1), rgba(240, 147, 251, 0.8), transparent)',
            boxShadow: '0 0 8px rgba(240, 147, 251, 0.6), 0 0 16px rgba(102, 126, 234, 0.4)',
            animation: 'shooting-star-3 10s linear infinite',
            animationDelay: '6s'
          }}></div>
        </div>
      )}
      
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-[80vh] flex items-center relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-center min-h-[80vh]">
            {/* Enhanced Centered Content with Advanced Glass Morphism */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl text-center space-y-8 p-12 rounded-3xl glass-enhanced interactive-card"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={`text-4xl md:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-2xl ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
              >
                Create Your Business Voice Assistant
              </motion.h1>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className={`w-24 h-1 rounded-full mx-auto ${
                  theme === 'dark' ? 'bg-white' : 'bg-purple-600'
                }`}
              />
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className={`text-lg md:text-xl leading-relaxed max-w-3xl mx-auto drop-shadow-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-700'
                }`}
              >
                Automate appointment scheduling and customer service with an AI voice assistant tailored to your business's specific needs.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-row gap-3 justify-center items-stretch"
              >
                {/* Create Assistant Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  {!loading && !user ? (
                    <Link
                      to="/login"
                      className="relative px-6 py-3 text-white font-semibold text-sm rounded-xl gradient-button ripple-button flex items-center justify-center min-w-[160px] h-12 shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
                      }}
                    >
                      <span className="relative z-10">Create Assistant</span>
                    </Link>
                  ) : (
                    <Link
                      to="/create"
                      className="relative px-6 py-3 text-white font-semibold text-sm rounded-xl gradient-button ripple-button flex items-center justify-center min-w-[160px] h-12 shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
                      }}
                    >
                      <span className="relative z-10">Create Assistant</span>
                    </Link>
                  )}
                </motion.div>

                {/* Request Demo Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <a
                    href="https://calendly.com/buggedbrilliance-support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`relative px-6 py-3 font-semibold text-sm rounded-xl neuro-button flex items-center justify-center min-w-[160px] h-12 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    <span className="relative z-10">Request Demo</span>
                  </a>
                </motion.div>

                {/* Interactive Demo Button - Opens the floating demo */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <button
                    onClick={() => {
                      // Trigger the floating demo widget
                      const demoButton = document.querySelector('[data-demo-trigger]') as HTMLButtonElement;
                      if (demoButton) {
                        demoButton.click();
                      }
                    }}
                    className={`relative px-6 py-3 font-semibold text-sm rounded-xl neuro-button flex items-center justify-center min-w-[160px] h-12 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    <span className="relative z-10">Interactive Demo</span>
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        </section>

      {/* Features Section */}
      <section id="features-section" className="relative -mt-20 mb-16">
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className={`text-3xl font-bold inline-block mb-4 drop-shadow-lg ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            Features
          </motion.h2>
          <p className={`max-w-2xl mx-auto font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-700'
          }`}>
            Our AI Voice Assistant comes with powerful features designed to help your business thrive
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 max-w-6xl mx-auto px-4">
          <FeatureCard
            icon={<CalendarIcon className="w-6 h-6 text-white" />}
            title="Smart Scheduling"
            description="Handle appointments and bookings with customizable time slots"
          />
          <FeatureCard
            icon={<BuildingOfficeIcon className="w-6 h-6 text-white" />}
            title="Business Integration"
            description="Tailored to your business type with custom descriptions and hours"
          />
          <FeatureCard
            icon={<ClockIcon className="w-6 h-6 text-white" />}
            title="Time Management"
            description="Set your business hours and preferred appointment durations"
          />
          <FeatureCard
            icon={<UserGroupIcon className="w-6 h-6 text-white" />}
            title="Customer Management"
            description="Track and manage your customer information and history"
          />
          <FeatureCard
            icon={<ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-white" />}
            title="Natural Conversations"
            description="AI-powered natural language understanding for human-like interactions"
          />
          <FeatureCard
            icon={<ArrowTrendingUpIcon className="w-6 h-6 text-white" />}
            title="Analytics & Insights"
            description="Track performance and gain insights to improve your business"
          />
        </div>
      </section>
      
      
      {/* Usage Section */}
      <section id="usage-section" className="relative mt-16 mb-16">
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className={`text-3xl font-bold inline-block mb-4 drop-shadow-lg ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            How It Works
          </motion.h2>
          <p className={`max-w-2xl mx-auto font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-700'
          }`}>
            See how businesses are using VocalHost to streamline their operations
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 max-w-6xl mx-auto px-4">
          <UsageCard
            icon={<PhoneIcon className="w-6 h-6 text-white" />}
            title="Medical Practices"
            description="Doctors use VocalHost to handle appointment scheduling, medication refill requests, and basic patient inquiries."
          />
          <UsageCard
            icon={<ArchiveBoxIcon className="w-6 h-6 text-white" />}
            title="Law Firms"
            description="Attorneys use VocalHost to schedule consultations, handle client intake, and provide basic legal information."
          />
          <UsageCard
            icon={<LightBulbIcon className="w-6 h-6 text-white" />}
            title="Service Businesses"
            description="Salons, cleaning services, and consultants use VocalHost to manage their appointments and client relationships."
          />
        </div>
      </section>
      
      {/* Floating Call Dock - WITH ERROR BOUNDARY - Hidden by default, triggered by button */}
      <ErrorBoundary fallback={
        <div style={{position: 'fixed', bottom: '20px', right: '20px', background: 'red', color: 'white', padding: '10px', borderRadius: '5px', maxWidth: '300px'}}>
          <h4>🚨 Demo Widget Error</h4>
          <p>Check console for details</p>
        </div>
      }>
        <FloatingCallDock />
      </ErrorBoundary>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  const { theme } = useTheme();
  
  return (
    <motion.div
      whileHover={{ 
        scale: 1.05,
        rotateY: 8,
        rotateX: 8,
        y: -10
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
      viewport={{ once: true }}
      className="p-4 rounded-xl feature-card glass-enhanced transform-gpu"
      style={{
        background: theme === 'dark' ? 'var(--glass-bg-dark)' : 'var(--glass-bg-light)',
        backdropFilter: 'var(--glass-blur)',
        border: theme === 'dark' ? '1px solid var(--glass-border-dark)' : '1px solid var(--glass-border-light)',
        boxShadow: theme === 'dark' ? 'var(--glass-shadow-dark)' : 'var(--glass-shadow-light)',
        transformStyle: 'preserve-3d'
      }}
    >
      <div 
        className="mb-3 p-2 rounded-lg inline-block backdrop-blur-sm"
        style={{
          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(147, 51, 234, 0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: theme === 'dark' ? '#ffffff' : '#7c3aed'
        }}
      >
        {icon}
      </div>
      <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
        {description}
      </p>
    </motion.div>
  );
};

const UsageCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  const { theme } = useTheme();
  
  return (
    <motion.div
      whileHover={{ 
        scale: 1.05,
        rotateY: 8,
        rotateX: 8,
        y: -10
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
      viewport={{ once: true }}
      className="p-4 rounded-xl feature-card glass-enhanced transform-gpu"
      style={{
        background: theme === 'dark' ? 'var(--glass-bg-dark)' : 'var(--glass-bg-light)',
        backdropFilter: 'var(--glass-blur)',
        border: theme === 'dark' ? '1px solid var(--glass-border-dark)' : '1px solid var(--glass-border-light)',
        boxShadow: theme === 'dark' ? 'var(--glass-shadow-dark)' : 'var(--glass-shadow-light)',
        transformStyle: 'preserve-3d'
      }}
    >
      <div 
        className="mb-3 p-2 rounded-lg inline-block backdrop-blur-sm"
        style={{
          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(147, 51, 234, 0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: theme === 'dark' ? '#ffffff' : '#7c3aed'
        }}
      >
        {icon}
      </div>
      <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
        {description}
      </p>
    </motion.div>
  );
};

export default Home; 