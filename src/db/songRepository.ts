import { db } from "./database";
import { generateId } from "@/lib/uuid";
import type { Song } from "@/types/song";
import { deleteAudioFile } from "@/services/audioStorage";
import { deleteImageFile } from "@/services/imageStorage";

type CreateSongInput = Pick<Song, "title" | "artist"> &
  Partial<
    Pick<
      Song,
      | "album"
      | "artworkUrl"
      | "artworkFileId"
      | "duration"
      | "audioFileId"
      | "spotifyTrackId"
    >
  >;

type UpdateSongInput = Partial<
  Pick<
    Song,
    | "title"
    | "artist"
    | "album"
    | "artworkUrl"
    | "artworkFileId"
    | "duration"
    | "audioFileId"
    | "spotifyTrackId"
  >
>;

export async function createSong(input: CreateSongInput): Promise<Song> {
  const now = Date.now();
  const song: Song = {
    id: generateId(),
    title: input.title,
    artist: input.artist,
    album: input.album,
    artworkUrl: input.artworkUrl,
    artworkFileId: input.artworkFileId,
    duration: input.duration,
    audioFileId: input.audioFileId,
    spotifyTrackId: input.spotifyTrackId,
    createdAt: now,
    updatedAt: now,
  };
  await db.songs.add(song);
  return song;
}

export async function updateSong(
  id: string,
  input: UpdateSongInput,
): Promise<void> {
  await db.songs.update(id, { ...input, updatedAt: Date.now() });
}

export async function deleteSong(id: string): Promise<void> {
  const song = await db.songs.get(id);
  if (!song) return;

  // Clean up audio file from OPFS
  if (song.audioFileId) {
    await deleteAudioFile(song.audioFileId).catch(() => {});
  }

  // Clean up artwork file from OPFS
  if (song.artworkFileId) {
    await deleteImageFile(song.artworkFileId).catch(() => {});
  }

  // Remove song from all playlists that reference it
  const playlists = await db.playlists.toArray();
  const updates = playlists
    .filter((p) => p.songIds.includes(id))
    .map((p) =>
      db.playlists.update(p.id, {
        songIds: p.songIds.filter((sid) => sid !== id),
        updatedAt: Date.now(),
      }),
    );
  await Promise.all(updates);

  await db.songs.delete(id);
}

export async function getSong(id: string): Promise<Song | undefined> {
  return db.songs.get(id);
}

export async function getAllSongs(): Promise<Song[]> {
  return db.songs.orderBy("createdAt").reverse().toArray();
}

export async function findSongBySpotifyId(
  spotifyTrackId: string,
): Promise<Song | undefined> {
  return db.songs.where("spotifyTrackId").equals(spotifyTrackId).first();
}

export async function bulkCreateSongs(inputs: CreateSongInput[]): Promise<Song[]> {
  const now = Date.now();
  const songs: Song[] = inputs.map((input, i) => ({
    id: generateId(),
    title: input.title,
    artist: input.artist,
    album: input.album,
    artworkUrl: input.artworkUrl,
    artworkFileId: input.artworkFileId,
    duration: input.duration,
    audioFileId: input.audioFileId,
    spotifyTrackId: input.spotifyTrackId,
    createdAt: now + i,
    updatedAt: now + i,
  }));
  await db.songs.bulkAdd(songs);
  return songs;
}
