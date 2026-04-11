import { StyleSheet, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SIZES } from "../constants/theme";
import { useAppState } from "../context/AppContext";
import SummaryCard from "../components/SummaryCard";
import EventCard from "../components/EventCard";

export default function DashboardScreen({ navigation }) {
  const { state } = useAppState();

  const income = state.sales.reduce((sum, sale) => sum + sale.total, 0);
  const expenses = state.events.reduce(
    (sum, event) =>
      sum + event.expenses.reduce((s, exp) => s + exp.amount, 0),
    0,
  );
  const netProfit = income - expenses;
  const upcomingEvents = state.events.filter((e) => e.status !== "past");

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
  bottomSpacer: {
    height: 24,
  },
});
