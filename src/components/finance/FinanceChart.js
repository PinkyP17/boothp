import { StyleSheet, View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { COLORS, SIZES, CARD_SHADOW } from "../../constants/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function FinanceChart({ incomeData, expenseData, labels, filter }) {
  const hasData =
    incomeData.some((v) => v > 0) || expenseData.some((v) => v > 0);

  if (!hasData) {
    return (
      <View style={[styles.emptyContainer, CARD_SHADOW]}>
        <Text style={styles.emptyText}>No data to display yet</Text>
      </View>
    );
  }

  const datasets = [];
  if (filter !== "Expenses") {
    datasets.push({
      data: incomeData.length > 0 ? incomeData : [0],
      color: () => COLORS.income,
      strokeWidth: 2,
    });
  }
  if (filter !== "Income") {
    datasets.push({
      data: expenseData.length > 0 ? expenseData : [0],
      color: () => COLORS.expense,
      strokeWidth: 2,
    });
  }

  return (
    <View style={[styles.container, CARD_SHADOW]}>
      <LineChart
        data={{
          labels: labels.length > 0 ? labels : [""],
          datasets,
        }}
        width={SCREEN_WIDTH - SIZES.padding * 2 - 24}
        height={200}
        chartConfig={{
          backgroundColor: COLORS.card,
          backgroundGradientFrom: COLORS.card,
          backgroundGradientTo: COLORS.card,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(74, 144, 217, ${opacity})`,
          labelColor: () => COLORS.textSecondary,
          propsForDots: {
            r: "4",
            strokeWidth: "2",
          },
          propsForBackgroundLines: {
            stroke: COLORS.background,
          },
        }}
        bezier
        style={styles.chart}
        withInnerLines={false}
        fromZero
      />
      <View style={styles.legend}>
        {filter !== "Expenses" && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.income }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
        )}
        {filter !== "Income" && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.expense }]} />
            <Text style={styles.legendText}>Expenses</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    padding: 12,
    marginBottom: 16,
  },
  emptyContainer: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    padding: 32,
    marginBottom: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
  },
  chart: {
    borderRadius: 8,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
  },
});
