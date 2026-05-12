import { useState, useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { initDatabase } from "./src/services/database";
import { AppStateProvider } from "./src/context/AppContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ConnectivityProvider } from "./src/context/ConnectivityContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { ToastProvider } from "./src/components/Toast";
import TabNavigator from "./src/navigation/TabNavigator";
import AuthStack from "./src/navigation/AuthStack";
import { COLORS } from "./src/constants/theme";

function RootNavigator() {
  const { isAuthenticated, isRestoring } = useAuth();
  const { isDark, colors } = useTheme();

  if (isRestoring) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <TabNavigator /> : <AuthStack />}
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
      setDbReady(true); // Still render app, API-only mode
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
      <AuthProvider>
        <ConnectivityProvider>
          <AppStateProvider>
            <ToastProvider>
              <RootNavigator />
            </ToastProvider>
          </AppStateProvider>
        </ConnectivityProvider>
      </AuthProvider>
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
