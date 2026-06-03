"use client"

import { useEffect, useRef } from "react"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  IndentDecrease,
  IndentIncrease,
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Small rich-text editor for itinerary day descriptions. Supports headings,
 * paragraphs, bullet + numbered lists with nesting (Tab / Shift+Tab), and
 * basic bold/italic marks. Saves HTML.
 */
function ToolButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={!!active}
      className={cn(
        "grid size-7 place-items-center rounded-md text-zinc-700 transition",
        "hover:bg-zinc-100 hover:text-zinc-950",
        "disabled:cursor-not-allowed disabled:opacity-50",
        active && "bg-zinc-950 text-white hover:bg-zinc-950 hover:text-white",
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span aria-hidden className="mx-0.5 h-4 w-px bg-zinc-200" />
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-xl bg-white p-1 ring-1 ring-zinc-200/70">
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading"
      >
        <span className="text-[10px] font-bold">H2</span>
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Sub-heading"
      >
        <span className="text-[10px] font-bold">H3</span>
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        active={editor.isActive("paragraph")}
        title="Paragraph"
      >
        <span className="text-[10px] font-semibold">¶</span>
      </ToolButton>

      <Divider />

      <ToolButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold (⌘B)"
      >
        <Bold className="size-3" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic (⌘I)"
      >
        <Italic className="size-3" />
      </ToolButton>

      <Divider />

      <ToolButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bulleted list"
      >
        <List className="size-3" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered className="size-3" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
        disabled={!editor.can().sinkListItem("listItem")}
        title="Nest list item (Tab)"
      >
        <IndentIncrease className="size-3" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().liftListItem("listItem").run()}
        disabled={!editor.can().liftListItem("listItem")}
        title="Lift list item (Shift+Tab)"
      >
        <IndentDecrease className="size-3" />
      </ToolButton>
    </div>
  )
}

export function DayRichEditor({
  value,
  onChange,
  placeholder = "What happens on this day? Use lists for sights, sub-lists for details.",
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  // Last HTML we emitted from this editor. Used to detect whether an incoming
  // `value` change is just our own round-trip (parent echoing what we sent)
  // vs. a genuine external reset. Echoes are ignored so we don't overwrite
  // the editor mid-typing — that was eating saves before.
  const lastEmittedRef = useRef<string>(value || "")

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "tiptap bio-content min-h-[120px] w-full max-w-none rounded-xl bg-white p-3 text-sm ring-1 ring-zinc-200/70 focus:outline-none",
      },
    },
    onUpdate({ editor }) {
      const html = editor.isEmpty ? "" : editor.getHTML()
      lastEmittedRef.current = html
      onChange(html)
    },
    immediatelyRender: false,
  })

  // Sync external value changes into the editor (e.g. switching itineraries
  // and re-hydrating). If the incoming value matches what we last emitted, it
  // is just the parent echoing our own update — leave the editor alone.
  useEffect(() => {
    if (!editor) return
    if (value === lastEmittedRef.current) return
    const current = editor.isEmpty ? "" : editor.getHTML()
    if (value === current) return
    lastEmittedRef.current = value || ""
    editor.commands.setContent(value || "", { emitUpdate: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  useEffect(() => {
    return () => {
      editor?.destroy()
    }
  }, [editor])

  if (!editor) {
    return (
      <div className="grid h-24 place-items-center rounded-xl bg-white ring-1 ring-zinc-200/70">
        <div className="size-5 animate-spin rounded-full border-2 border-zinc-200/70 border-t-primary-2 border-r-primary-2/30" />
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
