import { StyleSheet, Text, View } from "react-native";
import { COLORS, SIZES, CARD_SHADOW } from "../constants/theme";

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
  return (
    <View style={[styles.card, CARD_SHADOW]}>
      <Text style={styles.name}>{event.name}</Text>
      <Text style={styles.date}>{formatDate(event.date)}</Text>
      <Text style={styles.location}>{event.location}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    padding: SIZES.padding,
    marginBottom: 12,
  },
  name: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  date: {
    fontSize: SIZES.fontCaption,
    color: COLORS.primary,
    marginBottom: 2,
  },
  location: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
  },
});
