import { useState } from "react";
import type { Song } from "@/types/song";
import { usePlayerStore } from "@/stores/playerStore";
import { useArtworkUrl } from "@/hooks/useArtworkUrl";
import { formatDuration } from "@/lib/formatters";
import { deleteSong } from "@/db/songRepository";
import { removeSongFromPlaylist } from "@/db/playlistRepository";
import { MusicNoteIcon, DotsIcon } from "@/components/icons";
import { ArtworkImage } from "@/components/ArtworkImage";
import { AddToPlaylistSheet } from "@/components/AddToPlaylistSheet";

export type SongRowContext =
  | { type: "library" }
  | { type: "playlist"; playlistId: string };

interface SongRowProps {
  song: Song;
  contextQueue: Song[];
  contextName: string;
  context: SongRowContext;
  onEdit?: () => void;
}

export function SongRow({ song, contextQueue, contextName, context, onEdit }: SongRowProps) {
  const playSong = usePlayerStore((s) => s.playSong);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const [showMenu, setShowMenu] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  const artworkUrl = useArtworkUrl(song.artworkFileId, song.artworkUrl);
  const isCurrentSong = currentSong?.id === song.id;
  const hasAudio = !!song.audioFileId;

  return (
    <>
      <div
        className="flex items-center gap-3 px-4 py-2 active:bg-muted/50"
        onClick={() => hasAudio && playSong(song, contextQueue, contextName)}
        role={hasAudio ? "button" : undefined}
        tabIndex={hasAudio ? 0 : undefined}
      >
        {/* Artwork */}
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted">
          {artworkUrl ? (
            <ArtworkImage
              src={artworkUrl}
              className="h-full w-full object-cover"
              fallback={
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <MusicNoteIcon className="h-5 w-5" />
                </div>
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <MusicNoteIcon className="h-5 w-5" />
            </div>
          )}
          {!hasAudio && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-[10px] font-medium text-white">No file</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-medium ${isCurrentSong && isPlaying ? "text-primary" : ""}`}>
            {song.title}
          </p>
          <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
        </div>

        {/* Duration */}
        {song.duration && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDuration(song.duration)}
          </span>
        )}

        {/* 3-dot menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded-full p-1 text-muted-foreground active:bg-muted"
            aria-label="Song options"
          >
            <DotsIcon className="h-5 w-5" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-8 z-50 w-48 rounded-lg border border-border bg-card py-1 shadow-lg">
                {/* Add to queue */}
                {hasAudio && (
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      addToQueue(song);
                    }}
                  >
                    Add to queue
                  </button>
                )}

                {/* Add to playlist */}
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    setShowAddToPlaylist(true);
                  }}
                >
                  Add to playlist
                </button>

                {/* Edit */}
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit?.();
                  }}
                >
                  Edit
                </button>

                {/* Remove from playlist (playlist context only) */}
                {context.type === "playlist" && (
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      removeSongFromPlaylist(context.playlistId, song.id);
                    }}
                  >
                    Remove from playlist
                  </button>
                )}

                {/* Delete */}
                <button
                  className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    if (confirm(`Delete "${song.title}"?`)) {
                      deleteSong(song.id);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showAddToPlaylist && (
        <AddToPlaylistSheet songId={song.id} onClose={() => setShowAddToPlaylist(false)} />
      )}
    </>
  );
}
