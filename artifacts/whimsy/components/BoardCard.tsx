import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Board } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 14 * 2 - 12) / 2;

interface BoardCardProps {
  board: Board;
  onPress?: () => void;
}

export default function BoardCard({ board, onPress }: BoardCardProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <View style={[styles.cover, { backgroundColor: colors.muted, width: CARD_WIDTH }]}>
        {board.coverUri ? (
          <Image
            source={board.coverUri}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <Feather name="image" size={30} color={colors.mutedForeground} />
        )}
        <View style={[styles.countBadge, { backgroundColor: colors.overlay }]}>
          <Text style={styles.countText}>{board.postCount}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {board.name}
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {board.postCount} {board.postCount === 1 ? "look" : "looks"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    width: CARD_WIDTH,
  },
  cover: {
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    padding: 11,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  sub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
