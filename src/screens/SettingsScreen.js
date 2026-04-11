import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, CARD_SHADOW } from "../constants/theme";

const SETTINGS_ITEMS = [
  { label: "Theme", icon: "color-palette-outline", detail: "Light" },
  { label: "Currency", icon: "cash-outline", detail: "USD ($)" },
  { label: "Notifications", icon: "notifications-outline", detail: "Off" },
];

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.container}>
        <View style={[styles.card, CARD_SHADOW]}>
          {SETTINGS_ITEMS.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.row,
                index < SETTINGS_ITEMS.length - 1 && styles.rowBorder,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={COLORS.textSecondary}
                style={styles.icon}
              />
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.detail}>{item.detail}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.comingSoon}>
          Settings will be available in a future update.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
    paddingTop: 8,
  },
  card: {
    backgroundColor: COLORS.card,
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
    borderBottomColor: "#E0E0E0",
  },
  icon: {
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
  },
  detail: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
  },
  comingSoon: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 24,
  },
});
