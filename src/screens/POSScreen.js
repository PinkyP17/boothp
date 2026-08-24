import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  LayoutAnimation,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SIZES } from "../constants/theme";
import { useAppState } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/Toast";
import CategoryFilter from "../components/CategoryFilter";
import POSItemTile from "../components/pos/POSItemTile";
import CartBar from "../components/pos/CartBar";
import CartModal from "../components/pos/CartModal";
import PaymentModal from "../components/pos/PaymentModal";

export default function POSScreen() {
  const { colors: C } = useTheme();
  const { state, createSale, loadInventory, loadCategories } = useAppState();
  const { showToast } = useToast();
  const inventoryItems = state.inventory;
  const categoryOptions = ["All", ...state.categories];

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState({ type: "percent", value: 0 });
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

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
    const existingQty = cart.find((c) => c.itemId === item.id)?.quantity || 0;
    if (existingQty >= item.stock) {
      showToast(`Only ${item.stock} in stock`, "error");
      return;
    }
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
    if (delta > 0) {
      const invItem = inventoryItems.find((i) => i.id === itemId);
      const currentQty = cart.find((c) => c.itemId === itemId)?.quantity || 0;
      if (invItem && currentQty >= invItem.stock) {
        showToast(`Only ${invItem.stock} in stock`, "error");
        return;
      }
    }
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
    if (submitting) return;
    setSubmitting(true);
    try {
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

      const result = createSale(saleData);
      if (result?.success) {
        loadInventory();
        setCart([]);
        setDiscount({ type: "percent", value: 0 });
        setPaymentModalVisible(false);
        setCartModalVisible(false);
        showToast("Sale complete!", "success");
      } else if (result) {
        showToast(result.message || "Failed to complete sale", "error");
      }
    } catch (error) {
      showToast("Failed to complete sale", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.textPrimary }]}>POS</Text>
        {state.sales.length > 0 && (
          <Text style={[styles.salesCount, { color: C.textSecondary }]}>
            {state.sales.length} sale{state.sales.length !== 1 ? "s" : ""} today
          </Text>
        )}
      </View>

      <View style={styles.filterContainer}>
        <CategoryFilter
          categories={categoryOptions}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadInventory();
              setRefreshing(false);
            }}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
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
        submitting={submitting}
        onClose={() => setPaymentModalVisible(false)}
        onConfirm={confirmSale}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
  },
  salesCount: {
    fontSize: SIZES.fontCaption,
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
    // Leaves room for the in-cart quantity badge, which pokes above the tile's
    // own top edge (see POSItemTile.js) — without this the ScrollView's
    // viewport clips it for the first row of tiles.
    paddingTop: 10,
  },
  bottomSpacer: {
    height: 100,
    width: "100%",
  },
});
