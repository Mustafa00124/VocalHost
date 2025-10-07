import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarIcon, UserCircleIcon, PlusCircleIcon, ClockIcon, LightBulbIcon, PuzzlePieceIcon, HomeIcon, Bars3Icon, XMarkIcon, BuildingOfficeIcon, ChevronDownIcon, CreditCardIcon, ArrowRightOnRectangleIcon, PencilIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect, useRef } from 'react';


// Scroll helper function - moved inside component to access navigate

const Navbar = () => {
  const { user, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scroll helper function
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If section doesn't exist on current page, navigate to home first
      navigate('/');
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const homeSection = document.getElementById(sectionId);
        if (homeSection) {
          homeSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const closeUserDropdown = () => {
    setIsUserDropdownOpen(false);
  };

  // Handle Google login directly from navbar
  const handleGoogleLogin = () => {
    const frontendCallbackUrl = `${window.location.origin}/auth/callback`;
    const encodedCallbackUrl = encodeURIComponent(frontendCallbackUrl);
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/google/login?callback=${encodedCallbackUrl}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav 
      className="backdrop-blur-lg border-b sticky top-0 z-50"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        borderBottom: '1px solid var(--glass-border)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* Hidden elements to preload theme styles - reduces flicker on toggle */}
      <div className="hidden bg-gray-800/90 border-gray-700"></div>
      <div className="hidden text-yellow-400 text-gray-600 text-primary-400 text-primary-600"></div>
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center"
          >
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="VocalHost Logo" className="h-14 w-auto" />
            </Link>
          </motion.div>
          
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button 
              onClick={toggleMenu}
              className="p-2 rounded-md focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <XMarkIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`} />
              ) : (
                <Bars3Icon className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`} />
              )}
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4 ml-auto">
            {!loading && !user && (
              <NavLink to="/" label="Home" onClick={closeMenu} />
            )}
            
            {!loading && !user && !isLoginPage && (
              <>
                <NavButton 
                  onClick={() => {
                    scrollToSection('features-section');
                    closeMenu();
                  }} 
                  label="Features" 
                  icon={<PuzzlePieceIcon className="w-3.5 h-3.5" />}
                />
                <NavButton 
                  onClick={() => {
                    scrollToSection('usage-section');
                    closeMenu();
                  }} 
                  label="Usage" 
                  icon={<LightBulbIcon className="w-3.5 h-3.5" />}
                />
                <NavLink 
                  to="/plans" 
                  label="Pricing" 
                  className="flex items-center space-x-1"
                  icon={<BuildingOfficeIcon className="w-3.5 h-3.5" />}
                  onClick={closeMenu}
                />
              </>
            )}
            
            {!loading && user && (
              <>
                <NavLink 
                  to="/dashboard" 
                  label="Dashboard" 
                  className={`flex items-center space-x-1 ${theme === 'dark' ? 'text-gray-300 hover:text-primary-400' : 'text-gray-700 hover:text-primary-600'}`}
                  icon={<HomeIcon className="w-3.5 h-3.5" />}
                  onClick={closeMenu}
                />
                <NavLink 
                  to="/create" 
                  label="Create Assistant" 
                  className={`flex items-center space-x-1 ${theme === 'dark' ? 'text-gray-300 hover:text-primary-400' : 'text-gray-700 hover:text-primary-600'}`}
                  icon={<PlusCircleIcon className="w-3.5 h-3.5" />}
                  onClick={closeMenu}
                />
                <NavLink 
                  to="/manage" 
                  label="Manage Assistants" 
                  className={`flex items-center space-x-1 ${theme === 'dark' ? 'text-gray-300 hover:text-primary-400' : 'text-gray-700 hover:text-primary-600'}`}
                  icon={<PencilIcon className="w-3.5 h-3.5" />}
                  onClick={closeMenu}
                />
                <NavLink 
                  to="/schedule" 
                  label="Schedule" 
                  className={`flex items-center space-x-1 ${theme === 'dark' ? 'text-gray-300 hover:text-primary-400' : 'text-gray-700 hover:text-primary-600'}`}
                  icon={<CalendarIcon className="w-3.5 h-3.5" />}
                  onClick={closeMenu}
                />
              </>
            )}
            
            {/* Theme Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg neuro-button"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </motion.button>
            
            {!loading && (
              user ? (
                <div ref={dropdownRef} className="relative ml-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleUserDropdown}
                    className={`flex items-center space-x-2 px-3 py-1.5 transition-colors duration-200 rounded-lg ${
                      theme === 'dark' 
                        ? 'text-gray-200 hover:text-white hover:bg-gray-700/50'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    <span className="text-sm">{user.name || 'User'}</span>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  {/* User Dropdown */}
                  {isUserDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`absolute right-0 mt-2 w-56 ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      } border rounded-lg shadow-lg py-2 z-50`}
                    >
                      <div className={`px-4 py-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                          {user.name || 'User'}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {user.email}
                        </p>
                      </div>



                      {user.stripe_customer_id && (
                        <button
                          onClick={async () => {
                            try {
                              closeUserDropdown();
                              const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
                              const response = await fetch(`${API_BASE_URL}/stripe/create-customer-portal-session`, {
                                method: 'POST',
                                credentials: 'include',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                              });
                              if (response.ok) {
                                const data = await response.json();
                                window.open(data.url, '_blank');
                              }
                            } catch (error) {
                              console.error('Error accessing customer portal:', error);
                            }
                          }}
                          className={`flex items-center space-x-2 w-full px-4 py-2 text-sm transition-colors ${
                            theme === 'dark'
                              ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <CreditCardIcon className="w-4 h-4" />
                          <span>Manage Subscription</span>
                        </button>
                      )}

                      <Link
                        to="/plans"
                        onClick={closeUserDropdown}
                        className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                          theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <BuildingOfficeIcon className="w-4 h-4" />
                        <span>Pricing Plans</span>
                      </Link>

                      <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} mt-2 pt-2`}>
                        <button
                          onClick={() => {
                            logout();
                            closeUserDropdown();
                          }}
                          className={`flex items-center space-x-2 w-full px-4 py-2 text-sm transition-colors ${
                            theme === 'dark'
                              ? 'text-red-400 hover:text-red-300 hover:bg-gray-700'
                              : 'text-red-600 hover:text-red-700 hover:bg-gray-50'
                          }`}
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : !isLoginPage && (
                 <Link to="/login">
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     className="ml-2 flex items-center gap-2 px-6 py-2 font-medium rounded-lg text-white shadow-lg"
                     style={{
                       background: 'linear-gradient(135deg, #8fa4f3 0%, #9d7bb8 100%)',
                       boxShadow: '0 4px 16px rgba(143, 164, 243, 0.4)'
                     }}
                   >
                     <span className="text-sm">Get Started</span>
                   </motion.button>
                 </Link>
              )
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu (Overlay) */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={`lg:hidden ${theme === 'dark' ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-md`}
        >
          <div className="px-4 pt-2 pb-6 space-y-3">
            {!loading && !user && (
              <MobileNavLink to="/" label="Home" onClick={closeMenu} />
            )}
            
            {!loading && !user && !isLoginPage && (
              <>
                <MobileNavButton 
                  onClick={() => {
                    scrollToSection('features-section');
                    closeMenu();
                  }} 
                  label="Features" 
                  icon={<PuzzlePieceIcon className="w-3.5 h-3.5" />}
                />
                <MobileNavButton 
                  onClick={() => {
                    scrollToSection('usage-section');
                    closeMenu();
                  }} 
                  label="Usage" 
                  icon={<LightBulbIcon className="w-3.5 h-3.5" />}
                />
                <MobileNavLink 
                  to="/plans" 
                  label="Pricing" 
                  className="flex items-center space-x-2"
                  icon={<BuildingOfficeIcon className="w-4 h-4" />}
                  onClick={closeMenu}
                />
              </>
            )}
            
            {!loading && user && (
              <>
                <MobileNavLink 
                  to="/" 
                  label="Home" 
                  className={`flex items-center space-x-2 ${theme === 'dark' ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'}`}
                  icon={<HomeIcon className="w-4 h-4" />}
                  onClick={closeMenu}
                />
                <MobileNavLink 
                  to="/dashboard" 
                  label="Dashboard" 
                  className={`flex items-center space-x-2 ${theme === 'dark' ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'}`}
                  icon={<BuildingOfficeIcon className="w-4 h-4" />}
                  onClick={closeMenu}
                />
                <MobileNavLink 
                  to="/create" 
                  label="Create Assistant" 
                  className={`flex items-center space-x-2 ${theme === 'dark' ? 'text-gray-300 hover:text-primary-400' : 'text-gray-700 hover:text-primary-600'}`}
                  icon={<PlusCircleIcon className="w-4 h-4" />}
                  onClick={closeMenu}
                />
                <MobileNavLink 
                  to="/manage" 
                  label="Manage Assistants" 
                  className={`flex items-center space-x-2 ${theme === 'dark' ? 'text-gray-300 hover:text-primary-400' : 'text-gray-700 hover:text-primary-600'}`}
                  icon={<PencilIcon className="w-4 h-4" />}
                  onClick={closeMenu}
                />
                <MobileNavLink 
                  to="/schedule" 
                  label="Schedule" 
                  className={`flex items-center space-x-2 ${theme === 'dark' ? 'text-gray-300 hover:text-primary-400' : 'text-gray-700 hover:text-primary-600'}`}
                  icon={<CalendarIcon className="w-4 h-4" />}
                  onClick={closeMenu}
                />
              </>
            )}
            
            {/* Theme Toggle Button for Mobile */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleTheme}
              className="w-full px-4 py-3 rounded-lg flex items-center space-x-2 neuro-button"
            >
              {theme === 'dark' ? (
                <>
                  <SunIcon className="w-4 h-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <MoonIcon className="w-4 h-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </motion.button>
            
            {!loading && user && (
              <div className={`pt-2 border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
                <div className={`flex items-center space-x-2 mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  <UserCircleIcon className="w-4 h-4" />
                  <span>{user.name || 'User'}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className={`w-full py-2 text-center transition-colors duration-200 rounded-lg ${
                    theme === 'dark' 
                      ? 'text-gray-200 hover:text-white bg-gray-700/50 hover:bg-gray-600/50'
                      : 'text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Sign Out
                </button>
              </div>
            )}
            
            {!loading && !user && !isLoginPage && (
               <Link to="/login" className="w-full" onClick={closeMenu}>
                 <motion.button
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   className="w-full flex items-center justify-center gap-2 py-3 px-4 font-medium rounded-lg mt-2 text-white shadow-lg"
                   style={{
                     background: 'linear-gradient(135deg, #8fa4f3 0%, #9d7bb8 100%)',
                     boxShadow: '0 4px 16px rgba(143, 164, 243, 0.4)'
                   }}
                 >
                   <span>Get Started</span>
                 </motion.button>
               </Link>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

const NavButton = ({ onClick, label, className = "", icon }: { onClick: () => void; label: string; className?: string; icon?: React.ReactNode }) => {
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <button
        onClick={onClick}
        className={`px-2.5 py-1.5 rounded-lg flex items-center space-x-1 text-sm font-medium transition-all duration-200 neuro-button ${className}`}
      >
        {icon && <span className="text-xs">{icon}</span>}
        <span>{label}</span>
      </button>
    </motion.div>
  );
};

const NavLink = ({ to, label, className = "", icon, onClick }: { to: string; label: string; className?: string; icon?: React.ReactNode; onClick?: () => void }) => {
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        to={to}
        onClick={onClick}
        className={`px-2.5 py-1.5 rounded-lg flex items-center space-x-1 text-sm font-medium transition-all duration-200 neuro-button ${className}`}
      >
        {icon && <span className="text-xs">{icon}</span>}
        <span>{label}</span>
      </Link>
    </motion.div>
  );
};

// Mobile specific components
const MobileNavButton = ({ onClick, label, className = "", icon }: { onClick: () => void; label: string; className?: string; icon?: React.ReactNode }) => {
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full px-4 py-3 rounded-lg flex items-center space-x-2 neuro-button ${className}`}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </motion.button>
  );
};

const MobileNavLink = ({ to, label, className = "", icon, onClick }: { to: string; label: string; className?: string; icon?: React.ReactNode; onClick?: () => void }) => {
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        to={to}
        onClick={onClick}
        className={`w-full px-4 py-3 rounded-lg flex items-center space-x-2 neuro-button ${className}`}
      >
        {icon && icon}
        <span>{label}</span>
      </Link>
    </motion.div>
  );
};

export default Navbar; 