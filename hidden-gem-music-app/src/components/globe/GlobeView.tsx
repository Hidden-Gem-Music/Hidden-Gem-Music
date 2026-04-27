import { Platform } from "react-native";

import { Country } from "../../types/content";
import { GlobeView as NativeGlobeView } from "./GlobeView.native";
import { GlobeView as WebGlobeView } from "./GlobeView.web";

type Props = {
  countries: Country[];
  activeCountry?: Country;
  onSelectCountry: (countryId: string) => void;
  onOpenCountry?: (countryId: string) => void;
  selectOnHover?: boolean;
};

export function GlobeView(props: Props) {
  return Platform.OS === "web" ? <WebGlobeView {...props} /> : <NativeGlobeView {...props} />;
}
