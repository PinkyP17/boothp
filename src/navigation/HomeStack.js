import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import DashboardScreen from "../screens/DashboardScreen";
import FinanceScreen from "../screens/FinanceScreen";

const Stack = createNativeStackNavigator();

export default function HomeStack() {
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
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Finance"
        component={FinanceScreen}
        options={{ title: "Finance" }}
      />
    </Stack.Navigator>
  );
}
