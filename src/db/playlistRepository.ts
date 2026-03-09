import { db } from "./database";
import { generateId } from "@/lib/uuid";
import type { Playlist } from "@/types/playlist";

type CreatePlaylistInput = Pick<Playlist, "name"> &
  Partial<Pick<Playlist, "description" | "songIds">>;

type UpdatePlaylistInput = Partial<
  Pick<Playlist, "name" | "description" | "songIds">
>;

export async function createPlaylist(
  input: CreatePlaylistInput,
): Promise<Playlist> {
  const now = Date.now();
  const playlist: Playlist = {
    id: generateId(),
    name: input.name,
    description: input.description,
    songIds: input.songIds ?? [],
    createdAt: now,
    updatedAt: now,
  };
  await db.playlists.add(playlist);
  return playlist;
}

export async function updatePlaylist(
  id: string,
  input: UpdatePlaylistInput,
): Promise<void> {
  await db.playlists.update(id, { ...input, updatedAt: Date.now() });
}

export async function deletePlaylist(id: string): Promise<void> {
  await db.playlists.delete(id);
}

export async function getPlaylist(
  id: string,
): Promise<Playlist | undefined> {
  return db.playlists.get(id);
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  return db.playlists.orderBy("createdAt").reverse().toArray();
}

export async function addSongToPlaylist(
  playlistId: string,
  songId: string,
): Promise<void> {
  const playlist = await db.playlists.get(playlistId);
  if (!playlist) return;
  if (playlist.songIds.includes(songId)) return;

  await db.playlists.update(playlistId, {
    songIds: [...playlist.songIds, songId],
    updatedAt: Date.now(),
  });
}

export async function removeSongFromPlaylist(
  playlistId: string,
  songId: string,
): Promise<void> {
  const playlist = await db.playlists.get(playlistId);
  if (!playlist) return;

  await db.playlists.update(playlistId, {
    songIds: playlist.songIds.filter((id) => id !== songId),
    updatedAt: Date.now(),
  });
}

export async function reorderPlaylistSongs(
  playlistId: string,
  songIds: string[],
): Promise<void> {
  await db.playlists.update(playlistId, {
    songIds,
    updatedAt: Date.now(),
  });
}
