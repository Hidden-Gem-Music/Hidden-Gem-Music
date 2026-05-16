import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { feature } = require("../hidden-gem-music-app/node_modules/topojson-client");
const { geoEquirectangular, geoPath } = require("../hidden-gem-music-app/node_modules/d3-geo");
const atlas = require("../hidden-gem-music-app/node_modules/world-atlas/countries-50m.json");
const worldCountries = require("../hidden-gem-music-app/node_modules/world-countries");

const OUTPUT_PATH = path.resolve(
  import.meta.dirname,
  "../hidden-gem-music-app/src/assets/maps/worldMap50m.ts"
);

function normalizeContinent(meta) {
  if (!meta) {
    return "Other";
  }

  if (meta.region === "Americas") {
    return meta.subregion === "South America" ? "South America" : "North America";
  }

  if (meta.region === "Antarctic") {
    return "Antarctica";
  }

  return meta.region || "Other";
}

const metadataByNumericId = new Map(
  worldCountries
    .filter((country) => typeof country.ccn3 === "string" && country.ccn3.length > 0)
    .map((country) => [country.ccn3, country])
);

const geoJson = feature(atlas, atlas.objects.countries);
const projection = geoEquirectangular().fitExtent(
  [
    [24, 44],
    [376, 356],
  ],
  geoJson
);
const pathBuilder = geoPath(projection);

const countries = geoJson.features
  .map((countryFeature) => {
    const meta = metadataByNumericId.get(String(countryFeature.id).padStart(3, "0")) ?? null;
    const commonName = meta?.name?.common ?? countryFeature.properties?.name ?? `Country ${countryFeature.id}`;
    const continent = normalizeContinent(meta);
    const lat = Array.isArray(meta?.latlng) && meta.latlng.length >= 2 ? meta.latlng[0] : null;
    const long = Array.isArray(meta?.latlng) && meta.latlng.length >= 2 ? meta.latlng[1] : null;
    const pathValue = pathBuilder(countryFeature);

    if (!pathValue) {
      return null;
    }

    return {
      id: String(countryFeature.id),
      code: meta?.cca2 ?? null,
      name: commonName,
      continent,
      path: pathValue,
      lat,
      long,
    };
  })
  .filter(Boolean)
  .sort((left, right) => left.name.localeCompare(right.name));

const continentNames = ["North America", "South America", "Europe", "Africa", "Asia", "Oceania", "Antarctica"];
const continentOutlines = continentNames
  .map((continentName) => {
    const matchingFeatures = geoJson.features.filter((countryFeature) => {
      const meta = metadataByNumericId.get(String(countryFeature.id).padStart(3, "0")) ?? null;
      return normalizeContinent(meta) === continentName;
    });

    const pathValue = pathBuilder({
      type: "FeatureCollection",
      features: matchingFeatures,
    });

    if (!pathValue) {
      return null;
    }

    return {
      id: continentName,
      path: pathValue,
    };
  })
  .filter(Boolean);

const scale = projection.scale();
const [translateX, translateY] = projection.translate();

const fileContents = `export type WorldMapCountryPath = {
  id: string;
  code: string | null;
  name: string;
  continent: string;
  path: string;
  lat: number | null;
  long: number | null;
};

export type WorldMapContinentOutline = {
  id: string;
  path: string;
};

export type WorldMapProjection = {
  width: number;
  height: number;
  scale: number;
  translateX: number;
  translateY: number;
};

export const worldMapProjection: WorldMapProjection = ${JSON.stringify(
  {
    width: 400,
    height: 400,
    scale,
    translateX,
    translateY,
  },
  null,
  2
)};

export const worldMapCountries: WorldMapCountryPath[] = ${JSON.stringify(countries, null, 2)};

export const worldMapContinentOutlines: WorldMapContinentOutline[] = ${JSON.stringify(continentOutlines, null, 2)};
`;

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, fileContents);

console.log(`Wrote ${OUTPUT_PATH}`);
