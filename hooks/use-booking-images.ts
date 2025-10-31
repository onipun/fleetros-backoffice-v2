import {
    createCustomCategory,
    deleteAllBookingImages,
    deleteBookingImage,
    deleteCustomCategory,
    fetchBookingImageCategories,
    fetchBookingImages,
    fetchBookingImagesByCategory,
    fetchBookingImagesByCustomCategory,
    fetchCustomCategories,
    fetchGroupedBookingImages,
    updateCustomCategory,
    uploadBookingImages,
    uploadSingleBookingImage,
} from '@/lib/api/booking-images';
import type { BookingImageCategory } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ==================== Category Hooks ====================

export function useBookingImageCategories() {
  return useQuery({
    queryKey: ['booking-image-categories'],
    queryFn: fetchBookingImageCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCustomCategories() {
  return useQuery({
    queryKey: ['booking-image-categories', 'custom'],
    queryFn: fetchCustomCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCustomCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-image-categories'] });
      queryClient.invalidateQueries({ queryKey: ['booking-image-categories', 'custom'] });
    },
  });
}

export function useUpdateCustomCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: number; data: Parameters<typeof updateCustomCategory>[1] }) =>
      updateCustomCategory(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-image-categories'] });
      queryClient.invalidateQueries({ queryKey: ['booking-image-categories', 'custom'] });
    },
  });
}

export function useDeleteCustomCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCustomCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-image-categories'] });
      queryClient.invalidateQueries({ queryKey: ['booking-image-categories', 'custom'] });
    },
  });
}

// ==================== Image Upload Hooks ====================

export function useUploadBookingImages(bookingId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { files: File[]; options: Parameters<typeof uploadBookingImages>[2] }) =>
      uploadBookingImages(bookingId, params.files, params.options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId, 'images'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId, 'images-grouped'] });
    },
  });
}

export function useUploadSingleBookingImage(bookingId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { file: File; options: Parameters<typeof uploadSingleBookingImage>[2] }) =>
      uploadSingleBookingImage(bookingId, params.file, params.options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId, 'images'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId, 'images-grouped'] });
    },
  });
}

// ==================== Image Retrieval Hooks ====================

export function useBookingImages(bookingId: number | string) {
  return useQuery({
    queryKey: ['booking', bookingId, 'images'],
    queryFn: () => fetchBookingImages(bookingId),
    enabled: Boolean(bookingId),
  });
}

export function useBookingImagesByCategory(bookingId: number | string, category: BookingImageCategory) {
  return useQuery({
    queryKey: ['booking', bookingId, 'images', 'category', category],
    queryFn: () => fetchBookingImagesByCategory(bookingId, category),
    enabled: Boolean(bookingId && category),
  });
}

export function useBookingImagesByCustomCategory(bookingId: number | string, customCategoryId: number) {
  return useQuery({
    queryKey: ['booking', bookingId, 'images', 'custom-category', customCategoryId],
    queryFn: () => fetchBookingImagesByCustomCategory(bookingId, customCategoryId),
    enabled: Boolean(bookingId && customCategoryId),
  });
}

export function useGroupedBookingImages(bookingId: number | string) {
  return useQuery({
    queryKey: ['booking', bookingId, 'images-grouped'],
    queryFn: () => fetchGroupedBookingImages(bookingId),
    enabled: Boolean(bookingId),
  });
}

// ==================== Image Deletion Hooks ====================

export function useDeleteBookingImage(bookingId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: number) => deleteBookingImage(bookingId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId, 'images'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId, 'images-grouped'] });
    },
  });
}

export function useDeleteAllBookingImages(bookingId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAllBookingImages(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId, 'images'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId, 'images-grouped'] });
    },
  });
}
