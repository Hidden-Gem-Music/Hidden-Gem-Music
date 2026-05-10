import { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

type Props = {
  size?: "small" | "medium";
  tooltip?: string;
};

const createPortal = Platform.OS === "web" ? (require("react-dom") as any).createPortal : null;

export function ExplicitIndicator({ size = "medium", tooltip = "Explicit content" }: Props) {
  const wrapRef = useRef<View | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ left: number; top: number } | null>(null);

  const openTooltip = () => {
    if (Platform.OS !== "web") {
      return;
    }

    const rect = (wrapRef.current as any)?.getBoundingClientRect?.();
    if (rect) {
      const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
      const preferredLeft = rect.left + rect.width / 2;
      const clampedLeft =
        viewportWidth > 0 ? Math.min(Math.max(preferredLeft, 28), viewportWidth - 28) : preferredLeft;
      setTooltipPosition({
        left: clampedLeft,
        top: rect.bottom + 8,
      });
    }
    setShowTooltip(true);
  };

  const closeTooltip = () => {
    if (Platform.OS !== "web") {
      return;
    }

    setShowTooltip(false);
  };

  return (
    <View ref={wrapRef} style={styles.wrap} pointerEvents="box-none">
      <Pressable
        accessibilityLabel={tooltip}
        onHoverIn={Platform.OS === "web" ? openTooltip : undefined}
        onHoverOut={Platform.OS === "web" ? closeTooltip : undefined}
        style={[styles.badge, size === "small" ? styles.badgeSmall : null]}
      >
        <Text style={[styles.label, size === "small" ? styles.labelSmall : null]}>E</Text>
      </Pressable>
      {Platform.OS === "web" && createPortal && showTooltip && tooltipPosition && typeof document !== "undefined"
        ? createPortal(
            <div
              style={{
                position: "fixed",
                left: `${tooltipPosition.left}px`,
                top: `${tooltipPosition.top}px`,
                transform: "translate(-50%, 0%)",
                minWidth: "0px",
                maxWidth: "min(calc(100vw - 24px), 320px)",
                margin: 0,
                padding: "6px 9px",
                borderRadius: "10px",
                border: `2px solid ${colors.border}`,
                background: colors.backgroundRaised,
                color: colors.textLight,
                fontFamily: typefaces.body,
                fontSize: "11px",
                lineHeight: "14px",
                textAlign: "left",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                zIndex: 2147483647,
                boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.34)",
              }}
            >
              {tooltip}
            </div>,
            document.body
          )
        : null}
    </View>
  );
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
