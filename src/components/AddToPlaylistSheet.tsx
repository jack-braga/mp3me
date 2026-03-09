import { usePlaylists } from "@/hooks/usePlaylists";
import { addSongToPlaylist } from "@/db/playlistRepository";
import { XIcon, PlaylistIcon } from "@/components/icons";
import { useArtworkUrl } from "@/hooks/useArtworkUrl";
import type { Playlist } from "@/types/playlist";

interface AddToPlaylistSheetProps {
  songId: string;
  onClose: () => void;
}

export function AddToPlaylistSheet({ songId, onClose }: AddToPlaylistSheetProps) {
  const playlists = usePlaylists();

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] rounded-t-xl border-t border-border bg-card">
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <h2 className="text-lg font-semibold">Add to Playlist</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground active:bg-muted"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: "50vh" }}>
          {!playlists || playlists.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No playlists yet. Create one first.
            </p>
          ) : (
            playlists.map((playlist) => (
              <PlaylistItem
                key={playlist.id}
                playlist={playlist}
                onSelect={async () => {
                  await addSongToPlaylist(playlist.id, songId);
                  onClose();
                }}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

function PlaylistItem({
  playlist,
  onSelect,
}: {
  playlist: Playlist;
  onSelect: () => void;
}) {
  const artworkUrl = useArtworkUrl(playlist.artworkFileId);

  return (
    <div
      className="flex items-center gap-3 rounded-lg py-2 active:bg-muted/50"
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground">
        {artworkUrl ? (
          <img src={artworkUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <PlaylistIcon className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{playlist.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {playlist.songIds.length} song{playlist.songIds.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
