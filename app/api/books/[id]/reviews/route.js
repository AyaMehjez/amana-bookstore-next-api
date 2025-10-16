import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireApiKey } from "@/app/lib/auth";
import { logRequest } from "@/app/lib/logger";

// 🟢 GET: Get all reviews for a specific book
export async function GET(request, { params }) {
  await logRequest(request);
  const { id } = params;
  const reviewsPath = path.join(process.cwd(), "app", "data", "reviews.json");

  const fileData = await fs.readFile(reviewsPath, "utf-8");
  const { reviews } = JSON.parse(fileData);

  const bookReviews = reviews.filter((review) => review.bookId === +id);

  if (!bookReviews.length) {
    return NextResponse.json(
      { message: `No reviews found for book ID ${id}` },
      { status: 404 }
    );
  }

  return NextResponse.json(bookReviews);
}

// 🟠 POST: Create a new review for a specific book
export async function POST(request, { params }) {
  try {
    await logRequest(request);
    const auth = await requireApiKey(request);
    if (!auth.ok) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const { id } = params;
    const bookId = Number(id);
    if (Number.isNaN(bookId)) {
      return NextResponse.json({ message: "Invalid book ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      user: bodyUser,
      author: bodyAuthor,
      text: bodyText,
      comment: bodyComment,
      title,
      rating
    } = body || {};

    const user = bodyUser || bodyAuthor;
    const text = bodyText || bodyComment;

    if (!user || !text) {
      return NextResponse.json(
        { message: "'user' (or 'author') and 'text' (or 'comment') are required" },
        { status: 400 }
      );
    }

    const normalizedRating = rating == null ? undefined : Number(rating);
    if (normalizedRating != null && (Number.isNaN(normalizedRating) || normalizedRating < 1 || normalizedRating > 5)) {
      return NextResponse.json(
        { message: "'rating' must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    const reviewsPath = path.join(process.cwd(), "app", "data", "reviews.json");
    const fileData = await fs.readFile(reviewsPath, "utf-8");
    const json = JSON.parse(fileData);
    const currentReviews = Array.isArray(json.reviews) ? json.reviews : [];

    // Generate a unique ID: prefer numeric increment when possible
    const numericIds = currentReviews
      .map(r => (typeof r.id === "number" ? r.id : Number.isFinite(Number(r.id)) ? Number(r.id) : null))
      .filter(v => v != null);
    const nextNumericId = numericIds.length ? Math.max(...numericIds) + 1 : 1;
    const newId = nextNumericId;

    const newReview = {
      id: newId,
      bookId,
      user,
      text,
      title: title || undefined,
      rating: normalizedRating,
      timestamp: new Date().toISOString()
    };

    currentReviews.push(newReview);

    await fs.writeFile(
      reviewsPath,
      JSON.stringify({ reviews: currentReviews }, null, 2)
    );

    return NextResponse.json(
      { message: "Review added successfully", review: newReview },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/books/[id]/reviews -> Error:", error);
    return NextResponse.json(
      { message: "Failed to add review", error: error.message },
      { status: 500 }
    );
  }
}