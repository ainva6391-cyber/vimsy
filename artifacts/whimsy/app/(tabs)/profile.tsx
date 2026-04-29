import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MasonryGrid from "@/components/MasonryGrid";
import UserAvatar from "@/components/UserAvatar";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  supabase,
  uploadProfileImage,
  UploadValidationError,
  UploadStorageError,
} from "@/lib/supabase";

function SignedOutProfile() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = insets.top;

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
  const { user, signOut } = useAuth();
  const { myPosts } = useApp();
  const topPad = insets.top;

  const [avatarUploading, setAvatarUploading] = useState(false);

  function confirmSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  }

  async function pickAndUploadAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library to change your profile photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const localUri = result.assets[0].uri;
    setAvatarUploading(true);

    try {
      // Step 1: Upload to Supabase Storage (validates type/size, returns public URL)
      const { publicUrl } = await uploadProfileImage(localUri, user!.id);

      // Step 2: Store the public URL in Supabase user metadata so it persists across sessions
      const { error: updateErr } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (updateErr) {
        console.warn("[Profile] Supabase updateUser failed:", updateErr.message);
      }
    } catch (err) {
      if (err instanceof UploadValidationError) {
        Alert.alert("Can't upload photo", err.message);
      } else if (err instanceof UploadStorageError) {
        Alert.alert("Upload failed", err.message);
      } else {
        Alert.alert("Upload failed", "Something went wrong. Please try again.");
        console.error("[Profile] Avatar upload error:", err);
      }
    } finally {
      setAvatarUploading(false);
    }
  }

  const meta = user?.user_metadata ?? {};
  const displayName =
    (meta.name as string) ||
    (meta.username as string) ||
    user?.email?.split("@")[0] ||
    "Whimsy User";
  const username =
    (meta.username as string) ||
    user?.email?.split("@")[0] ||
    "whimsy.user";
  const avatarUri = (meta.avatar_url as string) ?? null;

  const header = (
    <View style={[styles.profileHeader, { paddingTop: topPad + 10 }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }} />
        <Pressable onPress={confirmSignOut} hitSlop={10} style={styles.signOutBtn}>
          <Ionicons name="log-out-outline" size={22} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Tappable avatar with camera overlay */}
      <Pressable onPress={pickAndUploadAvatar} disabled={avatarUploading} style={styles.avatarWrap}>
        <UserAvatar uri={avatarUri} size={80} />
        <View style={[styles.avatarOverlay, { backgroundColor: "rgba(0,0,0,0.38)" }]}>
          {avatarUploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="camera" size={18} color="#fff" />
          )}
        </View>
      </Pressable>

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
  const { user } = useAuth();
  return user ? <SignedInProfile /> : <SignedOutProfile />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
  avatarWrap: {
    position: "relative",
    width: 80,
    height: 80,
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
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
