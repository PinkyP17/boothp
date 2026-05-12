import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SIZES } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";

export default function CartBar({
  itemCount,
  total,
  onPressPay,
  onPressExpand,
}) {
  const { colors: C } = useTheme();

  if (itemCount === 0) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: C.card, borderTopColor: C.background },
      ]}
    >
      <TouchableOpacity
        style={styles.infoSection}
        onPress={onPressExpand}
        activeOpacity={0.7}
      >
        <Text style={[styles.itemCount, { color: C.textSecondary }]}>
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </Text>
        <Text style={[styles.total, { color: C.textPrimary }]}>
          ${total.toFixed(2)}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.payButton, { backgroundColor: C.income }]}
        onPress={onPressPay}
        activeOpacity={0.8}
      >
        <Text style={styles.payText}>Pay</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoSection: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 12,
  },
  itemCount: {
    fontSize: SIZES.fontBody,
    fontWeight: "500",
  },
  total: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "700",
  },
  payButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  payText: {
    fontSize: SIZES.fontBody,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
