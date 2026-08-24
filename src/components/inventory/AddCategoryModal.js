import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SIZES } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";

export default function AddCategoryModal({ visible, onClose, onSave }) {
  const { colors: C } = useTheme();
  const [name, setName] = useState("");

  useEffect(() => {
    if (visible) setName("");
  }, [visible]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[styles.modal, { backgroundColor: C.card }]}>
          <Text style={[styles.title, { color: C.textPrimary }]}>New Category</Text>

          <TextInput
            style={[styles.input, { backgroundColor: C.background, color: C.textPrimary }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Charms"
            placeholderTextColor={C.textSecondary}
            autoFocus
            onSubmitEditing={handleSave}
          />

          <View style={styles.footer}>
            <TouchableOpacity style={[styles.cancelButton, { backgroundColor: C.background }]} onPress={onClose}>
              <Text style={[styles.cancelText, { color: C.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: C.primary }]} onPress={handleSave}>
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
    marginBottom: 16,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: SIZES.fontBody,
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
