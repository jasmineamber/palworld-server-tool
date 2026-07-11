import itemCatalogJson from "@/assets/items.json";
import palNamesJson from "@/assets/pal.json";
import skillCatalogJson from "@/assets/skill.json";
import type { Locale } from "@/types/api";

interface ItemMetadata {
  id: string;
  name: string;
  description: string;
  key: string;
}

interface SkillMetadata {
  name: string;
  desc: string;
}

const palNames = palNamesJson as Record<Locale, Record<string, string>>;
const itemCatalog = itemCatalogJson as Record<Locale, ItemMetadata[]>;
const skillCatalog = skillCatalogJson as Record<
  Locale,
  Record<string, SkillMetadata>
>;

const palImages = import.meta.glob<string>("../assets/pals/*.{png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});
const itemImages = import.meta.glob<string>("../assets/items/*.{png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

function createImageIndex(images: Record<string, string>) {
  return new Map(
    Object.entries(images).map(([path, url]) => {
      const filename = path.split("/").pop() ?? path;
      return [filename.replace(/\.(png|webp)$/i, "").toLowerCase(), url];
    }),
  );
}

const palImageIndex = createImageIndex(palImages);
const itemImageIndex = createImageIndex(itemImages);
const lowerPalNames = Object.fromEntries(
  (Object.keys(palNames) as Locale[]).map((locale) => [
    locale,
    new Map(
      Object.entries(palNames[locale]).map(([key, value]) => [
        key.toLowerCase(),
        value,
      ]),
    ),
  ]),
) as Record<Locale, Map<string, string>>;
const itemIndexes = Object.fromEntries(
  (Object.keys(itemCatalog) as Locale[]).map((locale) => [
    locale,
    new Map(itemCatalog[locale].map((item) => [item.id, item])),
  ]),
) as Record<Locale, Map<string, ItemMetadata>>;

export function getPalName(type: string, locale: Locale) {
  return lowerPalNames[locale].get(type.toLowerCase()) ?? type;
}

export function getPalImage(type: string, isBoss = false) {
  return (
    palImageIndex.get(type.toLowerCase()) ??
    palImageIndex.get(isBoss ? "boss_unknown" : "unknown") ??
    ""
  );
}

export function getItemMetadata(id: string, locale: Locale): ItemMetadata {
  return (
    itemIndexes[locale].get(id) ?? {
      id,
      name: id,
      description: "",
      key: id,
    }
  );
}

export function getItemImage(id: string) {
  return itemImageIndex.get(id.toLowerCase()) ?? "";
}

export function getSkillMetadata(id: string, locale: Locale) {
  return skillCatalog[locale]?.[id] ?? { name: id, desc: "" };
}

export function getPalOptions(locale: Locale) {
  return Object.entries(palNames[locale])
    .filter(([id]) => {
      const normalized = id.toLowerCase();
      return !normalized.startsWith("boss_") && !normalized.startsWith("gym_");
    })
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getItemOptions(locale: Locale) {
  return itemCatalog[locale]
    .map((item) => ({ id: item.id, name: item.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
