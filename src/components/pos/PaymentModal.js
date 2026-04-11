import { useState } from "react";
import { StyleSheet, Text, View, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../../constants/theme";

export default function PaymentModal({ visible, total, onClose, onConfirm }) {
  const [method, setMethod] = useState(null);

  const handleConfirm = () => {
    if (!method) return;
    onConfirm(method);
    setMethod(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Payment</Text>

          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>

          {/* Payment method buttons */}
          <Text style={styles.methodLabel}>Payment Method</Text>
          <View style={styles.methodRow}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                method === "cash" && styles.methodSelected,
              ]}
              onPress={() => setMethod("cash")}
            >
              <Ionicons
                name="cash-outline"
                size={32}
                color={
                  method === "cash" ? COLORS.primary : COLORS.textSecondary
                }
              />
              <Text
                style={[
                  styles.methodText,
                  method === "cash" && styles.methodTextSelected,
                ]}
              >
                Cash
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodButton,
                method === "qr" && styles.methodSelected,
              ]}
              onPress={() => setMethod("qr")}
            >
              <Ionicons
                name="qr-code-outline"
                size={32}
                color={method === "qr" ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.methodText,
                  method === "qr" && styles.methodTextSelected,
                ]}
              >
                QR
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, !method && styles.confirmDisabled]}
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
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SIZES.padding,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 24,
  },
  methodLabel: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 8,
  },
  methodSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  methodText: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  methodTextSelected: {
    color: COLORS.primary,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
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
  confirmButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.income,
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
