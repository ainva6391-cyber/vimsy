import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

import BoardCard from "@/components/BoardCard";
import MasonryGrid from "@/components/MasonryGrid";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function CollectionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { boards, savedPosts, createBoard } = useApp();
  const [tab, setTab] = useState<"boards" | "saved">("boards");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [boardName, setBoardName] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function handleCreate() {
    const name = boardName.trim();
    if (!name) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const boardId = createBoard(name);
    setBoardName("");
    setShowCreateModal(false);
    router.push(`/board/${boardId}`);
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 10,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Collections</Text>
        <Pressable
          onPress={() => setShowCreateModal(true)}
          hitSlop={10}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={20} color={colors.primaryForeground} />
          <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>New</Text>
        </Pressable>
      </View>

      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {(["boards", "saved"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[
              styles.tabItem,
              tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: tab === t ? colors.primary : colors.mutedForeground },
              ]}
            >
              {t === "boards" ? `My Boards (${boards.length})` : `Saved (${savedPosts.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "boards" ? (
        <ScrollView
          contentContainerStyle={[
            styles.boardsContent,
            { paddingBottom: Platform.OS === "web" ? 100 : 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {boards.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="albums-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No boards yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Create a board to curate your favorite looks
              </Text>
              <Pressable
                onPress={() => setShowCreateModal(true)}
                style={[styles.createBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>
                  Create First Board
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.boardGrid}>
              {boards.map((b) => (
                <BoardCard
                  key={b.id}
                  board={b}
                  onPress={() => router.push(`/board/${b.id}`)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <MasonryGrid
          posts={savedPosts}
          style={styles.gridPad}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bookmark-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Nothing saved yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Tap the bookmark on any look to save it here
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setShowCreateModal(false)}
        />
        <View
          style={[
            styles.modalSheet,
            { backgroundColor: colors.card, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Board</Text>
          <TextInput
            style={[
              styles.modalInput,
              { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="Name your board..."
            placeholderTextColor={colors.mutedForeground}
            value={boardName}
            onChangeText={setBoardName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
            maxLength={40}
          />
          <Pressable
            onPress={handleCreate}
            disabled={!boardName.trim()}
            style={[
              styles.modalBtn,
              { backgroundColor: boardName.trim() ? colors.primary : colors.muted },
            ]}
          >
            <Text
              style={[
                styles.modalBtnText,
                { color: boardName.trim() ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              Create Board
            </Text>
          </Pressable>
          <Pressable onPress={() => setShowCreateModal(false)} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  boardsContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  boardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridPad: { paddingTop: 14 },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  createBtn: {
    marginTop: 8,
    paddingHorizontal: 26,
    paddingVertical: 13,
    borderRadius: 100,
  },
  createBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  modalOverlay: { flex: 1 },
  modalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 14,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  modalInput: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  modalBtn: {
    borderRadius: 100,
    paddingVertical: 15,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});
