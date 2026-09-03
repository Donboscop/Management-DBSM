import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Role } from '../types';
import { api, getStoredToken, setStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: Role | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getCurrentUser();
      setUser({
        id: data.id,
        email: data.email,
        role: data.role,
        name: data.student?.name || (data.role === 'ADMIN' ? 'Administrator' : 'Student User'),
        studentId: data.student?.id,
        studentCustomId: data.student?.studentId,
        gender: data.student?.gender,
        batch: data.student?.batch,
      });
    } catch {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (newToken: string, userData: User) => {
    setStoredToken(newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
