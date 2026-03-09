import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  startSpotifyLogin,
  isSpotifyConnected,
  logout,
} from "@/services/spotifyAuth";
import { fetchUserPlaylists, fetchPlaylistTracks } from "./spotifyApi";
import { createPlaylist } from "@/db/playlistRepository";
import { findSongBySpotifyId, createSong } from "@/db/songRepository";
import type { SpotifyPlaylist } from "@/types/spotify";

export function SpotifyImportPage() {
  const navigate = useNavigate();
  const [connected, setConnected] = useState(isSpotifyConnected);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connected && !playlists) {
      loadPlaylists();
    }
  }, [connected]);

  const loadPlaylists = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserPlaylists();
      setPlaylists(data);
    } catch (err) {
      setError("Failed to load playlists. Try reconnecting.");
      console.error(err);
    }
    setLoading(false);
  };

  const handleConnect = () => {
    startSpotifyLogin();
  };

  const handleDisconnect = () => {
    logout();
    setConnected(false);
    setPlaylists(null);
  };

  const togglePlaylist = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    setError(null);

    try {
      const selectedPlaylists =
        playlists?.filter((p) => selected.has(p.id)) ?? [];

      for (const sp of selectedPlaylists) {
        setImportProgress(`Importing "${sp.name}"...`);

        const tracks = await fetchPlaylistTracks(sp.id);
        const songIds: string[] = [];

        for (const track of tracks) {
          // Check if song already exists by Spotify ID
          const existing = await findSongBySpotifyId(track.id);
          if (existing) {
            songIds.push(existing.id);
            continue;
          }

          // Get artwork URL (largest image)
          const artworkUrl =
            track.album.images[0]?.url ?? undefined;

          const song = await createSong({
            title: track.name,
            artist: track.artists.map((a) => a.name).join(", "),
            album: track.album.name,
            artworkUrl,
            duration: Math.round(track.duration_ms / 1000),
            spotifyTrackId: track.id,
          });

          songIds.push(song.id);
        }

        await createPlaylist({
          name: sp.name,
          description: sp.description ?? undefined,
          songIds,
        });
      }

      setImporting(false);
      setImportProgress("");
      navigate("/playlists");
    } catch (err) {
      console.error(err);
      setError("Import failed. Please try again.");
      setImporting(false);
      setImportProgress("");
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-4 pb-2 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-2 text-sm text-muted-foreground active:text-foreground"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold">Spotify Import</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Import playlists from Spotify. Songs are imported as metadata only —
          attach audio files later.
        </p>
      </div>

      {error && (
        <div className="mx-4 mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4">
        {!connected ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <SpotifyIcon className="h-16 w-16 text-[#1DB954]" />
            <p className="text-center text-sm text-muted-foreground">
              Connect your Spotify account to import playlists.
            </p>
            <button
              onClick={handleConnect}
              className="rounded-full bg-[#1DB954] px-6 py-2.5 text-sm font-semibold text-black active:opacity-80"
            >
              Connect Spotify
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            Loading playlists...
          </div>
        ) : importing ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">{importProgress}</p>
          </div>
        ) : (
          <>
            {/* Connected state header */}
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-[#1DB954]">Connected</span>
              <button
                onClick={handleDisconnect}
                className="text-sm text-muted-foreground underline active:text-foreground"
              >
                Disconnect
              </button>
            </div>

            {/* Playlist picker */}
            {playlists && playlists.length > 0 ? (
              <>
                <p className="mb-2 text-sm text-muted-foreground">
                  Select playlists to import ({selected.size} selected)
                </p>
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="flex items-center gap-3 rounded-lg py-2 active:bg-muted/50"
                    onClick={() => togglePlaylist(playlist.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        selected.has(playlist.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground"
                      }`}
                    >
                      {selected.has(playlist.id) && (
                        <CheckIcon className="h-3 w-3" />
                      )}
                    </div>

                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                      {playlist.images[0]?.url ? (
                        <img
                          src={playlist.images[0].url}
                          alt=""
                          className="h-full w-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                          ?
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {playlist.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {playlist.tracks.total} tracks
                      </p>
                    </div>
                  </div>
                ))}

                {/* Import button */}
                {selected.size > 0 && (
                  <div className="sticky bottom-0 bg-background py-4">
                    <button
                      onClick={handleImport}
                      className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground active:opacity-80"
                    >
                      Import {selected.size} playlist
                      {selected.size !== 1 ? "s" : ""}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No playlists found.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
