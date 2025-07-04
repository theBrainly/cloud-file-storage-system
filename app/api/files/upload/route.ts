import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/database"
import { s3Operations, generateS3Key } from "@/lib/s3"
import { fileValidator } from "@/lib/file-validator"
import { virusScanner } from "@/lib/virus-scanner"
import { fileProcessor } from "@/lib/file-processor"

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    // Validate files
    const validation = fileValidator.validateBatch(files)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "File validation failed",
          details: validation.errors,
        },
        { status: 400 },
      )
    }

    // Check storage limit
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    if (user.storageUsed + totalSize > user.storageLimit) {
      return NextResponse.json(
        {
          error: "Storage limit exceeded",
          details: [`Total size: ${totalSize} bytes`, `Available: ${user.storageLimit - user.storageUsed} bytes`],
        },
        { status: 413 },
      )
    }

    const uploadedFiles = []
    const blockedFiles = []
    let totalUploadedSize = 0

    for (const file of files) {
      try {
        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Virus scan
        const scanResult = await virusScanner.scanBuffer(buffer, file.name)
        if (scanResult === "infected") {
          console.warn(`Infected file blocked: ${file.name}`)
          blockedFiles.push({
            name: file.name,
            reason: "Virus/malware detected",
            size: file.size
          })
          continue // Skip infected files
        }

        let s3Key: string
        let s3Location: string
        let thumbnailUrl: string | undefined
        let metadata: any = { size: file.size }

        // Process file if needed (images, videos)
        if (fileProcessor.needsProcessing(file.type)) {
          const processor = fileProcessor.getProcessor(file.type)
          if (processor) {
            const processedFile = await processor(buffer, payload.userId, file.name)
            const uploadResult = await fileProcessor.uploadProcessedFile(
              processedFile,
              payload.userId,
              file.name,
              file.type,
            )

            s3Key = uploadResult.s3Key
            s3Location = uploadResult.s3Location
            thumbnailUrl = uploadResult.thumbnailUrl
            metadata = { ...metadata, ...processedFile.metadata }
          } else {
            // Fallback to direct upload
            s3Key = generateS3Key(payload.userId, file.name)
            const uploadResult = await s3Operations.uploadFile(buffer, s3Key, file.type, {
              userId: payload.userId,
              originalName: file.name,
            })
            s3Location = uploadResult.location
          }
        } else {
          // Direct upload for non-processable files
          s3Key = generateS3Key(payload.userId, file.name)
          const uploadResult = await s3Operations.uploadFile(buffer, s3Key, file.type, {
            userId: payload.userId,
            originalName: file.name,
          })
          s3Location = uploadResult.location
        }

        // Save to database
        const fileRecord = await db.files.create({
          userId: payload.userId,
          name: file.name,
          originalName: file.name,
          size: file.size,
          type: file.type,
          s3Key,
          s3Location,
          isShared: false,
          metadata: {
            ...metadata,
            thumbnailS3Key: thumbnailUrl ? s3Key.replace("files/", "thumbnails/thumb-") : undefined,
            thumbnailUrl,
          },
          virusScanStatus: scanResult === "clean" ? "clean" : "pending",
          tags: [],
        })

        // Schedule background virus scan for additional security
        if (scanResult === "clean") {
          virusScanner.scheduleBackgroundScan(fileRecord.id!, s3Key)
        }

        uploadedFiles.push({
          id: fileRecord.id,
          name: fileRecord.name,
          size: fileRecord.size,
          type: fileRecord.type,
          uploadedAt: fileRecord.uploadedAt,
          downloadUrl: `/api/files/${fileRecord.id}/download`,
          thumbnailUrl,
          isShared: fileRecord.isShared,
          virusScanStatus: fileRecord.virusScanStatus,
        })

        totalUploadedSize += file.size
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error)
        blockedFiles.push({
          name: file.name,
          reason: "Upload error",
          size: file.size
        })
        // Continue with other files instead of failing completely
      }
    }

    // Update user storage
    await db.users.updateStorageUsed(payload.userId, user.storageUsed + totalUploadedSize)

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      uploadedCount: uploadedFiles.length,
      blockedCount: blockedFiles.length,
      blockedFiles,
      totalSize: totalUploadedSize,
      message: uploadedFiles.length === files.length 
        ? `Successfully uploaded ${uploadedFiles.length} files`
        : `Successfully uploaded ${uploadedFiles.length} of ${files.length} files. ${blockedFiles.length} files were blocked.`,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
