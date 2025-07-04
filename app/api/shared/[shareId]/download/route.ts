import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest, { params }: { params: { shareId: string } }) {
  try {
    const { password } = await request.json()

    const shareLink = await db.shareLinks.findById(params.shareId)
    if (!shareLink) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 })
    }

    // Check password if required
    if (shareLink.password) {
      if (!password || !(await bcrypt.compare(password, shareLink.password))) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 })
      }
    }

    // Check if download is allowed
    if (!shareLink.allowDownload) {
      return NextResponse.json({ error: "Download not allowed" }, { status: 403 })
    }

    // Check expiration
    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Share link has expired" }, { status: 410 })
    }

    const file = await db.files.findById(shareLink.fileId)
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Increment access count
    await db.shareLinks.incrementAccess(params.shareId)

    // In production, return actual file or redirect to S3 pre-signed URL
    return new Response("File content would be served here", {
      headers: {
        "Content-Type": file.type,
        "Content-Disposition": `attachment; filename="${file.name}"`,
        "Content-Length": file.size.toString(),
      },
    })
  } catch (error) {
    console.error("Download shared file error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
