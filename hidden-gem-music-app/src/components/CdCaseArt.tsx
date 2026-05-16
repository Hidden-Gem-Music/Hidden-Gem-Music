import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

import { colors } from "../theme/colors";

const cdCaseSource = require("../assets/images/CD-Case-Transparent-Image.png");

const ART_LEFT_RATIO = 64 / 680;
const ART_TOP_RATIO = 32 / 680;
const ART_SIZE_RATIO = 608 / 680;

type Props = {
  size: number;
  placeholderColor?: string;
  artImageUrl?: string;
  loading?: boolean;
  withArtBackdrop?: boolean;
};

export function CdCaseArt({
  size,
  placeholderColor,
  artImageUrl,
  loading = false,
  withArtBackdrop = true,
}: Props) {
  const hasArtImage = typeof artImageUrl === "string" && artImageUrl.trim().length > 0;
  const [artLoaded, setArtLoaded] = useState(false);
  const artSize = Math.round(size * ART_SIZE_RATIO);
  const left = Math.round(size * ART_LEFT_RATIO);
  const top = Math.round(size * ART_TOP_RATIO);
  const spinnerSize = Math.max(18, Math.round(size * 0.14));
  const showLoadingOverlay = loading || (hasArtImage && !artLoaded);

  useEffect(() => {
    setArtLoaded(false);
  }, [artImageUrl]);

  return (
    <View style={[styles.cdCaseFrame, { width: size, height: size }]}>
      {withArtBackdrop ? (
        <View
          style={[
            styles.cdCaseBackdrop,
            {
              left,
              top,
              width: artSize,
              height: artSize,
              backgroundColor: placeholderColor ?? "rgb(108,119,142)",
            },
          ]}
        >
          {hasArtImage ? (
            <Image
              source={{ uri: artImageUrl }}
              style={[styles.cdCaseBackdropImage, !artLoaded ? styles.cdCaseBackdropImageLoading : null]}
              resizeMode="cover"
              onLoad={() => setArtLoaded(true)}
              onError={() => setArtLoaded(true)}
            />
          ) : null}
          {showLoadingOverlay ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size={spinnerSize} color={colors.textLight} />
            </View>
          ) : null}
        </View>
      ) : null}
      <Image source={cdCaseSource} style={[styles.cdCaseImage, { width: size, height: size }]} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  cdCaseFrame: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },
  cdCaseBackdrop: {
    position: "absolute",
    borderRadius: 0,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  cdCaseBackdropImage: {
    width: "100%",
    height: "100%",
  },
  cdCaseBackdropImageLoading: {
    opacity: 0.28,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,16,21,0.16)",
  },
  cdCaseImage: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
});
