import { StyleSheet, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
  onLongPressCategory,
  onAddPress,
}) {
  const { colors: C } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {categories.map((category) => {
        const isSelected = category === selected;
        return (
          <TouchableOpacity
            key={category}
            style={[
              styles.pill,
              { backgroundColor: isSelected ? C.primary : C.card },
            ]}
            onPress={() => onSelect(category)}
            onLongPress={
              onLongPressCategory && category !== "All"
                ? () => onLongPressCategory(category)
                : undefined
            }
          >
            <Text
              style={[
                styles.pillText,
                { color: isSelected ? "#FFFFFF" : C.textSecondary },
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        );
      })}
      {onAddPress && (
        <TouchableOpacity
          style={[styles.pill, styles.addPill, { borderColor: C.primary }]}
          onPress={onAddPress}
        >
          <Ionicons name="add" size={16} color={C.primary} />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  content: {
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: SIZES.fontCaption,
    fontWeight: "500",
  },
  addPill: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
});
