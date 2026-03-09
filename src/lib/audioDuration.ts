export function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    audio.preload = "metadata";

    audio.addEventListener("loadedmetadata", () => {
      const duration = audio.duration;
      URL.revokeObjectURL(url);
      if (!isFinite(duration) || duration <= 0) {
        resolve(0);
      } else {
        resolve(Math.round(duration));
      }
    });

    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load audio metadata"));
    });

    audio.src = url;
  });
}
