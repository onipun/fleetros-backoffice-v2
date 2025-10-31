const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

export interface Permission {
  code: string;
  displayName: string;
  category: string;
  description: string;
}

export interface AvailablePermissionsResponse {
  permissions: Permission[];
  totalCount: number;
  byCategory: Record<string, Permission[]>;
}

export interface AddCustomPermissionsRequest {
  permissions: string[];
  notes?: string;
  replaceExisting?: boolean;
}

export interface CustomPermissionsResponse {
  userId: number;
  customPermissions: string[];
  count: number;
  hasCustomPermissions: boolean;
}

export interface AllPermissionsResponse {
  userId: number;
  allPermissions: string[];
  roleBasedPermissions: string[];
  customPermissions: string[];
  totalCount: number;
  hasCustomPermissions: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function getAuthToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/session');
    if (!response.ok) return null;
    const data = await response.json();
    return data.accessToken || null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * Get all available permissions grouped by category
 */
export async function getAvailablePermissions(): Promise<ApiResponse<AvailablePermissionsResponse>> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/api/account/users/permissions/available`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText || 'Failed to fetch available permissions' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Add custom permissions to a user
 */
export async function addCustomPermissions(
  userId: number,
  request: AddCustomPermissionsRequest
): Promise<ApiResponse<any>> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/api/account/users/${userId}/permissions/add`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText || 'Failed to add custom permissions' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Get user's custom permissions only
 */
export async function getCustomPermissions(userId: number): Promise<ApiResponse<CustomPermissionsResponse>> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/api/account/users/${userId}/permissions/custom`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText || 'Failed to fetch custom permissions' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Get all user permissions (role + custom)
 */
export async function getAllUserPermissions(userId: number): Promise<ApiResponse<AllPermissionsResponse>> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/api/account/users/${userId}/permissions/all`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText || 'Failed to fetch all permissions' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Remove a specific custom permission
 */
export async function removeCustomPermission(userId: number, permission: string): Promise<ApiResponse<any>> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${API_BASE_URL}/api/account/users/${userId}/permissions/custom/${permission}`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText || 'Failed to remove custom permission' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Remove all custom permissions from a user
 */
export async function removeAllCustomPermissions(userId: number): Promise<ApiResponse<any>> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/api/account/users/${userId}/permissions/custom`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText || 'Failed to remove all custom permissions' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
