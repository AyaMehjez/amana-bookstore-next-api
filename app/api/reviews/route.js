import { NextResponse } from "next/server";
import reviews from "@/app/data/reviews.json";
import books from "@/app/data/books.json"; // To validate bookId
import { promises as fs } from "fs";
import path from "path";

// Path to the reviews.json file
const reviewsFilePath = path.join(process.cwd(), "app", "data", "reviews.json");

/**
 * @api {get} /api/reviews
 * @apiDescription Get all reviews. You can filter by bookId using a query parameter.
 * @apiQuery {String} [bookId] Optional book ID to filter reviews.
 * @apiSuccess {Object[]} reviews List of reviews.
 */
export async function GET(request) {
  // URLSearchParams allows us to easily get query parameters
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");

  if (bookId) {
    console.log(`GET /api/reviews: Filtering reviews for bookId=${bookId}`);
    // Compare as strings to be robust against number/string mismatches
    const filteredReviews = reviews.filter((r) => String(r.bookId) === String(bookId));
    return NextResponse.json(filteredReviews);
  }

  console.log("GET /api/reviews: Responding with all reviews.");
  return NextResponse.json(reviews);
}

/**
 * @api {post} /api/reviews
 * @apiDescription Add a new review for a book
 * @apiParam {Object} review The review to add. Must include bookId, user, and text.
 * @apiSuccess {Object} review The review that was added.
 */
export async function POST(request) {
  try {
    const newReview = await request.json();
    console.log("POST /api/reviews: Received new review ->", newReview); // Basic validation

    if (!newReview.bookId || !newReview.user || !newReview.text) {
      return NextResponse.json(
        { message: "bookId, user, and text are required." },
        { status: 400 }
      );
    } // --- FIX 1: Resolve the 'books' array issue and ensure ID type matching ---

    const bookList = Array.isArray(books)
      ? books
      : books && books.books
      ? books.books
      : [];
    const targetBookId = newReview.bookId; // Check if the bookId actually exists // ملاحظة: يفضل هنا توحيد نوع البيانات قبل المقارنة، لذا نستخدم String(book.id) لضمان العمل مع أنواع IDs مختلطة

    const bookExists = bookList.some(
      (book) => String(book.id) === String(targetBookId)
    );
    if (!bookExists) {
      return NextResponse.json(
        { message: `Book with ID ${newReview.bookId} does not exist.` },
        { status: 404 }
      );
    }

    const reviewsData = JSON.parse(await fs.readFile(reviewsFilePath, "utf-8"));

    let currentReviews = Array.isArray(reviewsData)
      ? reviewsData
      : Array.isArray(reviewsData?.reviews)
      ? reviewsData.reviews
      : []; // 🛑 التعديل هنا: استخراج الجزء الرقمي من الـ ID (بعد الشرطة) للمقارنة

    const maxId = currentReviews.reduce((max, review) => {
      // نقوم بفصل الـ ID (مثل 'review-4') ونأخذ الجزء الثاني
      const idParts = String(review.id).split("-");
      const currentIdNum =
        idParts.length === 2 && idParts[0] === "review"
          ? parseInt(idParts[1], 10)
          : 0; // إذا لم يكن التنسيق مطابقاً، نعتبره 0

      return currentIdNum && currentIdNum > max ? currentIdNum : max;
    }, 0);

    const newId = maxId + 1; // 🛑 التعديل هنا: بناء الـ ID الجديد بالتنسيق المطلوب (سلسلة نصية + رقم تسلسلي)

    newReview.id = `review-${newId}`;
    newReview.timestamp = new Date().toISOString();
    currentReviews.push(newReview);
    const dataToWrite = Array.isArray(reviewsData)
      ? currentReviews
      : { reviews: currentReviews };

    await fs.writeFile(reviewsFilePath, JSON.stringify(dataToWrite, null, 2));

    console.log("POST /api/reviews: Successfully added review.");
    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews: Error ->", error);
    return NextResponse.json(
      { message: "An error occurred while adding the review." },
      { status: 500 }
    );
  }
}
