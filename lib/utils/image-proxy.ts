/**
 * Converts a backend image URL to use the Next.js image proxy
 * This helps avoid CORS issues when loading images from the backend API
 */
export function getProxiedImageUrl(backendImageUrl: string | undefined): string | undefined {
  if (!backendImageUrl) return undefined;
  
  // If it's already a relative URL or data URL, return as-is
  if (backendImageUrl.startsWith('/') || backendImageUrl.startsWith('data:')) {
    return backendImageUrl;
  }
  
  // Proxy the backend URL through our API route
  return `/api/proxy-image?url=${encodeURIComponent(backendImageUrl)}`;
}
