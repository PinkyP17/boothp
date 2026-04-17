import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AppStateProvider } from "./src/context/AppContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import TabNavigator from "./src/navigation/TabNavigator";
import AuthStack from "./src/navigation/AuthStack";

function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? <TabNavigator /> : <AuthStack />}
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppStateProvider>
        <RootNavigator />
      </AppStateProvider>
    </AuthProvider>
  );
}
