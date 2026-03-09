import { getValidAccessToken, logout } from "@/services/spotifyAuth";
import type {
  SpotifyPlaylistsResponse,
  SpotifyPlaylistTracksResponse,
  SpotifyPlaylist,
  SpotifyTrack,
} from "@/types/spotify";

const API_BASE = "https://api.spotify.com/v1";

export class SpotifyAuthError extends Error {
  constructor(public status: number, message?: string) {
    super(message ?? `Spotify auth error: ${status}`);
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

  if (response.status === 401) {
    logout();
    throw new SpotifyAuthError(401);
  }

  if (!response.ok) {
    // Try to extract Spotify's error message
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.error?.message ?? "";
    } catch {
      // ignore parse errors
    }
    const msg = `Spotify API error ${response.status}${detail ? `: ${detail}` : ""}`;
    if (response.status === 403) {
      throw new SpotifyAuthError(403, msg);
    }
    throw new Error(msg);
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

/** Fetch tracks for a playlist using the /items endpoint (renamed from /tracks in Feb 2026) */
export async function fetchPlaylistTracks(
  playlistId: string,
): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = [];
  let url: string | null = `/playlists/${playlistId}/items?limit=100`;

  while (url) {
    const data: SpotifyPlaylistTracksResponse = await spotifyFetch<SpotifyPlaylistTracksResponse>(url);
    for (const entry of data.items) {
      // "item" is the new field (Feb 2026), "track" is deprecated fallback
      const trackData = entry.item ?? entry.track;
      if (trackData) {
        tracks.push(trackData);
      }
    }
    url = data.next;
  }

  return tracks;
}
