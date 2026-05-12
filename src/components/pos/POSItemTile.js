import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { SIZES } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TILE_WIDTH = (SCREEN_WIDTH - SIZES.padding * 3) / 2;

export default function POSItemTile({ item, onPress, inCartQty }) {
  const { colors: C } = useTheme();
  const isOutOfStock = item.stock === 0;

  return (
    <TouchableOpacity
      style={[
        styles.tile,
        {
          backgroundColor: C.card,
          borderColor: C.posButton + "30",
        },
        isOutOfStock && styles.disabled,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isOutOfStock}
    >
      {/* Cart quantity badge */}
      {inCartQty > 0 && (
        <View style={[styles.qtyBadge, { backgroundColor: C.primary }]}>
          <Text style={styles.qtyBadgeText}>{inCartQty}</Text>
        </View>
      )}

      {/* Stock badge */}
      <View
        style={[
          styles.stockBadge,
          { backgroundColor: C.primary + "15" },
          isOutOfStock && { backgroundColor: C.expense + "15" },
        ]}
      >
        <Text
          style={[
            styles.stockText,
            { color: C.primary },
            isOutOfStock && { color: C.expense },
          ]}
        >
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

      <Text style={[styles.name, { color: C.textPrimary }]} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={[styles.price, { color: C.posButton }]}>
        ${item.sellingPrice.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: TILE_WIDTH,
    borderRadius: SIZES.cardRadius,
    padding: 14,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
    borderWidth: 2,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stockText: {
    fontSize: 10,
    fontWeight: "600",
  },
  name: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  price: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "700",
  },
});
