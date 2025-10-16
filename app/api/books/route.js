import { NextResponse } from "next/server";
// Assuming your data files are in the `data` folder at the root of your project
// Adjust the path if necessary, e.g., '../../data/books.json' if data is outside app
import books from "@/app/data/books.json";
import { promises as fs } from "fs";
import path from "path";
import { requireApiKey } from "@/app/lib/auth";
import { logRequest } from "@/app/lib/logger";

// Path to the books.json file
// const booksFilePath = path.join(process.cwd(), "app", "data", "books.json");

/**
 * @api {get} /api/books
 * @apiDescription Get all books
 * @apiSuccess {Object[]} books List of books.
 */
export async function GET(request) {
  await logRequest(request);
  // In a real app, you might fetch this from a database.
  // For this task, we're just returning the imported JSON.
  console.log("GET /api/books: Responding with all books.");
  return NextResponse.json(books);
}

/**
 * @api {post} /api/books
 * @apiDescription Add a new book
 * @apiParam {Object} book The book to add.
 * @apiSuccess {Object} book The book that was added.
 */
export async function POST(request) {
  try {
    await logRequest(request);
    const auth = await requireApiKey(request);
    if (!auth.ok) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const newBook = await request.json();
    console.log("POST /api/books: Received new book ->", newBook);

    // Path to the books file
    const booksPath = path.join(process.cwd(), "app", "data", "books.json");

    // Read and parse the current data
    const fileData = await fs.readFile(booksPath, "utf-8");
    const data = JSON.parse(fileData);
    const currentBooks = data.books || [];

    // 🧠 Find the highest existing ID
    const lastBook = currentBooks[currentBooks.length - 1];
    const newId = lastBook ? Number(lastBook.id) + 1 : 1;

    // Assign the new numeric ID
    newBook.id = newId;

    // Add the new book
    currentBooks.push(newBook);

    // Write back the updated data
    await fs.writeFile(
      booksPath,
      JSON.stringify({ books: currentBooks }, null, 2)
    );

    console.log(`✅ New book added with ID ${newId}`);
    return NextResponse.json(
      { message: "Book added successfully", book: newBook },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/books: Error ->", error);
    return NextResponse.json(
      { message: "Failed to add book", error: error.message },
      { status: 500 }
    );
  }
}