import { StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, CARD_SHADOW } from "../constants/theme";

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
}) {
  return (
    <View style={[styles.container, CARD_SHADOW]}>
      <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: SIZES.fontBody,
    color: COLORS.textPrimary,
    marginLeft: 8,
    padding: 0,
  },
});
