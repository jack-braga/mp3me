import { saveImageFile } from "@/services/imageStorage";
import { generateId } from "@/lib/uuid";

/**
 * Downloads an artwork image and stores it in OPFS.
 * Deduplicates by URL: if the same URL is requested twice within a batch,
 * returns the same artworkFileId.
 *
 * fetch() works under COEP because Spotify CDN supports CORS.
 * The COEP restriction only blocks <img> subresource loads, not JS fetch().
 */
export async function downloadAndStoreArtwork(
  url: string,
  urlToFileIdMap: Map<string, string>,
): Promise<string | undefined> {
  const existing = urlToFileIdMap.get(url);
  if (existing) return existing;

  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;

    const blob = await response.blob();
    const imageFileId = generateId();
    await saveImageFile(imageFileId, blob);

    urlToFileIdMap.set(url, imageFileId);
    return imageFileId;
  } catch {
    // Network error or OPFS error — continue without artwork
    return undefined;
  }
}
