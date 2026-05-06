import { useState, useEffect, useMemo } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SIZES } from "../constants/theme";
import { useAppState } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import FinanceSummary from "../components/finance/FinanceSummary";
import FinanceChart from "../components/finance/FinanceChart";
import FilterTabs from "../components/finance/FilterTabs";
import TransactionCard from "../components/finance/TransactionCard";

export default function FinanceScreen({ route }) {
  const { state, loadDashboard } = useAppState();
  const { token } = useAuth();
  const initialFilter = route?.params?.filter || "All";
  const [filter, setFilter] = useState(initialFilter);
  const dashboard = state.dashboard;

  useEffect(() => {
    if (token) {
      loadDashboard(token);
    }
  }, [token]);

  const income = dashboard?.income ?? 0;
  const expenses = dashboard?.totalExpenses ?? 0;
  const netProfit = dashboard?.netProfit ?? 0;
  const transactions = dashboard?.transactions ?? [];

  const filteredTransactions = useMemo(() => {
    if (filter === "Income")
      return transactions.filter((t) => t.type === "income");
    if (filter === "Expenses")
      return transactions.filter((t) => t.type !== "income");
    return transactions;
  }, [transactions, filter]);

  // Chart data — group by event expenses + overall sales
  const chartData = useMemo(() => {
    if (!dashboard) return { labels: [], incomeData: [], expenseData: [] };

    const labels = [];
    const incomeData = [];
    const expenseData = [];

    if (dashboard.income > 0) {
      labels.push("Sales");
      incomeData.push(Number(dashboard.income));
      expenseData.push(0);
    }

    if (dashboard.restockExpenses > 0) {
      labels.push("Restock");
      incomeData.push(0);
      expenseData.push(Number(dashboard.restockExpenses));
    }

    (dashboard.upcomingEvents || []).forEach((evt) => {
      if (Number(evt.totalExpenses) > 0) {
        const name =
          evt.name.length > 8 ? evt.name.substring(0, 8) + "…" : evt.name;
        labels.push(name);
        incomeData.push(0);
        expenseData.push(Number(evt.totalExpenses));
      }
    });

    return { labels, incomeData, expenseData };
  }, [dashboard]);

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
          filteredTransactions.map((transaction, index) => (
            <TransactionCard
              key={`${transaction.type}-${transaction.id}-${index}`}
              transaction={transaction}
            />
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
