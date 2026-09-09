import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_PROVINCES } from "@/lib/utils/wilayah";

// Cache in memory to reduce remote round trips
const cacheMap = new Map<string, any>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  const cacheKey = `${type}-${id || ""}`;
  if (cacheMap.has(cacheKey)) {
    return NextResponse.json(cacheMap.get(cacheKey));
  }

  try {
    let url = "";
    if (type === "provinces") {
      url = "https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json";
    } else if (type === "regencies" && id) {
      url = `https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${id}.json`;
    } else if (type === "districts" && id) {
      url = `https://emsifa.github.io/api-wilayah-indonesia/api/districts/${id}.json`;
    } else if (type === "villages" && id) {
      url = `https://emsifa.github.io/api-wilayah-indonesia/api/villages/${id}.json`;
    } else {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      if (type === "provinces") return NextResponse.json(DEFAULT_PROVINCES);
      return NextResponse.json([]);
    }

    const data = await res.json();
    cacheMap.set(cacheKey, data);
    return NextResponse.json(data);
  } catch (error) {
    console.warn("[Wilayah API] Fetch fallback used:", error);
    if (type === "provinces") {
      return NextResponse.json(DEFAULT_PROVINCES);
    }
    return NextResponse.json([]);
  }
}
