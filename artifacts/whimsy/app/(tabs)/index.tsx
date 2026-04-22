import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import StyleTag from "@/components/StyleTag";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { posts, styleCategories, getFilteredPosts } = useApp();
  const [activeStyle, setActiveStyle] = useState<string | undefined>(undefined);

  const filtered = getFilteredPosts(activeStyle, undefined);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
        <Text style={[styles.logo, { color: colors.primary }]}>Whimsy</Text>
        <Pressable onPress={() => router.push("/search")} hitSlop={8}>
          <Feather name="search" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={[styles.filterScroll, { borderBottomColor: colors.border }]}
      >
        <StyleTag
          label="All"
          selected={!activeStyle}
          onPress={() => setActiveStyle(undefined)}
        />
        {styleCategories.map((s) => (
          <StyleTag
            key={s}
            label={s}
            selected={activeStyle === s}
            onPress={() => setActiveStyle(activeStyle === s ? undefined : s)}
          />
        ))}
      </ScrollView>

      <MasonryGrid
        posts={filtered}
        style={styles.gridPad}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="image" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No looks found for this style
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
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
  filterScroll: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  gridPad: {
    paddingTop: 14,
  },
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
