"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"
import { DialogClose } from "@radix-ui/react-dialog"
import { useState, useEffect } from "react"

const getYouTubeVideoId = (url) => {
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

const getMediaDimensions = (file, fileType) => {
  return new Promise((resolve) => {
    if (fileType === "video/youtube") {
      // Default to 16:9 for YouTube videos
      resolve({ width: 1920, height: 1080 })
      return
    }

    if (fileType.startsWith("image/")) {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => {
        resolve({ width: 16, height: 9 }) // Default fallback
      }
      img.src = file instanceof File ? URL.createObjectURL(file) : (file.url || "/placeholder.svg")
    } else {
      resolve({ width: 16, height: 9 }) // Default fallback
    }
  })
}

const calculateDialogSize = (mediaWidth, mediaHeight) => {
  const aspectRatio = mediaWidth / mediaHeight
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const headerHeight = 48
  const dialogPadding = 16
  const contentGap = -8
  const mediaBorder = 4
  const reservedHeight = headerHeight + dialogPadding + contentGap + mediaBorder
  const availableWidth = viewportWidth * 0.9 - 16 - mediaBorder
  const availableHeight = viewportHeight * 0.9 - reservedHeight
  
  let mediaWidth_calc, mediaHeight_calc, dialogWidth, dialogHeight

  if (aspectRatio > 1.5) {
    mediaWidth_calc = Math.min(availableWidth, availableHeight * aspectRatio)
    mediaHeight_calc = mediaWidth_calc / aspectRatio
  } else {
    mediaHeight_calc = Math.min(availableHeight, availableWidth / aspectRatio)
    mediaWidth_calc = mediaHeight_calc * aspectRatio
  }

  dialogWidth = mediaWidth_calc + 16 + mediaBorder
  dialogHeight = mediaHeight_calc + reservedHeight

  dialogWidth = Math.max(dialogWidth, 320)
  dialogHeight = Math.max(dialogHeight, 240)

  return { 
    width: Math.ceil(dialogWidth), 
    height: Math.ceil(dialogHeight),
    mediaWidth: Math.floor(mediaWidth_calc),
    mediaHeight: Math.floor(mediaHeight_calc)
  }
}

export function PreviewDialog({ isOpen, onOpenChange, file }) {
  const [dimensions, setDimensions] = useState({ 
    width: 1080, 
    height: 720, 
    mediaWidth: 1064, 
    mediaHeight: 672 
  })

  useEffect(() => {
    if (!file || !isOpen) return

    const fileType = file.file instanceof File ? file.file.type : file.file.type
    
    getMediaDimensions(file.file, fileType).then((mediaDimensions) => {
      const dialogSize = calculateDialogSize(mediaDimensions.width, mediaDimensions.height)
      setDimensions(dialogSize)
    })
  }, [file, isOpen])

  if (!file) return null

  const fileType = file.file instanceof File ? file.file.type : file.file.type
  const fileName = file.file instanceof File ? file.file.name : file.file.name

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-2 rounded-2xl -gap-2 overflow-hidden" 
        showCloseButton={false}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          maxWidth: '95vw',
          maxHeight: '95vh'
        }}
      >
        <DialogHeader>
          <div className="w-full flex justify-between items-center gap-2 p-2 [&>h2]:w-full [&>h2]:text-ellipsis [&>h2]:line-clamp-1">
            <DialogTitle>{fileName}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="size-6 flex-shrink-0">
                <XIcon />
              </Button>
            </DialogClose>
          </div>
          <DialogDescription />
        </DialogHeader>
        <div className="flex items-center justify-center flex-1 min-h-0">
          {fileType === "video/youtube" ? (
            (() => {
              const videoId = getYouTubeVideoId(file.file.url || "")
              return videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                  title={fileName}
                  style={{
                    width: `${dimensions.mediaWidth - 3}px`,
                    height: `${dimensions.mediaHeight}px`
                  }}
                  className="border rounded-md"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-8">Invalid YouTube URL</div>
              )
            })()
          ) : fileType.startsWith("image/") ? (
            <img
              src={
                file.file instanceof File
                  ? URL.createObjectURL(file.file)
                  : file.file.url || `https://placehold.co/${dimensions.mediaWidth}x${dimensions.mediaHeight}`
              }
              alt={fileName}
              style={{
                width: `${dimensions.mediaWidth}px`,
                height: `${dimensions.mediaHeight - 1}px`
              }}
              className="object-contain border rounded-md"
            />
          ) : (
            <div className="text-center p-8">Preview not available</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}