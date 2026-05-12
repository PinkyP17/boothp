import { StyleSheet, Text, View } from "react-native";
import { SIZES, CARD_SHADOW } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
}

export default function EventCard({ event }) {
  const { colors: C } = useTheme();
  return (
    <View style={[styles.card, CARD_SHADOW, { backgroundColor: C.card }]}>
      <Text style={[styles.name, { color: C.textPrimary }]}>{event.name}</Text>
      <Text style={[styles.date, { color: C.primary }]}>{formatDate(event.date)}</Text>
      <Text style={[styles.location, { color: C.textSecondary }]}>{event.location}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.cardRadius,
    padding: SIZES.padding,
    marginBottom: 12,
  },
  name: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
    marginBottom: 4,
  },
  date: {
    fontSize: SIZES.fontCaption,
    marginBottom: 2,
  },
  location: {
    fontSize: SIZES.fontCaption,
  },
});
