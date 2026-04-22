import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  if (!post) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Post not found</Text>
      </View>
    );
  }

  const imgHeight = SCREEN_WIDTH / post.aspectRatio;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function handleSaveToBoard(boardId: string) {
    addToBoard(post!.id, boardId);
    setShowSaveModal(false);
    Alert.alert("Saved", "Look added to your board.");
  }

  function handleCreateAndSave() {
    const name = newBoardName.trim();
    if (!name) return;
    createBoard(name, post!.id);
    setNewBoardName("");
    setShowSaveModal(false);
    Alert.alert("Saved", `Look saved to new board "${name}".`);
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.navBar,
          { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Pressable onPress={() => setShowSaveModal(true)} hitSlop={8} style={styles.saveBtn}>
          <Feather
            name="bookmark"
            size={22}
            color={post.savedByMe ? colors.primary : colors.foreground}
          />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        <Image
          source={post.imageUri}
          style={{ width: SCREEN_WIDTH, height: imgHeight }}
          contentFit="cover"
          transition={300}
        />

        <View style={styles.content}>
          <View style={styles.authorRow}>
            <UserAvatar uri={post.userAvatar} size={40} />
            <View style={styles.authorInfo}>
              <Text style={[styles.displayName, { color: colors.foreground }]}>
                {post.username}
              </Text>
              <Text style={[styles.postedAt, { color: colors.mutedForeground }]}>
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
            <Pressable
              onPress={() => toggleSave(post.id)}
              style={[styles.savePill, { backgroundColor: post.savedByMe ? colors.primary : colors.secondary }]}
            >
              <Feather
                name="bookmark"
                size={15}
                color={post.savedByMe ? colors.primaryForeground : colors.foreground}
              />
              <Text
                style={[
                  styles.savePillText,
                  { color: post.savedByMe ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {post.saves}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.caption, { color: colors.foreground }]}>{post.caption}</Text>

          <StyleTag label={post.style} />

          {post.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {post.tags.map((t) => (
                <View key={t} style={[styles.tagChip, { backgroundColor: colors.tag }]}>
                  <Text style={[styles.tagChipText, { color: colors.tagText }]}>#{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showSaveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setShowSaveModal(false)}
        />
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.card,
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Save to Board</Text>

          <View
            style={[
              styles.newBoardRow,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.newBoardInput, { color: colors.foreground, flex: 1 }]}
              placeholder="New board name..."
              placeholderTextColor={colors.mutedForeground}
              value={newBoardName}
              onChangeText={setNewBoardName}
              returnKeyType="done"
              onSubmitEditing={handleCreateAndSave}
            />
            <Pressable onPress={handleCreateAndSave}>
              <Feather name="plus" size={20} color={colors.primary} />
            </Pressable>
          </View>

          {boards.length > 0 && (
            <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
              {boards.map((b) => (
                <Pressable
                  key={b.id}
                  onPress={() => handleSaveToBoard(b.id)}
                  style={[styles.boardOption, { borderBottomColor: colors.border }]}
                >
                  <Feather name="folder" size={18} color={colors.primary} />
                  <Text style={[styles.boardOptionName, { color: colors.foreground }]}>
                    {b.name}
                  </Text>
                  <Text style={[styles.boardOptionCount, { color: colors.mutedForeground }]}>
                    {b.postCount}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {boards.length === 0 && (
            <Text style={[styles.noBoards, { color: colors.mutedForeground }]}>
              No boards yet. Type a name above to create your first board.
            </Text>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 6 },
  saveBtn: { padding: 6 },
  content: {
    padding: 18,
    gap: 16,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  authorInfo: { flex: 1 },
  displayName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  postedAt: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  savePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    gap: 5,
  },
  savePillText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  caption: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
  },
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
  modalOverlay: { flex: 1 },
  modalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    gap: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  newBoardRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  newBoardInput: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  boardOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  boardOptionName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  boardOptionCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  noBoards: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
