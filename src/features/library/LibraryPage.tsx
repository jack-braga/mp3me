import { useState, useMemo, useRef } from "react";
import { useSongs } from "@/hooks/useSongs";
import { createSong } from "@/db/songRepository";
import { saveAudioFile } from "@/services/audioStorage";
import {
  isTranscodingNeeded,
  isTranscodingSupported,
  transcodeToMp3,
} from "@/services/transcoder";
import { generateId } from "@/lib/uuid";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";
import { getAudioDuration } from "@/lib/audioDuration";
import type { Song } from "@/types/song";
import { SongRow } from "@/components/SongRow";
import { EditSongDialog } from "@/components/EditSongDialog";
import { MusicNoteIcon } from "@/components/icons";

export function LibraryPage() {
  const songs = useSongs();
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSongs = useMemo(() => {
    if (!songs) return [];
    if (!search.trim()) return songs;
    const q = search.toLowerCase();
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.album?.toLowerCase().includes(q),
    );
  }, [songs, search]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        alert(`File "${file.name}" is too large. Max size is 100MB.`);
        continue;
      }

      const audioFileId = generateId();

      let audioBlob: Blob = file;

      if (isTranscodingNeeded(file.name)) {
        if (!isTranscodingSupported()) {
          alert(
            `"${file.name}" needs transcoding but SharedArrayBuffer is not available. Please upload an MP3 file instead.`,
          );
          continue;
        }
        setUploadStatus(`Transcoding "${file.name}"...`);
        try {
          audioBlob = await transcodeToMp3(file, (ratio) => {
            setUploadStatus(
              `Transcoding "${file.name}"... ${Math.round(ratio * 100)}%`,
            );
          });
        } catch (err) {
          console.error("Transcoding failed:", err);
          alert(`Failed to transcode "${file.name}". Try uploading an MP3 instead.`);
          continue;
        }
      }

      setUploadStatus(`Saving "${file.name}"...`);
      await saveAudioFile(audioFileId, audioBlob);

      // Extract duration from audio
      let duration: number | undefined;
      try {
        const d = await getAudioDuration(audioBlob);
        duration = d || undefined;
      } catch {
        // Duration extraction failed, continue without it
      }

      // Parse basic metadata from filename
      const name = file.name.replace(/\.[^.]+$/, "");
      const parts = name.split(" - ");
      const artist = parts.length > 1 ? parts[0]!.trim() : "Unknown Artist";
      const title =
        parts.length > 1 ? parts.slice(1).join(" - ").trim() : name;

      await createSong({ title, artist, audioFileId, duration });
    }

    setUploadStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (songs === undefined) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h1 className="text-2xl font-bold">Library</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium active:bg-muted"
          >
            + New
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground active:opacity-80"
          >
            Upload
          </button>
        </div>
      </div>

      {/* Upload status */}
      {uploadStatus && (
        <div className="mx-4 mb-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          {uploadStatus}
        </div>
      )}

      {/* Search */}
      <div className="px-4 pb-3">
        <input
          type="text"
          placeholder="Search songs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-y-auto">
        {filteredSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-muted-foreground">
            <MusicNoteIcon className="h-12 w-12" />
            <p className="text-center">
              {songs.length === 0
                ? "No songs yet. Upload audio files or create songs manually."
                : "No songs match your search."}
            </p>
          </div>
        ) : (
          filteredSongs.map((song) => (
            <SongRow
              key={song.id}
              song={song}
              contextQueue={filteredSongs}
              contextName="Library"
              context={{ type: "library" }}
              onEdit={() => setEditingSong(song)}
            />
          ))
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Create song dialog */}
      {showCreateDialog && (
        <CreateSongDialog onClose={() => setShowCreateDialog(false)} />
      )}

      {/* Edit song dialog */}
      {editingSong && (
        <EditSongDialog song={editingSong} onClose={() => setEditingSong(null)} />
      )}
    </div>
  );
}

function CreateSongDialog({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;
    await createSong({ title: title.trim(), artist: artist.trim() });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Create Song</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          <input
            type="text"
            placeholder="Artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              disabled={!title.trim() || !artist.trim()}
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
