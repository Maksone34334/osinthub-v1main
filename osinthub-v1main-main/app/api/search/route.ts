import { type NextRequest, NextResponse } from "next/server"

// Получаем API токен из переменных окружения
const API_TOKEN = process.env.OSINT_API_TOKEN!;

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Verify user token (проверяем что токен содержит наш секрет)
    const sessionSecret = process.env.OSINT_SESSION_SECRET || "default-secret"
    if (!token || !token.startsWith(sessionSecret)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { request: query, limit = 100, lang = "ru" } = body

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    console.log(`🔍 Search request: "${query}" (limit: ${limit}, lang: ${lang})`)

    // Make request to OSINT API
    const apiResponse = await fetch("https://leakosintapi.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: API_TOKEN,
        request: query,
        limit,
        lang,
        type: "json",
      }),
    })

    if (!apiResponse.ok) {
      const errorMessage = `OSINT API returned status ${apiResponse.status}`
      console.error(`❌ API Error: ${errorMessage}`)
      throw new Error(errorMessage)
    }

    const data = await apiResponse.json()

    // Check for API errors in response
    if (data["Error code"]) {
      const errorMessage = `OSINT API Error: ${data["Error code"]}`
      console.error(`❌ API Response Error: ${errorMessage}`)
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    // Log successful response
    const resultCount = Object.keys(data.List || {}).length
    console.log(`✅ Search successful: Found ${resultCount} database results`)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Search API Error:", error)

    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: "Failed to process search request",
      },
      { status: 500 },
    )
  }
}
