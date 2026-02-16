// app/api/holidays/route.ts
import { NextResponse } from "next/server";

// We’ll use Nager.Date (public holidays API)
const NAGER_BASE = "https://date.nager.at/api/v3/PublicHolidays";

type NagerHoliday = {
  date: string; // "2025-01-01"
  localName: string; // e.g., "New Year's Day"
  name: string; // localized/English
  countryCode: string; // "JP"
  fixed: boolean;
  global: boolean;
  counties?: string[] | null;
  launchYear?: number | null;
  types: string[];
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country")?.toUpperCase();
    const yearStr = searchParams.get("year");

    if (!country || !yearStr) {
      return NextResponse.json(
        { error: "Missing 'country' or 'year' query param" },
        { status: 400 },
      );
    }

    const year = Number(yearStr);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return NextResponse.json(
        { error: "Invalid 'year' value" },
        { status: 400 },
      );
    }

    const url = `${NAGER_BASE}/${year}/${country}`;
    const res = await fetch(url, { next: { revalidate: 60 * 60 } }); // cache 1h
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error ${res.status}` },
        { status: res.status },
      );
    }

    const data: NagerHoliday[] = await res.json();

    // Normalize a minimal payload to keep it simple on the client
    const holidays = data.map((h) => ({
      date: h.date, // "YYYY-MM-DD"
      name: h.localName || h.name,
      country: h.countryCode,
    }));

    return NextResponse.json({ holidays });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
