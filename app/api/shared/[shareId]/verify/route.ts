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

    if (!shareLink.password) {
      return NextResponse.json({ success: true })
    }

    const isValid = await bcrypt.compare(password, shareLink.password)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Verify shared file error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
