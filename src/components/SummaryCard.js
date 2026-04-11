import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { COLORS, SIZES, CARD_SHADOW } from "../constants/theme";

export default function SummaryCard({
  title,
  amount,
  color,
  fullWidth,
  format = "currency",
  onPress,
}) {
  const displayAmount =
    format === "number" ? `${amount}` : `$${amount.toFixed(2)}`;

  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <Wrapper
      style={[styles.card, CARD_SHADOW, fullWidth && styles.fullWidth]}
      {...wrapperProps}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.amount, { color }]}>{displayAmount}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    padding: SIZES.padding,
    width: "48%",
    marginBottom: 12,
  },
  fullWidth: {
    width: "100%",
  },
  title: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: SIZES.fontTitle,
    fontWeight: "700",
  },
});
