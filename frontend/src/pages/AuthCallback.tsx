import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuthStatus } = useAuth();
  const { theme } = useTheme();

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';


  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if login was successful based on URL params
        const params = new URLSearchParams(location.search);
        const loginStatus = params.get('login');
        
        if (loginStatus === 'success') {
          // Refresh the auth state
          const response = await fetch(`${BASE_URL}/api/auth/user/me`, {
            credentials: 'include',  // This is crucial for including cookies
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            await checkAuthStatus();
            
            // Redirect to create assistant page after successful login
            navigate('/create');
          } else {
            console.error('Login was not successful');
            navigate('/login');
          }
        } else {
          console.error('Login was not successful');
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [checkAuthStatus, navigate, location]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className={`animate-pulse text-2xl mb-4 ${
        theme === 'dark' ? 'text-primary-400' : 'text-primary-600'
      }`}>
        Completing login...
      </div>
      <div className={`w-16 h-16 border-t-4 border-solid rounded-full animate-spin ${
        theme === 'dark' ? 'border-primary-500' : 'border-primary-600'
      }`}></div>
    </div>
  );
};

export default AuthCallback; 