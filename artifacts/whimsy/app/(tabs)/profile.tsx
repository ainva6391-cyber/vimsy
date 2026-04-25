import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MasonryGrid from "@/components/MasonryGrid";
import UserAvatar from "@/components/UserAvatar";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

function SignedOutProfile() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
      </View>
      <View style={styles.authPrompt}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
          <Ionicons name="person-outline" size={44} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.authTitle, { color: colors.foreground }]}>
          Your style, your story
        </Text>
        <Text style={[styles.authText, { color: colors.mutedForeground }]}>
          Sign in to view your profile, see your uploaded looks, and track your saves.
        </Text>
        <Pressable
          onPress={() => router.push("/(auth)/sign-in")}
          style={[styles.signInBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.signInBtnText, { color: colors.primaryForeground }]}>
            Sign In
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/(auth)/sign-up")}
          style={[styles.signUpBtn, { borderColor: colors.primary }]}
        >
          <Text style={[styles.signUpBtnText, { color: colors.primary }]}>
            Create Account
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SignedInProfile() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { myPosts } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function confirmSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  }

  const displayName =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Whimsy User";
  const username =
    user?.username || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "whimsy.user";
  const avatarUri = user?.imageUrl ?? null;

  const header = (
    <View style={[styles.profileHeader, { paddingTop: topPad + 10 }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }} />
        <Pressable onPress={confirmSignOut} hitSlop={10} style={styles.signOutBtn}>
          <Ionicons name="log-out-outline" size={22} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <UserAvatar uri={avatarUri} size={80} />
      <Text style={[styles.displayName, { color: colors.foreground }]}>{displayName}</Text>
      <Text style={[styles.username, { color: colors.mutedForeground }]}>@{username}</Text>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>{myPosts.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Looks</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Followers</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Following</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <MasonryGrid
        posts={myPosts}
        ListHeaderComponent={header}
        style={styles.gridPad}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="camera-outline" size={44} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No looks yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Share your first outfit look from the upload tab
            </Text>
          </View>
        }
      />
    </View>
  );
}

export default function ProfileScreen() {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <SignedInProfile /> : <SignedOutProfile />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  authPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  authTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  authText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  signInBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: "center",
  },
  signInBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  signUpBtn: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 100,
    alignItems: "center",
    borderWidth: 1.5,
  },
  signUpBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  signOutBtn: { padding: 6 },
  displayName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  username: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 0,
  },
  stat: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  statNum: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },
  gridPad: { paddingTop: 8 },
  empty: {
    alignItems: "center",
    paddingTop: 40,
    gap: 12,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
