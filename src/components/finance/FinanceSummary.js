import { StyleSheet, Text, View } from "react-native";
import { SIZES, CARD_SHADOW } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";

export default function FinanceSummary({ income, expenses, netProfit }) {
  const { colors: C } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.box, CARD_SHADOW, { backgroundColor: C.card }]}>
        <Text style={[styles.label, { color: C.textSecondary }]}>Income</Text>
        <Text style={[styles.value, { color: C.income }]}>
          ${income.toFixed(2)}
        </Text>
      </View>
      <View style={[styles.box, CARD_SHADOW, { backgroundColor: C.card }]}>
        <Text style={[styles.label, { color: C.textSecondary }]}>Expenses</Text>
        <Text style={[styles.value, { color: C.expense }]}>
          ${expenses.toFixed(2)}
        </Text>
      </View>
      <View style={[styles.box, CARD_SHADOW, { backgroundColor: C.card }]}>
        <Text style={[styles.label, { color: C.textSecondary }]}>Net</Text>
        <Text
          style={[
            styles.value,
            { color: netProfit >= 0 ? C.income : C.expense },
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
    borderRadius: SIZES.cardRadius,
    padding: 12,
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: SIZES.fontBody,
    fontWeight: "700",
  },
});
