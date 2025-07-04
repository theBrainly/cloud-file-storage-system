import sharp from "sharp"
import { s3Operations, generateS3Key, getThumbnailKey } from "./s3"

export interface ProcessedFile {
  buffer: Buffer
  metadata: {
    width?: number
    height?: number
    format?: string
    size: number
  }
  thumbnailBuffer?: Buffer
  thumbnailKey?: string
}

export const fileProcessor = {
  // Process image files
  processImage: async (buffer: Buffer, userId: string, fileName: string): Promise<ProcessedFile> => {
    try {
      const image = sharp(buffer)
      const metadata = await image.metadata()

      // Generate thumbnail
      const thumbnailBuffer = await image
        .resize(300, 300, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer()

      const thumbnailKey = getThumbnailKey(generateS3Key(userId, fileName))

      return {
        buffer,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: buffer.length,
        },
        thumbnailBuffer,
        thumbnailKey,
      }
    } catch (error) {
      console.error("Image processing error:", error)
      throw new Error(`Failed to process image: ${error}`)
    }
  },

  // Process video files (extract thumbnail)
  processVideo: async (buffer: Buffer, userId: string, fileName: string): Promise<ProcessedFile> => {
    try {
      // For video thumbnail generation, you would typically use ffmpeg
      // For now, we'll return a placeholder
      const thumbnailKey = getThumbnailKey(generateS3Key(userId, fileName))

      return {
        buffer,
        metadata: {
          size: buffer.length,
        },
        thumbnailKey,
      }
    } catch (error) {
      console.error("Video processing error:", error)
      throw new Error(`Failed to process video: ${error}`)
    }
  },

  // Upload processed file and thumbnail to S3
  uploadProcessedFile: async (
    processedFile: ProcessedFile,
    userId: string,
    fileName: string,
    contentType: string,
  ): Promise<{
    s3Key: string
    s3Location: string
    thumbnailUrl?: string
  }> => {
    try {
      const s3Key = generateS3Key(userId, fileName)

      // Upload main file
      const uploadResult = await s3Operations.uploadFile(processedFile.buffer, s3Key, contentType, {
        userId,
        originalName: fileName,
        processedAt: new Date().toISOString(),
      })

      let thumbnailUrl: string | undefined

      // Upload thumbnail if exists
      if (processedFile.thumbnailBuffer && processedFile.thumbnailKey) {
        await s3Operations.uploadFile(processedFile.thumbnailBuffer, processedFile.thumbnailKey, "image/jpeg", {
          userId,
          originalFile: s3Key,
          type: "thumbnail",
        })

        thumbnailUrl = await s3Operations.getDownloadUrl(processedFile.thumbnailKey, 86400) // 24 hours
      }

      return {
        s3Key: uploadResult.key,
        s3Location: uploadResult.location,
        thumbnailUrl,
      }
    } catch (error) {
      console.error("Upload processed file error:", error)
      throw new Error(`Failed to upload processed file: ${error}`)
    }
  },

  // Determine if file needs processing
  needsProcessing: (contentType: string): boolean => {
    return contentType.startsWith("image/") || contentType.startsWith("video/")
  },

  // Get file processor based on content type
  getProcessor: (contentType: string) => {
    if (contentType.startsWith("image/")) {
      return fileProcessor.processImage
    }
    if (contentType.startsWith("video/")) {
      return fileProcessor.processVideo
    }
    return null
  },
}
