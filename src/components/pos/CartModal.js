import { useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../../constants/theme";

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
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [discountInput, setDiscountInput] = useState(
    discount.value > 0 ? discount.value.toString() : "",
  );

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
    }
    setEditingPriceId(null);
  };

  const handleDiscountChange = (value) => {
    setDiscountInput(value);
    const parsed = parseFloat(value) || 0;
    onSetDiscount({ ...discount, value: parsed });
  };

  const toggleDiscountType = () => {
    const newType = discount.type === "percent" ? "flat" : "percent";
    onSetDiscount({ type: newType, value: discount.value });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Cart</Text>

            {cart.map((item) => (
              <View key={item.itemId} style={styles.cartItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>

                  {/* Quantity controls */}
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => onUpdateQty(item.itemId, -1)}
                    >
                      <Ionicons
                        name="remove"
                        size={16}
                        color={COLORS.textPrimary}
                      />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => onUpdateQty(item.itemId, 1)}
                    >
                      <Ionicons
                        name="add"
                        size={16}
                        color={COLORS.textPrimary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.priceSection}>
                  {/* Price (tappable to edit) */}
                  {editingPriceId === item.itemId ? (
                    <TextInput
                      style={styles.priceInput}
                      value={editPriceValue}
                      onChangeText={setEditPriceValue}
                      keyboardType="decimal-pad"
                      autoFocus
                      onBlur={() => commitPrice(item.itemId)}
                      onSubmitEditing={() => commitPrice(item.itemId)}
                    />
                  ) : (
                    <TouchableOpacity onPress={() => startEditingPrice(item)}>
                      <Text style={styles.price}>
                        ${item.unitPrice.toFixed(2)}
                      </Text>
                      {item.unitPrice !== item.originalPrice && (
                        <Text style={styles.originalPrice}>
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
                      color={COLORS.expense}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Discount Section */}
            <View style={styles.discountSection}>
              <Text style={styles.discountLabel}>Discount</Text>
              <View style={styles.discountRow}>
                <TouchableOpacity
                  style={styles.discountToggle}
                  onPress={toggleDiscountType}
                >
                  <Text style={styles.discountToggleText}>
                    {discount.type === "percent" ? "%" : "$"}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.discountInput}
                  value={discountInput}
                  onChangeText={handleDiscountChange}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>

            {/* Totals */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
              </View>
              {discountAmount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Discount</Text>
                  <Text style={[styles.totalValue, { color: COLORS.income }]}>
                    -${discountAmount.toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.payButton} onPress={onPressPay}>
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
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.background,
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
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
    color: COLORS.textPrimary,
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
    color: COLORS.posButton,
    textAlign: "right",
  },
  originalPrice: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
    textDecorationLine: "line-through",
    textAlign: "right",
  },
  priceInput: {
    backgroundColor: COLORS.card,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: SIZES.fontBody,
    fontWeight: "600",
    color: COLORS.posButton,
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
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: SIZES.fontBody,
    color: COLORS.textPrimary,
  },
  totalsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
    paddingTop: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
  },
  totalValue: {
    fontSize: SIZES.fontBody,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
    paddingTop: 8,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  grandTotalValue: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "700",
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.background,
    alignItems: "center",
  },
  cancelText: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  payButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.income,
    alignItems: "center",
  },
  payText: {
    fontSize: SIZES.fontBody,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
