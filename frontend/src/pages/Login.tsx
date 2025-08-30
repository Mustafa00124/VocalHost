import { motion } from 'framer-motion';
import { FaGoogle } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import { useEffect, useState } from 'react';
import { LeftFloatingElements, RightFloatingElements } from '../components/FloatingElements';

// Voice Wave Animation Component
const VoiceWaveAnimation = () => {
  const { theme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(true);
  
  // Array of bar heights in their "resting" state
  const initialHeights = [30, 45, 60, 45, 30, 45, 60, 45, 30];
  
  // Generate random heights for the "speaking" state
  const getRandomHeights = () => {
    return initialHeights.map(() => Math.floor(Math.random() * 50) + 20);
  };
  
  const [heights, setHeights] = useState(initialHeights);
  
  useEffect(() => {
    if (!isAnimating) return;
    
    // Update heights every 150ms to create wave effect
    const interval = setInterval(() => {
      setHeights(getRandomHeights());
    }, 150);
    
    return () => clearInterval(interval);
  }, [isAnimating]);
  
  return (
    <motion.div 
      className="flex items-end justify-center space-x-1 h-20 mb-6 cursor-pointer"
      onClick={() => setIsAnimating(!isAnimating)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {heights.map((height, index) => (
        <motion.div
          key={index}
          className={`w-2 rounded-full ${theme === 'dark' ? 'bg-gradient-to-t from-primary-600 to-secondary-500' : 'bg-gradient-to-t from-primary-500 to-secondary-500'}`}
          initial={{ height: initialHeights[index % initialHeights.length] }}
          animate={{ height }}
          transition={{ type: "spring", stiffness: 300, damping: 10 }}
        />
      ))}
    </motion.div>
  );
};

const Login = () => {
  const { theme } = useTheme();
  
  const handleGoogleLogin = () => {
    // Define the frontend callback URL
    const frontendCallbackUrl = `${window.location.origin}/auth/callback`;
    
    // const frontendCallbackUrl = `https://ai-voice-assistant-frontend.vercel.app/auth/callback`;

    // Encode the callback URL to pass it safely to the backend
    const encodedCallbackUrl = encodeURIComponent(frontendCallbackUrl);
    
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/google/login?callback=${encodedCallbackUrl}`;
    // window.location.href = `https://vocalhost-app.fly.dev/api/auth/google/login?callback=${encodedCallbackUrl}`;

  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] relative">
      {/* Floating elements */}
      <LeftFloatingElements />
      <RightFloatingElements />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`p-8 backdrop-blur-sm border-2 rounded-xl w-full max-w-md shadow-xl ${
          theme === 'dark' 
            ? 'bg-gray-800/50 border-primary-500/30' 
            : 'bg-white/80 border-primary-200'
        }`}
      >
        <h2 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
          Welcome to VocalHost
        </h2>
        
        {/* Voice Wave Animation */}
        <VoiceWaveAnimation />
        
        <p className={`text-center mb-8 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Sign in to access your voice assistant dashboard
        </p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-lg bg-white text-gray-800 font-medium hover:bg-gray-100 transition-colors border border-gray-300"
        >
          <FaGoogle className="text-lg" />
          <span>Sign in with Google</span>
        </motion.button>
        
        <p className={`text-sm text-center mt-6 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
};

export default Login; 