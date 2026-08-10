import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, CARD_SHADOW } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";

function formatDate(dateString) {
  const date = new Date(dateString);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export default function TransactionCard({ transaction }) {
  const { colors: C } = useTheme();
  const isIncome = transaction.type === "income";

  return (
    <View style={[styles.card, CARD_SHADOW, { backgroundColor: C.card }]}>
      <View
        style={[
          styles.iconBox,
          { backgroundColor: (isIncome ? C.income : C.expense) + "15" },
        ]}
      >
        <Ionicons
          name={isIncome ? "arrow-up" : "arrow-down"}
          size={18}
          color={isIncome ? C.income : C.expense}
        />
      </View>
      <View style={styles.info}>
        <Text style={[styles.description, { color: C.textPrimary }]} numberOfLines={1}>
          {transaction.description}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: C.textSecondary }]}>
            {transaction.eventName ? `${transaction.eventName} · ` : ""}
            {formatDate(transaction.date)}
          </Text>
          {isIncome && transaction.paymentMethod ? (
            <View style={[styles.paymentPill, {
              backgroundColor: transaction.paymentMethod === "cash" ? "#FF950015" : C.primary + "15",
            }]}>
              <Text style={[styles.paymentText, {
                color: transaction.paymentMethod === "cash" ? "#FF9500" : C.primary,
              }]}>
                {transaction.paymentMethod === "cash" ? "Cash" : "QR"}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text
        style={[
          styles.amount,
          { color: isIncome ? C.income : C.expense },
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
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  meta: {
    fontSize: SIZES.fontCaption,
  },
  paymentPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  paymentText: {
    fontSize: SIZES.fontCaption - 1,
    fontWeight: "600",
  },
  amount: {
    fontSize: SIZES.fontBody,
    fontWeight: "700",
  },
});
