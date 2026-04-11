import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { COLORS, SIZES } from "../../constants/theme";

const emptyForm = {
  name: "",
  date: "",
  endDate: "",
  location: "",
};

export default function EventModal({ visible, onClose, onSave, event, mode }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (mode === "add") {
      setForm(emptyForm);
    } else if (mode === "edit" && event) {
      setForm({
        name: event.name,
        date: event.date,
        endDate: event.endDate || "",
        location: event.location,
      });
    }
  }, [visible, mode, event]);

  const title = mode === "add" ? "Add Event" : "Edit Event";
  const saveLabel = mode === "add" ? "Add" : "Save";

  const handleSave = () => {
    if (!form.name.trim() || !form.date.trim()) return;
    onSave({
      id: event?.id || Date.now().toString(),
      name: form.name.trim(),
      date: form.date.trim(),
      endDate: form.endDate.trim() || form.date.trim(),
      location: form.location.trim(),
      status: event?.status || "upcoming",
      expenses: event?.expenses || [],
    });
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
            <TextInput
              style={styles.input}
              value={form.date}
              onChangeText={(text) => setForm({ ...form, date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.label}>End Date (optional)</Text>
            <TextInput
              style={styles.input}
              value={form.endDate}
              onChangeText={(text) => setForm({ ...form, endDate: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={form.location}
              onChangeText={(text) => setForm({ ...form, location: text })}
              placeholder="e.g. Los Angeles Convention Center"
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
