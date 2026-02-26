import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      toast.dismiss("network-status");
      toast.success("You're back online !", {
        icon: <Wifi />,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You're offline", {
        description: "Check your internet connection.",
        id: "network-status",
        icon: <WifiOff />,
        duration: Infinity,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}