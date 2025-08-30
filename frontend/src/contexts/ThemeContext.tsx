import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

type ThemeType = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Local storage key for theme preference
const THEME_STORAGE_KEY = 'schedule_ai_theme';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from localStorage or system preference, defaulting to dark
  const [theme, setTheme] = useState<ThemeType>(() => {
    // Check local storage first
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeType | null;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    // Then check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    
    // Default to light mode
    return 'light';
  });

  // Apply theme class to document immediately on first render
  useEffect(() => {
    // Initial theme setup
    applyTheme(theme);
  }, []);

  // Function to apply theme changes
  const applyTheme = useCallback((newTheme: ThemeType) => {
    // Apply theme class to document root
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, []);

  // Function to toggle theme (optimized to update DOM immediately)
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
      // Apply theme change immediately
      applyTheme(newTheme);
      return newTheme;
    });
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 