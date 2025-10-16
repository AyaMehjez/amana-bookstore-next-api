import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { logRequest } from "@/app/lib/logger";

// GET /api/books/featured
export async function GET(request) {
  await logRequest(request);
  // Path to books.json
  const filePath = path.join(process.cwd(), "app", "data", "books.json");
  try {
    const fileData = await fs.readFile(filePath, "utf-8");
    const { books } = JSON.parse(fileData);
    // Filter books with featured: true
    const featuredBooks = books.filter((b) => b.featured === true);
    return NextResponse.json({ featured: featuredBooks });
  } catch (error) {
    return NextResponse.json({ message: "Error reading books", error: error.message }, { status: 500 });
  }
}