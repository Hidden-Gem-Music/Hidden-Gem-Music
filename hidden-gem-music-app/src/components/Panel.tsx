import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { colors } from "../theme/colors";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Panel({ children, style }: Props) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.panel,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: colors.border,
    padding: 18,
    shadowColor: colors.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
});
