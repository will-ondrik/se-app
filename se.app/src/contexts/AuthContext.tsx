import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, Permission, Role } from '@/types/app/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dev-only mock session fallback: enable by setting NEXT_PUBLIC_DEV_MOCK_AUTH=1 and seeding localStorage.devSession
  const applyDevMock = (): boolean => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEV_MOCK_AUTH === '1') {
      const raw = localStorage.getItem('devSession');
      if (raw) {
        try {
          const data = JSON.parse(raw);
          setSession(data.session as Session);
          setUser(data.user as User);
          return true;
        } catch (e) {
          console.warn('Invalid devSession JSON in localStorage');
        }
      }
    }
    return false;
  };

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
        setUser(data.user);
      } else {
        if (!applyDevMock()) {
          setSession(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
      if (!applyDevMock()) {
        setSession(null);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    await fetchSession();
  };

  const register = async (data: RegisterData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    await fetchSession();
  };

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setSession(null);
    setUser(null);
  };

  const hasPermission = (permission: Permission): boolean => {
    return session?.permissions?.includes(permission) ?? false;
  };

  const hasRole = (role: Role): boolean => {
    return session?.roles?.includes(role) ?? false;
  };

  const hasAnyRole = (roles: Role[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        login,
        register,
        logout,
        hasPermission,
        hasRole,
        hasAnyRole,
      }}
    >
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
