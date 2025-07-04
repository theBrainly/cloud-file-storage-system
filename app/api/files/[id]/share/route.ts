import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const file = await db.files.findById(params.id)
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    if (file.userId !== payload.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { password, expiresIn, allowDownload, allowPreview } = await request.json()

    // Calculate expiration date
    let expiresAt: string | undefined
    if (expiresIn && expiresIn !== "never") {
      const duration = Number.parseInt(expiresIn.replace(/[^\d]/g, ""))
      const unit = expiresIn.replace(/[\d]/g, "")

      let milliseconds = 0
      switch (unit) {
        case "h":
          milliseconds = duration * 60 * 60 * 1000
          break
        case "d":
          milliseconds = duration * 24 * 60 * 60 * 1000
          break
        default:
          milliseconds = duration * 24 * 60 * 60 * 1000
      }

      expiresAt = new Date(Date.now() + milliseconds).toISOString()
    }

    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined

    // Create share link
    const shareLink = await db.shareLinks.create({
      fileId: params.id,
      userId: payload.userId,
      password: hashedPassword,
      expiresAt,
      allowDownload: allowDownload ?? true,
      allowPreview: allowPreview ?? true,
    })

    // Update file share status
    await db.files.update(params.id, {
      isShared: true,
      shareSettings: {
        shareId: shareLink.id,
        password: hashedPassword,
        expiresAt,
        allowDownload: allowDownload ?? true,
        allowPreview: allowPreview ?? true,
      },
    })

    const shareUrl = `${request.nextUrl.origin}/shared/${shareLink.id}`

    return NextResponse.json({
      shareUrl,
      shareId: shareLink.id,
      expiresAt,
    })
  } catch (error) {
    console.error("Share file error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
