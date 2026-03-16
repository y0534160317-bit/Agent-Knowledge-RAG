import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'auth:user';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Hydrate initial user from storage (if available).
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      const parsed = JSON.parse(raw) as AuthUser | null;

      setState({
        user: parsed ?? null,
        loading: false,
        error: null,
      });
    } catch {
      setState({
        user: null,
        loading: false,
        error: 'Failed to restore session.',
      });
    }
  }, []);

  const persistUser = useCallback((user: AuthUser | null) => {
    if (!user) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }, []);

  const login = useCallback<AuthContextValue['login']>(
    async (email, password) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // TODO: Replace with real API call (e.g., POST /api/auth/login).
        const mockUser: AuthUser = {
          id: 'mock-user-id',
          email,
        };

        persistUser(mockUser);

        setState({
          user: mockUser,
          loading: false,
          error: null,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Login failed.';

        setState({
          user: null,
          loading: false,
          error: message,
        });
      }
    },
    [persistUser],
  );

  const signup = useCallback<AuthContextValue['signup']>(
    async (email, password) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // TODO: Replace with real API call (e.g., POST /api/auth/signup).
        const mockUser: AuthUser = {
          id: 'mock-user-id',
          email,
        };

        persistUser(mockUser);

        setState({
          user: mockUser,
          loading: false,
          error: null,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Signup failed.';

        setState({
          user: null,
          loading: false,
          error: message,
        });
      }
    },
    [persistUser],
  );

  const logout = useCallback<AuthContextValue['logout']>(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // TODO: Replace with real API call (e.g., POST /api/auth/logout) if needed.
      persistUser(null);

      setState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Logout failed.';

      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [persistUser]);

  const value: AuthContextValue = {
    ...state,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

