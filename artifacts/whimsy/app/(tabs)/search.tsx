import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MasonryGrid from "@/components/MasonryGrid";
import StyleTag from "@/components/StyleTag";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const STYLE_VIBES = [
  { label: "Minimal", icon: "minus-circle" as const },
  { label: "Streetwear", icon: "zap" as const },
  { label: "Boho", icon: "sun" as const },
  { label: "Cottagecore", icon: "feather" as const },
  { label: "Old Money", icon: "award" as const },
  { label: "Y2K", icon: "star" as const },
  { label: "Dark Academia", icon: "book" as const },
  { label: "Coastal", icon: "anchor" as const },
];

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getFilteredPosts } = useApp();
  const [query, setQuery] = useState("");
  const [activeStyle, setActiveStyle] = useState<string | undefined>(undefined);

  const isSearching = query.length > 0 || !!activeStyle;
  const results = isSearching ? getFilteredPosts(activeStyle, query) : [];
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
        <Text style={[styles.title, { color: colors.foreground }]}>Explore</Text>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.secondary, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search styles, tags, looks..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <Feather
              name="x"
              size={16}
              color={colors.mutedForeground}
              onPress={() => setQuery("")}
            />
          )}
        </View>
      </View>

      {!isSearching ? (
        <ScrollView
          contentContainerStyle={[styles.browseContent, { paddingBottom: Platform.OS === "web" ? 100 : 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Browse by Style
          </Text>
          <View style={styles.styleGrid}>
            {STYLE_VIBES.map((sv) => (
              <StyleTag
                key={sv.label}
                label={sv.label}
                onPress={() => setActiveStyle(sv.label)}
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        <MasonryGrid
          posts={results}
          style={styles.gridPad}
          ListHeaderComponent={
            <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
              {results.length} look{results.length !== 1 ? "s" : ""} found
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="search" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No looks match your search
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  browseContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 16,
  },
  styleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridPad: {
    paddingTop: 14,
  },
  resultCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
    marginTop: 2,
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
