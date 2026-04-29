import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { GemIcon } from "./GemIcon";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  // Called when the user dismisses/clears back to idle
  onClear?: () => void;
  // Extra TextInput props if needed
  inputProps?: Omit<TextInputProps, "value" | "onChangeText" | "placeholder">;
};

/**
 * MobileSearchBar
 *
 * A mobile-only centered search input.
 *
 * — Idle state: gem icon + title + subtitle + input box centered vertically on screen
 * — Active state: same input stays centered but title/subtitle fade out,
 *   giving more breathing room for results rendered below by the parent
 *
 * Usage:
 *   <MobileSearchBar
 *     value={query}
 *     onChangeText={setQuery}
 *     placeholder="Search countries, artists..."
 *   />
 */
export function MobileSearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
  onClear,
  inputProps,
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.trim().length > 0;
  const isActive = isFocused || hasValue;

  // Fade animation for the title/subtitle
  const titleOpacity = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.timing(titleOpacity, {
      toValue,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const handleFocus = () => {
    setIsFocused(true);
    animateTo(0);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!hasValue) animateTo(1);
  };

  const handleClear = () => {
    onChangeText("");
    onClear?.();
    Keyboard.dismiss();
    animateTo(1);
    setIsFocused(false);
  };

  return (
    <View style={styles.root}>
      {/* Gradient background card */}
      <View style={styles.card}>
        <LinearGradient
          colors={[colors.surfaceSecondary, "#27293B", "rgba(66,72,101,0.72)"]}
          locations={[0, 0.42, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.cardFill}
        />

        {/* Title + subtitle — fades out when active */}
        <Animated.View style={[styles.titleBlock, { opacity: titleOpacity }]} pointerEvents="none">
          <GemIcon size={28} />
          <Text style={styles.title}>Search</Text>
          <Text style={styles.subtitle}>
            Find countries, artists, albums, songs, or genres
          </Text>
        </Animated.View>

        {/* Input row */}
        <View style={[styles.inputRow, isActive ? styles.inputRowActive : null]}>
          <View style={styles.inputWrap}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="never" // we handle clear manually
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...inputProps}
            />
            {hasValue ? (
              <Pressable onPress={handleClear} style={styles.clearBtn} hitSlop={8}>
                <Text style={styles.clearBtnText}>✕</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Cancel button — only shown when active */}
          {isActive ? (
            <Pressable onPress={handleClear} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    alignItems: "center",
  },
  card: {
    width: "100%",
    borderRadius: 22,
    borderWidth: 4,
    borderColor: colors.border,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 16,
    // Shadow
    shadowColor: colors.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  cardFill: {
    ...StyleSheet.absoluteFillObject,
  },

  // Title block
  titleBlock: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 34,
    lineHeight: 38,
    textAlign: "center",
  },
  subtitle: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  // Input
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputRowActive: {
    // slight top margin when title is hidden so input doesn't jump
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  searchIcon: {
    color: colors.textMuted,
    fontSize: 20,
    lineHeight: 22,
  },
  input: {
    flex: 1,
    color: colors.textStrong,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 20,
    padding: 0,
    margin: 0,
  },
  clearBtn: {
    padding: 2,
  },
  clearBtnText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 16,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelBtnText: {
    color: colors.accent,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 18,
  },
});