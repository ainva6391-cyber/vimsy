import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
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
import { useApp, type Comment } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import {
  likePost,
  unlikePost,
  addComment as apiAddComment,
} from "@/lib/apiClient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PostDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getPostById,
    posts,
    toggleSave,
    toggleLike,
    boards,
    createBoard,
    addToBoard,
    addComment,
    getComments,
    currentUser,
  } = useApp();
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  const post = getPostById(id ?? "");

  const [showComments, setShowComments] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const heartScale = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  const localComments = post ? getComments(post.id) : [];

  if (!post) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Ionicons name="image-outline" size={44} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>
          Post not found
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.goBackBtn, { backgroundColor: colors.secondary }]}
        >
          <Text style={[styles.goBackText, { color: colors.foreground }]}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const imgHeight = SCREEN_WIDTH / post.aspectRatio;
  const topPad = insets.top;

  // Related posts: same style, exclude current post, max 6
  const relatedPosts = posts
    .filter((p) => p.id !== post.id && p.style === post.style)
    .slice(0, 6);

  // ── Like ──────────────────────────────────────────────────────────────────
  async function handleLike() {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: false, speed: 40 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: false, speed: 20 }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleLike(post.id);
    try {
      const token = await getToken();
      if (token) {
        if (!post.likedByMe) await likePost(post.id, token);
        else await unlikePost(post.id, token);
      }
    } catch {}
  }

  // ── Comment toggle ────────────────────────────────────────────────────────
  function handleToggleComments() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowComments((v) => !v);
    if (!showComments) {
      // Scroll down a bit so comment section is visible
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }

  // ── Send comment ──────────────────────────────────────────────────────────
  async function handleComment() {
    const text = commentText.trim();
    if (!text) return;
    setSubmittingComment(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    addComment(post.id, {
      postId: post.id,
      userId: currentUser.id,
      username: user?.username ?? currentUser.username,
      userAvatar: user?.imageUrl ?? currentUser.avatar,
      content: text,
    });
    setCommentText("");

    try {
      const token = await getToken();
      if (token) await apiAddComment(post.id, text, token);
    } catch {}

    setSubmittingComment(false);
  }

  // ── Board helpers ─────────────────────────────────────────────────────────
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

  // ── Three-dot menu actions ────────────────────────────────────────────────
  function handleAddToFavorites() {
    setShowMenuModal(false);
    setTimeout(() => {
      setNewBoardName("");
      setShowBoardModal(true);
    }, 300);
  }

  function handleReport() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setReportSent(true);
    setShowMenuModal(false);
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* ── Nav bar ── */}
      <View
        style={[
          styles.navBar,
          {
            paddingTop: topPad + 6,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>

        {/* Three-dot menu */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setReportSent(false);
            setShowMenuModal(true);
          }}
          hitSlop={12}
          style={styles.navBtn}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={topPad + 56}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Post image */}
          <Image
            source={post.imageUri}
            style={{ width: SCREEN_WIDTH, height: imgHeight }}
            contentFit="cover"
            transition={300}
          />

          {/* Tapping this wrapper outside comment section collapses comments */}
          <Pressable
            onPress={() => showComments && setShowComments(false)}
            style={styles.content}
          >
            {/* Author row */}
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
            </View>

            {/* ── Action bar ── */}
            <View style={styles.actionBar}>
              {/* Like */}
              <Pressable onPress={handleLike} style={styles.actionBtn}>
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <Ionicons
                    name={post.likedByMe ? "heart" : "heart-outline"}
                    size={26}
                    color={post.likedByMe ? "#e05a7b" : colors.foreground}
                  />
                </Animated.View>
                <Text style={[styles.actionCount, { color: colors.foreground }]}>
                  {post.likes.toLocaleString()}
                </Text>
              </Pressable>

              {/* Comment icon — clickable toggle */}
              <Pressable onPress={handleToggleComments} style={styles.actionBtn}>
                <Ionicons
                  name={showComments ? "chatbubble" : "chatbubble-outline"}
                  size={24}
                  color={showComments ? colors.primary : colors.foreground}
                />
                <Text
                  style={[
                    styles.actionCount,
                    { color: showComments ? colors.primary : colors.foreground },
                  ]}
                >
                  {post.commentCount}
                </Text>
              </Pressable>

              <View style={styles.actionSpacer} />

              {/* Saves chip */}
              <View style={[styles.savesChip, { backgroundColor: colors.tag }]}>
                <Ionicons name="bookmark" size={14} color={colors.primary} />
                <Text style={[styles.savesCount, { color: colors.tagText }]}>
                  {post.saves}
                </Text>
              </View>
            </View>

            {/* Caption */}
            {!!post.caption && (
              <Text style={[styles.caption, { color: colors.foreground }]}>
                {post.caption}
              </Text>
            )}

            {/* Style chip → topic */}
            <View style={styles.styleRow}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/topic/${encodeURIComponent(post.style)}`);
                }}
                style={({ pressed }) => [
                  styles.styleChip,
                  {
                    backgroundColor: pressed ? colors.accent : colors.tag,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="pricetag-outline" size={13} color={colors.tagText} />
                <Text style={[styles.styleChipText, { color: colors.tagText }]}>
                  {post.style}
                </Text>
                <Ionicons name="chevron-forward" size={13} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {/* Hashtags */}
            {post.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {post.tags.map((t) => (
                  <View key={t} style={[styles.tagChip, { backgroundColor: colors.tag }]}>
                    <Text style={[styles.tagChipText, { color: colors.tagText }]}>#{t}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* ── Comments list (only when open) ── */}
            {showComments && (
              <Pressable
                onStartShouldSetResponder={() => true}
                style={[styles.commentsBlock, { borderTopColor: colors.border }]}
              >
                <Text style={[styles.commentSectionTitle, { color: colors.foreground }]}>
                  Comments{post.commentCount > 0 ? ` (${post.commentCount})` : ""}
                </Text>

                {localComments.length === 0 && (
                  <Text style={[styles.noComments, { color: colors.mutedForeground }]}>
                    No comments yet — be the first!
                  </Text>
                )}

                {localComments.map((c) => (
                  <CommentRow key={c.id} comment={c} colors={colors} />
                ))}
              </Pressable>
            )}

            {/* ── Related posts ── */}
            {relatedPosts.length > 0 && (
              <View style={[styles.relatedSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.relatedTitle, { color: colors.foreground }]}>
                  More {post.style}
                </Text>
                <View style={styles.relatedGrid}>
                  {relatedPosts.map((rp) => (
                    <Pressable
                      key={rp.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/post/${rp.id}`);
                      }}
                      style={[styles.relatedCard, { backgroundColor: colors.secondary }]}
                    >
                      <Image
                        source={rp.imageUri}
                        style={styles.relatedImg}
                        contentFit="cover"
                        transition={200}
                      />
                      <View style={styles.relatedMeta}>
                        <Text
                          style={[styles.relatedUsername, { color: colors.mutedForeground }]}
                          numberOfLines={1}
                        >
                          @{rp.username}
                        </Text>
                        <View style={styles.relatedLikeRow}>
                          <Ionicons name="heart" size={11} color={colors.primary} />
                          <Text style={[styles.relatedLikeCount, { color: colors.mutedForeground }]}>
                            {rp.likes.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </Pressable>
        </ScrollView>

        {/* ── Comment input bar (shows whenever comments are open) ── */}
        {showComments && (
          <View
            style={[
              styles.commentInputBar,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <UserAvatar
              uri={isSignedIn ? (user?.imageUrl ?? currentUser.avatar) : currentUser.avatar}
              size={34}
            />
            <TextInput
              style={[
                styles.commentTextField,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Write a comment…"
              placeholderTextColor={colors.mutedForeground}
              value={commentText}
              onChangeText={setCommentText}
              returnKeyType="send"
              onSubmitEditing={handleComment}
              multiline
            />
            <Pressable
              onPress={handleComment}
              disabled={!commentText.trim() || submittingComment}
              hitSlop={8}
            >
              <Ionicons
                name="send"
                size={22}
                color={commentText.trim() ? colors.primary : colors.muted}
              />
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── Three-dot menu modal ── */}
      <Modal
        visible={showMenuModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <Pressable
          style={[styles.overlay, { backgroundColor: colors.overlay }]}
          onPress={() => setShowMenuModal(false)}
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

          <Pressable
            onPress={handleAddToFavorites}
            style={[styles.menuRow, { borderBottomColor: colors.border }]}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.tag }]}>
              <Ionicons name="bookmark" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>
              Add to your favorites
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </Pressable>

          <Pressable
            onPress={handleReport}
            style={[styles.menuRow, { borderBottomColor: "transparent" }]}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="flag-outline" size={18} color="#EF4444" />
            </View>
            <Text style={[styles.menuLabel, { color: reportSent ? colors.mutedForeground : "#EF4444" }]}>
              {reportSent ? "Report submitted — thank you" : "Report"}
            </Text>
          </Pressable>

          <Pressable onPress={() => setShowMenuModal(false)} style={styles.cancelRow}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>

      {/* ── Board / favorites modal ── */}
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
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
            Save to Favorites
          </Text>
          <View
            style={[
              styles.newBoardRow,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
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
                color={
                  newBoardName.trim() ? colors.primaryForeground : colors.mutedForeground
                }
              />
            </Pressable>
          </View>
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

// ── Comment row ──────────────────────────────────────────────────────────────
function CommentRow({
  comment,
  colors,
}: {
  comment: Comment;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={styles.commentRow}>
      <UserAvatar uri={comment.userAvatar} size={32} />
      <View style={styles.commentBody}>
        <View style={styles.commentMeta}>
          <Text style={[styles.commentUsername, { color: colors.foreground }]}>
            @{comment.username}
          </Text>
          <Text style={[styles.commentTime, { color: colors.mutedForeground }]}>
            {new Date(comment.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
        <Text style={[styles.commentContent, { color: colors.foreground }]}>
          {comment.content}
        </Text>
      </View>
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
  notFoundText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  goBackBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100, marginTop: 8 },
  goBackText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: { padding: 7 },

  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 0, gap: 11 },

  authorRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  authorInfo: { flex: 1 },
  username: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  postedAt: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  actionBar: { flexDirection: "row", alignItems: "center", gap: 18 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 7 },
  actionCount: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  actionSpacer: { flex: 1 },
  savesChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    gap: 5,
  },
  savesCount: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  caption: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 24 },

  styleRow: { flexDirection: "row" },
  styleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
  },
  styleChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  tagChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  // Comments
  commentsBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    gap: 10,
  },
  commentSectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  noComments: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 12,
  },
  commentRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  commentBody: { flex: 1, gap: 3 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  commentUsername: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  commentTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  commentContent: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },

  // Comment input bar (bottom)
  commentInputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  commentTextField: {
    flex: 1,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
  },

  // Related posts
  relatedSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    gap: 10,
  },
  relatedTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  relatedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  relatedCard: {
    width: (SCREEN_WIDTH - 36 - 20) / 3,
    borderRadius: 12,
    overflow: "hidden",
  },
  relatedImg: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
  relatedMeta: {
    padding: 6,
    gap: 3,
  },
  relatedUsername: { fontSize: 10, fontFamily: "Inter_400Regular" },
  relatedLikeRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  relatedLikeCount: { fontSize: 10, fontFamily: "Inter_500Medium" },

  // Modals
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
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },

  // Three-dot menu rows
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 16, fontFamily: "Inter_500Medium" },

  // Board rows
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
  newBoardInput: { fontSize: 15, fontFamily: "Inter_400Regular", paddingVertical: 6 },
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
  boardRowName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  boardRowCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  noBoards: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 8,
  },
  cancelRow: { alignItems: "center", paddingVertical: 4 },
  cancelText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
