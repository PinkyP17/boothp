import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { inventoryItems as initialItems, CATEGORIES } from '../data/mockData';
import SummaryCard from '../components/SummaryCard';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import InventoryItemCard from '../components/InventoryItemCard';
import InventoryItemModal from '../components/InventoryItemModal';

export default function InventoryScreen() {
  const [items, setItems] = useState(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedItem, setSelectedItem] = useState(null);

  // Filtering
  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Summary stats
  const totalItems = items.reduce((sum, item) => sum + item.stock, 0);
  const inventoryValue = items.reduce((sum, item) => sum + item.stock * item.productionCost, 0);

  // Handlers
  const openAddModal = () => {
    setSelectedItem(null);
    setModalMode('add');
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setModalMode('edit');
    setModalVisible(true);
  };

  const openRestockModal = (item) => {
    setSelectedItem(item);
    setModalMode('restock');
    setModalVisible(true);
  };

  const handleSave = (data) => {
    if (modalMode === 'add') {
      setItems([data, ...items]);
    } else if (modalMode === 'edit') {
      setItems(items.map((i) => (i.id === data.id ? data : i)));
    } else if (modalMode === 'restock') {
      setItems(items.map((i) =>
        i.id === data.itemId ? { ...i, stock: i.stock + data.quantity } : i
      ));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>{items.length} items</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.cardsRow}>
          <SummaryCard title="Total Stock" amount={totalItems} color={COLORS.primary} format="number" />
          <SummaryCard title="Inventory Value" amount={inventoryValue} color={COLORS.expense} />
        </View>

        {/* Search + Filter */}
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search items..." />
        <CategoryFilter categories={CATEGORIES} selected={selectedCategory} onSelect={setSelectedCategory} />

        {/* Item List */}
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No items found</Text>
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

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal */}
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
    backgroundColor: COLORS.background,
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
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  bottomSpacer: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
