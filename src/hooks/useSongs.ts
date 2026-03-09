import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/database";

export function useSongs() {
  return useLiveQuery(() => db.songs.orderBy("createdAt").reverse().toArray());
}

export function useSong(id: string | undefined) {
  return useLiveQuery(() => (id ? db.songs.get(id) : undefined), [id]);
}
