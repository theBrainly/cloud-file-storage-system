import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { db } from "./database"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export interface JWTPayload {
  userId: string
  email: string
  exp: number
}

export const auth = {
  hashPassword: async (password: string): Promise<string> => {
    return bcrypt.hash(password, 12) // Increased rounds for better security
  },

  verifyPassword: async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash)
  },

  generateToken: async (userId: string, email: string): Promise<string> => {
    const token = await new SignJWT({ userId, email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .setIssuedAt()
      .setNotBefore(new Date())
      .sign(JWT_SECRET)

    return token
  },

  verifyToken: async (token: string): Promise<JWTPayload | null> => {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      return payload as JWTPayload
    } catch (error) {
      console.error("Token verification failed:", error)
      return null
    }
  },

  login: async (email: string, password: string): Promise<{ user: any; token: string } | null> => {
    try {
      const user = await db.users.findByEmail(email)
      if (!user) {
        // Add delay to prevent timing attacks
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return null
      }

      const isValid = await auth.verifyPassword(password, user.passwordHash)
      if (!isValid) {
        return null
      }

      // Update last login time
      await db.users.updateLastLogin(user.id!)

      const token = await auth.generateToken(user.id!, user.email)

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          storageUsed: user.storageUsed,
          storageLimit: user.storageLimit,
        },
        token,
      }
    } catch (error) {
      console.error("Login error:", error)
      return null
    }
  },

  validatePasswordStrength: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long")
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number")
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  },

  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  sanitizeInput: (input: string): string => {
    return input.trim().replace(/[<>]/g, "")
  },
}
