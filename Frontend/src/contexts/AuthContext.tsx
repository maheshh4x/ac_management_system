'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role } from '@/lib/permissions';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    // Demo local storage check
    const stored = localStorage.getItem('demo_auth');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('demo_auth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newUser: User) => {
    localStorage.setItem('demo_auth', JSON.stringify(newUser));
    setUser(newUser);
    
    // Role-based routing redirect after login
    switch(newUser.role) {
      case 'SUPER_ADMIN': router.replace('/admin/dashboard'); break;
      case 'FACILITY_MANAGER': router.replace('/manager/dashboard'); break;
      case 'TECHNICIAN': router.replace('/technician/dashboard'); break;
      case 'VIEWER': router.replace('/viewer/dashboard'); break;
      default: router.replace('/viewer/dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('demo_auth');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
