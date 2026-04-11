import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { COLORS, SIZES, CARD_SHADOW } from "../../constants/theme";

const STATUS_COLORS = {
  upcoming: COLORS.primary,
  active: COLORS.income,
  past: COLORS.textSecondary,
};

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
  const dotColor = STATUS_COLORS[event.status] || COLORS.textSecondary;
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
      <View style={[styles.card, CARD_SHADOW]}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {event.name}
          </Text>
          <View
            style={[styles.statusBadge, { backgroundColor: dotColor + "15" }]}
          >
            <Text style={[styles.statusText, { color: dotColor }]}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={styles.date}>
          {formatDateRange(event.date, event.endDate)}
        </Text>
        <Text style={styles.location}>{event.location}</Text>

        {totalExpenses > 0 && (
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Expenses:</Text>
            <Text style={styles.expenseAmount}>
              ${totalExpenses.toFixed(2)}
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
    backgroundColor: COLORS.card,
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
    color: COLORS.textPrimary,
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
    color: COLORS.primary,
    marginBottom: 2,
  },
  location: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
    paddingTop: 8,
  },
  expenseLabel: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
  },
  expenseAmount: {
    fontSize: SIZES.fontCaption,
    fontWeight: "600",
    color: COLORS.expense,
  },
});
