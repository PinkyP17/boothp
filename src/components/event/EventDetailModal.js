import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../../constants/theme";

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

export default function EventDetailModal({
  visible,
  onClose,
  event,
  onAddExpense,
  onDeleteExpense,
  onEdit,
}) {
  if (!event) return null;

  const dotColor = STATUS_COLORS[event.status] || COLORS.textSecondary;
  const totalExpenses = event.expenses.reduce(
    (sum, exp) => sum + exp.amount,
    0,
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.title}>{event.name}</Text>
              <TouchableOpacity onPress={onEdit}>
                <Ionicons
                  name="pencil-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>

            <View
              style={[styles.statusBadge, { backgroundColor: dotColor + "15" }]}
            >
              <Text style={[styles.statusText, { color: dotColor }]}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </Text>
            </View>

            <Text style={styles.date}>
              {formatDateRange(event.date, event.endDate)}
            </Text>
            <Text style={styles.location}>{event.location}</Text>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Expenses Section */}
            <View style={styles.expenseHeader}>
              <Text style={styles.sectionTitle}>Expenses</Text>
              <Text style={styles.totalAmount}>
                ${totalExpenses.toFixed(2)}
              </Text>
            </View>

            {event.expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="receipt-outline"
                  size={36}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.emptyText}>No expenses yet</Text>
              </View>
            ) : (
              event.expenses.map((expense) => (
                <View key={expense.id} style={styles.expenseRow}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseCategory}>
                      {expense.category}
                    </Text>
                    <Text style={styles.expenseAmount}>
                      ${expense.amount.toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onDeleteExpense(event.id, expense.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={COLORS.expense}
                    />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Add Expense Button */}
            <TouchableOpacity
              style={styles.addExpenseButton}
              onPress={onAddExpense}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.addExpenseText}>Add Expense</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SIZES.padding,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  date: {
    fontSize: SIZES.fontBody,
    color: COLORS.primary,
    marginBottom: 4,
  },
  location: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.background,
    marginVertical: 20,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  totalAmount: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "700",
    color: COLORS.expense,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  expenseInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
    marginRight: 12,
  },
  expenseCategory: {
    fontSize: SIZES.fontBody,
    color: COLORS.textPrimary,
  },
  expenseAmount: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  addExpenseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
    borderStyle: "dashed",
    marginTop: 8,
  },
  addExpenseText: {
    fontSize: SIZES.fontBody,
    color: COLORS.primary,
    fontWeight: "500",
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: "center",
    marginTop: 16,
  },
  closeText: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
});
