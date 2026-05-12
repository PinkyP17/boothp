import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { subscribeToConnectivity } from "../services/connectivityService";

const ConnectivityContext = createContext();

export function ConnectivityProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // null | "syncing" | "synced" | "error"
  const syncFnRef = useRef(null);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeToConnectivity((online) => {
      setIsOnline((prev) => {
        if (!prev && online && wasOfflineRef.current) {
          // Came back online — trigger sync
          if (syncFnRef.current) {
            syncFnRef.current();
          }
        }
        wasOfflineRef.current = !online;
        return online;
      });
    });
    return unsubscribe;
  }, []);

  const registerSyncFunction = useCallback((fn) => {
    syncFnRef.current = fn;
  }, []);

  const triggerSync = useCallback(async (syncFn) => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncStatus("syncing");
    try {
      await syncFn();
      setSyncStatus("synced");
      setTimeout(() => setSyncStatus(null), 2000);
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncStatus("error");
      setTimeout(() => setSyncStatus(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  return (
    <ConnectivityContext.Provider
      value={{
        isOnline,
        isSyncing,
        syncStatus,
        triggerSync,
        registerSyncFunction,
      }}
    >
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity() {
  const context = useContext(ConnectivityContext);
  if (!context) {
    throw new Error("useConnectivity must be used within a ConnectivityProvider");
  }
  return context;
}
