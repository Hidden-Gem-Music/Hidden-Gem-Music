import { Image, ImageStyle, StyleProp, StyleSheet } from "react-native";

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

const gemIconSource = require("../assets/images/gemicon.png");

export function GemIcon({ size = 18, style }: Props) {
  return <Image source={gemIconSource} style={[styles.icon, { width: size, height: size }, style]} resizeMode="contain" />;
}

const styles = StyleSheet.create({
  icon: {
    width: 18,
    height: 18,
  },
});
