import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, CARD_SHADOW } from "../constants/theme";

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.container}>
        <View style={[styles.card, CARD_SHADOW]}>
          <View style={styles.avatarBox}>
            <Ionicons name="person-circle" size={64} color={COLORS.primary} />
          </View>
          <Text style={styles.name}>Your Name</Text>
          <Text style={styles.bio}>
            Artist & developer building tools to help creators manage their
            convention booths.
          </Text>
        </View>

        <Text style={styles.comingSoon}>
          Full about page coming in a future update.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
    paddingTop: 8,
  },
  card: {
    backgroundColor: COLORS.card,
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
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  bio: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  comingSoon: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 24,
  },
});
