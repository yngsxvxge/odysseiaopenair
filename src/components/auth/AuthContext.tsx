import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AuthContextProps {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  role?: UserRole;
}

export type UserRole = 'admin' | 'editor';

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<UserRole | undefined>(undefined);

  useEffect(() => {
    const token = localStorage.getItem('odysseia_auth_token');
    if (token) {
      console.log('Odysseia Auth: Token found, loading simulation session...');
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsAuthenticated(true);
        setRole(payload.role);
        console.log('Odysseia Auth: Role loaded:', payload.role);
      } catch {
        // invalid token
        console.warn('Odysseia Auth: Invalid token found, clearing...');
        localStorage.removeItem('odysseia_auth_token');
      }
    } else {
      console.log('Odysseia Auth: No token found. Simulation in guest mode.');
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('Odysseia Auth: Simulating login for', email);
    // Mock validation – replace with real API call when available
    if (
      (email === 'admin@odysseia.com' && password === 'password123') ||
      (email === 'admin' && password === 'admin')
    ) {
      console.log('Odysseia Auth: Credentials valid! Setting up simulation token.');
      const fakePayload = { email, role: 'admin' as UserRole };
      const token = `header.${btoa(JSON.stringify(fakePayload))}.signature`;
      localStorage.setItem('odysseia_auth_token', token);
      setIsAuthenticated(true);
      setRole('admin');
      return true;
    }
    console.warn('Odysseia Auth: Credentials invalid.');
    return false;
  };

  const logout = () => {
    localStorage.removeItem('odysseia_auth_token');
    setIsAuthenticated(false);
    setRole(undefined);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, role }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
