import { useState, useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { initDatabase } from "./src/services/database";
import { AppStateProvider } from "./src/context/AppContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { ToastProvider } from "./src/components/Toast";
import TabNavigator from "./src/navigation/TabNavigator";
import { COLORS } from "./src/constants/theme";

function RootNavigator() {
  const { isDark } = useTheme();

  return (
    <NavigationContainer>
      <TabNavigator />
      <StatusBar style={isDark ? "light" : "dark"} />
    </NavigationContainer>
  );
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    try {
      initDatabase();
      setDbReady(true);
    } catch (error) {
      console.error("Database init failed:", error);
      setDbReady(true);
    }
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppStateProvider>
        <ToastProvider>
          <RootNavigator />
        </ToastProvider>
      </AppStateProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
});
