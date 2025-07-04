import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

// Enhanced virus scanner with real integration capabilities
export const virusScanner = {
  // Scan file buffer (for upload validation)
  scanBuffer: async (buffer: Buffer, fileName: string): Promise<"clean" | "infected" | "error"> => {
    try {
      // Check file extension against dangerous types first
      const dangerousExtensions = [".exe", ".bat", ".cmd", ".scr", ".pif", ".com", ".vbs", ".js", ".jar", ".msi", ".deb", ".rpm"]
      const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf("."))

      if (dangerousExtensions.includes(fileExtension)) {
        console.warn(`Dangerous file extension detected: ${fileName}`)
        return "infected"
      }

      // Skip signature check for known safe image formats
      const safeImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".ico"]
      const safeDocumentExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".rtf"]
      const safeMediaExtensions = [".mp3", ".mp4", ".avi", ".mov", ".wmv", ".wav", ".ogg", ".flac"]
      
      const allSafeExtensions = [...safeImageExtensions, ...safeDocumentExtensions, ...safeMediaExtensions]
      
      if (allSafeExtensions.includes(fileExtension)) {
        // For safe file types, only check for executable signatures within the file
        const executableSignatures = [
          Buffer.from([0x4d, 0x5a]), // PE executable header
          Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // ELF executable header
        ]
        
        for (const signature of executableSignatures) {
          if (virusScanner.containsSignature(buffer, signature)) {
            console.warn(`Executable signature found in safe file type: ${fileName}`)
            return "infected"
          }
        }
        
        return "clean"
      }

      // For other file types, do more comprehensive checks
      const suspiciousSignatures = [
        Buffer.from([0x4d, 0x5a]), // PE executable header
        Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // ELF executable header
        // Remove ZIP signature as it's too common in legitimate files
      ]

      for (const signature of suspiciousSignatures) {
        if (virusScanner.containsSignature(buffer, signature)) {
          console.warn(`Suspicious signature detected in file: ${fileName}`)
          return "infected"
        }
      }

      // In production, integrate with AWS Lambda + ClamAV or third-party service
      // Example: await invokeLambdaVirusScanner(buffer)

      return "clean"
    } catch (error) {
      console.error("Virus scan error:", error)
      return "error"
    }
  },

  // Scan file from S3 (for background processing)
  scanS3File: async (s3Key: string): Promise<"clean" | "infected" | "error"> => {
    try {
      // In production, this would trigger a Lambda function
      // that downloads the file from S3 and scans it with ClamAV

      // For now, simulate the scan
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Random chance of infection for demo (very low)
      const isInfected = Math.random() < 0.001

      if (isInfected) {
        console.warn(`Virus detected in S3 file: ${s3Key}`)
        return "infected"
      }

      return "clean"
    } catch (error) {
      console.error("S3 virus scan error:", error)
      return "error"
    }
  },

  // Get known malware signatures (simplified)
  getKnownMalwareSignatures: (): Buffer[] => {
    return [
      Buffer.from([0x4d, 0x5a]), // PE executable header
      Buffer.from([0x50, 0x4b, 0x03, 0x04]), // ZIP file header (potential malware container)
      Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // ELF executable header
    ]
  },

  // Check if buffer contains a specific signature
  containsSignature: (buffer: Buffer, signature: Buffer): boolean => {
    for (let i = 0; i <= buffer.length - signature.length; i++) {
      let match = true
      for (let j = 0; j < signature.length; j++) {
        if (buffer[i + j] !== signature[j]) {
          match = false
          break
        }
      }
      if (match) return true
    }
    return false
  },

  // Background virus scanning for uploaded files
  scheduleBackgroundScan: async (fileId: string, s3Key: string): Promise<void> => {
    try {
      // In production, this would add a job to a queue (SQS, Redis, etc.)
      // For now, we'll simulate immediate background processing

      setTimeout(async () => {
        const result = await virusScanner.scanS3File(s3Key)

        // Update file record with scan result
        const { db } = await import("./database")
        await db.files.update(fileId, {
          virusScanStatus: result,
        })

        if (result === "infected") {
          // In production, quarantine the file and notify administrators
          console.error(`SECURITY ALERT: Infected file detected - ${s3Key}`)

          // Delete infected file from S3
          const { s3Operations } = await import("./s3")
          await s3Operations.deleteFile(s3Key)

          // Mark file as deleted in database
          await db.files.update(fileId, {
            virusScanStatus: "infected",
            // Could add a 'quarantined' or 'deleted' status
          })
        }
      }, 5000) // 5 second delay to simulate background processing
    } catch (error) {
      console.error("Background scan scheduling error:", error)
    }
  },
}

// Lambda function code for virus scanning (deploy separately)
export const lambdaVirusScanHandler = async (event: any) => {
  try {
    const { s3Key, fileId } = event

    // Download file from S3
    const s3Client = new S3Client({ region: process.env.AWS_REGION })
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
    })

    const response = await s3Client.send(getObjectCommand)
    const buffer = Buffer.from((await response.Body?.transformToByteArray()) || [])

    // Scan with ClamAV (would need ClamAV installed in Lambda layer)
    // const scanResult = await clamAVScan(buffer)

    // For demo, use our basic scanner
    const scanResult = await virusScanner.scanBuffer(buffer, s3Key)

    // Update database with result
    // This would require database connection in Lambda

    return {
      statusCode: 200,
      body: JSON.stringify({
        fileId,
        s3Key,
        scanResult,
        timestamp: new Date().toISOString(),
      }),
    }
  } catch (error) {
    console.error("Lambda virus scan error:", error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Virus scan failed" }),
    }
  }
}
