import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useColors } from "@/hooks/useColors";

interface StyleTagProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export default function StyleTag({ label, selected, onPress }: StyleTagProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tag,
        {
          backgroundColor: selected ? colors.primary : colors.tag,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: selected ? colors.primaryForeground : colors.tagText }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
