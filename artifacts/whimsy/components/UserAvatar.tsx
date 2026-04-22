import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface UserAvatarProps {
  uri: string;
  size?: number;
  initials?: string;
}

export default function UserAvatar({ uri, size = 36, initials }: UserAvatarProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accent,
          borderColor: colors.border,
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
        />
      ) : (
        <Text style={[styles.initials, { color: colors.accentForeground, fontSize: size * 0.38 }]}>
          {initials || "?"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  initials: {
    fontFamily: "Inter_600SemiBold",
  },
});
