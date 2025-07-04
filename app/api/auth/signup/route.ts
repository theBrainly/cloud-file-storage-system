import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
      return NextResponse.json(
        {
          error: "Password must contain at least one uppercase letter, lowercase letter, number, and special character",
        },
        { status: 400 },
      )
    }

    // Validate name
    if (name.trim().length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters long" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.users.findByEmail(email.toLowerCase())
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    // Hash password
    const passwordHash = await auth.hashPassword(password)

    // Create user
    const user = await db.users.create({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
      storageUsed: 0,
      storageLimit: 5 * 1024 * 1024 * 1024, // 5GB default
    })

    // Generate JWT token
    const token = await auth.generateToken(user.id!, user.email)

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
      },
      token,
    })

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
