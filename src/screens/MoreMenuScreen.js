import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, CARD_SHADOW } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

const MENU_ITEMS = [
  {
    label: "Finance",
    icon: "stats-chart-outline",
    screen: "Finance",
    colorKey: "primary",
  },
  {
    label: "Settings",
    icon: "settings-outline",
    screen: "Settings",
    colorKey: "textSecondary",
  },
  {
    label: "About the Developer",
    icon: "person-outline",
    screen: "About",
    colorKey: "textSecondary",
  },
];

export default function MoreMenuScreen({ navigation }) {
  const { colors: C } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: C.textPrimary }]}>More</Text>

        <View style={[styles.menuCard, CARD_SHADOW, { backgroundColor: C.card }]}>
          {MENU_ITEMS.map((item, index) => {
            const itemColor = C[item.colorKey];
            return (
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
                    { backgroundColor: itemColor + "15" },
                  ]}
                >
                  <Ionicons name={item.icon} size={20} color={itemColor} />
                </View>
                <Text style={[styles.menuLabel, { color: C.textPrimary }]}>{item.label}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={C.textSecondary}
                />
              </TouchableOpacity>
            );
          })}
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
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 20,
  },
  menuCard: {
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
  },
});
