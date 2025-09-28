import { type NextRequest, NextResponse } from "next/server"

// Mock data - in production, use a real database
const PENDING_REGISTRATIONS: Array<{
  id: string
  email: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}> = []

const USERS: Array<{
  id: string
  email: string
  login: string
  password: string
  status: "active" | "pending" | "blocked"
  createdAt: string
}> = [
  {
    id: "1",
    email: "admin@example.com",
    login: "admin",
    password: "admin123",
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    email: "demo@example.com",
    login: "demo",
    password: "demo123",
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
  },
]

// Get all pending registrations
export async function GET() {
  return NextResponse.json({
    pendingRegistrations: PENDING_REGISTRATIONS,
    total: PENDING_REGISTRATIONS.length,
  })
}

// Approve or reject registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId, action, login, password } = body

    if (!registrationId || !action) {
      return NextResponse.json({ error: "Registration ID and action are required" }, { status: 400 })
    }

    const registration = PENDING_REGISTRATIONS.find((r) => r.id === registrationId)
    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    if (action === "approve") {
      if (!login || !password) {
        return NextResponse.json({ error: "Login and password are required for approval" }, { status: 400 })
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email: registration.email,
        login,
        password, // In production, hash the password
        status: "active" as const,
        createdAt: new Date().toISOString(),
      }

      USERS.push(newUser)
      registration.status = "approved"

      console.log(`✅ Registration approved: ${registration.email} -> ${login}`)

      // In production, send email with credentials to user

      return NextResponse.json({
        success: true,
        message: "Registration approved and user created",
        user: { ...newUser, password: undefined }, // Don't return password
      })
    } else if (action === "reject") {
      registration.status = "rejected"

      console.log(`❌ Registration rejected: ${registration.email}`)

      return NextResponse.json({
        success: true,
        message: "Registration rejected",
      })
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Admin registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
