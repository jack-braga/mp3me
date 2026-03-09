import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "@/stores/playerStore";
import { useArtworkUrl } from "@/hooks/useArtworkUrl";
import { formatDuration } from "@/lib/formatters";
import type { Song } from "@/types/song";
import {
  MusicNoteIcon,
  PlayIcon,
  PauseIcon,
  PrevIcon,
  NextIcon,
  ShuffleIcon,
  RepeatIcon,
  RepeatOneIcon,
  QueueIcon,
  XIcon,
} from "@/components/icons";

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

  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const userQueue = usePlayerStore((s) => s.userQueue);
  const contextName = usePlayerStore((s) => s.contextName);
  const removeFromUserQueue = usePlayerStore((s) => s.removeFromUserQueue);
  const clearUserQueue = usePlayerStore((s) => s.clearUserQueue);

  const [showQueue, setShowQueue] = useState(false);

  const artworkUrl = useArtworkUrl(currentSong?.artworkFileId, currentSong?.artworkUrl);

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

  const upcomingContext = queue.slice(queueIndex + 1);

  return (
    <div className="flex h-full flex-col px-6 pb-4 pt-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 self-start text-sm text-muted-foreground active:text-foreground"
      >
        &darr; Close
      </button>

      {!showQueue ? (
        <>
          {/* Artwork */}
          <div className="mx-auto mb-8 aspect-square w-full max-w-[300px] overflow-hidden rounded-xl bg-muted shadow-2xl">
            {artworkUrl ? (
              <img
                src={artworkUrl}
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
        </>
      ) : (
        /* Queue panel */
        <div className="flex-1 overflow-y-auto">
          {/* User queue section */}
          {userQueue.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Next in Queue
                </h3>
                <button
                  onClick={clearUserQueue}
                  className="text-xs text-muted-foreground underline"
                >
                  Clear
                </button>
              </div>
              {userQueue.map((song, index) => (
                <QueueItem
                  key={`uq-${index}-${song.id}`}
                  song={song}
                  onRemove={() => removeFromUserQueue(index)}
                />
              ))}
            </div>
          )}

          {/* Context queue section */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Next from {contextName || "Queue"}
            </h3>
            {upcomingContext.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No more songs in queue
              </p>
            ) : (
              upcomingContext.map((song, index) => (
                <QueueItem key={`cq-${index}-${song.id}`} song={song} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Queue toggle */}
      <div className="mt-auto pt-4">
        <button
          onClick={() => setShowQueue(!showQueue)}
          className={`mx-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm active:bg-muted ${showQueue ? "text-primary" : "text-muted-foreground"}`}
        >
          <QueueIcon className="h-4 w-4" />
          Queue
        </button>
      </div>
    </div>
  );
}

function QueueItem({ song, onRemove }: { song: Song; onRemove?: () => void }) {
  const artworkUrl = useArtworkUrl(song.artworkFileId, song.artworkUrl);

  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-muted">
        {artworkUrl ? (
          <img src={artworkUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <MusicNoteIcon className="h-3 w-3" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{song.title}</p>
        <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="rounded-full p-1 text-muted-foreground active:bg-muted"
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
