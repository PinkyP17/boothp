import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, CARD_SHADOW } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";
import { getEventStatus } from "../utils/eventStatus";
import { formatCurrency } from "../utils/formatCurrency";
import { useAppState } from "../context/AppContext";
import { useToast } from "../components/Toast";
import SummaryCard from "../components/SummaryCard";
import EventModal from "../components/event/EventModal";
import EventExpenseModal from "../components/event/EventExpenseModal";

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
  const { state, updateEvent, addEventExpense, deleteEventExpense, loadSales, loadEvents } =
    useAppState();
  const { colors: C } = useTheme();

  const STATUS_COLORS = {
    upcoming: C.primary,
    active: C.income,
    past: C.textSecondary,
  };

  const event = state.events.find((e) => e.id === eventId);
  const { showToast } = useToast();

  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [notes, setNotes] = useState(event?.notes || "");
  const [notesDirty, setNotesDirty] = useState(false);

  // Load sales and sync notes on focus, close modals on blur
  useFocusEffect(
    useCallback(() => {
      loadSales();
      if (event) {
        setNotes(event.notes || "");
        setNotesDirty(false);
      }
      return () => {
        setEditModalVisible(false);
        setExpenseModalVisible(false);
      };
    }, [event?.id, event?.notes]),
  );

  if (!event) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: C.textSecondary }]}>Event not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.emptyText, { color: C.primary, marginTop: 12 }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = getEventStatus(event);
  const dotColor = STATUS_COLORS[status] || C.textSecondary;
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
    const result = await updateEvent(eventData.id, eventData);
    if (result && !result.success) {
      showToast(result.message || "Failed to update event", "error");
    }
  };

  const handleAddExpense = async (expense) => {
    const result = await addEventExpense(event.id, expense);
    if (result && !result.success) {
      showToast(result.message || "Failed to add expense", "error");
    }
  };

  const handleDeleteExpense = (expenseId) => {
    Alert.alert("Delete Expense", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteEventExpense(event.id, expenseId),
      },
    ]);
  };

  const handleSaveNotes = async () => {
    await updateEvent(event.id, {
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
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]} numberOfLines={1}>
          {event.name}
        </Text>
        <TouchableOpacity onPress={() => setEditModalVisible(true)}>
          <Ionicons name="pencil-outline" size={20} color={C.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await Promise.all([loadEvents(), loadSales()]);
              setRefreshing(false);
            }}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
      >
        {/* Event Info */}
        <View style={[styles.infoCard, { backgroundColor: C.card }, CARD_SHADOW]}>
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
              color={C.textSecondary}
            />
            <Text style={[styles.infoText, { color: C.textSecondary }]}>
              {formatDateRange(event.date, event.endDate)}
            </Text>
          </View>
          {event.location ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={C.textSecondary}
              />
              <Text style={[styles.infoText, { color: C.textSecondary }]}>{event.location}</Text>
            </View>
          ) : null}
        </View>

        {/* Financial Summary */}
        <View style={styles.cardsRow}>
          <SummaryCard title="Sales" amount={totalSales} color={C.income} currencyCode={eventCurrency} />
          <SummaryCard
            title="Expenses"
            amount={totalExpenses}
            color={C.expense}
            currencyCode={eventCurrency}
          />
        </View>
        <View style={[styles.netCard, { backgroundColor: C.card }, CARD_SHADOW]}>
          <Text style={[styles.netLabel, { color: C.textSecondary }]}>Net Profit</Text>
          <Text
            style={[
              styles.netAmount,
              { color: netProfit >= 0 ? C.income : C.expense },
            ]}
          >
            {netProfit >= 0 ? "+" : "-"}{formatCurrency(Math.abs(netProfit), eventCurrency)}
          </Text>
        </View>

        {/* Expenses Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Expenses</Text>
            <TouchableOpacity onPress={() => setExpenseModalVisible(true)}>
              <Ionicons
                name="add-circle-outline"
                size={22}
                color={C.primary}
              />
            </TouchableOpacity>
          </View>

          {event.expenses.length === 0 ? (
            <View style={[styles.emptySection, { backgroundColor: C.card }]}>
              <Ionicons
                name="receipt-outline"
                size={32}
                color={C.textSecondary}
              />
              <Text style={[styles.emptySectionText, { color: C.textSecondary }]}>No expenses yet</Text>
            </View>
          ) : (
            event.expenses.map((expense) => (
              <View key={expense.id} style={[styles.expenseRow, { backgroundColor: C.card }]}>
                <View style={styles.expenseInfo}>
                  <Text style={[styles.expenseCategory, { color: C.textPrimary }]}>
                    {expense.category}
                  </Text>
                  <Text style={[styles.expenseAmount, { color: C.textPrimary }]}>
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
                    color={C.expense}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Sales Breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>
            Sales ({eventSales.length} transaction
            {eventSales.length !== 1 ? "s" : ""})
          </Text>

          {eventSales.length === 0 ? (
            <View style={[styles.emptySection, { backgroundColor: C.card }]}>
              <Ionicons
                name="cart-outline"
                size={32}
                color={C.textSecondary}
              />
              <Text style={[styles.emptySectionText, { color: C.textSecondary }]}>
                No sales during this event
              </Text>
            </View>
          ) : (
            salesByDate.map((group) => (
              <View key={group.date} style={[styles.salesDateGroup, { backgroundColor: C.card }]}>
                <Text style={[styles.salesDateHeader, { color: C.textPrimary, backgroundColor: C.background }]}>
                  {formatDate(group.date)}
                </Text>
                {group.sales.map((sale, idx) => (
                  <View
                    key={sale.id || idx}
                    style={[
                      styles.saleItem,
                      idx < group.sales.length - 1 && [styles.saleItemBorder, { borderBottomColor: C.background }],
                    ]}
                  >
                    <View style={styles.salesInfo}>
                      <View style={styles.saleTimeRow}>
                        <Text style={[styles.saleTime, { color: C.textSecondary }]}>
                          {formatTime(sale.timestamp)}
                        </Text>
                        {sale.paymentMethod ? (
                          <View style={[styles.paymentPill, {
                            backgroundColor: sale.paymentMethod === "cash" ? "#FF950015" : "#4A90D915",
                          }]}>
                            <Text style={[styles.paymentPillText, {
                              color: sale.paymentMethod === "cash" ? "#FF9500" : C.primary,
                            }]}>
                              {sale.paymentMethod === "cash" ? "Cash" : "QR"}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.saleItems, { color: C.textPrimary }]} numberOfLines={2}>
                        {formatSaleItems(sale)}
                      </Text>
                    </View>
                    <Text style={[styles.salesAmount, { color: C.income }]}>
                      {formatCurrency(sale.total, eventCurrency)}
                    </Text>
                  </View>
                ))}
                <View style={[styles.salesDayTotal, { borderTopColor: C.background }]}>
                  <Text style={[styles.salesMeta, { color: C.textSecondary }]}>
                    {group.sales.length} sale{group.sales.length !== 1 ? "s" : ""}
                    {" · "}
                    {group.totalItems} item{group.totalItems !== 1 ? "s" : ""}
                  </Text>
                  <Text style={[styles.salesAmount, { color: C.income }]}>
                    {formatCurrency(group.totalAmount, eventCurrency)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Notes & Review */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Notes & Review</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: C.card, color: C.textPrimary }]}
            value={notes}
            onChangeText={(text) => {
              setNotes(text);
              setNotesDirty(true);
            }}
            placeholder="Add your post-event review here..."
            placeholderTextColor={C.textSecondary}
            multiline
            textAlignVertical="top"
          />
          {notesDirty && (
            <TouchableOpacity
              style={[styles.saveNotesButton, { backgroundColor: C.primary }]}
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
  },
  container: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
    paddingTop: 4,
  },
  infoCard: {
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
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  netCard: {
    borderRadius: SIZES.cardRadius,
    padding: SIZES.padding,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  netLabel: {
    fontSize: SIZES.fontCaption,
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
    marginBottom: 12,
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 24,
    borderRadius: SIZES.cardRadius,
  },
  emptySectionText: {
    fontSize: SIZES.fontBody,
    marginTop: 8,
  },
  emptyText: {
    fontSize: SIZES.fontBody,
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
  salesDateGroup: {
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  salesDateHeader: {
    fontSize: SIZES.fontCaption,
    fontWeight: "700",
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
  },
  saleTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  saleTime: {
    fontSize: SIZES.fontCaption,
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
  },
  salesMeta: {
    fontSize: SIZES.fontCaption,
  },
  salesAmount: {
    fontSize: SIZES.fontBody,
    fontWeight: "700",
  },
  notesInput: {
    borderRadius: SIZES.cardRadius,
    padding: SIZES.padding,
    fontSize: SIZES.fontBody,
    minHeight: 120,
    lineHeight: 22,
  },
  saveNotesButton: {
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
