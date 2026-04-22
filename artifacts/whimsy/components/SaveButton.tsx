import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

import { Post, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

interface SaveButtonProps {
  post: Post;
  compact?: boolean;
}

export default function SaveButton({ post, compact }: SaveButtonProps) {
  const colors = useColors();
  const { toggleSave } = useApp();
  const scale = React.useRef(new Animated.Value(1)).current;

  function handleSave() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.35, useNativeDriver: true, speed: 60 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    toggleSave(post.id);
  }

  if (compact) {
    return (
      <Pressable onPress={handleSave} hitSlop={10}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons
            name={post.savedByMe ? "bookmark" : "bookmark-outline"}
            size={16}
            color={post.savedByMe ? colors.primary : colors.mutedForeground}
          />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handleSave} style={styles.row} hitSlop={8}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={post.savedByMe ? "bookmark" : "bookmark-outline"}
          size={24}
          color={post.savedByMe ? colors.primary : colors.foreground}
        />
      </Animated.View>
      <Text style={[styles.count, { color: colors.mutedForeground }]}>
        {post.saves}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  count: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
