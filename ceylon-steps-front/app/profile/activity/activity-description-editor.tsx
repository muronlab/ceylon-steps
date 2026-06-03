"use client"

import { useEffect, useRef, useState } from "react"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { Color, TextStyle } from "@tiptap/extension-text-style"
import {
  Bold,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

/** Text-colour palette for the description. `null` clears the colour. */
const TEXT_COLOURS: { value: string | null; label: string }[] = [
  { value: null, label: "Default" },
  { value: "#2563eb", label: "Blue" },
  { value: "#059669", label: "Green" },
  { value: "#d97706", label: "Amber" },
  { value: "#e11d48", label: "Red" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#0891b2", label: "Teal" },
]

/**
 * Rich-text editor for the activity provider "Description" field. Mirrors the
 * transport VehicleDescriptionEditor (same toolbar + behaviour, saves HTML) so
 * the editing experience is consistent across the partner dashboard. The
 * "Insert template" button pastes an activity-listing starter outline.
 */

const ACTIVITY_TEMPLATE_HTML = `
<h2>About this experience</h2>
<p>Tell travellers what makes your activity special — where it happens, how long it lasts, and what they'll remember most.</p>
<h2>What's included</h2>
<ul>
  <li>Equipment and safety gear</li>
  <li>Experienced, certified instructors</li>
  <li>Briefing and basic training</li>
  <li>Refreshments after the activity</li>
</ul>
<h2>What to bring</h2>
<ul>
  <li>Clothes you don't mind getting wet</li>
  <li>A change of dry clothes and a towel</li>
  <li>Sunscreen and a water bottle</li>
</ul>
<h2>Good to know</h2>
<ul>
  <li><strong>Best season:</strong> [add months]</li>
  <li><strong>Minimum age:</strong> [add age]</li>
  <li><strong>Group size:</strong> [add range]</li>
  <li><strong>Meeting point:</strong> [add location]</li>
</ul>
<h2>Why book with us</h2>
<ul>
  <li>Safety-first, well-maintained equipment</li>
  <li>Friendly local team who know the area</li>
  <li>Flexible timings for groups and families</li>
</ul>
`.trim()

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

function Toolbar({
  editor,
  onInsertTemplate,
}: {
  editor: Editor
  onInsertTemplate: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200/70 bg-white p-1.5">
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

      <Divider />

      {/* Text colour */}
      <div className="flex items-center gap-1">
        {TEXT_COLOURS.map((c) =>
          c.value === null ? (
            <button
              key="default"
              type="button"
              onClick={() => editor.chain().focus().unsetColor().run()}
              title="Default colour"
              aria-label="Default colour"
              className="grid size-5 place-items-center rounded-full text-[10px] font-bold text-zinc-700 ring-1 ring-zinc-300 transition hover:bg-zinc-100"
            >
              A
            </button>
          ) : (
            <button
              key={c.value}
              type="button"
              onClick={() => editor.chain().focus().setColor(c.value!).run()}
              title={`${c.label} text`}
              aria-label={`${c.label} text`}
              aria-pressed={editor.isActive("textStyle", { color: c.value })}
              style={{ backgroundColor: c.value }}
              className={cn(
                "size-5 rounded-full ring-1 ring-black/10 transition hover:scale-110",
                editor.isActive("textStyle", { color: c.value }) &&
                  "ring-2 ring-zinc-900 ring-offset-1",
              )}
            />
          ),
        )}
      </div>

      <Divider />

      <button
        type="button"
        onClick={onInsertTemplate}
        title="Insert activity template"
        className="inline-flex h-7 items-center gap-1 rounded-md bg-zinc-100 px-2 text-[10px] font-semibold text-zinc-700 transition hover:bg-zinc-950 hover:text-white"
      >
        <Sparkles className="size-3" />
        Insert template
      </button>
    </div>
  )
}

export function ActivityDescriptionEditor({
  value,
  onChange,
  placeholder = "Describe your activity, what's included, and what makes it memorable. Use the template button to start from a structured outline.",
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const lastEmittedRef = useRef<string>(value || "")
  const [confirmReplace, setConfirmReplace] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      TextStyle,
      Color,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "tiptap bio-content min-h-[220px] w-full max-w-none bg-white p-4 text-sm focus:outline-none",
      },
    },
    onUpdate({ editor }) {
      const html = editor.isEmpty ? "" : editor.getHTML()
      lastEmittedRef.current = html
      onChange(html)
    },
    immediatelyRender: false,
  })

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

  function insertTemplate() {
    if (!editor) return
    if (!editor.isEmpty && !confirmReplace) {
      setConfirmReplace(true)
      return
    }
    editor
      .chain()
      .focus()
      .setContent(ACTIVITY_TEMPLATE_HTML, { emitUpdate: true })
      .run()
    setConfirmReplace(false)
  }

  if (!editor) {
    return (
      <div className="grid h-32 place-items-center rounded-xl bg-white ring-1 ring-zinc-200/70">
        <div className="size-5 animate-spin rounded-full border-2 border-zinc-200/70 border-t-primary-2 border-r-primary-2/30" />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-zinc-200/70 transition focus-within:ring-zinc-300">
      <Toolbar editor={editor} onInsertTemplate={insertTemplate} />
      {confirmReplace && (
        <div className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Replace existing description with the template? Press &quot;Insert
          template&quot; again to confirm, or keep editing to cancel.
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}
