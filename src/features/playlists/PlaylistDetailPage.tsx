import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlaylist } from "@/hooks/usePlaylists";
import { usePlaylistSongs } from "@/hooks/usePlaylistSongs";
import { useSongs } from "@/hooks/useSongs";
import { usePlayerStore } from "@/stores/playerStore";
import {
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
} from "@/db/playlistRepository";
import { formatDuration } from "@/lib/formatters";
import type { Song } from "@/types/song";

export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playlist = usePlaylist(id);
  const playlistSongs = usePlaylistSongs(playlist?.songIds);
  const [showAddSongs, setShowAddSongs] = useState(false);

  const playSong = usePlayerStore((s) => s.playSong);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  if (playlist === undefined || playlistSongs === undefined) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <p>Playlist not found</p>
        <button
          onClick={() => navigate("/playlists")}
          className="text-primary underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const playableSongs = playlistSongs.filter((s) => s.audioFileId);

  const handlePlayAll = () => {
    if (playableSongs.length > 0 && playableSongs[0]) {
      playSong(playableSongs[0], playableSongs);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-4 pb-3 pt-4">
        <button
          onClick={() => navigate("/playlists")}
          className="mb-2 text-sm text-muted-foreground active:text-foreground"
        >
          &larr; Playlists
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{playlist.name}</h1>
            <p className="text-sm text-muted-foreground">
              {playlistSongs.length} song{playlistSongs.length !== 1 ? "s" : ""}
              {playableSongs.length < playlistSongs.length &&
                ` (${playableSongs.length} playable)`}
            </p>
          </div>
          <div className="flex gap-2">
            {playableSongs.length > 0 && (
              <button
                onClick={handlePlayAll}
                className="rounded-full bg-primary p-2.5 text-primary-foreground active:opacity-80"
                aria-label="Play all"
              >
                <PlayIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-3">
        <button
          onClick={() => setShowAddSongs(true)}
          className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium active:bg-muted"
        >
          + Add Songs
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete "${playlist.name}"?`)) {
              deletePlaylist(playlist.id);
              navigate("/playlists");
            }
          }}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-destructive active:bg-muted"
        >
          Delete
        </button>
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-y-auto">
        {playlistSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-muted-foreground">
            <p>No songs in this playlist.</p>
          </div>
        ) : (
          playlistSongs.map((song) => (
            <PlaylistSongRow
              key={song.id}
              song={song}
              playlistId={playlist.id}
              isCurrentSong={currentSong?.id === song.id && isPlaying}
              onPlay={() => {
                if (song.audioFileId) {
                  playSong(song, playableSongs);
                }
              }}
            />
          ))
        )}
      </div>

      {/* Add songs sheet */}
      {showAddSongs && (
        <AddSongsSheet
          playlistId={playlist.id}
          existingSongIds={playlist.songIds}
          onClose={() => setShowAddSongs(false)}
        />
      )}
    </div>
  );
}

function PlaylistSongRow({
  song,
  playlistId,
  isCurrentSong,
  onPlay,
}: {
  song: Song;
  playlistId: string;
  isCurrentSong: boolean;
  onPlay: () => void;
}) {
  const hasAudio = !!song.audioFileId;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 active:bg-muted/50"
      onClick={onPlay}
      role={hasAudio ? "button" : undefined}
      tabIndex={hasAudio ? 0 : undefined}
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {song.artworkUrl ? (
          <img src={song.artworkUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <MusicNoteIcon className="h-4 w-4" />
          </div>
        )}
        {!hasAudio && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-[9px] font-medium text-white">No file</span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${isCurrentSong ? "text-primary" : ""}`}>
          {song.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
      </div>

      {song.duration && (
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatDuration(song.duration)}
        </span>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          removeSongFromPlaylist(playlistId, song.id);
        }}
        className="rounded-full p-1 text-muted-foreground active:bg-muted"
        aria-label="Remove from playlist"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function AddSongsSheet({
  playlistId,
  existingSongIds,
  onClose,
}: {
  playlistId: string;
  existingSongIds: string[];
  onClose: () => void;
}) {
  const allSongs = useSongs();
  const [search, setSearch] = useState("");

  const availableSongs =
    allSongs?.filter(
      (s) =>
        !existingSongIds.includes(s.id) &&
        (search
          ? s.title.toLowerCase().includes(search.toLowerCase()) ||
            s.artist.toLowerCase().includes(search.toLowerCase())
          : true),
    ) ?? [];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] rounded-t-xl border-t border-border bg-card">
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <h2 className="text-lg font-semibold">Add Songs</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground active:bg-muted"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pb-3">
          <input
            type="text"
            placeholder="Search songs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
        </div>

        <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: "50vh" }}>
          {availableSongs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No songs available to add.
            </p>
          ) : (
            availableSongs.map((song) => (
              <div
                key={song.id}
                className="flex items-center gap-3 rounded-lg py-2 active:bg-muted/50"
                onClick={async () => {
                  await addSongToPlaylist(playlistId, song.id);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <MusicNoteIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{song.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {song.artist}
                  </p>
                </div>
                <span className="text-xs text-primary">+ Add</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function MusicNoteIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="8" cy="18" r="4" />
      <path d="M12 18V2l7 4" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
