import { useState, useEffect } from "react";
import { getImageFileUrl } from "@/services/imageStorage";

// Module-level cache: artworkFileId -> blob URL
const blobUrlCache = new Map<string, string>();

export function useArtworkUrl(
  artworkFileId?: string,
  artworkUrl?: string,
): string | undefined {
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(() => {
    if (artworkFileId && blobUrlCache.has(artworkFileId)) {
      return blobUrlCache.get(artworkFileId);
    }
    // If artworkFileId exists but isn't cached yet, return undefined
    // (will resolve async). Don't fall back to artworkUrl — remote URLs
    // are blocked by COEP and would cause broken images.
    if (artworkFileId) return undefined;
    return artworkUrl;
  });

  useEffect(() => {
    if (!artworkFileId) {
      setResolvedUrl(artworkUrl);
      return;
    }

    if (blobUrlCache.has(artworkFileId)) {
      setResolvedUrl(blobUrlCache.get(artworkFileId));
      return;
    }

    let cancelled = false;
    getImageFileUrl(artworkFileId).then((url) => {
      if (cancelled) return;
      if (url) {
        blobUrlCache.set(artworkFileId, url);
        setResolvedUrl(url);
      } else {
        // OPFS file missing — show placeholder instead of broken remote URL
        setResolvedUrl(undefined);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [artworkFileId, artworkUrl]);

  return resolvedUrl;
}
