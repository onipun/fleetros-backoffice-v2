import type { HATEOASCollection, HATEOASResource, VehiclePricingResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

export type TokenProvider = () => Promise<string | null>;

export class HATEOASClient {
  private baseUrl: string;
  private endpoints: Map<string, string> = new Map();
  private tokenProvider: TokenProvider;

  constructor(baseUrl: string, tokenProvider?: TokenProvider) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.tokenProvider = tokenProvider ?? this.fetchTokenFromSession.bind(this);
  }

  /**
   * Get access token from session
   */
  private async fetchTokenFromSession(): Promise<string | null> {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const session = await response.json();
        return session.accessToken || null;
      }
    } catch (error) {
      console.error('Failed to get access token:', error);
    }
    return null;
  }

  private async getAccessToken(): Promise<string | null> {
    return this.tokenProvider();
  }

  /**
   * Make an authenticated HTTP request
   */
  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Get access token
    const token = await this.getAccessToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Merge with provided headers
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const response = await fetch(url, {
      cache: 'no-store',
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login?error=session_expired';
        }
        throw new Error('Unauthorized - please login again');
      }

      // Try to parse error response
      let errorMessage = response.statusText;
      let errorDetails: any = null;
      let errorTitle: string | null = null;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorDetails = errorData;
          
          // Extract error title if available
          if (errorData.error && typeof errorData.error === 'string') {
            errorTitle = errorData.error;
          }
          
          // Extract meaningful error message from common API error formats
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error && typeof errorData.error !== 'string') {
            errorMessage = JSON.stringify(errorData.error);
          } else if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map((e: any) => e.message || e).join(', ');
          } else if (errorData.violations && Array.isArray(errorData.violations)) {
            errorMessage = errorData.violations.map((v: any) => `${v.field}: ${v.message}`).join(', ');
          }
        } else {
          errorMessage = await response.text();
        }
      } catch (parseError) {
        // If parsing fails, use the text response
        errorMessage = await response.text().catch(() => response.statusText);
      }

      const error: any = new Error(errorMessage || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.details = errorDetails?.details || errorDetails;
      error.error = errorTitle || errorDetails?.error;
      error.timestamp = errorDetails?.timestamp;
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Discover available endpoints from the API root
   */
  async discover(): Promise<void> {
    const root = await this.request<HATEOASResource>(`${this.baseUrl}/api`);
    
    if (root._links) {
      Object.entries(root._links).forEach(([rel, link]) => {
        if (typeof link === 'object' && 'href' in link) {
          this.endpoints.set(rel, link.href);
        }
      });
    }
  }

  /**
   * Get the URL for a specific resource
   */
  private getEndpoint(resource: string, useV1?: boolean): string {
    const endpoint = this.endpoints.get(resource);
    if (!endpoint) {
      // Fallback to convention-based URL
      // Special case: pricings endpoint uses v1 API for CREATE/UPDATE operations (tagNames support)
      if (resource === 'pricings' && useV1) {
        return `${this.baseUrl}/api/v1/${resource}`;
      }
      return `${this.baseUrl}/api/${resource}`;
    }
    return endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
  }

  /**
   * Build query parameters for pagination, sorting, and filtering
   */
  private buildQueryParams(options?: {
    page?: number;
    size?: number;
    sort?: string;
    projection?: string;
    [key: string]: any;
  }): string {
    if (!options) return '';
    
    const params = new URLSearchParams();
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    return params.toString() ? `?${params.toString()}` : '';
  }

  /**
   * Expand templated URIs with parameters
   */
  private expandTemplate(template: string, params: Record<string, any>): string {
    let expanded = template;
    Object.entries(params).forEach(([key, value]) => {
      expanded = expanded.replace(`{${key}}`, encodeURIComponent(value));
      expanded = expanded.replace(`{?${key}}`, `?${key}=${encodeURIComponent(value)}`);
      expanded = expanded.replace(`{&${key}}`, `&${key}=${encodeURIComponent(value)}`);
    });
    // Remove unused template variables
    expanded = expanded.replace(/\{[^}]+\}/g, '');
    return expanded;
  }

  /**
   * Get a collection of resources
   */
  async getCollection<T>(
    resource: string,
    options?: {
      page?: number;
      size?: number;
      sort?: string;
      projection?: string;
      [key: string]: any;
    }
  ): Promise<HATEOASCollection<T>> {
    const endpoint = this.getEndpoint(resource);
    const queryParams = this.buildQueryParams(options);
    return this.request<HATEOASCollection<T>>(`${endpoint}${queryParams}`);
  }

  /**
   * Get a single resource by ID or self link
   */
  async getResource<T>(
    resourceOrUrl: string,
    id?: number | string,
    projection?: string
  ): Promise<T & HATEOASResource> {
    // If resourceOrUrl is a full URL (contains http), use it directly
    if (resourceOrUrl.startsWith('http')) {
      const projectionParam = projection ? `?projection=${projection}` : '';
      return this.request<T & HATEOASResource>(`${resourceOrUrl}${projectionParam}`);
    }
    
    // Otherwise, treat it as a resource name
    const endpoint = this.getEndpoint(resourceOrUrl);
    const projectionParam = projection ? `?projection=${projection}` : '';
    return this.request<T & HATEOASResource>(`${endpoint}/${id}${projectionParam}`);
  }

  /**
   * Create a new resource
   */
  async create<T>(
    resource: string,
    data: Partial<T>
  ): Promise<T & HATEOASResource> {
    // Use v1 API for pricings to support tagNames
    const endpoint = this.getEndpoint(resource, resource === 'pricings');
    return this.request<T & HATEOASResource>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a resource (PUT - full replacement)
   */
  async update<T>(
    resource: string,
    id: number | string,
    data: Partial<T>
  ): Promise<T & HATEOASResource> {
    // Use v1 API for pricings to support tagNames
    const endpoint = this.getEndpoint(resource, resource === 'pricings');
    return this.request<T & HATEOASResource>(`${endpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Patch a resource (PATCH - partial update)
   */
  async patch<T>(
    resource: string,
    id: number | string,
    data: Partial<T>
  ): Promise<T & HATEOASResource> {
    const endpoint = this.getEndpoint(resource);
    return this.request<T & HATEOASResource>(`${endpoint}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a resource
   */
  async delete(resource: string, id: number | string): Promise<void> {
    const endpoint = this.getEndpoint(resource);
    await this.request<void>(`${endpoint}/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Follow a link relation
   */
  async followLink<T>(
    resourceOrLink: HATEOASResource | string,
    rel?: string
  ): Promise<T> {
    let url: string;
    
    if (typeof resourceOrLink === 'string') {
      url = resourceOrLink;
    } else if (rel && resourceOrLink._links?.[rel]) {
      const link = resourceOrLink._links[rel];
      url = typeof link === 'object' && 'href' in link ? link.href : '';
    } else {
      throw new Error('Invalid link or relation');
    }
    
    if (!url) {
      throw new Error(`Link not found for relation: ${rel}`);
    }
    
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    return this.request<T>(fullUrl);
  }

  /**
   * Search resources using a named query
   */
  async search<T>(
    resource: string,
    searchName: string,
    params: Record<string, any>
  ): Promise<HATEOASCollection<T>> {
    const endpoint = this.getEndpoint(resource);
    const queryParams = this.buildQueryParams(params);
    return this.request<HATEOASCollection<T>>(
      `${endpoint}/search/${searchName}${queryParams}`
    );
  }

  /**
   * Add an association between resources
   */
  async addAssociation(
    resource: string,
    id: number | string,
    association: string,
    associatedResourceUri: string
  ): Promise<void> {
    const endpoint = this.getEndpoint(resource);
    await this.request<void>(`${endpoint}/${id}/${association}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/uri-list',
      },
      body: associatedResourceUri,
    });
  }

  /**
   * Remove an association between resources
   */
  async removeAssociation(
    resource: string,
    id: number | string,
    association: string,
    associatedId?: number | string
  ): Promise<void> {
    const endpoint = this.getEndpoint(resource);
    const url = associatedId
      ? `${endpoint}/${id}/${association}/${associatedId}`
      : `${endpoint}/${id}/${association}`;
    
    await this.request<void>(url, {
      method: 'DELETE',
    });
  }

  /**
   * Get vehicle pricing for specific dates
   */
  async getVehiclePricing(vehicleId: number, dates: string[]): Promise<VehiclePricingResponse> {
    // New API expects startDate and endDate instead of dates array
    const [startDate, endDate] = dates;
    return this.request<VehiclePricingResponse>(`${this.baseUrl}/api/rental-pricing/calculate`, {
      method: 'POST',
      body: JSON.stringify({ vehicleId, startDate, endDate }),
    });
  }
}

// Export a singleton instance for client environments
export const hateoasClient = new HATEOASClient(API_BASE_URL);

export function createServerHateoasClient(tokenProvider: TokenProvider) {
  return new HATEOASClient(API_BASE_URL, tokenProvider);
}
