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

    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const skip = Number.parseInt(url.searchParams.get("skip") || "0")
    const search = url.searchParams.get("search")

    let files
    if (search) {
      files = await db.files.search(payload.userId, search, limit)
    } else {
      files = await db.files.findByUserId(payload.userId, limit, skip)
    }

    // Convert to API format
    const apiFiles = files.map((file) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: file.uploadedAt,
      isShared: file.isShared,
      virusScanStatus: file.virusScanStatus,
      metadata: file.metadata,
      downloadUrl: `/api/files/${file.id}/download`,
      thumbnailUrl: file.metadata.thumbnailUrl,
    }))

    return NextResponse.json({
      files: apiFiles,
      pagination: {
        limit,
        skip,
        hasMore: files.length === limit,
      },
    })
  } catch (error) {
    console.error("Get files error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
