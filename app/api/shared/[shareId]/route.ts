import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { shareId: string } }) {
  try {
    const shareLink = await db.shareLinks.findById(params.shareId)

    if (!shareLink) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 })
    }

    // Check if expired
    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Share link has expired" }, { status: 410 })
    }

    const file = await db.files.findById(shareLink.fileId)
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json({
      file: {
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: file.uploadedAt,
        thumbnailUrl: file.metadata.thumbnailPath,
        allowDownload: shareLink.allowDownload,
        allowPreview: shareLink.allowPreview,
        requiresPassword: !!shareLink.password,
        expiresAt: shareLink.expiresAt,
        virusScanStatus: file.virusScanStatus,
      },
    })
  } catch (error) {
    console.error("Get shared file error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
