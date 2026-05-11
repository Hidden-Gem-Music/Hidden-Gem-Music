import { Platform, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  size?: "small" | "medium";
  tooltip?: string;
};

const WebHoverWrapper = "div" as any;

export function ExplicitIndicator({ size = "medium", tooltip = "Explicit content" }: Props) {
  const isWeb = Platform.OS === "web";

  const badgeContent = (
    <View style={[styles.badge, size === "small" ? styles.badgeSmall : null]}>
      <Text style={[styles.label, size === "small" ? styles.labelSmall : null]}>E</Text>
    </View>
  );

  if (isWeb) {
    return (
      <WebHoverWrapper title={tooltip} style={{ display: "inline-flex", alignSelf: "flex-start", cursor: "default" } as any}>
        {badgeContent}
      </WebHoverWrapper>
    );
  }

  return <View style={styles.wrap}>{badgeContent}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    overflow: "visible",
    zIndex: 999,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeSmall: {
    minWidth: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    paddingHorizontal: 2,
  },
  label: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 12,
    lineHeight: 12,
  },
  labelSmall: {
    fontSize: 10,
    lineHeight: 10,
  },
});
