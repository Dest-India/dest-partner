"use client"

import {
  AlertCircleIcon,
  FileIcon,
  ImageIcon,
  Plus,
  UploadIcon,
  VideoIcon,
  XIcon,
} from "lucide-react"

import { formatBytes, useFileUpload } from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { PreviewDialog } from "@/components/site/ui/preview-dialog"

const YouTubeIcon = ({ className }) => <svg className={cn("size-6", className)} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15.9853 26C15.9853 26 24.7568 26 26.9325 25.43C28.1575 25.107 29.0788 24.176 29.4022 23.0265C30 20.9175 30 16.481 30 16.481C30 16.481 30 12.073 29.4022 9.983C29.0788 8.805 28.1575 7.893 26.9325 7.5795C24.7568 7 15.9853 7 15.9853 7C15.9853 7 7.23346 7 5.06755 7.5795C3.8621 7.893 2.92125 8.805 2.57823 9.983C2 12.073 2 16.481 2 16.481C2 16.481 2 20.9175 2.57823 23.0265C2.92125 24.176 3.8621 25.107 5.06755 25.43C7.23346 26 15.9853 26 15.9853 26Z" fill="#FF0033" />
  <path d="M20.3449 16.5L13.1035 12.4625V20.5375L20.3449 16.5Z" fill="white" />
</svg>

const getFileIcon = (file) => {
  const fileType = file.file instanceof File ? file.file.type : file.file.type
  const fileName = file.file instanceof File ? file.file.name : file.file.name

  const iconMap = {
    video: {
      icon: VideoIcon,
      conditions: (type) => type.includes("video/") || type === "video/youtube",
    },
    image: {
      icon: ImageIcon,
      conditions: (type) => type.startsWith("image/"),
    },
  }

  for (const { icon: Icon, conditions } of Object.values(iconMap)) {
    if (conditions(fileType, fileName)) {
      return <Icon className="size-4 opacity-60" />
    }
  }

  return <FileIcon className="size-4 opacity-60" />
}

const getYouTubeVideoId = (url) => {
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

const extractVideoTitle = (url) => {
  const urlObj = new URL(url)
  const title = urlObj.searchParams.get("title")
  if (title) return title
  else {
    const videoId = getYouTubeVideoId(url)
    return videoId ? `Video ${videoId}` : "YouTube Video"
  }
}

function YouTubeDialog({ onOpenChange, onSubmit, videoName, onVideoNameChange, youtubeUrl, onYoutubeUrlChange }) {
  const handleSubmit = () => {
    if (youtubeUrl.trim()) {
      onSubmit()
    }
  }

  return (
    <DialogContent className="sm:max-w-md p-4" showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Add YouTube Video</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="video-name">Video Name <span className="text-muted-foreground">(Optional)</span></Label>
          <Input
            id="video-name"
            placeholder="Enter custom video name"
            value={videoName}
            onChange={(e) => onVideoNameChange(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="youtube-url">YouTube URL</Label>
          <Input
            id="youtube-url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => onYoutubeUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit()
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit}><Plus /> Add</Button>
        </DialogFooter>
      </div>
    </DialogContent>
  )
}

const getFilePreview = (
  file,
  onClick
) => {
  const fileType = file.file instanceof File ? file.file.type : file.file.type
  const fileName = file.file instanceof File ? file.file.name : file.file.name

  const renderImage = (src) => (
    <img
      src={src || "/placeholder.svg"}
      alt={fileName}
      className="size-full rounded-t-[inherit] object-cover cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    />
  )

  const renderYouTubeVideo = (url) => {
    const videoId = getYouTubeVideoId(url)
    if (!videoId) {
      return <YouTubeIcon className="size-4" />
    }

    return (
      <div
        className="size-full cursor-pointer group transition-opacity relative bg-black flex items-center justify-center"
        onClick={onClick}
      >
        <img
          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
          alt={fileName}
          className="size-full object-cover group-hover:opacity-75"
        />
        <div className="absolute inset-0 shrink-0 flex items-center justify-center">
          <YouTubeIcon className="size-10 text-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-accent flex aspect-square items-center justify-center overflow-hidden">
      {fileType === "video/youtube" ? (
        file.file instanceof File ? (
          <YouTubeIcon className="size-4 opacity-60" />
        ) : file.file.url ? (
          renderYouTubeVideo(file.file.url)
        ) : (
          <YouTubeIcon className="size-4 opacity-60" />
        )
      ) : fileType.startsWith("image/") ? (
        file.file instanceof File ? (
          (() => {
            const previewUrl = URL.createObjectURL(file.file)
            return renderImage(previewUrl)
          })()
        ) : file.file.url ? (
          renderImage(file.file.url)
        ) : (
          <ImageIcon className="size-4 opacity-60" />
        )
      ) : (
        <div className="cursor-pointer" onClick={onClick}>
          {getFileIcon(file)}
        </div>
      )}
    </div>
  )
}

export default function ImageVideoUpload({ initialFiles, onFileChange, disabled }) {
  const maxSizeMB = 3
  const maxSize = maxSizeMB * 1024 * 1024
  const maxFiles = 10
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [videoName, setVideoName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
      addYouTubeVideo,
      loadFromJSON,
    },
  ] = useFileUpload({
    multiple: true,
    maxFiles,
    maxSize,
    accept: "image/*",
    onFileChange: onFileChange,
  })

  const handleYouTubeSubmit = () => {
    if (youtubeUrl.trim()) {
      const finalName = videoName.trim() || extractVideoTitle(youtubeUrl.trim())
      addYouTubeVideo(youtubeUrl.trim(), finalName)
      setYoutubeUrl("")
      setVideoName("")
      setIsDialogOpen(false)
    }
  }

  const handlePreviewClick = (file) => {
    setPreviewFile(file)
    setIsPreviewOpen(true)
  }

  useEffect(() => {
    loadFromJSON(initialFiles || [])
  }, [initialFiles, loadFromJSON])

  return (
    <div className="w-full flex flex-col gap-2 overflow-hidden">
      {/* Drop area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={isDragging || undefined}
        data-files={files.length > 0 || undefined}
        className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-48 flex-col items-center rounded-2xl border border-dashed p-4 transition-colors not-data-[files]:justify-center has-[input:focus]:ring-[3px]"
      >
        <input {...getInputProps()} className="sr-only" aria-label="Upload image file" />
        {files.length > 0 ? (
          <div className="flex w-full flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h3 className="truncate text-sm font-medium">
                Files ({files.length}/{maxFiles})
              </h3>
              <div className="flex gap-2 [&>button]:w-[calc(50%-4px)] [&>button]:md:w-fit">
                <Button variant="outline" size="sm" onClick={openFileDialog} disabled={disabled}>
                  <UploadIcon />
                  Add Images
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={disabled}>
                      <YouTubeIcon />
                      Add Video
                    </Button>
                  </DialogTrigger>
                  <YouTubeDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    videoName={videoName}
                    onVideoNameChange={setVideoName}
                    youtubeUrl={youtubeUrl}
                    onYoutubeUrlChange={setYoutubeUrl}
                    onSubmit={handleYouTubeSubmit}
                  />
                </Dialog>
              </div>
            </div>

            {/* Horizontal scrollable container */}
            <div className="w-full flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-accent scrollbar-track-transparent">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-background relative flex flex-col rounded-lg overflow-hidden border w-48 flex-shrink-0"
                >
                  {getFilePreview(file, () => handlePreviewClick(file))}
                  <div className="flex items-center justify-between gap-1 border-t px-3 py-2.5">
                    <div className="flex min-w-0 flex-col gap-2">
                      <p className="truncate text-sm font-medium leading-4">{file.file.name}</p>
                      <p className="text-muted-foreground truncate text-xs leading-3">
                        {file.file instanceof File
                          ? formatBytes(file.file.size)
                          : file.file.type === "video/youtube"
                            ? "YouTube"
                            : formatBytes(file.file.size)}
                      </p>
                    </div>
                    <Button
                      onClick={() => removeFile(file.id)}
                      variant="ghost"
                      size="icon"
                      className="size-6 hover:text-destructive hover:bg-destructive/10"
                      aria-label="Remove file"
                      disabled={disabled}
                    >
                      <XIcon />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
            <div
              className="bg-background mb-2 flex size-10 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <ImageIcon className="size-4 opacity-60" />
            </div>
            <p className="mb-1.5 text-sm font-medium">Drop your images here</p>
            <p className="text-muted-foreground text-xs">
              Max {maxFiles} files ∙ Up to {maxSizeMB}MB ∙ Images only
            </p>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={openFileDialog} disabled={disabled}>
                <UploadIcon />
                Select Images
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={disabled}>
                    <YouTubeIcon />
                    Add Video
                  </Button>
                </DialogTrigger>
                <YouTubeDialog
                  isOpen={isDialogOpen}
                  onOpenChange={setIsDialogOpen}
                  videoName={videoName}
                  onVideoNameChange={setVideoName}
                  youtubeUrl={youtubeUrl}
                  onYoutubeUrlChange={setYoutubeUrl}
                  onSubmit={handleYouTubeSubmit}
                />
              </Dialog>
            </div>
          </div>
        )}
      </div>

      <PreviewDialog
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        file={previewFile}
      />
    </div>
  )
}