import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

import HomeStack from "./HomeStack";
import InventoryScreen from "../screens/InventoryScreen";
import POSScreen from "../screens/POSScreen";
import EventsStack from "./EventsStack";
import MoreStack from "./MoreStack";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 0.5,
          borderTopColor: isDark ? "#333" : "#E0E0E0",
          height: 60,
          paddingBottom: 6,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate("Home", { screen: "Dashboard" });
          },
        })}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="POS"
        component={POSScreen}
        options={{
          tabBarIcon: ({ size }) => (
            <View style={{
              backgroundColor: colors.posButton,
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}>
              <Ionicons name="cart-outline" size={size} color="#FFFFFF" />
            </View>
          ),
          tabBarLabel: "POS",
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate("Events", { screen: "EventsList" });
          },
        })}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate("More", { screen: "MoreMenu" });
          },
        })}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
