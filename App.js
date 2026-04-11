import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AppStateProvider } from "./src/context/AppContext";
import TabNavigator from "./src/navigation/TabNavigator";

export default function App() {
  return (
    <AppStateProvider>
      <NavigationContainer>
        <TabNavigator />
        <StatusBar style="dark" />
      </NavigationContainer>
    </AppStateProvider>
  );
}
