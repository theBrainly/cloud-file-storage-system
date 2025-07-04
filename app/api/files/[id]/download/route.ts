import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/database"
import { s3Operations } from "@/lib/s3"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token =
      request.cookies.get("auth-token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.nextUrl.searchParams.get("token")

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

    // Check virus scan status
    if (file.virusScanStatus === "infected") {
      return NextResponse.json({ error: "File is infected and cannot be downloaded" }, { status: 403 })
    }

    // Generate pre-signed download URL from S3
    const downloadUrl = await s3Operations.getDownloadUrl(file.s3Key, 3600) // 1 hour expiry

    return NextResponse.json({
      downloadUrl,
      fileName: file.name,
      size: file.size,
      type: file.type,
      expiresIn: 3600,
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
