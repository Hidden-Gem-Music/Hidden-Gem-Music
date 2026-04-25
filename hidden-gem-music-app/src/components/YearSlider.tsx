import { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";

import { availableYears } from "../data/mockData";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  year: number;
  onChangeYear: (year: number) => void;
};

const gapStartYear = 2007;
const gapEndYear = 2010;

export function YearSlider({ year, onChangeYear }: Props) {
  const minYear = availableYears[0];
  const maxYear = availableYears[availableYears.length - 1];
  const gapMidpoint = (gapStartYear + gapEndYear) / 2;
  const [dragYear, setDragYear] = useState(year);
  const [isDragging, setIsDragging] = useState(false);
  const dragYearRef = useRef(year);
  const progress = ((dragYear - minYear) / (maxYear - minYear)) * 100;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const gapStartProgress = ((gapStartYear - minYear) / (maxYear - minYear)) * 100;
  const gapEndProgress = ((gapEndYear - minYear) / (maxYear - minYear)) * 100;
  const [trackWidth, setTrackWidth] = useState(1);

  const getSelectableYear = (candidateYear: number) => {
    if (candidateYear < gapStartYear || candidateYear > gapEndYear) {
      return Math.min(Math.max(candidateYear, minYear), maxYear);
    }

    return candidateYear <= gapMidpoint ? gapStartYear - 1 : gapEndYear + 1;
  };

  const getAdjacentSelectableYear = (currentYear: number, direction: -1 | 1) => {
    const currentIndex = availableYears.indexOf(currentYear);
    if (currentIndex === -1) {
      return getSelectableYear(currentYear);
    }

    for (
      let index = currentIndex + direction;
      index >= 0 && index < availableYears.length;
      index += direction
    ) {
      const nextYear = availableYears[index];
      if (nextYear < gapStartYear || nextYear > gapEndYear) {
        return nextYear;
      }
    }

    return currentYear;
  };

  useEffect(() => {
    if (!isDragging) {
      const nextYear = getSelectableYear(year);
      setDragYear(nextYear);
      dragYearRef.current = nextYear;
    }
  }, [year, isDragging]);

  const getYearFromLocation = (locationX: number) => {
    const ratio = Math.min(Math.max(locationX / trackWidth, 0), 1);
    const rawYear = Math.round(minYear + ratio * (maxYear - minYear));
    return getSelectableYear(rawYear);
  };

  const updateFromLocation = (locationX: number) => {
    const nextYear = getYearFromLocation(locationX);
    dragYearRef.current = nextYear;
    setDragYear(nextYear);
  };

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(Math.max(event.nativeEvent.layout.width, 1));
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <Text style={styles.label}>Timeline</Text>
        <Text style={styles.yearText}>Displaying year: {isDragging ? dragYear : year}</Text>
      </View>
      <View style={styles.row}>
        <Pressable onPress={() => onChangeYear(getAdjacentSelectableYear(year, -1))}>
          <Text style={styles.arrow}>‹</Text>
        </Pressable>
        <View
          style={styles.track}
          onLayout={handleTrackLayout}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(event) => {
            setIsDragging(true);
            updateFromLocation(event.nativeEvent.locationX);
          }}
          onResponderMove={(event) => updateFromLocation(event.nativeEvent.locationX)}
          onResponderRelease={() => {
            setIsDragging(false);
            onChangeYear(dragYearRef.current);
          }}
        >
          <View style={[styles.fill, { width: `${clampedProgress}%` }]} />
          <View
            style={[
              styles.gap,
              {
                left: `${gapStartProgress}%`,
                width: `${Math.max(gapEndProgress - gapStartProgress, 0)}%`,
              },
            ]}
          />
          <View style={[styles.thumb, { left: `${clampedProgress}%` }]} />
        </View>
        <Pressable onPress={() => onChangeYear(getAdjacentSelectableYear(year, 1))}>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>
      <Text style={styles.disclaimer}>Data gap: timeline skips unavailable years.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
    marginTop: -6,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    flexWrap: "wrap",
  },
  label: {
    color: colors.textStrong,
    fontFamily: typefaces.condensed,
    fontSize: 24,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  track: {
    flex: 1,
    height: 14,
    borderRadius: 999,
    backgroundColor: "rgba(120, 73, 100, 0.28)",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.border,
  },
  fill: {
    position: "absolute",
    left: 0,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.timelineLine,
  },
  gap: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 16, 21, 0.72)",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(15, 16, 21, 0.96)",
  },
  thumb: {
    position: "absolute",
    top: "50%",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.timelineDot,
    borderWidth: 4,
    borderColor: colors.border,
    marginTop: -16,
    marginLeft: -16,
  },
  arrow: {
    color: colors.textStrong,
    fontSize: 28,
    fontWeight: "800",
  },
  yearText: {
    color: colors.textStrong,
    fontFamily: typefaces.condensed,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "right",
  },
  disclaimer: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 18,
    textAlign: "center",
    marginTop: -10,
  },
});
