import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../Toast";

export default function CartModal({
  visible,
  cart,
  onClose,
  onUpdateQty,
  onUpdatePrice,
  onRemoveItem,
  onSetDiscount,
  discount,
  onPressPay,
}) {
  const { colors: C } = useTheme();
  const { showToast } = useToast();

  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [discountInput, setDiscountInput] = useState("");

  // Sync discount input when modal opens or discount resets
  useEffect(() => {
    if (visible) {
      setDiscountInput(discount.value > 0 ? discount.value.toString() : "");
      setEditingPriceId(null);
    }
  }, [visible]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const discountAmount =
    discount.type === "percent"
      ? (subtotal * discount.value) / 100
      : discount.value;
  const total = Math.max(0, subtotal - discountAmount);

  const startEditingPrice = (item) => {
    setEditingPriceId(item.itemId);
    setEditPriceValue(item.unitPrice.toString());
  };

  const commitPrice = (itemId) => {
    const newPrice = parseFloat(editPriceValue);
    if (newPrice && newPrice > 0) {
      onUpdatePrice(itemId, newPrice);
    } else {
      showToast("Enter a price greater than 0", "error");
    }
    setEditingPriceId(null);
  };

  const handleDiscountChange = (value) => {
    const parsed = parseFloat(value);
    let clamped = isNaN(parsed) ? 0 : Math.max(0, parsed);
    if (discount.type === "percent") clamped = Math.min(clamped, 100);
    setDiscountInput(value === "" ? "" : clamped.toString());
    onSetDiscount({ ...discount, value: clamped });
  };

  const toggleDiscountType = () => {
    const newType = discount.type === "percent" ? "flat" : "percent";
    onSetDiscount({ type: newType, value: discount.value });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[styles.modal, { backgroundColor: C.card }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: C.textPrimary }]}>Cart</Text>

            {cart.map((item) => (
              <View
                key={item.itemId}
                style={[styles.cartItem, { backgroundColor: C.background }]}
              >
                <View style={styles.itemInfo}>
                  <Text
                    style={[styles.itemName, { color: C.textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  {/* Quantity controls */}
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={[styles.qtyButton, { backgroundColor: C.card }]}
                      onPress={() => onUpdateQty(item.itemId, -1)}
                    >
                      <Ionicons name="remove" size={16} color={C.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyText, { color: C.textPrimary }]}>
                      {item.quantity}
                    </Text>
                    <TouchableOpacity
                      style={[styles.qtyButton, { backgroundColor: C.card }]}
                      onPress={() => onUpdateQty(item.itemId, 1)}
                    >
                      <Ionicons name="add" size={16} color={C.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.priceSection}>
                  {/* Price (tappable to edit) */}
                  {editingPriceId === item.itemId ? (
                    <TextInput
                      style={[
                        styles.priceInput,
                        { backgroundColor: C.card, color: C.posButton },
                      ]}
                      value={editPriceValue}
                      onChangeText={setEditPriceValue}
                      keyboardType="decimal-pad"
                      autoFocus
                      onBlur={() => commitPrice(item.itemId)}
                      onSubmitEditing={() => commitPrice(item.itemId)}
                    />
                  ) : (
                    <TouchableOpacity onPress={() => startEditingPrice(item)}>
                      <Text style={[styles.price, { color: C.posButton }]}>
                        ${item.unitPrice.toFixed(2)}
                      </Text>
                      {item.unitPrice !== item.originalPrice && (
                        <Text
                          style={[
                            styles.originalPrice,
                            { color: C.textSecondary },
                          ]}
                        >
                          ${item.originalPrice.toFixed(2)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* Remove button */}
                  <TouchableOpacity
                    onPress={() => onRemoveItem(item.itemId)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.removeButton}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={C.expense}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Discount Section */}
            <View style={styles.discountSection}>
              <Text style={[styles.discountLabel, { color: C.textSecondary }]}>
                Discount
              </Text>
              <View style={styles.discountRow}>
                <TouchableOpacity
                  style={[
                    styles.discountToggle,
                    { backgroundColor: C.primary },
                  ]}
                  onPress={toggleDiscountType}
                >
                  <Text style={styles.discountToggleText}>
                    {discount.type === "percent" ? "%" : "$"}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.discountInput,
                    { backgroundColor: C.background, color: C.textPrimary },
                  ]}
                  value={discountInput}
                  onChangeText={handleDiscountChange}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={C.textSecondary}
                />
              </View>
            </View>

            {/* Totals */}
            <View
              style={[
                styles.totalsSection,
                { borderTopColor: C.background },
              ]}
            >
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: C.textSecondary }]}>
                  Subtotal
                </Text>
                <Text style={[styles.totalValue, { color: C.textPrimary }]}>
                  ${subtotal.toFixed(2)}
                </Text>
              </View>
              {discountAmount > 0 && (
                <View style={styles.totalRow}>
                  <Text
                    style={[styles.totalLabel, { color: C.textSecondary }]}
                  >
                    Discount
                  </Text>
                  <Text style={[styles.totalValue, { color: C.income }]}>
                    -${discountAmount.toFixed(2)}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.totalRow,
                  styles.grandTotalRow,
                  { borderTopColor: C.background },
                ]}
              >
                <Text style={[styles.grandTotalLabel, { color: C.textPrimary }]}>
                  Total
                </Text>
                <Text
                  style={[styles.grandTotalValue, { color: C.textPrimary }]}
                >
                  ${total.toFixed(2)}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: C.background }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: C.textSecondary }]}>
                Close
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: C.income }]}
              onPress={onPressPay}
            >
              <Text style={styles.payText}>Pay ${total.toFixed(2)}</Text>
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
    maxHeight: "85%",
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: "700",
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: SIZES.fontBody,
    fontWeight: "500",
    marginBottom: 6,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
    minWidth: 20,
    textAlign: "center",
  },
  priceSection: {
    alignItems: "flex-end",
    gap: 4,
  },
  price: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
    textAlign: "right",
  },
  originalPrice: {
    fontSize: SIZES.fontCaption,
    textDecorationLine: "line-through",
    textAlign: "right",
  },
  priceInput: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: SIZES.fontBody,
    fontWeight: "600",
    textAlign: "right",
    minWidth: 70,
  },
  removeButton: {
    marginTop: 4,
  },
  discountSection: {
    marginTop: 12,
    marginBottom: 16,
  },
  discountLabel: {
    fontSize: SIZES.fontCaption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  discountToggle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  discountToggleText: {
    fontSize: SIZES.fontBody,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  discountInput: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: SIZES.fontBody,
  },
  totalsSection: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: SIZES.fontBody,
  },
  totalValue: {
    fontSize: SIZES.fontBody,
    fontWeight: "500",
  },
  grandTotalRow: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "700",
  },
  grandTotalValue: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
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
  payButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  payText: {
    fontSize: SIZES.fontBody,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
