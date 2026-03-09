import type { Song } from "@/types/song";

export function updateMediaSessionMetadata(
  song: Song,
  artworkSrc?: string,
): void {
  if (!("mediaSession" in navigator)) return;

  const src = artworkSrc ?? song.artworkUrl;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.artist,
    album: song.album ?? "",
    artwork: src
      ? [
          { src, sizes: "96x96", type: "image/jpeg" },
          { src, sizes: "256x256", type: "image/jpeg" },
          { src, sizes: "512x512", type: "image/jpeg" },
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
