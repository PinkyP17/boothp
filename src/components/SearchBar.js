import { StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, CARD_SHADOW } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
}) {
  const { colors: C } = useTheme();
  return (
    <View style={[styles.container, CARD_SHADOW, { backgroundColor: C.card }]}>
      <Ionicons name="search-outline" size={20} color={C.textSecondary} />
      <TextInput
        style={[styles.input, { color: C.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: SIZES.cardRadius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: SIZES.fontBody,
    marginLeft: 8,
    padding: 0,
  },
});
