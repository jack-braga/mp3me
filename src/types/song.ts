export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
  artworkFileId?: string;
  duration?: number;
  audioFileId?: string;
  spotifyTrackId?: string;
  createdAt: number;
  updatedAt: number;
}
