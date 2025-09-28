#!/usr/bin/env node

/**
 * Password Hashing Utility for OSINT HUB
 * 
 * Usage: node scripts/hash-password.js [password]
 * If no password provided, it will prompt for input
 */

const { createHash, randomBytes, scryptSync } = require('crypto')
const readline = require('readline')

function hashPassword(password) {
  // Generate random salt
  const salt = randomBytes(16).toString('hex')
  
  // Create hash using scrypt
  const hash = scryptSync(password, salt, 64).toString('hex')
  
  // Return salt:hash format
  return `${salt}:${hash}`
}

function generateSecureSecret() {
  return randomBytes(64).toString('hex')
}

function validatePasswordStrength(password) {
  const errors = []
  
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
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

async function promptForPassword() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise((resolve) => {
    rl.question('Enter password to hash: ', (password) => {
      rl.close()
      resolve(password)
    })
  })
}

async function main() {
  console.log('🔐 OSINT HUB - Password Hashing Utility')
  console.log('======================================')
  
  let password = process.argv[2]
  
  if (!password) {
    password = await promptForPassword()
  }
  
  if (!password) {
    console.error('❌ No password provided')
    process.exit(1)
  }
  
  // Validate password strength
  const validation = validatePasswordStrength(password)
  if (!validation.isValid) {
    console.warn('\n⚠️  Password strength warnings:')
    validation.errors.forEach(error => console.warn(`   - ${error}`))
    console.warn('')
  }
  
  // Hash password
  const hashedPassword = hashPassword(password)
  
  console.log('\n✅ Password hashed successfully!')
  console.log(`📋 Hashed password: ${hashedPassword}`)
  console.log('\n📝 Add this to your .env file:')
  console.log(`OSINT_USER_X=username:${hashedPassword}:email@example.com:admin:active`)
  
  console.log('\n🔑 Need a session secret? Here\'s a secure one:')
  console.log(`OSINT_SESSION_SECRET=${generateSecureSecret()}`)
  
  console.log('\n⚡ Security reminders:')
  console.log('   - Never commit passwords to version control')
  console.log('   - Use unique, strong passwords for each user')
  console.log('   - Rotate secrets regularly')
}

main().catch(console.error)