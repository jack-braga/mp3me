import { getValidAccessToken, logout } from "@/services/spotifyAuth";
import type {
  SpotifyPlaylistsResponse,
  SpotifyPlaylistTracksResponse,
  SpotifyPlaylist,
  SpotifyTrack,
} from "@/types/spotify";

const API_BASE = "https://api.spotify.com/v1";

export class SpotifyAuthError extends Error {
  constructor(public status: number) {
    super(`Spotify auth error: ${status}`);
    this.name = "SpotifyAuthError";
  }
}

async function spotifyFetch<T>(endpoint: string): Promise<T> {
  const token = await getValidAccessToken();
  if (!token) throw new SpotifyAuthError(401);

  const response = await fetch(
    endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (response.status === 401 || response.status === 403) {
    logout();
    throw new SpotifyAuthError(response.status);
  }

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status}`);
  }

  return response.json();
}

export async function fetchUserPlaylists(): Promise<SpotifyPlaylist[]> {
  const playlists: SpotifyPlaylist[] = [];
  let url: string | null = "/me/playlists?limit=50";

  while (url) {
    const data: SpotifyPlaylistsResponse = await spotifyFetch<SpotifyPlaylistsResponse>(url);
    playlists.push(...data.items);
    url = data.next;
  }

  return playlists;
}

export async function fetchPlaylistTracks(
  playlistId: string,
): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = [];
  let url: string | null =
    `/playlists/${playlistId}/tracks?limit=100&fields=items(track(id,name,artists(name),album(name,images),duration_ms)),next,total`;

  while (url) {
    const data: SpotifyPlaylistTracksResponse = await spotifyFetch<SpotifyPlaylistTracksResponse>(url);
    for (const item of data.items) {
      if (item.track) {
        tracks.push(item.track);
      }
    }
    url = data.next;
  }

  return tracks;
}
