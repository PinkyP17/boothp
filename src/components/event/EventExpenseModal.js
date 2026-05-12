import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SIZES } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { EXPENSE_CATEGORIES } from "../../data/mockData";

export default function EventExpenseModal({ visible, onClose, onSave }) {
  const { colors: C } = useTheme();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;
    onSave({
      id: Date.now().toString(),
      category,
      amount: parsedAmount,
    });
    setAmount("");
    setCategory(EXPENSE_CATEGORIES[0]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.modal, { backgroundColor: C.card }]}>
          <Text style={[styles.title, { color: C.textPrimary }]}>Add Expense</Text>

          <Text style={[styles.label, { color: C.textSecondary }]}>Amount</Text>
          <TextInput
            style={[styles.input, { backgroundColor: C.background, color: C.textPrimary }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={C.textSecondary}
          />

          <Text style={[styles.label, { color: C.textSecondary }]}>Category</Text>
          <View style={styles.categoryRow}>
            {EXPENSE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.pill,
                  { backgroundColor: C.background },
                  category === cat && { backgroundColor: C.primary },
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: C.textSecondary },
                    category === cat && styles.pillTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: C.background }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: C.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: C.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: "700",
    marginBottom: 20,
  },
  label: {
    fontSize: SIZES.fontCaption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: SIZES.fontBody,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillText: {
    fontSize: SIZES.fontCaption,
    fontWeight: "500",
  },
  pillTextSelected: {
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelText: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: {
    fontSize: SIZES.fontBody,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
