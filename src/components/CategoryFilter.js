import { StyleSheet, Text, ScrollView, TouchableOpacity } from "react-native";
import { SIZES } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

export default function CategoryFilter({ categories, selected, onSelect }) {
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
});
