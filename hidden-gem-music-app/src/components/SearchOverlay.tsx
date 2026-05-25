import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View, ViewStyle } from "react-native";

import { Country } from "../types/content";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";
import { Panel } from "./Panel";

type Props = {
  visible: boolean;
  countries: Country[];
  onClose: () => void;
  onOpenCountry: (countryId: string) => void;
};

export function SearchOverlay({ visible, countries, onClose, onOpenCountry }: Props) {
  const { width } = useWindowDimensions();
  const isMobileWidth = width < 980;
  const isNative = Platform.OS !== "web";
  const [query, setQuery] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const containerRef = useRef<View>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return countries;
    }

    return countries.filter((country) => country.name.toLowerCase().includes(normalized));
  }, [countries, query]);

  useEffect(() => {
    if (typeof document === "undefined" || !visible) {
      return;
    }

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const node = containerRef.current as unknown as { contains?: (target: Node | null) => boolean } | null;
      const targetNode = event.target as Node | null;
      const isInside = Boolean(node?.contains?.(targetNode));

      if (!isInside) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => document.removeEventListener("mousedown", handleDocumentMouseDown);
  }, [onClose, visible]);

  if (!visible) {
    return null;
  }

  const content = (
    <View
      ref={containerRef}
      style={[
        styles.popover,
        isNative
          ? styles.popoverNative
          : null,
        isMobileWidth && !isNative
          ? [
              styles.popoverMobile,
            ]
          : null,
        isNative ? { width: Math.min(width - 24, 420), maxWidth: 420 } : null,
      ]}
    >
      <Panel style={styles.panel}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Search</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a country"
          placeholderTextColor={colors.textLight}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          style={[styles.input, inputFocused ? styles.inputFocused : null]}
          autoFocus
        />

        <ScrollView style={styles.resultScroll} contentContainerStyle={styles.resultGroup} showsVerticalScrollIndicator>
          {results.length > 0 ? (
            results.map((country) => (
              <Pressable
                key={country.id}
                onPress={() => {
                  onClose();
                  onOpenCountry(country.id);
                }}
                style={styles.resultItem}
              >
                <Text style={styles.resultText}>{country.name}</Text>
                <Text style={styles.resultMeta}>{country.region}</Text>
              </Pressable>
            ))
          ) : query.trim() ? (
            <Text style={styles.copy}>That country is not included in this app at this time.</Text>
          ) : (
            <Text style={styles.copy}>Start typing to narrow down the countries in this app.</Text>
          )}
        </ScrollView>
      </Panel>
    </View>
  );

  if (isNative) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.nativeModalBackdrop} onPress={onClose}>
          <Pressable onPress={(event) => event.stopPropagation()}>{content}</Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <>
      <Pressable style={styles.webBackdrop} onPress={onClose} />
      {content}
    </>
  );
}

const styles = StyleSheet.create({
  popover: {
    ...(Platform.OS === "web"
      ? ({
          position: "fixed",
          top: 110,
          right: 24,
        } as unknown as ViewStyle)
      : {
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: 12,
        }),
    width: 360,
    ...(Platform.OS === "web" ? ({ maxWidth: "92vw" } as any) : null),
    zIndex: 6000,
    elevation: 6000,
    backgroundColor: "transparent",
  },
  popoverMobile: {
    ...(Platform.OS === "web"
      ? ({
          left: "50%",
          right: "auto",
          transform: [{ translateX: -180 }],
        } as unknown as ViewStyle)
      : {
          left: "50%",
          right: "auto",
          transform: [{ translateX: -180 }],
        }),
  },
  popoverNative: {
    position: "relative",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    marginTop: 0,
  },
  nativeModalBackdrop: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.01)",
    paddingTop: 72,
  },
  webBackdrop: {
    ...(Platform.OS === "web"
      ? ({
          position: "fixed",
          top: 96,
          right: 0,
          bottom: 0,
          left: 0,
        } as unknown as ViewStyle)
      : {}),
    backgroundColor: "transparent",
    zIndex: 5999,
  },
  panel: {
    width: "100%",
    gap: 12,
    paddingVertical: 18,
    backgroundColor: colors.surfaceSecondary,
    maxHeight: 560,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 26,
  },
  closeText: {
    color: colors.accent,
    fontFamily: typefaces.body,
    fontSize: 15,
  },
  input: {
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    color: colors.textLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: typefaces.body,
    fontSize: 17,
    ...(Platform.OS === "web"
      ? ({
          outlineColor: "rgba(169,176,209,0.92)",
          outlineStyle: "none",
          outlineWidth: 0,
        } as any)
      : null),
  },
  inputFocused: {
    borderColor: "rgba(169,176,209,0.92)",
    backgroundColor: "rgba(117,82,107,0.12)",
  },
  resultScroll: {
    maxHeight: 360,
  },
  resultGroup: {
    gap: 8,
    paddingBottom: 6,
  },
  resultItem: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 12,
  },
  resultText: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 18,
  },
  resultMeta: {
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 14,
    fontWeight: "700",
  },
  copy: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 22,
  },
});
