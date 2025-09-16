import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiRequest } from './queryClient';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department_id?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  loginDev?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const verifyToken = async (token: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/verify', { token });
      if (!response.ok) {
        throw new Error('Token verification failed');
      }
      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loginDev = async () => {
    setIsLoading(true);
    await verifyToken('dev-token');
  };

  useEffect(() => {
    // Check for existing token on app start
    const token = localStorage.getItem('auth_token');
    if (token) {
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (token: string) => {
    setIsLoading(true);
    await verifyToken(token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    loginDev: import.meta.env.DEV ? loginDev : undefined
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Google OAuth integration types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: Element, config: any) => void;
        };
      };
    };
  }
}

// Google OAuth integration
export function initializeGoogleAuth(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google) {
      resolve(window.google);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });
        resolve(window.google);
      } else {
        reject(new Error('Google script loaded but google object not available'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Google OAuth script'));
    document.head.appendChild(script);
  });
}

function handleCredentialResponse(response: any) {
  // This will be called when user signs in with Google
  const token = response.credential;
  // Use the auth context to login
  console.log('Google auth token received:', token);
}
