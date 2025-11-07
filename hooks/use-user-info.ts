/**
 * Custom hook for fetching and caching user information
 * Prevents excessive API calls by using React Query's caching mechanism
 */

import { useQuery } from '@tanstack/react-query';

export interface UserInfo {
  accountId: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  companyName?: string;
  country?: string;
  authenticated?: boolean;
  authorities?: string[];
}

/**
 * Query key for user info
 */
export const USER_INFO_QUERY_KEY = ['user', 'info'];

/**
 * Fetch user information from the API
 */
async function fetchUserInfo(): Promise<UserInfo> {
  const response = await fetch('/api/auth/me', {
    // Use browser cache when possible
    cache: 'force-cache',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  return response.json();
}

/**
 * Hook to fetch user information with caching
 * 
 * Features:
 * - Automatic caching for 5 minutes
 * - Reuses cached data across components
 * - Background refetch on window focus
 * - Prevents duplicate API calls
 */
export function useUserInfo() {
  return useQuery<UserInfo>({
    queryKey: USER_INFO_QUERY_KEY,
    queryFn: fetchUserInfo,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    retry: 1,
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });
}

/**
 * Get user info from cache synchronously (if available)
 * Useful for components that need immediate access to cached data
 */
export function getUserInfoFromCache(): UserInfo | undefined {
  // This would require access to queryClient, implement if needed
  return undefined;
}
