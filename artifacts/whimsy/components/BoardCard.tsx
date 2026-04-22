import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Board } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

interface BoardCardProps {
  board: Board;
  onPress?: () => void;
}

export default function BoardCard({ board, onPress }: BoardCardProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.cover, { backgroundColor: colors.muted }]}>
        {board.coverUri ? (
          <Image
            source={board.coverUri}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <Feather name="image" size={32} color={colors.mutedForeground} />
        )}
      </View>
      <View style={styles.footer}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {board.name}
        </Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {board.postCount} looks
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
    flex: 1,
    maxWidth: "48%",
  },
  cover: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  count: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
