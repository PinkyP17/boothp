import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../constants/theme';
import { dashboardStats, upcomingEvents } from '../data/mockData';
import SummaryCard from '../components/SummaryCard';
import EventCard from '../components/EventCard';

export default function DashboardScreen() {
  const netProfit = dashboardStats.income - dashboardStats.expenses;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.subtitle}>Your Dashboard</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.cardsRow}>
          <SummaryCard title="Income" amount={dashboardStats.income} color={COLORS.income} />
          <SummaryCard title="Expenses" amount={dashboardStats.expenses} color={COLORS.expense} />
        </View>
        <SummaryCard title="Net Profit" amount={netProfit} color={COLORS.profit} fullWidth />

        {/* Upcoming Events */}
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        {upcomingEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}

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
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 12,
  },
  bottomSpacer: {
    height: 24,
  },
});
