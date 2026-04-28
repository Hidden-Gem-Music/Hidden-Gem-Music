import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { GemIcon } from "./GemIcon";
import { availableYears } from "../data/mockData";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  label?: string;
  year: number;
  onSelectYear: (year: number) => void;
  centered?: boolean;
  smallLabel?: boolean;
  compactArrows?: boolean;
  compact?: boolean;
  filterStyled?: boolean;
};

export function YearSelector({
  label = "Year",
  year,
  onSelectYear,
  centered = false,
  smallLabel = false,
  compactArrows = false,
  compact = false,
  filterStyled = false,
}: Props) {
  const [isPreviousHovered, setIsPreviousHovered] = useState(false);
  const [isPreviousPressed, setIsPreviousPressed] = useState(false);
  const [isNextHovered, setIsNextHovered] = useState(false);
  const [isNextPressed, setIsNextPressed] = useState(false);
  const currentIndex = availableYears.indexOf(year);
  const previousYear = availableYears[Math.max(0, currentIndex - 1)];
  const nextYear = availableYears[Math.min(availableYears.length - 1, currentIndex + 1)];

  return (
    <View style={[styles.wrapper, centered ? styles.wrapperCentered : null, compact ? styles.wrapperCompact : null]}>
      <Text
        style={[
          styles.label,
          smallLabel ? styles.labelSmall : null,
          compact ? styles.labelCompact : null,
          centered ? styles.labelCentered : null,
        ]}
      >
        {label}
      </Text>
      <View style={[styles.row, centered ? styles.rowCentered : null, compact ? styles.rowCompact : null]}>
        <Pressable
          onPress={() => onSelectYear(previousYear)}
          disabled={previousYear === year}
          onHoverIn={() => setIsPreviousHovered(true)}
          onHoverOut={() => setIsPreviousHovered(false)}
          onPressIn={() => setIsPreviousPressed(true)}
          onPressOut={() => setIsPreviousPressed(false)}
          style={[filterStyled ? styles.filterArrowShell : styles.arrowButtonShell, previousYear === year ? styles.arrowButtonDisabled : null]}
        >
          {(() => {
            const showFilterGradient = filterStyled && previousYear !== year && (isPreviousHovered || isPreviousPressed);

            return (
              <>
                {showFilterGradient ? (
                  <LinearGradient
                    colors={
                      isPreviousPressed
                        ? [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised]
                        : ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"]
                    }
                    locations={[0, 0.34, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.filterArrowGradient}
                  />
                ) : null}
                <View
                  style={[
                    styles.arrowButton,
                    compactArrows ? styles.arrowButtonCompact : null,
                    filterStyled ? styles.filterArrowButton : null,
                    showFilterGradient ? styles.filterArrowButtonActive : null,
                  ]}
                >
                  <GemIcon
                    size={filterStyled ? 34 : compactArrows ? 24 : 30}
                    style={[
                      styles.arrowIcon,
                      compactArrows ? styles.arrowIconCompact : null,
                      filterStyled ? styles.filterArrowIcon : null,
                      showFilterGradient ? styles.filterArrowIconActive : null,
                      styles.arrowIconLeft,
                    ]}
                  />
                </View>
              </>
            );
          })()}
        </Pressable>
        <View style={[styles.chip, styles.chipActive, compact ? styles.chipCompact : null]}>
          <Text style={[styles.chipText, styles.chipTextActive, compact ? styles.chipTextCompact : null]}>{year}</Text>
        </View>
        <Pressable
          onPress={() => onSelectYear(nextYear)}
          disabled={nextYear === year}
          onHoverIn={() => setIsNextHovered(true)}
          onHoverOut={() => setIsNextHovered(false)}
          onPressIn={() => setIsNextPressed(true)}
          onPressOut={() => setIsNextPressed(false)}
          style={[filterStyled ? styles.filterArrowShell : styles.arrowButtonShell, nextYear === year ? styles.arrowButtonDisabled : null]}
        >
          {(() => {
            const showFilterGradient = filterStyled && nextYear !== year && (isNextHovered || isNextPressed);

            return (
              <>
                {showFilterGradient ? (
                  <LinearGradient
                    colors={
                      isNextPressed
                        ? [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised]
                        : ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"]
                    }
                    locations={[0, 0.34, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.filterArrowGradient}
                  />
                ) : null}
                <View
                  style={[
                    styles.arrowButton,
                    compactArrows ? styles.arrowButtonCompact : null,
                    filterStyled ? styles.filterArrowButton : null,
                    showFilterGradient ? styles.filterArrowButtonActive : null,
                  ]}
                >
                  <GemIcon
                    size={filterStyled ? 34 : compactArrows ? 24 : 30}
                    style={[
                      styles.arrowIcon,
                      compactArrows ? styles.arrowIconCompact : null,
                      filterStyled ? styles.filterArrowIcon : null,
                      showFilterGradient ? styles.filterArrowIconActive : null,
                      styles.arrowIconRight,
                    ]}
                  />
                </View>
              </>
            );
          })()}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  wrapperCompact: {
    gap: 6,
  },
  wrapperCentered: {
    alignItems: "center",
  },
  label: {
    color: colors.textStrong,
    fontFamily: typefaces.body,
    fontSize: 20,
  },
  labelSmall: {
    fontSize: 15,
    lineHeight: 18,
  },
  labelCompact: {
    fontSize: 13,
    lineHeight: 16,
  },
  labelCentered: {
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  rowCompact: {
    gap: 8,
  },
  rowCentered: {
    justifyContent: "center",
  },
  arrowButtonShell: {
    borderRadius: 26,
    overflow: "hidden",
  },
  arrowButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.button,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowButtonCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  arrowButtonDisabled: {
    opacity: 0.45,
  },
  arrowText: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 26,
  },
  arrowTextCompact: {
    fontSize: 18,
    lineHeight: 18,
  },
  arrowIcon: {
  },
  arrowIconCompact: {
    width: 20,
    height: 20,
  },
  arrowIconLeft: {
    transform: [{ translateX: -2 }, { rotate: "90deg" }],
  },
  arrowIconRight: {
    transform: [{ translateX: 2 }, { rotate: "-90deg" }],
  },
  filterArrowShell: {
    borderRadius: 999,
    overflow: "hidden",
  },
  filterArrowGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  filterArrowButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    borderWidth: 2,
  },
  filterArrowButtonActive: {
    backgroundColor: "transparent",
  },
  filterArrowText: {
    fontFamily: typefaces.condensed,
    fontSize: 21,
    lineHeight: 21,
  },
  filterArrowIcon: {
  },
  filterArrowIconActive: {
  },
  chip: {
    minWidth: 110,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    alignItems: "center",
  },
  chipCompact: {
    minWidth: 92,
    height: 48,
    paddingHorizontal: 16,
    paddingVertical: 0,
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: colors.button,
  },
  chipText: {
    color: colors.textStrong,
    fontFamily: typefaces.body,
    fontSize: 16,
  },
  chipTextCompact: {
    fontSize: 16,
    lineHeight: 18,
  },
  chipTextActive: {
    color: colors.border,
  },
});
