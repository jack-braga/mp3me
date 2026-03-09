import { create } from "zustand";
import type { Song } from "@/types/song";
import { getAudioFileUrl } from "@/services/audioStorage";

export type RepeatMode = "off" | "one" | "all";

interface PlayerState {
  currentSong: Song | null;
  currentAudioUrl: string | null;
  queue: Song[];
  queueIndex: number;
  originalQueue: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  seekTarget: number | null;

  playSong: (song: Song, contextQueue?: Song[]) => Promise<void>;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  handleTrackEnd: () => void;
  clearSeekTarget: () => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

function filterPlayableSongs(songs: Song[]): Song[] {
  return songs.filter((s) => s.audioFileId);
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  currentAudioUrl: null,
  queue: [],
  queueIndex: -1,
  originalQueue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  shuffle: false,
  repeat: "off",
  seekTarget: null,

  playSong: async (song, contextQueue) => {
    // Revoke previous URL
    const prev = get().currentAudioUrl;
    if (prev) URL.revokeObjectURL(prev);

    if (!song.audioFileId) return;

    const url = await getAudioFileUrl(song.audioFileId);
    if (!url) return;

    let queue: Song[];
    let queueIndex: number;

    if (contextQueue) {
      const playable = filterPlayableSongs(contextQueue);
      const original = playable;
      if (get().shuffle) {
        const withoutCurrent = playable.filter((s) => s.id !== song.id);
        queue = [song, ...shuffleArray(withoutCurrent)];
        queueIndex = 0;
      } else {
        queue = playable;
        queueIndex = playable.findIndex((s) => s.id === song.id);
        if (queueIndex === -1) queueIndex = 0;
      }
      set({ originalQueue: original });
    } else {
      queue = get().queue;
      queueIndex = queue.findIndex((s) => s.id === song.id);
      if (queueIndex === -1) {
        queue = [song];
        queueIndex = 0;
      }
    }

    set({
      currentSong: song,
      currentAudioUrl: url,
      queue,
      queueIndex,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
    });
  },

  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),

  next: () => {
    const { queue, queueIndex, repeat } = get();
    if (queue.length === 0) return;

    if (repeat === "one") {
      set({ seekTarget: 0 });
      return;
    }

    let nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeat === "all") {
        nextIndex = 0;
      } else {
        set({ isPlaying: false });
        return;
      }
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      get().playSong(nextSong);
      set({ queueIndex: nextIndex });
    }
  },

  previous: () => {
    const { queue, queueIndex, currentTime } = get();
    if (queue.length === 0) return;

    // If more than 3 seconds in, restart current track
    if (currentTime > 3) {
      set({ seekTarget: 0 });
      return;
    }

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) prevIndex = queue.length - 1;

    const prevSong = queue[prevIndex];
    if (prevSong) {
      get().playSong(prevSong);
      set({ queueIndex: prevIndex });
    }
  },

  seek: (time) => set({ seekTarget: time }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  clearSeekTarget: () => set({ seekTarget: null }),

  toggleShuffle: () => {
    const { shuffle, queue, originalQueue, currentSong } = get();
    if (!shuffle) {
      // Enable shuffle: shuffle queue, keep current song at front
      const withoutCurrent = queue.filter((s) => s.id !== currentSong?.id);
      const shuffled = currentSong
        ? [currentSong, ...shuffleArray(withoutCurrent)]
        : shuffleArray(queue);
      set({ shuffle: true, originalQueue: queue, queue: shuffled, queueIndex: 0 });
    } else {
      // Disable shuffle: restore original order
      const restored = originalQueue.length > 0 ? originalQueue : queue;
      const idx = currentSong
        ? restored.findIndex((s) => s.id === currentSong.id)
        : 0;
      set({ shuffle: false, queue: restored, queueIndex: Math.max(0, idx) });
    }
  },

  cycleRepeat: () => {
    const modes: RepeatMode[] = ["off", "all", "one"];
    const current = get().repeat;
    const idx = modes.indexOf(current);
    set({ repeat: modes[(idx + 1) % modes.length]! });
  },

  handleTrackEnd: () => {
    const { repeat } = get();
    if (repeat === "one") {
      set({ seekTarget: 0, isPlaying: true });
    } else {
      get().next();
    }
  },
}));
