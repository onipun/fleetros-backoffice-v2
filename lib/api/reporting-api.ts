/**
 * Reporting Service API Client
 * Integrates with the Reporting Service for dashboard statistics and revenue reports
 * Based on REPORTING_SERVICE_INTEGRATION_GUIDE.md
 */

import type {
    DashboardStatisticsResponse,
    ReportingError,
    ReportRequest,
    ReportType,
    RevenueReportResponse,
} from '@/types/reporting';

const REPORTING_API_BASE_URL = process.env.NEXT_PUBLIC_REPORTING_API_URL || 'http://localhost:8084';

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
 * Handle API errors consistently
 */
function handleApiError(error: unknown): never {
  if (error instanceof Response) {
    throw {
      message: error.statusText || 'Request failed',
      status: error.status,
    } as ReportingError;
  }
  throw {
    message: error instanceof Error ? error.message : 'Unknown error occurred',
    status: 500,
  } as ReportingError;
}

/**
 * Get dashboard statistics for an account
 * GET /api/v1/reporting/dashboard
 * Account ID is extracted from the authorization token
 */
export async function getDashboardStatistics(
  accountId: number
): Promise<DashboardStatisticsResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${REPORTING_API_BASE_URL}/api/v1/reporting/dashboard`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Always fetch fresh data
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error || errorData.message || 'Failed to fetch dashboard statistics',
        status: response.status,
        ...errorData,
      } as ReportingError;
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Generate new dashboard statistics for an account
 * POST /api/v1/reporting/dashboard/generate
 * Account ID is extracted from the authorization token
 */
export async function generateDashboardStatistics(
  accountId: number
): Promise<DashboardStatisticsResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${REPORTING_API_BASE_URL}/api/v1/reporting/dashboard/generate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error || errorData.message || 'Failed to generate statistics',
        status: response.status,
        ...errorData,
      } as ReportingError;
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Refresh dashboard statistics (clear cache and regenerate)
 * PUT /api/v1/reporting/dashboard/refresh
 * Account ID is extracted from the authorization token
 */
export async function refreshDashboardStatistics(
  accountId: number
): Promise<DashboardStatisticsResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${REPORTING_API_BASE_URL}/api/v1/reporting/dashboard/refresh`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error || errorData.message || 'Failed to refresh statistics',
        status: response.status,
        ...errorData,
      } as ReportingError;
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Get revenue report for an account
 * GET /api/v1/reporting/revenue
 * Account ID is extracted from the authorization token
 */
export async function getRevenueReport(
  accountId: number,
  startDate: string,
  endDate: string,
  forceRefresh: boolean = false
): Promise<RevenueReportResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const params = new URLSearchParams({
      startDate,
      endDate,
      forceRefresh: String(forceRefresh),
    });

    const response = await fetch(
      `${REPORTING_API_BASE_URL}/api/v1/reporting/revenue?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error || errorData.message || 'Failed to fetch revenue report',
        status: response.status,
        ...errorData,
      } as ReportingError;
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Generate new revenue report
 * POST /api/v1/reporting/revenue/generate
 */
export async function generateRevenueReport(
  request: ReportRequest
): Promise<RevenueReportResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${REPORTING_API_BASE_URL}/api/v1/reporting/revenue/generate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error || errorData.message || 'Failed to generate revenue report',
        status: response.status,
        ...errorData,
      } as ReportingError;
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Get revenue reports by type
 * GET /api/v1/reporting/revenue/by-type
 * Account ID is extracted from the authorization token
 */
export async function getRevenueReportsByType(
  accountId: number,
  reportType: ReportType,
  limit: number = 5
): Promise<RevenueReportResponse[]> {
  try {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const params = new URLSearchParams({
      reportType,
      limit: String(limit),
    });

    const response = await fetch(
      `${REPORTING_API_BASE_URL}/api/v1/reporting/revenue/by-type?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error || errorData.message || 'Failed to fetch reports by type',
        status: response.status,
        ...errorData,
      } as ReportingError;
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
}
