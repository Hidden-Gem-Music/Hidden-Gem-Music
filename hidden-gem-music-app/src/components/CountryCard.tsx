import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { Country } from "../types/content";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";
import { Panel } from "./Panel";

type Props = {
  country: Country;
  selectedYear?: number;
  selected?: boolean;
  onPress: () => void;
  onTitlePress?: () => void;
  onHover?: () => void;
};

export function CountryCard({ country, selectedYear, selected, onPress, onTitlePress, onHover }: Props) {
  const [hovered, setHovered] = useState(false);
  const hasHiddenGems = country.hiddenSongs > 0;
  const noHiddenGemsCopy = selectedYear ? `No Hidden Gems for ${selectedYear}` : "No Hidden Gems for this year";
  const hasNoSongData = country.album === "Unknown Album" && country.albumArtist === "Unknown Artist";
  const noSongDataCopy = selectedYear ? `No song data for ${selectedYear}` : "No song data for this year";

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => {
        setHovered(true);
        onHover?.();
      }}
      onHoverOut={() => setHovered(false)}
    >
      <Panel style={[styles.card, selected ? styles.selected : undefined, hovered ? styles.hovered : undefined]}>
        <LinearGradient
          colors={
            hovered || selected
              ? ["rgba(117,82,107,0.22)", "rgba(117,82,107,0.04)"]
              : ["rgba(169,176,209,0.10)", "rgba(44,46,75,0.02)"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.innerGlow}
        >
          <View style={styles.row}>
            <View style={styles.left}>
              <Pressable onPress={onTitlePress ?? onPress}>
                {({ pressed }) => <Text style={[styles.countryName, pressed ? styles.countryNamePressed : null]}>{country.name}</Text>}
              </Pressable>
              <Text style={styles.region}>{country.region}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.detail}>
                • Hidden Gems:  {hasHiddenGems ? `${country.hiddenSongs}` : noHiddenGemsCopy}
              </Text>
              <Text style={styles.detail}>• Genre(s):  Genre info coming soon.</Text>
              <Text style={styles.detail}>• Language(s):  Language info coming soon.</Text>
              {hasNoSongData ? (
                <Text style={styles.detail}>• Most popular album:  {noSongDataCopy}</Text>
              ) : (
                <Text style={styles.detail}>
                  • Most popular album:  {country.album} by {country.albumArtist}
                </Text>
              )}
            </View>
          </View>
        </LinearGradient>
      </Panel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderWidth: 2,
    borderColor: "rgba(169, 176, 209, 0.18)",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(12px) saturate(1.08)",
          WebkitBackdropFilter: "blur(12px) saturate(1.08)",
        } as ViewStyle)
      : null),
  },
  selected: {
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.24,
  },
  hovered: {
    borderColor: colors.accent,
  },
  innerGlow: {
    margin: -18,
    padding: 18,
    borderRadius: 20,
  },
  row: {
    flexDirection: "column",
    gap: 12,
  },
  left: {
    gap: 10,
  },
  right: {
    gap: 10,
    width: "100%",
  },
  countryName: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 20,
    textDecorationLine: "underline",
  },
  countryNamePressed: {
    color: colors.accent,
  },
  region: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 15,
    fontWeight: "700",
  },
  detail: {
    color: colors.text,
    fontFamily: typefaces.condensed,
    fontSize: 16,
    fontWeight: "700",
  },
});
