const IMAGE_DIR = "images";

async function getImageDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(IMAGE_DIR, { create: true });
}

function fileName(imageFileId: string): string {
  return `${imageFileId}.img`;
}

export async function saveImageFile(
  imageFileId: string,
  blob: Blob,
): Promise<void> {
  const dir = await getImageDir();
  const handle = await dir.getFileHandle(fileName(imageFileId), {
    create: true,
  });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export async function loadImageFile(
  imageFileId: string,
): Promise<File | null> {
  try {
    const dir = await getImageDir();
    const handle = await dir.getFileHandle(fileName(imageFileId));
    return handle.getFile();
  } catch {
    return null;
  }
}

export async function getImageFileUrl(
  imageFileId: string,
): Promise<string | null> {
  const file = await loadImageFile(imageFileId);
  if (!file) return null;
  return URL.createObjectURL(file);
}

export async function deleteImageFile(imageFileId: string): Promise<void> {
  const dir = await getImageDir();
  await dir.removeEntry(fileName(imageFileId));
}
