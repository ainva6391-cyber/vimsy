import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const canSubmit = name.trim() && username.trim() && email.trim() && password.length >= 6;

  async function handleSignUp() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { error: err, needsEmailConfirmation } = await signUp(
      email.trim(),
      password,
      { name: name.trim(), username: username.trim().toLowerCase() },
    );

    setLoading(false);

    if (err) {
      setError(err);
    } else if (needsEmailConfirmation) {
      setNeedsConfirmation(true);
    } else {
      router.replace("/(tabs)");
    }
  }

  if (needsConfirmation) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.inner, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
          <View style={[styles.verifyIcon, { backgroundColor: colors.tag }]}>
            <Ionicons name="mail-outline" size={34} color={colors.primary} />
          </View>
          <Text style={[styles.heading, { color: colors.foreground, textAlign: "center" }]}>
            One more step
          </Text>
          <Text style={[styles.subheading, { color: colors.mutedForeground, textAlign: "center" }]}>
            A confirmation email was sent to{"\n"}
            <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{email}</Text>
            {"\n\n"}Click the link to activate your account, then sign in below.{"\n\n"}
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13 }}>
              To skip this step entirely, go to your Supabase dashboard → Authentication → Providers → Email and turn off{" "}
              <Text style={{ fontFamily: "Inter_600SemiBold" }}>Confirm email</Text>.
            </Text>
          </Text>
          <Pressable
            onPress={() => router.replace("/(auth)/sign-in")}
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
              Go to Sign In
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.inner,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>

        <View style={styles.logoRow}>
          <Text style={[styles.logoText, { color: colors.primary }]}>Vimsy</Text>
        </View>

        <Text style={[styles.heading, { color: colors.foreground }]}>Create your account</Text>
        <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
          Join Vimsy and start curating your style
        </Text>

        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "44" }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.destructive} />
            <Text style={[styles.errorBannerText, { color: colors.destructive }]}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={(v) => { setName(v); setError(null); }}
              textContentType="name"
              autoCorrect={false}
            />
          </View>

          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>Username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="your_username"
              placeholderTextColor={colors.mutedForeground}
              value={username}
              onChangeText={(v) => { setUsername(v.replace(/[^a-z0-9_.]/gi, "")); setError(null); }}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
            />
          </View>

          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(null); }}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCorrect={false}
            />
          </View>

          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(null); }}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={[styles.eyeBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handleSignUp}
            disabled={!canSubmit || loading}
            style={[styles.primaryBtn, { backgroundColor: canSubmit ? colors.primary : colors.muted }]}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.primaryBtnText, { color: canSubmit ? colors.primaryForeground : colors.mutedForeground }]}>
                Create Account
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Already have an account?{" "}
          </Text>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
            </Pressable>
          </Link>
        </View>

        <Text style={[styles.terms, { color: colors.mutedForeground }]}>
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inner: { flexGrow: 1, paddingHorizontal: 28 },
  backBtn: { alignSelf: "flex-start", padding: 6, marginBottom: 16 },
  logoRow: { alignItems: "center", marginBottom: 32 },
  logoText: { fontSize: 36, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  verifyIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: 20,
  },
  heading: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginBottom: 8 },
  subheading: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22, marginBottom: 24 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorBannerText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  form: { gap: 20, marginBottom: 24 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 8 },
  input: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  passwordRow: { flexDirection: "row", gap: 10 },
  passwordInput: { flex: 1 },
  eyeBtn: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: { borderRadius: 100, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 16 },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  footerLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  terms: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 20,
    paddingHorizontal: 20,
  },
});
