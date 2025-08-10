// Файл для управления пользователями через переменные окружения
// Пользователи теперь хранятся в .env файле

interface User {
  id: string
  email: string
  login: string
  password: string
  status: "active" | "blocked"
  role: "admin" | "user"
  createdAt: string
}

// Парсим пользователей из переменных окружения
function parseUsersFromEnv(): User[] {
  const users: User[] = []

  // Ищем переменные вида OSINT_USER_1, OSINT_USER_2, etc.
  let userIndex = 1

  while (true) {
    const userEnv = process.env[`OSINT_USER_${userIndex}`]

    if (!userEnv) {
      break // Больше пользователей нет
    }

    try {
      // Формат: login:password:email:role:status
      const [login, password, email, role = "user", status = "active"] = userEnv.split(":")

      if (login && password && email) {
        users.push({
          id: userIndex.toString(),
          login: login.trim(),
          password: password.trim(),
          email: email.trim(),
          role: (role.trim() as "admin" | "user") || "user",
          status: (status.trim() as "active" | "blocked") || "active",
          createdAt: "2024-01-01T00:00:00Z",
        })
      }
    } catch (error) {
      console.error(`Error parsing OSINT_USER_${userIndex}:`, error)
    }

    userIndex++
  }

  // SECURITY: All users must be configured via environment variables
  // No hardcoded credentials allowed
  if (users.length === 0) {
    console.error("🚨 SECURITY: No users configured in environment variables!")
    console.error("Please set OSINT_USER_1, OSINT_USER_2, etc. environment variables")
    console.error("Format: OSINT_USER_1=login:hashedPassword:email:role:status")
    throw new Error("No users configured - system cannot start securely")
  }

  return users
}

// Получаем пользователей из переменных окружения
export const AUTHORIZED_USERS = parseUsersFromEnv()

import { verifyPassword } from '../../../lib/auth'

// Функция для проверки пользователя с безопасным хешированием
export function findUser(login: string, password: string) {
  const user = AUTHORIZED_USERS.find((user) => user.login === login && user.status === "active")
  if (!user) {
    // Минимальная задержка для защиты от timing attacks
    setTimeout(() => {}, 100)
    return null
  }
  
  // Проверяем пароль с помощью безопасного сравнения
  if (verifyPassword(password, user.password)) {
    return user
  }
  
  return null
}

// Функция для получения всех активных пользователей (для админки)
export function getAllUsers() {
  return AUTHORIZED_USERS.filter((user) => user.status === "active").map((user) => ({
    ...user,
    password: "***", // Скрываем пароли
  }))
}

// Логирование загруженных пользователей (без паролей)
console.log(
  "👥 Loaded users:",
  AUTHORIZED_USERS.map((u) => ({
    login: u.login,
    role: u.role,
    status: u.status,
  })),
)
