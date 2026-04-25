import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MasonryGrid from "@/components/MasonryGrid";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

// Curated hero color per style (falls back to primary)
const STYLE_ACCENTS: Record<string, string> = {
  Minimal: "#B5A99A",
  Streetwear: "#7B8FA1",
  Cottagecore: "#A8BC9F",
  Boho: "#C4A07A",
  Y2K: "#D88DAD",
  "Dark Academia": "#7A6B57",
  "Old Money": "#9B8B73",
  Sporty: "#7BA8C4",
  Romantic: "#D4809A",
  Grunge: "#7A7060",
  "Business Casual": "#8A9BB0",
  Coastal: "#6AAEC7",
};

export default function TopicFeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { posts } = useApp();

  const topic = decodeURIComponent(slug ?? "");
  const accentColor = STYLE_ACCENTS[topic] ?? colors.primary;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [query, setQuery] = useState("");

  const topicPosts = useMemo(() => {
    const base = posts.filter((p) => p.style === topic);
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(
      (p) =>
        p.caption.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.username.toLowerCase().includes(q)
    );
  }, [posts, topic, query]);

  const header = (
    <View style={styles.headerWrapper}>
      {/* Nav row */}
      <View style={[styles.navRow, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Hero banner */}
      <View style={[styles.heroBanner, { backgroundColor: accentColor + "22", borderColor: accentColor + "44" }]}>
        <View style={[styles.heroDot, { backgroundColor: accentColor }]} />
        <View style={styles.heroText}>
          <Text style={[styles.heroTopic, { color: colors.foreground }]}>
            {topic}
          </Text>
          <Text style={[styles.heroCount, { color: colors.mutedForeground }]}>
            {topicPosts.length}{" "}
            {topicPosts.length === 1 ? "look" : "looks"}
            {query ? " · filtered" : ""}
          </Text>
        </View>
        <Ionicons name="sparkles" size={22} color={accentColor} />
      </View>

      {/* Search within topic */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.secondary, borderColor: colors.border },
        ]}
      >
        <Ionicons name="search-outline" size={17} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground, flex: 1 }]}
          placeholder={`Search in ${topic}…`}
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={17} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <MasonryGrid
        posts={topicPosts}
        ListHeaderComponent={header}
        style={styles.gridPad}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="image-outline" size={44} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {query ? "No results found" : `No looks in ${topic} yet`}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {query
                ? "Try a different search term"
                : "Be the first to share a look in this style"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerWrapper: { paddingBottom: 10 },
  navRow: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  backBtn: {
    padding: 6,
    alignSelf: "flex-start",
  },
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginBottom: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  heroDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  heroText: { flex: 1 },
  heroTopic: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  heroCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    marginBottom: 10,
  },
  searchInput: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  gridPad: { paddingTop: 6 },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
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
