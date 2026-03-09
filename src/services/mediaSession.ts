import type { Song } from "@/types/song";

export function updateMediaSessionMetadata(song: Song): void {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.artist,
    album: song.album ?? "",
    artwork: song.artworkUrl
      ? [
          { src: song.artworkUrl, sizes: "96x96", type: "image/jpeg" },
          { src: song.artworkUrl, sizes: "256x256", type: "image/jpeg" },
          { src: song.artworkUrl, sizes: "512x512", type: "image/jpeg" },
        ]
      : [],
  });
}

export function updateMediaSessionPosition(
  duration: number,
  position: number,
): void {
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: 1,
      position: Math.min(position, duration),
    });
  } catch {
    // Position state not supported or invalid values
  }
}

export function setMediaSessionHandlers(handlers: {
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeekTo: (time: number) => void;
}): void {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.setActionHandler("play", handlers.onPlay);
  navigator.mediaSession.setActionHandler("pause", handlers.onPause);
  navigator.mediaSession.setActionHandler("nexttrack", handlers.onNext);
  navigator.mediaSession.setActionHandler("previoustrack", handlers.onPrev);
  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (details.seekTime != null) handlers.onSeekTo(details.seekTime);
  });
}
