import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
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

export default function EventDetailModal({
  visible,
  onClose,
  event,
  onAddExpense,
  onDeleteExpense,
  onEdit,
}) {
  const { colors: C } = useTheme();

  if (!event) return null;

  const STATUS_COLORS = {
    upcoming: C.primary,
    active: C.income,
    past: C.textSecondary,
  };

  const dotColor = STATUS_COLORS[event.status] || C.textSecondary;
  const totalExpenses = event.expenses.reduce(
    (sum, exp) => sum + exp.amount,
    0,
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: C.card }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: C.textPrimary }]}>{event.name}</Text>
              <TouchableOpacity onPress={onEdit}>
                <Ionicons
                  name="pencil-outline"
                  size={20}
                  color={C.primary}
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

            <Text style={[styles.date, { color: C.primary }]}>
              {formatDateRange(event.date, event.endDate)}
            </Text>
            <Text style={[styles.location, { color: C.textSecondary }]}>{event.location}</Text>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: C.background }]} />

            {/* Expenses Section */}
            <View style={styles.expenseHeader}>
              <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Expenses</Text>
              <Text style={[styles.totalAmount, { color: C.expense }]}>
                {formatCurrency(totalExpenses, event.currency || "MYR")}
              </Text>
            </View>

            {event.expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="receipt-outline"
                  size={36}
                  color={C.textSecondary}
                />
                <Text style={[styles.emptyText, { color: C.textSecondary }]}>No expenses yet</Text>
              </View>
            ) : (
              event.expenses.map((expense) => (
                <View
                  key={expense.id}
                  style={[styles.expenseRow, { backgroundColor: C.background }]}
                >
                  <View style={styles.expenseInfo}>
                    <Text style={[styles.expenseCategory, { color: C.textPrimary }]}>
                      {expense.category}
                    </Text>
                    <Text style={[styles.expenseAmount, { color: C.textPrimary }]}>
                      {formatCurrency(expense.amount, event.currency || "MYR")}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onDeleteExpense(event.id, expense.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={C.expense}
                    />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Add Expense Button */}
            <TouchableOpacity
              style={[styles.addExpenseButton, { borderColor: C.primary + "40" }]}
              onPress={onAddExpense}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={C.primary}
              />
              <Text style={[styles.addExpenseText, { color: C.primary }]}>Add Expense</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: C.background }]}
            onPress={onClose}
          >
            <Text style={[styles.closeText, { color: C.textSecondary }]}>Close</Text>
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
    marginBottom: 4,
  },
  location: {
    fontSize: SIZES.fontBody,
  },
  divider: {
    height: 1,
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
  },
  totalAmount: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: SIZES.fontBody,
    marginTop: 8,
  },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  },
  expenseAmount: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
  },
  addExpenseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 8,
  },
  addExpenseText: {
    fontSize: SIZES.fontBody,
    fontWeight: "500",
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  closeText: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
  },
});
