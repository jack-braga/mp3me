import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/database";
import type { Song } from "@/types/song";

export function usePlaylistSongs(songIds: string[] | undefined) {
  return useLiveQuery(async () => {
    if (!songIds || songIds.length === 0) return [];

    const songs = await db.songs.where("id").anyOf(songIds).toArray();

    // Maintain playlist order
    const songMap = new Map(songs.map((s) => [s.id, s]));
    return songIds
      .map((id) => songMap.get(id))
      .filter((s): s is Song => s !== undefined);
  }, [songIds]);
}
