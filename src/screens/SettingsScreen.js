import { StyleSheet, Text, View, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, CARD_SHADOW } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

export default function SettingsScreen() {
  const { colors: C, isDark, toggleTheme } = useTheme();

  const settingsItems = [
    {
      label: "Dark Mode",
      icon: isDark ? "moon" : "moon-outline",
      right: (
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: "#E0E0E0", true: C.primary + "60" }}
          thumbColor={isDark ? C.primary : "#f4f3f4"}
        />
      ),
    },
    { label: "Currency", icon: "cash-outline", detail: "Per-event" },
    { label: "Notifications", icon: "notifications-outline", detail: "Coming soon" },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={["bottom"]}>
      <View style={styles.container}>
        <View style={[styles.card, CARD_SHADOW, { backgroundColor: C.card }]}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.row,
                index < settingsItems.length - 1 && [styles.rowBorder, { borderBottomColor: isDark ? "#333" : "#E0E0E0" }],
              ]}
              onPress={item.label === "Dark Mode" ? toggleTheme : undefined}
              activeOpacity={item.label === "Dark Mode" ? 0.7 : 1}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={C.textSecondary}
                style={styles.icon}
              />
              <Text style={[styles.label, { color: C.textPrimary }]}>{item.label}</Text>
              {item.right || (
                <Text style={[styles.detail, { color: C.textSecondary }]}>{item.detail}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
    paddingTop: 8,
  },
  card: {
    borderRadius: SIZES.cardRadius,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: SIZES.fontBody,
  },
  detail: {
    fontSize: SIZES.fontCaption,
  },
});
