import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SIZES } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";

const FILTERS = ["All", "Income", "Expenses"];

export default function FilterTabs({ selected, onSelect }) {
  const { colors: C } = useTheme();

  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => {
        const isSelected = filter === selected;
        return (
          <TouchableOpacity
            key={filter}
            style={[styles.tab, { backgroundColor: isSelected ? C.primary : C.card }]}
            onPress={() => onSelect(filter)}
          >
            <Text style={[styles.tabText, { color: isSelected ? "#FFFFFF" : C.textSecondary }]}>
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
    alignItems: "center",
  },
  tabText: {
    fontSize: SIZES.fontCaption,
    fontWeight: "600",
  },
});
