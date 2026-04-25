import { Children, ReactNode, useEffect, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";
import { Panel } from "./Panel";
import { SecondarySurfaceFill } from "./SecondarySurfaceFill";

type Props = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  itemIds?: string[];
  selectedItemId?: string;
  subtitleRight?: boolean;
  autoScrollSignal?: number;
  showHeader?: boolean;
};

export function ListViewPanel({
  title = "List View",
  subtitle,
  children,
  itemIds,
  selectedItemId,
  subtitleRight = false,
  autoScrollSignal,
  showHeader = true,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const trackRef = useRef<View>(null);
  const positionsRef = useRef<Record<string, number>>({});
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false);

  useEffect(() => {
    if (!selectedItemId || autoScrollSignal == null) {
      return;
    }

    const y = positionsRef.current[selectedItemId];
    if (typeof y === "number") {
      scrollRef.current?.scrollTo({ y: Math.max(y - 18, 0), animated: true });
    }
  }, [autoScrollSignal]);

  const childArray = Children.toArray(children);
  const scrollbarVisible = Platform.OS === "web" && viewportHeight > 0 && contentHeight > viewportHeight;
  const thumbHeight = scrollbarVisible ? Math.max((viewportHeight / contentHeight) * viewportHeight, 52) : 0;
  const thumbTop =
    scrollbarVisible && contentHeight > viewportHeight
      ? (scrollY / (contentHeight - viewportHeight)) * (viewportHeight - thumbHeight)
      : 0;
  const trackHeight = Math.max(viewportHeight - 24, 1);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(event.nativeEvent.contentOffset.y);
  };

  const scrollToTrackLocation = (locationY: number) => {
    if (!scrollbarVisible || contentHeight <= viewportHeight) {
      return;
    }

    const nextThumbTop = Math.min(Math.max(locationY - thumbHeight / 2, 0), trackHeight - thumbHeight);
    const nextRatio = nextThumbTop / (trackHeight - thumbHeight);
    const nextScrollY = nextRatio * (contentHeight - viewportHeight);
    scrollRef.current?.scrollTo({ y: nextScrollY, animated: false });
    setScrollY(nextScrollY);
  };

  const scrollToClientY = (clientY: number) => {
    const rect = (trackRef.current as any)?.getBoundingClientRect?.();
    if (!rect) {
      return;
    }

    scrollToTrackLocation(clientY - rect.top);
  };

  useEffect(() => {
    if (Platform.OS !== "web" || !isDraggingScrollbar || typeof document === "undefined") {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;

    const handleMove = (event: MouseEvent) => {
      event.preventDefault();
      scrollToClientY(event.clientY);
    };

    const handleUp = () => {
      setIsDraggingScrollbar(false);
    };

    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [isDraggingScrollbar, scrollbarVisible, thumbHeight, trackHeight, contentHeight, viewportHeight]);

  return (
    <View style={styles.wrapper}>
      {showHeader ? (
        <View style={styles.headerRow}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, subtitleRight ? styles.subtitleRight : null]}>{subtitle}</Text> : null}
        </View>
      ) : null}
      <Panel style={[styles.frame, !showHeader ? styles.frameHeaderHidden : null]}>
        <SecondarySurfaceFill />
        <ScrollView
          ref={scrollRef}
          nativeID="list-view-scroll"
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
          onContentSizeChange={(_, height) => setContentHeight(height)}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {childArray.map((child, index) => {
            const itemId = itemIds?.[index];
            const handleLayout =
              itemId == null
                ? undefined
                : (event: LayoutChangeEvent) => {
                    positionsRef.current[itemId] = event.nativeEvent.layout.y;
                  };

            return (
              <View key={itemId ?? index} onLayout={handleLayout}>
                {child}
              </View>
            );
          })}
        </ScrollView>
        {scrollbarVisible ? (
          <View
            ref={trackRef}
            style={styles.scrollbarTrack}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(event) => scrollToTrackLocation(event.nativeEvent.locationY)}
            onResponderMove={(event) => scrollToTrackLocation(event.nativeEvent.locationY)}
            {...(Platform.OS === "web"
              ? ({
                  onMouseDown: (event: any) => {
                    event.preventDefault();
                    setIsDraggingScrollbar(true);
                    scrollToClientY(event.clientY);
                  },
                } as any)
              : {})}
          >
            <View style={[styles.scrollbarThumb, { height: thumbHeight, transform: [{ translateY: thumbTop }] }]} />
          </View>
        ) : null}
      </Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    minHeight: 58,
    gap: 14,
    flexWrap: "wrap",
  },
  title: {
    color: colors.textStrong,
    fontFamily: typefaces.condensed,
    fontSize: 24,
    fontWeight: "800",
    transform: [{ translateY: 14 }],
  },
  subtitle: {
    color: colors.text,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 22,
    transform: [{ translateY: 14 }],
  },
  subtitleRight: {
    textAlign: "right",
    maxWidth: 320,
    marginRight: 18,
  },
  frame: {
    marginTop: 8,
    minHeight: 642,
    maxHeight: 642,
    padding: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  frameHeaderHidden: {
    marginTop: 0,
  },
  scrollView: {
    ...(Platform.OS === "web"
      ? ({
          overflowY: "scroll",
          scrollbarWidth: "none",
        } as ViewStyle)
      : null),
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 28,
    paddingRight: 28,
    gap: 14,
  },
  scrollbarTrack: {
    position: "absolute",
    top: 12,
    right: 8,
    bottom: 12,
    width: 14,
    borderRadius: 999,
    backgroundColor: colors.scrollbarTrack,
    cursor: "pointer" as any,
  },
  scrollbarThumb: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: colors.scrollbarThumb,
  },
});
