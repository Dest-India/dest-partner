"use client"

import { CircleUserRoundIcon, XIcon } from "lucide-react"
import { useEffect } from "react"

import { useFileUpload } from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

export default function PickupProfileImage({ value, onChange, disabled }) {
  const [{ files }, { removeFile, openFileDialog, getInputProps }] =
    useFileUpload({
      accept: "image/*",
      maxFiles: 1,
      maxSize: 3 * 1024 * 1024, // 3MB
    })

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  useEffect(() => {
    const handleFileChange = async () => {
      if (files[0]) {
        const base64 = await convertFileToBase64(files[0].file)
        onChange?.(base64)
      } else if (files.length === 0 && !value) {
        // Only call onChange(null) if there's no external value and no files
        onChange?.(null)
      }
    }
    handleFileChange()
  }, [files, onChange, value])

  const previewUrl = value || files[0]?.preview || null

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="relative size-18 overflow-hidden p-0 rounded-lg shadow-none"
              onClick={openFileDialog}
              aria-label={previewUrl ? "Change image" : "Upload image"}
              disabled={disabled}
            >
              <Avatar className="size-18 rounded-none">
                <AvatarImage src={previewUrl} alt="Profile Picture" />
                <AvatarFallback className="bg-transparent">
                  <CircleUserRoundIcon className="size-7 stroke-[1.25px] opacity-60" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {files[0] ? "Click to Change Profile Picture" : "Click to Upload Profile Picture"}
          </TooltipContent>
        </Tooltip>
        {previewUrl && (
          <Button
            onClick={() => {
              removeFile(files[0]?.id)
              onChange?.(null) // Clear the external value as well
            }}
            size="icon"
            variant="destructive"
            className="border-background focus-visible:border-background absolute -top-2 -right-2.5 size-6 border-2 shadow-none"
            aria-label="Remove image"
            disabled={disabled}
          >
            <XIcon className="size-3.5" />
          </Button>
        )}
        <input
          {...getInputProps()}
          className="sr-only"
          aria-label="Upload image file"
          tabIndex={-1} />
      </div>
    </div>
  );
}
