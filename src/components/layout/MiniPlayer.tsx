import { usePlayerStore } from "@/stores/playerStore";
import { useArtworkUrl } from "@/hooks/useArtworkUrl";
import { useNavigate } from "react-router-dom";
import { MusicNoteIcon, PlayIcon, PauseIcon, NextIcon } from "@/components/icons";

export function MiniPlayer() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const next = usePlayerStore((s) => s.next);
  const navigate = useNavigate();

  const artworkUrl = useArtworkUrl(currentSong?.artworkFileId, currentSong?.artworkUrl);

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="border-t border-border bg-card">
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className="flex items-center gap-3 px-4 py-2"
        onClick={() => navigate("/player")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") navigate("/player");
        }}
      >
        {/* Artwork */}
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
          {artworkUrl ? (
            <img
              src={artworkUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <MusicNoteIcon className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Song info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{currentSong.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {currentSong.artist}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              isPlaying ? pause() : resume();
            }}
            className="rounded-full p-2 text-foreground active:bg-muted"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="rounded-full p-2 text-foreground active:bg-muted"
            aria-label="Next"
          >
            <NextIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
