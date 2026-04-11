import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, CARD_SHADOW } from "../../constants/theme";

function formatDate(dateString) {
  const date = new Date(dateString);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export default function TransactionCard({ transaction }) {
  const isIncome = transaction.type === "income";

  return (
    <View style={[styles.card, CARD_SHADOW]}>
      <View
        style={[
          styles.iconBox,
          { backgroundColor: (isIncome ? COLORS.income : COLORS.expense) + "15" },
        ]}
      >
        <Ionicons
          name={isIncome ? "arrow-up" : "arrow-down"}
          size={18}
          color={isIncome ? COLORS.income : COLORS.expense}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.meta}>
          {transaction.eventName ? `${transaction.eventName} · ` : ""}
          {formatDate(transaction.date)}
        </Text>
      </View>
      <Text
        style={[
          styles.amount,
          { color: isIncome ? COLORS.income : COLORS.expense },
        ]}
      >
        {isIncome ? "+" : "-"}${transaction.amount.toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    padding: 12,
    marginBottom: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: SIZES.fontBody,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  meta: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
  },
  amount: {
    fontSize: SIZES.fontBody,
    fontWeight: "700",
  },
});
