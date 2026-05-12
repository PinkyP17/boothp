import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, CARD_SHADOW } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";

export default function InventoryItemCard({ item, onPress, onRestock }) {
  const { colors: C } = useTheme();
  const isOutOfStock = item.stock === 0;
  const imageCount = item.images ? item.images.length : item.imageUri ? 1 : 0;

  return (
    <TouchableOpacity
      style={[styles.card, CARD_SHADOW, { backgroundColor: C.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Top row: thumbnail + name + category badge */}
      <View style={styles.topRow}>
        {item.imageUri ? (
          <View style={styles.thumbnailContainer}>
            <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
            {imageCount > 1 && (
              <View style={styles.imageCountBadge}>
                <Text style={styles.imageCountText}>{imageCount}</Text>
              </View>
            )}
          </View>
        ) : (
          <View
            style={[
              styles.thumbnailPlaceholder,
              { backgroundColor: C.background },
            ]}
          >
            <Ionicons
              name="cube-outline"
              size={20}
              color={C.textSecondary}
            />
          </View>
        )}
        <Text style={[styles.name, { color: C.textPrimary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: C.primary + "15" },
          ]}
        >
          <Text style={[styles.categoryText, { color: C.primary }]}>
            {item.category}
          </Text>
        </View>
      </View>

      {/* Stock count */}
      <Text
        style={[
          styles.stock,
          { color: C.textPrimary },
          isOutOfStock && { color: C.expense },
        ]}
      >
        {isOutOfStock ? "Out of Stock" : `${item.stock} in stock`}
      </Text>

      {/* Bottom row: cost/price + restock button */}
      <View style={styles.bottomRow}>
        <View style={styles.priceInfo}>
          <Text style={[styles.priceLabel, { color: C.textSecondary }]}>
            Cost:{" "}
            <Text style={[styles.priceValue, { color: C.textPrimary }]}>
              ${item.productionCost.toFixed(2)}
            </Text>
          </Text>
          <Text style={[styles.priceLabel, { color: C.textSecondary }]}>
            {" "}
            Price:{" "}
            <Text style={[styles.priceValue, { color: C.textPrimary }]}>
              ${item.sellingPrice.toFixed(2)}
            </Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.restockButton}
          onPress={(e) => {
            e.stopPropagation?.();
            onRestock();
          }}
        >
          <Ionicons name="add-circle-outline" size={16} color={C.primary} />
          <Text style={[styles.restockText, { color: C.primary }]}>
            Restock
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.cardRadius,
    padding: SIZES.padding,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  thumbnailContainer: {
    position: "relative",
    marginRight: 10,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  imageCountBadge: {
    position: "absolute",
    bottom: -2,
    right: -4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
  },
  imageCountText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  thumbnailPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  name: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "500",
  },
  stock: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "700",
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceInfo: {
    flexDirection: "row",
  },
  priceLabel: {
    fontSize: SIZES.fontCaption,
  },
  priceValue: {
    fontWeight: "500",
  },
  restockButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  restockText: {
    fontSize: SIZES.fontCaption,
    fontWeight: "500",
  },
});
