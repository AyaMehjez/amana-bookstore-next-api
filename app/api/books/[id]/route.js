import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { logRequest } from "@/app/lib/logger";

export async function GET(request, _ctx) {
  await logRequest(request);
  // Extract id from request URL to avoid Next.js "params should be awaited" warnings
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const id = parts[parts.length - 1];
  console.log(`GET /api/books/${id}: Searching for book.`);

  // المسار الكامل للملف
  const filePath = path.join(process.cwd(), "app", "data", "books.json");

  // نقرأ الملف ديناميكيًا
  const fileData = await fs.readFile(filePath, "utf-8");
  const { books } = JSON.parse(fileData);

  // Special route: /api/books/top-rated -> return top 10 by (rating * reviewsCount)
  if (id === "top-rated") {
    console.log("GET /api/books/top-rated: Computing top 10.");

    const scored = books.map((b) => {
      const reviewsCount = Array.isArray(b.reviews) ? b.reviews.length : (b.reviewsCount || 0);
      const rating = typeof b.rating === "number" ? b.rating : Number(b.rating) || 0;
      return { ...b, score: rating * reviewsCount };
    });

    const top10 = scored.sort((a, c) => c.score - a.score).slice(0, 10);
    return NextResponse.json({ top: top10 });
  }

  // Otherwise, treat id as numeric and find that book
  const book = books.find((b) => b.id === +id);

  if (!book) {
    console.log(`Book with ID ${id} not found.`);
    return NextResponse.json(
      { message: `Book with ID ${id} not found.` },
      { status: 404 }
    );
  }

  console.log(`Found book ->`, book.title);
  return NextResponse.json(book);
}

export async function DELETE(request, _ctx) {
  try {
    await logRequest(request);
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    console.log(`DELETE /api/books/${id}`);

    const booksPath = path.join(process.cwd(), "app", "data", "books.json");
    const fileData = await fs.readFile(booksPath, "utf-8");
    const jsonData = JSON.parse(fileData);
    const books = jsonData.books || [];

    // Check if book exists
    const bookIndex = books.findIndex((b) => b.id === +id);
    if (bookIndex === -1) {
      return NextResponse.json(
        { message: `Book with ID ${id} not found.` },
        { status: 404 }
      );
    }

    // Remove the book
    const deletedBook = books.splice(bookIndex, 1)[0];

    // Save the updated list
    await fs.writeFile(booksPath, JSON.stringify({ books }, null, 2));

    console.log(`✅ Book with ID ${id} deleted successfully.`);
    return NextResponse.json({
      message: `Book with ID ${id} deleted successfully.`,
      deletedBook,
    });
  } catch (error) {
    console.error("DELETE /api/books/:id -> Error:", error);
    return NextResponse.json(
      { message: "Failed to delete book", error: error.message },
      { status: 500 }
    );
  }
}
