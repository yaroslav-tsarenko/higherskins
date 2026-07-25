// Fetches the CS2 item catalog from the public bymykel/CSGO-API dataset.
// This runs server-side only. The frontend never calls this.

export interface SourceSkin {
  id: string;
  name: string;
  description?: string;
  weapon?: { id: string; name: string };
  category?: { id: string; name: string };
  pattern?: { id: string; name: string };
  min_float?: number;
  max_float?: number;
  rarity?: { id: string; name: string; color: string };
  stattrak?: boolean;
  souvenir?: boolean;
  paint_index?: string;
  wears?: { id: string; name: string }[];
  collections?: { id: string; name: string; image?: string }[];
  image?: string;
}

const SOURCE_URL =
  process.env.SKINS_SOURCE_URL ||
  "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json";

export async function fetchSourceSkins(): Promise<SourceSkin[]> {
  const res = await fetch(SOURCE_URL, {
    headers: { accept: "application/json" },
    // Server-to-server; do not cache the multi-MB payload in the data cache.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Skins source responded ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as SourceSkin[];
  if (!Array.isArray(data)) {
    throw new Error("Skins source did not return an array");
  }
  return data;
}
