import { type NextRequest, NextResponse } from "next/server"
import { findUser } from "../users"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { login, password } = body

    if (!login || !password) {
      return NextResponse.json({ error: "Login and password are required" }, { status: 400 })
    }

    // Найти пользователя в переменных окружения
    const user = findUser(login, password)

    if (!user) {
      console.log(`❌ Failed login attempt: ${login} from IP: ${request.ip || "unknown"}`)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Генерируем токен с секретом из .env
    const sessionSecret = process.env.OSINT_SESSION_SECRET || "default-secret"
    const token = `${sessionSecret}_${user.id}_${Date.now()}`

    // Возвращаем данные без пароля
    const { password: _, ...userWithoutPassword } = user

    console.log(`✅ Successful login: ${user.login} (${user.role}) from IP: ${request.ip || "unknown"}`)

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token,
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
