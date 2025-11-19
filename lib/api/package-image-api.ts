/**
 * Package Image API Service
 * Handles package banner image upload, retrieval, update, and deletion
 */

import type { PackageImage, PackageImageUploadResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

/**
 * Get authentication token from storage
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

/**
 * Upload or replace a package banner image
 */
export async function uploadPackageImage(
  packageId: number,
  file: File,
  description?: string,
  altText?: string
): Promise<PackageImageUploadResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  formData.append('file', file);
  if (description) formData.append('description', description);
  if (altText) formData.append('altText', altText);

  const response = await fetch(`${API_BASE_URL}/api/packages/${packageId}/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get the banner image for a package
 */
export async function getPackageImage(packageId: number): Promise<PackageImage | null> {
  const response = await fetch(`${API_BASE_URL}/api/packages/${packageId}/image`, {
    method: 'GET',
  });

  if (response.status === 404) {
    return null; // No image exists
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to load image' }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check if a package has a banner image
 */
export async function checkPackageImageExists(packageId: number): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/packages/${packageId}/image/exists`, {
    method: 'GET',
  });

  if (!response.ok) {
    return false;
  }

  const result = await response.json();
  return result.exists === true;
}

/**
 * Update package image metadata (description and/or alt text)
 */
export async function updatePackageImageMetadata(
  packageId: number,
  description?: string,
  altText?: string
): Promise<PackageImage> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const params = new URLSearchParams();
  if (description !== undefined) params.append('description', description);
  if (altText !== undefined) params.append('altText', altText);

  const response = await fetch(
    `${API_BASE_URL}/api/packages/${packageId}/image?${params.toString()}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Update failed' }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.image;
}

/**
 * Delete a package banner image
 */
export async function deletePackageImage(packageId: number): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/api/packages/${packageId}/image`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Delete failed' }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image (JPEG, PNG, GIF, or WebP)' };
  }

  // Check supported formats
  const supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!supportedFormats.includes(file.type)) {
    return { valid: false, error: 'Unsupported image format. Use JPEG, PNG, GIF, or WebP' };
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  return { valid: true };
}

/**
 * Get full image URL
 */
export function getImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  return `${API_BASE_URL}/${imageUrl}`;
}
