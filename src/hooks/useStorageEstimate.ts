import { useEffect, useState } from "react";
import { getStorageEstimate } from "@/services/audioStorage";

export function useStorageEstimate() {
  const [estimate, setEstimate] = useState<{
    usage: number;
    quota: number;
  }>({ usage: 0, quota: 0 });

  useEffect(() => {
    getStorageEstimate().then(setEstimate);

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      getStorageEstimate().then(setEstimate);
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  return estimate;
}
