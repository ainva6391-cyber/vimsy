import { Ionicons } from "@expo/vector-icons";
import { useSignUp } from "@clerk/expo";
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

import { useColors } from "@/hooks/useColors";

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp, errors, fetchStatus } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");

  const isLoading = fetchStatus === "fetching";
  const needsVerification =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  async function handleSignUp() {
    if (!email || !password) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) return;
    await signUp.verifications.sendEmailCode();
  }

  async function handleVerify() {
    await signUp.verifications.verifyEmailCode({ code: verifyCode });
    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: () => router.replace("/(tabs)"),
      });
    }
  }

  if (needsVerification) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.inner, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>

          <View style={styles.logoRow}>
            <Text style={[styles.logoText, { color: colors.primary }]}>Whimsy</Text>
          </View>

          <View style={[styles.verifyIcon, { backgroundColor: colors.tag }]}>
            <Ionicons name="mail-outline" size={34} color={colors.primary} />
          </View>

          <Text style={[styles.heading, { color: colors.foreground }]}>Check your email</Text>
          <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
            We sent a 6-digit code to{"\n"}
            <Text style={[styles.emailHighlight, { color: colors.foreground }]}>{email}</Text>
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.codeInput,
              { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="000000"
            placeholderTextColor={colors.mutedForeground}
            value={verifyCode}
            onChangeText={setVerifyCode}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
          {errors?.fields?.code && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {errors.fields.code.message}
            </Text>
          )}

          <Pressable
            onPress={handleVerify}
            disabled={verifyCode.length < 6 || isLoading}
            style={[
              styles.primaryBtn,
              { backgroundColor: verifyCode.length >= 6 ? colors.primary : colors.muted },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                Verify & Create Account
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => signUp.verifications.sendEmailCode()}
            style={styles.linkBtn}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>Resend code</Text>
          </Pressable>
        </View>

        {/* Required for Clerk bot protection */}
        <View nativeID="clerk-captcha" />
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
          <Text style={[styles.logoText, { color: colors.primary }]}>Whimsy</Text>
        </View>

        <Text style={[styles.heading, { color: colors.foreground }]}>Create your account</Text>
        <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
          Join Whimsy and start curating your style
        </Text>

        <View style={styles.form}>
          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground },
              ]}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCorrect={false}
            />
            {errors?.fields?.emailAddress && (
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {errors.fields.emailAddress.message}
              </Text>
            )}
          </View>

          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground },
                ]}
                placeholder="At least 8 characters"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
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
            {errors?.fields?.password && (
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {errors.fields.password.message}
              </Text>
            )}
          </View>

          <Pressable
            onPress={handleSignUp}
            disabled={!email || !password || isLoading}
            style={[
              styles.primaryBtn,
              { backgroundColor: email && password ? colors.primary : colors.muted },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.primaryBtnText, { color: email && password ? colors.primaryForeground : colors.mutedForeground }]}>
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

      {/* Required for Clerk bot protection */}
      <View nativeID="clerk-captcha" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  backBtn: {
    alignSelf: "flex-start",
    padding: 6,
    marginBottom: 16,
  },
  logoRow: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoText: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  verifyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  heading: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginBottom: 32,
  },
  emailHighlight: {
    fontFamily: "Inter_600SemiBold",
  },
  form: {
    gap: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  input: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  codeInput: {
    textAlign: "center",
    fontSize: 28,
    letterSpacing: 12,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  passwordRow: {
    flexDirection: "row",
    gap: 10,
  },
  passwordInput: {
    flex: 1,
  },
  eyeBtn: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
  },
  linkBtn: {
    alignItems: "center",
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  footerLink: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  terms: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 20,
    paddingHorizontal: 20,
  },
});
