'use client';

import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hateoasClient } from './hateoas-client';

export interface UseCollectionOptions {
  page?: number;
  size?: number;
  sort?: string;
  filters?: Record<string, any>;
}

export function useCollection<T>(
  rel: string,
  options: UseCollectionOptions = {}
) {
  return useQuery({
    queryKey: [rel, options],
    queryFn: async () => {
      const result = await hateoasClient.getCollection<T>(rel, options);
      return result;
    },
  });
}

export function useResource<T>(url?: string) {
  return useQuery({
    queryKey: ['resource', url],
    queryFn: async () => {
      if (!url) throw new Error('URL is required');
      return hateoasClient.getResource<T>(url);
    },
    enabled: !!url,
  });
}

export function useCreateResource<T>(rel: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<T>) => {
      return hateoasClient.create<T>(rel, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [rel] });
      toast({
        title: 'Success',
        description: 'Resource created successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateResource<T>(rel: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ url, data }: { url: string; data: Partial<T> }) => {
      return hateoasClient.update<T>(url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [rel] });
      toast({
        title: 'Success',
        description: 'Resource updated successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteResource(rel: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string) => {
      return hateoasClient.delete(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [rel] });
      toast({
        title: 'Success',
        description: 'Resource deleted successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useSearch<T>(
  rel: string,
  searchMethod: string,
  params: Record<string, any>
) {
  return useQuery({
    queryKey: [rel, 'search', searchMethod, params],
    queryFn: async () => {
      return hateoasClient.search<T>(rel, searchMethod, params);
    },
  });
}
