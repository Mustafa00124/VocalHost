import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { CalendarIcon, BuildingOfficeIcon, ClockIcon, LightBulbIcon, ChatBubbleBottomCenterTextIcon, PhoneIcon, ArchiveBoxIcon, ArrowTrendingUpIcon, UserGroupIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import FloatingCallDock from '../components/FloatingCallDock';
import ErrorBoundary from '../components/ErrorBoundary';

// Video slider data
const videoData = [
  {
    id: 'restaurant',
    title: 'Restaurant Demo',
    description: 'See how VocalHost handles restaurant reservations, menu inquiries, and customer service for dining establishments.',
    video: '/demo.mp4',
    icon: '🍽️'
  },
  {
    id: 'travel',
    title: 'Travel Agency Demo',
    description: 'Watch how our AI assistant manages travel bookings, itinerary planning, and customer support for travel agencies.',
    video: '/demo.mp4',
    icon: '✈️'
  },
  {
    id: 'vehicle',
    title: 'Vehicle Company Demo',
    description: 'Discover how VocalHost streamlines vehicle sales, service appointments, and customer inquiries for automotive businesses.',
    video: '/demo.mp4',
    icon: '🚗'
  }
];

const Home = () => {
  console.log("🏠 Home component rendering...");
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  console.log("🏠 Home theme:", theme, "user:", user, "loading:", loading);

  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % videoData.length);
  };

  const prevVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + videoData.length) % videoData.length);
  };
  
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="min-h-[80vh] flex items-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8 min-h-[80vh]">
            {/* Left Column - Neumorphic Background with Text */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex-1 flex items-center justify-center p-8 lg:p-12 rounded-2xl transition-all duration-300 hover:shadow-lg"
              style={{
                background: '#e6e7ee',
                boxShadow: '6px 6px 12px #b8b9be, -6px -6px 12px #ffffff',
                border: '1px solid rgba(147, 51, 234, 0.3)'
              }}
              whileHover={{
                boxShadow: '8px 8px 16px #b8b9be, -8px -8px 16px #ffffff'
              }}
            >
              <div className="max-w-lg space-y-8">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
                >
                  Unlock the Power of AI for Your Business
                </motion.h1>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="w-20 h-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                />
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className={`text-lg md:text-xl leading-relaxed ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  Discover cutting-edge tools that transform your workflow, boost productivity, and drive innovation. From content creation to data analysis, we've got you covered.
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="pt-4"
                >
                  {!loading && !user ? (
                    <Link
                      to="/login"
                      className="inline-block px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
                      style={{ 
                        color: '#44476A',
                        background: '#e6e7ee',
                        boxShadow: 'inset 2px 2px 5px #b8b9be, inset -3px -3px 7px #ffffff',
                        border: '1px solid rgba(147, 51, 234, 0.3)'
                      }}
                    >
                      Create Assistant
                    </Link>
                  ) : (
                    <Link
                      to="/create"
                      className="inline-block px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
                      style={{ 
                        color: '#44476A',
                        background: '#e6e7ee',
                        boxShadow: 'inset 2px 2px 5px #b8b9be, inset -3px -3px 7px #ffffff',
                        border: '1px solid rgba(147, 51, 234, 0.3)'
                      }}
                    >
                      Create Assistant
                    </Link>
                  )}
                </motion.div>
              </div>
            </motion.div>
            
            {/* Right Column - Image with Neumorphic Protruded Frame */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{
                boxShadow: '12px 12px 24px #b8b9be, -12px -12px 24px #ffffff',
                scale: 1.02
              }}
              className="flex-1 relative min-h-[80vh] overflow-hidden rounded-2xl transition-all duration-300"
              style={{
                background: '#e6e7ee',
                boxShadow: '8px 8px 16px #b8b9be, -8px -8px 16px #ffffff',
                border: '1px solid rgba(147, 51, 234, 0.3)'
              }}
            >
              {/* Background Image with Inner Neumorphic Effect */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat rounded-2xl"
                style={{
                  backgroundImage: 'url(/hero2.jpg)',
                  boxShadow: 'inset 2px 2px 4px rgba(0, 0, 0, 0.1), inset -2px -2px 4px rgba(147, 51, 234, 0.3)',
                  margin: '4px',
                  border: '1px solid rgba(147, 51, 234, 0.2)'
                }}
              />
              
              {/* Glass Morphism Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl max-w-md mx-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-center space-y-4"
                  >
                    <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight drop-shadow-lg" style={{ color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                      Vocal Host
                    </h2>
                    <p className="text-lg md:text-xl text-white leading-relaxed drop-shadow-lg" style={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                    Your AI assistant for customer experience <br />
                    Never Miss a Customer Again <br />
                    Smarter Conversations, Stronger Growth <br />
                    More Than Messages, it’s Customer Intelligence.
     
                    </p>
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-full"></div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-12">
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-primary-600 inline-block mb-4"
          >
            Features
          </motion.h2>
          <p className={`max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Our AI Voice Assistant comes with powerful features designed to help your business thrive
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<CalendarIcon className="w-8 h-8" />}
            title="Smart Scheduling"
            description="Handle appointments and bookings with customizable time slots"
          />
          <FeatureCard
            icon={<BuildingOfficeIcon className="w-8 h-8" />}
            title="Business Integration"
            description="Tailored to your business type with custom descriptions and hours"
          />
          <FeatureCard
            icon={<ClockIcon className="w-8 h-8" />}
            title="Time Management"
            description="Set your business hours and preferred appointment durations"
          />
          <FeatureCard
            icon={<UserGroupIcon className="w-8 h-8" />}
            title="Customer Management"
            description="Track and manage your customer information and history"
          />
          <FeatureCard
            icon={<ChatBubbleBottomCenterTextIcon className="w-8 h-8" />}
            title="Natural Conversations"
            description="AI-powered natural language understanding for human-like interactions"
          />
          <FeatureCard
            icon={<ArrowTrendingUpIcon className="w-8 h-8" />}
            title="Analytics & Insights"
            description="Track performance and gain insights to improve your business"
          />
        </div>
      </section>
      
      {/* Demo Section - Video Slider */}
      <section id="demo-section" className="py-12">
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-primary-600 inline-block mb-4"
          >
            See It In Action
          </motion.h2>
          <p className={`max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Watch how our AI Voice Assistant seamlessly handles customer interactions across different industries
          </p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          {/* 3D Carousel Container */}
          <div className="relative h-96 overflow-hidden">
            {/* Carousel Track */}
            <div 
              className="flex items-center justify-center h-full"
              style={{ perspective: '1000px' }}
            >
              {/* Video Items */}
              {videoData.map((video, index) => {
                const offset = index - currentVideoIndex;
                const isActive = offset === 0;
                const isLeft = offset < 0;
                const isRight = offset > 0;
                
                let transform = '';
                let scale = 0.6;
                let opacity = 0.4;
                let zIndex = 1;
                
                if (isActive) {
                  transform = 'translateX(0) translateZ(0)';
                  scale = 1;
                  opacity = 1;
                  zIndex = 10;
                } else if (isLeft) {
                  transform = `translateX(${-200 + offset * 100}px) translateZ(-100px) rotateY(15deg)`;
                } else if (isRight) {
                  transform = `translateX(${200 + offset * 100}px) translateZ(-100px) rotateY(-15deg)`;
                }
                
                return (
                  <motion.div
                    key={video.id}
                    className="absolute"
                    style={{
                      transform,
                      scale,
                      opacity,
                      zIndex,
                      transformStyle: 'preserve-3d'
                    }}
                    animate={{
                      transform,
                      scale,
                      opacity
                    }}
                    transition={{
                      duration: 0.6,
                      ease: "easeInOut"
                    }}
                  >
                    {/* Video Frame */}
                    <div 
                      className="relative rounded-xl overflow-hidden"
                      style={{
                        width: '280px',
                        height: '360px',
                        background: '#e6e7ee',
                        boxShadow: isActive 
                          ? '12px 12px 24px #b8b9be, -12px -12px 24px #ffffff'
                          : '6px 6px 12px #b8b9be, -6px -6px 12px #ffffff',
                        border: '1px solid rgba(147, 51, 234, 0.3)'
                      }}
                    >
                      <video
                        className="w-full h-full object-cover"
                        controls={isActive}
                        preload="metadata"
                        style={{ 
                          aspectRatio: '9/16',
                          objectFit: 'cover'
                        }}
                      >
                        <source src={video.video} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      
                      {/* Video Overlay for non-active videos */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="text-center text-white">
                            <span className="text-4xl mb-2 block">{video.icon}</span>
                            <span className="text-sm font-medium">{video.title}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Navigation Arrows */}
            <motion.button
              onClick={prevVideo}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-4 rounded-full"
              style={{
                background: '#e6e7ee',
                boxShadow: 'inset 2px 2px 4px #b8b9be, inset -2px -2px 4px #ffffff',
                border: '1px solid rgba(147, 51, 234, 0.3)',
                color: '#44476A'
              }}
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </motion.button>

            <motion.button
              onClick={nextVideo}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-4 rounded-full"
              style={{
                background: '#e6e7ee',
                boxShadow: 'inset 2px 2px 4px #b8b9be, inset -2px -2px 4px #ffffff',
                border: '1px solid rgba(147, 51, 234, 0.3)',
                color: '#44476A'
              }}
            >
              <ChevronRightIcon className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Video Info */}
          <motion.div
            key={currentVideoIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center mt-8"
          >
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl mr-2">{videoData[currentVideoIndex].icon}</span>
              <h3 className="text-xl font-semibold" style={{ color: '#44476A' }}>
                {videoData[currentVideoIndex].title}
              </h3>
            </div>
            <p className={`text-sm max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {videoData[currentVideoIndex].description}
            </p>
            
            {/* Video Indicators */}
            <div className="flex justify-center mt-4 space-x-2">
              {videoData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentVideoIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentVideoIndex 
                      ? 'bg-purple-500' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>
      
      {/* Usage Section */}
      <section id="usage-section" className="py-12">
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-primary-600 inline-block mb-4"
          >
            How It Works
          </motion.h2>
          <p className={`max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            See how businesses are using VocalHost to streamline their operations
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <UsageCard
            icon={<PhoneIcon className="w-8 h-8" />}
            title="Medical Practices"
            description="Doctors use VocalHost to handle appointment scheduling, medication refill requests, and basic patient inquiries."
          />
          <UsageCard
            icon={<ArchiveBoxIcon className="w-8 h-8" />}
            title="Law Firms"
            description="Attorneys use VocalHost to schedule consultations, handle client intake, and provide basic legal information."
          />
          <UsageCard
            icon={<LightBulbIcon className="w-8 h-8" />}
            title="Service Businesses"
            description="Salons, cleaning services, and consultants use VocalHost to manage their appointments and client relationships."
          />
        </div>
      </section>
      
      {/* Floating Call Dock - WITH ERROR BOUNDARY */}
      <ErrorBoundary fallback={
        <div style={{position: 'fixed', bottom: '20px', right: '20px', background: 'red', color: 'white', padding: '10px', borderRadius: '5px', maxWidth: '300px'}}>
          <h4>🚨 Demo Widget Error</h4>
          <p>Check console for details</p>
        </div>
      }>
        <FloatingCallDock />
      </ErrorBoundary>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  
  return (
    <motion.div
      whileHover={{ 
        scale: 1.02,
        boxShadow: '8px 8px 16px #b8b9be, -8px -8px 16px #ffffff'
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="p-6 rounded-xl transition-all duration-300"
      style={{
        background: '#e6e7ee',
        boxShadow: '6px 6px 12px #b8b9be, -6px -6px 12px #ffffff',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      <div 
        className="mb-4 p-3 rounded-xl inline-block"
        style={{
          background: '#e6e7ee',
          boxShadow: 'inset 2px 2px 5px #b8b9be, inset -3px -3px 7px #ffffff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#2D4CC8'
        }}
      >
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3" style={{ color: '#44476A' }}>{title}</h3>
      <p style={{ color: '#66799e' }}>{description}</p>
    </motion.div>
  );
};

const UsageCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  
  return (
    <motion.div
      whileHover={{ 
        scale: 1.02,
        boxShadow: '8px 8px 16px #b8b9be, -8px -8px 16px #ffffff'
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="p-6 rounded-xl transition-all duration-300"
      style={{
        background: '#e6e7ee',
        boxShadow: '6px 6px 12px #b8b9be, -6px -6px 12px #ffffff',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      <div 
        className="mb-4 p-3 rounded-xl inline-block"
        style={{
          background: '#e6e7ee',
          boxShadow: 'inset 2px 2px 5px #b8b9be, inset -3px -3px 7px #ffffff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#18634B'
        }}
      >
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3" style={{ color: '#44476A' }}>{title}</h3>
      <p style={{ color: '#66799e' }}>{description}</p>
    </motion.div>
  );
};

export default Home; 