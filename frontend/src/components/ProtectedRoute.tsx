import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className={`animate-pulse text-2xl mb-4 ${
          theme === 'dark' ? 'text-primary-400' : 'text-primary-600'
        }`}>
          Loading...
        </div>
        <div className={`w-16 h-16 border-t-4 border-solid rounded-full animate-spin ${
          theme === 'dark' ? 'border-primary-500' : 'border-primary-600'
        }`}></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute; 