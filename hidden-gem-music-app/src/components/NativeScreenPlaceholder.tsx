import { StyleSheet, Text, View } from "react-native";

import { Panel } from "./Panel";
import { ScreenScaffold } from "./ScreenScaffold";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  title: string;
  message: string;
};

export function NativeScreenPlaceholder({ title, message }: Props) {
  return (
    <ScreenScaffold>
      <View style={styles.layout}>
        <Text style={styles.title}>{title}</Text>
        <Panel style={styles.panel}>
          <Text style={styles.message}>{message}</Text>
        </Panel>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  layout: {
    gap: 18,
  },
  title: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 36,
    lineHeight: 40,
    textAlign: "center",
  },
  panel: {
    gap: 12,
  },
  message: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 17,
    lineHeight: 26,
    textAlign: "center",
  },
});
