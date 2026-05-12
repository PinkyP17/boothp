import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import MoreMenuScreen from "../screens/MoreMenuScreen";
import FinanceScreen from "../screens/FinanceScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AboutScreen from "../screens/AboutScreen";

const Stack = createNativeStackNavigator();

export default function MoreStack() {
  const { colors: C } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.background },
        headerShadowVisible: false,
        headerTintColor: C.textPrimary,
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen
        name="MoreMenu"
        component={MoreMenuScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Finance"
        component={FinanceScreen}
        options={{ title: "Finance" }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: "About the Developer" }}
      />
    </Stack.Navigator>
  );
}
