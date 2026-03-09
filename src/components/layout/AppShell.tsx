import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { MiniPlayer } from "./MiniPlayer";
import { useAudioEngine } from "@/features/player/useAudioEngine";

export function AppShell() {
  useAudioEngine();

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}
