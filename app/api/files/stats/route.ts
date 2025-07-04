import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get("auth-token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await auth.verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const user = await db.users.findById(payload.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const stats = await db.files.getStorageStats(payload.userId)
    const shareLinks = await db.shareLinks.findByUserId(payload.userId)

    return NextResponse.json({
      storage: {
        used: user.storageUsed,
        limit: user.storageLimit,
        percentage: Math.round((user.storageUsed / user.storageLimit) * 100),
      },
      files: {
        total: stats.totalFiles,
        byType: stats.filesByType,
      },
      sharing: {
        totalShares: shareLinks.length,
        activeShares: shareLinks.filter((link) => !link.expiresAt || new Date(link.expiresAt) > new Date()).length,
      },
    })
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
