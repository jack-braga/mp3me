export interface Playlist {
  id: string;
  name: string;
  description?: string;
  artworkFileId?: string;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
}
