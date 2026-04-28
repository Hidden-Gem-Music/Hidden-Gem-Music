import { LinearGradient } from "expo-linear-gradient";
import {  ScrollView, StyleSheet, Text, View } from "react-native";
import { ReactNode } from "react";
import { DiscoveryBlurb } from "../components/DiscoveryBlurb";
import { GemIcon } from "../components/GemIcon";
import { Panel } from "../components/Panel";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";
 
const creditSections = [
  "Leena Komenski - Insert Role, Role.",
  "mp3li - Insert role, insert role",
  "Landin Mohr - Role",
] as const;
 
const memberLinkSections = ["Leena Komenski", "mp3li", "Landin Mohr"] as const;
 
function CreditsSurface({
  children,
  fillVariant = "comparisonBlue",
}: {
  children: ReactNode;
  fillVariant?: "comparisonBlue" | "softBlue";
}) {
  return (
    <Panel style={styles.surfacePanel}>
      {fillVariant === "softBlue" ? (
        <LinearGradient
          colors={[colors.backgroundSoft, "#74819B", "#5D6983", colors.backgroundBottom]}
          locations={[0, 0.48, 0.82, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.surfaceFill}
        />
      ) : (
        <LinearGradient
          colors={[colors.backgroundSoft, "#74819B", "#70536A"]}
          locations={[0, 0.38, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.surfaceFill}
        />
      )}
      <View style={styles.surfaceContent}>{children}</View>
    </Panel>
  );
}
 
function CreditBulletList() {
  return (
    <View style={styles.bulletList}>
      {Array.from({ length: 10 }).map((_, index) => (
        <View key={index} style={styles.bulletRow}>
          <GemIcon size={14} />
          <Text style={styles.bulletText}>Insert name of thing this person did</Text>
        </View>
      ))}
    </View>
  );
}
 
export function CreditsScreen() {
  return (
    <ScreenScaffold>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DiscoveryBlurb
          heading="Hidden Gem Music Credits"
          body="This is the text inside the blurb that will say things about the page you're on and will guide users through the experience."
        />
 
        {/* Credit cards — one per team member */}
        <CreditsSurface fillVariant="comparisonBlue">
          <View style={styles.creditCardsColumn}>
            {creditSections.map((title) => (
              <View key={title} style={styles.creditCard}>
                <View style={styles.creditCardTitleWrap}>
                  <Text style={styles.creditCardTitle}>{title}</Text>
                  <View style={styles.creditCardUnderline} />
                </View>
                <Text style={styles.creditBodyCopy}>
                  Here is a short info section of all yadayada done by this team member:
                </Text>
                <CreditBulletList />
              </View>
            ))}
          </View>
        </CreditsSurface>
 
        {/* Member links — stacked vertically on mobile */}
        <CreditsSurface fillVariant="softBlue">
          <View style={styles.memberLinksColumn}>
            {memberLinkSections.map((name) => (
              <View key={name} style={styles.memberLinkCard}>
                <View style={styles.memberLinkTitleWrap}>
                  <Text style={styles.memberLinkHeader}>{name}</Text>
                  <View style={styles.memberLinkUnderline} />
                </View>
                <Text style={styles.memberLinkBody}>
                  This area is for links to more of this team member's work and socials.
                </Text>
              </View>
            ))}
          </View>
        </CreditsSurface>
      </ScrollView>
    </ScreenScaffold>
  );
}
 
const styles = StyleSheet.create({
  scrollContent: {
    gap: 20,
    paddingBottom: 32,
  },
  surfacePanel: {
    backgroundColor: "transparent",
    padding: 0,
    overflow: "hidden",
  },
  surfaceFill: {
    ...StyleSheet.absoluteFillObject,
  },
  surfaceContent: {
    padding: 18,
    gap: 16,
  },
  creditCardsColumn: {
    gap: 16,
  },
  creditCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.12)",
    padding: 16,
    gap: 12,
  },
  creditCardTitleWrap: {
    gap: 4,
    alignSelf: "flex-start",
  },
  creditCardTitle: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  creditCardUnderline: {
    width: "100%",
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.accent,
    opacity: 0.92,
  },
  creditBodyCopy: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 22,
  },
  bulletList: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bulletText: {
    flex: 1,
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
  },
  // Mobile: stack member cards vertically instead of side-by-side row
  memberLinksColumn: {
    gap: 14,
  },
  memberLinkCard: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "rgba(22,26,38,0.12)",
    padding: 16,
    gap: 10,
  },
  memberLinkTitleWrap: {
    gap: 4,
    alignSelf: "flex-start",
  },
  memberLinkHeader: {
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  memberLinkUnderline: {
    width: "100%",
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.accent,
    opacity: 0.92,
  },
  memberLinkBody: {
    color: colors.border,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
  },
}); 