import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlaylists } from "@/hooks/usePlaylists";
import {
  createPlaylist,
  deletePlaylist,
} from "@/db/playlistRepository";

export function PlaylistsPage() {
  const playlists = usePlaylists();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  if (playlists === undefined) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h1 className="text-2xl font-bold">Playlists</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/spotify")}
            className="rounded-lg bg-[#1DB954] px-3 py-1.5 text-sm font-medium text-black active:opacity-80"
          >
            Spotify
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground active:opacity-80"
          >
            + New
          </button>
        </div>
      </div>

      {/* Playlist list */}
      <div className="flex-1 overflow-y-auto">
        {playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-muted-foreground">
            <PlaylistIcon className="h-12 w-12" />
            <p>No playlists yet. Create one to get started.</p>
          </div>
        ) : (
          playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="flex items-center gap-3 px-4 py-3 active:bg-muted/50"
              onClick={() => navigate(`/playlists/${playlist.id}`)}
              role="button"
              tabIndex={0}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <PlaylistIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{playlist.name}</p>
                <p className="text-xs text-muted-foreground">
                  {playlist.songIds.length} song
                  {playlist.songIds.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${playlist.name}"?`)) {
                    deletePlaylist(playlist.id);
                  }
                }}
                className="rounded-full p-2 text-muted-foreground active:bg-muted"
                aria-label="Delete playlist"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Create dialog */}
      {showCreate && (
        <CreatePlaylistDialog
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            navigate(`/playlists/${id}`);
          }}
        />
      )}
    </div>
  );
}

function CreatePlaylistDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const playlist = await createPlaylist({ name: name.trim() });
    onCreated(playlist.id);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">New Playlist</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Playlist name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground active:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function PlaylistIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15V6" />
      <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path d="M12 12H3" />
      <path d="M16 6H3" />
      <path d="M12 18H3" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
