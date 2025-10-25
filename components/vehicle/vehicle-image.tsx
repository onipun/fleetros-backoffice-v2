'use client';

import { Car } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface VehicleImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Optimized vehicle image component following Next.js best practices:
 * - Uses Next.js Image for automatic optimization
 * - Direct image loading from configured remote patterns
 * - Lazy loading by default (priority prop for above-the-fold images)
 * - Responsive sizing with srcset
 * - Placeholder while loading
 * - Error state with fallback
 * - Prevents layout shift with aspect ratio
 * - Automatic WebP/AVIF format conversion
 * - Automatic quality optimization
 */
export function VehicleImage({ 
  src, 
  alt, 
  className = '',
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
}: VehicleImageProps) {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // No image or error state - show placeholder
  if (!src || error) {
    return (
      <div className={`relative bg-muted flex items-center justify-center ${className}`}>
        <Car className="h-12 w-12 text-muted-foreground/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted-foreground/70">No Image</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* Next.js optimized image - loads directly from backend with automatic optimization */}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover transition-opacity duration-300"
        style={{ 
          opacity: isLoading ? 0 : 1,
        }}
        quality={85} // Balance between quality and file size
        priority={priority} // For above-the-fold images
        onLoad={() => setIsLoading(false)}
        onError={() => {
          console.error('Failed to load image:', src);
          setError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
