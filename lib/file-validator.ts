export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export const fileValidator = {
  // Maximum file size: 100MB
  MAX_FILE_SIZE: 100 * 1024 * 1024,

  // Allowed file types
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
    "application/zip",
    "application/x-rar-compressed",
  ],

  validateFile: (file: File): ValidationResult => {
    const errors: string[] = []

    // Check file size
    if (file.size > fileValidator.MAX_FILE_SIZE) {
      errors.push(`File size exceeds ${fileValidator.MAX_FILE_SIZE / (1024 * 1024)}MB limit`)
    }

    // Check file type
    if (!fileValidator.ALLOWED_TYPES.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`)
    }

    // Check file name
    if (file.name.length > 255) {
      errors.push("File name is too long (max 255 characters)")
    }

    // Check for potentially dangerous file names
    const dangerousPatterns = [/\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i]
    if (dangerousPatterns.some((pattern) => pattern.test(file.name))) {
      errors.push("File type is not allowed for security reasons")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  },

  validateBatch: (files: File[]): ValidationResult => {
    const allErrors: string[] = []

    // Check total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > 500 * 1024 * 1024) {
      // 500MB batch limit
      allErrors.push("Total batch size exceeds 500MB limit")
    }

    // Validate each file
    files.forEach((file, index) => {
      const result = fileValidator.validateFile(file)
      if (!result.isValid) {
        allErrors.push(`File ${index + 1} (${file.name}): ${result.errors.join(", ")}`)
      }
    })

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    }
  },
}
