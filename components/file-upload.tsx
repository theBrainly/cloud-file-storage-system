"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { X, Upload, File, CheckCircle } from "lucide-react"

interface FileItem {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  thumbnailUrl?: string
  downloadUrl: string
  isShared: boolean
}

interface FileUploadProps {
  onClose: () => void
  onUpload: (files: FileItem[], uploadResult?: any) => void
}

interface UploadFile {
  file: File
  progress: number
  status: "pending" | "uploading" | "completed" | "error"
  id: string
}

export function FileUpload({ onClose, onUpload }: FileUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    addFiles(files)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      addFiles(files)
    }
  }

  const addFiles = (files: File[]) => {
    const newUploadFiles: UploadFile[] = files.map((file) => ({
      file,
      progress: 0,
      status: "pending",
      id: Math.random().toString(36).substr(2, 9),
    }))

    setUploadFiles((prev) => [...prev, ...newUploadFiles])
  }

  const startUpload = async () => {
    const pendingFiles = uploadFiles.filter((f) => f.status === "pending")

    if (pendingFiles.length === 0) return

    const formData = new FormData()
    pendingFiles.forEach((uf) => {
      formData.append("files", uf.file)
    })

    try {
      // Start upload progress simulation for UI
      pendingFiles.forEach((uploadFile) => {
        setUploadFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "uploading" } : f)))

        // Simulate progress
        let progress = 0
        const interval = setInterval(() => {
          progress += 10
          setUploadFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f)))

          if (progress >= 90) {
            clearInterval(interval)
          }
        }, 100)
      })

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()

        // Complete all uploads
        setUploadFiles((prev) =>
          prev.map((f) => ({
            ...f,
            status: "completed",
            progress: 100,
          })),
        )

        // Show warning if some files were blocked
        if (data.blockedCount > 0) {
          console.warn('Some files were blocked:', data.blockedFiles)
          // You could show a toast or modal here to inform the user
        }

        // Call onUpload with the actual uploaded files and upload result
        onUpload(data.files, data)
      } else {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload failed:", error)
      setUploadFiles((prev) => prev.map((f) => (f.status === "uploading" ? { ...f, status: "error" } : f)))
    }
  }

  const removeFile = (id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const allCompleted = uploadFiles.length > 0 && uploadFiles.every((f) => f.status === "completed")
  const hasUploading = uploadFiles.some((f) => f.status === "uploading")

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upload Files</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
            <p className="text-sm text-gray-500 mb-4">Support for images, documents, videos, and more</p>
            <input type="file" multiple onChange={handleFileSelect} className="hidden" id="file-upload" />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Select Files
              </label>
            </Button>
          </div>

          {/* File List */}
          {uploadFiles.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <File className="h-5 w-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(uploadFile.file.size)}</p>
                    {uploadFile.status === "uploading" && <Progress value={uploadFile.progress} className="mt-1" />}
                  </div>
                  <div className="flex items-center space-x-2">
                    {uploadFile.status === "completed" && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {uploadFile.status === "pending" && (
                      <Button variant="ghost" size="sm" onClick={() => removeFile(uploadFile.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {uploadFiles.length > 0 && !allCompleted && (
              <Button onClick={startUpload} disabled={hasUploading}>
                {hasUploading ? "Uploading..." : `Upload ${uploadFiles.length} file(s)`}
              </Button>
            )}
            {allCompleted && <Button onClick={onClose}>Done</Button>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
