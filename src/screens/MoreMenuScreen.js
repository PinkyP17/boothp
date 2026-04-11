import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, CARD_SHADOW } from "../constants/theme";

const MENU_ITEMS = [
  {
    label: "Finance",
    icon: "stats-chart-outline",
    screen: "Finance",
    color: COLORS.primary,
  },
  {
    label: "Settings",
    icon: "settings-outline",
    screen: "Settings",
    color: COLORS.textSecondary,
  },
  {
    label: "About the Developer",
    icon: "person-outline",
    screen: "About",
    color: COLORS.textSecondary,
  },
];

export default function MoreMenuScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>More</Text>

        <View style={[styles.menuCard, CARD_SHADOW]}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.screen}
              style={[
                styles.menuItem,
                index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
              ]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.6}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: item.color + "15" },
                ]}
              >
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.textSecondary}
              />
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
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 20,
  },
  menuCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: SIZES.fontBody,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
});
