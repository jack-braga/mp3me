import Dexie, { type Table } from "dexie";
import type { Song } from "@/types/song";
import type { Playlist } from "@/types/playlist";

export class Mp3meDB extends Dexie {
  songs!: Table<Song, string>;
  playlists!: Table<Playlist, string>;

  constructor() {
    super("mp3me");

    this.version(1).stores({
      songs: "id, title, artist, album, spotifyTrackId, createdAt",
      playlists: "id, name, createdAt",
    });
  }
}

export const db = new Mp3meDB();
