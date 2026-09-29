export type TripDay = {
  day: number;
  title: string;
  detail: string;
};

export type TripPlan = {
  city: string;
  days: number;
  stops: TripDay[];
};

const CATALOG: Record<string, { title: string; detail: string }[]> = {
  lisbon: [
    { title: "Alfama on foot", detail: "Start at a miradouro, walk downhill, and stop for one long lunch." },
    { title: "Belém", detail: "Jerónimos and the waterfront. Skip the pastel line if it is longer than twenty minutes." },
    { title: "A lighter day", detail: "LX Factory, or the train to Cascais. Keep the evening open." },
  ],
  lagos: [
    { title: "One neighborhood", detail: "Stay around where you sleep. A market and one long meal is the day." },
    { title: "Museum or beach", detail: "Pick one: the national museum, or a morning at the beach nearest your stay." },
    { title: "Keep it short", detail: "Repeat a place you liked. Do not cross the city for a third district." },
  ],
  london: [
    { title: "One bank of the river", detail: "South Bank or the parks north of it. Do not do both." },
    { title: "A museum morning", detail: "British Museum or Tate Modern, then a neighborhood you have not seen." },
    { title: "Leave room", detail: "A market, a walk, and an early evening. The city is the plan." },
  ],
  paris: [
    { title: "One arrondissement", detail: "Walk the Marais or the islands. Sit down once. Do not chase monuments." },
    { title: "A museum, then out", detail: "Louvre or Musée d'Orsay in the morning. The afternoon is a café and a park." },
    { title: "The edge of the city", detail: "Canal Saint-Martin or a cemetery walk. Keep the night unplanned." },
  ],
  tokyo: [
    { title: "One ward", detail: "Asakusa or Shimokitazawa, not both. Eat where you are walking." },
    { title: "A garden and a train", detail: "One garden in the morning, then a single rail hop to a second neighborhood." },
    { title: "Slow day", detail: "A department-store basement for food, then back to the first neighborhood." },
  ],
  "new york": [
    { title: "Downtown on foot", detail: "One neighborhood below 14th Street. A museum only if it is already on the way." },
    { title: "A park and a borough", detail: "Central Park for an hour, or the subway to one place in Brooklyn. Not both." },
    { title: "Repeat the best block", detail: "Go back to the street you liked. Leave before you are tired of it." },
  ],
};

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function genericDays(city: string) {
  return [
    { title: "Arrive and walk", detail: `Stay near where you sleep in ${city}. One square or market is enough.` },
    { title: "One main sight", detail: `Pick a single landmark in ${city} and leave the afternoon free.` },
    { title: "Buffer", detail: "Repeat what you liked, or leave. Do not add another district." },
  ];
}

export function planFromPrompt(text: string): TripPlan | null {
  const clean = text.replace(/\s+/g, " ").trim();
  const daysIn = clean.match(/(\d+)\s+days?\s+in\s+([a-z][a-z .'-]{1,40})/i);
  const tripTo = clean.match(/\bplan\s+(?:a\s+)?(?:trip|visit)\s+to\s+([a-z][a-z .'-]{1,40})/i);
  let days = 3;
  let rawCity = "";
  if (daysIn?.[1] && daysIn[2]) {
    days = Number(daysIn[1]);
    rawCity = daysIn[2];
  } else if (tripTo?.[1]) {
    rawCity = tripTo[1];
  } else {
    return null;
  }
  const city = titleCase(rawCity.replace(/[?.!].*$/, "").trim());
  if (!city || !Number.isFinite(days)) return null;
  const count = Math.min(7, Math.max(1, Math.trunc(days)));
  const source = CATALOG[city.toLowerCase()] ?? genericDays(city);
  const stops = Array.from({ length: count }, (_, index) => {
    const item = source[index % source.length] ?? source[0];
    return { day: index + 1, title: item?.title ?? "Open day", detail: item?.detail ?? "" };
  });
  return { city, days: count, stops };
}
