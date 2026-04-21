import { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";

import { availableYears } from "../data/mockData";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  year: number;
  onChangeYear: (year: number) => void;
};

export function YearSlider({ year, onChangeYear }: Props) {
  const minYear = availableYears[0];
  const maxYear = availableYears[availableYears.length - 1];
  const [dragYear, setDragYear] = useState(year);
  const [isDragging, setIsDragging] = useState(false);
  const dragYearRef = useRef(year);
  const progress = ((dragYear - minYear) / (maxYear - minYear)) * 100;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const [trackWidth, setTrackWidth] = useState(1);

  useEffect(() => {
    if (!isDragging) {
      setDragYear(year);
      dragYearRef.current = year;
    }
  }, [year, isDragging]);

  const getYearFromLocation = (locationX: number) => {
    const ratio = Math.min(Math.max(locationX / trackWidth, 0), 1);
    const yearIndex = Math.round(ratio * (availableYears.length - 1));
    return availableYears[yearIndex];
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
        <Pressable onPress={() => onChangeYear(Math.max(minYear, year - 1))}>
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
          <View style={[styles.thumb, { left: `${clampedProgress}%` }]} />
        </View>
        <Pressable onPress={() => onChangeYear(Math.min(maxYear, year + 1))}>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
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
});
