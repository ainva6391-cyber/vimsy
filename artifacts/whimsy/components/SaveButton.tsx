import { Feather } from "@expo/vector-icons";
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
      Animated.spring(scale, { toValue: 1.3, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    toggleSave(post.id);
  }

  if (compact) {
    return (
      <Pressable onPress={handleSave} hitSlop={8}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Feather
            name="bookmark"
            size={15}
            color={post.savedByMe ? colors.primary : colors.mutedForeground}
          />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handleSave} style={styles.row} hitSlop={6}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Feather
          name={post.savedByMe ? "bookmark" : "bookmark"}
          size={22}
          color={post.savedByMe ? colors.primary : colors.foreground}
          style={{ opacity: post.savedByMe ? 1 : 0.7 }}
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
