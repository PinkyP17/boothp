import { useState, useEffect, useMemo } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SIZES } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";
import { useAppState } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import FinanceSummary from "../components/finance/FinanceSummary";
import FinanceChart from "../components/finance/FinanceChart";
import FilterTabs from "../components/finance/FilterTabs";
import TransactionCard from "../components/finance/TransactionCard";

export default function FinanceScreen({ route }) {
  const { colors: C } = useTheme();
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

  const chartData = useMemo(() => {
    if (!dashboard) return { revenueByDay: {}, expenseByDay: {}, expenseByCategory: {}, incomeByEvent: {}, eventROI: [] };

    const revenueByDay = dashboard.revenueByDay || {};
    const expenseByDay = dashboard.expenseByDay || {};
    const expenseByCategory = dashboard.expenseByCategory || {};
    const incomeByEvent = dashboard.incomeByEvent || {};

    const eventROI = (dashboard.allEvents || []).map((evt) => {
      const eventSales = transactions.filter((t) => {
        if (t.type !== "income") return false;
        const txDate = (t.date || "").split("T")[0];
        return txDate >= evt.date && txDate <= (evt.endDate || evt.date);
      });
      const eventIncome = eventSales.reduce((sum, t) => sum + (t.amount || 0), 0);
      return {
        name: evt.name.length > 10 ? evt.name.substring(0, 10) + "…" : evt.name,
        income: eventIncome,
        expenses: evt.totalExpenses || 0,
        profit: eventIncome - (evt.totalExpenses || 0),
      };
    });

    return { revenueByDay, expenseByDay, expenseByCategory, incomeByEvent, eventROI };
  }, [dashboard, transactions]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={["bottom"]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <FinanceSummary
          income={income}
          expenses={expenses}
          netProfit={netProfit}
        />

        <FilterTabs selected={filter} onSelect={setFilter} />

        <FinanceChart
          revenueByDay={chartData.revenueByDay}
          expenseByDay={chartData.expenseByDay}
          expenseByCategory={chartData.expenseByCategory}
          incomeByEvent={chartData.incomeByEvent}
          eventROI={chartData.eventROI}
          totalIncome={income}
          totalExpenses={expenses}
          filter={filter}
        />

        <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Transactions</Text>
        {filteredTransactions.length === 0 ? (
          <Text style={[styles.emptyText, { color: C.textSecondary }]}>No transactions yet</Text>
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
  },
  container: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "600",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: SIZES.fontBody,
    textAlign: "center",
    paddingVertical: 20,
  },
  bottomSpacer: {
    height: 24,
  },
});
