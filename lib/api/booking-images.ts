import type {
    BookingImage,
    BookingImageCategoriesResponse,
    BookingImageCategory,
    CustomImageCategory,
    GroupedBookingImages,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

async function getAuthToken(): Promise<string> {
  const sessionResponse = await fetch('/api/auth/session');
  if (!sessionResponse.ok) {
    throw new Error('Failed to get authentication token');
  }
  const session = await sessionResponse.json();
  if (!session.accessToken) {
    throw new Error('No access token available');
  }
  return session.accessToken;
}

// ==================== Category Management APIs ====================

export async function fetchBookingImageCategories(): Promise<BookingImageCategoriesResponse> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/booking-image-categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchCustomCategories(): Promise<{ categories: CustomImageCategory[]; count: number }> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/booking-image-categories/custom`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch custom categories: ${response.statusText}`);
  }

  return response.json();
}

export async function createCustomCategory(data: {
  name: string;
  description?: string;
  displayColor?: string;
  icon?: string;
}): Promise<{ message: string; category: CustomImageCategory }> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/booking-image-categories/custom`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Failed to create category: ${response.statusText}`);
  }

  return response.json();
}

export async function updateCustomCategory(
  categoryId: number,
  data: {
    name: string;
    description?: string;
    displayColor?: string;
    icon?: string;
  }
): Promise<{ message: string; category: CustomImageCategory }> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/booking-image-categories/custom/${categoryId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Failed to update category: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteCustomCategory(categoryId: number): Promise<{ message: string }> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/booking-image-categories/custom/${categoryId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Failed to delete category: ${response.statusText}`);
  }

  return response.json();
}

// ==================== Image Upload APIs ====================

export async function uploadBookingImages(
  bookingId: number | string,
  files: File[],
  options: {
    category?: BookingImageCategory;
    customCategoryId?: number;
    notes?: string;
  }
): Promise<{ message: string; images: BookingImage[]; count: number }> {
  const token = await getAuthToken();
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  if (options.category) {
    formData.append('category', options.category);
  }

  if (options.customCategoryId) {
    formData.append('customCategoryId', options.customCategoryId.toString());
  }

  if (options.notes) {
    formData.append('notes', options.notes);
  }

  const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Failed to upload images: ${response.statusText}`);
  }

  return response.json();
}

export async function uploadSingleBookingImage(
  bookingId: number | string,
  file: File,
  options: {
    category?: BookingImageCategory;
    customCategoryId?: number;
    notes?: string;
  }
): Promise<{ message: string; image: BookingImage }> {
  const token = await getAuthToken();
  const formData = new FormData();

  formData.append('file', file);

  if (options.category) {
    formData.append('category', options.category);
  }

  if (options.customCategoryId) {
    formData.append('customCategoryId', options.customCategoryId.toString());
  }

  if (options.notes) {
    formData.append('notes', options.notes);
  }

  const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/images/single`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Failed to upload image: ${response.statusText}`);
  }

  return response.json();
}

// ==================== Image Retrieval APIs ====================

export async function fetchBookingImages(bookingId: number | string): Promise<BookingImage[]> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/images`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Failed to fetch images: ${response.statusText}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    return data;
  }
  if (data.images && Array.isArray(data.images)) {
    return data.images;
  }
  return [];
}

export async function fetchBookingImagesByCategory(
  bookingId: number | string,
  category: BookingImageCategory
): Promise<{ images: BookingImage[]; count: number; category: string }> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/images/by-category/${category}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch images by category: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchBookingImagesByCustomCategory(
  bookingId: number | string,
  customCategoryId: number
): Promise<{ images: BookingImage[]; count: number; customCategoryId: number }> {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/api/bookings/${bookingId}/images/by-custom-category/${customCategoryId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch images by custom category: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchGroupedBookingImages(bookingId: number | string): Promise<GroupedBookingImages> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/images/grouped`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch grouped images: ${response.statusText}`);
  }

  return response.json();
}

// ==================== Image Deletion APIs ====================

export async function deleteBookingImage(bookingId: number | string, imageId: number): Promise<{ message: string }> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/images/${imageId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Failed to delete image: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteAllBookingImages(bookingId: number | string): Promise<{ message: string }> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/images`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Failed to delete all images: ${response.statusText}`);
  }

  return response.json();
}
