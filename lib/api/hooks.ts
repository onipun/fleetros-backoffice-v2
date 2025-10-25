'use client';

import { toast } from '@/hooks/use-toast';
import type { PricingTag } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hateoasClient } from './hateoas-client';

/**
 * Extract resource name and ID from a HATEOAS URL
 * Example: "/api/vehicles/123" -> { resource: "vehicles", id: "123" }
 */
function parseHateoasUrl(url: string): { resource: string; id: string } {
  // Remove base URL if present
  const path = url.replace(/^https?:\/\/[^/]+/, '');
  
  // Match pattern: /api/{resource}/{id}
  const match = path.match(/\/api\/([^/]+)\/([^/?]+)/);
  
  if (!match) {
    throw new Error(`Invalid HATEOAS URL format: ${url}`);
  }
  
  return {
    resource: match[1],
    id: match[2],
  };
}

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
      const { resource, id } = parseHateoasUrl(url);
      return hateoasClient.update<T>(resource, id, data);
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
      const { resource, id } = parseHateoasUrl(url);
      return hateoasClient.delete(resource, id);
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

/**
 * Hook to fetch all active pricing tags
 */
export function usePricingTags() {
  return useQuery({
    queryKey: ['pricing-tags'],
    queryFn: async () => {
      try {
        // Fetch all active pricing tags from the pricing-tags endpoint
        const response = await hateoasClient.getCollection<PricingTag>('pricing-tags', {
          size: 100,
          sort: 'name,asc',
        });

        // API returns _embedded.pricingTags (camelCase)
        const tags = response._embedded?.['pricingTags'] || response._embedded?.['pricing-tags'] || [];
        
        // Return tag names for autocomplete
        return tags.filter((tag: PricingTag) => tag.active).map((tag: PricingTag) => tag.name);
      } catch (error) {
        console.error('Failed to fetch pricing tags:', error);
        return [];
      }
    },
    staleTime: 60000, // Cache for 1 minute
    refetchOnMount: 'always',
  });
}

/**
 * Hook to search pricing tags by name (for autocomplete during typing)
 */
export function useSearchPricingTags(searchTerm: string) {
  return useQuery({
    queryKey: ['pricing-tags', 'search', searchTerm],
    queryFn: async () => {
      try {
        if (!searchTerm || searchTerm.trim().length === 0) {
          // If no search term, return all active tags
          const response = await hateoasClient.getCollection<PricingTag>('pricing-tags', {
            size: 100,
            sort: 'name,asc',
          });
          const tags = response._embedded?.['pricingTags'] || response._embedded?.['pricing-tags'] || [];
          return tags.filter((tag: PricingTag) => tag.active).map((tag: PricingTag) => tag.name);
        }

        // Search for tags matching the search term
        const response = await hateoasClient.getCollection<PricingTag>('pricing-tags', {
          size: 100,
          sort: 'name,asc',
        });

        const tags = response._embedded?.['pricingTags'] || response._embedded?.['pricing-tags'] || [];
        const normalizedSearch = searchTerm.toLowerCase().trim();
        
        // Filter tags by name containing search term (case-insensitive)
        return tags
          .filter((tag: PricingTag) => 
            tag.active && tag.name.toLowerCase().includes(normalizedSearch)
          )
          .map((tag: PricingTag) => tag.name);
      } catch (error) {
        console.error('Failed to search pricing tags:', error);
        return [];
      }
    },
    staleTime: 30000, // Cache for 30 seconds
    enabled: true, // Always enabled, will return all tags if searchTerm is empty
  });
}
