"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Copy, Link, Mail, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface ShareSettings {
  requirePassword: boolean
  password?: string
  expiresIn: string
  allowDownload: boolean
  allowPreview: boolean
}

interface ShareDialogProps {
  file: FileItem
  onClose: () => void
  onShare: (file: FileItem, settings: ShareSettings) => void
}

export function ShareDialog({ file, onClose, onShare }: ShareDialogProps) {
  const [settings, setSettings] = useState<ShareSettings>({
    requirePassword: false,
    expiresIn: "7d",
    allowDownload: true,
    allowPreview: true,
  })
  const [shareLink, setShareLink] = useState("")
  const [isShared, setIsShared] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const generateShareLink = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/files/${file.id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: settings.requirePassword ? settings.password : undefined,
          expiresIn: settings.expiresIn,
          allowDownload: settings.allowDownload,
          allowPreview: settings.allowPreview,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setShareLink(data.shareUrl)
        setIsShared(true)
        onShare(file, settings)

        toast({
          title: "Share link generated",
          description: "Your file is now ready to share",
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate share link")
      }
    } catch (error) {
      console.error("Share error:", error)
      toast({
        title: "Share failed",
        description: "Could not generate share link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      toast({
        title: "Link copied",
        description: "Share link has been copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      })
    }
  }

  const sendByEmail = () => {
    const subject = encodeURIComponent(`Shared file: ${file.name}`)
    const body = encodeURIComponent(`I've shared a file with you: ${file.name}\n\nAccess it here: ${shareLink}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const getExpirationDate = () => {
    if (settings.expiresIn === "never") return "Never"

    const duration = Number.parseInt(settings.expiresIn.replace(/[^\d]/g, ""))
    const unit = settings.expiresIn.replace(/[\d]/g, "")

    let milliseconds = 0
    switch (unit) {
      case "h":
        milliseconds = duration * 60 * 60 * 1000
        break
      case "d":
        milliseconds = duration * 24 * 60 * 60 * 1000
        break
      default:
        milliseconds = duration * 24 * 60 * 60 * 1000
    }

    return new Date(Date.now() + milliseconds).toLocaleDateString()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Share File</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-gray-500">{new Date(file.uploadedAt).toLocaleDateString()}</p>
          </div>

          {!isShared ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password-protection">Password Protection</Label>
                  <Switch
                    id="password-protection"
                    checked={settings.requirePassword}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, requirePassword: checked }))}
                  />
                </div>

                {settings.requirePassword && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={settings.password || ""}
                      onChange={(e) => setSettings((prev) => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="expires">Expires In</Label>
                  <Select
                    value={settings.expiresIn}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, expiresIn: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="1d">1 Day</SelectItem>
                      <SelectItem value="7d">7 Days</SelectItem>
                      <SelectItem value="30d">30 Days</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow-download">Allow Download</Label>
                    <Switch
                      id="allow-download"
                      checked={settings.allowDownload}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allowDownload: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow-preview">Allow Preview</Label>
                    <Switch
                      id="allow-preview"
                      checked={settings.allowPreview}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allowPreview: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={generateShareLink}
                className="w-full"
                disabled={loading || (settings.requirePassword && !settings.password)}
              >
                <Link className="h-4 w-4 mr-2" />
                {loading ? "Generating..." : "Generate Share Link"}
              </Button>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="share-link">Share Link</Label>
                <div className="flex space-x-2 mt-1">
                  <Input id="share-link" value={shareLink} readOnly className="flex-1" />
                  <Button size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={sendByEmail} className="flex-1 bg-transparent">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" onClick={copyToClipboard} className="flex-1 bg-transparent">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3" />
                  <span>Expires: {getExpirationDate()}</span>
                </div>
                {settings.requirePassword && <div>🔒 Password protected</div>}
                <div>📥 Download: {settings.allowDownload ? "Allowed" : "Blocked"}</div>
                <div>👁️ Preview: {settings.allowPreview ? "Allowed" : "Blocked"}</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
