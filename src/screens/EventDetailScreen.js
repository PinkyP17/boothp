import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, CARD_SHADOW } from "../constants/theme";
import { getEventStatus } from "../utils/eventStatus";
import { formatCurrency } from "../utils/formatCurrency";
import { useAppState } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import SummaryCard from "../components/SummaryCard";
import EventModal from "../components/event/EventModal";
import EventExpenseModal from "../components/event/EventExpenseModal";
import ConnectivityBanner from "../components/ConnectivityBanner";

const STATUS_COLORS = {
  upcoming: COLORS.primary,
  active: COLORS.income,
  past: COLORS.textSecondary,
};

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
}

function formatDateRange(date, endDate) {
  if (!endDate || date === endDate) return formatDate(date);
  return `${formatDate(date)} — ${formatDate(endDate)}`;
}

function isSaleInDateRange(saleTimestamp, startDate, endDate) {
  const saleDate = saleTimestamp.split("T")[0];
  return saleDate >= startDate && saleDate <= endDate;
}

function formatTime(timestamp) {
  if (!timestamp) return "";
  const timePart = timestamp.includes("T") ? timestamp.split("T")[1] : null;
  if (!timePart) return "";
  const [hours, minutes] = timePart.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

function formatSaleItems(sale) {
  if (!sale.items || sale.items.length === 0) return "Sale";
  return sale.items.map((si) => `${si.quantity}x ${si.name}`).join(", ");
}

function groupSalesByDate(sales) {
  const groups = {};
  for (const sale of sales) {
    const date = sale.timestamp.split("T")[0];
    if (!groups[date]) {
      groups[date] = { date, sales: [], totalItems: 0, totalAmount: 0 };
    }
    groups[date].sales.push(sale);
    groups[date].totalItems += sale.items
      ? sale.items.reduce((sum, si) => sum + si.quantity, 0)
      : 0;
    groups[date].totalAmount += sale.total;
  }
  return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
}

export default function EventDetailScreen({ navigation, route }) {
  const { eventId } = route.params;
  const { state, updateEvent, addEventExpense, deleteEventExpense, loadSales } =
    useAppState();
  const { token } = useAuth();

  const event = state.events.find((e) => e.id === eventId);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [notes, setNotes] = useState(event?.notes || "");
  const [notesDirty, setNotesDirty] = useState(false);

  // Load sales and sync notes on focus, close modals on blur
  useFocusEffect(
    useCallback(() => {
      if (token) {
        loadSales(token);
      }
      if (event) {
        setNotes(event.notes || "");
        setNotesDirty(false);
      }
      return () => {
        setEditModalVisible(false);
        setExpenseModalVisible(false);
      };
    }, [token, event?.id, event?.notes]),
  );

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Event not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.emptyText, { color: COLORS.primary, marginTop: 12 }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = getEventStatus(event);
  const dotColor = STATUS_COLORS[status] || COLORS.textSecondary;
  const eventCurrency = event.currency || "MYR";
  const totalExpenses = event.expenses.reduce(
    (sum, exp) => sum + exp.amount,
    0,
  );

  // Sales for this event's date range
  const eventSales = state.sales.filter((sale) =>
    isSaleInDateRange(sale.timestamp, event.date, event.endDate),
  );
  const totalSales = eventSales.reduce((sum, sale) => sum + sale.total, 0);
  const netProfit = totalSales - totalExpenses;
  const salesByDate = groupSalesByDate(eventSales);

  const handleEditSave = async (eventData) => {
    await updateEvent(token, eventData.id, eventData);
  };

  const handleAddExpense = async (expense) => {
    await addEventExpense(token, event.id, expense);
  };

  const handleDeleteExpense = (expenseId) => {
    Alert.alert("Delete Expense", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteEventExpense(token, event.id, expenseId),
      },
    ]);
  };

  const handleSaveNotes = async () => {
    await updateEvent(token, event.id, {
      id: event.id,
      name: event.name,
      date: event.date,
      endDate: event.endDate,
      location: event.location,
      status: event.status,
      currency: event.currency,
      notes: notes.trim(),
    });
    setNotesDirty(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ConnectivityBanner />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {event.name}
        </Text>
        <TouchableOpacity onPress={() => setEditModalVisible(true)}>
          <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Info */}
        <View style={[styles.infoCard, CARD_SHADOW]}>
          <View
            style={[styles.statusBadge, { backgroundColor: dotColor + "15" }]}
          >
            <Text style={[styles.statusText, { color: dotColor }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.infoText}>
              {formatDateRange(event.date, event.endDate)}
            </Text>
          </View>
          {event.location ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.infoText}>{event.location}</Text>
            </View>
          ) : null}
        </View>

        {/* Financial Summary */}
        <View style={styles.cardsRow}>
          <SummaryCard title="Sales" amount={totalSales} color={COLORS.income} currencyCode={eventCurrency} />
          <SummaryCard
            title="Expenses"
            amount={totalExpenses}
            color={COLORS.expense}
            currencyCode={eventCurrency}
          />
        </View>
        <View style={[styles.netCard, CARD_SHADOW]}>
          <Text style={styles.netLabel}>Net Profit</Text>
          <Text
            style={[
              styles.netAmount,
              { color: netProfit >= 0 ? COLORS.income : COLORS.expense },
            ]}
          >
            {netProfit >= 0 ? "+" : "-"}{formatCurrency(Math.abs(netProfit), eventCurrency)}
          </Text>
        </View>

        {/* Expenses Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expenses</Text>
            <TouchableOpacity onPress={() => setExpenseModalVisible(true)}>
              <Ionicons
                name="add-circle-outline"
                size={22}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          {event.expenses.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons
                name="receipt-outline"
                size={32}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptySectionText}>No expenses yet</Text>
            </View>
          ) : (
            event.expenses.map((expense) => (
              <View key={expense.id} style={styles.expenseRow}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseCategory}>
                    {expense.category}
                  </Text>
                  <Text style={styles.expenseAmount}>
                    {formatCurrency(expense.amount, eventCurrency)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteExpense(expense.id)}
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
        </View>

        {/* Sales Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Sales ({eventSales.length} transaction
            {eventSales.length !== 1 ? "s" : ""})
          </Text>

          {eventSales.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons
                name="cart-outline"
                size={32}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptySectionText}>
                No sales during this event
              </Text>
            </View>
          ) : (
            salesByDate.map((group) => (
              <View key={group.date} style={styles.salesDateGroup}>
                <Text style={styles.salesDateHeader}>
                  {formatDate(group.date)}
                </Text>
                {group.sales.map((sale, idx) => (
                  <View
                    key={sale.id || idx}
                    style={[
                      styles.saleItem,
                      idx < group.sales.length - 1 && styles.saleItemBorder,
                    ]}
                  >
                    <View style={styles.salesInfo}>
                      <View style={styles.saleTimeRow}>
                        <Text style={styles.saleTime}>
                          {formatTime(sale.timestamp)}
                        </Text>
                        {sale.paymentMethod ? (
                          <View style={[styles.paymentPill, {
                            backgroundColor: sale.paymentMethod === "cash" ? "#FF950015" : "#4A90D915",
                          }]}>
                            <Text style={[styles.paymentPillText, {
                              color: sale.paymentMethod === "cash" ? "#FF9500" : COLORS.primary,
                            }]}>
                              {sale.paymentMethod === "cash" ? "Cash" : "QR"}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.saleItems} numberOfLines={2}>
                        {formatSaleItems(sale)}
                      </Text>
                    </View>
                    <Text style={styles.salesAmount}>
                      {formatCurrency(sale.total, eventCurrency)}
                    </Text>
                  </View>
                ))}
                <View style={styles.salesDayTotal}>
                  <Text style={styles.salesMeta}>
                    {group.sales.length} sale{group.sales.length !== 1 ? "s" : ""}
                    {" · "}
                    {group.totalItems} item{group.totalItems !== 1 ? "s" : ""}
                  </Text>
                  <Text style={styles.salesAmount}>
                    {formatCurrency(group.totalAmount, eventCurrency)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Notes & Review */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes & Review</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={(text) => {
              setNotes(text);
              setNotesDirty(true);
            }}
            placeholder="Add your post-event review here..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            textAlignVertical="top"
          />
          {notesDirty && (
            <TouchableOpacity
              style={styles.saveNotesButton}
              onPress={handleSaveNotes}
            >
              <Text style={styles.saveNotesText}>Save Notes</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <EventModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleEditSave}
        event={event}
        mode="edit"
      />

      <EventExpenseModal
        visible={expenseModalVisible}
        onClose={() => setExpenseModalVisible(false)}
        onSave={handleAddExpense}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: SIZES.fontSubtitle,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  container: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
    paddingTop: 4,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    padding: SIZES.padding,
    marginBottom: 12,
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  netCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    padding: SIZES.padding,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  netLabel: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  netAmount: {
    fontSize: SIZES.fontTitle,
    fontWeight: "700",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
  },
  emptySectionText: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  emptyText: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
  },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.card,
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
  salesDateGroup: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  salesDateHeader: {
    fontSize: SIZES.fontCaption,
    fontWeight: "700",
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  saleItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  saleTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  saleTime: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
  },
  paymentPill: {
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 10,
  },
  paymentPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  saleItems: {
    fontSize: SIZES.fontBody,
    color: COLORS.textPrimary,
  },
  salesInfo: {
    flex: 1,
    marginRight: 12,
  },
  salesDayTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
  },
  salesMeta: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
  },
  salesAmount: {
    fontSize: SIZES.fontBody,
    fontWeight: "700",
    color: COLORS.income,
  },
  notesInput: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    padding: SIZES.padding,
    fontSize: SIZES.fontBody,
    color: COLORS.textPrimary,
    minHeight: 120,
    lineHeight: 22,
  },
  saveNotesButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveNotesText: {
    fontSize: SIZES.fontBody,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 40,
  },
});
