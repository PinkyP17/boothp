import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { COLORS, SIZES } from "../../constants/theme";

const FILTERS = ["All", "Income", "Expenses"];

export default function FilterTabs({ selected, onSelect }) {
  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => {
        const isSelected = filter === selected;
        return (
          <TouchableOpacity
            key={filter}
            style={[styles.tab, isSelected && styles.tabSelected]}
            onPress={() => onSelect(filter)}
          >
            <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
              {filter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    alignItems: "center",
  },
  tabSelected: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: SIZES.fontCaption,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  tabTextSelected: {
    color: "#FFFFFF",
  },
});
