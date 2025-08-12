// CDN Image Loader for Atlas Platform Performance Optimization

interface CDNLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cdnLoader({ src, width, quality }: CDNLoaderProps): string {
  const cdnUrl = process.env.CDN_URL || process.env.NEXT_PUBLIC_CDN_URL;
  
  if (!cdnUrl) {
    // Fallback to default Next.js behavior
    return src;
  }

  // Handle absolute URLs
  if (src.startsWith('http')) {
    return src;
  }

  // Remove leading slash for consistency
  const normalizedSrc = src.startsWith('/') ? src.slice(1) : src;
  
  // Construct CDN URL with optimizations
  const params = new URLSearchParams();
  params.set('w', width.toString());
  
  if (quality) {
    params.set('q', quality.toString());
  }
  
  // Add format optimization
  params.set('f', 'auto'); // Auto-detect best format (WebP, AVIF, etc.)
  
  // Add optimization flags
  params.set('fit', 'cover'); // Maintain aspect ratio
  params.set('auto', 'compress'); // Auto-compress
  
  return `${cdnUrl}/images/${normalizedSrc}?${params.toString()}`;
}

// Utility function for static asset CDN URLs
export function getCDNUrl(path: string): string {
  const cdnUrl = process.env.STATIC_ASSETS_CDN || process.env.NEXT_PUBLIC_STATIC_ASSETS_CDN;
  
  if (!cdnUrl) {
    return path;
  }
  
  // Handle absolute URLs
  if (path.startsWith('http')) {
    return path;
  }
  
  // Normalize path
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `${cdnUrl}/${normalizedPath}`;
}

// Preload critical assets via CDN
export function preloadCriticalAssets(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const criticalAssets = [
    '/icons/icon-192x192.png',
    '/manifest.json',
    // Add other critical assets as needed
  ];
  
  criticalAssets.forEach(asset => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = getCDNUrl(asset);
    link.as = asset.endsWith('.png') || asset.endsWith('.jpg') ? 'image' : 'fetch';
    if (asset.endsWith('.json')) {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  });
}