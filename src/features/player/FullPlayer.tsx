import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "@/stores/playerStore";
import { formatDuration } from "@/lib/formatters";

export function FullPlayer() {
  const navigate = useNavigate();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);

  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const seek = usePlayerStore((s) => s.seek);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);

  if (!currentSong) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <p>Nothing playing</p>
        <button
          onClick={() => navigate("/library")}
          className="text-primary underline"
        >
          Go to library
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-6 pb-4 pt-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 self-start text-sm text-muted-foreground active:text-foreground"
      >
        &darr; Close
      </button>

      {/* Artwork */}
      <div className="mx-auto mb-8 aspect-square w-full max-w-[300px] overflow-hidden rounded-xl bg-muted shadow-2xl">
        {currentSong.artworkUrl ? (
          <img
            src={currentSong.artworkUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <MusicNoteIcon className="h-20 w-20" />
          </div>
        )}
      </div>

      {/* Song info */}
      <div className="mb-6 text-center">
        <h2 className="truncate text-xl font-bold">{currentSong.title}</h2>
        <p className="truncate text-sm text-muted-foreground">
          {currentSong.artist}
        </p>
      </div>

      {/* Seek bar */}
      <div className="mb-6">
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{formatDuration(currentTime)}</span>
          <span>{duration ? formatDuration(duration) : "--:--"}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={toggleShuffle}
          className={`rounded-full p-2 ${shuffle ? "text-primary" : "text-muted-foreground"} active:bg-muted`}
          aria-label="Shuffle"
        >
          <ShuffleIcon className="h-5 w-5" />
        </button>

        <button
          onClick={previous}
          className="rounded-full p-3 text-foreground active:bg-muted"
          aria-label="Previous"
        >
          <PrevIcon className="h-7 w-7" />
        </button>

        <button
          onClick={() => (isPlaying ? pause() : resume())}
          className="rounded-full bg-foreground p-4 text-background active:opacity-80"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <PauseIcon className="h-8 w-8" />
          ) : (
            <PlayIcon className="h-8 w-8" />
          )}
        </button>

        <button
          onClick={next}
          className="rounded-full p-3 text-foreground active:bg-muted"
          aria-label="Next"
        >
          <NextIcon className="h-7 w-7" />
        </button>

        <button
          onClick={cycleRepeat}
          className={`rounded-full p-2 ${repeat !== "off" ? "text-primary" : "text-muted-foreground"} active:bg-muted`}
          aria-label={`Repeat: ${repeat}`}
        >
          {repeat === "one" ? (
            <RepeatOneIcon className="h-5 w-5" />
          ) : (
            <RepeatIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
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

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function PrevIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
    </svg>
  );
}

function NextIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  );
}

function ShuffleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H20" />
      <path d="m18 2 4 4-4 4" />
      <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
      <path d="M20 18h-3.9c-1.3 0-2.5-.6-3.3-1.7l-.5-.8" />
      <path d="m18 14 4 4-4 4" />
    </svg>
  );
}

function RepeatIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function RepeatOneIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
      <path d="M11 10h1v4" />
    </svg>
  );
}
