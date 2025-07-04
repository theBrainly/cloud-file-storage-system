"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { X, Download, Share2, Calendar, HardDrive, AlertTriangle } from "lucide-react"

interface FileItem {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  thumbnailUrl?: string
  downloadUrl: string
  isShared: boolean
  virusScanStatus?: string
}

interface FilePreviewProps {
  file: FileItem
  onClose: () => void
}

export function FilePreview({ file, onClose }: FilePreviewProps) {
  const [downloadUrl, setDownloadUrl] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleDownload = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/files/${file.id}/download`)
      if (response.ok) {
        const data = await response.json()
        // Create a temporary link to trigger download
        const link = document.createElement("a")
        link.href = data.downloadUrl
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Download started",
          description: `Downloading ${file.name}`,
        })
      } else {
        throw new Error("Download failed")
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const renderPreview = () => {
    if (file.type.startsWith("image/")) {
      return (
        <div className="flex justify-center p-4">
          <img
            src={file.thumbnailUrl || "/placeholder.svg?height=400&width=400"}
            alt={file.name}
            className="max-w-full max-h-96 object-contain rounded-lg"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg?height=400&width=400"
            }}
          />
        </div>
      )
    }

    if (file.type.startsWith("video/")) {
      return (
        <div className="flex justify-center p-4">
          <video controls className="max-w-full max-h-96 rounded-lg" poster="/placeholder.svg?height=300&width=400">
            <source src={downloadUrl} type={file.type} />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    if (file.type.startsWith("audio/")) {
      return (
        <div className="flex justify-center p-8">
          <audio controls className="w-full max-w-md">
            <source src={downloadUrl} type={file.type} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      )
    }

    if (file.type === "application/pdf") {
      return (
        <div className="flex justify-center p-4">
          <iframe src={`${downloadUrl}#toolbar=0`} className="w-full h-96 border rounded-lg" title={file.name} />
        </div>
      )
    }

    // For other file types, show a placeholder
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
          <span className="text-2xl font-bold text-gray-400">{file.name.split(".").pop()?.toUpperCase()}</span>
        </div>
        <p className="text-sm">Preview not available for this file type</p>
        <p className="text-xs text-gray-400 mt-1">Click download to view the file</p>
      </div>
    )
  }

  const getVirusScanStatus = () => {
    switch (file.virusScanStatus) {
      case "clean":
        return (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-700">Virus scan passed</span>
          </div>
        )
      case "infected":
        return (
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">Virus detected - File blocked</span>
          </div>
        )
      case "pending":
        return (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-yellow-700">Scanning in progress...</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Scan status unknown</span>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="truncate">{file.name}</CardTitle>
            {file.isShared && <Badge variant="secondary">Shared</Badge>}
            {file.virusScanStatus === "infected" && <Badge variant="destructive">Blocked</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Preview Area */}
            <div className="lg:col-span-2 border-r">{renderPreview()}</div>

            {/* File Details */}
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3">File Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <HardDrive className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{formatFileSize(file.size)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Uploaded:</span>
                    <span className="font-medium">{new Date(file.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium ml-2">{file.type}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Security Status</h3>
                <div className="space-y-2">
                  {getVirusScanStatus()}
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-700">Encrypted at rest</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-purple-700">Secure transfer</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  size="sm"
                  onClick={handleDownload}
                  disabled={loading || file.virusScanStatus === "infected"}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? "Preparing..." : "Download"}
                </Button>
                <Button variant="outline" className="w-full bg-transparent" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share File
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
