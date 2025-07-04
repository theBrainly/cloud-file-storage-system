import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const filePath = params.path.join("/")
    const token =
      request.nextUrl.searchParams.get("token") ||
      request.cookies.get("auth-token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await auth.verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Find file by path
    const files = await db.files.findByUserId(payload.userId)
    const file = files.find((f) => f.path === filePath)

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // In production, this would serve from S3 or redirect to pre-signed URL
    // For demo, return a mock response
    return new Response("File content would be served here", {
      headers: {
        "Content-Type": file.type,
        "Content-Disposition": `attachment; filename="${file.name}"`,
        "Content-Length": file.size.toString(),
      },
    })
  } catch (error) {
    console.error("Serve file error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
