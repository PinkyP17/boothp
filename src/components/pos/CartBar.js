import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { COLORS, SIZES } from "../../constants/theme";

export default function CartBar({
  itemCount,
  total,
  onPressPay,
  onPressExpand,
}) {
  if (itemCount === 0) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.infoSection}
        onPress={onPressExpand}
        activeOpacity={0.7}
      >
        <Text style={styles.itemCount}>
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </Text>
        <Text style={styles.total}>${total.toFixed(2)}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.payButton}
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
    backgroundColor: COLORS.card,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
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
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  total: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  payButton: {
    backgroundColor: COLORS.income,
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
