import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SIZES } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function LoginScreen({ navigation }) {
  const { login, isLoading, error, clearError } = useAuth();
  const { colors: C } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    login(email.trim(), password);
  };

  const goToSignUp = () => {
    clearError();
    navigation.navigate("SignUp");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: C.card }]}>
              <Ionicons name="storefront-outline" size={40} color={C.primary} />
            </View>
            <Text style={[styles.title, { color: C.textPrimary }]}>Artist Booth Manager</Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>Sign in to your account</Text>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={C.expense} />
              <Text style={[styles.errorText, { color: C.expense }]}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Text style={[styles.label, { color: C.textPrimary }]}>Email</Text>
            <View style={[styles.inputContainer, { backgroundColor: C.card }]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={C.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: C.textPrimary }]}
                placeholder="Enter your email"
                placeholderTextColor={C.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={[styles.label, { color: C.textPrimary }]}>Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: C.card }]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={C.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: C.textPrimary }]}
                placeholder="Enter your password"
                placeholderTextColor={C.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={C.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: C.primary }, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: C.textSecondary }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={goToSignUp}>
              <Text style={[styles.footerLink, { color: C.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SIZES.padding * 1.5,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: SIZES.fontBody,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF2F2",
    borderRadius: SIZES.cardRadius,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: SIZES.fontCaption,
    flex: 1,
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: SIZES.fontCaption,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: SIZES.cardRadius,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: SIZES.fontBody,
  },
  eyeButton: {
    padding: 4,
  },
  button: {
    borderRadius: SIZES.cardRadius,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: SIZES.fontBody,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: SIZES.fontBody,
  },
  footerLink: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
  },
});
