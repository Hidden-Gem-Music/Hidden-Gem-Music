import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

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

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return countries.slice(0, 8);
    }

    return countries.filter((country) => country.name.toLowerCase().includes(normalized)).slice(0, 8);
  }, [countries, query]);

  if (!visible) {
    return null;
  }

  return (
    <Panel style={styles.popover}>
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
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoFocus
      />

      <View style={styles.resultGroup}>
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
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  popover: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: 12,
    width: 360,
    maxWidth: "92vw" as any,
    zIndex: 30,
    gap: 12,
    paddingVertical: 18,
    backgroundColor: colors.surfaceSecondary,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: colors.textStrong,
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
    color: colors.textStrong,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: typefaces.body,
    fontSize: 17,
  },
  resultGroup: {
    gap: 8,
  },
  resultItem: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 12,
  },
  resultText: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 18,
  },
  resultMeta: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 14,
    fontWeight: "700",
  },
  copy: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 22,
  },
});
