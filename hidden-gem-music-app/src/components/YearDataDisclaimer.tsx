import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";
import { GemIcon } from "./GemIcon";

type Props = {
  year?: number | null;
  style?: ViewStyle | ViewStyle[];
};

export function YearDataDisclaimer({ year, style }: Props) {
  if (year !== 2023) {
    return null;
  }

  return (
    <View style={[styles.shell, style]}>
      <LinearGradient
        colors={["rgba(117,82,107,0.34)", "rgba(108,119,142,0.28)", "rgba(35,38,55,0.24)"]}
        locations={[0, 0.58, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.fill}
      />
      <GemIcon size={13} />
      <Text style={styles.text}>2023 has limited data and may slightly skew results. New data coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    minHeight: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(117,82,107,0.64)",
    backgroundColor: "rgba(22,26,38,0.18)",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    overflow: "hidden",
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  text: {
    flexShrink: 1,
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
  },
});
