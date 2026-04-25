import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MasonryGrid from "@/components/MasonryGrid";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { styleCategories, posts } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const header = (
    <>
      {/* ── App bar ── */}
      <View
        style={[
          styles.appBar,
          {
            paddingTop: topPad + 10,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.logo, { color: colors.primary }]}>Whimsy</Text>
        <Ionicons name="sparkles-outline" size={22} color={colors.primary} />
      </View>

      {/* ── Section label ── */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Browse by Topic
        </Text>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
          Tap any style to explore
        </Text>
      </View>

      {/* ── Topic chips — all visible, wrapped ── */}
      <View style={styles.topicGrid}>
        {styleCategories.map((style) => {
          const count = posts.filter((p) => p.style === style).length;
          return (
            <TopicChip
              key={style}
              label={style}
              count={count}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/topic/${encodeURIComponent(style)}`);
              }}
            />
          );
        })}
      </View>

      {/* ── Divider + "All looks" label ── */}
      <View style={[styles.allLooksHeader, { borderTopColor: colors.border }]}>
        <Text style={[styles.allLooksTitle, { color: colors.foreground }]}>
          All Looks
        </Text>
        <Text style={[styles.allLooksCount, { color: colors.mutedForeground }]}>
          {posts.length} posts
        </Text>
      </View>
    </>
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
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No looks yet
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ── Topic chip component ────────────────────────────────────────────────────
function TopicChip({
  label,
  count,
  onPress,
}: {
  label: string;
  count: number;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: pressed ? colors.accent : colors.tag,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.chipLabel, { color: colors.tagText }]}>{label}</Text>
      <View style={[styles.chipBadge, { backgroundColor: colors.primary }]}>
        <Text style={[styles.chipCount, { color: colors.primaryForeground }]}>
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logo: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  sectionHeader: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 14,
    gap: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  topicGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    gap: 10,
    paddingBottom: 18,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  chipBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  chipCount: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  allLooksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  allLooksTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  allLooksCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  gridPad: { paddingTop: 6 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
