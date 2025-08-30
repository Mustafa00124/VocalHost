import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  stripe_customer_id?: string;
  expiresAt?: number; // Add expiration timestamp
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';


// Storage key for user info
const AUTH_STORAGE_KEY = 'schedule_ai_user';
// Set token expiration time to 30 minutes (in milliseconds)
const TOKEN_EXPIRATION_TIME = 30 * 60 * 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial state from localStorage and check expiration
  useEffect(() => {
    const checkAndLoadUser = () => {
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          
          // Check if the token has expired
          if (parsedUser.expiresAt && parsedUser.expiresAt < Date.now()) {
            // Token expired, log out user
            console.log('Token expired, logging out');
            localStorage.removeItem(AUTH_STORAGE_KEY);
            setUser(null);
          } else {
            setUser(parsedUser);
          }
        } catch (e) {
          console.error('Failed to parse saved user', e);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
      setLoading(false);
    };

    checkAndLoadUser();

    // Set up a timer to check token expiration periodically
    const expirationTimer = setInterval(checkAndLoadUser, 60000); // Check every minute

    return () => clearInterval(expirationTimer);
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      
      // First check localStorage for existing auth
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        
        // Check if token has expired
        if (parsedUser.expiresAt && parsedUser.expiresAt < Date.now()) {
          // Token expired, log out user
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setUser(null);
        } else {
          setUser(parsedUser);
        }
      } else {
        // Check if we're in the callback with a successful login
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('login') === 'success') {
          // In a real implementation with full OAuth flow, this would 
          // have the actual Google user info from the backend
          
          // Calculate expiration time
          const expiresAt = Date.now() + TOKEN_EXPIRATION_TIME;
          
          // Fetch user data from the backend
          try {
            const response = await fetch(`${BASE_URL}/api/auth/user/me`, {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            if (response.ok) {
              const userData = await response.json();
              
              const userObject = {
                id: userData.user.id,
                name: userData.user.name, // Real name from Google OAuth
                email: userData.user.email,
                stripe_customer_id: userData.user.stripe_customer_id,
                expiresAt: expiresAt
              };
              
              setUser(userObject);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userObject));
            } else {
              // If backend request fails, fall back to basic user info
              const userObject = {
                id: Math.floor(Math.random() * 1000),
                name: "User", // Generic fallback name
                email: "user@example.com",
                expiresAt: expiresAt
              };
              
              setUser(userObject);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userObject));
            }
          } catch (error) {
            console.error('Failed to fetch user data:', error);
            // Fallback if fetch fails
            const userObject = {
              id: Math.floor(Math.random() * 1000),
              name: "User", // Generic fallback name
              email: "user@example.com",
              expiresAt: expiresAt
            };
            
            setUser(userObject);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userObject));
          }
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint
      await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Failed to logout from backend:', error);
    } finally {
      // Always clear local storage and state
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 