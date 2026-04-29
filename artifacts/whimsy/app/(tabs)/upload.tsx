import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { createPost } from "@/lib/apiClient";
import { uploadPostImage, UploadValidationError, UploadStorageError } from "@/lib/supabase";

const ALL_TOPICS = [
  "Minimal", "Streetwear", "Cottagecore", "Boho",
  "Y2K", "Dark Academia", "Old Money", "Sporty",
  "Romantic", "Grunge", "Business Casual", "Coastal",
];

export default function UploadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addPost, currentUser } = useApp();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 3, height: 4 });
  const [caption, setCaption] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("Minimal");
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "saving">("idle");

  const topPad = insets.top;

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
      const w = asset.width && asset.width > 0 ? asset.width : 3;
      const h = asset.height && asset.height > 0 ? asset.height : 4;
      setImageSize({ width: w, height: h });
    }
  }

  function addTag() {
    const clean = tagInput.trim().toLowerCase().replace(/#+/g, "").replace(/\s+/g, " ");
    if (clean && !tags.includes(clean) && tags.length < 10) {
      setTags([...tags, clean]);
      setTagInput("");
    }
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  async function handlePost() {
    if (!imageUri) {
      Alert.alert("No photo", "Tap the photo area to pick an image first.");
      return;
    }

    setSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // 1. Upload image to Supabase Storage → get a permanent public URL
    let finalImageUri = imageUri;
    try {
      setUploadStatus("uploading");
      const { publicUrl } = await uploadPostImage(imageUri);
      finalImageUri = publicUrl;
    } catch (err) {
      if (err instanceof UploadValidationError) {
        // File type or size invalid — block the post
        setSubmitting(false);
        setUploadStatus("idle");
        Alert.alert("Can't upload photo", (err as UploadValidationError).message);
        return;
      } else if (err instanceof UploadStorageError) {
        // Storage error — warn but gracefully fall back to local URI
        console.warn("[Upload] Supabase storage error, using local URI:", err);
        Alert.alert(
          "Photo not saved to cloud",
          "Your look will still be posted, but the image may not persist. Check your connection and try again.",
          [{ text: "Post anyway" }],
        );
      } else {
        console.warn("[Upload] Unexpected upload error, using local URI:", err);
      }
    }

    // 2. Add to local state immediately with the public URL
    setUploadStatus("saving");
    addPost({
      imageUri: finalImageUri,
      caption: caption.trim(),
      tags,
      style: selectedTopic,
      userId: currentUser.id,
      username: user?.username ?? currentUser.username,
      userAvatar: user?.imageUrl ?? currentUser.avatar,
      width: imageSize.width,
      height: imageSize.height,
      aspectRatio: imageSize.width / imageSize.height,
    });

    // 3. Persist to DB with the Supabase URL (fire-and-forget)
    try {
      const token = await getToken();
      if (token) {
        await createPost(
          {
            imageUrl: finalImageUri,
            caption: caption.trim() || undefined,
            style: selectedTopic,
            tags: tags.length > 0 ? tags : undefined,
          },
          token,
        );
      }
    } catch (err) {
      console.warn("[Upload] DB persist failed:", err);
    }

    setSubmitting(false);
    setUploadStatus("idle");
    setImageUri(null);
    setCaption("");
    setTags([]);
    setTagInput("");
    setSelectedTopic("Minimal");
    router.replace("/(tabs)");
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
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
        <Pressable
          onPress={handlePost}
          style={[
            styles.postBtn,
            { backgroundColor: imageUri ? colors.primary : colors.muted },
          ]}
          disabled={submitting || !imageUri}
        >
          {submitting ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <ActivityIndicator color={colors.primaryForeground} size="small" />
              <Text style={[styles.postBtnText, { color: colors.primaryForeground }]}>
                {uploadStatus === "uploading" ? "Uploading…" : "Saving…"}
              </Text>
            </View>
          ) : (
            <Text
              style={[
                styles.postBtnText,
                { color: imageUri ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              Post
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo picker */}
        <Pressable
          onPress={pickImage}
          style={[
            styles.imagePicker,
            {
              backgroundColor: colors.secondary,
              borderColor: imageUri ? colors.primary : colors.border,
              borderStyle: imageUri ? "solid" : "dashed",
            },
          ]}
        >
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
              <Pressable
                onPress={() => setImageUri(null)}
                style={[styles.removeImg, { backgroundColor: colors.overlay }]}
              >
                <Feather name="x" size={18} color="#fff" />
              </Pressable>
              <View style={[styles.changeBadge, { backgroundColor: colors.overlay }]}>
                <Feather name="camera" size={13} color="#fff" />
                <Text style={styles.changeBadgeText}>Change</Text>
              </View>
            </>
          ) : (
            <View style={styles.pickerInner}>
              <View style={[styles.pickerIconWrap, { backgroundColor: colors.tag }]}>
                <Feather name="camera" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.pickerText, { color: colors.foreground }]}>
                Upload your outfit
              </Text>
              <Text style={[styles.pickerSub, { color: colors.mutedForeground }]}>
                JPG, PNG · tap to browse
              </Text>
            </View>
          )}
        </Pressable>

        {/* Topic selector */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
            <Text style={[styles.label, { color: colors.foreground }]}>Topic</Text>
          </View>
          <View style={styles.topicGrid}>
            {ALL_TOPICS.map((topic) => {
              const selected = selectedTopic === topic;
              return (
                <Pressable
                  key={topic}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTopic(topic);
                  }}
                  style={[
                    styles.topicChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.tag,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.topicChipText,
                      { color: selected ? colors.primaryForeground : colors.tagText },
                    ]}
                  >
                    {topic}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={13} color={colors.primaryForeground} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Caption (optional) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
            <Text style={[styles.label, { color: colors.foreground }]}>Caption</Text>
            <Text style={[styles.optional, { color: colors.mutedForeground }]}>(optional)</Text>
          </View>
          <TextInput
            style={[
              styles.captionInput,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="Describe your look, inspiration, or mood..."
            placeholderTextColor={colors.mutedForeground}
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Hashtags */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="at-outline" size={16} color={colors.primary} />
            <Text style={[styles.label, { color: colors.foreground }]}>Hashtags</Text>
            <Text style={[styles.tagCount, { color: colors.mutedForeground }]}>
              {tags.length}/10
            </Text>
          </View>
          <View
            style={[
              styles.tagInputRow,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.hashPrefix, { color: colors.primary }]}>#</Text>
            <TextInput
              style={[styles.tagInputText, { color: colors.foreground, flex: 1 }]}
              placeholder="type a tag and press +"
              placeholderTextColor={colors.mutedForeground}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              returnKeyType="done"
              autoCapitalize="none"
            />
            <Pressable onPress={addTag} disabled={!tagInput.trim()}>
              <Ionicons
                name="add-circle"
                size={26}
                color={tagInput.trim() ? colors.primary : colors.muted}
              />
            </Pressable>
          </View>
          {tags.length > 0 && (
            <View style={styles.tagRow}>
              {tags.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => removeTag(t)}
                  style={[styles.tagPill, { backgroundColor: colors.tag, borderColor: colors.border }]}
                >
                  <Text style={[styles.tagPillText, { color: colors.tagText }]}>#{t}</Text>
                  <Ionicons name="close" size={13} color={colors.tagText} />
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
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 100,
    minWidth: 68,
    alignItems: "center",
  },
  postBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    gap: 24,
  },

  // Photo picker
  imagePicker: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  preview: { ...StyleSheet.absoluteFillObject },
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
  changeBadge: {
    position: "absolute",
    bottom: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  changeBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  pickerInner: { alignItems: "center", gap: 12 },
  pickerIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  pickerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  // Sections
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  label: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  optional: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  tagCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  // Topic grid
  topicGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  topicChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
  },
  topicChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },

  // Caption
  captionInput: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 90,
    textAlignVertical: "top",
    lineHeight: 22,
  },

  // Tags
  tagInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  hashPrefix: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 5,
  },
  tagPillText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
