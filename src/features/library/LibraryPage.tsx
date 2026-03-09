import { useState, useMemo, useRef } from "react";
import { useSongs } from "@/hooks/useSongs";
import { usePlayerStore } from "@/stores/playerStore";
import { createSong, deleteSong, updateSong } from "@/db/songRepository";
import { saveAudioFile } from "@/services/audioStorage";
import {
  isTranscodingNeeded,
  isTranscodingSupported,
  transcodeToMp3,
} from "@/services/transcoder";
import { generateId } from "@/lib/uuid";
import { formatDuration } from "@/lib/formatters";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";
import type { Song } from "@/types/song";

export function LibraryPage() {
  const songs = useSongs();
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
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

      // Parse basic metadata from filename
      const name = file.name.replace(/\.[^.]+$/, "");
      const parts = name.split(" - ");
      const artist = parts.length > 1 ? parts[0]!.trim() : "Unknown Artist";
      const title =
        parts.length > 1 ? parts.slice(1).join(" - ").trim() : name;

      await createSong({ title, artist, audioFileId });
    }

    setUploadStatus(null);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (songs === undefined) {
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
            <SongRow key={song.id} song={song} allSongs={filteredSongs} />
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
    </div>
  );
}

function SongRow({
  song,
  allSongs,
}: {
  song: Song;
  allSongs: Song[];
}) {
  const playSong = usePlayerStore((s) => s.playSong);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const isCurrentSong = currentSong?.id === song.id;
  const hasAudio = !!song.audioFileId;

  return (
    <>
      <div
        className="flex items-center gap-3 px-4 py-2 active:bg-muted/50"
        onClick={() => hasAudio && playSong(song, allSongs)}
        role={hasAudio ? "button" : undefined}
        tabIndex={hasAudio ? 0 : undefined}
      >
        {/* Artwork */}
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted">
          {song.artworkUrl ? (
            <img src={song.artworkUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <MusicNoteIcon className="h-5 w-5" />
            </div>
          )}
          {!hasAudio && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-[10px] font-medium text-white">
                No file
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-medium ${isCurrentSong && isPlaying ? "text-primary" : ""}`}
          >
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

        {/* Menu */}
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
              <div className="absolute right-0 top-8 z-50 w-40 rounded-lg border border-border bg-card py-1 shadow-lg">
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    setShowEdit(true);
                  }}
                >
                  Edit
                </button>
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
      {showEdit && (
        <EditSongDialog song={song} onClose={() => setShowEdit(false)} />
      )}
    </>
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

function EditSongDialog({
  song,
  onClose,
}: {
  song: Song;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [album, setAlbum] = useState(song.album ?? "");
  const [attachStatus, setAttachStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;
    await updateSong(song.id, {
      title: title.trim(),
      artist: artist.trim(),
      album: album.trim() || undefined,
    });
    onClose();
  };

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      alert("File too large. Max 100MB.");
      return;
    }

    const audioFileId = generateId();
    let audioBlob: Blob = file;

    if (isTranscodingNeeded(file.name)) {
      if (!isTranscodingSupported()) {
        alert("Only MP3 files are supported in this browser.");
        return;
      }
      setAttachStatus("Transcoding...");
      try {
        audioBlob = await transcodeToMp3(file, (ratio) => {
          setAttachStatus(`Transcoding... ${Math.round(ratio * 100)}%`);
        });
      } catch {
        alert("Transcoding failed. Try an MP3 file.");
        setAttachStatus(null);
        return;
      }
    }

    setAttachStatus("Saving...");
    await saveAudioFile(audioFileId, audioBlob);
    await updateSong(song.id, { audioFileId });
    setAttachStatus(null);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Edit Song</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="text"
            placeholder="Artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="text"
            placeholder="Album"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {/* Attach audio file */}
          <div className="rounded-lg border border-dashed border-input p-3">
            {song.audioFileId ? (
              <p className="text-center text-xs text-muted-foreground">
                Audio file attached
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-lg bg-secondary px-3 py-2 text-sm font-medium active:bg-muted"
                >
                  Attach Audio File
                </button>
                {attachStatus && (
                  <p className="mt-2 text-center text-xs text-primary">
                    {attachStatus}
                  </p>
                )}
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleAttachFile}
            />
          </div>

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
              Save
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function MusicNoteIcon({ className }: { className?: string }) {
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
      <circle cx="8" cy="18" r="4" />
      <path d="M12 18V2l7 4" />
    </svg>
  );
}

function DotsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}
