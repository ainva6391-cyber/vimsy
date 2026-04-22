import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import StyleTag from "@/components/StyleTag";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const STYLES = [
  "Minimal", "Streetwear", "Cottagecore", "Boho",
  "Y2K", "Dark Academia", "Old Money", "Sporty", "Romantic",
];

export default function UploadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addPost, currentUser } = useApp();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 3, height: 4 });
  const [caption, setCaption] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>("Minimal");
  const [submitting, setSubmitting] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to share an outfit look.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      // Some platforms may not provide dimensions — default to portrait 3:4
      const w = asset.width && asset.width > 0 ? asset.width : 3;
      const h = asset.height && asset.height > 0 ? asset.height : 4;
      setImageSize({ width: w, height: h });
    }
  }

  function addTag() {
    const clean = tagInput.trim().toLowerCase().replace(/\s+/g, " ");
    if (clean && !tags.includes(clean) && tags.length < 8) {
      setTags([...tags, clean]);
      setTagInput("");
    }
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  async function handlePost() {
    if (!imageUri) {
      Alert.alert("No photo", "Pick a photo first.");
      return;
    }
    if (!caption.trim()) {
      Alert.alert("Add a caption", "Tell the world about this look.");
      return;
    }
    setSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addPost({
      imageUri,
      caption: caption.trim(),
      tags,
      style: selectedStyle,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      width: imageSize.width,
      height: imageSize.height,
      aspectRatio: imageSize.width / imageSize.height,
    });
    setSubmitting(false);
    setImageUri(null);
    setCaption("");
    setTags([]);
    setTagInput("");
    router.replace("/(tabs)");
  }

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
        <Text style={[styles.title, { color: colors.foreground }]}>Share a Look</Text>
        {imageUri && (
          <Pressable
            onPress={handlePost}
            style={[styles.postBtn, { backgroundColor: colors.primary }]}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <Text style={[styles.postBtnText, { color: colors.primaryForeground }]}>
                Post
              </Text>
            )}
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 100 : 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={pickImage}
          style={[
            styles.imagePicker,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              borderStyle: imageUri ? "solid" : "dashed",
            },
          ]}
        >
          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={styles.preview}
                contentFit="cover"
              />
              <Pressable
                onPress={() => setImageUri(null)}
                style={[styles.removeImg, { backgroundColor: colors.overlay }]}
              >
                <Feather name="x" size={18} color="#fff" />
              </Pressable>
            </>
          ) : (
            <View style={styles.pickerInner}>
              <Feather name="camera" size={36} color={colors.mutedForeground} />
              <Text style={[styles.pickerText, { color: colors.mutedForeground }]}>
                Tap to select a photo
              </Text>
              <Text style={[styles.pickerSub, { color: colors.mutedForeground }]}>
                Only photos allowed
              </Text>
            </View>
          )}
        </Pressable>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Caption</Text>
          <TextInput
            style={[
              styles.captionInput,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="Describe your look..."
            placeholderTextColor={colors.mutedForeground}
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Style</Text>
          <View style={styles.styleWrap}>
            {STYLES.map((s) => (
              <StyleTag
                key={s}
                label={s}
                selected={selectedStyle === s}
                onPress={() => setSelectedStyle(s)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Tags</Text>
          <View
            style={[
              styles.tagInput,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.tagInputText, { color: colors.foreground, flex: 1 }]}
              placeholder="Add a tag and press +"
              placeholderTextColor={colors.mutedForeground}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              returnKeyType="done"
            />
            <Pressable onPress={addTag}>
              <Feather name="plus-circle" size={22} color={colors.primary} />
            </Pressable>
          </View>
          {tags.length > 0 && (
            <View style={styles.tagRow}>
              {tags.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => removeTag(t)}
                  style={[styles.tagPill, { backgroundColor: colors.tag }]}
                >
                  <Text style={[styles.tagPillText, { color: colors.tagText }]}>#{t}</Text>
                  <Feather name="x" size={12} color={colors.tagText} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  postBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 100,
  },
  postBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    gap: 22,
  },
  imagePicker: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
  },
  removeImg: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerInner: {
    alignItems: "center",
    gap: 10,
  },
  pickerText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  pickerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  section: { gap: 10 },
  label: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  captionInput: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    textAlignVertical: "top",
  },
  styleWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  tagInputText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 5,
  },
  tagPillText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
