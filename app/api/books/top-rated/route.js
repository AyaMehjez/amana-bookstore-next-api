import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { logRequest } from "@/app/lib/logger";

/**
 * GET /api/books/top-rated
 * Returns top 10 books sorted by score = rating * reviewsCount
 */
export async function GET(request) {
  await logRequest(request);
  try {
    const filePath = path.join(process.cwd(), "app", "data", "books.json");
    const fileData = await fs.readFile(filePath, "utf-8");
    const { books = [] } = JSON.parse(fileData);

    // Normalize reviews count: if book has `reviews` array use its length, else try `reviewsCount` or 0
    const scored = books.map((b) => {
      const reviewsCount = Array.isArray(b.reviews)
        ? b.reviews.length
        : (b.reviewsCount || 0);
      const rating = typeof b.rating === "number" ? b.rating : Number(b.rating) || 0;
      return { ...b, score: rating * reviewsCount };
    });

    // Sort descending by score and take top 10
    const top10 = scored.sort((a, c) => c.score - a.score).slice(0, 10);

    return NextResponse.json({ top: top10 });
  } catch (error) {
    console.error("GET /api/books/top-rated -> Error:", error);
    return NextResponse.json({ message: "Failed to get top-rated books", error: error.message }, { status: 500 });
  }
}
