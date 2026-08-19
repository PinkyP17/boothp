import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SIZES } from "../constants/theme";
import { CATEGORIES } from "../constants/categories";
import { useAppState } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/Toast";
import SummaryCard from "../components/SummaryCard";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";
import InventoryItemCard from "../components/inventory/InventoryItemCard";
import InventoryItemModal from "../components/inventory/InventoryItemModal";

export default function InventoryScreen() {
  const { state, loadInventory, addInventoryItem, updateInventoryItem, restockItem } = useAppState();
  const { colors: C } = useTheme();
  const { showToast } = useToast();
  const items = state.inventory;

  useEffect(() => {
    loadInventory();
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalItems = items.reduce((sum, item) => sum + item.stock, 0);
  const inventoryValue = items.reduce(
    (sum, item) => sum + item.stock * item.productionCost,
    0,
  );

  const openAddModal = () => {
    setSelectedItem(null);
    setModalMode("add");
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setModalMode("edit");
    setModalVisible(true);
  };

  const openRestockModal = (item) => {
    setSelectedItem(item);
    setModalMode("restock");
    setModalVisible(true);
  };

  const handleSave = (data) => {
    let result;
    if (modalMode === "add") {
      result = addInventoryItem(data);
    } else if (modalMode === "edit") {
      result = updateInventoryItem(data.id, data);
    } else if (modalMode === "restock") {
      result = restockItem(data.itemId, {
        quantity: data.quantity,
        cost: data.cost,
      });
    }
    if (result && !result.success) {
      showToast(result.message || "Failed to save item", "error");
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <ScrollView
        style={styles.container}
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
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.textPrimary }]}>Inventory</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>{items.length} items</Text>
        </View>

        <View style={styles.cardsRow}>
          <SummaryCard
            title="Total Stock"
            amount={totalItems}
            color={C.primary}
            format="number"
          />
          <SummaryCard
            title="Inventory Value"
            amount={inventoryValue}
            color={C.expense}
          />
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search items..."
        />
        <CategoryFilter
          categories={CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {state.isLoading && items.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="cube-outline"
              size={48}
              color={C.textSecondary}
            />
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>No items found</Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <InventoryItemCard
              key={item.id}
              item={item}
              onPress={() => openEditModal(item)}
              onRestock={() => openRestockModal(item)}
            />
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: C.primary }]}
        onPress={openAddModal}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <InventoryItemModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        item={selectedItem}
        mode={modalMode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
  },
  header: {
    marginTop: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: SIZES.fontBody,
    marginTop: 4,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: SIZES.fontBody,
    marginTop: 12,
  },
  bottomSpacer: {
    height: 80,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
