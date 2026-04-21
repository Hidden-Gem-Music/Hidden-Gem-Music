import { Pressable, StyleSheet, Text, View } from "react-native";

import { availableYears } from "../data/mockData";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  label?: string;
  year: number;
  onSelectYear: (year: number) => void;
};

export function YearSelector({ label = "Year", year, onSelectYear }: Props) {
  const currentIndex = availableYears.indexOf(year);
  const previousYear = availableYears[Math.max(0, currentIndex - 1)];
  const nextYear = availableYears[Math.min(availableYears.length - 1, currentIndex + 1)];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => onSelectYear(previousYear)}
          disabled={previousYear === year}
          style={[styles.arrowButton, previousYear === year ? styles.arrowButtonDisabled : null]}
        >
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <View style={[styles.chip, styles.chipActive]}>
          <Text style={[styles.chipText, styles.chipTextActive]}>{year}</Text>
        </View>
        <Pressable
          onPress={() => onSelectYear(nextYear)}
          disabled={nextYear === year}
          style={[styles.arrowButton, nextYear === year ? styles.arrowButtonDisabled : null]}
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  label: {
    color: colors.textStrong,
    fontFamily: typefaces.body,
    fontSize: 20,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
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
  chipActive: {
    backgroundColor: colors.button,
  },
  chipText: {
    color: colors.textStrong,
    fontFamily: typefaces.body,
    fontSize: 16,
  },
  chipTextActive: {
    color: colors.border,
  },
});
