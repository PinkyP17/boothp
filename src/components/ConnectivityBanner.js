import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useConnectivity } from "../context/ConnectivityContext";

const BANNER_CONFIG = {
  offline: {
    bg: "#FFF3CD",
    color: "#856404",
    icon: "cloud-offline-outline",
    text: "Offline Mode",
  },
  syncing: {
    bg: "#CCE5FF",
    color: "#004085",
    icon: "sync-outline",
    text: "Syncing...",
  },
  synced: {
    bg: "#D4EDDA",
    color: "#155724",
    icon: "checkmark-circle-outline",
    text: "Synced!",
  },
  error: {
    bg: "#F8D7DA",
    color: "#721C24",
    icon: "alert-circle-outline",
    text: "Sync failed",
  },
};

export default function ConnectivityBanner() {
  const { isOnline, syncStatus } = useConnectivity();

  let config = null;
  if (!isOnline) {
    config = BANNER_CONFIG.offline;
  } else if (syncStatus === "syncing") {
    config = BANNER_CONFIG.syncing;
  } else if (syncStatus === "synced") {
    config = BANNER_CONFIG.synced;
  } else if (syncStatus === "error") {
    config = BANNER_CONFIG.error;
  }

  if (!config) return null;

  return (
    <View style={[styles.banner, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={16} color={config.color} />
      <Text style={[styles.text, { color: config.color }]}>{config.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
});
