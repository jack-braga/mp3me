import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/database";

export function usePlaylists() {
  return useLiveQuery(() =>
    db.playlists.orderBy("createdAt").reverse().toArray(),
  );
}

export function usePlaylist(id: string | undefined) {
  return useLiveQuery(() => (id ? db.playlists.get(id) : undefined), [id]);
}
