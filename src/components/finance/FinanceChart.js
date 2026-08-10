import { StyleSheet, View, Text, Dimensions } from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import { SIZES, CARD_SHADOW } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - SIZES.padding * 2 - 24;

function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}`;
}

const PIE_COLORS = [
  "#4A90D9",
  "#FF3B30",
  "#FF9500",
  "#34C759",
  "#AF52DE",
  "#FF2D55",
  "#5AC8FA",
  "#FFCC00",
];

export default function FinanceChart({
  revenueByDay,
  expenseByDay,
  expenseByCategory,
  incomeByEvent,
  eventROI,
  totalIncome,
  totalExpenses,
  filter,
}) {
  const { colors: C } = useTheme();

  const chartConfig = {
    backgroundColor: C.card,
    backgroundGradientFrom: C.card,
    backgroundGradientTo: C.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(74, 144, 217, ${opacity})`,
    labelColor: () => C.textSecondary,
    propsForBackgroundLines: { stroke: C.background },
    barPercentage: 0.6,
  };

  const hasRevenue = Object.keys(revenueByDay || {}).length > 0;
  const hasExpenses = Object.keys(expenseByCategory || {}).length > 0;
  const hasEvents = (eventROI || []).some(
    (e) => e.income > 0 || e.expenses > 0,
  );
  const hasIncomeByEvent = Object.keys(incomeByEvent || {}).length > 0;
  const hasTotals = (totalIncome || 0) > 0 || (totalExpenses || 0) > 0;

  if (!hasRevenue && !hasExpenses && !hasEvents && !hasTotals) {
    return (
      <View
        style={[
          styles.emptyContainer,
          CARD_SHADOW,
          { backgroundColor: C.card },
        ]}
      >
        <Text style={[styles.emptyText, { color: C.textSecondary }]}>
          No chart data yet
        </Text>
        <Text style={[styles.emptySubtext, { color: C.textSecondary }]}>
          Make some sales or add expenses to see charts
        </Text>
      </View>
    );
  }

  // Revenue over time
  const sortedDays = Object.keys(revenueByDay || {})
    .sort()
    .slice(-7);
  const revenueLabels = sortedDays.map(formatShortDate);
  const revenueData = sortedDays.map((d) => revenueByDay[d]);

  // Expense breakdown
  const expCategories = Object.keys(expenseByCategory || {});
  const expTotal = Object.values(expenseByCategory || {}).reduce(
    (s, v) => s + v,
    0,
  );

  // Income by event breakdown
  const incEventNames = Object.keys(incomeByEvent || {});
  const incEventTotal = Object.values(incomeByEvent || {}).reduce(
    (s, v) => s + v,
    0,
  );

  // Event ROI
  const eventsWithData = (eventROI || []).filter(
    (e) => e.income > 0 || e.expenses > 0,
  );

  // Income vs Expenses comparison
  const incomeVal = totalIncome || 0;
  const expenseVal = totalExpenses || 0;
  const maxVal = Math.max(incomeVal, expenseVal, 1);
  const incomePct = (incomeVal / maxVal) * 100;
  const expensePct = (expenseVal / maxVal) * 100;

  return (
    <View>
      {/* Income vs Expenses Comparison */}
      {(filter === "Income" || filter === "Expenses") && hasTotals && (
        <View
          style={[styles.chartCard, CARD_SHADOW, { backgroundColor: C.card }]}
        >
          <Text style={[styles.chartTitle, { color: C.textPrimary }]}>
            Income vs Expenses
          </Text>
          <View style={styles.comparisonContainer}>
            {/* Income bar */}
            <View style={styles.comparisonRow}>
              <Text style={[styles.comparisonLabel, { color: C.textPrimary }]}>
                Income
              </Text>
              <View
                style={[
                  styles.comparisonTrack,
                  { backgroundColor: C.background },
                ]}
              >
                <View
                  style={[
                    styles.comparisonFill,
                    { width: `${incomePct}%`, backgroundColor: C.income },
                  ]}
                />
              </View>
              <Text style={[styles.comparisonValue, { color: C.income }]}>
                ${incomeVal.toFixed(0)}
              </Text>
            </View>
            {/* Expense bar */}
            <View style={styles.comparisonRow}>
              <Text style={[styles.comparisonLabel, { color: C.textPrimary }]}>
                Expenses
              </Text>
              <View
                style={[
                  styles.comparisonTrack,
                  { backgroundColor: C.background },
                ]}
              >
                <View
                  style={[
                    styles.comparisonFill,
                    { width: `${expensePct}%`, backgroundColor: C.expense },
                  ]}
                />
              </View>
              <Text style={[styles.comparisonValue, { color: C.expense }]}>
                ${expenseVal.toFixed(0)}
              </Text>
            </View>
            {/* Net indicator */}
            <View style={[styles.netRow, { borderTopColor: C.background }]}>
              <Text style={[styles.netLabel, { color: C.textSecondary }]}>
                Net Profit
              </Text>
              <Text
                style={[
                  styles.netValue,
                  { color: incomeVal - expenseVal >= 0 ? C.income : C.expense },
                ]}
              >
                {incomeVal - expenseVal >= 0 ? "+" : ""}$
                {(incomeVal - expenseVal).toFixed(0)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Revenue Line Chart */}
      {filter !== "Expenses" && hasRevenue && (
        <View
          style={[styles.chartCard, CARD_SHADOW, { backgroundColor: C.card }]}
        >
          <Text style={[styles.chartTitle, { color: C.textPrimary }]}>
            Revenue Over Time
          </Text>
          <LineChart
            data={{
              labels: revenueLabels,
              datasets: [
                { data: revenueData, color: () => C.income, strokeWidth: 2 },
              ],
            }}
            width={CHART_WIDTH}
            height={180}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(52, 199, 89, ${opacity})`,
            }}
            bezier
            style={styles.chart}
            withInnerLines={false}
            fromZero
            yAxisLabel="$"
          />
        </View>
      )}

      {/* Income by Event Breakdown */}
      {filter === "Income" && hasIncomeByEvent && incEventTotal > 0 && (
        <View
          style={[styles.chartCard, CARD_SHADOW, { backgroundColor: C.card }]}
        >
          <Text style={[styles.chartTitle, { color: C.textPrimary }]}>
            Income by Event
          </Text>
          <View style={styles.breakdownContainer}>
            <View style={styles.barContainer}>
              {incEventNames.map((name, i) => {
                const pct = (incomeByEvent[name] / incEventTotal) * 100;
                return (
                  <View
                    key={name}
                    style={[
                      styles.barSegment,
                      {
                        width: `${pct}%`,
                        backgroundColor:
                          PIE_COLORS[(i + 3) % PIE_COLORS.length],
                      },
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.breakdownLegend}>
              {incEventNames.map((name, i) => {
                const amount = incomeByEvent[name];
                const pct = ((amount / incEventTotal) * 100).toFixed(0);
                return (
                  <View key={name} style={styles.legendRow}>
                    <View
                      style={[
                        styles.legendDot,
                        {
                          backgroundColor:
                            PIE_COLORS[(i + 3) % PIE_COLORS.length],
                        },
                      ]}
                    />
                    <Text
                      style={[styles.legendLabel, { color: C.textPrimary }]}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                    <Text
                      style={[styles.legendValue, { color: C.textSecondary }]}
                    >
                      ${amount.toFixed(0)} ({pct}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Expense Breakdown */}
      {filter === "Expenses" && hasExpenses && expTotal > 0 && (
        <View
          style={[styles.chartCard, CARD_SHADOW, { backgroundColor: C.card }]}
        >
          <Text style={[styles.chartTitle, { color: C.textPrimary }]}>
            Expense Breakdown
          </Text>
          <View style={styles.breakdownContainer}>
            <View style={styles.barContainer}>
              {expCategories.map((cat, i) => {
                const pct = (expenseByCategory[cat] / expTotal) * 100;
                return (
                  <View
                    key={cat}
                    style={[
                      styles.barSegment,
                      {
                        width: `${pct}%`,
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      },
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.breakdownLegend}>
              {expCategories.map((cat, i) => {
                const amount = expenseByCategory[cat];
                const pct = ((amount / expTotal) * 100).toFixed(0);
                return (
                  <View key={cat} style={styles.legendRow}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: PIE_COLORS[i % PIE_COLORS.length] },
                      ]}
                    />
                    <Text
                      style={[styles.legendLabel, { color: C.textPrimary }]}
                      numberOfLines={1}
                    >
                      {cat}
                    </Text>
                    <Text
                      style={[styles.legendValue, { color: C.textSecondary }]}
                    >
                      ${amount.toFixed(0)} ({pct}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Event Performance */}
      {filter === "Income" && eventsWithData.length > 0 && (
        <View
          style={[styles.chartCard, CARD_SHADOW, { backgroundColor: C.card }]}
        >
          <Text style={[styles.chartTitle, { color: C.textPrimary }]}>
            Event Performance
          </Text>
          <BarChart
            data={{
              labels: eventsWithData.map((e) => e.name),
              datasets: [{ data: eventsWithData.map((e) => e.income || 0.01) }],
            }}
            width={CHART_WIDTH}
            height={180}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(52, 199, 89, ${opacity})`,
            }}
            style={styles.chart}
            fromZero
            showValuesOnTopOfBars
            yAxisLabel="$"
          />
          <View style={styles.roiList}>
            {eventsWithData.map((evt, i) => (
              <View key={i} style={styles.roiRow}>
                <Text
                  style={[styles.roiName, { color: C.textPrimary }]}
                  numberOfLines={1}
                >
                  {evt.name}
                </Text>
                <Text
                  style={[
                    styles.roiProfit,
                    { color: evt.profit >= 0 ? C.income : C.expense },
                  ]}
                >
                  {evt.profit >= 0 ? "+" : ""}
                  {evt.profit.toFixed(0)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    borderRadius: SIZES.cardRadius,
    padding: 12,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
    marginLeft: -8,
  },
  emptyContainer: {
    borderRadius: SIZES.cardRadius,
    padding: 32,
    marginBottom: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: SIZES.fontBody,
  },
  emptySubtext: {
    fontSize: SIZES.fontCaption,
    marginTop: 4,
  },
  // Income vs Expenses comparison
  comparisonContainer: {
    gap: 12,
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  comparisonLabel: {
    width: 64,
    fontSize: SIZES.fontCaption,
    fontWeight: "500",
  },
  comparisonTrack: {
    flex: 1,
    height: 20,
    borderRadius: 10,
    overflow: "hidden",
  },
  comparisonFill: {
    height: "100%",
    borderRadius: 10,
    minWidth: 4,
  },
  comparisonValue: {
    width: 56,
    textAlign: "right",
    fontSize: SIZES.fontCaption,
    fontWeight: "700",
  },
  netRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
  netLabel: {
    fontSize: SIZES.fontCaption,
    fontWeight: "500",
  },
  netValue: {
    fontSize: SIZES.fontBody,
    fontWeight: "700",
  },
  // Breakdown styles (shared by expense + income by event)
  breakdownContainer: {
    paddingVertical: 8,
  },
  barContainer: {
    flexDirection: "row",
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  barSegment: {
    height: "100%",
  },
  breakdownLegend: {
    gap: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: SIZES.fontCaption,
  },
  legendValue: {
    fontSize: SIZES.fontCaption,
    fontWeight: "600",
  },
  roiList: {
    marginTop: 8,
    gap: 6,
  },
  roiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  roiName: {
    flex: 1,
    fontSize: SIZES.fontCaption,
  },
  roiProfit: {
    fontSize: SIZES.fontCaption,
    fontWeight: "700",
  },
});
