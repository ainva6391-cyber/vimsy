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
  const { user, signOut, refreshUser } = useAuth();
  const { myPosts } = useApp();
  const topPad = insets.top;

  const [avatarUploading, setAvatarUploading] = useState(false);
  // Local preview — updates immediately after a successful upload so the
  // user doesn't have to wait for a full session refresh to see their new photo.
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  function confirmSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  }

  async function pickAndUploadAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to change your profile photo.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,   // opens the built-in square crop editor
      aspect: [1, 1],        // enforces a 1:1 ratio to match the circular avatar
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return;

    const localUri = result.assets[0].uri;
    // Show the cropped image immediately — no spinner-wait needed for the preview
    setLocalAvatarUri(localUri);
    setAvatarUploading(true);

    try {
      // 1. Upload the cropped image → user_profile_images/private/avatar.{ext}
      const { publicUrl } = await uploadProfileImage(localUri);

      // 2. Persist the public URL in Supabase user metadata
      const { error: updateErr } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (updateErr) {
        console.warn("[Profile] updateUser failed:", updateErr.message);
      }

      // 3. Re-sync local session so user.user_metadata reflects the new avatar_url
      await refreshUser();

      // 4. Swap local preview for the stable CDN URL
      setLocalAvatarUri(publicUrl);
    } catch (err) {
      // On failure, revert the optimistic preview
      setLocalAvatarUri(null);
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
  // Prefer the optimistic local URI; fall back to the persisted URL from metadata
  const avatarUri = localAvatarUri ?? (meta.avatar_url as string) ?? null;

  const header = (
    <View style={[styles.profileHeader, { paddingTop: topPad + 10 }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }} />
        <Pressable onPress={confirmSignOut} hitSlop={10} style={styles.signOutBtn}>
          <Ionicons name="log-out-outline" size={22} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Tappable avatar with camera badge */}
      <Pressable
        onPress={pickAndUploadAvatar}
        disabled={avatarUploading}
        style={[styles.avatarWrap, { opacity: avatarUploading ? 0.7 : 1 }]}
      >
        <View style={[styles.avatarRing, { borderColor: colors.primary }]}>
          <UserAvatar uri={avatarUri} size={88} />
        </View>
        <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
          {avatarUploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="camera" size={15} color="#fff" />
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
    width: 96,
    height: 96,
    marginBottom: 4,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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
