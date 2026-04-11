import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, CARD_SHADOW } from '../constants/theme';

export default function InventoryItemCard({ item, onPress, onRestock }) {
  const isOutOfStock = item.stock === 0;

  return (
    <TouchableOpacity style={[styles.card, CARD_SHADOW]} onPress={onPress} activeOpacity={0.7}>
      {/* Top row: name + category badge */}
      <View style={styles.topRow}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>

      {/* Stock count */}
      <Text style={[styles.stock, isOutOfStock && styles.stockOut]}>
        {isOutOfStock ? 'Out of Stock' : `${item.stock} in stock`}
      </Text>

      {/* Bottom row: cost/price + restock button */}
      <View style={styles.bottomRow}>
        <View style={styles.priceInfo}>
          <Text style={styles.priceLabel}>Cost: <Text style={styles.priceValue}>${item.productionCost.toFixed(2)}</Text></Text>
          <Text style={styles.priceLabel}>  Price: <Text style={styles.priceValue}>${item.sellingPrice.toFixed(2)}</Text></Text>
        </View>
        <TouchableOpacity
          style={styles.restockButton}
          onPress={(e) => {
            e.stopPropagation?.();
            onRestock();
          }}
        >
          <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.restockText}>Restock</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    padding: SIZES.padding,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: SIZES.fontBody,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
  },
  stock: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  stockOut: {
    color: COLORS.expense,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    flexDirection: 'row',
  },
  priceLabel: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
  },
  priceValue: {
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  restockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  restockText: {
    fontSize: SIZES.fontCaption,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
