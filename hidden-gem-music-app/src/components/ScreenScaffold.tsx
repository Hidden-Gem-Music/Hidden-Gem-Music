import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { useState } from "react";

import { colors } from "../theme/colors";

type Props = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  alwaysScrollableOnWeb?: boolean;
  scrollNativeId?: string;
};

export function ScreenScaffold({
  children,
  contentStyle,
  alwaysScrollableOnWeb = false,
  scrollNativeId = "screen-scaffold-scroll",
}: Props) {
  const { width } = useWindowDimensions();
  const isStacked = width < 980;
  const shouldUseScrollView = isStacked || (Platform.OS === "web" && alwaysScrollableOnWeb);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const scrollbarVisible = Platform.OS === "web" && shouldUseScrollView && viewportHeight > 0 && contentHeight > viewportHeight;
  const thumbHeight = scrollbarVisible ? Math.max((viewportHeight / contentHeight) * viewportHeight, 60) : 0;
  const thumbTop =
    scrollbarVisible && contentHeight > viewportHeight
      ? (scrollY / (contentHeight - viewportHeight)) * (viewportHeight - thumbHeight)
      : 0;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(event.nativeEvent.contentOffset.y);
  };

  return (
    <View style={styles.background}>
      <LinearGradient
        colors={[colors.background, colors.background, colors.backgroundBottom]}
        locations={[0, 0.58, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.baseGradient}
      />
      <View style={styles.noiseWash} />
      {shouldUseScrollView ? (
        <>
          <ScrollView
            nativeID={scrollNativeId}
            style={styles.scrollView}
            contentContainerStyle={[styles.content, contentStyle]}
            showsVerticalScrollIndicator={false}
            onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
            onContentSizeChange={(_, height) => setContentHeight(height)}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {children}
          </ScrollView>
          {scrollbarVisible ? (
            <View pointerEvents="none" style={styles.scrollbarTrack}>
              <View style={[styles.scrollbarThumb, { height: thumbHeight, transform: [{ translateY: thumbTop }] }]} />
            </View>
          ) : null}
        </>
      ) : (
        <View style={[styles.content, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background,
    position: "relative",
  },
  baseGradient: {
    position: "absolute",
    inset: 0,
  },
  noiseWash: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === "web"
      ? ({
          overflowY: "scroll",
          scrollbarWidth: "none",
        } as ViewStyle)
      : null),
  },
  scrollbarTrack: {
    position: "absolute",
    top: 20,
    right: 8,
    bottom: 20,
    width: 14,
    borderRadius: 999,
    backgroundColor: colors.scrollbarTrack,
  },
  scrollbarThumb: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: colors.scrollbarThumb,
  },
});
