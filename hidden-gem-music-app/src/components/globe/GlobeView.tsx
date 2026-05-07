import { Country } from "../../types/content";
import { GlobeView as WebGlobeView } from "./GlobeView.web";

type Props = {
  countries: Country[];
  activeCountry?: Country;
  selectedYear?: number;
  onSelectCountry: (countryId: string) => void;
  onOpenCountry?: (countryId: string) => void;
  selectOnHover?: boolean;
};

export function GlobeView(props: Props) {
  return <WebGlobeView {...props} />;
}
