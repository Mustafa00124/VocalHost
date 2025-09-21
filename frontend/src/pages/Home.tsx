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
    <div 
      className="w-full relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center top, rgba(168, 85, 247, 0.95) 0%, rgba(139, 92, 246, 0.85) 20%, rgba(124, 58, 237, 0.7) 40%, rgba(59, 130, 246, 0.6) 60%, rgba(37, 99, 235, 0.5) 80%, rgba(255, 255, 255, 0) 100%)',
        minHeight: '100vh',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Additional subtle gradient overlay - covers entire page */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(147, 51, 234, 0.5) 0%, rgba(99, 102, 241, 0.4) 30%, rgba(59, 130, 246, 0.3) 60%, rgba(37, 99, 235, 0.2) 80%, transparent 100%)'
        }}
      ></div>
      
      {/* Starry Universe Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Generate 1500 stars evenly distributed */}
        {Array.from({ length: 1500 }, (_, i) => {
          // Create a more even distribution using grid-like positioning with randomness
          const gridSize = Math.ceil(Math.sqrt(1500));
          const row = Math.floor(i / gridSize);
          const col = i % gridSize;
          
          // Base position on grid
          const baseTop = (row / (gridSize - 1)) * 100;
          const baseLeft = (col / (gridSize - 1)) * 100;
          
          // Add random offset for more natural distribution
          const randomOffset = 4; // 4% random offset for tighter distribution
          const top = Math.max(0, Math.min(100, baseTop + (Math.random() - 0.5) * randomOffset));
          const left = Math.max(0, Math.min(100, baseLeft + (Math.random() - 0.5) * randomOffset));
          
          const delay = Math.random() * 16; // Extended delay range (doubled)
          const duration = 8 + Math.random() * 12; // Much slower, more varied duration (8-20 seconds)
          const size = Math.random() > 0.85 ? 3 : Math.random() > 0.6 ? 2 : 1; // More small stars
          
          return (
            <div
              key={i}
              className="star"
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
        
        {/* Moving shooting stars */}
        <div className="absolute w-1 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-60 animate-pulse" style={{
          top: '18%', 
          left: '0%', 
          animation: 'shooting-star-1 8s linear infinite',
          animationDelay: '0s'
        }}></div>
        <div className="absolute w-1 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-pulse" style={{
          top: '38%', 
          left: '0%', 
          animation: 'shooting-star-2 12s linear infinite',
          animationDelay: '3s'
        }}></div>
        <div className="absolute w-1 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 animate-pulse" style={{
          top: '58%', 
          left: '0%', 
          animation: 'shooting-star-3 10s linear infinite',
          animationDelay: '6s'
        }}></div>
      </div>
      
      <div className="relative z-10 space-y-12">
        {/* Hero Section */}
        <section className="min-h-[80vh] flex items-center relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-center min-h-[80vh]">
            {/* Centered Content with Glass Morphism */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl text-center space-y-8 p-12 rounded-3xl backdrop-blur-lg bg-white/15 border border-white/25 shadow-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(25px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
              }}
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-2xl text-white"
              >
                Unlock the Power of AI for Your Business
              </motion.h1>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="w-24 h-1 rounded-full mx-auto bg-white"
              />
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto drop-shadow-lg text-white font-semibold"
              >
                Discover cutting-edge tools that transform your workflow, boost productivity, and drive innovation. From content creation to data analysis, we've got you covered.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex justify-center"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative"
                >
                  {!loading && !user ? (
                    <Link
                      to="/login"
                      className="relative px-12 py-6 text-white font-bold text-xl rounded-2xl transition-all duration-300 inline-block"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(15px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: 'inset 4px 4px 8px rgba(0, 0, 0, 0.2), inset -4px -4px 8px rgba(255, 255, 255, 0.1), 0 4px 16px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      Create Assistant
                    </Link>
                  ) : (
                    <Link
                      to="/create"
                      className="relative px-12 py-6 text-white font-bold text-xl rounded-2xl transition-all duration-300 inline-block"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(15px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: 'inset 4px 4px 8px rgba(0, 0, 0, 0.2), inset -4px -4px 8px rgba(255, 255, 255, 0.1), 0 4px 16px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      Create Assistant
                    </Link>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        </section>

      {/* Features Section */}
      <section id="features-section" className="relative mt-16 mb-16">
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white inline-block mb-4 drop-shadow-lg"
          >
            Features
          </motion.h2>
          <p className="max-w-2xl mx-auto text-white font-semibold">
            Our AI Voice Assistant comes with powerful features designed to help your business thrive
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<CalendarIcon className="w-8 h-8 text-white" />}
            title="Smart Scheduling"
            description="Handle appointments and bookings with customizable time slots"
          />
          <FeatureCard
            icon={<BuildingOfficeIcon className="w-8 h-8 text-white" />}
            title="Business Integration"
            description="Tailored to your business type with custom descriptions and hours"
          />
          <FeatureCard
            icon={<ClockIcon className="w-8 h-8 text-white" />}
            title="Time Management"
            description="Set your business hours and preferred appointment durations"
          />
          <FeatureCard
            icon={<UserGroupIcon className="w-8 h-8 text-white" />}
            title="Customer Management"
            description="Track and manage your customer information and history"
          />
          <FeatureCard
            icon={<ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-white" />}
            title="Natural Conversations"
            description="AI-powered natural language understanding for human-like interactions"
          />
          <FeatureCard
            icon={<ArrowTrendingUpIcon className="w-8 h-8 text-white" />}
            title="Analytics & Insights"
            description="Track performance and gain insights to improve your business"
          />
        </div>
      </section>
      
      {/* Demo Section - Video Slider */}
      <section id="demo-section" className="relative mt-16 mb-16">
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white inline-block mb-4 drop-shadow-lg"
          >
            See It In Action
          </motion.h2>
          <p className="max-w-2xl mx-auto text-white font-semibold">
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
              <h3 className="text-xl font-bold text-white">
                {videoData[currentVideoIndex].title}
              </h3>
            </div>
            <p className="text-sm max-w-2xl mx-auto text-white font-semibold">
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
      <section id="usage-section" className="relative mt-16 mb-16">
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white inline-block mb-4 drop-shadow-lg"
          >
            How It Works
          </motion.h2>
          <p className="max-w-2xl mx-auto text-white font-semibold">
            See how businesses are using VocalHost to streamline their operations
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <UsageCard
            icon={<PhoneIcon className="w-8 h-8 text-white" />}
            title="Medical Practices"
            description="Doctors use VocalHost to handle appointment scheduling, medication refill requests, and basic patient inquiries."
          />
          <UsageCard
            icon={<ArchiveBoxIcon className="w-8 h-8 text-white" />}
            title="Law Firms"
            description="Attorneys use VocalHost to schedule consultations, handle client intake, and provide basic legal information."
          />
          <UsageCard
            icon={<LightBulbIcon className="w-8 h-8 text-white" />}
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
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  
  return (
    <motion.div
      whileHover={{ 
        scale: 1.02,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="p-6 rounded-2xl transition-all duration-300 backdrop-blur-lg"
      style={{
        background: 'rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div 
        className="mb-4 p-3 rounded-xl inline-block backdrop-blur-sm"
        style={{
          background: 'rgba(255, 255, 255, 0.18)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: '#ffffff'
        }}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-white font-semibold">{description}</p>
    </motion.div>
  );
};

const UsageCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  
  return (
    <motion.div
      whileHover={{ 
        scale: 1.02,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="p-6 rounded-2xl transition-all duration-300 backdrop-blur-lg"
      style={{
        background: 'rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div 
        className="mb-4 p-3 rounded-xl inline-block backdrop-blur-sm"
        style={{
          background: 'rgba(255, 255, 255, 0.18)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: '#ffffff'
        }}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-white font-semibold">{description}</p>
    </motion.div>
  );
};

export default Home; 