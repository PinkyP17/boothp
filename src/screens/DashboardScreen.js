import { useCallback, useState, useMemo } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, CARD_SHADOW } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";
import { useAppState } from "../context/AppContext";
import SummaryCard from "../components/SummaryCard";
import EventCard from "../components/EventCard";

function formatTransactionDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${months[d.getMonth()]} ${d.getDate()} · ${h12}:${m} ${ampm}`;
}

export default function DashboardScreen({ navigation }) {
  const { colors: C } = useTheme();
  const { state, loadDashboard } = useAppState();
  const dashboard = state.dashboard;
  const isLoading = state.isLoading && !dashboard;
  const [refreshing, setRefreshing] = useState(false);

  const typeIcons = useMemo(() => ({
    income: { name: "cart-outline", color: C.income },
    event_expense: { name: "receipt-outline", color: C.expense },
    restock: { name: "cube-outline", color: C.primary },
  }), [C]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, []),
  );

  const income = dashboard?.income ?? 0;
  const expenses = dashboard?.totalExpenses ?? 0;
  const netProfit = dashboard?.netProfit ?? 0;
  const upcomingEvents = dashboard?.upcomingEvents ?? [];
  const recentTransactions = (dashboard?.transactions ?? []).slice(0, 5);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDashboard();
              setRefreshing(false);
            }}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: C.textPrimary }]}>Welcome back!</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>Your Dashboard</Text>
        </View>

        <View style={styles.cardsRow}>
          <SummaryCard
            title="Income"
            amount={income}
            color={C.income}
            onPress={() => navigation.navigate("Finance", { filter: "Income" })}
          />
          <SummaryCard
            title="Expenses"
            amount={expenses}
            color={C.expense}
            onPress={() => navigation.navigate("Finance", { filter: "Expenses" })}
          />
        </View>
        <SummaryCard
          title="Net Profit"
          amount={netProfit}
          color={C.profit}
          fullWidth
          onPress={() => navigation.navigate("Finance", { filter: "All" })}
        />

        <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Recent Transactions</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color={C.primary} style={{ paddingVertical: 20 }} />
        ) : recentTransactions.length === 0 ? (
          <Text style={[styles.emptyText, { color: C.textSecondary }]}>No transactions yet</Text>
        ) : (
          recentTransactions.map((tx) => {
            const icon = typeIcons[tx.type] || typeIcons.income;
            const isExpense = tx.type !== "income";
            return (
              <View key={`${tx.type}-${tx.id}`} style={[styles.txCard, CARD_SHADOW, { backgroundColor: C.card }]}>
                <View style={[styles.txIcon, { backgroundColor: icon.color + "15" }]}>
                  <Ionicons name={icon.name} size={18} color={icon.color} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={[styles.txDesc, { color: C.textPrimary }]} numberOfLines={1}>
                    {tx.description}
                  </Text>
                  <View style={styles.txMetaRow}>
                    <Text style={[styles.txDate, { color: C.textSecondary }]}>
                      {formatTransactionDate(tx.date)}
                    </Text>
                    {tx.eventName ? (
                      <View style={[styles.txEventPill, { backgroundColor: C.primary + "15" }]}>
                        <Text style={[styles.txEventText, { color: C.primary }]}>{tx.eventName}</Text>
                      </View>
                    ) : null}
                    {tx.paymentMethod ? (
                      <View style={[styles.txPaymentPill, {
                        backgroundColor: tx.paymentMethod === "cash" ? "#FF950015" : C.primary + "15",
                      }]}>
                        <Text style={[styles.txPaymentText, {
                          color: tx.paymentMethod === "cash" ? "#FF9500" : C.primary,
                        }]}>
                          {tx.paymentMethod === "cash" ? "Cash" : "QR"}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <Text style={[styles.txAmount, { color: isExpense ? C.expense : C.income }]}>
                  {isExpense ? "-" : "+"}${Number(tx.amount).toFixed(2)}
                </Text>
              </View>
            );
          })
        )}

        <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Upcoming Events</Text>
        {upcomingEvents.length === 0 ? (
          <Text style={[styles.emptyText, { color: C.textSecondary }]}>No upcoming events</Text>
        ) : (
          upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
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
  header: {
    marginTop: 8,
    marginBottom: 20,
  },
  greeting: {
    fontSize: SIZES.fontTitle,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: SIZES.fontBody,
    marginTop: 4,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: SIZES.fontBody,
    textAlign: "center",
    paddingVertical: 20,
  },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: SIZES.cardRadius,
    padding: 12,
    marginBottom: 8,
    minHeight: 64,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
    marginRight: 8,
  },
  txDesc: {
    fontSize: SIZES.fontBody,
    fontWeight: "500",
    marginBottom: 4,
  },
  txMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  txDate: {
    fontSize: SIZES.fontCaption - 1,
  },
  txEventPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  txEventText: {
    fontSize: SIZES.fontCaption - 1,
    fontWeight: "500",
  },
  txPaymentPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  txPaymentText: {
    fontSize: SIZES.fontCaption - 1,
    fontWeight: "600",
  },
  txAmount: {
    fontSize: SIZES.fontBody,
    fontWeight: "700",
  },
  bottomSpacer: {
    height: 24,
  },
});
