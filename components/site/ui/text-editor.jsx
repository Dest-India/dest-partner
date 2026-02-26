"use client"

import { useState, useRef, useEffect } from "react"
import { Editor, EditorState, RichUtils, getDefaultKeyBinding, convertToRaw, ContentState, Modifier } from "draft-js"
import { Bold, Italic, Underline, List, ListOrdered, Quote, Undo, Redo, Heading, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import data from "@emoji-mart/data"
import { init, SearchIndex } from "emoji-mart"
import "draft-js/dist/Draft.css"
import { Badge } from "@/components/ui/badge"

let emojiInitialized = false

export function TextEditor({ value, onChange, useCharacterLimit = false, CharacterLimit = 2048, disabled }) {
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty())
  const [hasMounted, setHasMounted] = useState(false)
  const [showEmojiSuggestions, setShowEmojiSuggestions] = useState(false)
  const [emojiSuggestions, setEmojiSuggestions] = useState([])
  const [selectedEmojiIndex, setSelectedEmojiIndex] = useState(0)
  const [emojiSearchText, setEmojiSearchText] = useState("")
  const [emojiSearchStart, setEmojiSearchStart] = useState(null)
  const [popupPosition, setPopupPosition] = useState({ top: 120, left: 20 })
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const [openInfo, setOpenInfo] = useState(false)
  const editorRef = useRef(null)
  const containerRef = useRef(null)
  const emojiListRef = useRef(null)

  const CHARACTER_LIMIT = useCharacterLimit ? CharacterLimit : null

  useEffect(() => {
    if (!emojiInitialized && typeof window !== "undefined") {
      init({ data, set: "google" })
      emojiInitialized = true
    }
  }, [])

  useEffect(() => {
    if (!hasMounted) return
    let cancelled = false
    if (onChange) {
      import("draftjs-to-html").then(({ default: draftToHtml }) => {
        if (cancelled) return
        const currentContent = editorState.getCurrentContent()
        const rawContentState = convertToRaw(currentContent)
        const htmlContent = draftToHtml(rawContentState)
        onChange?.(htmlContent)
      })
    }
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorState, onChange])

  useEffect(() => {
    setHasMounted(true)
    if (!value) return
    let cancelled = false
    import("html-to-draftjs").then(({ default: htmlToDraft }) => {
      if (cancelled) return
      const contentBlock = htmlToDraft(value)
      if (contentBlock) {
        const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks)
        setEditorState(EditorState.createWithContent(contentState))
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (showEmojiSuggestions && emojiListRef.current && selectedEmojiIndex >= 0) {
      const selectedElement = emojiListRef.current.children[selectedEmojiIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        })
      }
    }
  }, [selectedEmojiIndex, showEmojiSuggestions])

  const searchEmojis = async (query) => {
    if (!query || query.length < 1) {
      setEmojiSuggestions([])
      return
    }

    try {
      const results = await SearchIndex.search(query, { set: "google" })
      setEmojiSuggestions(results.slice(0, 16)) // Limit to 16 suggestions
      setSelectedEmojiIndex(0)
    } catch (error) {
      console.error(error)
      setEmojiSuggestions([])
    }
  }

  const calculatePopupPosition = () => {
    if (!containerRef.current || !editorRef.current) return { top: 120, left: 20 }

    const containerRect = containerRef.current.getBoundingClientRect()
    const selection = window.getSelection()

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      // Calculate position relative to container
      const relativeTop = rect.bottom - containerRect.top + 5
      const relativeLeft = rect.left - containerRect.left

      // Check if there's enough space on the right (300px for popup width)
      const spaceOnRight = containerRect.width - relativeLeft
      const popupWidth = 300

      let finalLeft = relativeLeft
      let finalTop = relativeTop

      // If not enough space on right, position to the left of cursor
      if (spaceOnRight < popupWidth) {
        finalLeft = Math.max(10, relativeLeft - popupWidth)
      }

      // If cursor is near bottom, show popup above cursor
      const spaceBelow = containerRect.height - relativeTop
      if (spaceBelow < 200) {
        finalTop = Math.max(10, relativeTop - 200)
      }

      return { top: finalTop, left: finalLeft }
    }

    return { top: 120, left: 20 }
  }

  const handleKeyCommand = (command, edState) => {
    if (showEmojiSuggestions) {
      if (command === "split-block") {
        // Enter key
        if (emojiSuggestions[selectedEmojiIndex]) {
          insertEmoji(emojiSuggestions[selectedEmojiIndex])
          return "handled"
        }
      }
    }

    if (command === "toggle-header-three") {
      setEditorState(RichUtils.toggleBlockType(edState, "header-three"))
      return "handled"
    }
    const newState = RichUtils.handleKeyCommand(edState, command)
    if (newState) {
      setEditorState(newState)
      return "handled"
    }
    return "not-handled"
  }

  const mapKeyToEditorCommand = (e) => {
    // Handle emoji picker navigation (desktop only)
    if (showEmojiSuggestions && typeof window !== "undefined" && window.innerWidth >= 768) {
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedEmojiIndex((prev) => (prev > 0 ? prev - 1 : emojiSuggestions.length - 1))
        return null
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedEmojiIndex((prev) => (prev < emojiSuggestions.length - 1 ? prev + 1 : 0))
        return null
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setShowEmojiSuggestions(false)
        setEmojiSearchText("")
        setEmojiSearchStart(null)
        setIsPopupVisible(false)
        return null
      }
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === "h" || e.key === "H")) {
      if (e.preventDefault) e.preventDefault()
      return "toggle-header-three"
    }

    if (e.keyCode === 9 /* TAB */) {
      const newEditorState = RichUtils.onTab(e, editorState, 4 /* maxDepth */)
      if (newEditorState !== editorState) setEditorState(newEditorState)
      return
    }
    return getDefaultKeyBinding(e)
  }

  const handleEditorChange = (newEditorState) => {
    const currentContent = newEditorState.getCurrentContent()
    const currentLength = currentContent.getPlainText("").length

    if (!useCharacterLimit || currentLength <= CHARACTER_LIMIT) {
      setEditorState(newEditorState)

      // Check for emoji trigger (desktop only)
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        const selection = newEditorState.getSelection()
        const blockKey = selection.getStartKey()
        const block = currentContent.getBlockForKey(blockKey)
        const blockText = block.getText()
        const cursorPosition = selection.getStartOffset()

        // Look for : followed by text
        const textBeforeCursor = blockText.substring(0, cursorPosition)
        const colonMatch = textBeforeCursor.match(/:([a-zA-Z0-9_+-]*)$/)

        if (colonMatch) {
          const searchText = colonMatch[1]
          const colonPosition = cursorPosition - searchText.length - 1

          if (searchText.length >= 1) {
            setEmojiSearchText(searchText)
            setEmojiSearchStart(colonPosition)
            if (!showEmojiSuggestions) {
              setTimeout(() => {
                const position = calculatePopupPosition()
                setPopupPosition(position)
                setShowEmojiSuggestions(true)
                setIsPopupVisible(true)
              }, 0)
            }
            searchEmojis(searchText)
          } else if (searchText.length === 0) {
            setIsPopupVisible(false)
            setTimeout(() => setShowEmojiSuggestions(false), 150)
            setEmojiSuggestions([])
          }
        } else {
          setIsPopupVisible(false)
          setTimeout(() => setShowEmojiSuggestions(false), 150)
          setEmojiSearchText("")
          setEmojiSearchStart(null)
        }
      }
    }
  }

  const toggleInlineStyle = (inlineStyle) => setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle))

  const toggleBlockType = (blockType) => setEditorState(RichUtils.toggleBlockType(editorState, blockType))

  const handleUndo = () => setEditorState(EditorState.undo(editorState))

  const handleRedo = () => setEditorState(EditorState.redo(editorState))

  const focusEditor = () => editorRef.current?.focus()

  const selection = editorState.getSelection()
  const blockType = editorState.getCurrentContent().getBlockForKey(selection.getStartKey()).getType()
  const currentStyle = editorState.getCurrentInlineStyle()
  const currentLength = editorState.getCurrentContent().getPlainText("").length
  const isNearLimit = useCharacterLimit && CHARACTER_LIMIT ? currentLength > CHARACTER_LIMIT * 0.8 : false

  const getBlockStyle = (block) => {
    switch (block.getType()) {
      case "header-three":
        return "editor-heading"
      case "underline":
        return "underline underline-offset-4"
      default:
        return null
    }
  }

  const insertEmoji = (emoji) => {
    const contentState = editorState.getCurrentContent()
    const selection = editorState.getSelection()
    const emojiText = emoji.skins[0].native

    if (emojiSearchStart !== null) {
      const newContentState = Modifier.replaceText(
        contentState,
        selection.merge({
          anchorOffset: emojiSearchStart,
          focusOffset: selection.getStartOffset(),
        }),
        emojiText,
      )
      setEditorState(EditorState.push(editorState, newContentState, "insert-characters"))
      setIsPopupVisible(false)
      setTimeout(() => {
        setShowEmojiSuggestions(false)
        setEmojiSearchText("")
        setEmojiSearchStart(null)
      }, 150)
    }
  }

  return (
    <div ref={containerRef} className="w-full grid border rounded-lg overflow-visible relative">
      <div className="flex flex-col md:flex-row md:justify-between gap-2 p-2 md:py-1 border-b">
        <div className="flex md:items-center flex-col md:flex-row gap-2 [&>div>button]:size-7 [&>div>button]:rounded-sm">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleUndo} disabled={editorState.getUndoStack().size === 0 || disabled}>
                  <Undo />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleRedo} disabled={editorState.getRedoStack().size === 0 || disabled}>
                  <Redo />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="data-[orientation=vertical]:h-6 mx-0.5" />

            {/* H3 Heading */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={blockType === "header-three" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => toggleBlockType("header-three")}
                  disabled={disabled}
                >
                  <Heading />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Heading</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="data-[orientation=vertical]:h-6 mx-0.5" />

            {/* Inline Styles */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentStyle.has("BOLD") ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => toggleInlineStyle("BOLD")}
                  disabled={disabled}
                >
                  <Bold />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentStyle.has("ITALIC") ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => toggleInlineStyle("ITALIC")}
                  disabled={disabled}
                >
                  <Italic />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentStyle.has("UNDERLINE") ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => toggleInlineStyle("UNDERLINE")}
                  disabled={disabled}
                >
                  <Underline />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Underline</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="hidden md:block data-[orientation=vertical]:h-6 mx-0.5" />

          <div className="flex items-center gap-1">
            {/* Block Types */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={blockType === "unordered-list-item" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => toggleBlockType("unordered-list-item")}
                  disabled={disabled}
                >
                  <List />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Unordered List</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={blockType === "ordered-list-item" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => toggleBlockType("ordered-list-item")}
                  disabled={disabled}
                >
                  <ListOrdered />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ordered List</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={blockType === "blockquote" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => toggleBlockType("blockquote")}
                  disabled={disabled}
                >
                  <Quote />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Blockquote</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="data-[orientation=vertical]:h-6 mx-0.5" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setOpenInfo(true)}>
                  <Info />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Info</TooltipContent>
            </Tooltip>
          </div>

          <Dialog open={openInfo} onOpenChange={setOpenInfo}>
            <InfoDialog isCharLimit={useCharacterLimit} CharLimit={CHARACTER_LIMIT} />
          </Dialog>
        </div>

        {/* Character Counter */}
        {useCharacterLimit && CHARACTER_LIMIT && (
          <p className="h-7 min-w-32 flex items-center gap-4 px-1.5 [&>span]:text-xs">
            {<span className={isNearLimit ? "text-orange-500" : "text-muted-foreground"}>Characters : {currentLength} / {CHARACTER_LIMIT}</span>}
            {currentLength >= CHARACTER_LIMIT && <span className="text-red-500 font-medium">Character limit reached</span>}
          </p>
        )}
      </div>

      {/* Editor */}
      <div className={`min-h-48 max-h-96 overflow-y-auto p-4 cursor-text ${disabled ? "opacity-60" : ""}`} onClick={focusEditor}>
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={handleEditorChange}
          handleKeyCommand={handleKeyCommand}
          keyBindingFn={mapKeyToEditorCommand}
          blockStyleFn={getBlockStyle}
          placeholder="Write here ..."
          spellCheck={true}
          readOnly={disabled}
          data-gramm="false"
        />
      </div>

      {showEmojiSuggestions && emojiSuggestions.length > 0 && (
        <div
          className={`absolute z-100 bg-background border rounded-lg shadow-xl w-72 overflow-hidden transition-all duration-150 ease-out ${isPopupVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1"
            }`}
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
            transformOrigin: "top left",
          }}
        >
          <div ref={emojiListRef} className="max-h-52 flex flex-col overflow-y-auto gap-0.5 py-1 snap-y scroll-smooth">
            {emojiSuggestions.map((emoji, index) => (
              <Button
                key={emoji.id}
                type="button"
                variant="ghost"
                size="sm"
                className={`w-[calc(100%-0.5rem)] gap-3 mx-1 snap-start scroll-my-1 justify-start transition-colors ${index === selectedEmojiIndex ? "bg-accent" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertEmoji(emoji)
                }}
                onMouseEnter={() => setSelectedEmojiIndex(index)}
              >
                <span>{emoji.skins[0].native}</span>
                <span className="truncate">{emoji.name}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoDialog({ isCharLimit, CharLimit }) {
  return (
    <DialogContent className="sm:max-w-xl overflow-hidden p-0 gap-0" showCloseButton={false}>
      <DialogHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-4">
          <DialogTitle>Text Editor Information</DialogTitle>
          <div className="flex items-center gap-1.5">
            <p className="text-sm text-muted-foreground">Created by</p>
            <a className="group" href="https://x.com/intent/user?screen_name=01_kartic" target="_blank">
              <Badge variant="outline" className="p-1 rounded-full gap-0 group-hover:bg-muted [&>span]:font-medium [&>span]:px-1.5 [&>span]:text-sm">
                <img className="size-5 rounded-full" src="https://pbs.twimg.com/profile_images/1970431893985284099/6aZazCUD_400x400.jpg" alt="Kartik" />
                <span>Kartic</span>
              </Badge>
            </a>
          </div>
        </div>
        <DialogDescription className="fixed top-0" />
      </DialogHeader>
      <div className="grid gap-10 px-4 max-h-[62vh] md:max-h-[72vh] overflow-y-auto">
        {/* Editor Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground px-1">Editor Controls</h4>
          <div className="grid gap-3 text-sm [&>div]:flex [&>div]:flex-col md:[&>div]:flex-row [&>div]:justify-between md:[&>div]:items-center [&>div]:gap-2 [&>div]:bg-muted md:[&>div]:pl-4 [&>div]:p-3 [&>div]:rounded-md">
            <div className="[&>p>span]:text-muted-foreground [&>p>span]:ml-1">
              <p><strong>Undo</strong> <span>Undo last action</span></p>
              <div className="flex items-center gap-1.5 [&>span]:font-mono [&>span]:py-1 [&>span]:rounded [&>span]:bg-background [&>span]:text-foreground [&>span]:gap-2">
                <Badge>Click <Undo /></Badge>
                <div className="text-muted-foreground">or</div>
                <Badge>Ctrl/Cmd + Z</Badge>
              </div>
            </div>
            <div className="[&>p>span]:text-muted-foreground [&>p>span]:ml-1">
              <p><strong>Redo</strong> <span>Redo last undone action</span></p>
              <div className="flex items-center gap-1.5 [&>span]:font-mono [&>span]:py-1 [&>span]:rounded [&>span]:bg-background [&>span]:text-foreground [&>span]:gap-2">
                <Badge>Click <Redo /></Badge>
                <div className="text-muted-foreground">or</div>
                <Badge>Ctrl/Cmd + Y</Badge>
              </div>
            </div>
            {isCharLimit && CharLimit && (
              <div className="[&>p>span]:text-muted-foreground [&>p>span]:ml-1">
                <p><strong>Character Limit</strong></p>
                <p className="text-xs mr-2">
                  <span>{CharLimit ? `${CharLimit} characters max` : "No character limit"}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Basic Formatting */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground px-1">Formatting</h4>
          <div className="grid gap-3 text-sm [&>div]:flex [&>div]:flex-col md:[&>div]:flex-row [&>div]:justify-between md:[&>div]:items-center [&>div]:gap-2 [&>div]:bg-muted md:[&>div]:pl-4 [&>div]:p-3 [&>div]:rounded-md">
            <div className="[&>p>span]:text-muted-foreground [&>p>span]:ml-1">
              <p><strong>Bold</strong> <span> Make text bold</span></p>
              <div className="flex items-center gap-1.5 [&>span]:font-mono [&>span]:py-1 [&>span]:rounded [&>span]:bg-background [&>span]:text-foreground [&>span]:gap-2">
                <Badge>Click <Bold /></Badge>
                <div className="text-muted-foreground">or</div>
                <Badge>Ctrl/Cmd + B</Badge>
              </div>
            </div>
            <div className="[&>p>span]:text-muted-foreground [&>p>span]:ml-1">
              <p><em>Italic</em> <span>Make text italic</span></p>
              <div className="flex items-center gap-1.5 [&>span]:font-mono [&>span]:py-1 [&>span]:rounded [&>span]:bg-background [&>span]:text-foreground [&>span]:gap-2">
                <Badge>Click <Italic /></Badge>
                <div className="text-muted-foreground">or</div>
                <Badge>Ctrl/Cmd + I</Badge>
              </div>
            </div>
            <div className="[&>p>span]:text-muted-foreground [&>p>span]:ml-1">
              <p><u>Underline</u> <span>Underline text</span></p>
              <div className="flex items-center gap-1.5 [&>span]:font-mono [&>span]:py-1 [&>span]:rounded [&>span]:bg-background [&>span]:text-foreground [&>span]:gap-2">
                <Badge>Click <Underline /></Badge>
                <div className="text-muted-foreground">or</div>
                <Badge>Ctrl/Cmd + U</Badge>
              </div>
            </div>
            <div className="[&>p>span]:text-muted-foreground [&>p>span]:ml-1">
              <p><strong>Heading</strong> <span>Create H3 headings</span></p>
              <div className="flex items-center gap-1.5 [&>span]:font-mono [&>span]:py-1 [&>span]:rounded [&>span]:bg-background [&>span]:text-foreground [&>span]:gap-2">
                <Badge>Click <Heading /></Badge>
                <div className="text-muted-foreground">or</div>
                <Badge>Ctrl/Cmd + H</Badge>
              </div>
            </div>
            <div className="[&>p>span]:text-muted-foreground [&>p>span]:ml-1 [&>span]:font-mono [&>span]:py-1 [&>span]:rounded [&>span]:bg-background [&>span]:text-foreground [&>span]:gap-2">
              <p>• <strong>Bullet List</strong> <span>Unordered list</span></p>
              <Badge>Click <List /></Badge>
            </div>
            <div className="[&>p>span]:text-muted-foreground [&>p>span]:ml-1 [&>span]:font-mono [&>span]:py-1 [&>span]:rounded [&>span]:bg-background [&>span]:text-foreground [&>span]:gap-2">
              <p>1. <strong>Numbered List</strong> <span>Ordered list</span></p>
              <Badge>Click <ListOrdered /></Badge>
            </div>
            <div className="[&>p>span]:text-muted-foreground [&>p>span]:ml-1 [&>span]:font-mono [&>span]:py-1 [&>span]:rounded [&>span]:bg-background [&>span]:text-foreground [&>span]:gap-2">
              <p><strong>Blockquote</strong> <span>Quote text</span></p>
              <Badge>Click <Quote /></Badge>
            </div>
          </div>
        </div>

        {/* Emoji Feature */}
        <div className="space-y-3 hidden md:grid">
          <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground px-1">🎉 Emoji Feature [Desktop Only]</h4>
          <div className="px-5 p-4 text-sm bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-100 dark:border-sky-800">
            <h4 className="text-base font-semibold mb-2">How to Use Emojis :</h4>
            <ol className="list-decimal list-inside space-y-2 [&>li>span]:bg-background [&>li>span]:rounded-sm">
              <li>
                Type <Badge variant="outline">:</Badge> followed by a word for example, <Badge variant="outline">:smile</Badge>
              </li>
              <li>A popup will appear with matching emoji suggestions.</li>
              <li>Use <Badge className="px-[5px]" variant="outline">↑</Badge>{" "}
                <Badge className="px-[5px]" variant="outline">↓</Badge> arrow keys to navigate and Press <Badge variant="outline">Enter</Badge> to select.</li>
              <li>or You select manualy with mouse.</li>
              <li>Press <Badge variant="outline">Esc</Badge> to close suggestions.</li>
            </ol>
          </div>
        </div>
      </div>
      <DialogFooter className="p-4">
        <DialogClose asChild>
          <Button type="submit" size="sm">Got It !</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}