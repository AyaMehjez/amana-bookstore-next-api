import { promises as fs } from "fs";
import path from "path";

export async function logRequest(request, extra = {}) {
  try {
    const now = new Date().toISOString();
    const method = request?.method || "UNKNOWN";
    const urlString = request?.url || "";
    let pathname = "";
    let query = "";
    if (urlString) {
      try {
        const urlObj = new URL(urlString, "http://localhost");
        pathname = urlObj.pathname;
        query = urlObj.search;
      } catch {
        pathname = urlString.startsWith("/") ? urlString : `/${urlString}`;
      }
    }
    const client = request?.headers?.get?.("x-forwarded-for") || request?.headers?.get?.("client-ip") || "";

    const line = `[${now}] ${method} ${pathname}${query} ${client ? `(ip: ${client})` : ""} ${extra.message ? `- ${extra.message}` : ""}`.trim();
    const logPath = path.join(process.cwd(), "log.txt");
    await fs.appendFile(logPath, line + "\n");
  } catch (e) {
    // Avoid throwing from logger to not break API routes
    console.error("Logger error:", e.message);
  }
}


