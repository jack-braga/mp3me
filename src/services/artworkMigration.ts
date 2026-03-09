import { db } from "@/db/database";
import { downloadAndStoreArtwork } from "@/services/artworkDownloader";

const MIGRATION_KEY = "mp3me:artwork-migration-done";

/**
 * One-time migration: downloads remote artwork URLs to OPFS
 * and clears the artworkUrl field so the app never depends on
 * external CDNs (which are blocked by COEP).
 *
 * Runs asynchronously in the background — does not block rendering.
 */
export async function migrateRemoteArtwork(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) return;

  const songs = await db.songs
    .filter((s) => !!s.artworkUrl && !s.artworkFileId)
    .toArray();

  if (songs.length === 0) {
    localStorage.setItem(MIGRATION_KEY, "1");
    return;
  }

  const urlToFileId = new Map<string, string>();

  for (const song of songs) {
    if (!song.artworkUrl) continue;

    const artworkFileId = await downloadAndStoreArtwork(
      song.artworkUrl,
      urlToFileId,
    );

    if (artworkFileId) {
      // Downloaded successfully — store local reference, clear remote URL
      await db.songs.update(song.id, {
        artworkFileId,
        artworkUrl: undefined,
        updatedAt: Date.now(),
      });
    } else {
      // Download failed — clear the broken URL so placeholder shows
      await db.songs.update(song.id, {
        artworkUrl: undefined,
        updatedAt: Date.now(),
      });
    }
  }

  localStorage.setItem(MIGRATION_KEY, "1");
}
