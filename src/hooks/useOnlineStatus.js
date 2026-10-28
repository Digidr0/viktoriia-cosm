import { useSyncExternalStore } from "react";
import { isOnline, subscribeToConnection } from "../utils/network";

export function useOnlineStatus() {
  return useSyncExternalStore(subscribeToConnection, isOnline, () => true);
}
