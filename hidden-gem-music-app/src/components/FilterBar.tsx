import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GemIcon } from "./GemIcon";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typefaces } from "../theme/typography";

export const presetFilters = [
  "Global Hits You Might Have Missed",
  "The Viral Wave",
  "Your Region vs. The World",
  "One-Country Wonders",
  "The Biggest Crossover Years",
  "Latin Music's Global Takeover",
] as const;

type PresetFilter = (typeof presetFilters)[number];

type Props = {
  activeFilter: PresetFilter | null;
  onSelectFilter: (filter: PresetFilter) => void;
  onOpenAllFilters: () => void;
};

const activeGradient = [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised] as const;
const hoverGradient = ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"] as const;

export function FilterBar({ activeFilter, onSelectFilter, onOpenAllFilters }: Props) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const renderButton = (label: string, onPress: () => void) => {
    const isActive = activeFilter === label;
    const isHovered = hoveredLabel === label;
    const showGradient = isActive || isHovered;

    return (
      <Pressable
        key={label}
        onPress={onPress}
        onHoverIn={() => setHoveredLabel(label)}
        onHoverOut={() => setHoveredLabel((current) => (current === label ? null : current))}
        style={styles.buttonShell}
      >
        {showGradient ? (
          <LinearGradient
            colors={isActive ? activeGradient : hoverGradient}
            locations={[0, 0.34, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.buttonGradient}
          />
        ) : null}
        <View style={[styles.button, showGradient ? styles.buttonActive : null]}>
          <View style={styles.content}>
            <GemIcon size={16} />
            <Text style={[styles.text, showGradient ? styles.textActive : null]}>{label}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {presetFilters.map((label) => renderButton(label, () => onSelectFilter(label)))}
        {renderButton("All Filters", onOpenAllFilters)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginTop: -14,
    marginBottom: -14,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: "transparent",
  },
  row: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  buttonShell: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
    flexShrink: 0,
  },
  buttonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  button: {
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    justifyContent: "center",
  },
  buttonActive: {
    backgroundColor: "transparent",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  text: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    textAlign: "center",
  },
  textActive: {
    color: colors.text,
  },
});
