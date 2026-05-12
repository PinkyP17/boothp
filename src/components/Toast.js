import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { StyleSheet, Text, View, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../constants/theme";

const ToastContext = createContext();

const TOAST_CONFIG = {
  error: { bg: "#F8D7DA", color: "#721C24", icon: "alert-circle-outline" },
  success: { bg: "#D4EDDA", color: "#155724", icon: "checkmark-circle-outline" },
  warning: { bg: "#FFF3CD", color: "#856404", icon: "warning-outline" },
  info: { bg: "#CCE5FF", color: "#004085", icon: "information-circle-outline" },
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = "error", duration = 3000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, duration);
  }, [fadeAnim]);

  const config = toast ? TOAST_CONFIG[toast.type] || TOAST_CONFIG.error : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[styles.container, { backgroundColor: config.bg, opacity: fadeAnim }]}
          pointerEvents="none"
        >
          <Ionicons name={config.icon} size={18} color={config.color} />
          <Text style={[styles.text, { color: config.color }]}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 9999,
  },
  text: {
    flex: 1,
    fontSize: SIZES.fontBody - 1,
    fontWeight: "600",
  },
});
