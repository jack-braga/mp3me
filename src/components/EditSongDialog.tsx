import { useState, useRef } from "react";
import type { Song } from "@/types/song";
import { updateSong } from "@/db/songRepository";
import { saveAudioFile } from "@/services/audioStorage";
import { saveImageFile } from "@/services/imageStorage";
import {
  isTranscodingNeeded,
  isTranscodingSupported,
  transcodeToMp3,
} from "@/services/transcoder";
import { generateId } from "@/lib/uuid";
import { MAX_UPLOAD_SIZE_BYTES, MAX_IMAGE_SIZE_BYTES } from "@/lib/constants";
import { getAudioDuration } from "@/lib/audioDuration";
import { useArtworkUrl } from "@/hooks/useArtworkUrl";
import { MusicNoteIcon } from "@/components/icons";

interface EditSongDialogProps {
  song: Song;
  onClose: () => void;
}

export function EditSongDialog({ song, onClose }: EditSongDialogProps) {
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [album, setAlbum] = useState(song.album ?? "");
  const [attachStatus, setAttachStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const artworkUrl = useArtworkUrl(song.artworkFileId, song.artworkUrl);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
  const displayArtwork = imagePreview ?? artworkUrl;

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

    let duration: number | undefined;
    try {
      const d = await getAudioDuration(audioBlob);
      duration = d || undefined;
    } catch {
      // Duration extraction failed, continue without it
    }

    await updateSong(song.id, { audioFileId, duration });
    setAttachStatus(null);
    onClose();
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
    await updateSong(song.id, { artworkFileId });
    setImagePreview(URL.createObjectURL(file));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 max-h-[85vh] -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
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

          {/* Artwork */}
          <div className="rounded-lg border border-dashed border-input p-3">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                {displayArtwork ? (
                  <img src={displayArtwork} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <MusicNoteIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => imageRef.current?.click()}
                className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium active:bg-muted"
              >
                {song.artworkFileId || song.artworkUrl ? "Change Artwork" : "Add Artwork"}
              </button>
            </div>
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAttachImage}
            />
          </div>

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
