import { useCallback } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, CARD_SHADOW } from "../constants/theme";
import { useAppState } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
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

const TYPE_ICONS = {
  income: { name: "cart-outline", color: COLORS.income },
  event_expense: { name: "receipt-outline", color: COLORS.expense },
  restock: { name: "cube-outline", color: COLORS.primary },
};

export default function DashboardScreen({ navigation }) {
  const { state, loadDashboard } = useAppState();
  const { token } = useAuth();
  const dashboard = state.dashboard;

  useFocusEffect(
    useCallback(() => {
      if (token) {
        loadDashboard(token);
      }
    }, [token]),
  );

  const income = dashboard?.income ?? 0;
  const expenses = dashboard?.totalExpenses ?? 0;
  const netProfit = dashboard?.netProfit ?? 0;
  const upcomingEvents = dashboard?.upcomingEvents ?? [];
  const recentTransactions = (dashboard?.transactions ?? []).slice(0, 5);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.subtitle}>Your Dashboard</Text>
        </View>

        <View style={styles.cardsRow}>
          <SummaryCard
            title="Income"
            amount={income}
            color={COLORS.income}
            onPress={() => navigation.navigate("Finance", { filter: "Income" })}
          />
          <SummaryCard
            title="Expenses"
            amount={expenses}
            color={COLORS.expense}
            onPress={() =>
              navigation.navigate("Finance", { filter: "Expenses" })
            }
          />
        </View>
        <SummaryCard
          title="Net Profit"
          amount={netProfit}
          color={COLORS.profit}
          fullWidth
          onPress={() => navigation.navigate("Finance", { filter: "All" })}
        />

        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {recentTransactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet</Text>
        ) : (
          recentTransactions.map((tx) => {
            const icon = TYPE_ICONS[tx.type] || TYPE_ICONS.income;
            const isExpense = tx.type !== "income";
            return (
              <View key={`${tx.type}-${tx.id}`} style={[styles.txCard, CARD_SHADOW]}>
                <View style={[styles.txIcon, { backgroundColor: icon.color + "15" }]}>
                  <Ionicons name={icon.name} size={18} color={icon.color} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc} numberOfLines={1}>
                    {tx.description}
                  </Text>
                  <View style={styles.txMetaRow}>
                    <Text style={styles.txDate}>
                      {formatTransactionDate(tx.date)}
                    </Text>
                    {tx.eventName ? (
                      <View style={styles.txEventPill}>
                        <Text style={styles.txEventText}>{tx.eventName}</Text>
                      </View>
                    ) : null}
                    {tx.paymentMethod ? (
                      <View style={[styles.txPaymentPill, {
                        backgroundColor: tx.paymentMethod === "cash" ? "#FF950015" : "#4A90D915",
                      }]}>
                        <Text style={[styles.txPaymentText, {
                          color: tx.paymentMethod === "cash" ? "#FF9500" : COLORS.primary,
                        }]}>
                          {tx.paymentMethod === "cash" ? "Cash" : "QR"}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <Text style={[styles.txAmount, { color: isExpense ? COLORS.expense : COLORS.income }]}>
                  {isExpense ? "-" : "+"}${Number(tx.amount).toFixed(2)}
                </Text>
              </View>
            );
          })
        )}

        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        {upcomingEvents.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming events</Text>
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
    backgroundColor: COLORS.background,
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
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingVertical: 20,
  },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    padding: 12,
    marginBottom: 8,
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
    color: COLORS.textPrimary,
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
    color: COLORS.textSecondary,
  },
  txEventPill: {
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  txEventText: {
    fontSize: SIZES.fontCaption - 1,
    color: COLORS.primary,
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
