import { useState } from "react";
import { StyleSheet, Text, View, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";

export default function PaymentModal({ visible, total, onClose, onConfirm }) {
  const { colors: C } = useTheme();
  const [method, setMethod] = useState(null);

  const handleConfirm = () => {
    if (!method) return;
    onConfirm(method);
    setMethod(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: C.card }]}>
          <Text style={[styles.title, { color: C.textPrimary }]}>Payment</Text>

          <Text style={[styles.totalLabel, { color: C.textSecondary }]}>
            Total
          </Text>
          <Text style={[styles.totalAmount, { color: C.textPrimary }]}>
            ${total.toFixed(2)}
          </Text>

          {/* Payment method buttons */}
          <Text style={[styles.methodLabel, { color: C.textSecondary }]}>
            Payment Method
          </Text>
          <View style={styles.methodRow}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                { backgroundColor: C.background },
                method === "cash" && {
                  borderColor: C.primary,
                  backgroundColor: C.primary + "10",
                },
              ]}
              onPress={() => setMethod("cash")}
            >
              <Ionicons
                name="cash-outline"
                size={32}
                color={method === "cash" ? C.primary : C.textSecondary}
              />
              <Text
                style={[
                  styles.methodText,
                  { color: C.textSecondary },
                  method === "cash" && { color: C.primary },
                ]}
              >
                Cash
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodButton,
                { backgroundColor: C.background },
                method === "qr" && {
                  borderColor: C.primary,
                  backgroundColor: C.primary + "10",
                },
              ]}
              onPress={() => setMethod("qr")}
            >
              <Ionicons
                name="qr-code-outline"
                size={32}
                color={method === "qr" ? C.primary : C.textSecondary}
              />
              <Text
                style={[
                  styles.methodText,
                  { color: C.textSecondary },
                  method === "qr" && { color: C.primary },
                ]}
              >
                QR
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: C.background }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: C.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: C.income },
                !method && styles.confirmDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!method}
            >
              <Text style={styles.confirmText}>Confirm Sale</Text>
            </TouchableOpacity>
          </View>
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
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: "700",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: SIZES.fontCaption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  methodLabel: {
    fontSize: SIZES.fontCaption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  methodRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  methodButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: SIZES.cardRadius,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 8,
  },
  methodText: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
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
  confirmButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    fontSize: SIZES.fontBody,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
