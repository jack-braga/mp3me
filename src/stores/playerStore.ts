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
  userQueue: Song[];
  contextName: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  seekTarget: number | null;

  playSong: (song: Song, contextQueue?: Song[], contextName?: string) => Promise<void>;
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
  addToQueue: (song: Song) => void;
  removeFromUserQueue: (index: number) => void;
  clearUserQueue: () => void;
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

async function loadSongAudio(
  song: Song,
  prevUrl: string | null,
): Promise<{ url: string } | null> {
  if (prevUrl) URL.revokeObjectURL(prevUrl);
  if (!song.audioFileId) return null;
  const url = await getAudioFileUrl(song.audioFileId);
  if (!url) return null;
  return { url };
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  currentAudioUrl: null,
  queue: [],
  queueIndex: -1,
  originalQueue: [],
  userQueue: [],
  contextName: "",
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  shuffle: false,
  repeat: "off",
  seekTarget: null,

  playSong: async (song, contextQueue, contextName) => {
    const result = await loadSongAudio(song, get().currentAudioUrl);
    if (!result) return;

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
      set({ originalQueue: original, contextName: contextName ?? "" });
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
      currentAudioUrl: result.url,
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
    const { queue, queueIndex, repeat, userQueue } = get();

    if (repeat === "one") {
      set({ seekTarget: 0 });
      return;
    }

    // Drain user queue first
    if (userQueue.length > 0) {
      const nextSong = userQueue[0]!;
      set({ userQueue: userQueue.slice(1) });
      // Play directly without replacing context queue
      (async () => {
        const result = await loadSongAudio(nextSong, get().currentAudioUrl);
        if (!result) return;
        set({
          currentSong: nextSong,
          currentAudioUrl: result.url,
          isPlaying: true,
          currentTime: 0,
          duration: 0,
        });
      })();
      return;
    }

    if (queue.length === 0) return;

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
      (async () => {
        const result = await loadSongAudio(nextSong, get().currentAudioUrl);
        if (!result) return;
        set({
          currentSong: nextSong,
          currentAudioUrl: result.url,
          queueIndex: nextIndex,
          isPlaying: true,
          currentTime: 0,
          duration: 0,
        });
      })();
    }
  },

  previous: () => {
    const { queue, queueIndex, currentTime } = get();
    if (queue.length === 0) return;

    if (currentTime > 3) {
      set({ seekTarget: 0 });
      return;
    }

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) prevIndex = queue.length - 1;

    const prevSong = queue[prevIndex];
    if (prevSong) {
      (async () => {
        const result = await loadSongAudio(prevSong, get().currentAudioUrl);
        if (!result) return;
        set({
          currentSong: prevSong,
          currentAudioUrl: result.url,
          queueIndex: prevIndex,
          isPlaying: true,
          currentTime: 0,
          duration: 0,
        });
      })();
    }
  },

  seek: (time) => set({ seekTarget: time }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  clearSeekTarget: () => set({ seekTarget: null }),

  toggleShuffle: () => {
    const { shuffle, queue, originalQueue, currentSong } = get();
    if (!shuffle) {
      const withoutCurrent = queue.filter((s) => s.id !== currentSong?.id);
      const shuffled = currentSong
        ? [currentSong, ...shuffleArray(withoutCurrent)]
        : shuffleArray(queue);
      set({ shuffle: true, originalQueue: queue, queue: shuffled, queueIndex: 0 });
    } else {
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

  addToQueue: (song) => {
    set({ userQueue: [...get().userQueue, song] });
  },

  removeFromUserQueue: (index) => {
    const uq = [...get().userQueue];
    uq.splice(index, 1);
    set({ userQueue: uq });
  },

  clearUserQueue: () => {
    set({ userQueue: [] });
  },
}));
