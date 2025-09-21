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
import ManageAssistants from './pages/ManageAssistants';
import EditAssistant from './pages/EditAssistant';

import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { useTheme } from './contexts/ThemeContext';
import { useEffect } from 'react';

function App() {
  console.log("🚀 App component rendering...");
  const { theme } = useTheme();
  console.log("🎨 Theme:", theme);
  
  // Ensure the viewport meta tag is set correctly for mobile responsiveness
  useEffect(() => {
    console.log("📱 Setting up viewport meta tag...");
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
        <Routes>
          <Route path="/" element={
            <ErrorBoundary fallback={<div style={{padding: '20px', color: 'red'}}>Home page failed to load</div>}>
              <Home />
            </ErrorBoundary>
          } />
          <Route path="/login" element={
            <main className="container mx-auto px-4 py-4 sm:py-8 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Login />
              </motion.div>
            </main>
          } />
          <Route path="/auth/callback" element={
            <main className="container mx-auto px-4 py-4 sm:py-8 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <AuthCallback />
              </motion.div>
            </main>
          } />
          <Route path="/voice-test" element={
            <main className="container mx-auto px-4 py-4 sm:py-8 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <VoiceTest />
              </motion.div>
            </main>
          } />
          <Route path="/dashboard" element={
            <main className="container mx-auto px-4 py-4 sm:py-8 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </motion.div>
            </main>
          } />
          <Route path="/create" element={
            <main className="container mx-auto px-4 py-4 sm:py-8 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <ProtectedRoute>
                  <CreateAssistant />
                </ProtectedRoute>
              </motion.div>
            </main>
          } />
          <Route path="/manage-assistants" element={
            <main className="container mx-auto px-4 py-4 sm:py-8 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <ProtectedRoute>
                  <ManageAssistants />
                </ProtectedRoute>
              </motion.div>
            </main>
          } />
          <Route path="/manage-assistants/edit/:id" element={
            <main className="container mx-auto px-4 py-4 sm:py-8 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <ProtectedRoute>
                  <EditAssistant />
                </ProtectedRoute>
              </motion.div>
            </main>
          } />
          <Route path="/schedule" element={
            <main className="container mx-auto px-4 py-4 sm:py-8 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <ProtectedRoute>
                  <Schedule />
                </ProtectedRoute>
              </motion.div>
            </main>
          } />
          <Route path="/plans" element={
            <main className="container mx-auto px-4 py-4 sm:py-8 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <SubscriptionPlans />
              </motion.div>
            </main>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
