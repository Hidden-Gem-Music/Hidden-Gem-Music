import { Pressable, StyleSheet, Text, View } from "react-native";

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
};

export function YearSelector({
  label = "Year",
  year,
  onSelectYear,
  centered = false,
  smallLabel = false,
  compactArrows = false,
  compact = false,
}: Props) {
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
          style={[
            styles.arrowButton,
            compactArrows ? styles.arrowButtonCompact : null,
            previousYear === year ? styles.arrowButtonDisabled : null,
          ]}
        >
          <Text style={[styles.arrowText, compactArrows ? styles.arrowTextCompact : null]}>‹</Text>
        </Pressable>
        <View style={[styles.chip, styles.chipActive, compact ? styles.chipCompact : null]}>
          <Text style={[styles.chipText, styles.chipTextActive, compact ? styles.chipTextCompact : null]}>{year}</Text>
        </View>
        <Pressable
          onPress={() => onSelectYear(nextYear)}
          disabled={nextYear === year}
          style={[
            styles.arrowButton,
            compactArrows ? styles.arrowButtonCompact : null,
            nextYear === year ? styles.arrowButtonDisabled : null,
          ]}
        >
          <Text style={[styles.arrowText, compactArrows ? styles.arrowTextCompact : null]}>›</Text>
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
    minWidth: 86,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    fontSize: 14,
    lineHeight: 16,
  },
  chipTextActive: {
    color: colors.border,
  },
});
