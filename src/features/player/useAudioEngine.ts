import { useEffect, useRef } from "react";
import { audio } from "./audioElement";
import { usePlayerStore } from "@/stores/playerStore";
import {
  updateMediaSessionMetadata,
  updateMediaSessionPosition,
  setMediaSessionHandlers,
} from "@/services/mediaSession";

export function useAudioEngine() {
  const currentAudioUrl = usePlayerStore((s) => s.currentAudioUrl);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const seekTarget = usePlayerStore((s) => s.seekTarget);

  const lastPositionUpdate = useRef(0);

  // Load new track
  useEffect(() => {
    if (!currentAudioUrl) return;
    audio.src = currentAudioUrl;
    audio.play().catch(() => {
      // Autoplay blocked — user needs to interact first
    });
  }, [currentAudioUrl]);

  // Update media session metadata
  useEffect(() => {
    if (currentSong) {
      updateMediaSessionMetadata(currentSong);
    }
  }, [currentSong]);

  // Sync play/pause
  useEffect(() => {
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Handle seek
  useEffect(() => {
    if (seekTarget !== null) {
      audio.currentTime = seekTarget;
      usePlayerStore.getState().clearSeekTarget();
    }
  }, [seekTarget]);

  // Bind audio element events
  useEffect(() => {
    const store = usePlayerStore.getState;

    const onTimeUpdate = () => {
      store().setCurrentTime(audio.currentTime);

      // Throttle media session position updates to ~1/sec
      const now = Date.now();
      if (now - lastPositionUpdate.current > 1000 && audio.duration) {
        updateMediaSessionPosition(audio.duration, audio.currentTime);
        lastPositionUpdate.current = now;
      }
    };

    const onLoadedMetadata = () => {
      store().setDuration(audio.duration);
    };

    const onEnded = () => {
      store().handleTrackEnd();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  // Media Session action handlers
  useEffect(() => {
    const store = usePlayerStore.getState;
    setMediaSessionHandlers({
      onPlay: () => store().resume(),
      onPause: () => store().pause(),
      onNext: () => store().next(),
      onPrev: () => store().previous(),
      onSeekTo: (time) => store().seek(time),
    });
  }, []);
}
