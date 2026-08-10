// Priority: EXPO_PUBLIC_API_URL env var (set in .env or eas.json), then local dev fallback.
// For local dev on a physical device, set the fallback to your computer's LAN IP
// (find it with: ipconfig on Windows, ifconfig on Mac/Linux).
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.3:8080";
