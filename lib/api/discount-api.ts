/**
 * Discount API Client
 * Handles discount operations including associations with packages and offerings
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

/**
 * Get authentication token from session
 */
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
 * Link discount to specific packages
 * @param discountId - The discount ID
 * @param packageIds - Array of package IDs to link
 * @returns Promise<void>
 */
export async function linkDiscountToPackages(
  discountId: number,
  packageIds: number[]
): Promise<void> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Build text/uri-list format
  const uriList = packageIds
    .map(id => `${API_BASE_URL}/api/packages/${id}`)
    .join('\n');

  const response = await fetch(`${API_BASE_URL}/api/discounts/${discountId}/applicablePackages`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/uri-list',
      'Authorization': `Bearer ${token}`,
    },
    body: uriList,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to link packages: ${errorText || response.statusText}`);
  }
}

/**
 * Link discount to specific offerings
 * @param discountId - The discount ID
 * @param offeringIds - Array of offering IDs to link
 * @returns Promise<void>
 */
export async function linkDiscountToOfferings(
  discountId: number,
  offeringIds: number[]
): Promise<void> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Build text/uri-list format
  const uriList = offeringIds
    .map(id => `${API_BASE_URL}/api/offerings/${id}`)
    .join('\n');

  const response = await fetch(`${API_BASE_URL}/api/discounts/${discountId}/applicableOfferings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/uri-list',
      'Authorization': `Bearer ${token}`,
    },
    body: uriList,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to link offerings: ${errorText || response.statusText}`);
  }
}

/**
 * Remove all package associations from a discount
 * @param discountId - The discount ID
 * @returns Promise<void>
 */
export async function unlinkAllPackages(discountId: number): Promise<void> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/discounts/${discountId}/applicablePackages`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to unlink packages: ${errorText || response.statusText}`);
  }
}

/**
 * Remove all offering associations from a discount
 * @param discountId - The discount ID
 * @returns Promise<void>
 */
export async function unlinkAllOfferings(discountId: number): Promise<void> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/discounts/${discountId}/applicableOfferings`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to unlink offerings: ${errorText || response.statusText}`);
  }
}

/**
 * Parse comma-separated IDs string into array of numbers
 * @param idsString - Comma-separated IDs like "5,7,9"
 * @returns Array of numbers or empty array
 */
export function parseApplicableIds(idsString: string | null | undefined): number[] {
  if (!idsString) return [];
  return idsString
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id));
}

/**
 * Convert array of IDs to comma-separated string
 * @param ids - Array of numbers
 * @returns Comma-separated string like "5,7,9"
 */
export function formatApplicableIds(ids: number[]): string {
  return ids.join(',');
}

/**
 * Extract numeric ID from a HATEOAS href
 * @param href - HATEOAS href like "http://localhost:8082/api/packages/5"
 * @returns Numeric ID or undefined
 */
function extractIdFromHref(href: string): number | undefined {
  const segments = href.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const parsed = parseInt(lastSegment ?? '', 10);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Fetch linked packages for a discount
 * @param discountId - The discount ID
 * @returns Promise<number[]> - Array of package IDs
 */
export async function fetchLinkedPackages(discountId: number): Promise<number[]> {
  const token = await getAuthToken();
  if (!token) {
    console.warn('No authentication token found, returning empty array');
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/discounts/${discountId}/applicablePackages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch linked packages: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    // Handle HAL format with _embedded
    if (data._embedded?.packages) {
      return data._embedded.packages
        .map((pkg: any) => pkg.id || extractIdFromHref(pkg._links?.self?.href))
        .filter((id: number | undefined) => id !== undefined) as number[];
    }
    
    // Handle array of packages directly
    if (Array.isArray(data)) {
      return data
        .map((pkg: any) => pkg.id || extractIdFromHref(pkg._links?.self?.href))
        .filter((id: number | undefined) => id !== undefined) as number[];
    }

    return [];
  } catch (error) {
    console.error('Error fetching linked packages:', error);
    return [];
  }
}

/**
 * Fetch linked offerings for a discount
 * @param discountId - The discount ID
 * @returns Promise<number[]> - Array of offering IDs
 */
export async function fetchLinkedOfferings(discountId: number): Promise<number[]> {
  const token = await getAuthToken();
  if (!token) {
    console.warn('No authentication token found, returning empty array');
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/discounts/${discountId}/applicableOfferings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch linked offerings: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    // Handle HAL format with _embedded
    if (data._embedded?.offerings) {
      return data._embedded.offerings
        .map((offering: any) => offering.id || extractIdFromHref(offering._links?.self?.href))
        .filter((id: number | undefined) => id !== undefined) as number[];
    }
    
    // Handle array of offerings directly
    if (Array.isArray(data)) {
      return data
        .map((offering: any) => offering.id || extractIdFromHref(offering._links?.self?.href))
        .filter((id: number | undefined) => id !== undefined) as number[];
    }

    return [];
  } catch (error) {
    console.error('Error fetching linked offerings:', error);
    return [];
  }
}
