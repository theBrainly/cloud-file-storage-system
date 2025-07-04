import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetBucketLocationCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { Upload } from "@aws-sdk/lib-storage"

if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_REGION ||
  !process.env.AWS_S3_BUCKET
) {
  throw new Error("Missing required AWS environment variables")
}

// Create S3 client with better error handling
const createS3Client = () => {
  const region = process.env.AWS_REGION!
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID!
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!
  
  console.log(`Initializing S3 client with region: ${region}`)
  
  return new S3Client({
    region: region,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    forcePathStyle: false, // Use virtual hosted-style URLs
    useArnRegion: true, // Use ARN region if provided
  })
}

const s3Client = createS3Client()
const BUCKET_NAME = process.env.AWS_S3_BUCKET!

// Function to verify bucket region
const verifyBucketRegion = async () => {
  try {
    const command = new GetBucketLocationCommand({ Bucket: BUCKET_NAME })
    const response = await s3Client.send(command)
    const bucketRegion = response.LocationConstraint || "us-east-1" // Default for us-east-1
    console.log(`Bucket ${BUCKET_NAME} is in region: ${bucketRegion}`)

    if (bucketRegion !== process.env.AWS_REGION) {
      console.warn(
        `Region mismatch! Bucket is in ${bucketRegion}, but client is configured for ${process.env.AWS_REGION}`,
      )
    }

    return bucketRegion
  } catch (error) {
    console.error("Error verifying bucket region:", error)
    return process.env.AWS_REGION
  }
}

// Verify bucket region on startup (don't await to avoid blocking)
verifyBucketRegion().catch(console.error)

export interface S3UploadResult {
  key: string
  location: string
  bucket: string
  size: number
  etag: string
}

export const s3Operations = {
  // Upload file to S3
  uploadFile: async (
    file: Buffer | Uint8Array | string,
    key: string,
    contentType: string,
    metadata?: Record<string, string>,
  ): Promise<S3UploadResult> => {
    try {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: BUCKET_NAME,
          Key: key,
          Body: file,
          ContentType: contentType,
          Metadata: metadata,
          ServerSideEncryption: "AES256",
        },
      })

      const result = await upload.done()

      return {
        key,
        location:
          result.Location ||
          `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
        bucket: BUCKET_NAME,
        size: Buffer.isBuffer(file) ? file.length : file.toString().length,
        etag: result.ETag || "",
      }
    } catch (error) {
      console.error("S3 upload error:", error)
      throw new Error(`Failed to upload file to S3: ${error}`)
    }
  },

  // Generate pre-signed URL for download
  getDownloadUrl: async (key: string, expiresIn = 3600): Promise<string> => {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })
      return signedUrl
    } catch (error) {
      console.error("S3 get download URL error:", error)
      throw new Error(`Failed to generate download URL: ${error}`)
    }
  },

  // Generate pre-signed URL for upload
  getUploadUrl: async (
    key: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<{ uploadUrl: string; fields: Record<string, string> }> => {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        ServerSideEncryption: "AES256",
      })

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })

      return {
        uploadUrl: signedUrl,
        fields: {
          "Content-Type": contentType,
        },
      }
    } catch (error) {
      console.error("S3 get upload URL error:", error)
      throw new Error(`Failed to generate upload URL: ${error}`)
    }
  },

  // Delete file from S3
  deleteFile: async (key: string): Promise<boolean> => {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      await s3Client.send(command)
      return true
    } catch (error) {
      console.error("S3 delete error:", error)
      throw new Error(`Failed to delete file from S3: ${error}`)
    }
  },

  // Check if file exists
  fileExists: async (key: string): Promise<boolean> => {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      await s3Client.send(command)
      return true
    } catch (error) {
      return false
    }
  },

  // Get file metadata
  getFileMetadata: async (key: string): Promise<any> => {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      const result = await s3Client.send(command)
      return {
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
        etag: result.ETag,
        metadata: result.Metadata,
      }
    } catch (error) {
      console.error("S3 get metadata error:", error)
      throw new Error(`Failed to get file metadata: ${error}`)
    }
  },
}

// Helper function to generate S3 key
export function generateS3Key(
  userId: string,
  fileName: string,
  fileType: "file" | "thumbnail" = "file",
): string {
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
  const prefix = fileType === "thumbnail" ? "thumbnails" : "files"

  return `${prefix}/${userId}/${timestamp}-${sanitizedFileName}`
}

// Helper function to generate thumbnail key
export function getThumbnailKey(originalKey: string): string {
  const parts = originalKey.split("/")
  const fileName = parts[parts.length - 1]
  const userId = parts[1]

  return `thumbnails/${userId}/thumb-${fileName}`
}
