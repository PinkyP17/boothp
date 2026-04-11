import { useState, useMemo } from "react";
import { StyleSheet, Text, View, ScrollView, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SIZES } from "../constants/theme";
import { useAppState } from "../context/AppContext";
import FinanceSummary from "../components/finance/FinanceSummary";
import FinanceChart from "../components/finance/FinanceChart";
import FilterTabs from "../components/finance/FilterTabs";
import TransactionCard from "../components/finance/TransactionCard";

export default function FinanceScreen({ route }) {
  const { state } = useAppState();
  const initialFilter = route?.params?.filter || "All";
  const [filter, setFilter] = useState(initialFilter);

  const { income, expenses, netProfit, transactions, chartData } =
    useMemo(() => {
      const incomeTotal = state.sales.reduce((sum, s) => sum + s.total, 0);
      const expenseTotal = state.events.reduce(
        (sum, ev) => sum + ev.expenses.reduce((s, exp) => s + exp.amount, 0),
        0,
      );

      // Build income transactions from sales
      const incomeTransactions = state.sales.map((sale) => ({
        id: sale.id,
        type: "income",
        description:
          sale.items.map((i) => `${i.name} x${i.quantity}`).join(", "),
        amount: sale.total,
        date: sale.date,
        eventName: null,
      }));

      // Build expense transactions from event expenses
      const expenseTransactions = state.events.flatMap((event) =>
        event.expenses.map((exp) => ({
          id: exp.id,
          type: "expense",
          description: exp.category,
          amount: exp.amount,
          date: exp.date || event.date,
          eventName: event.name,
        })),
      );

      const allTransactions = [...incomeTransactions, ...expenseTransactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      // Chart data — aggregate by event
      const eventMap = {};
      state.events.forEach((event) => {
        eventMap[event.id] = {
          name: event.name.length > 8
            ? event.name.substring(0, 8) + "…"
            : event.name,
          income: 0,
          expenses: event.expenses.reduce((s, exp) => s + exp.amount, 0),
        };
      });

      // For chart, we just show overall totals if no per-event sales tracking
      const chartLabels = Object.values(eventMap).map((e) => e.name);
      const chartIncome = Object.values(eventMap).map((e) => e.income);
      const chartExpenses = Object.values(eventMap).map((e) => e.expenses);

      // If there are sales, add an "Sales" bar
      if (incomeTotal > 0) {
        chartLabels.unshift("Sales");
        chartIncome.unshift(incomeTotal);
        chartExpenses.unshift(0);
      }

      return {
        income: incomeTotal,
        expenses: expenseTotal,
        netProfit: incomeTotal - expenseTotal,
        transactions: allTransactions,
        chartData: {
          labels: chartLabels,
          incomeData: chartIncome,
          expenseData: chartExpenses,
        },
      };
    }, [state.sales, state.events]);

  const filteredTransactions = useMemo(() => {
    if (filter === "Income") return transactions.filter((t) => t.type === "income");
    if (filter === "Expenses") return transactions.filter((t) => t.type === "expense");
    return transactions;
  }, [transactions, filter]);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <FinanceSummary
          income={income}
          expenses={expenses}
          netProfit={netProfit}
        />

        <FilterTabs selected={filter} onSelect={setFilter} />

        <FinanceChart
          incomeData={chartData.incomeData}
          expenseData={chartData.expenseData}
          labels={chartData.labels}
          filter={filter}
        />

        <Text style={styles.sectionTitle}>Transactions</Text>
        {filteredTransactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet</Text>
        ) : (
          filteredTransactions.map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingVertical: 20,
  },
  bottomSpacer: {
    height: 24,
  },
});
