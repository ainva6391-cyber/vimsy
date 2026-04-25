import { Ionicons } from "@expo/vector-icons";
import { useSignIn } from "@clerk/expo";
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

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");

  const isLoading = fetchStatus === "fetching";

  async function handleSignIn() {
    if (!email || !password) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) return;

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          router.replace(url.startsWith("http") ? "/(tabs)" : "/(tabs)");
        },
      });
    } else if (signIn.status === "needs_client_trust") {
      await signIn.mfa.sendEmailCode();
    }
  }

  async function handleVerify() {
    await signIn.mfa.verifyEmailCode({ code: verifyCode });
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: () => router.replace("/(tabs)"),
      });
    }
  }

  if (signIn.status === "needs_client_trust") {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.inner, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>

          <View style={styles.logoRow}>
            <Text style={[styles.logoText, { color: colors.primary }]}>Whimsy</Text>
          </View>

          <Text style={[styles.heading, { color: colors.foreground }]}>
            Verify your identity
          </Text>
          <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
            Enter the code sent to your email
          </Text>

          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="6-digit code"
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
                Verify
              </Text>
            )}
          </Pressable>

          <Pressable onPress={() => signIn.mfa.sendEmailCode()} style={styles.linkBtn}>
            <Text style={[styles.linkText, { color: colors.primary }]}>Resend code</Text>
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
          <Text style={[styles.logoText, { color: colors.primary }]}>Whimsy</Text>
        </View>

        <Text style={[styles.heading, { color: colors.foreground }]}>Welcome back</Text>
        <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
          Sign in to your account to continue
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
            {errors?.fields?.identifier && (
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {errors.fields.identifier.message}
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
                placeholder="Your password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType="password"
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
            onPress={handleSignIn}
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
                Sign In
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Don't have an account?{" "}
          </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Sign Up</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
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
  linkBtn: {
    alignItems: "center",
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
