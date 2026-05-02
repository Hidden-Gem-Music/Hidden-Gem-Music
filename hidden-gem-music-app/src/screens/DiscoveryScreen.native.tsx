import { useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { Country } from "../types/content";
import { DiscoveryBlurb } from "../components/DiscoveryBlurb";
import { DiscoverySidebarPanels } from "../components/Discoverysidebarpanels.native";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { availableYears } from "../data/mockData";
import { colors } from "../theme/colors";
import { typefaces } from "../theme/typography";

export type Props = {
  countries: Country[];
  selectedCountryId: string;
  onSelectCountry: (countryId: string) => void;
  onOpenCountry: (countryId: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
};

// ── Year Dropdown (same pattern as other screens) ─────────────────────────────
function YearDropdown({
  year,
  onSelectYear,
}: {
  year: number;
  onSelectYear: (y: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<View>(null);
  const [triggerLayout, setTriggerLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const handleOpen = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height });
      setOpen(true);
    });
  };

  return (
    <View style={dropdownStyles.wrap}>
      <Text style={dropdownStyles.label}>Year Selection</Text>
      <Pressable ref={triggerRef} onPress={handleOpen} style={dropdownStyles.trigger}>
        <Text style={dropdownStyles.triggerText}>{year}</Text>
        <Text style={dropdownStyles.caret}>▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={dropdownStyles.backdrop} />
        </TouchableWithoutFeedback>

        {triggerLayout && (
          <View
            style={[
              dropdownStyles.menu,
              {
                top: triggerLayout.y + triggerLayout.height + 6,
                left: triggerLayout.x,
                width: Math.max(triggerLayout.width, 120),
              },
            ]}
          >
            <ScrollView
              style={dropdownStyles.menuScroll}
              showsVerticalScrollIndicator={false}
            >
              {availableYears.map((y) => (
                <Pressable
                  key={y}
                  onPress={() => {
                    onSelectYear(y);
                    setOpen(false);
                  }}
                  style={[
                    dropdownStyles.menuItem,
                    y === year ? dropdownStyles.menuItemActive : null,
                  ]}
                >
                  <Text
                    style={[
                      dropdownStyles.menuItemText,
                      y === year ? dropdownStyles.menuItemTextActive : null,
                    ]}
                  >
                    {y}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const dropdownStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 20,
    lineHeight: 24,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.button,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 100,
  },
  triggerText: {
    flex: 1,
    color: colors.border,
    fontFamily: typefaces.display,
    fontSize: 18,
    lineHeight: 22,
  },
  caret: {
    color: colors.border,
    fontSize: 14,
    lineHeight: 18,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22,26,38,0.48)",
  },
  menu: {
    position: "absolute",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    overflow: "hidden",
    maxHeight: 260,
    zIndex: 100,
    shadowColor: colors.shadow,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  menuScroll: {
    flexGrow: 0,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(169,176,209,0.12)",
  },
  menuItemActive: {
    backgroundColor: "rgba(117,82,107,0.22)",
  },
  menuItemText: {
    color: colors.textStrong,
    fontFamily: typefaces.display,
    fontSize: 17,
    lineHeight: 20,
  },
  menuItemTextActive: {
    color: colors.accent,
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export function DiscoveryScreen({
  countries,
  selectedCountryId,
  onSelectCountry,
  onOpenCountry,
  selectedYear,
  onChangeYear,
}: Props) {
  const [listAutoScrollSignal, setListAutoScrollSignal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangeYear = (year: number) => {
    setIsLoading(true);
    onChangeYear(year);
    setTimeout(() => setIsLoading(false), 600);
  };

  return (
    <ScreenScaffold>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DiscoveryBlurb />

        {/* Year dropdown replaces YearSlider */}
        <YearDropdown year={selectedYear} onSelectYear={handleChangeYear} />

        <DiscoverySidebarPanels
          countries={countries}
          selectedCountryId={selectedCountryId}
          onSelectCountry={(id) => {
            onSelectCountry(id);
            setListAutoScrollSignal((s) => s + 1);
          }}
          onOpenCountry={onOpenCountry}
          autoScrollSignal={listAutoScrollSignal}
        />
      </ScrollView>

      <LoadingOverlay visible={isLoading} />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
    paddingBottom: 32,
  },
});