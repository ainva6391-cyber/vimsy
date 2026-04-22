import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function BoardDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getBoardById, getBoardPosts, deleteBoard, removeFromBoard } = useApp();

  const board = getBoardById(id ?? "");
  const posts = board ? getBoardPosts(id ?? "") : [];
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!board) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Ionicons name="albums-outline" size={44} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
          Board not found
        </Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtn2, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.backBtn2Text, { color: colors.foreground }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  function confirmDelete() {
    Alert.alert(
      "Delete Board",
      `Delete "${board!.name}"? This will not delete the posts inside.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteBoard(board!.id);
            router.back();
          },
        },
      ]
    );
  }

  const header = (
    <View style={[styles.boardHeader, { paddingTop: topPad + 10 }]}>
      <View style={styles.navRow}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Pressable onPress={confirmDelete} hitSlop={10} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color={colors.destructive} />
        </Pressable>
      </View>
      <Text style={[styles.boardName, { color: colors.foreground }]}>{board.name}</Text>
      <Text style={[styles.boardCount, { color: colors.mutedForeground }]}>
        {posts.length} {posts.length === 1 ? "look" : "looks"}
      </Text>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <MasonryGrid
        posts={posts}
        ListHeaderComponent={header}
        style={styles.gridPad}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="image-outline" size={44} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Board is empty</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Save looks to this board from the bookmark menu on any post
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 30,
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  backBtn2: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
    marginTop: 8,
  },
  backBtn2Text: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  boardHeader: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 4,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn: {
    padding: 6,
  },
  deleteBtn: {
    padding: 6,
  },
  boardName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  boardCount: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  gridPad: { paddingTop: 8 },
  empty: {
    alignItems: "center",
    paddingTop: 60,
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
    lineHeight: 21,
  },
});
