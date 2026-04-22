import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MasonryGrid from "@/components/MasonryGrid";
import UserAvatar from "@/components/UserAvatar";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, myPosts, savedPosts } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const header = (
    <View style={[styles.profileHeader, { paddingTop: topPad + 10 }]}>
      <UserAvatar uri={currentUser.avatar} size={80} />
      <Text style={[styles.displayName, { color: colors.foreground }]}>
        {currentUser.displayName}
      </Text>
      <Text style={[styles.username, { color: colors.mutedForeground }]}>
        @{currentUser.username}
      </Text>
      {currentUser.bio ? (
        <Text style={[styles.bio, { color: colors.foreground }]}>{currentUser.bio}</Text>
      ) : null}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>
            {myPosts.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Looks</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>
            {currentUser.followers}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Followers</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>
            {currentUser.following}
          </Text>
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
            <Feather name="camera" size={44} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No looks yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Share your first outfit look from the upload tab
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 8,
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
  bio: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 10,
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
  gridPad: {
    paddingTop: 8,
  },
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
