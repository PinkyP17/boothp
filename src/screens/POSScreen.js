import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  LayoutAnimation,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../constants/theme";
import { CATEGORIES } from "../data/mockData";
import { useAppState } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import CategoryFilter from "../components/CategoryFilter";
import POSItemTile from "../components/pos/POSItemTile";
import CartBar from "../components/pos/CartBar";
import CartModal from "../components/pos/CartModal";
import PaymentModal from "../components/pos/PaymentModal";

export default function POSScreen() {
  const { state, createSale, loadInventory } = useAppState();
  const { token } = useAuth();
  const inventoryItems = state.inventory;

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState({ type: "percent", value: 0 });
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const filteredItems = inventoryItems.filter((item) => {
    return selectedCategory === "All" || item.category === selectedCategory;
  });

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const discountAmount =
    discount.type === "percent"
      ? (subtotal * discount.value) / 100
      : discount.value;
  const total = Math.max(0, subtotal - discountAmount);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (item) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [
        ...prev,
        {
          itemId: item.id,
          name: item.name,
          quantity: 1,
          unitPrice: item.sellingPrice,
          originalPrice: item.sellingPrice,
        },
      ];
    });
  };

  const updateQty = (itemId, delta) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCart((prev) => {
      return prev
        .map((c) =>
          c.itemId === itemId ? { ...c, quantity: c.quantity + delta } : c,
        )
        .filter((c) => c.quantity > 0);
    });
  };

  const updatePrice = (itemId, newPrice) => {
    setCart((prev) =>
      prev.map((c) =>
        c.itemId === itemId ? { ...c, unitPrice: newPrice } : c,
      ),
    );
  };

  const removeFromCart = (itemId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCart((prev) => prev.filter((c) => c.itemId !== itemId));
  };

  const confirmSale = async (paymentMethod) => {
    const saleData = {
      items: cart.map((c) => ({
        itemId: c.itemId,
        name: c.name,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        originalPrice: c.originalPrice,
      })),
      discount:
        discount.value > 0
          ? {
              type: discount.type === "percent" ? "percent" : "fixed",
              value: discount.value,
              amount: discountAmount,
            }
          : null,
      total,
      paymentMethod,
    };

    const result = await createSale(token, saleData);
    if (result) {
      // Reload inventory to get updated stock from backend
      loadInventory(token);
      setCart([]);
      setDiscount({ type: "percent", value: 0 });
      setPaymentModalVisible(false);
      setCartModalVisible(false);
      setShowSuccess(true);
    }
  };

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>POS</Text>
        {state.sales.length > 0 && (
          <Text style={styles.salesCount}>
            {state.sales.length} sale{state.sales.length !== 1 ? "s" : ""} today
          </Text>
        )}
      </View>

      <View style={styles.filterContainer}>
        <CategoryFilter
          categories={CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.map((item) => {
          const cartItem = cart.find((c) => c.itemId === item.id);
          return (
            <POSItemTile
              key={item.id}
              item={item}
              onPress={() => addToCart(item)}
              inCartQty={cartItem ? cartItem.quantity : 0}
            />
          );
        })}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <CartBar
        itemCount={itemCount}
        total={total}
        onPressPay={() => setCartModalVisible(true)}
        onPressExpand={() => setCartModalVisible(true)}
      />

      <CartModal
        visible={cartModalVisible}
        cart={cart}
        onClose={() => setCartModalVisible(false)}
        onUpdateQty={updateQty}
        onUpdatePrice={updatePrice}
        onRemoveItem={removeFromCart}
        onSetDiscount={setDiscount}
        discount={discount}
        onPressPay={() => {
          setCartModalVisible(false);
          setPaymentModalVisible(true);
        }}
      />

      <PaymentModal
        visible={paymentModalVisible}
        total={total}
        onClose={() => setPaymentModalVisible(false)}
        onConfirm={confirmSale}
      />

      {showSuccess && (
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.income} />
            <Text style={styles.successText}>Sale Complete!</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  salesCount: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
  },
  filterContainer: {
    paddingHorizontal: SIZES.padding,
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding,
  },
  bottomSpacer: {
    height: 100,
    width: "100%",
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  successBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  successText: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
});
