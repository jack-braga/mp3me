import type { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegInstance: FFmpeg | null = null;
let loading = false;
let loadingPromise: Promise<FFmpeg> | null = null;

export function isTranscodingSupported(): boolean {
  return typeof SharedArrayBuffer !== "undefined";
}

export function isTranscodingNeeded(filename: string): boolean {
  return !filename.toLowerCase().endsWith(".mp3");
}

async function getFFmpeg(
  onProgress?: (ratio: number) => void,
): Promise<FFmpeg> {
  if (ffmpegInstance) {
    if (onProgress) {
      ffmpegInstance.on("progress", ({ progress }) => onProgress(progress));
    }
    return ffmpegInstance;
  }

  if (loading && loadingPromise) {
    const instance = await loadingPromise;
    if (onProgress) {
      instance.on("progress", ({ progress }) => onProgress(progress));
    }
    return instance;
  }

  loading = true;
  loadingPromise = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const ffmpeg = new FFmpeg();

    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => onProgress(progress));
    }

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
    await ffmpeg.load({
      coreURL: `${baseURL}/ffmpeg-core.js`,
      wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      workerURL: `${baseURL}/ffmpeg-core.worker.js`,
    });

    ffmpegInstance = ffmpeg;
    loading = false;
    return ffmpeg;
  })();

  return loadingPromise;
}

function getExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/);
  return match ? match[0] : "";
}

export async function transcodeToMp3(
  inputFile: File,
  onProgress?: (ratio: number) => void,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg(onProgress);
  const { fetchFile } = await import("@ffmpeg/util");

  const ext = getExtension(inputFile.name) || ".wav";
  const inputName = `input${ext}`;
  const outputName = "output.mp3";

  await ffmpeg.writeFile(inputName, await fetchFile(inputFile));
  await ffmpeg.exec([
    "-i",
    inputName,
    "-codec:a",
    "libmp3lame",
    "-qscale:a",
    "2",
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);

  // Clean up
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  const uint8 = new Uint8Array(data as Uint8Array<ArrayBuffer>);
  return new Blob([uint8], { type: "audio/mpeg" });
}
