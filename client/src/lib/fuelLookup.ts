/**
 * Fuel availability lookup — derived from ERSA aerodrome notes.
 * Returns fuel types available at an ICAO aerodrome.
 */
import { ERSA_AERODROMES } from "@/data/ersa-airports";

export type FuelStatus = {
  jetA1: boolean;
  avgas: boolean;
  noFuel: boolean;
  note: string;
  hours?: string; // "24hr" | "business hours" | "by arrangement" | undefined
};

// Parse fuel availability from nswaaNote text
function parseFuel(note: string | undefined): FuelStatus {
  if (!note) return { jetA1: false, avgas: false, noFuel: true, note: "No fuel data" };
  const n = note.toLowerCase();
  const noFuel = /no fuel available|fuel.*not available|fuel.*unavail/i.test(note);
  if (noFuel) return { jetA1: false, avgas: false, noFuel: true, note: "No fuel on site" };

  const jetA1 = /jet[\s-]?a1?/i.test(note);
  const avgas  = /avgas/i.test(note);
  const hours24 = /24.?hr|24.?hour/i.test(note);
  const bizHrs  = /business hours/i.test(note);
  const byArrangement = /prior arrangement|by arrangement/i.test(note);

  const hours = hours24 ? "24hr" : bizHrs ? "Business hrs" : byArrangement ? "By arrangement" : undefined;
  const fuels: string[] = [];
  if (jetA1) fuels.push("Jet-A1");
  if (avgas) fuels.push("AVGAS");
  const fuelStr = fuels.length ? fuels.join(" & ") : "Fuel";

  return {
    jetA1,
    avgas,
    noFuel: !jetA1 && !avgas,
    note: fuels.length ? `${fuelStr} available${hours ? ` · ${hours}` : ""}` : "Fuel details in ERSA",
    hours,
  };
}

const _fuelMap = new Map<string, FuelStatus>();
for (const ad of ERSA_AERODROMES) {
  _fuelMap.set(ad.icao, parseFuel(ad.nswaaNote));
}

export function getFuelStatus(icao: string): FuelStatus | null {
  return _fuelMap.get(icao) ?? null;
}

/** Return a short AI-prompt-friendly string for fuel at an airport */
export function fuelSummaryForAI(icao: string, name: string): string {
  const f = getFuelStatus(icao);
  if (!f) return `${icao} (${name}): fuel data not in ERSA database`;
  if (f.noFuel) return `${icao} (${name}): NO FUEL available on site`;
  const types: string[] = [];
  if (f.jetA1) types.push("Jet-A1");
  if (f.avgas) types.push("AVGAS");
  return `${icao} (${name}): ${types.join(" & ")} available${f.hours ? ` (${f.hours})` : ""}`;
}
