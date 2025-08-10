import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

export interface SecureUser {
  id: string
  email: string
  login: string
  passwordHash: string
  status: "active" | "blocked"
  role: "admin" | "user"
  createdAt: string
}

/**
 * Создает безопасный хеш пароля используя scrypt
 */
export function hashPassword(password: string): string {
  // Генерируем случайную соль
  const salt = randomBytes(16).toString('hex')
  
  // Создаем хеш с помощью scrypt
  const hash = scryptSync(password, salt, 64).toString('hex')
  
  // Возвращаем соль + хеш
  return `${salt}:${hash}`
}

/**
 * Проверяет пароль против хеша
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':')
    
    if (!salt || !hash) {
      return false
    }
    
    // Создаем хеш из введенного пароля
    const testHash = scryptSync(password, salt, 64)
    const storedHashBuffer = Buffer.from(hash, 'hex')
    
    // Используем timing-safe сравнение для защиты от timing атак
    return timingSafeEqual(testHash, storedHashBuffer)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

/**
 * Генерирует криптографически стойкий секретный ключ
 */
export function generateSecureSecret(): string {
  return randomBytes(64).toString('hex')
}

/**
 * Проверяет силу пароля
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain numbers')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain special characters')
  }
  
  // Проверяем на распространенные слабые пароли
  const weakPasswords = [
    'password', '123456', 'admin', 'qwerty', 'letmein',
    'welcome', 'monkey', '1234567890', 'password123'
  ]
  
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('Password contains common weak patterns')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}