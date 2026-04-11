import { StyleSheet, Text, ScrollView, TouchableOpacity } from "react-native";
import { COLORS, SIZES } from "../constants/theme";

export default function CategoryFilter({ categories, selected, onSelect }) {
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
            style={[styles.pill, isSelected && styles.pillSelected]}
            onPress={() => onSelect(category)}
          >
            <Text
              style={[styles.pillText, isSelected && styles.pillTextSelected]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        );
      })}
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
    backgroundColor: COLORS.card,
  },
  pillSelected: {
    backgroundColor: COLORS.primary,
  },
  pillText: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  pillTextSelected: {
    color: "#FFFFFF",
  },
});
