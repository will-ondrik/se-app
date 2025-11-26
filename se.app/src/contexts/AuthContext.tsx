import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, Permission, Role } from '@/types/app/types';
import {
  getMe,
  postLogin,
  postRegisterFirst,
  postRegisterInvited,
  postLogout,
  requestPasswordReset as apiRequestPasswordReset,
  resetPassword as apiResetPassword,
} from '@/services/api';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>; // Back-compat (maps to registerFirst)
  registerFirst: (data: RegisterFirstData) => Promise<void>;
  registerInvited: (data: RegisterInvitedData) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
}

interface RegisterData {
  // Legacy shape used by /register page (now maps to register-first)
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string; // will map to companyName
}

interface RegisterFirstData {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface RegisterInvitedData {
  token: string;
  password: string;
  firstName?: string;
  lastName?: string;
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
      const { session: s, user: u } = await getMe();

      if (s || u) {
        setSession(s);
        setUser(u);
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
    await postLogin({ email, password });
    await fetchSession();
  };

  // Back-compat: existing /register page calls this; map to first-user registration
  const register = async (data: RegisterData) => {
    await postRegisterFirst({
      companyName: data.company,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
    });
    await fetchSession();
  };

  const registerFirst = async (data: RegisterFirstData) => {
    await postRegisterFirst(data);
    await fetchSession();
  };

  const registerInvited = async (data: RegisterInvitedData) => {
    await postRegisterInvited(data);
    await fetchSession();
  };

  const logout = async () => {
    await postLogout();
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
        register, // legacy
        registerFirst,
        registerInvited,
        requestPasswordReset: async (email: string) => {
          await apiRequestPasswordReset(email);
        },
        resetPassword: async (token: string, newPassword: string) => {
          await apiResetPassword(token, newPassword);
        },
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
