import { useState } from "react";
import { useStorageEstimate } from "@/hooks/useStorageEstimate";
import { requestPersistentStorage } from "@/services/audioStorage";
import { formatFileSize } from "@/lib/formatters";
import { APP_NAME } from "@/lib/constants";
import { db } from "@/db/database";

export function SettingsPage() {
  const { usage, quota } = useStorageEstimate();
  const [persisted, setPersisted] = useState<boolean | null>(null);

  const usagePercent = quota > 0 ? (usage / quota) * 100 : 0;

  const handlePersist = async () => {
    const granted = await requestPersistentStorage();
    setPersisted(granted);
  };

  const handleClearData = async () => {
    if (
      !confirm(
        "This will delete all songs, playlists, and audio files. This cannot be undone.",
      )
    )
      return;

    // Clear Dexie
    await db.delete();

    // Clear OPFS
    try {
      const root = await navigator.storage.getDirectory();
      await (root as FileSystemDirectoryHandle).removeEntry("audio", { recursive: true }).catch(() => {});
      await (root as FileSystemDirectoryHandle).removeEntry("images", { recursive: true }).catch(() => {});
    } catch {
      // Directory may not exist
    }

    window.location.reload();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-2 pt-4">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {/* Storage */}
        <section className="py-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Storage
          </h2>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span>Used</span>
              <span className="text-muted-foreground">
                {formatFileSize(usage)} / {formatFileSize(quota)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${usagePercent > 80 ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
            {usagePercent > 80 && (
              <p className="mt-2 text-xs text-destructive">
                Storage is getting full. Consider removing unused songs.
              </p>
            )}

            <button
              onClick={handlePersist}
              className="mt-3 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium active:bg-muted"
            >
              {persisted === true
                ? "Persistent storage granted"
                : persisted === false
                  ? "Persistent storage denied"
                  : "Request persistent storage"}
            </button>
          </div>
        </section>

        {/* Danger zone */}
        <section className="py-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Danger Zone
          </h2>
          <button
            onClick={handleClearData}
            className="w-full rounded-xl border border-destructive/30 bg-card px-4 py-3 text-sm font-medium text-destructive active:bg-destructive/10"
          >
            Clear all data
          </button>
        </section>

        {/* About */}
        <section className="py-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            About
          </h2>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium">{APP_NAME}</p>
            <p className="text-xs text-muted-foreground">
              Offline-first music library and playlist manager.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">v0.0.1</p>
          </div>
        </section>
      </div>
    </div>
  );
}
