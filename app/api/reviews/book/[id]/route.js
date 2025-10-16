import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request, { params }) {
  const { id } = params;
  const reviewsPath = path.join(process.cwd(), "app", "data", "reviews.json");

  const fileData = await fs.readFile(reviewsPath, "utf-8");
  const { reviews } = JSON.parse(fileData);

  // Compare as strings to avoid type mismatches
  const bookReviews = reviews.filter((review) => String(review.bookId) === String(id));

  if (!bookReviews.length) {
    return NextResponse.json(
      { message: `No reviews found for book ID ${id}` },
      { status: 404 }
    );
  }

  return NextResponse.json(bookReviews);
}
