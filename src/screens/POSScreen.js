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
import { inventoryItems, CATEGORIES } from "../data/mockData";
import CategoryFilter from "../components/CategoryFilter";
import POSItemTile from "../components/pos/POSItemTile";
import CartBar from "../components/pos/CartBar";
import CartModal from "../components/pos/CartModal";
import PaymentModal from "../components/pos/PaymentModal";


export default function POSScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState({ type: "percent", value: 0 });
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [salesHistory, setSalesHistory] = useState([]);

  // Filtering
  const filteredItems = inventoryItems.filter((item) => {
    return selectedCategory === "All" || item.category === selectedCategory;
  });

  // Cart calculations
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

  // Handlers
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

  const confirmSale = (paymentMethod) => {
    const sale = {
      id: Date.now().toString(),
      items: [...cart],
      subtotal,
      discount: { ...discount, amount: discountAmount },
      total,
      paymentMethod,
      timestamp: new Date().toISOString(),
    };
    setSalesHistory((prev) => [sale, ...prev]);

    // Clear cart and close modals
    setCart([]);
    setDiscount({ type: "percent", value: 0 });
    setPaymentModalVisible(false);
    setCartModalVisible(false);

    // Show success toast
    setShowSuccess(true);
  };

  // Auto-dismiss success toast
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>POS</Text>
        {salesHistory.length > 0 && (
          <Text style={styles.salesCount}>
            {salesHistory.length} sale{salesHistory.length !== 1 ? "s" : ""}{" "}
            today
          </Text>
        )}
      </View>

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <CategoryFilter
          categories={CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </View>

      {/* Item Grid */}
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

      {/* Cart Bar */}
      <CartBar
        itemCount={itemCount}
        total={total}
        onPressPay={() => setCartModalVisible(true)}
        onPressExpand={() => setCartModalVisible(true)}
      />

      {/* Cart Modal */}
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

      {/* Payment Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        total={total}
        onClose={() => setPaymentModalVisible(false)}
        onConfirm={confirmSale}
      />

      {/* Success Toast */}
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
