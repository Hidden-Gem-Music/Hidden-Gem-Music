import type { Country } from "../types/content";

export function normalizeCountryDisplayName(value: string) {
  return value
    .replace(/\|/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function isVisibleCountry(country: Pick<Country, "code" | "name">) {
  const normalizedCode = country.code.trim().toUpperCase();
  const normalizedName = country.name.trim().toLowerCase();
  return normalizedCode !== "GLOBAL" && normalizedName !== "global";
}

export function isCountryWithAppData(country: Pick<Country, "code" | "name" | "hasSongData">) {
  return isVisibleCountry(country) && country.hasSongData !== false;
}

export function isCountryWithHiddenGems(country: Pick<Country, "code" | "name" | "hiddenSongs" | "hasSongData">) {
  return isCountryWithAppData(country) && country.hiddenSongs > 0;
}
