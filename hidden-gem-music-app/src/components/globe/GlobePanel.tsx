import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Country } from "../../types/content";
import { colors } from "../../theme/colors";
import { typefaces } from "../../theme/typography";
import { GemIcon } from "../GemIcon";
import { Panel } from "../Panel";
import { SecondarySurfaceFill } from "../SecondarySurfaceFill";
import { GlobeView } from "./GlobeView";

type Props = {
  countries: Country[];
  activeCountryId?: string;
  onSelectCountry: (countryId: string) => void;
  onOpenCountry?: (countryId: string) => void;
  title: string;
  subtitle?: string;
  rightActionLabel?: string;
  onRightAction?: () => void;
  showHeader?: boolean;
  frameStyle?: StyleProp<ViewStyle>;
  selectOnHover?: boolean;
};

export function GlobePanel({
  countries,
  activeCountryId,
  onSelectCountry,
  onOpenCountry,
  title,
  subtitle,
  rightActionLabel = "All Filters",
  onRightAction,
  showHeader = true,
  frameStyle,
  selectOnHover = true,
}: Props) {
  const activeCountry = countries.find((country) => country.id === activeCountryId);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const showButtonGradient = isButtonHovered || isButtonPressed;

  return (
    <View style={styles.wrapper}>
      {showHeader ? (
        <View style={styles.headerRow}>
          {title ? <Text style={styles.title}>{title}</Text> : <View />}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : <View />}
        </View>
      ) : null}

      <Panel style={[styles.frame, frameStyle]}>
        <SecondarySurfaceFill />
        <GlobeView
          countries={countries}
          activeCountry={activeCountry}
          onSelectCountry={onSelectCountry}
          onOpenCountry={onOpenCountry}
          selectOnHover={selectOnHover}
        />
        {onRightAction ? (
          <Pressable
            onPress={onRightAction}
            onHoverIn={() => setIsButtonHovered(true)}
            onHoverOut={() => setIsButtonHovered(false)}
            onPressIn={() => setIsButtonPressed(true)}
            onPressOut={() => setIsButtonPressed(false)}
            style={styles.actionButtonShell}
          >
            {showButtonGradient ? (
              <LinearGradient
                colors={
                  isButtonPressed
                    ? [colors.navGradient, colors.backgroundRaised, colors.backgroundRaised]
                    : ["rgba(117,82,107,0.52)", "rgba(108,119,142,0.44)", "rgba(108,119,142,0.36)"]
                }
                locations={[0, 0.34, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.actionButtonGradient}
              />
            ) : null}
            <View style={[styles.actionButton, showButtonGradient ? styles.actionButtonActive : null]}>
              <View style={styles.actionButtonContent}>
                <GemIcon size={22} />
                <Text style={[styles.actionButtonText, showButtonGradient ? styles.actionButtonTextActive : null]}>
                  {rightActionLabel}
                </Text>
              </View>
            </View>
          </Pressable>
        ) : null}
      </Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
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
    textAlign: "right",
    maxWidth: 320,
    marginRight: 18,
    transform: [{ translateY: 14 }],
  },
  frame: {
    minHeight: 540,
    overflow: "hidden",
    padding: 0,
    backgroundColor: "transparent",
  },
  actionButtonShell: {
    position: "absolute",
    top: 14,
    right: 14,
    borderRadius: 14,
    overflow: "hidden",
    zIndex: 2,
  },
  actionButtonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  actionButton: {
    minHeight: 58,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    justifyContent: "center",
  },
  actionButtonActive: {
    backgroundColor: "transparent",
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  actionButtonText: {
    color: colors.border,
    fontFamily: typefaces.condensed,
    fontSize: 19,
    fontWeight: "600",
    lineHeight: 24,
    textAlign: "center",
  },
  actionButtonTextActive: {
    color: colors.text,
  },
});
