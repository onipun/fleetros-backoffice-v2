/**
 * Offering Price API Client
 * Manages offering price rules for flexible pricing
 * Based on OFFERING_PRICING_API_INTEGRATION.md
 * Service: Backoffice (port 8082)
 */

import type { HATEOASCollection, OfferingPrice } from '@/types';

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
 * Get offering prices for a specific offering
 * GET /api/offering-prices/search/findByOfferingId?offeringId={id}
 * 
 * This is the recommended approach per OFFERING_PRICE_API_ENDPOINTS.md
 * as it works without requiring bidirectional entity relationships.
 */
export async function getOfferingPrices(offeringId: number | string): Promise<OfferingPrice[]> {
  try {
    // Validate offeringId
    if (!offeringId || offeringId === 'undefined' || offeringId === 'null') {
      console.error('Invalid offeringId provided:', offeringId);
      throw new Error('Invalid offering ID');
    }

    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/offering-prices/search/findByOfferingId?offeringId=${offeringId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      throw new Error(`Failed to fetch offering prices: ${response.statusText}`);
    }

    const data: HATEOASCollection<OfferingPrice> = await response.json();
    
    // Extract offering prices from _embedded
    if (data._embedded && data._embedded.offeringPrices) {
      // Parse HATEOAS resources to extract IDs from self links
      return data._embedded.offeringPrices.map((price) => {
        // If id is not directly present, extract from _links.self.href
        if (!price.id && price._links?.self?.href) {
          const idMatch = price._links.self.href.match(/\/offering-prices\/(\d+)$/);
          if (idMatch) {
            return { ...price, id: parseInt(idMatch[1]) };
          }
        }
        return price;
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching offering prices:', error);
    throw error;
  }
}

/**
 * Create a new offering price
 * POST /api/offering-prices
 */
export async function createOfferingPrice(
  offeringId: number,
  priceData: Omit<OfferingPrice, 'id' | 'createdAt' | 'updatedAt' | '_links' | 'offering'>
): Promise<OfferingPrice> {
  try {
    // Validate offeringId
    if (!offeringId || isNaN(Number(offeringId))) {
      console.error('Invalid offeringId provided:', offeringId);
      throw new Error('Invalid offering ID');
    }

    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const payload = {
      ...priceData,
      offering: `/api/offerings/${offeringId}`, // HATEOAS URI reference
    };

    const response = await fetch(`${API_BASE_URL}/api/offering-prices`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create offering price: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating offering price:', error);
    throw error;
  }
}

/**
 * Update an existing offering price
 * PUT /api/offering-prices/{id}
 */
export async function updateOfferingPrice(
  priceId: number,
  priceData: Partial<Omit<OfferingPrice, 'id' | 'createdAt' | 'updatedAt' | '_links' | 'offering'>>
): Promise<OfferingPrice> {
  try {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/offering-prices/${priceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(priceData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update offering price: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating offering price:', error);
    throw error;
  }
}

/**
 * Delete an offering price
 * DELETE /api/offering-prices/{id}
 * 
 * Response: 204 No Content on success
 */
export async function deleteOfferingPrice(priceId: number): Promise<void> {
  try {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/offering-prices/${priceId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      if (response.status === 404) {
        throw new Error(`Offering price not found with id: ${priceId}`);
      }
      throw new Error(`Failed to delete offering price: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting offering price:', error);
    throw error;
  }
}

/**
 * Get active offering prices (filtered by active status)
 * GET /api/offering-prices/search/findByActive?active={true|false}
 * 
 * @param active - Boolean to filter by active status
 * @param page - Page number (0-indexed)
 * @param size - Page size
 * @param sort - Sort criteria (e.g., 'priority,desc')
 */
export async function getActiveOfferingPrices(
  active: boolean = true,
  page: number = 0,
  size: number = 20,
  sort?: string
): Promise<OfferingPrice[]> {
  try {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const params = new URLSearchParams({
      active: String(active),
      page: String(page),
      size: String(size),
    });

    if (sort) {
      params.append('sort', sort);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/offering-prices/search/findByActive?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      throw new Error(`Failed to fetch active offering prices: ${response.statusText}`);
    }

    const data: HATEOASCollection<OfferingPrice> = await response.json();
    
    if (data._embedded && data._embedded.offeringPrices) {
      return data._embedded.offeringPrices;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching active offering prices:', error);
    throw error;
  }
}

/**
 * Get a single offering price by ID
 * GET /api/offering-prices/{id}
 */
export async function getOfferingPriceById(priceId: number): Promise<OfferingPrice> {
  try {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/offering-prices/${priceId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      if (response.status === 404) {
        throw new Error(`Offering price not found with id: ${priceId}`);
      }
      throw new Error(`Failed to fetch offering price: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching offering price:', error);
    throw error;
  }
}
