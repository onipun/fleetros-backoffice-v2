'use client';

import type { User } from '@/types';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface PermissionContextType {
  user: User | null;
  can: (capability: string) => boolean;
  hasRole: (role: string) => boolean;
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user from session
  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.isLoggedIn && data.user) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSession();
  }, []);

  const can = (capability: string): boolean => {
    if (!user || !user.capabilities) return false;
    return user.capabilities.includes(capability);
  };

  const hasRole = (role: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  return (
    <PermissionContext.Provider value={{ user, can, hasRole, isLoading }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
}

// Higher-order component for protecting components
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredCapability: string
) {
  return function ProtectedComponent(props: P) {
    const { can } = usePermissions();
    
    if (!can(requiredCapability)) {
      return null;
    }
    
    return <Component {...props} />;
  };
}
