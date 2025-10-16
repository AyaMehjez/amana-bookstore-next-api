// Simple API key auth for server routes
// Usage: await requireApiKey(request)
export async function requireApiKey(request) {
  const headerKey = request.headers.get("x-api-key");
  const expectedKey = process.env.API_SECRET_KEY;

  if (!expectedKey) {
    throw new Error("Server is missing API_SECRET_KEY env var");
  }

  if (!headerKey || headerKey !== expectedKey) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  return { ok: true };
}


