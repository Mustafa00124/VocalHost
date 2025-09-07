import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateAssistant from './pages/CreateAssistant';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Schedule from './pages/Schedule';
import SubscriptionPlans from './pages/SubscriptionPlans';
import Dashboard from './pages/Dashboard';
import VoiceTest from './pages/VoiceTest';

import ProtectedRoute from './components/ProtectedRoute';
import { useTheme } from './contexts/ThemeContext';
import { useEffect } from 'react';

function App() {
  const { theme } = useTheme();
  
  // Ensure the viewport meta tag is set correctly for mobile responsiveness
  useEffect(() => {
    // Check if viewport meta tag exists
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    
    // If it doesn't exist, create it
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    
    // Set the viewport content to ensure proper mobile scaling
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }, []);
  
  return (
    <Router>
      <div className={`min-h-screen ${theme === 'dark' 
        ? 'text-white' 
        : 'text-gray-800'}`}>
        <Navbar />
        <main className="container mx-auto px-4 py-4 sm:py-8 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/voice-test" element={<VoiceTest />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />

              <Route path="/create" element={
                <ProtectedRoute>
                  <CreateAssistant />
                </ProtectedRoute>
              } />
              <Route path="/schedule" element={
                <ProtectedRoute>
                  <Schedule />
                </ProtectedRoute>
              } />
              <Route path="/plans" element={<SubscriptionPlans />} />
            </Routes>
          </motion.div>
        </main>
      </div>
    </Router>
  );
}

export default App;
