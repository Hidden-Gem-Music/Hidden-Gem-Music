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
  heading = "This is the Blurb",
  body = "this is the text inside the blurb that will say things about the page you're on and will guide users through the experience. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
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
    color: colors.text,
    fontFamily: typefaces.display,
    fontSize: 22,
    lineHeight: 26,
  },
  body: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 28,
  },
});
