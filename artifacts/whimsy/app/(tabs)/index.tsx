import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
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

  const [expanded, setExpanded] = useState(false);
  const chevronAnim = useRef(new Animated.Value(0)).current;

  function toggleExpanded() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.spring(chevronAnim, {
      toValue,
      useNativeDriver: false,
      damping: 14,
      stiffness: 180,
    }).start();
  }

  function goToTopic(style: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/topic/${encodeURIComponent(style)}`);
  }

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

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

      {/* ── Topic bar: horizontal scroll + dropdown button ── */}
      <View
        style={[
          styles.topicBar,
          { borderBottomColor: colors.border },
        ]}
      >
        {/* Scrollable chip strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipStrip}
          style={styles.chipScroll}
        >
          {styleCategories.map((style) => {
            const count = posts.filter((p) => p.style === style).length;
            return (
              <TopicChip
                key={style}
                label={style}
                count={count}
                compact
                onPress={() => goToTopic(style)}
              />
            );
          })}
        </ScrollView>

        {/* Chevron toggle button */}
        <Pressable
          onPress={toggleExpanded}
          style={({ pressed }) => [
            styles.chevronBtn,
            {
              backgroundColor: pressed ? colors.accent : colors.tag,
              borderColor: colors.border,
            },
          ]}
          hitSlop={8}
        >
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <Ionicons
              name="chevron-down"
              size={18}
              color={colors.primary}
            />
          </Animated.View>
        </Pressable>
      </View>

      {/* ── Expanded topic grid (shown when chevron is pressed) ── */}
      {expanded && (
        <View style={[styles.topicGrid, { borderBottomColor: colors.border }]}>
          <Text style={[styles.gridLabel, { color: colors.mutedForeground }]}>
            All Topics
          </Text>
          <View style={styles.gridWrap}>
            {styleCategories.map((style) => {
              const count = posts.filter((p) => p.style === style).length;
              return (
                <TopicChip
                  key={style}
                  label={style}
                  count={count}
                  onPress={() => {
                    setExpanded(false);
                    Animated.spring(chevronAnim, {
                      toValue: 0,
                      useNativeDriver: false,
                      damping: 14,
                      stiffness: 180,
                    }).start();
                    goToTopic(style);
                  }}
                />
              );
            })}
          </View>
        </View>
      )}

      {/* ── All Looks header ── */}
      <View style={[styles.allLooksHeader, { borderBottomColor: colors.border }]}>
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

// ── Topic chip ───────────────────────────────────────────────────────────────
function TopicChip({
  label,
  count,
  onPress,
  compact = false,
}: {
  label: string;
  count: number;
  onPress: () => void;
  compact?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        compact && styles.chipCompact,
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

  /* App bar */
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

  /* Topic bar row */
  topicBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingRight: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  chipScroll: { flex: 1 },
  chipStrip: {
    paddingLeft: 14,
    paddingRight: 4,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  /* Chevron button */
  chevronBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  /* Expanded grid */
  topicGrid: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  gridLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingLeft: 2,
  },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  /* Chips */
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
  chipCompact: {
    paddingVertical: 7,
  },
  chipLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  chipBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  chipCount: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },

  /* All Looks header */
  allLooksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  allLooksTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  allLooksCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },

  /* Misc */
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
