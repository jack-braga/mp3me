const AUDIO_DIR = "audio";

async function getAudioDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(AUDIO_DIR, { create: true });
}

function fileName(audioFileId: string): string {
  return `${audioFileId}.mp3`;
}

export async function saveAudioFile(
  audioFileId: string,
  blob: Blob,
): Promise<void> {
  const dir = await getAudioDir();
  const handle = await dir.getFileHandle(fileName(audioFileId), {
    create: true,
  });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export async function loadAudioFile(
  audioFileId: string,
): Promise<File | null> {
  try {
    const dir = await getAudioDir();
    const handle = await dir.getFileHandle(fileName(audioFileId));
    return handle.getFile();
  } catch {
    return null;
  }
}

export async function getAudioFileUrl(
  audioFileId: string,
): Promise<string | null> {
  const file = await loadAudioFile(audioFileId);
  if (!file) return null;
  return URL.createObjectURL(file);
}

export async function deleteAudioFile(audioFileId: string): Promise<void> {
  const dir = await getAudioDir();
  await dir.removeEntry(fileName(audioFileId));
}

export async function audioFileExists(audioFileId: string): Promise<boolean> {
  try {
    const dir = await getAudioDir();
    await dir.getFileHandle(fileName(audioFileId));
    return true;
  } catch {
    return false;
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage?.persist) {
    return navigator.storage.persist();
  }
  return false;
}

export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
}> {
  if (navigator.storage?.estimate) {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return { usage, quota };
  }
  return { usage: 0, quota: 0 };
}
