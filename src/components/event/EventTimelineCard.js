import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SIZES, CARD_SHADOW } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { getEventStatus } from "../../utils/eventStatus";
import { formatCurrency } from "../../utils/formatCurrency";

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
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
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
}

function formatDateRange(date, endDate) {
  if (!endDate || date === endDate) return formatDate(date);
  return `${formatDate(date)} — ${formatDate(endDate)}`;
}

export default function EventTimelineCard({ event, onPress, isLast }) {
  const { colors: C } = useTheme();

  const STATUS_COLORS = {
    upcoming: C.primary,
    active: C.income,
    past: C.textSecondary,
  };

  const status = getEventStatus(event);
  const dotColor = STATUS_COLORS[status] || C.textSecondary;
  const isActive = status === "active";
  const totalExpenses = event.expenses.reduce(
    (sum, exp) => sum + exp.amount,
    0,
  );

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Timeline indicator */}
      <View style={styles.timeline}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        {!isLast && (
          <View style={[styles.line, { backgroundColor: dotColor + "40" }]} />
        )}
      </View>

      {/* Card content */}
      <View
        style={[
          styles.card,
          CARD_SHADOW,
          { backgroundColor: C.card },
          isActive && { borderWidth: 1.5, borderColor: C.income + "50" },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: C.textPrimary }]} numberOfLines={1}>
            {event.name}
          </Text>
          <View
            style={[styles.statusBadge, { backgroundColor: dotColor + "15" }]}
          >
            <Text style={[styles.statusText, { color: dotColor }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={[styles.date, { color: C.primary }]}>
          {formatDateRange(event.date, event.endDate)}
        </Text>
        <Text style={[styles.location, { color: C.textSecondary }]}>{event.location}</Text>

        {totalExpenses > 0 && (
          <View style={[styles.expenseRow, { borderTopColor: C.background }]}>
            <Text style={[styles.expenseLabel, { color: C.textSecondary }]}>Expenses:</Text>
            <Text style={[styles.expenseAmount, { color: C.expense }]}>
              {formatCurrency(totalExpenses, event.currency || "MYR")}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    minHeight: 100,
  },
  timeline: {
    width: 32,
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 18,
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: -4,
  },
  card: {
    flex: 1,
    borderRadius: SIZES.cardRadius,
    padding: SIZES.padding,
    marginBottom: 12,
    marginLeft: 8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  name: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  date: {
    fontSize: SIZES.fontCaption,
    marginBottom: 2,
  },
  location: {
    fontSize: SIZES.fontCaption,
    marginBottom: 8,
  },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 8,
  },
  expenseLabel: {
    fontSize: SIZES.fontCaption,
  },
  expenseAmount: {
    fontSize: SIZES.fontCaption,
    fontWeight: "600",
  },
});
