import { StyleSheet, Text, View } from "react-native";
import { COLORS, SIZES, CARD_SHADOW } from "../../constants/theme";

export default function FinanceSummary({ income, expenses, netProfit }) {
  return (
    <View style={styles.container}>
      <View style={[styles.box, CARD_SHADOW]}>
        <Text style={styles.label}>Income</Text>
        <Text style={[styles.value, { color: COLORS.income }]}>
          ${income.toFixed(2)}
        </Text>
      </View>
      <View style={[styles.box, CARD_SHADOW]}>
        <Text style={styles.label}>Expenses</Text>
        <Text style={[styles.value, { color: COLORS.expense }]}>
          ${expenses.toFixed(2)}
        </Text>
      </View>
      <View style={[styles.box, CARD_SHADOW]}>
        <Text style={styles.label}>Net</Text>
        <Text
          style={[
            styles.value,
            { color: netProfit >= 0 ? COLORS.income : COLORS.expense },
          ]}
        >
          ${netProfit.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  box: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    padding: 12,
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: SIZES.fontBody,
    fontWeight: "700",
  },
});
