import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../../constants/theme";
import {
  QUICK_PICK_CURRENCIES,
  ALL_CURRENCIES,
  DEFAULT_CURRENCY,
} from "../../constants/currencies";

const emptyForm = {
  name: "",
  date: null,
  endDate: null,
  location: "",
  currency: DEFAULT_CURRENCY,
  boothFee: "",
};

function formatDate(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function EventModal({ visible, onClose, onSave, event, mode }) {
  const [form, setForm] = useState(emptyForm);
  const [showDatePicker, setShowDatePicker] = useState(null); // "date" or "endDate"
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  useEffect(() => {
    if (mode === "add") {
      setForm(emptyForm);
    } else if (mode === "edit" && event) {
      const existingBoothFee = event.expenses
        ? event.expenses.find((e) => e.category === "Booth Fee")
        : null;
      setForm({
        name: event.name,
        date: parseDate(event.date),
        endDate: parseDate(event.endDate),
        location: event.location,
        currency: event.currency || DEFAULT_CURRENCY,
        boothFee: existingBoothFee ? String(existingBoothFee.amount) : "",
      });
    }
    setShowDatePicker(null);
  }, [visible, mode, event]);

  const title = mode === "add" ? "Add Event" : "Edit Event";
  const saveLabel = mode === "add" ? "Add" : "Save";

  const handleDateChange = (e, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(null);
    }
    if (e.type === "dismissed") return;
    if (selectedDate) {
      setForm({ ...form, [showDatePicker]: selectedDate });
    }
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.date) return;
    const data = {
      id: event?.id || Date.now().toString(),
      name: form.name.trim(),
      date: formatDate(form.date),
      endDate: formatDate(form.endDate || form.date),
      location: form.location.trim(),
      status: event?.status || "upcoming",
      currency: form.currency,
      expenses: event?.expenses || [],
      notes: event?.notes || null,
    };
    if (form.boothFee) {
      data.boothFee = parseFloat(form.boothFee);
    }
    onSave(data);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{title}</Text>

            <Text style={styles.label}>Event Name</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              placeholder="e.g. Anime Expo 2026"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker("date")}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={form.date ? COLORS.textPrimary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.dateText,
                  !form.date && styles.datePlaceholder,
                ]}
              >
                {form.date ? formatDate(form.date) : "Select start date"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker("endDate")}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={
                  form.endDate ? COLORS.textPrimary : COLORS.textSecondary
                }
              />
              <Text
                style={[
                  styles.dateText,
                  !form.endDate && styles.datePlaceholder,
                ]}
              >
                {form.endDate ? formatDate(form.endDate) : "Select end date"}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={form[showDatePicker] || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleDateChange}
                minimumDate={
                  showDatePicker === "endDate" && form.date
                    ? form.date
                    : undefined
                }
              />
            )}

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={form.location}
              onChangeText={(text) => setForm({ ...form, location: text })}
              placeholder="e.g. Los Angeles Convention Center"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.label}>Currency</Text>
            <View style={styles.currencyRow}>
              {QUICK_PICK_CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.currencyPill,
                    form.currency === c.code && styles.currencyPillSelected,
                  ]}
                  onPress={() => setForm({ ...form, currency: c.code })}
                >
                  <Text
                    style={[
                      styles.currencyPillText,
                      form.currency === c.code && styles.currencyPillTextSelected,
                    ]}
                  >
                    {c.code}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.currencyMoreButton}
                onPress={() => {
                  setCurrencySearch("");
                  setCurrencyModalVisible(true);
                }}
              >
                <Text style={styles.currencyMoreText}>More...</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Booth Fee (optional)</Text>
            <TextInput
              style={styles.input}
              value={form.boothFee}
              onChangeText={(text) => setForm({ ...form, boothFee: text })}
              keyboardType="decimal-pad"
              placeholder="e.g. 500.00"
              placeholderTextColor={COLORS.textSecondary}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>{saveLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Currency search modal */}
      <Modal visible={currencyModalVisible} animationType="fade" transparent>
        <View style={styles.currencyOverlay}>
          <View style={styles.currencyModal}>
            <View style={styles.currencyModalHeader}>
              <Text style={styles.currencyModalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.currencySearchInput}
              value={currencySearch}
              onChangeText={setCurrencySearch}
              placeholder="Search currencies..."
              placeholderTextColor={COLORS.textSecondary}
              autoFocus
            />
            <FlatList
              data={ALL_CURRENCIES.filter(
                (c) =>
                  c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
                  c.name.toLowerCase().includes(currencySearch.toLowerCase()),
              )}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.currencyListItem,
                    form.currency === item.code && styles.currencyListItemSelected,
                  ]}
                  onPress={() => {
                    setForm({ ...form, currency: item.code });
                    setCurrencyModalVisible(false);
                  }}
                >
                  <Text style={styles.currencyListCode}>{item.code}</Text>
                  <Text style={styles.currencyListName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.currencyListSymbol}>{item.symbol}</Text>
                </TouchableOpacity>
              )}
              style={styles.currencyList}
            />
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  label: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: SIZES.fontBody,
    color: COLORS.textPrimary,
  },
  dateButton: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: SIZES.fontBody,
    color: COLORS.textPrimary,
  },
  datePlaceholder: {
    color: COLORS.textSecondary,
  },
  currencyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  currencyPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  currencyPillSelected: {
    backgroundColor: COLORS.primary,
  },
  currencyPillText: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  currencyPillTextSelected: {
    color: "#FFFFFF",
  },
  currencyMoreButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  currencyMoreText: {
    fontSize: SIZES.fontCaption,
    color: COLORS.primary,
    fontWeight: "500",
  },
  currencyOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  currencyModal: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    maxHeight: "60%",
  },
  currencyModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  currencyModalTitle: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  currencySearchInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: SIZES.fontBody,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  currencyList: {
    flexGrow: 0,
  },
  currencyListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  currencyListItemSelected: {
    backgroundColor: COLORS.primary + "15",
  },
  currencyListCode: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
    color: COLORS.textPrimary,
    width: 48,
  },
  currencyListName: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  currencyListSymbol: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: "center",
  },
  cancelText: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  saveText: {
    fontSize: SIZES.fontBody,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
