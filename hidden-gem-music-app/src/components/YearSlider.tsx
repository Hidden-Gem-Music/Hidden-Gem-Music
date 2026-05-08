import { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  year: number;
  onChangeYear: (year: number) => void;
  years: number[];
  displayLabel?: string;
};

export function YearSlider({ year, onChangeYear, years, displayLabel }: Props) {
  const sliderYears = years.length > 0 ? Array.from(new Set(years)).sort((a, b) => a - b) : [year];
  const minYear = sliderYears[0];
  const maxYear = sliderYears[sliderYears.length - 1];
  const selectableYears = new Set(sliderYears);
  const missingYears = [];
  for (let candidateYear = minYear; candidateYear <= maxYear; candidateYear += 1) {
    if (!selectableYears.has(candidateYear)) {
      missingYears.push(candidateYear);
    }
  }
  const knownGapYear = missingYears.length > 0 ? missingYears[0] : null;
  const hasGap = knownGapYear != null;
  const gapStartYear = hasGap ? knownGapYear : minYear;
  const gapEndYear = hasGap ? knownGapYear : minYear;
  const gapMidpoint = (gapStartYear + gapEndYear) / 2;
  const [dragYear, setDragYear] = useState(year);
  const [isDragging, setIsDragging] = useState(false);
  const dragYearRef = useRef(year);
  const yearBeforeGap = hasGap ? gapStartYear - 1 : minYear;
  const yearAfterGap = hasGap ? gapEndYear + 1 : maxYear;
  const yearBeforeGapIndex = sliderYears.indexOf(yearBeforeGap);
  const yearAfterGapIndex = sliderYears.indexOf(yearAfterGap);
  const gapSlotIndex = hasGap ? yearAfterGapIndex : -1;
  const totalSlots = sliderYears.length + (hasGap ? 1 : 0);
  const maxSlotIndex = Math.max(totalSlots - 1, 1);
  const getSlotFromYear = (value: number) => {
    const yearIndex = sliderYears.indexOf(value);
    if (yearIndex < 0) {
      return 0;
    }
    if (!hasGap) {
      return yearIndex;
    }
    return yearIndex >= yearAfterGapIndex ? yearIndex + 1 : yearIndex;
  };
  const dragSlotIndex = getSlotFromYear(dragYear);
  const progress = (dragSlotIndex / maxSlotIndex) * 100;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const gapStartProgress = hasGap ? ((gapSlotIndex - 0.5) / maxSlotIndex) * 100 : 0;
  const gapEndProgress = hasGap ? ((gapSlotIndex + 0.5) / maxSlotIndex) * 100 : 0;
  const [trackWidth, setTrackWidth] = useState(1);
  const thumbRadiusPx = 16;
  const extraGapPadPx = 4;
  const thumbRadiusProgress = (thumbRadiusPx / trackWidth) * 100;
  const extraGapPadProgress = (extraGapPadPx / trackWidth) * 100;
  const visualGapStartProgress = Math.max(gapStartProgress - thumbRadiusProgress - extraGapPadProgress, 0);
  const visualGapEndProgress = Math.min(gapEndProgress + thumbRadiusProgress + extraGapPadProgress, 100);

  const getSelectableYear = (candidateYear: number) => {
    if (candidateYear < gapStartYear || candidateYear > gapEndYear) {
      const clampedYear = Math.min(Math.max(candidateYear, minYear), maxYear);
      if (selectableYears.has(clampedYear)) {
        return clampedYear;
      }
      const nearestYear = sliderYears.reduce(
        (currentNearest, currentYear) =>
          Math.abs(currentYear - clampedYear) < Math.abs(currentNearest - clampedYear) ? currentYear : currentNearest,
        sliderYears[0]
      );
      return nearestYear;
    }

    return candidateYear <= gapMidpoint ? gapStartYear - 1 : gapEndYear + 1;
  };

  const getAdjacentSelectableYear = (currentYear: number, direction: -1 | 1) => {
    const currentIndex = sliderYears.indexOf(currentYear);
    if (currentIndex === -1) {
      return getSelectableYear(currentYear);
    }

    for (
      let index = currentIndex + direction;
      index >= 0 && index < sliderYears.length;
      index += direction
    ) {
      const nextYear = sliderYears[index];
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
    const rawSlot = ratio * maxSlotIndex;
    const slotIndex = Math.round(rawSlot);

    if (!hasGap) {
      return sliderYears[Math.min(Math.max(slotIndex, 0), sliderYears.length - 1)];
    }

    if (slotIndex === gapSlotIndex) {
      return rawSlot < gapSlotIndex ? yearBeforeGap : yearAfterGap;
    }

    const yearIndex = slotIndex > gapSlotIndex ? slotIndex - 1 : slotIndex;
    const clampedIndex = Math.min(Math.max(yearIndex, 0), sliderYears.length - 1);
    return sliderYears[clampedIndex];
  };

  const updateFromLocation = (locationX: number) => {
    const nextYear = getYearFromLocation(locationX);
    if (nextYear === dragYearRef.current) {
      return;
    }
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
        <Text style={styles.yearText}>
          Displaying year: {displayLabel ?? (isDragging ? dragYear : year)}
        </Text>
      </View>
      <View style={styles.row}>
        <Pressable onPress={() => onChangeYear(getAdjacentSelectableYear(year, -1))}>
          <Text style={styles.arrow}>‹</Text>
        </Pressable>
        <View
          style={styles.track}
          onLayout={handleTrackLayout}
          onStartShouldSetResponderCapture={() => true}
          onMoveShouldSetResponderCapture={() => true}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(event) => {
            setIsDragging(true);
            updateFromLocation(event.nativeEvent.locationX);
          }}
          onResponderMove={(event) => updateFromLocation(event.nativeEvent.locationX)}
          onResponderTerminationRequest={() => false}
          onResponderRelease={() => {
            setIsDragging(false);
            onChangeYear(dragYearRef.current);
          }}
          onResponderTerminate={() => {
            setIsDragging(false);
            onChangeYear(dragYearRef.current);
          }}
        >
          <View style={[styles.fill, { width: `${clampedProgress}%` }]} />
          {hasGap ? (
            <View
              style={[
                styles.gap,
                {
                  left: `${visualGapStartProgress}%`,
                  width: `${Math.max(visualGapEndProgress - visualGapStartProgress, 0)}%`,
                },
              ]}
            />
          ) : null}
          <View style={[styles.thumb, { left: `${clampedProgress}%` }]} />
        </View>
        <Pressable onPress={() => onChangeYear(getAdjacentSelectableYear(year, 1))}>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>
      {hasGap ? <Text style={styles.disclaimer}>Data gap: timeline skips unavailable years.</Text> : null}
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
    color: colors.textLight,
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
    userSelect: "none",
    cursor: "pointer",
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
    color: colors.textLight,
    fontSize: 28,
    fontWeight: "800",
  },
  yearText: {
    color: colors.textLight,
    fontFamily: typefaces.condensed,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "right",
  },
  disclaimer: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 18,
    textAlign: "center",
    marginTop: -10,
  },
});
