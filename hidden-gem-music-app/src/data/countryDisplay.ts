import type { Country } from "../types/content";

export function normalizeCountryDisplayName(value: string) {
  return value
    .replace(/\|/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCountryWithAppData(country: Pick<Country, "code" | "name" | "hiddenSongs" | "hasSongData">) {
  const normalizedCode = country.code.trim().toUpperCase();
  const normalizedName = country.name.trim().toLowerCase();
  return normalizedCode !== "GLOBAL" && normalizedName !== "global" && country.hasSongData !== false && country.hiddenSongs > 0;
}
