'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Package } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface OfferingImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Optimized offering image component following Next.js best practices:
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
export function OfferingImage({ 
  src, 
  alt, 
  className = '',
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
}: OfferingImageProps) {
  const { t } = useLocale();
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Validate image URL - check if it matches allowed patterns
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      
      // Allow localhost:8082 and localhost:8083
      if (urlObj.hostname === 'localhost' && (urlObj.port === '8082' || urlObj.port === '8083')) {
        return true;
      }
      
      // Allow common cloud storage providers
      const allowedPatterns = [
        /\.amazonaws\.com$/,
        /\.cloudfront\.net$/,
        /\.blob\.core\.windows\.net$/,
        /\.azure\.com$/,
        /storage\.googleapis\.com$/,
        /\.storage\.googleapis\.com$/,
      ];
      
      return allowedPatterns.some(pattern => pattern.test(urlObj.hostname));
    } catch {
      return false;
    }
  };

  const isValid = isValidImageUrl(src);

  // No image, invalid URL, or error state - show placeholder
  if (!src || !isValid || error) {
    return (
      <div className={`relative bg-muted flex items-center justify-center ${className}`}>
        <Package className="h-12 w-12 text-muted-foreground/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted-foreground/70">
            {!src ? t('offering.noImage') : 'Invalid image URL'}
          </span>
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
