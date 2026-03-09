import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlaylist } from "@/hooks/usePlaylists";
import { usePlaylistSongs } from "@/hooks/usePlaylistSongs";
import { useSongs } from "@/hooks/useSongs";
import { usePlayerStore } from "@/stores/playerStore";
import {
  deletePlaylist,
  updatePlaylist,
  addSongToPlaylist,
} from "@/db/playlistRepository";
import { generateId } from "@/lib/uuid";
import { MAX_IMAGE_SIZE_BYTES } from "@/lib/constants";
import { saveImageFile } from "@/services/imageStorage";
import { useArtworkUrl } from "@/hooks/useArtworkUrl";
import type { Song } from "@/types/song";
import { SongRow } from "@/components/SongRow";
import { EditSongDialog } from "@/components/EditSongDialog";
import { PlayIcon, XIcon, MusicNoteIcon, PlaylistIcon, ImageIcon } from "@/components/icons";
import { ArtworkImage } from "@/components/ArtworkImage";

export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playlist = usePlaylist(id);
  const playlistSongs = usePlaylistSongs(playlist?.songIds);
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const playSong = usePlayerStore((s) => s.playSong);

  // Playlist artwork: custom > first song's artwork > undefined
  const firstSongArtworkFileId = playlistSongs?.[0]?.artworkFileId;
  const firstSongArtworkUrl = playlistSongs?.[0]?.artworkUrl;
  const playlistArtworkUrl = useArtworkUrl(
    playlist?.artworkFileId ?? firstSongArtworkFileId,
    firstSongArtworkUrl,
  );

  if (playlist === undefined || playlistSongs === undefined) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          Loading...
        </div>
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
      playSong(playableSongs[0], playableSongs, playlist.name);
    }
  };

  const handleAttachImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      alert("Image too large. Max 10MB.");
      return;
    }
    const artworkFileId = generateId();
    await saveImageFile(artworkFileId, file);
    await updatePlaylist(playlist.id, { artworkFileId });
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
        <div className="flex items-center gap-4">
          {/* Playlist artwork */}
          <button
            onClick={() => imageRef.current?.click()}
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted active:opacity-80"
            aria-label="Change playlist artwork"
          >
            {playlistArtworkUrl ? (
              <ArtworkImage
                src={playlistArtworkUrl}
                className="h-full w-full object-cover"
                fallback={
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <PlaylistIcon className="h-6 w-6" />
                  </div>
                }
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <PlaylistIcon className="h-6 w-6" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors active:bg-black/30">
              <ImageIcon className="h-4 w-4 text-white opacity-0 transition-opacity active:opacity-100" />
            </div>
          </button>
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAttachImage}
          />

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold">{playlist.name}</h1>
            <p className="text-sm text-muted-foreground">
              {playlistSongs.length} song{playlistSongs.length !== 1 ? "s" : ""}
              {playableSongs.length < playlistSongs.length &&
                ` (${playableSongs.length} playable)`}
            </p>
          </div>
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
            <SongRow
              key={song.id}
              song={song}
              contextQueue={playableSongs}
              contextName={playlist.name}
              context={{ type: "playlist", playlistId: playlist.id }}
              onEdit={() => setEditingSong(song)}
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

      {/* Edit song dialog */}
      {editingSong && (
        <EditSongDialog song={editingSong} onClose={() => setEditingSong(null)} />
      )}
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
