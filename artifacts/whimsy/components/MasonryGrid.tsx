import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Post } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import SaveButton from "@/components/SaveButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMNS = 2;
const GAP = 10;
const PADDING = 14;
const COLUMN_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

interface MasonryGridProps {
  posts: Post[];
  ListHeaderComponent?: React.ReactElement;
  ListEmptyComponent?: React.ReactElement;
  style?: object;
  /** When provided, a ⋯ menu appears on each card with a Delete option. */
  onDelete?: (postId: string) => void;
}

export default function MasonryGrid({
  posts,
  ListHeaderComponent,
  ListEmptyComponent,
  style,
  onDelete,
}: MasonryGridProps) {
  const colors = useColors();
  const router = useRouter();

  const { leftCol, rightCol } = useMemo(() => {
    const left: Post[] = [];
    const right: Post[] = [];
    posts.forEach((p, i) => (i % 2 === 0 ? left.push(p) : right.push(p)));
    return { leftCol: left, rightCol: right };
  }, [posts]);

  function handleMenuPress(post: Post) {
    Alert.alert(post.caption ? `"${post.caption}"` : "This look", undefined, [
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Delete look?",
            "This will permanently remove the post. This cannot be undone.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => onDelete?.(post.id),
              },
            ],
          );
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function renderPost(post: Post) {
    const imgHeight = COLUMN_WIDTH / post.aspectRatio;
    return (
      <View key={post.id} style={styles.cardWrapper}>
        {/* Card — tappable for navigation */}
        <Pressable
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push(`/post/${post.id}`)}
        >
          <Image
            source={post.imageUri}
            style={{ width: COLUMN_WIDTH, height: imgHeight }}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.cardFooter}>
            <Text style={[styles.caption, { color: colors.foreground }]} numberOfLines={2}>
              {post.caption}
            </Text>
            <View style={styles.cardMeta}>
              <Text style={[styles.username, { color: colors.mutedForeground }]}>
                @{post.username}
              </Text>
              <SaveButton post={post} compact />
            </View>
          </View>
        </Pressable>

        {/* Three-dot menu — sibling of card Pressable so touches aren't swallowed */}
        {onDelete && (
          <Pressable
            style={[styles.menuBtn, { backgroundColor: colors.background + "CC" }]}
            onPress={() => handleMenuPress(post)}
            hitSlop={10}
          >
            <Ionicons name="ellipsis-horizontal" size={14} color={colors.foreground} />
          </Pressable>
        )}
      </View>
    );
  }

  if (posts.length === 0 && ListEmptyComponent) {
    return (
      <ScrollView
        contentContainerStyle={[styles.emptyContainer, style]}
        showsVerticalScrollIndicator={false}
      >
        {ListHeaderComponent}
        {ListEmptyComponent}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, style]}
      showsVerticalScrollIndicator={false}
    >
      {ListHeaderComponent}
      <View style={styles.grid}>
        <View style={styles.column}>{leftCol.map(renderPost)}</View>
        <View style={styles.column}>{rightCol.map(renderPost)}</View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PADDING,
    paddingBottom: Platform.OS === "web" ? 100 : 100,
  },
  emptyContainer: {
    paddingHorizontal: PADDING,
    flexGrow: 1,
  },
  grid: {
    flexDirection: "row",
    gap: GAP,
  },
  column: {
    flex: 1,
    gap: GAP,
  },
  cardWrapper: {
    position: "relative",
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  menuBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cardFooter: {
    padding: 10,
    gap: 6,
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Inter_400Regular",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  username: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
