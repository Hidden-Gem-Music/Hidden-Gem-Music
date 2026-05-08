import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ViewStyle } from "react-native";

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
  const [query, setQuery] = useState("");
  const containerRef = useRef<View>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return countries.slice(0, 25);
    }

    return countries.filter((country) => country.name.toLowerCase().includes(normalized)).slice(0, 25);
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

  return (
    <View ref={containerRef} style={styles.popover}>
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
          style={styles.input}
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
    maxWidth: "92vw" as any,
    zIndex: 300,
    elevation: 300,
    backgroundColor: "transparent",
  },
  panel: {
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
