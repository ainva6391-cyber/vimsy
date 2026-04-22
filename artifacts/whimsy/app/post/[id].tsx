import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import UserAvatar from "@/components/UserAvatar";
import StyleTag from "@/components/StyleTag";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PostDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPostById, toggleSave, boards, createBoard, addToBoard } = useApp();

  const post = getPostById(id ?? "");
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  if (!post) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Ionicons name="image-outline" size={44} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>Post not found</Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.goBackBtn, { backgroundColor: colors.secondary }]}
        >
          <Text style={[styles.goBackText, { color: colors.foreground }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const imgHeight = SCREEN_WIDTH / post.aspectRatio;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function handleQuickSave() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSave(post.id);
  }

  function handleOpenBoardModal() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNewBoardName("");
    setShowBoardModal(true);
  }

  function handleSaveToBoard(boardId: string) {
    addToBoard(post.id, boardId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowBoardModal(false);
  }

  function handleCreateAndSave() {
    const name = newBoardName.trim();
    if (!name) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const boardId = createBoard(name, post.id);
    setNewBoardName("");
    setShowBoardModal(false);
    router.push(`/board/${boardId}`);
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Navigation bar */}
      <View
        style={[
          styles.navBar,
          { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.navActions}>
          {/* Quick toggle save */}
          <Pressable onPress={handleQuickSave} hitSlop={10} style={styles.navBtn}>
            <Ionicons
              name={post.savedByMe ? "bookmark" : "bookmark-outline"}
              size={22}
              color={post.savedByMe ? colors.primary : colors.foreground}
            />
          </Pressable>
          {/* Save to a specific board */}
          <Pressable onPress={handleOpenBoardModal} hitSlop={10} style={styles.navBtn}>
            <Ionicons name="albums-outline" size={22} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <Image
          source={post.imageUri}
          style={{ width: SCREEN_WIDTH, height: imgHeight }}
          contentFit="cover"
          transition={300}
        />

        <View style={styles.content}>
          {/* Author + save count */}
          <View style={styles.authorRow}>
            <UserAvatar uri={post.userAvatar} size={42} />
            <View style={styles.authorInfo}>
              <Text style={[styles.username, { color: colors.foreground }]}>
                @{post.username}
              </Text>
              <Text style={[styles.postedAt, { color: colors.mutedForeground }]}>
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={[styles.savesChip, { backgroundColor: colors.tag }]}>
              <Ionicons name="bookmark" size={14} color={colors.primary} />
              <Text style={[styles.savesCount, { color: colors.tagText }]}>{post.saves}</Text>
            </View>
          </View>

          {/* Caption */}
          <Text style={[styles.caption, { color: colors.foreground }]}>{post.caption}</Text>

          {/* Style */}
          <View style={styles.styleRow}>
            <StyleTag label={post.style} />
          </View>

          {/* Tags */}
          {post.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {post.tags.map((t) => (
                <View key={t} style={[styles.tagChip, { backgroundColor: colors.tag }]}>
                  <Text style={[styles.tagChipText, { color: colors.tagText }]}>#{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Board membership list */}
          {post.boardIds.length > 0 && (
            <View style={[styles.inBoardsRow, { borderTopColor: colors.border }]}>
              <Ionicons name="albums" size={15} color={colors.mutedForeground} />
              <Text style={[styles.inBoardsText, { color: colors.mutedForeground }]}>
                Saved to {post.boardIds.length} board{post.boardIds.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Board save modal */}
      <Modal
        visible={showBoardModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBoardModal(false)}
      >
        <Pressable
          style={[styles.overlay, { backgroundColor: colors.overlay }]}
          onPress={() => setShowBoardModal(false)}
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Save to Board</Text>

          {/* Create new board inline */}
          <View
            style={[styles.newBoardRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          >
            <TextInput
              style={[styles.newBoardInput, { color: colors.foreground, flex: 1 }]}
              placeholder="Create new board..."
              placeholderTextColor={colors.mutedForeground}
              value={newBoardName}
              onChangeText={setNewBoardName}
              returnKeyType="done"
              onSubmitEditing={handleCreateAndSave}
            />
            <Pressable
              onPress={handleCreateAndSave}
              disabled={!newBoardName.trim()}
              style={[
                styles.createMiniBtn,
                { backgroundColor: newBoardName.trim() ? colors.primary : colors.muted },
              ]}
            >
              <Ionicons
                name="add"
                size={18}
                color={newBoardName.trim() ? colors.primaryForeground : colors.mutedForeground}
              />
            </Pressable>
          </View>

          {/* Existing boards */}
          {boards.length > 0 ? (
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {boards.map((b) => {
                const alreadyIn = post.boardIds.includes(b.id);
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => !alreadyIn && handleSaveToBoard(b.id)}
                    style={[
                      styles.boardRow,
                      { borderBottomColor: colors.border, opacity: alreadyIn ? 0.5 : 1 },
                    ]}
                  >
                    <Ionicons
                      name={alreadyIn ? "checkmark-circle" : "albums-outline"}
                      size={20}
                      color={alreadyIn ? colors.primary : colors.mutedForeground}
                    />
                    <Text style={[styles.boardRowName, { color: colors.foreground, flex: 1 }]}>
                      {b.name}
                    </Text>
                    <Text style={[styles.boardRowCount, { color: colors.mutedForeground }]}>
                      {b.postCount}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={[styles.noBoards, { color: colors.mutedForeground }]}>
              No boards yet — create one above
            </Text>
          )}

          <Pressable onPress={() => setShowBoardModal(false)} style={styles.cancelRow}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
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
    fontFamily: "Inter_500Medium",
  },
  goBackBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
    marginTop: 8,
  },
  goBackText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: { padding: 7 },
  navActions: { flexDirection: "row", gap: 2 },
  content: { padding: 18, gap: 16 },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  authorInfo: { flex: 1 },
  username: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  postedAt: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  savesChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    gap: 5,
  },
  savesCount: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  caption: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
  },
  styleRow: { flexDirection: "row" },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  tagChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  inBoardsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inBoardsText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  overlay: { flex: 1 },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 16,
    gap: 14,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  newBoardRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  newBoardInput: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    paddingVertical: 6,
  },
  createMiniBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  boardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  boardRowName: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  boardRowCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  noBoards: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 8,
  },
  cancelRow: {
    alignItems: "center",
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});
