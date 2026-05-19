"use client"

import { useEffect, useRef, useState } from "react"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
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

/**
 * Rich-text editor for the vehicle "Description" field. Same toolbar as the
 * day-rich-editor but with an "Insert template" button that pastes a starter
 * outline for rental listings. Saves HTML.
 */

const RENTAL_TEMPLATE_HTML = `
<h2>Available Services</h2>
<ul>
  <li>Self drive rental</li>
  <li>Vehicle with driver</li>
  <li>Short term rental</li>
  <li>Long term rental</li>
  <li>Available for foreigners and locals</li>
</ul>
<h2>Rental Information</h2>
<ul>
  <li><strong>Daily rental price:</strong> [add price]</li>
  <li><strong>Refundable deposit:</strong> [add deposit amount]</li>
  <li><strong>Minimum rental period:</strong> [add minimum days]</li>
</ul>
<h2>Requirements</h2>
<ul>
  <li>Valid passport or NIC</li>
  <li>Valid driving license / international driving permit</li>
  <li>Advance payment required before vehicle handover</li>
</ul>
<h2>Security &amp; Safety</h2>
<ul>
  <li>GPS location tracking may be enabled for vehicle security and customer safety.</li>
  <li>Customer location and trip details may be monitored during the rental period if tracking is enabled.</li>
</ul>
<h2>Payment Process</h2>
<ul>
  <li>Booking confirmation required before reservation.</li>
  <li>Initial payment required to reserve the vehicle.</li>
  <li>Remaining balance should be paid according to the rental agreement.</li>
  <li>Refundable deposit will be returned after vehicle inspection.</li>
</ul>
<h2>Rental Conditions</h2>
<ul>
  <li>Customer is responsible for traffic fines and damages during the rental period.</li>
  <li>Vehicle should be returned on the agreed date and time.</li>
  <li>Illegal activities and unsafe driving are strictly prohibited.</li>
  <li><strong>Fuel policy:</strong> [add fuel policy]</li>
</ul>
<h2>Why Choose Us</h2>
<ul>
  <li>Well maintained vehicles</li>
  <li>Reliable and trusted service</li>
  <li>Flexible rental options</li>
  <li>Customer support available</li>
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

      <Divider />

      <button
        type="button"
        onClick={onInsertTemplate}
        title="Insert rental template"
        className="inline-flex h-7 items-center gap-1 rounded-md bg-zinc-100 px-2 text-[10px] font-semibold text-zinc-700 transition hover:bg-zinc-950 hover:text-white"
      >
        <Sparkles className="size-3" />
        Insert template
      </button>
    </div>
  )
}

export function VehicleDescriptionEditor({
  value,
  onChange,
  placeholder = "Describe the vehicle, rental terms, and what makes your service stand out. Use the template button to start from a structured outline.",
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
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "tiptap bio-content min-h-[200px] w-full max-w-none rounded-xl bg-white p-3 text-sm ring-1 ring-zinc-200/70 focus:outline-none",
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
      .setContent(RENTAL_TEMPLATE_HTML, { emitUpdate: true })
      .run()
    setConfirmReplace(false)
  }

  if (!editor) {
    return (
      <div className="grid h-32 place-items-center rounded-xl bg-white ring-1 ring-zinc-200/70">
        <div className="size-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      <Toolbar editor={editor} onInsertTemplate={insertTemplate} />
      {confirmReplace && (
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
          Replace existing description with the template? Press &quot;Insert
          template&quot; again to confirm, or keep editing to cancel.
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}
