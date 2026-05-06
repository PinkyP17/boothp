import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { COLORS, SIZES } from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TILE_WIDTH = (SCREEN_WIDTH - SIZES.padding * 3) / 2;

export default function POSItemTile({ item, onPress, inCartQty }) {
  const isOutOfStock = item.stock === 0;

  return (
    <TouchableOpacity
      style={[styles.tile, isOutOfStock && styles.disabled]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isOutOfStock}
    >
      {/* Cart quantity badge */}
      {inCartQty > 0 && (
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyBadgeText}>{inCartQty}</Text>
        </View>
      )}

      {/* Stock badge */}
      <View style={[styles.stockBadge, isOutOfStock && styles.stockBadgeOut]}>
        <Text style={[styles.stockText, isOutOfStock && styles.stockTextOut]}>
          {isOutOfStock ? "Out" : item.stock}
        </Text>
      </View>

      {item.imageUri && (
        <Image
          source={{ uri: item.imageUri }}
          style={styles.tileImage}
          resizeMode="cover"
        />
      )}

      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.price}>${item.sellingPrice.toFixed(2)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: TILE_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    padding: 14,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
    borderWidth: 2,
    borderColor: COLORS.posButton + "30",
    overflow: "hidden",
  },
  tileImage: {
    width: "100%",
    height: 60,
    borderRadius: 6,
    marginBottom: 6,
  },
  disabled: {
    opacity: 0.4,
  },
  qtyBadge: {
    position: "absolute",
    top: -6,
    left: -6,
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  qtyBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  stockBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stockBadgeOut: {
    backgroundColor: COLORS.expense + "15",
  },
  stockText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "600",
  },
  stockTextOut: {
    color: COLORS.expense,
  },
  name: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  price: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "700",
    color: COLORS.posButton,
  },
});
