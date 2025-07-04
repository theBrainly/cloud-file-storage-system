import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/database"
import { s3Operations } from "@/lib/s3"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    try {
      // Delete from S3
      await s3Operations.deleteFile(file.s3Key)

      // Delete thumbnail if exists
      if (file.metadata.thumbnailS3Key) {
        await s3Operations.deleteFile(file.metadata.thumbnailS3Key)
      }
    } catch (s3Error) {
      console.error("S3 deletion error:", s3Error)
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database
    await db.files.delete(params.id)

    // Update user storage
    const user = await db.users.findById(payload.userId)
    if (user) {
      await db.users.updateStorageUsed(payload.userId, Math.max(0, user.storageUsed - file.size))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete file error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    return NextResponse.json({
      id: file.id,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: file.uploadedAt,
      isShared: file.isShared,
      virusScanStatus: file.virusScanStatus,
      metadata: file.metadata,
      tags: file.tags,
    })
  } catch (error) {
    console.error("Get file error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
