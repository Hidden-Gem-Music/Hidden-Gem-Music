import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";
import { GemIcon } from "./GemIcon";
import { Panel } from "./Panel";

type Props = {
  heading?: string;
  body?: string;
};

export function DiscoveryBlurb({
  heading = "Discovery Globe",
  body = "Welcome to Hidden Gem Music's Discovery Globe. The purpose of this app is to find and display the 'discovery gap' — What music is most loved in each country, and how much was that country's most loved music spread, shared, and loved by other countries? You can apply either Pre-Selected filters like Your Region vs. The World or The Biggest Crossover Years, or more in All Filters like sorting by region, A-Z or Z-A, and more. Navigate countries using the globe or list. Click a country to view it's detail page and to preview it's hidden songs. Also check out comparison mode to compare two countries, in the navigation above or also at the bottom of each country page.",
}: Props) {
  return (
    <Panel style={styles.panel}>
      <LinearGradient
        colors={[colors.surfaceSecondary, "#27293B", "rgba(66,72,101,0.42)", "rgba(66,72,101,0.72)"]}
        locations={[0, 0.42, 0.78, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.fill}
      />
      <View style={styles.content}>
        <Text style={styles.text}>
          <Text style={styles.heading}>{heading}</Text>
          {"  "}
          <GemIcon size={16} style={styles.separatorIcon} />
          {"  "}
          <Text style={styles.body}>{body}</Text>
        </Text>
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: {
    minHeight: 80,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    transform: [{ translateY: 3 }],
  },
  text: {
    textAlign: "left",
  },
  separatorIcon: {
    transform: [{ translateY: 1 }],
  },
  heading: {
    color: colors.textLight,
    fontFamily: typefaces.display,
    fontSize: 22,
    lineHeight: 26,
  },
  body: {
    color: colors.textLight,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 28,
  },
});
