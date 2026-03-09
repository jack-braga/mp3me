import { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { LibraryPage } from "@/features/library/LibraryPage";
import { PlaylistsPage } from "@/features/playlists/PlaylistsPage";
import { PlaylistDetailPage } from "@/features/playlists/PlaylistDetailPage";
import { FullPlayer } from "@/features/player/FullPlayer";
import { SpotifyImportPage } from "@/features/spotify/SpotifyImportPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { handleSpotifyCallback } from "@/services/spotifyAuth";
import { migrateRemoteArtwork } from "@/services/artworkMigration";

function SpotifyCallbackHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      handleSpotifyCallback(code).then(() => {
        // Clean URL
        window.history.replaceState(
          {},
          "",
          window.location.pathname + window.location.hash,
        );
      });
    }
  }, []);
  return null;
}

export function App() {
  useEffect(() => {
    migrateRemoteArtwork().catch(console.error);
  }, []);

  return (
    <>
      <SpotifyCallbackHandler />
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/playlists" element={<PlaylistsPage />} />
            <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
            <Route path="/player" element={<FullPlayer />} />
            <Route path="/spotify" element={<SpotifyImportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/library" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </>
  );
}
