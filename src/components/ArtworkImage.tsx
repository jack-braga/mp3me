import { useState, useEffect } from "react";

interface ArtworkImageProps {
  src: string;
  alt?: string;
  className?: string;
  fallback: React.ReactNode;
}

/**
 * Image component with graceful error handling.
 * When the image fails to load (e.g. COEP blocks cross-origin images),
 * renders the fallback instead of a broken image.
 */
export function ArtworkImage({
  src,
  alt = "",
  className,
  fallback,
}: ArtworkImageProps) {
  const [failed, setFailed] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
