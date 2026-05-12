import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, CARD_SHADOW } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

export default function AboutScreen() {
  const { colors: C } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={["bottom"]}>
      <View style={styles.container}>
        <View style={[styles.card, CARD_SHADOW, { backgroundColor: C.card }]}>
          <View style={styles.avatarBox}>
            <Ionicons name="person-circle" size={64} color={C.primary} />
          </View>
          <Text style={[styles.name, { color: C.textPrimary }]}>PinkyP</Text>
          <Text style={[styles.bio, { color: C.textSecondary }]}>
            Artist and a Software Engineer that creates this app to manage my
            booth in convention.
          </Text>
        </View>

        <Text style={[styles.comingSoon, { color: C.textSecondary }]}>
          Full about page coming in a future update.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
    paddingTop: 8,
  },
  card: {
    borderRadius: SIZES.cardRadius,
    padding: 24,
    alignItems: "center",
  },
  avatarBox: {
    marginBottom: 12,
  },
  name: {
    fontSize: SIZES.fontSubtitle,
    fontWeight: "700",
    marginBottom: 8,
  },
  bio: {
    fontSize: SIZES.fontBody,
    textAlign: "center",
    lineHeight: 22,
  },
  comingSoon: {
    fontSize: SIZES.fontCaption,
    textAlign: "center",
    marginTop: 24,
  },
});
