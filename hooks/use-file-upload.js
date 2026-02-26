"use client"

import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"

export const useFileUpload = (options) => {
  const {
    maxFiles = Number.POSITIVE_INFINITY,
    maxSize = Number.POSITIVE_INFINITY,
    accept = "*",
    multiple = false,
    initialFiles = [],
    onFileChange, // This should be called onFileChange to match the component
  } = options

  const [state, setState] = useState({
    files: initialFiles.map((file) => ({
      file,
      id: file.id,
      preview: file.url || file.data,
    })),
    isDragging: false,
    errors: [],
  })

  const inputRef = useRef(null)

  // Helper function to convert internal file format to external format
  const convertToExternalFormat = useCallback((internalFiles) => {
    return internalFiles.map((fileObj) => {
      const file = fileObj.file
      
      if (file.type === "video/youtube") {
        return {
          id: file.id,
          type: "video",
          name: file.name,
          data: file.url
        }
      } else if (file instanceof File) {
        // For newly uploaded files, we need to convert to base64
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => {
            resolve({
              type: "image",
              name: file.name,
              data: reader.result
            })
          }
          reader.readAsDataURL(file)
        })
      } else {
        // For existing files that are already in the correct format
        return {
          type: file.type.startsWith('image/') ? "image" : "video",
          name: file.name,
          data: file.url
        }
      }
    })
  }, [])

  // Function to trigger the external callback with converted data
  const triggerExternalCallback = useCallback(async (internalFiles) => {
    if (!onFileChange) return

    const convertedFiles = convertToExternalFormat(internalFiles)
    
    // Handle promises for File objects
    const resolvedFiles = await Promise.all(
      convertedFiles.map(async (fileOrPromise) => {
        if (fileOrPromise instanceof Promise) {
          return await fileOrPromise
        }
        return fileOrPromise
      })
    )

    onFileChange(resolvedFiles)
  }, [onFileChange, convertToExternalFormat])

  const validateFile = useCallback(
    (file) => {
      if (file instanceof File) {
        if (file.size > maxSize) {
          return `File "${file.name}" exceeds the maximum size of ${formatBytes(maxSize)}.`
        }
      } else {
        if (file.size > maxSize) {
          return `File "${file.name}" exceeds the maximum size of ${formatBytes(maxSize)}.`
        }
      }

      if (accept !== "*") {
        const acceptedTypes = accept.split(",").map((type) => type.trim())
        const fileType = file instanceof File ? file.type || "" : file.type
        const fileExtension = `.${file instanceof File ? file.name.split(".").pop() : file.name.split(".").pop()}`

        const isAccepted = acceptedTypes.some((type) => {
          if (type.startsWith(".")) {
            return fileExtension.toLowerCase() === type.toLowerCase()
          }
          if (type.endsWith("/*")) {
            const baseType = type.split("/")[0]
            return fileType.startsWith(`${baseType}/`)
          }
          return fileType === type
        })

        if (!isAccepted) {
          return (`Only ${accept.replace("/*", "") + "s"} are accepted.`)
        }
      }

      return null
    },
    [accept, maxSize],
  )

  const createPreview = useCallback((file) => {
    if (file instanceof File) {
      return URL.createObjectURL(file)
    }
    return file.url || file.data
  }, [])

  const generateUniqueId = useCallback((file) => {
    if (file instanceof File) {
      return `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    }
    return file.id
  }, [])

  const clearFiles = useCallback(() => {
    setState((prev) => {
      // Clean up object URLs
      prev.files.forEach((file) => {
        if (file.preview && file.file instanceof File && file.file.type.startsWith("image/")) {
          URL.revokeObjectURL(file.preview)
        }
      })

      if (inputRef.current) {
        inputRef.current.value = ""
      }

      const newState = {
        ...prev,
        files: [],
        errors: [],
      }

      triggerExternalCallback([])
      return newState
    })
  }, [triggerExternalCallback])

  const addFiles = useCallback(
    (newFiles) => {
      if (!newFiles || newFiles.length === 0) return

      const newFilesArray = Array.from(newFiles)
      const errors = []

      // Clear existing errors when new files are uploaded
      setState((prev) => ({ ...prev, errors: [] }))

      // In single file mode, clear existing files first
      if (!multiple) {
        clearFiles()
      }

      // Check if adding these files would exceed maxFiles (only in multiple mode)
      if (multiple && maxFiles !== Number.POSITIVE_INFINITY && state.files.length + newFilesArray.length > maxFiles) {
        const errorMessage = `You can only upload a maximum of ${maxFiles} files.`
        toast.warning(errorMessage)
        errors.push(errorMessage)
        setState((prev) => ({ ...prev, errors }))
        return
      }

      const validFiles = []

      newFilesArray.forEach((file) => {
        // Only check for duplicates if multiple files are allowed
        if (multiple) {
          const isDuplicate = state.files.some(
            (existingFile) => existingFile.file.name === file.name && existingFile.file.size === file.size,
          )

          // Skip duplicate files silently
          if (isDuplicate) {
            return
          }
        }

        // Check file size
        if (file.size > maxSize) {
          const errorMessage = multiple
            ? `Some files exceed the maximum size of ${formatBytes(maxSize)}.`
            : `File exceeds the maximum size of ${formatBytes(maxSize)}.`
          toast.warning(`Maximum file size is ${formatBytes(maxSize)} allowed.`)
          errors.push(errorMessage)
          return
        }

        const error = validateFile(file)
        if (error) {
          toast.warning(error)
          errors.push(error)
        } else {
          validFiles.push({
            file,
            id: generateUniqueId(file),
            preview: createPreview(file),
          })
        }
      })

      // Only update state if we have valid files to add
      if (validFiles.length > 0) {
        setState((prev) => {
          const newFiles = !multiple ? validFiles : [...prev.files, ...validFiles]
          
          // Trigger external callback with converted data
          triggerExternalCallback(newFiles)
          
          return {
            ...prev,
            files: newFiles,
            errors,
          }
        })
      } else if (errors.length > 0) {
        setState((prev) => ({
          ...prev,
          errors,
        }))
      }

      // Reset input value after handling files
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    },
    [
      state.files,
      maxFiles,
      multiple,
      maxSize,
      validateFile,
      createPreview,
      generateUniqueId,
      clearFiles,
      triggerExternalCallback,
    ],
  )

  const removeFile = useCallback(
    (id) => {
      setState((prev) => {
        const fileToRemove = prev.files.find((file) => file.id === id)
        if (
          fileToRemove &&
          fileToRemove.preview &&
          fileToRemove.file instanceof File &&
          fileToRemove.file.type.startsWith("image/")
        ) {
          URL.revokeObjectURL(fileToRemove.preview)
        }

        const newFiles = prev.files.filter((file) => file.id !== id)
        triggerExternalCallback(newFiles)

        return {
          ...prev,
          files: newFiles,
          errors: [],
        }
      })
    },
    [triggerExternalCallback],
  )

  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errors: [],
    }))
  }, [])

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setState((prev) => ({ ...prev, isDragging: true }))
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.currentTarget.contains(e.relatedTarget)) {
      return
    }

    setState((prev) => ({ ...prev, isDragging: false }))
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setState((prev) => ({ ...prev, isDragging: false }))

      // Don't process files if the input is disabled
      if (inputRef.current?.disabled) {
        return
      }

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        // In single file mode, only use the first file
        if (!multiple) {
          const file = e.dataTransfer.files[0]
          addFiles([file])
        } else {
          addFiles(e.dataTransfer.files)
        }
      }
    },
    [addFiles, multiple],
  )

  const handleFileChange = useCallback(
    (e) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files)
      }
    },
    [addFiles],
  )

  const openFileDialog = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click()
    }
  }, [])

  const addYouTubeVideo = useCallback(
    (url, name) => {
      const videoId = `youtube-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const finalName = name || `YouTube Video`

      const youtubeFile = {
        name: finalName,
        size: 0,
        type: "video/youtube",
        url: url,
        id: videoId,
      }

      const newFile = {
        file: youtubeFile,
        id: videoId,
        preview: url,
      }

      setState((prev) => {
        // Check if adding this video would exceed maxFiles
        if (maxFiles !== Number.POSITIVE_INFINITY && prev.files.length >= maxFiles) {
          const errorMessage = `You can only upload a maximum of ${maxFiles} files.`
          toast.warning(errorMessage)
          return {
            ...prev,
            errors: [errorMessage],
          }
        }

        const newFiles = multiple ? [...prev.files, newFile] : [newFile]
        triggerExternalCallback(newFiles)

        return {
          ...prev,
          files: newFiles,
          errors: [],
        }
      })
    },
    [maxFiles, multiple, triggerExternalCallback],
  )

  const loadFromJSON = useCallback(
    (jsonData) => {
      const newFiles = []

      jsonData.forEach((item, index) => {
        const fileId = item.id || `json-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`

        if (item.type === "video") {
          const youtubeFile = {
            name: item.name,
            size: 0,
            type: "video/youtube",
            url: item.data,
            id: fileId,
          }

          newFiles.push({
            file: youtubeFile,
            id: fileId,
            preview: item.data,
          })
        } else if (item.type === "image") {
          let fileSize = 0;
          if (item.data && item.data.startsWith('data:')) {
            const base64String = item.data.split(',')[1];
            const paddingLength = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
            const actualLength = base64String.length - paddingLength;
            fileSize = Math.floor((actualLength * 3) / 4);
          } else if (item.size) {
            fileSize = item.size;
          }

          const imageFile = {
            name: item.name,
            size: fileSize,
            type: item.data.startsWith('data:') ? item.data.split(';')[0].split(':')[1] : 'image/jpeg',
            url: item.data,
            id: fileId,
          }

          newFiles.push({
            file: imageFile,
            id: fileId,
            preview: item.data,
          })
        }
      })

      setState((prev) => {
        // Clear existing files and add new ones
        const finalFiles = newFiles.slice(0, maxFiles)
        
        // Don't trigger external callback here as this is loading initial data
        // triggerExternalCallback(finalFiles)

        return {
          ...prev,
          files: finalFiles,
          errors: newFiles.length > maxFiles ? [`Only first ${maxFiles} files were loaded.`] : [],
        }
      })
    },
    [maxFiles],
  )

  const getInputProps = useCallback(
    (props = {}) => {
      return {
        ...props,
        type: "file",
        onChange: handleFileChange,
        accept: props.accept || accept,
        multiple: props.multiple !== undefined ? props.multiple : multiple,
        ref: inputRef,
      }
    },
    [accept, multiple, handleFileChange],
  )

  return [
    state,
    {
      addFiles,
      removeFile,
      clearFiles,
      clearErrors,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleFileChange,
      openFileDialog,
      addYouTubeVideo,
      loadFromJSON,
      getInputProps,
    },
  ]
}

// Helper function to format bytes to human-readable format
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i]
}